create table private.attempt_rate_limits (
  operation text not null check (operation in ('start', 'finish')),
  scope text not null check (scope ~ '^[0-9a-f]{64}$'),
  window_start timestamptz not null,
  hits integer not null check (hits > 0),
  primary key (operation, scope)
);

alter table private.attempt_rate_limits enable row level security;
grant usage on schema private to service_role;
grant select, insert, update on private.attempt_rate_limits to service_role;

create function public.consume_attempt_limit(p_operation text, p_scope text)
returns boolean
language sql security invoker set search_path = ''
as $$
  with bucket as (
    insert into private.attempt_rate_limits as current_bucket (operation, scope, window_start, hits)
    values (p_operation, p_scope, date_trunc('minute', clock_timestamp()), 1)
    on conflict (operation, scope) do update set
      window_start = greatest(current_bucket.window_start, excluded.window_start),
      hits = case when excluded.window_start > current_bucket.window_start then 1 else current_bucket.hits + 1 end
    where excluded.window_start > current_bucket.window_start
       or current_bucket.hits < case when p_operation = 'start' then 180 else 240 end
    returning 1
  )
  select exists (select 1 from bucket);
$$;

revoke all on function public.consume_attempt_limit(text, text) from public, anon, authenticated;
grant execute on function public.consume_attempt_limit(text, text) to service_role;
