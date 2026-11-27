alter table public.vocabulary_entries add column archived_at timestamptz;
alter table public.activities add constraint practice_activities_private
  check (visibility = 'private' or not jsonb_path_exists(content, '$[*].practice'));
