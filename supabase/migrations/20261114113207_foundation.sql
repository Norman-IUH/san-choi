create table public.profiles (
  id uuid primary key references auth.users on delete cascade,
  display_name text not null default '' check (length(display_name) <= 100),
  role text not null default 'teacher' check (role in ('teacher','student','admin'))
);

create table public.workspaces (
  owner_id uuid primary key references public.profiles on delete cascade,
  created_at timestamptz not null default now()
);

create schema if not exists private;
create function private.provision_account() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles(id) values (new.id);
  insert into public.workspaces(owner_id) values (new.id);
  return new;
end;
$$;
revoke all on function private.provision_account() from public;
create trigger provision_account after insert on auth.users
for each row execute function private.provision_account();

insert into public.profiles(id) select id from auth.users on conflict do nothing;
insert into public.workspaces(owner_id) select id from public.profiles on conflict do nothing;

create table public.folders (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.workspaces on delete cascade default auth.uid(),
  parent_id uuid,
  name text not null check (length(trim(name)) between 1 and 100),
  color text not null default '#7858d9' check (color ~ '^#[0-9a-fA-F]{6}$'),
  unique (owner_id,id),
  foreign key (owner_id,parent_id) references public.folders(owner_id,id) on delete set null (parent_id),
  check (id <> parent_id)
);

create table public.activities (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.workspaces on delete cascade default auth.uid(),
  folder_id uuid,
  title text not null check (length(trim(title)) between 1 and 120),
  description text not null default '' check (length(description) <= 1000),
  subject text not null default '' check (length(subject) <= 80),
  grade text not null default '' check (length(grade) <= 40),
  tags text not null default '' check (length(tags) <= 250),
  template text not null,
  content jsonb not null check (jsonb_typeof(content) = 'array' and jsonb_array_length(content) <= 60 and octet_length(content::text) <= 100000),
  search_text text generated always as (title || ' ' || description || ' ' || subject || ' ' || grade || ' ' || tags || ' ' || template || ' ' || content::text) stored,
  visibility text not null default 'private' check (visibility in ('private','public','unlisted')),
  draft boolean not null default true,
  favorite boolean not null default false,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key (owner_id,folder_id) references public.folders(owner_id,id) on delete set null (folder_id)
);
create index activities_owner_updated on public.activities (owner_id,updated_at desc);
create index activities_public_updated on public.activities (updated_at desc)
where visibility = 'public' and not draft and deleted_at is null;

create table public.activity_versions (
  id bigint generated always as identity primary key,
  activity_id uuid not null references public.activities on delete cascade,
  snapshot jsonb not null,
  created_at timestamptz not null default now()
);
create index versions_activity on public.activity_versions(activity_id,id desc);

create function private.version_activity() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if tg_op = 'INSERT' or (new.title,new.description,new.subject,new.grade,new.tags,new.template,new.content)
      is distinct from (old.title,old.description,old.subject,old.grade,old.tags,old.template,old.content) then
    insert into public.activity_versions(activity_id,snapshot)
    values (new.id, to_jsonb(new) - array['owner_id','folder_id','favorite','draft','visibility','deleted_at']);
  end if;
  return new;
end;
$$;
revoke all on function private.version_activity() from public;
create trigger version_activity after insert or update on public.activities
for each row execute function private.version_activity();

create table public.assignments (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.workspaces on delete cascade default auth.uid(),
  activity_id uuid references public.activities on delete set null,
  title text not null,
  template text not null,
  content jsonb not null,
  deadline timestamptz,
  closed boolean not null default false,
  require_name boolean not null default true,
  show_score boolean not null default true,
  created_at timestamptz not null default now()
);
create index assignments_owner on public.assignments(owner_id,created_at desc);

create table public.attempts (
  id uuid primary key,
  assignment_id uuid not null references public.assignments on delete cascade,
  nickname text not null check (length(nickname) between 1 and 80),
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  score integer check (score is null or score >= 0),
  total integer check (total is null or total >= score),
  answers jsonb,
  constraint completion_consistent check ((completed_at is null) = (answers is null))
);
create index attempts_assignment on public.attempts(assignment_id,completed_at desc);

alter table public.profiles enable row level security;
alter table public.workspaces enable row level security;
alter table public.folders enable row level security;
alter table public.activities enable row level security;
alter table public.activity_versions enable row level security;
alter table public.assignments enable row level security;
alter table public.attempts enable row level security;

revoke all on public.profiles,public.workspaces,public.folders,public.activities,public.activity_versions,public.assignments,public.attempts
from anon, authenticated;
grant select on public.profiles,public.workspaces,public.activity_versions,public.assignments,public.attempts to authenticated;
grant update(display_name) on public.profiles to authenticated;
grant select,delete on public.folders,public.activities to authenticated;
grant insert(parent_id,name,color) on public.folders to authenticated;
grant insert(folder_id,title,description,subject,grade,tags,template,content,visibility,draft,updated_at) on public.activities to authenticated;
grant update(name,color) on public.folders to authenticated;
grant update(folder_id,title,description,subject,grade,tags,template,content,visibility,draft,favorite,deleted_at,updated_at)
on public.activities to authenticated;
grant update(closed,deadline,require_name,show_score) on public.assignments to authenticated;
grant select,insert,update,delete on public.profiles,public.workspaces,public.folders,public.activities,public.activity_versions,public.assignments,public.attempts
to service_role;

create policy own_profile on public.profiles for select to authenticated using ((select auth.uid()) = id);
create policy update_profile on public.profiles for update to authenticated using ((select auth.uid()) = id) with check ((select auth.uid()) = id);
create policy own_workspace on public.workspaces for select to authenticated using ((select auth.uid()) = owner_id);
create policy own_folders on public.folders for all to authenticated
using ((select auth.uid()) = owner_id and (select role from public.profiles where id = (select auth.uid())) = 'teacher')
with check ((select auth.uid()) = owner_id and (select role from public.profiles where id = (select auth.uid())) = 'teacher');
create policy own_activities on public.activities for all to authenticated
using ((select auth.uid()) = owner_id and (select role from public.profiles where id = (select auth.uid())) = 'teacher')
with check ((select auth.uid()) = owner_id and (select role from public.profiles where id = (select auth.uid())) = 'teacher');
create policy own_versions on public.activity_versions for select to authenticated
using (exists (select 1 from public.activities a where a.id = activity_id));
create policy own_assignments on public.assignments for select to authenticated
using ((select auth.uid()) = owner_id and (select role from public.profiles where id = (select auth.uid())) = 'teacher');
create policy update_assignments on public.assignments for update to authenticated
using ((select auth.uid()) = owner_id and (select role from public.profiles where id = (select auth.uid())) = 'teacher')
with check ((select auth.uid()) = owner_id and (select role from public.profiles where id = (select auth.uid())) = 'teacher');
create policy own_attempts on public.attempts for select to authenticated
using (exists (select 1 from public.assignments a where a.id = assignment_id));

create function public.finish_attempt(
  p_assignment uuid, p_attempt uuid, p_answers jsonb, p_score integer, p_total integer
) returns setof public.attempts
language plpgsql security invoker set search_path = '' as $$
declare
  current_assignment public.assignments;
begin
  select * into current_assignment from public.assignments where id = p_assignment for share;
  if not found or current_assignment.closed or current_assignment.deadline <= clock_timestamp() then
    raise exception 'assignment closed';
  end if;
  return query update public.attempts
    set answers = p_answers, score = p_score, total = p_total, completed_at = clock_timestamp()
    where id = p_attempt and assignment_id = p_assignment and completed_at is null returning *;
  if not found then
    return query select * from public.attempts
      where id = p_attempt and assignment_id = p_assignment and completed_at is not null;
  end if;
end;
$$;
revoke all on function public.finish_attempt(uuid,uuid,jsonb,integer,integer) from public,anon,authenticated;
grant execute on function public.finish_attempt(uuid,uuid,jsonb,integer,integer) to service_role;
