create table public.vocabulary_reviews (
  owner_id uuid not null default auth.uid() references public.workspaces on delete cascade,
  entry_key text not null check (length(entry_key) between 1 and 160),
  state text not null check (state in ('pending', 'changes', 'approved')),
  signature text not null check (signature ~ '^[a-f0-9]{64}$'),
  reviewer_id uuid references public.profiles on delete set null,
  reviewed_at timestamptz,
  note text not null default '' check (length(note) <= 1500),
  primary key (owner_id, entry_key)
);

alter table public.vocabulary_reviews enable row level security;
revoke all on public.vocabulary_reviews from public, anon, authenticated;
grant select, insert, update on public.vocabulary_reviews to authenticated, service_role;
create policy teacher_vocabulary_reviews on public.vocabulary_reviews for all to authenticated
using (owner_id = (select auth.uid()) and (select role from public.profiles where id = (select auth.uid())) = 'teacher')
with check (owner_id = (select auth.uid()) and (select role from public.profiles where id = (select auth.uid())) = 'teacher');

create function private.invalidate_word_review() returns trigger
language plpgsql security invoker set search_path = '' as $$
begin
  if row(old.word, old.meaning, old.level, old.topic, old.part, old.ipa, old.example, old.related, old.image, old.uk, old.us)
    is distinct from row(new.word, new.meaning, new.level, new.topic, new.part, new.ipa, new.example, new.related, new.image, new.uk, new.us) then
    update public.vocabulary_reviews set state = 'pending', reviewed_at = null, reviewer_id = null
      where owner_id = new.owner_id and entry_key = new.id::text;
  end if;
  return new;
end;
$$;
revoke all on function private.invalidate_word_review() from public, anon, authenticated;
create trigger invalidate_word_review after update on public.vocabulary_entries
  for each row execute function private.invalidate_word_review();
