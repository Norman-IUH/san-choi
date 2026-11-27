alter table public.assignments add column assessment jsonb,
  add constraint assignments_assessment_version check (assessment is null or (
    jsonb_typeof(assessment) = 'object' and assessment->>'version' = '1' and
    assessment->>'skill' in ('Speaking', 'Writing') and jsonb_typeof(assessment->'rubric') = 'array'
  ) is true);

create table public.manual_reviews (
  attempt_id uuid primary key references public.attempts on delete cascade,
  state text not null default 'pending' check (state in ('pending', 'reviewed', 'published')),
  scores jsonb not null default '[]' check (jsonb_typeof(scores) = 'array'),
  total integer check (total between 0 and 160),
  feedback text not null default '' check (length(feedback) <= 4000),
  reviewer_id uuid references public.profiles on delete set null,
  reviewed_at timestamptz,
  published_at timestamptz,
  revision integer not null default 0 check (revision >= 0),
  check ((state = 'published') = (published_at is not null)),
  check (state <> 'published' or (total is not null and reviewed_at is not null))
);
alter table public.manual_reviews enable row level security;
revoke all on public.manual_reviews from public, anon, authenticated;
grant select on public.manual_reviews to authenticated;
grant select, insert, update on public.manual_reviews to service_role;
create policy owner_manual_reviews on public.manual_reviews for select to authenticated using (
  exists (select 1 from public.attempts where id = attempt_id)
);

create function private.queue_manual_review() returns trigger
language plpgsql security invoker set search_path = '' as $$
begin
  if new.completed_at is not null and exists (
    select 1 from public.assignments a where a.id = new.assignment_id and a.assessment is not null
  ) then
    insert into public.manual_reviews (attempt_id) values (new.id) on conflict (attempt_id) do nothing;
  end if;
  return new;
end;
$$;
revoke all on function private.queue_manual_review() from public, anon, authenticated;
create trigger queue_manual_review after insert or update of completed_at on public.attempts
  for each row execute function private.queue_manual_review();

grant select, update (plan) on public.vocabulary_lessons to service_role;
create function private.require_ready_lesson() returns trigger
language plpgsql security invoker set search_path = '' as $$
declare current_plan jsonb;
begin
  if new.lesson_id is null then return new; end if;
  select plan into current_plan from public.vocabulary_lessons where id = new.lesson_id and owner_id = new.owner_id for share;
  if current_plan->>'draft' is distinct from 'false' then
    raise exception 'lesson draft' using errcode = '23514', constraint = 'assignments_ready_lesson';
  end if;
  return new;
end;
$$;
revoke all on function private.require_ready_lesson() from public, anon, authenticated;
create trigger require_ready_lesson before insert on public.assignments
  for each row execute function private.require_ready_lesson();
