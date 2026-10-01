# Supabase Configuration and Migrations

## Overview

PostgreSQL schema definitions, migrations, and security policies governing user data and trading sessions.

## Key files

| File | Owns |
|---|---|
| supabase/config.toml | Supabase local environment configuration |
| supabase/migrations/20260702000000_init_schema.sql | Base database tables for settings, trades, and sessions |
| supabase/migrations/20260714000000_strategies.sql | Trading strategy definition schema |

## Commands

```bash
# Start local Supabase containers
npx supabase start

# Generate migration diff
npx supabase db diff -f <migration_name>

# Reset local database
npx supabase db reset
```

## Conventions

- Name migration files with numeric timestamp prefix YYYYMMDDHHMMSS followed by descriptive name.
- Enforce Row Level Security on every table referencing auth users.
- Use cascade delete when referencing auth.users id.
- Write migrations idempotently with conditional clauses like if not exists.

## Gotchas

- Any direct table alteration without a corresponding migration script causes drift across environments.

_Drafted by /audit from the repo, worth a quick human pass. Edit freely: once a line stops matching this draft, later runs treat it as curated and will flag rather than overwrite it._
