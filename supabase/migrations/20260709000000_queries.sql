-- Chat history for the "Ask" data-query panel. Purely a log for the user's
-- own reference (requirement: never fed back in as a persistent "profile" —
-- each question is answered independently, this table is write-then-display
-- only, never read back into a prompt).
create table if not exists queries (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  timestamp timestamptz not null,
  question text not null,
  answer text not null,
  mode text,
  extra jsonb not null default '{}'
);
create index if not exists queries_user_id_idx on queries(user_id);

alter table queries enable row level security;
create policy "own queries" on queries for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
