create table public.vocabulary_entries (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references public.workspaces on delete cascade,
  schema_version smallint not null default 1 check (schema_version = 1),
  word text not null check (length(trim(word)) between 1 and 100),
  meaning text not null check (length(trim(meaning)) between 1 and 240),
  word_key text generated always as (lower(trim(word))) stored,
  meaning_key text generated always as (lower(trim(meaning))) stored,
  level text not null check (level in ('Kids', 'Pre A1 Starters', 'A1 Movers', 'A2 Flyers')),
  topic text not null check (length(trim(topic)) between 1 and 80),
  part text not null default '' check (length(part) <= 40),
  ipa text not null default '' check (length(ipa) <= 100),
  example text not null default '' check (length(example) <= 400),
  related text not null default '' check (length(related) <= 240),
  image text,
  uk text,
  us text,
  unique (owner_id, level, word_key, meaning_key),
  check (image is null or image ~ ('^' || owner_id::text || '/[0-9a-f-]{36}\.(png|jpg|webp)$')
    or image ~ '^/illustrations/puzzles/(classroom|book|pencil|bag)\.webp$'),
  check (uk is null or uk ~ ('^' || owner_id::text || '/[0-9a-f-]{36}\.(mp3|wav|ogg)$')
    or uk ~ '^/audio/vocabulary/[a-z]+-uk\.wav$'),
  check (us is null or us ~ ('^' || owner_id::text || '/[0-9a-f-]{36}\.(mp3|wav|ogg)$')
    or us ~ '^/audio/vocabulary/[a-z]+-us\.wav$')
);

create table public.vocabulary_lessons (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references public.workspaces on delete cascade,
  schema_version smallint not null default 1 check (schema_version = 1),
  title text not null check (length(trim(title)) between 1 and 100),
  level text not null check (level in ('Kids', 'Pre A1 Starters', 'A1 Movers', 'A2 Flyers')),
  skill text not null check (skill in ('Vocabulary','Phonics','Listening','Speaking','Reading','Writing','Grammar')),
  topic text not null check (length(trim(topic)) between 1 and 80),
  unit text not null check (length(trim(unit)) between 1 and 80),
  difficulty text not null check (difficulty in ('gentle','steady','challenge')),
  entry_keys text[] not null check (cardinality(entry_keys) between 1 and 60 and array_position(entry_keys, null) is null),
  unique (owner_id, id)
);

alter table public.activities add column vocabulary_lesson_id uuid,
  add constraint activities_vocabulary_lesson_fk foreign key (owner_id, vocabulary_lesson_id)
  references public.vocabulary_lessons (owner_id, id) on delete set null (vocabulary_lesson_id);
create index activities_vocabulary_lesson on public.activities (owner_id, vocabulary_lesson_id) where vocabulary_lesson_id is not null;
grant insert(vocabulary_lesson_id) on public.activities to authenticated;

alter table public.vocabulary_entries enable row level security;
alter table public.vocabulary_lessons enable row level security;
revoke all on public.vocabulary_entries, public.vocabulary_lessons from public, anon, authenticated;
grant select, insert, update on public.vocabulary_entries, public.vocabulary_lessons to authenticated;

create policy teacher_vocabulary_entries on public.vocabulary_entries for all to authenticated
using (owner_id = (select auth.uid()) and (select role from public.profiles where id = (select auth.uid())) = 'teacher')
with check (owner_id = (select auth.uid()) and (select role from public.profiles where id = (select auth.uid())) = 'teacher');
create policy teacher_vocabulary_lessons on public.vocabulary_lessons for all to authenticated
using (owner_id = (select auth.uid()) and (select role from public.profiles where id = (select auth.uid())) = 'teacher')
with check (owner_id = (select auth.uid()) and (select role from public.profiles where id = (select auth.uid())) = 'teacher');
