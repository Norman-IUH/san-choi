alter table public.vocabulary_lessons add column plan jsonb;
alter table public.vocabulary_lessons drop constraint vocabulary_lessons_entry_keys_check,
  add constraint vocabulary_lessons_entry_keys_check check (
    cardinality(entry_keys) between (case when plan is null then 1 else 0 end) and 60
    and array_position(entry_keys, null) is null
  );

create function private.check_lesson_plan() returns trigger
language plpgsql security invoker set search_path = '' as $$
declare step jsonb;
begin
  if new.plan is null then return new; end if;
  if jsonb_typeof(new.plan) is distinct from 'object' or new.plan->>'version' is distinct from '1'
    or jsonb_typeof(new.plan->'steps') is distinct from 'array' then
    raise exception 'invalid lesson plan' using errcode = '23514';
  end if;
  if jsonb_array_length(new.plan->'steps') > 30 then
    raise exception 'too many lesson steps' using errcode = '23514';
  end if;
  for step in select value from jsonb_array_elements(new.plan->'steps') loop
    if step->>'kind' = 'activity' then
      if not exists (select 1 from public.activities a
        where a.owner_id = new.owner_id and a.id = (step->>'source')::uuid and a.deleted_at is null) then
        raise exception 'lesson activity outside owner workspace' using errcode = '23503';
      end if;
    elsif step->>'kind' is distinct from 'sample' then
      raise exception 'invalid lesson step' using errcode = '23514';
    end if;
  end loop;
  return new;
end;
$$;
revoke execute on function private.check_lesson_plan() from public, anon, authenticated;
create trigger validate_vocabulary_lesson_plan before insert or update of plan
  on public.vocabulary_lessons for each row execute function private.check_lesson_plan();

alter table public.assignments add column lesson_id uuid, add column lesson_step uuid,
  add constraint assignments_lesson_step_check check (lesson_id is null or lesson_step is not null),
  add constraint assignments_owner_lesson_fk foreign key (owner_id, lesson_id)
    references public.vocabulary_lessons (owner_id, id) on delete set null (lesson_id);
create index assignments_by_lesson_step on public.assignments (owner_id, lesson_id, lesson_step, created_at desc)
  where lesson_id is not null;
