<?php

declare(strict_types=1);

require_once dirname(__DIR__) . '/core/bootstrap.php';

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
    $envKey = 'SEED_GATE_' . strtoupper(str_replace('-', '_', $scope)) . '_TOKEN';
    $configured = (string) env($envKey, '');
    if ($configured !== '') {
        return $configured;
    }

    if (config('app.env') === 'production') {
        return rtrim(strtr(base64_encode(random_bytes(32)), '+/', '-_'), '=');
    }

    return 'dev-' . $scope . '-token';
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
    [env('SEED_ADMIN_EMAIL', 'admin@officegate.com'), env('SEED_ADMIN_PASSWORD', 'ChangeMe@12345'), 'Admin User', '+919876500000', 'admin', null],
    [env('SEED_SECURITY_EMAIL', 'security@officegate.com'), env('SEED_SECURITY_PASSWORD', 'ChangeMe@12345'), 'Security Guard', '+919876511111', 'security', null],
    [env('SEED_TENANT_EMAIL', 'tenant@officegate.com'), env('SEED_TENANT_PASSWORD', 'ChangeMe@12345'), 'Tenant User', '+919876522222', 'tenant', $officeId],
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
    insert_if_missing('gate_tokens', 'token_hash', hash('sha256', $token), [
        'name' => 'Development ' . $scope,
        'scope' => $scope,
        'token_hash' => hash('sha256', $token),
        'status' => 'active',
        'expires_at' => db_time(strtotime('+1 year')),
        'created_at' => $now,
    ]);
    echo "gate token {$scope}: {$token}\n";
}

echo "seed complete\n";
