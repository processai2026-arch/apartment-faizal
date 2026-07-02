<?php

declare(strict_types=1);

class AdminSecretaryController
{
    // ── Helpers ──────────────────────────────────────────────────────────────

    private function formatUser(array $user): array
    {
        return [
            'id'          => (int) $user['id'],
            'name'        => $user['name'],
            'email'       => $user['email'],
            'phone'       => $user['phone'] ?? null,
            'role'        => $user['role'],
            'isSecretary' => (bool)(int) ($user['is_secretary'] ?? 0),
            'status'      => $user['status'],
            'createdAt'   => $user['created_at'],
            'updatedAt'   => $user['updated_at'] ?? null,
        ];
    }

    private function attachPermissions(array $userData): array
    {
        $perms = SecretaryPermission::getForUser((int) $userData['id']);
        $userData['permissions'] = array_values($perms);
        $userData['modules']     = array_keys($perms);
        return $userData;
    }

    // ── Routes ───────────────────────────────────────────────────────────────

    /**
     * GET /admin/secretaries — list all admin users with is_secretary = 1
     */
    public function index(Request $request): void
    {
        $search = (string) ($request->query['search'] ?? '');
        $where  = "role = 'admin' AND is_secretary = 1 AND deleted_at IS NULL";
        $params = [];

        if ($search !== '') {
            $where  .= " AND (name LIKE :s0 OR email LIKE :s1)";
            $params['s0'] = '%' . $search . '%';
            $params['s1'] = '%' . $search . '%';
        }

        $rows = Database::fetchAll(
            "SELECT id, name, email, phone, role, is_secretary, status, created_at, updated_at
             FROM users WHERE {$where} ORDER BY id DESC",
            $params
        );

        $result = array_map(function (array $u) {
            $formatted = $this->formatUser($u);
            $perms     = SecretaryPermission::getForUser((int) $u['id']);
            $formatted['modules'] = array_keys($perms);
            return $formatted;
        }, $rows);

        Response::success($result);
    }

    /**
     * POST /admin/secretaries — promote an existing admin user to secretary,
     * or create a brand-new admin+secretary user.
     */
    public function store(Request $request): void
    {
        // If user_id provided: promote existing admin
        $userId = $request->input('user_id') ? (int) $request->input('user_id') : null;

        if ($userId) {
            $user = Database::fetch(
                "SELECT * FROM users WHERE id = :id AND deleted_at IS NULL",
                ['id' => $userId]
            );
            if (!$user) {
                throw new AppException('User not found', 404);
            }
            if ($user['role'] !== 'admin') {
                throw new AppException('Only admin users can be made secretaries', 422);
            }
            Database::query(
                "UPDATE users SET is_secretary = 1, updated_at = :now WHERE id = :id",
                ['now' => db_time(), 'id' => $userId]
            );
        } else {
            // Create new admin user
            Validator::require($request->all(), ['name', 'email', 'password']);
            $email = strtolower(trim((string) $request->input('email')));
            $existing = Database::fetch("SELECT id FROM users WHERE email = :e", ['e' => $email]);
            if ($existing) {
                throw new AppException('Email already in use', 422);
            }
            $now = db_time();
            $userId = Database::insert(
                "INSERT INTO users (name, email, phone, role, is_secretary, password_hash, status, created_at, updated_at)
                 VALUES (:name, :email, :phone, 'admin', 1, :hash, 'active', :now1, :now2)",
                [
                    'name'  => (string) $request->input('name'),
                    'email' => $email,
                    'phone' => $request->input('phone') ?: null,
                    'hash'  => password_hash((string) $request->input('password'), PASSWORD_DEFAULT),
                    'now1'  => $now,
                    'now2'  => $now,
                ]
            );
        }

        // Optionally set permissions
        $permissions = $request->input('permissions');
        if (is_array($permissions)) {
            SecretaryPermission::setPermissions($userId, $permissions);
        }

        $user     = Database::fetch("SELECT * FROM users WHERE id = :id", ['id' => $userId]);
        $response = $this->attachPermissions($this->formatUser($user));

        AuditService::log((int) $request->user['id'], 'secretary.create', 'user', $userId);
        Response::success($response, 'Secretary created', 201);
    }

    /**
     * GET /admin/secretaries/{id} — get one secretary with permissions
     */
    public function show(Request $request): void
    {
        $user = Database::fetch(
            "SELECT * FROM users WHERE id = :id AND is_secretary = 1 AND deleted_at IS NULL",
            ['id' => (int) $request->params['id']]
        );
        if (!$user) {
            throw new AppException('Secretary not found', 404);
        }

        Response::success($this->attachPermissions($this->formatUser($user)));
    }

    /**
     * PUT /admin/secretaries/{id} — update secretary details (name / phone / email)
     */
    public function update(Request $request): void
    {
        $user = Database::fetch(
            "SELECT * FROM users WHERE id = :id AND is_secretary = 1 AND deleted_at IS NULL",
            ['id' => (int) $request->params['id']]
        );
        if (!$user) {
            throw new AppException('Secretary not found', 404);
        }

        $sets   = [];
        $params = ['id' => (int) $user['id'], 'now' => db_time()];

        if ($request->input('name') !== null) {
            $sets[] = 'name = :name';
            $params['name'] = (string) $request->input('name');
        }
        if ($request->input('phone') !== null) {
            $sets[] = 'phone = :phone';
            $params['phone'] = (string) $request->input('phone') ?: null;
        }
        if ($request->input('email') !== null) {
            $sets[] = 'email = :email';
            $params['email'] = strtolower(trim((string) $request->input('email')));
        }
        if ($request->input('status') !== null) {
            $sets[] = 'status = :status';
            $params['status'] = (string) $request->input('status');
        }

        if ($sets) {
            $sets[] = 'updated_at = :now';
            Database::query(
                "UPDATE users SET " . implode(', ', $sets) . " WHERE id = :id",
                $params
            );
        }

        $updated  = Database::fetch("SELECT * FROM users WHERE id = :id", ['id' => (int) $user['id']]);
        $response = $this->attachPermissions($this->formatUser($updated));

        AuditService::log((int) $request->user['id'], 'secretary.update', 'user', (int) $user['id']);
        Response::success($response, 'Secretary updated');
    }

    /**
     * POST /admin/secretaries/{id}/permissions — replace all module permissions
     */
    public function setPermissions(Request $request): void
    {
        $user = Database::fetch(
            "SELECT * FROM users WHERE id = :id AND is_secretary = 1 AND deleted_at IS NULL",
            ['id' => (int) $request->params['id']]
        );
        if (!$user) {
            throw new AppException('Secretary not found', 404);
        }

        $permissions = $request->input('permissions');
        if (!is_array($permissions)) {
            throw new AppException('permissions must be an array', 422);
        }

        SecretaryPermission::setPermissions((int) $user['id'], $permissions);

        $response = $this->attachPermissions($this->formatUser($user));

        AuditService::log((int) $request->user['id'], 'secretary.set_permissions', 'user', (int) $user['id'], ['permissions' => $permissions]);
        Response::success($response, 'Permissions updated');
    }

    /**
     * DELETE /admin/secretaries/{id} — revoke secretary status (soft-operation: set is_secretary=0)
     */
    public function destroy(Request $request): void
    {
        $user = Database::fetch(
            "SELECT * FROM users WHERE id = :id AND is_secretary = 1 AND deleted_at IS NULL",
            ['id' => (int) $request->params['id']]
        );
        if (!$user) {
            throw new AppException('Secretary not found', 404);
        }

        Database::query(
            "UPDATE users SET is_secretary = 0, updated_at = :now WHERE id = :id",
            ['now' => db_time(), 'id' => (int) $user['id']]
        );

        // Remove all permissions for this user
        Database::query(
            "DELETE FROM secretary_permissions WHERE user_id = :id",
            ['id' => (int) $user['id']]
        );

        AuditService::log((int) $request->user['id'], 'secretary.delete', 'user', (int) $user['id']);
        Response::success([], 'Secretary role removed');
    }

    /**
     * GET /secretary/dashboard — summary data for the secretary dashboard
     */
    public function dashboard(Request $request): void
    {
        $today = date('Y-m-d');

        $data = [
            'todayVisitors'        => (int)(Database::fetch(
                "SELECT COUNT(*) AS c FROM visitors WHERE substr(entry_time,1,10) = :d AND deleted_at IS NULL",
                ['d' => $today]
            )['c'] ?? 0),
            'activeVisitors'       => (int)(Database::fetch(
                "SELECT COUNT(*) AS c FROM visitors WHERE status = 'Inside' AND deleted_at IS NULL"
            )['c'] ?? 0),
            'openComplaints'       => (int)(Database::fetch(
                "SELECT COUNT(*) AS c FROM complaints WHERE status NOT IN ('Resolved','Closed') AND deleted_at IS NULL"
            )['c'] ?? 0),
            'pendingMaintenance'   => (int)(Database::fetch(
                "SELECT COUNT(*) AS c FROM maintenance_requests WHERE status NOT IN ('Resolved','Closed','Completed') AND deleted_at IS NULL"
            )['c'] ?? 0),
            'pendingRentals'       => (int)(Database::fetch(
                "SELECT COUNT(*) AS c FROM rental_listings WHERE status = 'Pending' AND deleted_at IS NULL"
            )['c'] ?? 0),
            'pendingVendorRequests' => (int)(Database::fetch(
                "SELECT COUNT(*) AS c FROM vendor_bookings WHERE status = 'Requested' AND deleted_at IS NULL"
            )['c'] ?? 0),
            'todayWorkers'         => (int)(Database::fetch(
                "SELECT COUNT(*) AS c FROM worker_visits WHERE substr(entry_time,1,10) = :d",
                ['d' => $today]
            )['c'] ?? 0),
        ];

        // Recent complaints (top 5)
        $data['recentComplaints'] = Database::fetchAll(
            "SELECT id, category, subject, status, priority, created_at FROM complaints
             WHERE deleted_at IS NULL ORDER BY id DESC LIMIT 5"
        );

        // Recent maintenance (top 5)
        $data['recentMaintenance'] = Database::fetchAll(
            "SELECT id, category, title, status, priority, created_at FROM maintenance_requests
             WHERE deleted_at IS NULL ORDER BY id DESC LIMIT 5"
        );

        // Pending announcements (draft / scheduled)
        $data['pendingAnnouncements'] = Database::fetchAll(
            "SELECT id, title, status, priority, created_at FROM announcements
             WHERE status IN ('Draft','Scheduled') AND deleted_at IS NULL ORDER BY id DESC LIMIT 5"
        );

        Response::success($data);
    }

    /**
     * GET /secretary/permissions — return the calling user's secretary module permissions
     */
    public function myPermissions(Request $request): void
    {
        $userId = (int) $request->user['id'];
        $perms  = SecretaryPermission::getForUser($userId);
        Response::success(['modules' => array_keys($perms), 'permissions' => array_values($perms)]);
    }
}
