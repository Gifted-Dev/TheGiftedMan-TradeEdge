-- Custom strategies (Part A). Money Management (Part B) needs no schema
-- change at all — every new field lives in the existing settings.extra /
-- sessions.extra JSONB columns, per this app's own convention.

-- Deviation from the original "id uuid pk" note: the two reserved builtin
-- rows use fixed ids ('zone-sd' / 'trend-pattern') so Zone Analyzer/Journal
-- can reference them directly without a name lookup, and every user gets
-- their OWN copy of both rows (seeded client-side on first load). A single
-- global `id` primary key can't hold the same literal string for more than
-- one user, so the primary key is the (user_id, id) pair instead, with `id`
-- as plain text rather than uuid.
create table if not exists strategies (
  id text not null,
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  description text,
  is_builtin boolean not null default false,
  archived boolean not null default false,
  created_at timestamptz not null default now(),
  primary key (user_id, id)
);
create index if not exists strategies_user_id_idx on strategies(user_id);

alter table strategies enable row level security;
create policy "own strategies" on strategies for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Migrate existing trades off the old extra->>'strategy' ('ZONE'/'TREND')
-- enum onto extra->>'strategyId' referencing the two builtin strategy ids.
-- trades.extra already exists (see init_schema.sql), so this is a data
-- migration only — no new column on trades.
update trades
set extra = (extra - 'strategy') || jsonb_build_object(
  'strategyId',
  case extra->>'strategy'
    when 'TREND' then 'trend-pattern'
    else 'zone-sd' -- covers 'ZONE' and any trade with no strategy tagged yet
  end
)
where extra ? 'strategy' or not (extra ? 'strategyId');
