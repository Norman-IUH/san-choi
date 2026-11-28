create table public.live_rooms (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.workspaces on delete cascade,
  classroom_id uuid,
  lesson_id uuid references public.vocabulary_lessons on delete set null,
  activity_id uuid references public.activities on delete set null,
  code text not null unique check (code ~ '^[A-F0-9]{12}$'),
  guest_topic uuid not null default gen_random_uuid(),
  host_topic uuid not null default gen_random_uuid(),
  title text not null,
  template text not null check (template in ('quiz','gameshow','true-false','image-quiz')),
  items jsonb not null check (jsonb_typeof(items)='array' and jsonb_array_length(items) between 1 and 60),
  pace text not null check (pace in ('teacher','student')),
  phase text not null default 'lobby' check (phase in ('lobby','playing','paused','ended')),
  question integer not null default 0 check (question between 0 and 59),
  leaderboard boolean not null default false,
  teams boolean not null default false,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default (now()+interval '4 hours'),
  foreign key (owner_id,classroom_id) references public.classrooms(owner_id,id)
);
create index live_rooms_owner on public.live_rooms(owner_id,created_at desc);
create index live_rooms_classroom on public.live_rooms(owner_id,classroom_id) where classroom_id is not null;

create table public.live_players (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.live_rooms on delete cascade,
  student_id uuid references public.students on delete cascade,
  code_version uuid,
  token_hash text not null check (token_hash ~ '^[0-9a-f]{64}$'),
  alias text not null check (length(alias) between 1 and 30),
  ready boolean not null default false,
  team smallint not null default 0 check (team between 0 and 2),
  unique(room_id,id), unique(room_id,token_hash), unique(room_id,student_id),
  check ((student_id is null)=(code_version is null))
);
create index live_players_student on public.live_players(student_id) where student_id is not null;

create table public.live_answers (
  room_id uuid not null,
  player_id uuid not null,
  question integer not null check (question between 0 and 59),
  choices smallint[] not null check (cardinality(choices) between 1 and 8),
  correct boolean not null,
  primary key (room_id,player_id,question),
  foreign key (room_id,player_id) references public.live_players(room_id,id) on delete cascade
);

alter table public.live_rooms enable row level security;
alter table public.live_players enable row level security;
alter table public.live_answers enable row level security;
revoke all on public.live_rooms,public.live_players,public.live_answers from public,anon,authenticated;
grant all on public.live_rooms,public.live_players,public.live_answers to service_role;
-- Hosts and guests receive scoped projections through the application server.

create function private.notify_live_room() returns trigger language plpgsql security invoker set search_path='' as $$
declare
  output_topic uuid;
begin
  if tg_table_name='live_rooms' then
    output_topic := new.guest_topic;
    perform realtime.send('{}'::jsonb,'refresh',new.host_topic::text,false);
  else
    select host_topic into output_topic from public.live_rooms where id=new.room_id;
  end if;
  if output_topic is not null then
    perform realtime.send('{}'::jsonb,'refresh',output_topic::text,false);
  end if;
  return new;
end;
$$;
revoke all on function private.notify_live_room() from public,anon,authenticated;
create trigger live_room_signal after update of phase,question,leaderboard on public.live_rooms
  for each row execute function private.notify_live_room();
create trigger live_player_signal after insert or update of ready on public.live_players
  for each row execute function private.notify_live_room();
create trigger live_answer_signal after insert on public.live_answers
  for each row execute function private.notify_live_room();

create function public.live_player_valid(p_room uuid,p_player uuid) returns boolean
language sql stable security invoker set search_path='' as $$
  select exists(
    select 1 from public.live_players p join public.live_rooms r on r.id=p.room_id
    where p.room_id=p_room and p.id=p_player and
      (p.student_id is null or exists (
        select 1 from public.students s join public.classroom_members m on m.student_id=s.id and m.owner_id=s.owner_id
        join public.classrooms c on c.id=m.classroom_id and c.owner_id=m.owner_id
        where s.id=p.student_id and s.owner_id=r.owner_id and s.archived_at is null
          and s.code_hash is not null and s.code_version=p.code_version and m.classroom_id=r.classroom_id
          and c.archived_at is null and m.removed_at is null
      ))
  );
$$;

create function public.join_live_room(p_room uuid,p_hash text,p_code text) returns text
language plpgsql security invoker set search_path='' as $$
declare
  room public.live_rooms%rowtype;
  learner public.students%rowtype;
  players integer;
  existing uuid;
begin
  select * into room from public.live_rooms where id=p_room for update;
  if not found or room.expires_at<=now() or room.phase='ended' then return 'closed'; end if;
  select id into existing from public.live_players where room_id=p_room and token_hash=p_hash;
  if found and public.live_player_valid(p_room,existing) then return 'ok'; end if;
  if room.classroom_id is not null then
    select s.* into learner from public.students s join public.classroom_members m on m.student_id=s.id and m.owner_id=s.owner_id
      join public.classrooms c on c.id=m.classroom_id and c.owner_id=m.owner_id
      where m.classroom_id=room.classroom_id and s.owner_id=room.owner_id and s.code_hash=p_code
        and m.removed_at is null and s.archived_at is null and c.archived_at is null for share of s,m,c;
    if not found then return 'code'; end if;
    update public.live_players set token_hash=p_hash,code_version=learner.code_version
      where room_id=p_room and student_id=learner.id;
    if found then return 'ok'; end if;
  end if;
  if room.phase<>'lobby' then return 'closed'; end if;
  select count(*) into players from public.live_players where room_id=p_room;
  if players>=30 then return 'full'; end if;
  insert into public.live_players(room_id,student_id,code_version,token_hash,alias,team)
    values(p_room,learner.id,learner.code_version,p_hash,'Bạn '||(players+1),
      case when room.teams then (players%2)+1 else 0 end);
  return 'ok';
end;
$$;

create function public.submit_live_answer(p_room uuid,p_hash text,p_question integer,p_choices smallint[],p_correct boolean)
returns text language plpgsql security invoker set search_path='' as $$
declare
  room public.live_rooms%rowtype;
  player public.live_players%rowtype;
  answered integer;
begin
  select * into room from public.live_rooms where id=p_room for share;
  if not found or room.phase<>'playing' or room.expires_at<=now() then return 'paused'; end if;
  select * into player from public.live_players where room_id=p_room and token_hash=p_hash for update;
  if not found or not public.live_player_valid(p_room,player.id) then return 'denied'; end if;
  if exists(select 1 from public.live_answers where room_id=p_room and player_id=player.id and question=p_question) then return 'ok'; end if;
  select count(*) into answered from public.live_answers where room_id=p_room and player_id=player.id;
  if not player.ready or p_question not between 0 and jsonb_array_length(room.items)-1
    or (room.pace='teacher' and room.question<>p_question) or (room.pace='student' and answered<>p_question) then return 'stale'; end if;
  insert into public.live_answers(room_id,player_id,question,choices,correct) values(p_room,player.id,p_question,p_choices,p_correct);
  return 'ok';
end;
$$;

create function public.control_live_room(p_room uuid,p_owner uuid,p_action text,p_question integer) returns boolean
language plpgsql security invoker set search_path='' as $$
declare room public.live_rooms%rowtype;
begin
  select * into room from public.live_rooms where id=p_room and owner_id=p_owner for update;
  if not found or room.expires_at<=now() then return false; end if;
  if p_action='start' and room.phase='lobby' then update public.live_rooms set phase='playing' where id=p_room;
  elsif p_action='pause' and room.phase='playing' then update public.live_rooms set phase='paused' where id=p_room;
  elsif p_action='resume' and room.phase='paused' then update public.live_rooms set phase='playing' where id=p_room;
  elsif p_action='next' and room.phase='playing' and room.pace='teacher' and room.question=p_question
    and room.question+1<jsonb_array_length(room.items) then update public.live_rooms set question=question+1 where id=p_room;
  elsif p_action='end' and room.phase<>'ended' then update public.live_rooms set phase='ended' where id=p_room;
  elsif p_action='ranking' then update public.live_rooms set leaderboard=not leaderboard where id=p_room;
  else return false;
  end if;
  return true;
end;
$$;
revoke all on function public.live_player_valid(uuid,uuid), public.join_live_room(uuid,text,text),
 public.submit_live_answer(uuid,text,integer,smallint[],boolean), public.control_live_room(uuid,uuid,text,integer)
 from public,anon,authenticated;
grant execute on function public.live_player_valid(uuid,uuid), public.join_live_room(uuid,text,text),
 public.submit_live_answer(uuid,text,integer,smallint[],boolean), public.control_live_room(uuid,uuid,text,integer) to service_role;
