-- Balance adjustments (spec 0009): signed, dated corrections to a mode's
-- balance. Starting balance, trades, and withdrawals are never touched.
create table if not exists balance_adjustments (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  timestamp timestamptz not null,
  date text not null,
  mode text not null check (mode in ('DEMO','REAL')),
  amount numeric not null,
  balance_before numeric,
  balance_after numeric,
  notes text
);
create index if not exists balance_adjustments_user_id_idx on balance_adjustments(user_id);

alter table balance_adjustments enable row level security;
drop policy if exists "own balance_adjustments" on balance_adjustments;
create policy "own balance_adjustments" on balance_adjustments for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
