# New Nirvana architecture summary

Use this short reference for implementation tasks. Read `پرامپت.txt` only for product requirements, open decisions, or security review.

## Product

New Nirvana is a Persian RTL cabinet-industry operations platform. The workflow is planning and measuring, analysis, cutting, assembly, logistics, installation, reporting, and work history. It serves full-service companies and specialist teams.

## Access model

Keep these concerns separate:

- Entitlements determine which modules a company purchased.
- Roles determine which actions a user may perform.
- Scope determines which company, project, team, task, or record they may access.

Protected operations must enforce all three on the server. Never trust client-supplied company, project, user, or record identifiers.

## Current application boundaries

- Next.js App Router with React and TypeScript.
- `src/core/types` contains domain types and labels.
- `src/core/auth` contains cookie session and access checks.
- `src/services/store/platform-db.ts` is the current JSON persistence boundary.
- `app/data/platform.json` is the current platform seed/state file.
- `/api/platform` returns authorized, scoped read data.
- `/api/platform/actions` handles authorized workflow mutations and audit history.
- `src/components/ui` and `src/components/shared` are the shared UI boundary.
- `proxy.ts` performs optimistic cookie checks. Route handlers remain responsible for authorization.
- Treat `platform.json` and `src/services/store/platform-db.ts` as the sole active platform data boundary. Do not use legacy JSON stores or localStorage stores for new work; preserve them until an explicit migration or deletion is approved.
- Platform and session endpoints are request-time and must remain uncached unless an explicit authorization and invalidation design is added.

## UI direction

Use a single industrial Swiss SaaS system for the RTL PWA: high-contrast slate surfaces, restrained semantic green/amber/red states, Lucide icons, accessible focus states, touch targets, responsive layouts, and light/dark support. Role-based dashboards should prioritize the user's next operational action.

## Workflow rules

- Planning preserves geometry, openings, obstacles, equipment answers, versions, validation, and structured output.
- Assembly problems require a reason and must not count as completion. Missing parts remain visible to relevant teams.
- Installation supports completed/problem states with a required reason for failure.
- Dispatch and receipt are separate immutable confirmations. Discrepancies derive from both records.
- Audit events preserve actor, timestamp, action, and relevant detail.

## Engineering rules

Prefer server authorization and server data boundaries. Keep client components at interactive leaves. Avoid duplicate stores, localStorage authentication, unauthenticated mutations, hardcoded workflow data, and speculative requirements for analysis or cutting. Run TypeScript, lint, build, and relevant workflow tests after changes.
