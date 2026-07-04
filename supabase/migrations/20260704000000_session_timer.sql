-- Run this once in the Supabase SQL Editor (Project > SQL Editor > New query).
-- Adds a generic extra jsonb column to sessions, matching the pattern already
-- used on trades/zone_analyses, to hold session-timer bookkeeping (lockCode,
-- durationMin, pausedAt, pausedMsTotal) without a schema change per field.

alter table sessions add column if not exists extra jsonb not null default '{}';
