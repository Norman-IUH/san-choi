alter table public.assignments
  add column classroom_id uuid,
  add column attempt_cap smallint not null default 1 check (attempt_cap between 1 and 20),
  add constraint assignments_owned_classroom foreign key (owner_id,classroom_id) references public.classrooms(owner_id,id),
  add constraint assignments_id_owner unique (id,owner_id);
create index assignments_classroom on public.assignments(owner_id,classroom_id,created_at desc) where classroom_id is not null;

create table public.assignment_students (
  assignment_id uuid not null,
  student_id uuid not null,
  owner_id uuid not null,
  primary key (assignment_id,student_id),
  foreign key (assignment_id,owner_id) references public.assignments(id,owner_id) on delete cascade,
  foreign key (owner_id,student_id) references public.students(owner_id,id) on delete cascade
);
create index assignment_students_learner on public.assignment_students(owner_id,student_id);
alter table public.assignment_students enable row level security;
revoke all on public.assignment_students from public, anon, authenticated;
grant select on public.assignment_students to authenticated;
grant select,insert on public.assignment_students to service_role;
create policy assignment_students_owner on public.assignment_students for select to authenticated using ((select auth.uid())=owner_id);

alter table public.attempts add column student_id uuid references public.students(id) on delete cascade, add column student_code_version uuid,
  add constraint classroom_attempt_identity check ((student_id is null)=(student_code_version is null)),
  add constraint classroom_attempt_recipient foreign key (assignment_id,student_id)
    references public.assignment_students(assignment_id,student_id) on delete cascade;
create index attempts_student on public.attempts(student_id,assignment_id,started_at desc) where student_id is not null;

create function public.assign_classroom(p_owner uuid, p_class uuid, p_students uuid[], p_cap integer, p_snapshot jsonb)
returns uuid language plpgsql security invoker set search_path = '' as $$
declare
  assigned uuid;
  roster uuid[];
begin
  perform 1 from public.classrooms where id=p_class and owner_id=p_owner and archived_at is null for share;
  if not found then return null; end if;
  select array_agg(member.student_id) into roster from (
    select m.student_id from public.classroom_members m
    join public.students s on s.id=m.student_id and s.owner_id=m.owner_id
    where m.owner_id=p_owner and m.classroom_id=p_class and m.removed_at is null and s.archived_at is null
      and (p_students is null or m.student_id=any(p_students))
    for share of m,s
  ) member;
  if roster is null or (p_students is not null and cardinality(roster)<>cardinality(p_students)) then return null; end if;
  insert into public.assignments(owner_id,classroom_id,attempt_cap,activity_id,title,template,content,deadline,require_name,
    show_score,show_review,lesson_id,lesson_step,assessment)
  values(p_owner,p_class,p_cap,(p_snapshot->>'activity_id')::uuid,p_snapshot->>'title',p_snapshot->>'template',
    p_snapshot->'content',(p_snapshot->>'deadline')::timestamptz,false,(p_snapshot->>'show_score')::boolean,
    (p_snapshot->>'show_review')::boolean,(p_snapshot->>'lesson_id')::uuid,(p_snapshot->>'lesson_step')::uuid,
    p_snapshot->'assessment') returning id into assigned;
  insert into public.assignment_students(assignment_id,student_id,owner_id)
    select assigned,student_id,p_owner from unnest(roster) as student_id;
  return assigned;
end;
$$;

create function private.protect_classroom_attempt() returns trigger
language plpgsql security invoker set search_path = '' as $$
declare
  room uuid;
begin
  select classroom_id into room from public.assignments where id=new.assignment_id;
  if room is null and new.student_id is null then return new; end if;
  if room is null or new.student_id is null or not exists (
    select 1 from public.students s join public.classrooms c on c.id=room and c.owner_id=s.owner_id
    where s.id=new.student_id and s.archived_at is null and c.archived_at is null
      and s.code_hash is not null and s.code_version=new.student_code_version
    for share of s,c
  ) then raise exception 'classroom identity required' using errcode='23514'; end if;
  return new;
end;
$$;
revoke all on function private.protect_classroom_attempt() from public, anon, authenticated;
create trigger protect_classroom_attempt before insert or update of completed_at on public.attempts
  for each row execute function private.protect_classroom_attempt();

create function public.open_classroom_attempt(p_assignment uuid, p_code_hash text, p_token uuid, p_resume boolean)
returns table(attempt_id uuid, already_completed boolean, issue text)
language plpgsql security invoker set search_path = '' as $$
declare
  learner public.students%rowtype;
  prior public.attempts%rowtype;
  max_tries integer;
  new_id uuid;
begin
  select a.attempt_cap into max_tries from public.assignments a join public.classrooms c on c.id=a.classroom_id
    where a.id=p_assignment and not a.closed and c.archived_at is null
      and (a.deadline is null or a.deadline>clock_timestamp()) for share of a,c;
  if not found then return query select null::uuid,false,'closed'; return; end if;
  select s.* into learner from public.students s join public.assignment_students r on r.student_id=s.id and r.owner_id=s.owner_id
    where r.assignment_id=p_assignment and s.code_hash=p_code_hash and s.archived_at is null for update of s;
  if not found then return query select null::uuid,false,'code'; return; end if;
  if p_resume and p_token is not null then
    select * into prior from public.attempts where id=p_token and assignment_id=p_assignment
      and student_id=learner.id and student_code_version=learner.code_version;
    if found then return query select prior.id,prior.completed_at is not null,null::text; return; end if;
  end if;
  select id into new_id from public.attempts where assignment_id=p_assignment and student_id=learner.id
    and student_code_version=learner.code_version and completed_at is null order by started_at desc limit 1;
  if found then return query select new_id,false,null::text; return; end if;
  if (select count(*) from public.attempts where assignment_id=p_assignment and student_id=learner.id
      and completed_at is not null)>=max_tries then
    return query select null::uuid,false,'tries'; return;
  end if;
  new_id := gen_random_uuid();
  insert into public.attempts(id,assignment_id,nickname,student_id,student_code_version)
    values(new_id,p_assignment,'Học sinh',learner.id,learner.code_version);
  return query select new_id,false,null::text;
end;
$$;
revoke all on function public.assign_classroom(uuid,uuid,uuid[],integer,jsonb),
  public.open_classroom_attempt(uuid,text,uuid,boolean) from public, anon, authenticated;
grant execute on function public.assign_classroom(uuid,uuid,uuid[],integer,jsonb),
  public.open_classroom_attempt(uuid,text,uuid,boolean) to service_role;

create function public.valid_classroom_attempt(p_assignment uuid, p_token uuid)
returns boolean language sql security invoker set search_path = '' as $$
  select exists(
    select 1 from public.attempts t join public.students s on s.id=t.student_id
    join public.assignments a on a.id=t.assignment_id join public.classrooms c on c.id=a.classroom_id
    where t.id=p_token and t.assignment_id=p_assignment and s.archived_at is null and c.archived_at is null
      and s.code_hash is not null and s.code_version=t.student_code_version
  );
$$;
revoke all on function public.valid_classroom_attempt(uuid,uuid) from public, anon, authenticated;
grant execute on function public.valid_classroom_attempt(uuid,uuid) to service_role;

alter table private.attempt_rate_limits drop constraint attempt_rate_limits_operation_check;
alter table private.attempt_rate_limits add constraint attempt_rate_limits_operation_check
  check (operation in ('start','finish','media','student-code'));
create or replace function public.consume_attempt_limit(p_operation text, p_scope text)
returns boolean language sql security invoker set search_path = '' as $$
  with bucket as (
    insert into private.attempt_rate_limits as current_bucket(operation,scope,window_start,hits)
    values (p_operation,p_scope,date_trunc('minute',clock_timestamp()),1)
    on conflict (operation,scope) do update set
      window_start=greatest(current_bucket.window_start,excluded.window_start),
      hits=case when excluded.window_start>current_bucket.window_start then 1 else current_bucket.hits+1 end
    where excluded.window_start>current_bucket.window_start
       or current_bucket.hits < case p_operation when 'student-code' then 60 when 'start' then 180 when 'media' then 30 else 240 end
    returning 1
  ) select exists (select 1 from bucket);
$$;
