-- Run this once in the Supabase SQL Editor (Project > SQL Editor > New query).
-- Tracks whether the "gap ended" email has already been sent for a session,
-- so a QStash retry or a duplicate schedule call never sends it twice.

alter table sessions add column if not exists email_notified_at timestamptz;
