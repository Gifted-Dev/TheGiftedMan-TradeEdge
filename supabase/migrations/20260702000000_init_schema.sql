-- Run this once in the Supabase SQL Editor (Project > SQL Editor > New query).

create table if not exists settings (
  user_id uuid primary key references auth.users(id) on delete cascade,
  starting_balance numeric not null default 0,
  risk_percent numeric not null default 5,
  trade_style int not null default 1,
  sessions_per_day int not null default 2,
  broker_min numeric not null default 10,
  milestones jsonb not null default '[]',
  api_keys jsonb not null default '{}',
  setup_complete boolean not null default false,
  created_at timestamptz not null default now(),
  extra jsonb not null default '{}'
);

create table if not exists trades (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  timestamp timestamptz not null,
  pair text,
  direction text,
  zone_type text,
  zone_grade text,
  stake numeric,
  outcome text,
  pnl numeric,
  source text,
  screenshots jsonb not null default '[]',
  notes text,
  session_num int,
  is_analyzed boolean default false,
  extra jsonb not null default '{}'
);
create index if not exists trades_user_id_idx on trades(user_id);

create table if not exists sessions (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  date text not null,
  num int,
  account_mode text,
  start_time timestamptz,
  end_time timestamptz,
  trades int default 0,
  wins int default 0,
  losses int default 0,
  con_loss int default 0,
  con_win int default 0,
  net_loss int default 0,
  session_pnl numeric default 0,
  is_active boolean default true,
  is_locked boolean default false,
  lock_reason text
);
create index if not exists sessions_user_date_idx on sessions(user_id, date);

create table if not exists withdrawals (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  timestamp timestamptz not null,
  date text,
  amount numeric,
  balance_before numeric,
  balance_after numeric,
  notes text
);
create index if not exists withdrawals_user_id_idx on withdrawals(user_id);

create table if not exists zone_analyses (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  timestamp timestamptz not null,
  screenshot text,
  detected_pair text,
  zone_type text,
  grade text,
  verdict text,
  criteria jsonb not null default '{}',
  linked_trade_id text,
  extra jsonb not null default '{}'
);
create index if not exists zone_analyses_user_id_idx on zone_analyses(user_id);

-- Row Level Security: every table only readable/writable by its owner.
alter table settings enable row level security;
alter table trades enable row level security;
alter table sessions enable row level security;
alter table withdrawals enable row level security;
alter table zone_analyses enable row level security;

create policy "own settings" on settings for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own trades" on trades for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own sessions" on sessions for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own withdrawals" on withdrawals for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own zone_analyses" on zone_analyses for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Private storage bucket for chart screenshots. Files live under a per-user
-- folder; the app reads them via short-lived signed URLs, never a public link.
insert into storage.buckets (id, name, public)
  values ('screenshots', 'screenshots', false)
  on conflict (id) do update set public = false;

create policy "own screenshot uploads" on storage.objects for insert
  with check (bucket_id = 'screenshots' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "own screenshot reads" on storage.objects for select
  using (bucket_id = 'screenshots' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "own screenshot deletes" on storage.objects for delete
  using (bucket_id = 'screenshots' and (storage.foldername(name))[1] = auth.uid()::text);
