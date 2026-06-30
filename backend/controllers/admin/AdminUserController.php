<?php

declare(strict_types=1);

class AdminUserController extends ResourceController
{
    protected string $model = UserAccount::class;
    protected string $entityType = 'user';

    private const MANAGEABLE_ROLES = ['security', 'tenant'];

    public function index(Request $request): void
    {
        [$rows, $total, $page, $perPage] = UserAccount::list($request);
        Response::paginated($rows, $total, $page, $perPage);
    }

    public function store(Request $request): void
    {
        $data = $request->all();
        Validator::require($data, ['name', 'email', 'password', 'role']);

        $email = Validator::email((string) ($data['email'] ?? ''));
        if ($email === null) {
            throw new AppException('Email is required', 422);
        }
        $role = Validator::enum((string) $data['role'], self::MANAGEABLE_ROLES, 'role');
        $password = (string) $data['password'];
        if (strlen($password) < 8) {
            throw new AppException('Password must be at least 8 characters', 422);
        }

        if (User::findByEmail($email)) {
            throw new AppException('A user with this email already exists', 409);
        }
        $phone = Validator::phone($data['phone'] ?? null);
        if ($phone !== null && User::findByPhone($phone)) {
            throw new AppException('A user with this phone already exists', 409);
        }

        $now = db_time();
        $id = Database::insert(
            'INSERT INTO users (name, email, phone, password_hash, role, office_id, status, created_at, updated_at)
             VALUES (:name, :email, :phone, :password_hash, :role, :office_id, :status, :created_at, :updated_at)',
            [
                'name' => trim((string) $data['name']),
                'email' => $email,
                'phone' => $phone,
                'password_hash' => password_hash($password, PASSWORD_BCRYPT, ['cost' => 12]),
                'role' => $role,
                'office_id' => $role === 'tenant' && !empty($data['officeId']) ? (int) $data['officeId'] : null,
                'status' => 'active',
                'created_at' => $now,
                'updated_at' => $now,
            ]
        );

        AuditService::log((int) $request->user['id'], 'user.create', 'user', $id, ['role' => $role]);
        Response::success(User::public(User::findById($id)), 'User created', 201);
    }

    public function update(Request $request): void
    {
        $id = (int) $request->params['id'];
        $existing = User::findById($id);
        $this->assertManageable($existing);

        $data = $request->all();
        $fields = [];
        $params = ['id' => $id];

        if (array_key_exists('name', $data) && trim((string) $data['name']) !== '') {
            $fields[] = 'name = :name';
            $params['name'] = trim((string) $data['name']);
        }
        if (array_key_exists('email', $data)) {
            $email = Validator::email((string) $data['email']);
            if ($email === null) {
                throw new AppException('Email is required', 422);
            }
            $clash = User::findByEmail($email);
            if ($clash && (int) $clash['id'] !== $id) {
                throw new AppException('A user with this email already exists', 409);
            }
            $fields[] = 'email = :email';
            $params['email'] = $email;
        }
        if (array_key_exists('phone', $data)) {
            $phone = Validator::phone($data['phone'] ?? null);
            if ($phone !== null) {
                $clash = User::findByPhone($phone);
                if ($clash && (int) $clash['id'] !== $id) {
                    throw new AppException('A user with this phone already exists', 409);
                }
            }
            $fields[] = 'phone = :phone';
            $params['phone'] = $phone;
        }
        if (array_key_exists('status', $data)) {
            $fields[] = 'status = :status';
            $params['status'] = Validator::enum((string) $data['status'], ['active', 'inactive'], 'status');
        }
        if (array_key_exists('password', $data) && (string) $data['password'] !== '') {
            if (strlen((string) $data['password']) < 8) {
                throw new AppException('Password must be at least 8 characters', 422);
            }
            $fields[] = 'password_hash = :password_hash';
            $params['password_hash'] = password_hash((string) $data['password'], PASSWORD_BCRYPT, ['cost' => 12]);
        }

        if (!$fields) {
            throw new AppException('Nothing to update', 422);
        }

        $fields[] = 'updated_at = :updated_at';
        $params['updated_at'] = db_time();
        Database::query('UPDATE users SET ' . implode(', ', $fields) . ' WHERE id = :id AND deleted_at IS NULL', $params);

        AuditService::log((int) $request->user['id'], 'user.update', 'user', $id);
        Response::success(User::public(User::findById($id)), 'User updated');
    }

    public function destroy(Request $request): void
    {
        $id = (int) $request->params['id'];
        $existing = User::findById($id);
        $this->assertManageable($existing);

        // Soft-delete and release the unique email/phone so the same address can
        // be reused for a new account later (the UNIQUE keys ignore NULLs).
        Database::query(
            'UPDATE users
             SET deleted_at = :deleted_at,
                 updated_at = :updated_at,
                 status = :status,
                 email = NULL,
                 phone = NULL
             WHERE id = :id AND deleted_at IS NULL',
            [
                'deleted_at' => db_time(),
                'updated_at' => db_time(),
                'status' => 'inactive',
                'id' => $id,
            ]
        );

        AuditService::log((int) $request->user['id'], 'user.delete', 'user', $id);
        Response::success(['id' => $id], 'User deleted');
    }

    private function assertManageable(?array $user): void
    {
        if (!$user) {
            throw new AppException('User not found', 404);
        }
        if (!in_array($user['role'], self::MANAGEABLE_ROLES, true)) {
            throw new AppException('Only security and tenant accounts can be managed here', 403);
        }
    }
}
