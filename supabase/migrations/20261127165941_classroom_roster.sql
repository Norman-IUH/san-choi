create table public.classrooms (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references public.workspaces on delete cascade,
  name text not null check (length(btrim(name)) between 1 and 120),
  level text not null check (level in ('Kids','Starters','Movers','Flyers')),
  schedule text not null default '' check (length(schedule) <= 160),
  course text not null default '' check (length(course) <= 120),
  notes text not null default '' check (length(notes) <= 2000),
  archived_at timestamptz,
  unique (owner_id, id)
);
create table public.students (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references public.workspaces on delete cascade,
  name text not null check (length(btrim(name)) between 1 and 80),
  notes text not null default '' check (length(notes) <= 2000),
  archived_at timestamptz,
  code_hash text unique check (code_hash ~ '^[0-9a-f]{64}$'),
  code_version uuid not null default gen_random_uuid(),
  unique (owner_id, id)
);
create table public.classroom_members (
  owner_id uuid not null default auth.uid(),
  classroom_id uuid not null,
  student_id uuid not null,
  removed_at timestamptz,
  primary key (classroom_id, student_id),
  foreign key (owner_id, classroom_id) references public.classrooms(owner_id,id) on delete cascade,
  foreign key (owner_id, student_id) references public.students(owner_id,id) on delete cascade
);
create index classroom_members_student on public.classroom_members(owner_id,student_id);
create index classroom_members_class on public.classroom_members(owner_id,classroom_id);

alter table public.classrooms enable row level security;
alter table public.students enable row level security;
alter table public.classroom_members enable row level security;
revoke all on public.classrooms, public.students, public.classroom_members from public, anon, authenticated;
grant select, insert on public.classrooms to authenticated;
grant update(name,level,schedule,course,notes,archived_at) on public.classrooms to authenticated;
grant select(id,owner_id,name,notes,archived_at) on public.students to authenticated;
grant insert(owner_id,name,notes), update(name,notes) on public.students to authenticated;
grant select, insert on public.classroom_members to authenticated;
grant update(removed_at) on public.classroom_members to authenticated;
grant all on public.classrooms, public.students, public.classroom_members to service_role;

create policy classroom_owner on public.classrooms for all to authenticated
  using ((select auth.uid()) = owner_id) with check ((select auth.uid()) = owner_id);
create policy student_owner on public.students for all to authenticated
  using ((select auth.uid()) = owner_id) with check ((select auth.uid()) = owner_id);
create policy membership_owner on public.classroom_members for all to authenticated
  using ((select auth.uid()) = owner_id) with check ((select auth.uid()) = owner_id);

create function public.import_classroom_students(p_class uuid, p_names text[])
returns integer language plpgsql security invoker set search_path = '' as $$
declare
  class_owner uuid;
  learner text;
  learner_id uuid;
begin
  if cardinality(p_names) not between 1 and 200 then raise exception 'invalid roster size'; end if;
  select owner_id into strict class_owner from public.classrooms
    where id = p_class and owner_id = auth.uid() and archived_at is null for share;
  foreach learner in array p_names loop
    insert into public.students(owner_id,name) values (class_owner,learner) returning id into learner_id;
    insert into public.classroom_members(owner_id,classroom_id,student_id) values (class_owner,p_class,learner_id);
  end loop;
  return cardinality(p_names);
end;
$$;

create function public.clone_classroom(p_class uuid, p_roster boolean)
returns uuid language plpgsql security invoker set search_path = '' as $$
declare
  cloned uuid;
begin
  insert into public.classrooms(owner_id,name,level,schedule,course,notes)
    select owner_id, left(name,109) || ' (bản sao)', level,schedule,course,notes
    from public.classrooms where id=p_class and owner_id=auth.uid() returning id into strict cloned;
  if p_roster then
    insert into public.classroom_members(owner_id,classroom_id,student_id)
      select m.owner_id,cloned,m.student_id from public.classroom_members m
      join public.students s on s.owner_id=m.owner_id and s.id=m.student_id
      where m.classroom_id=p_class and m.removed_at is null and s.archived_at is null;
  end if;
  return cloned;
end;
$$;

create function public.move_classroom_student(p_student uuid, p_from uuid, p_to uuid)
returns void language plpgsql security invoker set search_path = '' as $$
declare
  class_owner uuid;
begin
  if p_to is null or p_from=p_to then raise exception 'invalid destination'; end if;
  perform 1 from public.students where id=p_student and owner_id=auth.uid() and archived_at is null for share;
  if not found then raise no_data_found; end if;
  select owner_id into strict class_owner from public.classrooms
    where id=p_to and owner_id=auth.uid() and archived_at is null for share;
  if p_from is not null then
    update public.classroom_members set removed_at=clock_timestamp()
    where classroom_id=p_from and student_id=p_student and removed_at is null;
    if not found then raise no_data_found; end if;
  end if;
  insert into public.classroom_members(owner_id,classroom_id,student_id) values (class_owner,p_to,p_student)
    on conflict (classroom_id,student_id) do update set removed_at=null;
end;
$$;
revoke all on function public.import_classroom_students(uuid,text[]), public.clone_classroom(uuid,boolean),
  public.move_classroom_student(uuid,uuid,uuid) from public, anon, authenticated;
grant execute on function public.import_classroom_students(uuid,text[]), public.clone_classroom(uuid,boolean),
  public.move_classroom_student(uuid,uuid,uuid) to authenticated;
