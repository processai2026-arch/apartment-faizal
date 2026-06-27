# Security Test Report

Date: 2026-06-27

Scope: targeted security review and live endpoint validation for the OfficeGate frontend/backend in this repository.

## Findings Fixed

- Public QR gate tokens are now accepted only through the `X-Gate-Token` header. Query-string and JSON body gate tokens are rejected to avoid token leakage through URLs, logs, and browser history.
- Public visitor and vehicle checkout now requires a per-record one-time checkout token issued only by the matching public entry response. Wrong and replayed checkout tokens are rejected.
- Public checkout token hashes are hidden from API list/detail responses.
- Refresh token rotation is now atomic: a refresh token must be revoked by a conditional update before a replacement token is issued.
- Password change now revokes all active refresh sessions for the user and has endpoint-level throttling.
- Rate limiting no longer trusts spoofed `X-Forwarded-For` values unless the remote address is configured in `TRUSTED_PROXIES`.
- Production startup rejects `OTP_DRIVER=log`; OTP delivery now supports a webhook driver for production SMS/provider integration.
- Production Apache headers now include a CSP while keeping camera permission available for scan/photo flows.
- Request multipart size is capped at 10 MB, matching the actual upload safety envelope more closely.

## Validation

- `find backend -name '*.php' -exec php -l {} +` passed.
- `npm run build` in `frontend/` passed.
- `php backend/scripts/migrate.php` applied `004_public_checkout_tokens.sql`.
- `php backend/scripts/seed.php` passed.
- `php backend/tests/endpoint_security_test.php http://127.0.0.1:8010` passed: 84 passed, 0 failed.
- `database/officegate_production.sql` sanity check passed: 22 tables checked, no duplicate table columns detected.

## Remaining Deployment Checks

- Live MySQL import still needs real database credentials on the target server.
- Production OTP webhook delivery needs the real provider URL/token configured and tested with the provider.
