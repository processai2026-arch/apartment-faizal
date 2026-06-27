# Security Test Report

Date: 2026-06-27

Scope: targeted security review and live endpoint validation for the OfficeGate frontend/backend in this repository.

## Findings Fixed

- Public QR gate tokens are now accepted only through the `X-Gate-Token` header. Query-string and JSON body gate tokens are rejected to avoid token leakage through URLs, logs, and browser history.
- Frontend public scan pages no longer compile gate tokens into the JavaScript bundle. QR links carry tokens in URL fragments and move them into session storage before API calls.
- Visitor self-check-in now uses backend OTP send/verify calls instead of browser-generated demo OTP values.
- Public visitor and vehicle checkout now requires a per-record one-time checkout token issued only by the matching public entry response. Wrong and replayed checkout tokens are rejected.
- Public checkout token hashes are hidden from API list/detail responses.
- Public scan entry controllers now use explicit allowlists and server-owned status/time fields, preventing public mass assignment of internal visitor/vehicle fields.
- Soft-deleted users and soft-deleted CRUD records are excluded from auth and normal model lookups.
- Invoice payments and inventory stock movements use conditional atomic updates to avoid stale read/write races.
- Refresh token rotation is now atomic: a refresh token must be revoked by a conditional update before a replacement token is issued.
- Password change now revokes all active refresh sessions for the user and has endpoint-level throttling.
- File-backed rate limiting now reads and writes under an exclusive lock.
- Production seed refuses default passwords, requires explicit QR gate tokens, and does not print production secrets.
- Production restore requires `--confirm-production-restore`; local migration runner refuses MySQL.
- Rate limiting no longer trusts spoofed `X-Forwarded-For` values unless the remote address is configured in `TRUSTED_PROXIES`.
- Production startup rejects `OTP_DRIVER=log`; OTP delivery now supports a webhook driver for production SMS/provider integration.
- Production Apache headers now include a CSP while keeping camera permission available for scan/photo flows.
- Request multipart size is capped at 10 MB, matching the actual upload safety envelope more closely.
- MySQL native-prepare compatibility was checked by removing repeated named placeholders in SQL literals.

## Validation

- `find backend -name '*.php' -exec php -l {} +` passed.
- `npm run build` in `frontend/` passed.
- `npm run lint` in `frontend/` passed with warnings only: 0 errors, 15 warnings.
- `php backend/scripts/migrate.php` passed; all SQLite migrations were already applied.
- `php backend/scripts/seed.php` passed.
- SQL placeholder static scan passed: no repeated named placeholders found in backend SQL string literals.
- Production bundle leak check passed for dev passwords, `VITE_GATE`, external QR API URL, demo OTP text, and checkout-token hash field names.
- `php backend/tests/endpoint_security_test.php http://127.0.0.1:8010` previously passed: 84 passed, 0 failed. After the latest structural and security patches, rerun this only against local/staging because the suite is intentionally destructive.
- `database/officegate_production.sql` sanity check passed: 22 tables checked, no duplicate table columns detected.

## Remaining Deployment Checks

- Live MySQL import still needs real database credentials on the target server.
- Production OTP webhook delivery needs the real provider URL/token configured and tested with the provider.
