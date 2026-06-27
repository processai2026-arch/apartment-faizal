<?php

declare(strict_types=1);

if (PHP_SAPI !== 'cli') {
    http_response_code(404);
    exit;
}

require_once dirname(__DIR__) . '/core/bootstrap.php';

$isProduction = config('app.env') === 'production';

function insert_if_missing(string $table, string $whereColumn, mixed $whereValue, array $data): int
{
    $existing = Database::fetch("SELECT id FROM {$table} WHERE {$whereColumn} = :value LIMIT 1", ['value' => $whereValue]);
    if ($existing) {
        return (int) $existing['id'];
    }
    $columns = array_keys($data);
    return Database::insert("INSERT INTO {$table} (" . implode(',', $columns) . ") VALUES (:" . implode(',:', $columns) . ")", $data);
}

function insert_office_if_missing(array $data): int
{
    $existing = Database::fetch(
        'SELECT id FROM offices WHERE block = :block AND floor_number = :floor_number AND company_name = :company_name LIMIT 1',
        [
            'block' => $data['block'],
            'floor_number' => $data['floor_number'],
            'company_name' => $data['company_name'],
        ]
    );
    if ($existing) {
        return (int) $existing['id'];
    }

    $columns = array_keys($data);
    return Database::insert('INSERT INTO offices (' . implode(',', $columns) . ') VALUES (:' . implode(',:', $columns) . ')', $data);
}

function public_seed_token(string $scope): string
{
    global $isProduction;

    $envKey = 'SEED_GATE_' . strtoupper(str_replace('-', '_', $scope)) . '_TOKEN';
    $configured = (string) env($envKey, '');
    if ($configured !== '') {
        return $configured;
    }

    if ($isProduction) {
        throw new RuntimeException("{$envKey} is required in production seed.");
    }

    return 'dev-' . $scope . '-token';
}

function seed_password(string $key): string
{
    global $isProduction;

    $password = (string) env($key, $isProduction ? '' : 'ChangeMe@12345');
    if (!$isProduction) {
        return $password;
    }

    $unsafe = $password === ''
        || $password === 'ChangeMe@12345'
        || strlen($password) < 10
        || str_starts_with(strtolower($password), 'replace');
    if ($unsafe) {
        throw new RuntimeException("{$key} must be set to a strong non-default password in production.");
    }

    return $password;
}

function upsert_gate_token(string $scope, string $token, bool $isProduction, string $now): void
{
    $name = ($isProduction ? 'Production ' : 'Development ') . $scope;
    $existing = Database::fetch(
        'SELECT id FROM gate_tokens WHERE name = :name AND scope = :scope LIMIT 1',
        ['name' => $name, 'scope' => $scope]
    );
    if ($existing) {
        Database::query(
            'UPDATE gate_tokens
             SET token_hash = :token_hash,
                 status = :status,
                 expires_at = :expires_at
             WHERE id = :id',
            [
                'token_hash' => hash('sha256', $token),
                'status' => 'active',
                'expires_at' => db_time(strtotime('+1 year')),
                'id' => $existing['id'],
            ]
        );
        return;
    }

    Database::query(
        'INSERT INTO gate_tokens (name, scope, token_hash, status, expires_at, created_at)
         VALUES (:name, :scope, :token_hash, :status, :expires_at, :created_at)',
        [
            'name' => $name,
            'scope' => $scope,
            'token_hash' => hash('sha256', $token),
            'status' => 'active',
            'expires_at' => db_time(strtotime('+1 year')),
            'created_at' => $now,
        ]
    );
}

$now = db_time();

$officeId = insert_office_if_missing([
    'block' => 'BRILEY ONE',
    'floor_number' => '7th FLOOR',
    'company_name' => 'M2K ADVISORS',
    'contact_person' => 'Mr. Kumar',
    'contact_phone' => '+919876543210',
    'contact_email' => 'admin@m2k.example',
    'allocated_vehicle_count' => 5,
    'used_vehicle_count' => 0,
    'status' => 'Active',
    'created_at' => $now,
    'updated_at' => $now,
]);

$users = [
    [env('SEED_ADMIN_EMAIL', 'admin@officegate.com'), seed_password('SEED_ADMIN_PASSWORD'), 'Admin User', '+919876500000', 'admin', null],
    [env('SEED_SECURITY_EMAIL', 'security@officegate.com'), seed_password('SEED_SECURITY_PASSWORD'), 'Security Guard', '+919876511111', 'security', null],
    [env('SEED_TENANT_EMAIL', 'tenant@officegate.com'), seed_password('SEED_TENANT_PASSWORD'), 'Tenant User', '+919876522222', 'tenant', $officeId],
];

foreach ($users as [$email, $password, $name, $phone, $role, $userOfficeId]) {
    insert_if_missing('users', 'email', $email, [
        'name' => $name,
        'email' => strtolower($email),
        'phone' => $phone,
        'password_hash' => password_hash($password, PASSWORD_DEFAULT),
        'role' => $role,
        'office_id' => $userOfficeId,
        'status' => 'active',
        'created_at' => $now,
        'updated_at' => $now,
    ]);
}

$offices = [
    ['8th FLOOR', 'M2K ADVISORS', 'Mr. Sharma', '+919876543211', 5],
    ['6th FLOOR', 'AXIS FINANCE', 'Mr. Deepak', '+919876543223', 8],
    ['3rd FLOOR', 'TALENT PRO', 'Ms. Anita', '+919876543224', 4],
    ['BRILEY ONE', 'PILOT SECURITY', 'Mr. Rajan', '+919876543213', 4],
    ['BRILEY ONE', 'VENBA-TECH', 'Mr. Arun', '+919876543216', 6],
];
foreach ($offices as [$floor, $company, $person, $phone, $slots]) {
    insert_office_if_missing([
        'block' => 'BRILEY ONE',
        'floor_number' => $floor,
        'company_name' => $company . ($company === 'M2K ADVISORS' ? ' ' . $floor : ''),
        'contact_person' => $person,
        'contact_phone' => $phone,
        'contact_email' => null,
        'allocated_vehicle_count' => $slots,
        'used_vehicle_count' => 0,
        'status' => 'Active',
        'created_at' => $now,
        'updated_at' => $now,
    ]);
}

insert_if_missing('staff', 'contact', '+911111122222', [
    'name' => 'Ramu Kumar',
    'role' => 'Security',
    'department' => 'Security',
    'contact' => '+911111122222',
    'join_date' => '2024-01-15',
    'status' => 'Active',
    'created_at' => $now,
    'updated_at' => $now,
]);

insert_if_missing('vendors', 'contact', '+919876511111', [
    'name' => 'Rajesh Plumbing',
    'company' => 'AquaFix Solutions',
    'service_type' => 'Plumbing',
    'category' => 'Regular Maintenance',
    'contact' => '+919876511111',
    'last_visit' => '2026-05-05',
    'next_visit' => '2026-06-05',
    'status' => 'Active',
    'created_at' => $now,
    'updated_at' => $now,
]);

insert_if_missing('inventory_items', 'item_name', 'LED Bulbs (10W)', [
    'item_name' => 'LED Bulbs (10W)',
    'category' => 'Electrical',
    'quantity' => 50,
    'unit_cost' => 120,
    'vendor' => 'PowerTech Ltd',
    'purchase_date' => '2026-05-01',
    'used_quantity' => 0,
    'location' => 'Common Area',
    'used_by' => null,
    'created_at' => $now,
    'updated_at' => $now,
]);

insert_if_missing('utility_tasks', 'description', 'Monthly lift maintenance', [
    'description' => 'Monthly lift maintenance',
    'type' => 'Lift',
    'scheduled_date' => date('Y-m-d', strtotime('+7 days')),
    'last_completed' => null,
    'status' => 'Upcoming',
    'assigned_staff' => 'OTIS Team',
    'notes' => 'Safety check',
    'created_at' => $now,
    'updated_at' => $now,
]);

foreach (['visitor-entry', 'visitor-checkout', 'vehicle-entry', 'vehicle-checkout'] as $scope) {
    $token = public_seed_token($scope);
    upsert_gate_token($scope, $token, $isProduction, $now);
    echo $isProduction ? "gate token {$scope}: configured\n" : "gate token {$scope}: {$token}\n";
}

echo "seed complete\n";
