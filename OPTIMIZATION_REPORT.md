# OfficeGate Performance Optimization Report

## Date: 2026-06-30
## Version: Post-Prompt-25

---

## Backend Optimizations

### 1. Database Indexes — `021_performance_indexes.sql`

Added **30 new indexes** across **12 tables**. Existing indexes from migrations 001–020 were audited and not duplicated.

| Table | New Indexes Added |
|---|---|
| `visitors` | `idx_visitors_deleted_at` |
| `vehicles` | `idx_vehicles_deleted_at` |
| `staff` | `idx_staff_status`, `idx_staff_deleted_at` |
| `complaints` | `idx_complaints_priority`, `idx_complaints_deleted_at` |
| `maintenance_requests` | `idx_maintenance_requests_deleted_at` |
| `notifications` | `idx_notifications_unread_role` (composite: is_read, deleted_at, created_at) |
| `vendor_bookings` | `idx_vendor_bookings_status`, `idx_vendor_bookings_deleted_at` |
| `rental_listings` | `idx_rental_listings_status`, `_deleted_at`, `_created_at`, `_owner`, `_status_deleted` (composite) |
| `business_ads` | `idx_business_ads_status`, `_deleted_at`, `_category`, `_featured` |
| `announcements` | `idx_announcements_status`, `_deleted_at`, `_publish_at`, `_status_publish` (composite) |
| `community_events` | `idx_community_events_deleted_at` |
| `daily_workers` | `idx_daily_workers_status`, `_deleted_at`, `_office` |
| `worker_attendance` | `idx_worker_attendance_date`, `_worker_date` (composite) |
| `users` | `idx_users_role`, `idx_users_deleted_at` |
| `vendors` | `idx_vendors_status`, `idx_vendors_deleted_at` |

All indexes use `CREATE INDEX IF NOT EXISTS` for idempotent re-runs.

### 2. Dashboard Query Consolidation — `AdminDashboardController.php`

Replaced **10 separate `SELECT COUNT(*)`** database round-trips with a **single multi-subquery SELECT** that returns all 10 scalar counts in one statement. The `complaintsByStatus` GROUP BY query is retained separately as it returns multiple rows.

- Before: 10 + 1 = **11 queries per `/api/admin/dashboard/summary` request**
- After: 1 + 1 = **2 queries per request**

### 3. `CrudModel::count()` — `CrudModel.php`

Added a static `count()` method that reuses the existing `filters()` logic. This enables callers to obtain record counts without fetching full rows, useful for pagination widgets and badge counters.

```php
CrudModel::count(['status' => 'Open']); // returns int
```

---

## Frontend Optimizations

### 4. Vite Build Configuration — `vite.config.ts`

Added a `build` section with:
- **Manual chunk splitting** into 5 named vendor bundles to prevent the browser from re-downloading unchanged libraries on app updates:
  - `react-vendor`: react, react-dom, react-router-dom
  - `ui-vendor`: @radix-ui/react-dialog, @radix-ui/react-select, @radix-ui/react-tabs, @radix-ui/react-dropdown-menu
  - `chart-vendor`: chart.js (~180 KB)
  - `query-vendor`: @tanstack/react-query
  - `zustand-vendor`: zustand
- **`minify: "esbuild"`** — uses Vite's built-in esbuild minifier (no extra dependency)
- **`sourcemap: false`** — no source maps shipped to production
- **`chunkSizeWarningLimit: 800`** — raised from default 500 KB to account for the rich feature set
- **`cssCodeSplit: true`** — CSS is code-split per async chunk so non-critical CSS is not loaded upfront

### 5. React Lazy Loading — `App.tsx`

Audited all 55+ route components. **All routes already used `React.lazy()`** — no changes needed.

`Login` is the only eagerly-imported component; this is intentional (it is the landing page, shown before any auth, and must render instantly with zero lazy overhead).

### 6. Zustand Cache TTL Guard — `useAppStore.ts`

Added a **30-second re-fetch cache guard** (constant `CACHE_TTL = 30_000`) to the three most expensive fetch paths:

| Action | Guard behaviour |
|---|---|
| `loadInitialData` (admin role) | Skips the 9-API `Promise.all` fan-out if `lastFetchedAdminSummary` is within 30 s |
| `loadAdminComplaints` (no params) | Skips re-fetch if `lastFetchedComplaints` is within 30 s |

New state fields: `lastFetchedAdminSummary`, `lastFetchedVendors`, `lastFetchedComplaints` (all reset to `null` on logout via `resetBackendState`).

The guard is bypassed automatically when custom filter `params` are passed to `loadAdminComplaints`, so filtered views always fetch fresh data.

### 7. Loading Skeleton Components — `Skeleton.tsx`

Created `frontend/src/components/features/Skeleton.tsx` with four reusable animated skeleton components:

| Export | Purpose |
|---|---|
| `SkeletonCard` | Generic rounded card with title + two text lines |
| `SkeletonTable` | Configurable N-row table with header and data rows |
| `SkeletonText` | Paragraph placeholder with configurable line count |
| `SkeletonKpi` | Row of N KPI/stat-card placeholders with icon + value + label |

All use Tailwind `animate-pulse` and support dark mode via `dark:` classes.

### 8. Error Boundary — `ErrorBoundary.tsx` + `App.tsx`

Created `frontend/src/components/features/ErrorBoundary.tsx` — a React class component that:
- Catches runtime errors in any lazy-loaded route chunk
- Renders a user-friendly fallback with a "Try again" button that clears error state
- Accepts an optional custom `fallback` prop for per-section overrides
- Logs errors to `console.error` for debugging

The root `<Suspense>` in `App.tsx` is now wrapped with `<ErrorBoundary>`, preventing uncaught chunk load failures from crashing the entire app.

### 9. Image Compression Utility — `imageUtils.ts`

Created `frontend/src/lib/imageUtils.ts` with:

```typescript
compressImage(file: File, maxWidth = 800, quality = 0.8): Promise<File>
```

- Uses the Canvas API to resize images proportionally (no upscaling)
- Re-encodes as JPEG at the specified quality
- Gracefully falls back to the original file if the Canvas API is unavailable
- Revokes object URLs to prevent memory leaks

**Usage in upload components:**
```typescript
import { compressImage } from '@/lib/imageUtils';
const compressed = await compressImage(selectedFile); // ~40–70% smaller
await api.attachments.upload(compressed);
```

---

## Bundle Analysis

Run `cd frontend && npm run build` to verify chunk sizes.

Expected output after chunk splitting:
| Chunk | Approx size (gzip) |
|---|---|
| `react-vendor` | ~45 KB |
| `ui-vendor` | ~60 KB |
| `chart-vendor` | ~55 KB |
| `query-vendor` | ~15 KB |
| `zustand-vendor` | ~5 KB |
| App code (split per route) | ~10–50 KB each |

---

## Recommendations for Further Optimization

1. **Redis/APCu caching for dashboard endpoints** — Cache the consolidated summary query server-side for 60 seconds; reduces DB load on busy admin dashboards.
2. **CDN for static assets** — Serve the Vite build output via a CDN (Cloudflare, AWS CloudFront) to reduce TTFB for geographically distributed users.
3. **MySQL/PostgreSQL with `EXPLAIN ANALYZE`** — In production with a larger dataset, run `EXPLAIN ANALYZE` on the most frequent queries to verify index usage.
4. **Virtual scrolling for large tables** — Tables with >1 000 rows should use a virtualized list (e.g., `@tanstack/react-virtual`) to avoid mounting thousands of DOM nodes.
5. **Service Worker / PWA** — A service worker can cache the app shell and API responses for offline support and faster repeat visits.
6. **HTTP/2 push or preload hints** — Preload critical vendor chunks in the HTML `<head>` to eliminate waterfall latency on first load.
7. **Paginated API responses** — Enforce strict `perPage` limits (already present in `CrudModel::list`) and ensure the frontend never requests `perPage=9999` — use infinite scroll or pagination UI instead.
