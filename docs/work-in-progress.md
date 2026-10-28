# Current implementation status

## Completed

- Consolidated project state reads around `/api/platform` and `platform.json`.
- Added `proxy.ts` optimistic route protection for authenticated app areas.
- Kept server authorization in `/api/platform/actions`.
- Connected assembly, installation, logistics, tasks, employees, reports, project list/detail, and project creation views to platform data.
- Added planning editor with server-side geometry validation and `save_room` action.
- Hardened room ownership checks and 2D validation for wall indexes, openings, obstacles, and sections.
- Added editable 2D planning controls for opening/obstacle update/remove, section creation/removal, wall visibility, and ceiling visibility.
- Replaced Analysis and Cutting placeholders with scoped preparation workspaces showing room readiness, validation, and structured input counts; specialized calculations and workflow rules remain intentionally undecided.
- Added public catalog API and plans/FAQ page using safe plan and FAQ data; unauthenticated platform hydration now resolves as a normal public state.
- Added a read-only scoped entitlement snapshot endpoint and displayed active modules in settings; no purchase or activation behavior is invented.
- Added public catalog API and plans/FAQ page using safe plan and FAQ data; unauthenticated platform hydration now resolves as a normal public state.
- Hardened JSON persistence: corrupt active state now fails closed instead of silently replacing data, and writes use a temporary file plus atomic rename.
- Extracted shared action validation for workflow/project inputs and covered it with deterministic tests.
- Extracted signed session token logic and added deterministic round-trip, expiry, tamper, and production-secret tests.
- Added fail-closed `400` handling for malformed auth and platform action request bodies.
- Added baseline security response headers and verified them on a production response.
- Added a no-store `/api/health` endpoint and verified its `200` response and headers for deployment health checks.
- Expanded planning inputs for room name, opening type/dimensions, obstacle dimensions, sections, and the complete equipment questionnaire.
- Replaced dashboard mock workload, owner IDs, stage enums, dead buttons, and fake urgent-task KPI with scoped platform data and working links.
- Moved platform hydration into the root AppStateProvider so direct `/projects` and `/tasks` navigation loads authorized data.
- Replaced reachable compatibility no-op mutations with explicit errors and filtered dashboard quick actions by user modules.
- Added a typed `PlatformReadModel` so the scoped API response is explicit across the Zustand store and UI.
- Added fail-closed runtime validation for every platform action, including complete shipment item coverage, duplicate detection, quantity bounds, and bounded notes.
- Added persistence readiness checks with a non-seeding health endpoint and HTTP 503 when state is missing or invalid.
- Added structural validation for persisted platform collection members and regression tests for malformed state records.
- Added a dependency-free Node alias loader so persistence tests can run through the existing test command.
- Added server-side workflow visibility and mutation authorization: operational users see and update only items assigned to them, while project and production managers retain oversight; added access tests.
- Added missing-part lifecycle tracking (`reported`, `in_progress`, `resolved`) with project/module authorization, immutable resolution direction, and audit history.
- Logistics now supports selecting among multiple scoped shipments instead of always displaying the first shipment.
- Added structured planning output download with scoped project authorization.
- Added project selection and wall-aware opening preview in planning.
- Replaced client-side planning timestamp identifiers with collision-resistant UUIDs.
- Connected report range filtering, JSON export, workflow report toggling, settings persistence, task defaults after hydration, and project progress actions.
- Added scrypt password hashing with first-login migration.
- Added signed expiring session tokens using `SESSION_SECRET`; production refuses to run without it.
- Added login rate limiting with `Retry-After` and security tests. It is in-process per instance.
- Added Node builtin domain tests for access, password security, rate limiting, and room geometry.
- Added `test` and `check` npm scripts.
- Added PWA manifest, icon, robots, and sitemap routes. Public site URL uses `NEXT_PUBLIC_SITE_URL`.
- Connected TaskForm to real `create_workflow` persistence and verified API readback.
- Added `.claude/settings.json` hook refresh `TOKEN_EFFICIENCY_REFRESH=20`.
- Added `docs/architecture-summary.md` and `docs/production-readiness.md`.
- Updated README with runtime configuration, architecture, and security boundaries.

## Verified

- `npm run check` passes with 22 tests, TypeScript, and application lint.
- `npm run lint` intentionally checks only application paths (`app`, `src`, and `proxy.ts`); use `npm run check` for the complete verification command.
- `npm run build` passes and generates app, manifest, robots, and sitemap routes.
- Login, signed session reading, forged-token rejection, scoped reads, workflow completion, project mutations, tenant isolation, invalid progress, invalid geometry, and workflow creation/readback were smoke-tested.

## Remaining by design or production scope

- Analysis and Cutting now have scoped preparation workspaces; specialized calculations and workflow rules remain intentionally undecided.
- Dashboard role-specific detail can be expanded after finalizing role-specific reporting rules.
- Compatibility mutation methods remain no-ops but are not mounted by active mutation flows; active mutations use platform actions.
- Public plan/FAQ catalog is available read-only; commercial entitlements, payments, refunds, and third-party integrations still require business decisions and provider credentials.
- Planning is a functional 2D editor with editable openings, obstacles, sections, wall visibility, and ceiling visibility; it is not the eventual full 3D workspace.
- Production still needs a transactional database, distributed rate limiting, MFA, protected upload handling, dependency scanning, and recovery drills. JSON persistence now fails closed on corruption and writes atomically, but remains unsuitable for multi-replica production.
- Legacy files remain under `app/lib`, `app/data.ts`, and older JSON stores. They are not authoritative paths; remove them only with explicit deletion permission.
- Third-party prompt-cache behavior through `api.aipremix.ir` remains unverified.
