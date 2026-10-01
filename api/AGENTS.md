# API Endpoints

## Overview

Serverless functions running on Vercel to schedule and send delayed email notifications when trading session cooldowns end.

## Key files

| File | Owns |
|---|---|
| api/schedule-gap-notification.js | Schedules single delayed webhook call via Upstash QStash |
| api/send-gap-notification.js | Receives webhook, verifies signature, sends email via Resend, and records notification |

## Commands

```bash
# Run local Vercel development server
npx vercel dev
```

## Conventions

- Export CommonJS async handlers matching the Vercel function interface.
- Disable default body parsing on endpoints requiring raw signature checks.
- Keep notification timing calculations on the client and pass duration as gap milliseconds.
- Always check and update notification timestamps in Supabase to maintain idempotent runs.

## Gotchas

- Upstash QStash retries on any non 2xx response, so return 200 even when skipping duplicate notifications.
- Missing environment variables will fail silently if not guarded at the start of each handler.

_Drafted by /audit from the repo, worth a quick human pass. Edit freely: once a line stops matching this draft, later runs treat it as curated and will flag rather than overwrite it._
