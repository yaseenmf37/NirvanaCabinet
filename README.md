# New Nirvana

New Nirvana is a Persian right-to-left cabinet-industry operations platform. It follows work from room measurement and planning through analysis, cutting, assembly, logistics, installation, reporting, and work history.

## Local development

```bash
npm install
npm run dev
```

Open `http://localhost:3000` and use one of the demo accounts shown on the login page.

## Verification

```bash
npm run check
npm run build
```

`npm run check` runs the Node domain tests, TypeScript, and application lint. The tests cover access scope, password hashing and migration compatibility, login rate limiting, room geometry validation, and structured room output.

After a production build already exists, explicitly run `npm run auth:smoke` to start a quiet local production server and exercise authorization boundaries. The smoke script does not build, log in through `/api/auth`, or print response data; it creates test-only signed sessions locally, follows redirects manually, and verifies that `app/data/platform.json` is byte-for-byte unchanged. If `.next/BUILD_ID` is absent, build first with `npm run build`.

## Runtime configuration

Set these variables outside the repository in staging and production:

- `SESSION_SECRET`: a long random secret. Production refuses to create sessions without it.
- `NEXT_PUBLIC_SITE_URL`: the public HTTPS origin used by sitemap and robots metadata.

Do not commit `.env` files, session secrets, passwords, or provider credentials.

## Architecture

- `app/` contains App Router pages, layouts, metadata routes, and API route handlers.
- `src/core/` contains domain types, server session handling, password security, rate limiting, and access checks.
- `src/services/store/platform-db.ts` is the current persistence boundary for `app/data/platform.json`.
- `/api/platform` returns company- and project-scoped data.
- `/api/platform/actions` is the authorized mutation boundary for rooms, workflow items, shipments, and projects.
- `src/components/ui` and `src/components/shared` provide the shared UI shell.
- `proxy.ts` performs an optimistic cookie check. Route handlers still enforce authorization.

## Security boundaries

Purchased modules, user roles, and record scope remain separate concepts. Server handlers validate all protected mutations. Project and company identifiers from the client are never trusted without an authorization check.

Production still needs a distributed rate-limit store for multiple replicas, multifactor authentication, protected upload handling, and a production database before handling sensitive customer data at scale.

## Product decisions still open

The detailed analysis and cutting workflows, cabinet-analysis software export format, commercial entitlement model, payment integrations, and third-party messaging integrations remain intentionally open in `پرامپت.txt`. The implementation does not invent those business rules.

See [docs/architecture-summary.md](docs/architecture-summary.md) for the compact implementation reference and [docs/work-in-progress.md](docs/work-in-progress.md) for verified progress and remaining work.
