# Production readiness checklist

## Required environment

- [ ] Set a long random `SESSION_SECRET` in the deployment secret manager.
- [ ] Set `NEXT_PUBLIC_SITE_URL` to the real HTTPS public origin.
- [ ] Keep all `.env` files and credentials outside version control.
- [ ] Configure the deployment health check to call `GET /api/health`; expect HTTP `200` with `status: "ok"` when persistence is ready, and treat HTTP `503` with a non-`ok` status as not ready.


- [ ] Run `npm run check`.
- [ ] Run `npm run build`.
- [ ] Confirm `/robots.txt`, `/sitemap.xml`, and `/manifest.webmanifest` use the intended public origin.
- [ ] Confirm unauthenticated requests redirect or return `401`.
- [ ] Confirm cross-company project access returns `403`.
- [ ] Confirm invalid room geometry and invalid progress are rejected.
- [ ] Confirm shipment confirmations cannot be overwritten.

## Required before production customer data

- [ ] Replace JSON persistence with a transactional database and tested backups.
- [ ] Use a distributed rate-limit store when running multiple replicas.
- [ ] Add multifactor authentication for sensitive accounts.
- [ ] Add private upload storage, content validation, malware scanning, and signed access URLs.
- [ ] Add dependency scanning and recovery drills.
- [x] Add and run the manual authorization smoke test with tenant isolation and module-gate coverage.
- [ ] Finalize analysis, cutting, commercial entitlement, payment, export, and integration requirements.
