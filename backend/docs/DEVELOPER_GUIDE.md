# Developer Guide

## Adding a New Feature

Every feature in OfficeGate follows the same layered pattern. Use this step-by-step checklist whenever you add a new module.

### Step 1 — Migration

Create `backend/database/migrations/022_your_feature.sql`:

```sql
CREATE TABLE IF NOT EXISTS your_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'Active' CHECK(status IN ('Active','Inactive')),
  created_at TEXT NOT NULL,
  updated_at TEXT,
  deleted_at TEXT
);
```

Run it:

```bash
php backend/scripts/migrate.php
```

### Step 2 — Model

Create `backend/models/YourItem.php`:

```php
<?php
declare(strict_types=1);

class YourItem extends CrudModel
{
    protected static string $table = 'your_items';
    protected static array $columns = ['name', 'status'];
    protected static array $searchColumns = ['name'];
    protected static array $hidden = [];
}
```

`CrudModel` provides `find()`, `list()`, `create()`, `update()`, `softDelete()`, and `count()` for free.

### Step 3 — Controller

Create `backend/controllers/AdminYourItemController.php`:

```php
<?php
declare(strict_types=1);

class AdminYourItemController
{
    public function index(Request $request): void
    {
        [$rows, $total, $page, $perPage] = YourItem::list($request);
        Response::paginated($rows, $total, $page, $perPage);
    }

    public function store(Request $request): void
    {
        $data = $request->json();
        Validator::require($data, ['name']);
        $item = YourItem::create(['name' => $data['name'], 'status' => 'Active']);
        Response::created($item);
    }

    public function show(Request $request, string $id): void
    {
        $item = YourItem::find((int)$id) ?? throw new AppException('Not found', 404);
        Response::ok($item);
    }

    public function update(Request $request, string $id): void
    {
        $data = $request->json();
        Validator::require($data, ['name']);
        $item = YourItem::update((int)$id, ['name' => $data['name'], 'status' => $data['status'] ?? 'Active']);
        Response::ok($item);
    }

    public function destroy(Request $request, string $id): void
    {
        $item = YourItem::softDelete((int)$id);
        Response::ok($item);
    }
}
```

### Step 4 — Routes

Add to `backend/routes/api.php`:

```php
$router->get('/admin/your-items', [AdminYourItemController::class, 'index'], ['RoleMiddleware:admin']);
$router->post('/admin/your-items', [AdminYourItemController::class, 'store'], ['RoleMiddleware:admin']);
$router->get('/admin/your-items/{id}', [AdminYourItemController::class, 'show'], ['RoleMiddleware:admin']);
$router->put('/admin/your-items/{id}', [AdminYourItemController::class, 'update'], ['RoleMiddleware:admin']);
$router->delete('/admin/your-items/{id}', [AdminYourItemController::class, 'destroy'], ['RoleMiddleware:admin']);
```

### Step 5 — TypeScript Interface

Add to `frontend/src/types/index.ts`:

```typescript
export interface YourItem {
  id: string;
  name: string;
  status: 'Active' | 'Inactive';
  createdAt: string;
}
```

### Step 6 — API Client

Add to `frontend/src/lib/api.ts`:

```typescript
export const yourItemsApi = {
  list: (params?: Record<string, string>) =>
    request<YourItem[]>('/admin/your-items', { method: 'GET' }),

  create: (data: { name: string }) =>
    request<YourItem>('/admin/your-items', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  update: (id: string, data: Partial<YourItem>) =>
    request<YourItem>(`/admin/your-items/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  destroy: (id: string) =>
    request<YourItem>(`/admin/your-items/${id}`, { method: 'DELETE' }),
};
```

### Step 7 — Zustand Store

Add to `frontend/src/stores/useAppStore.ts` (or create a dedicated store):

```typescript
interface YourItemSlice {
  yourItems: YourItem[];
  loadYourItems: () => Promise<void>;
}

// Inside the store definition:
yourItems: [],
loadYourItems: async () => {
  const res = await yourItemsApi.list();
  set({ yourItems: res.data });
},
```

### Step 8 — Page Component

Create `frontend/src/pages/YourItemsPage.tsx`:

```tsx
import { useEffect } from 'react';
import { useAppStore } from '@/stores/useAppStore';

export default function YourItemsPage() {
  const { yourItems, loadYourItems } = useAppStore();

  useEffect(() => {
    loadYourItems();
  }, [loadYourItems]);

  return (
    <div>
      <h1>Your Items</h1>
      {yourItems.map(item => (
        <div key={item.id}>{item.name}</div>
      ))}
    </div>
  );
}
```

### Step 9 — Sidebar Entry

Add to the appropriate nav group in `frontend/src/components/layout/Sidebar.tsx`:

```typescript
{ to: '/your-items', label: 'Your Items', icon: SomeIcon },
```

### Step 10 — App Router

Add lazy import and route to `frontend/src/App.tsx`:

```tsx
const YourItemsPage = lazy(() => import('@/pages/YourItemsPage'));

// Inside the admin routes:
<Route path="/your-items" element={<YourItemsPage />} />
```

---

## Code Style

### PHP

- `declare(strict_types=1)` at the top of every file
- No namespace declarations — the classmap autoloader handles class discovery
- Class names: PascalCase (`AdminVisitorController`)
- Method names: camelCase (`markAttendance`)
- Constants: `UPPER_SNAKE_CASE`
- Guard clauses over nested ifs — throw `AppException` early
- No `echo` in controllers — always use `Response::ok()`, `Response::created()`, `Response::paginated()`
- Parameterized PDO queries only — never string-interpolate user input into SQL

### TypeScript / React

- TypeScript strict mode (`strict: true` in tsconfig)
- No `any` types — use proper interfaces or `unknown`
- Component names: PascalCase (`VisitorManagement`)
- Hooks: camelCase with `use` prefix (`useAppStore`, `useAuthStore`)
- File names: match the component name exactly
- State mutations only through Zustand store actions — no direct `setState` in pages
- `import type` for type-only imports
- Props interfaces: named `<ComponentName>Props`

---

## File Naming Conventions

| File Type | Convention | Example |
|-----------|-----------|---------|
| PHP controller | `Admin<Module>Controller.php` | `AdminVisitorController.php` |
| PHP model | `<Entity>.php` | `Visitor.php` |
| PHP migration | `NNN_<description>.sql` | `022_your_feature.sql` |
| React page | `<Feature>.tsx` | `VisitorManagement.tsx` |
| React component | `<ComponentName>.tsx` | `VisitorCard.tsx` |
| Zustand store | `use<Name>Store.ts` | `useAuthStore.ts` |
| API module | `api.ts` (single file) | All API functions in `src/lib/api.ts` |
| TypeScript types | `types/index.ts` or `types/auth.ts` | |

---

## Common Patterns

### Adding a New Admin Page

1. Create migration (if new table needed)
2. Create model in `backend/models/`
3. Create controller in `backend/controllers/`
4. Register routes in `backend/routes/api.php` under `RoleMiddleware:admin`
5. Add TypeScript interface to `frontend/src/types/index.ts`
6. Add API functions to `frontend/src/lib/api.ts`
7. Add state to `frontend/src/stores/useAppStore.ts`
8. Create page in `frontend/src/pages/`
9. Add lazy import and route to `frontend/src/App.tsx` inside the `admin` route block
10. Add sidebar entry in `frontend/src/components/layout/Sidebar.tsx` in `adminNavItems`

### Adding a New Tenant Page

Same as admin, but:
- Controller name: `Tenant<Module>Controller.php`
- Route middleware: `RoleMiddleware:tenant`
- Route prefix: `/tenant/`
- App.tsx route: inside the `/tenant/*` route block
- Sidebar: add to `tenantNavItems` in `Sidebar.tsx`

### Adding a New API Endpoint

1. Add the controller method
2. Add a `$router->METHOD('/path', [...], ['RoleMiddleware:role'])` line in `api.php`
3. The router automatically dispatches to the controller method
4. Return responses only via the `Response` helper — never raw `echo`

### Error Handling

Throw `AppException` for any expected error:

```php
throw new AppException('Record not found', 404);
throw new AppException('Validation failed', 422, ['field' => 'Required']);
```

Unhandled exceptions are caught by the front controller and converted to `500` responses in production (with debug info hidden).

### Authentication in Controllers

Controllers do not check auth themselves — middleware handles it. If a route has `AuthMiddleware` or `RoleMiddleware`, the current user is always available:

```php
$user = $request->user;  // set by AuthMiddleware
```

### Pagination

```php
// Controller:
[$rows, $total, $page, $perPage] = YourModel::list($request);
Response::paginated($rows, $total, $page, $perPage);

// Client (api.ts):
const res = await request<YourItem[]>('/admin/your-items?page=1&perPage=25');
// res.meta.pagination.total, .page, .totalPages
```

### Soft Deletes

Never use SQL `DELETE`. Always call `CrudModel::softDelete()`:

```php
YourItem::softDelete((int)$id);
```

The `deleted_at` column is set automatically. All `find()` and `list()` calls already filter `deleted_at IS NULL`.

---

## Running the Test Suite

```bash
# PHP syntax lint
cd backend
find . -name '*.php' -not -path './vendor/*' -exec php -l {} +

# PHPUnit unit tests (requires composer install)
composer install
composer test

# Full endpoint/integration suite (requires running server)
php -S 127.0.0.1:8010 public/index.php &
php tests/endpoint_security_test.php http://127.0.0.1:8010
```

### Writing a New PHPUnit Test

Tests live in `backend/tests/Unit/`. The bootstrap (`tests/bootstrap.php`) loads `core/bootstrap.php`, which initialises the autoloader, env, database, and all class files.

```php
<?php
declare(strict_types=1);

use PHPUnit\Framework\TestCase;

final class YourTest extends TestCase
{
    public function testSomething(): void
    {
        // All app classes are available: Validator, JWT, AppException, etc.
        self::assertSame('expected', someFunction('input'));
    }
}
```

Note: The database is live (SQLite at `storage/database.sqlite`). Tests that need a clean state should use a dedicated test database or mock `Database`. Unit tests should test pure helper/model logic without HTTP round-trips; use `endpoint_security_test.php` for integration testing.
