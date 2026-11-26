create table private.hangman_rounds (
  attempt_id uuid not null references public.attempts(id) on delete cascade,
  item_index integer not null check (item_index between 0 and 59),
  guesses text not null check (guesses ~ '^[A-Z]{0,26}$'),
  primary key (attempt_id, item_index)
);
alter table private.hangman_rounds enable row level security;
grant select, insert, update on private.hangman_rounds to service_role;

alter table private.attempt_rate_limits drop constraint attempt_rate_limits_operation_check;
alter table private.attempt_rate_limits add constraint attempt_rate_limits_operation_check
  check (operation in ('start','finish','media'));

create or replace function public.consume_attempt_limit(p_operation text, p_scope text)
returns boolean language sql security invoker set search_path = '' as $$
  with bucket as (
    insert into private.attempt_rate_limits as current_bucket (operation, scope, window_start, hits)
    values (p_operation, p_scope, date_trunc('minute', clock_timestamp()), 1)
    on conflict (operation, scope) do update set
      window_start = greatest(current_bucket.window_start, excluded.window_start),
      hits = case when excluded.window_start > current_bucket.window_start then 1 else current_bucket.hits + 1 end
    where excluded.window_start > current_bucket.window_start
       or current_bucket.hits < case p_operation when 'start' then 180 when 'media' then 30 else 240 end
    returning 1
  ) select exists (select 1 from bucket);
$$;

create function public.hangman_guess(p_assignment uuid, p_attempt uuid, p_index integer, p_letter text)
returns text language plpgsql security invoker set search_path = '' as $$
declare
  word text;
  previous text;
begin
  if p_index is null or p_index not between 0 and 59
     or (p_letter is not null and p_letter !~ '^[A-Z]$') then return null; end if;

  select upper(s.content->p_index->'answers'->>0) into word
  from public.assignments s join public.attempts a on a.assignment_id=s.id
  where s.id=p_assignment and a.id=p_attempt and a.completed_at is null
    and s.template='hangman' and not s.closed and (s.deadline is null or s.deadline > clock_timestamp())
  for update of a for share of s;
  if word is null or word !~ '^[A-Z]{2,12}$' then return null; end if;

  select coalesce((select guesses from private.hangman_rounds where attempt_id=p_attempt and item_index=p_index), '') into previous;
  if p_letter is null or strpos(previous,p_letter)>0 or length(translate(previous,word,''))>=6
    or translate(word,previous,'')='' then return previous; end if;

  insert into private.hangman_rounds(attempt_id,item_index,guesses) values (p_attempt,p_index,previous||p_letter)
  on conflict(attempt_id,item_index) do update set guesses=excluded.guesses;
  return previous||p_letter;
end;
$$;

create function public.hangman_history(p_attempt uuid)
returns table(item_index integer, guesses text) language sql security invoker set search_path = '' as $$
  select item_index, guesses from private.hangman_rounds where attempt_id=p_attempt;
$$;

revoke all on function public.hangman_guess(uuid,uuid,integer,text), public.hangman_history(uuid) from public,anon,authenticated;
grant execute on function public.hangman_guess(uuid,uuid,integer,text), public.hangman_history(uuid) to service_role;
