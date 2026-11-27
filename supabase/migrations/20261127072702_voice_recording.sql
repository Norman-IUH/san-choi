insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('practice-voice', 'practice-voice', false, 2097152, array['audio/webm','audio/ogg','audio/mp4','audio/wav']);

create table public.voice_recordings (
  attempt_id uuid not null references public.attempts on delete cascade,
  item_index integer not null check (item_index between 0 and 11),
  object_path text not null unique,
  sha256 text not null check (sha256 ~ '^[a-f0-9]{64}$'),
  seconds integer not null check (seconds between 1 and 91),
  expires_at timestamptz not null,
  primary key (attempt_id, item_index)
);
create index voice_recordings_expiry on public.voice_recordings(expires_at);
alter table public.voice_recordings enable row level security;
revoke all on public.voice_recordings from public, anon, authenticated;
grant select, insert, delete on public.voice_recordings to service_role;

create function public.attach_voice_clip(p_assignment uuid, p_attempt uuid, p_index integer, p_path text,
  p_sha256 text, p_seconds integer, p_expires timestamptz) returns boolean
language plpgsql security invoker set search_path = '' as $$
declare a public.assignments;
begin
  select * into a from public.assignments where id = p_assignment for share;
  if not found or a.closed or a.deadline <= clock_timestamp() or a.assessment->>'skill' is distinct from 'Speaking'
    or a.content->p_index->'practice'->'production' is null
    or p_index not between 0 and 11
    or p_path !~ ('^' || a.owner_id::text || '/[0-9a-f-]{36}\.(webm|ogg|m4a|wav)$') then
    return false;
  end if;
  perform 1 from public.attempts where id = p_attempt and assignment_id = p_assignment and completed_at is null for update;
  if not found then return false; end if;
  insert into public.voice_recordings(attempt_id,item_index,object_path,sha256,seconds,expires_at)
  values (p_attempt,p_index,p_path,p_sha256,p_seconds,p_expires) on conflict (attempt_id,item_index) do nothing;
  return found;
end;
$$;
revoke all on function public.attach_voice_clip(uuid,uuid,integer,text,text,integer,timestamptz) from public, anon, authenticated;
grant execute on function public.attach_voice_clip(uuid,uuid,integer,text,text,integer,timestamptz) to service_role;
