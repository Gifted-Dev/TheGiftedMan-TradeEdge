# TheGiftedMan Trading Tool

## Stack

- **Language / Runtime**: JavaScript (ES6+), Node.js
- **Framework**: React 19 (Create React App), Tailwind CSS v3
- **Key dependencies**: @supabase/supabase-js, @upstash/qstash, lucide-react
- **Package manager**: npm

## Build approach

Tracer Bullet (vertical end to end slices, thin but complete through every layer)

## Commands

```bash
# Install
npm install

# Dev server
npm start

# Build
npm run build

# Test
npm test
```

## Specs

Stored in `docs/specs/`. Format: `docs/specs/NNNN-title.md`.

## Rules

- Use React functional components with standard hooks.
- Persist user settings and trade records in Supabase with user authentication.
- Style UI surfaces using Tailwind utility classes and theme tokens.
- Handle state transitions and session cooldown timers client side with sound feedback.
- Maintain test coverage for smoke tests and critical calculations using React Testing Library.

## Agent skills

- [architect](.agents/skills/architect/): `jsmastery-pro/skills`, Architectural decisions and spec drafting
- [audit](.agents/skills/audit/): `jsmastery-pro/skills`, Project context bootstrapping and AGENTS.md gap filling
- [check](.agents/skills/check/): `jsmastery-pro/skills`, Code review and spec verification
- [debug](.agents/skills/debug/): `jsmastery-pro/skills`, Root cause analysis and minimal bug fixes
- [develop](.agents/skills/develop/): `jsmastery-pro/skills`, Feature implementation from approved specs
- [document](.agents/skills/document/): `jsmastery-pro/skills`, PR descriptions and release notes
- [scope](.agents/skills/scope/): `jsmastery-pro/skills`, Feature scoping and planning in docs/scope/
- [sync](.agents/skills/sync/): `jsmastery-pro/skills`, Post merge context and durable knowledge synchronization
- [test](.agents/skills/test/): `jsmastery-pro/skills`, Test suite generation for recent changes
- [supabase](.agents/skills/supabase/): `supabase/agent-skills`, Supabase client patterns and authentication
- [supabase-postgres-best-practices](.agents/skills/supabase-postgres-best-practices/): `supabase/agent-skills`, PostgreSQL design and row level security
- [vercel-react-best-practices](.agents/skills/vercel-react-best-practices/): `vercel-labs/agent-skills`, Modern React patterns and rendering performance

MCP servers: Supabase (recommended)

## Context files

- [api/AGENTS.md](api/AGENTS.md) (Serverless endpoints for delayed cooldown notifications)
- [supabase/AGENTS.md](supabase/AGENTS.md) (PostgreSQL database migrations and schema definitions)

_Drafted by /audit from the repo, worth a quick human pass. Edit freely: once a line stops matching this draft, later runs treat it as curated and will flag rather than overwrite it._
