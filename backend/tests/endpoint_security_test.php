<?php

declare(strict_types=1);

$allowLive = in_array('--allow-live', $argv, true);
$args = array_values(array_filter(array_slice($argv, 1), fn (string $arg) => $arg !== '--allow-live'));
$baseUrl = rtrim($args[0] ?? 'http://127.0.0.1:8010', '/');
$host = parse_url($baseUrl, PHP_URL_HOST) ?: '';
$localHosts = ['127.0.0.1', 'localhost', '::1'];
if (!$allowLive && !in_array($host, $localHosts, true)) {
    fwrite(STDERR, "Refusing to run the destructive endpoint suite against non-local host {$host}. Use --allow-live only for an isolated staging database.\n");
    exit(1);
}

$testIp = '10.222.' . random_int(1, 250) . '.' . random_int(1, 250);
$passed = 0;
$failed = 0;

function http_request(string $method, string $path, mixed $body = null, ?string $token = null, array $headers = []): array
{
    global $baseUrl, $testIp;

    $requestHeaders = array_merge(["X-Forwarded-For: {$testIp}"], $headers);
    $content = null;
    if (is_array($body)) {
        $content = json_encode($body, JSON_UNESCAPED_SLASHES);
        $requestHeaders[] = 'Content-Type: application/json';
    } elseif (is_string($body)) {
        $content = $body;
    }
    if ($token) {
        $requestHeaders[] = "Authorization: Bearer {$token}";
    }

    $context = stream_context_create([
        'http' => [
            'method' => $method,
            'header' => implode("\r\n", $requestHeaders),
            'content' => $content,
            'ignore_errors' => true,
            'timeout' => 15,
        ],
    ]);

    $raw = file_get_contents($baseUrl . $path, false, $context);
    $statusLine = $http_response_header[0] ?? 'HTTP/1.1 000';
    preg_match('/\s(\d{3})\s/', $statusLine, $matches);
    $status = (int) ($matches[1] ?? 0);
    $json = is_string($raw) ? json_decode($raw, true) : null;

    return ['status' => $status, 'raw' => $raw, 'json' => $json, 'headers' => $http_response_header ?? []];
}

function multipart_request(string $path, array $fields, string $fieldName, string $filePath, ?string $token = null): array
{
    $boundary = '----OfficeGateBoundary' . bin2hex(random_bytes(8));
    $body = '';
    foreach ($fields as $name => $value) {
        $body .= "--{$boundary}\r\n";
        $body .= "Content-Disposition: form-data; name=\"{$name}\"\r\n\r\n";
        $body .= "{$value}\r\n";
    }
    $filename = basename($filePath);
    $body .= "--{$boundary}\r\n";
    $body .= "Content-Disposition: form-data; name=\"{$fieldName}\"; filename=\"{$filename}\"\r\n";
    $body .= "Content-Type: application/pdf\r\n\r\n";
    $body .= file_get_contents($filePath) . "\r\n";
    $body .= "--{$boundary}--\r\n";

    return http_request('POST', $path, $body, $token, [
        "Content-Type: multipart/form-data; boundary={$boundary}",
        'Content-Length: ' . strlen($body),
    ]);
}

function expect_status(string $label, string $method, string $path, int|array $expected, mixed $body = null, ?string $token = null, array $headers = []): array
{
    global $passed, $failed;
    $result = http_request($method, $path, $body, $token, $headers);
    $expectedList = is_array($expected) ? $expected : [$expected];
    if (in_array($result['status'], $expectedList, true)) {
        $passed++;
        echo "PASS {$label} ({$result['status']})\n";
    } else {
        $failed++;
        $want = implode('/', $expectedList);
        echo "FAIL {$label}: expected {$want}, got {$result['status']}. {$result['raw']}\n";
    }
    return $result;
}

function expect_header_contains(string $label, array $result, string $headerName, string $expected): void
{
    global $passed, $failed;
    $needle = strtolower($headerName) . ':';
    foreach ($result['headers'] as $header) {
        if (str_starts_with(strtolower($header), $needle) && stripos($header, $expected) !== false) {
            $passed++;
            echo "PASS {$label}\n";
            return;
        }
    }
    $failed++;
    echo "FAIL {$label}: missing {$expected} in {$headerName}\n";
}

function expect_data_key_absent(string $label, array $result, string $key): void
{
    global $passed, $failed;
    if (!array_key_exists($key, $result['json']['data'] ?? [])) {
        $passed++;
        echo "PASS {$label}\n";
        return;
    }
    $failed++;
    echo "FAIL {$label}: {$key} was exposed\n";
}

function expect_multipart(string $label, string $path, array $fields, string $fieldName, string $filePath, int $expected, ?string $token = null): array
{
    global $passed, $failed;
    $result = multipart_request($path, $fields, $fieldName, $filePath, $token);
    if ($result['status'] === $expected) {
        $passed++;
        echo "PASS {$label} ({$result['status']})\n";
    } else {
        $failed++;
        echo "FAIL {$label}: expected {$expected}, got {$result['status']}. {$result['raw']}\n";
    }
    return $result;
}

function data_id(array $result): string
{
    return (string) ($result['json']['data']['id'] ?? '');
}

function token_from_login(string $email, string $password): array
{
    $login = expect_status("login {$email}", 'POST', '/auth/login', 200, ['email' => $email, 'password' => $password]);
    return [
        $login['json']['data']['accessToken'] ?? '',
        $login['json']['data']['refreshToken'] ?? '',
    ];
}

function latest_otp(string $phone, string $purpose): string
{
    $log = dirname(__DIR__) . '/storage/logs/otp.log';
    if (!is_file($log)) {
        return '';
    }
    $lines = array_reverse(file($log, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES) ?: []);
    foreach ($lines as $line) {
        if (str_contains($line, "{$purpose} {$phone} ")) {
            $parts = explode(' ', trim($line));
            return end($parts) ?: '';
        }
    }
    return '';
}

$suffix = date('His') . random_int(100, 999);

expect_status('health', 'GET', '/health', 200);
$preflight = expect_status('cors preflight', 'OPTIONS', '/admin/offices', 204, null, null, [
    'Origin: http://localhost:8080',
    'Access-Control-Request-Headers: X-Gate-Token, Content-Type',
]);
expect_header_contains('cors allows gate token header', $preflight, 'Access-Control-Allow-Headers', 'X-Gate-Token');
expect_status('unsupported media type rejected', 'POST', '/auth/login', 415, 'email=x', null, ['Content-Type: text/plain']);
expect_status('invalid login rejected', 'POST', '/auth/login', 401, ['email' => 'admin@officegate.com', 'password' => 'wrong-password']);

[$adminToken, $adminRefresh] = token_from_login('admin@officegate.com', 'ChangeMe@12345');
[$securityToken] = token_from_login('security@officegate.com', 'ChangeMe@12345');
[$tenantToken] = token_from_login('tenant@officegate.com', 'ChangeMe@12345');

expect_status('missing auth protected route', 'GET', '/admin/offices', 401);
expect_status('invalid bearer token rejected', 'GET', '/auth/me', 401, null, 'not-a-valid-token');
expect_status('security role denied admin-only offices', 'GET', '/admin/offices', 403, null, $securityToken);
expect_status('auth me', 'GET', '/auth/me', 200, null, $adminToken);
$refreshedAdmin = expect_status('refresh token', 'POST', '/auth/refresh', 200, ['refreshToken' => $adminRefresh]);
$activeAdminRefresh = $refreshedAdmin['json']['data']['refreshToken'] ?? $adminRefresh;
expect_status('change password wrong current rejected', 'PUT', '/auth/change-password', 422, ['currentPassword' => 'wrong', 'newPassword' => 'NewPassword@12345'], $adminToken);

$tempPassword = 'TempPass@' . $suffix;
expect_status('change password revokes sessions', 'PUT', '/auth/change-password', 200, ['currentPassword' => 'ChangeMe@12345', 'newPassword' => $tempPassword], $adminToken);
expect_status('old refresh token rejected after password change', 'POST', '/auth/refresh', 401, ['refreshToken' => $activeAdminRefresh]);
expect_status('change password restore seed password', 'PUT', '/auth/change-password', 200, ['currentPassword' => $tempPassword, 'newPassword' => 'ChangeMe@12345'], $adminToken);

$otpPhone = '+9198' . random_int(10000000, 99999999);
expect_status('otp send', 'POST', '/auth/otp/send', 200, ['phone' => $otpPhone, 'purpose' => 'visitor-entry']);
$otp = latest_otp($otpPhone, 'visitor-entry');
expect_status('otp verify', 'POST', '/auth/otp/verify', 200, ['phone' => $otpPhone, 'purpose' => 'visitor-entry', 'otp' => $otp]);

expect_status('ui settings save', 'PUT', '/ui-settings', 200, ['page' => 'dashboard', 'settings' => ['cards' => ['summary']]], $adminToken);
expect_status('ui settings read', 'GET', '/ui-settings?page=dashboard', 200, null, $adminToken);

$uploadFile = sys_get_temp_dir() . '/officegate-test-upload.pdf';
file_put_contents($uploadFile, "%PDF-1.4\n1 0 obj\n<<>>\nendobj\ntrailer\n<<>>\n%%EOF\n");
expect_multipart('secure upload', '/uploads', ['module' => 'visitor_photo'], 'file', $uploadFile, 201, $adminToken);

expect_status('admin dashboard summary', 'GET', '/admin/dashboard/summary', 200, null, $adminToken);

$office = expect_status('office create', 'POST', '/admin/offices', 201, [
    'block' => 'BRILEY ONE',
    'floor_number' => 'QA-' . $suffix,
    'company_name' => 'QA COMPANY ' . $suffix,
    'contact_person' => 'QA Admin',
    'contact_phone' => '+91990000' . substr($suffix, -4),
    'allocated_vehicle_count' => 3,
    'status' => 'Active',
], $adminToken);
$officeId = data_id($office);
expect_status('office list', 'GET', '/admin/offices', 200, null, $adminToken);
expect_status('office show', 'GET', "/admin/offices/{$officeId}", 200, null, $adminToken);
expect_status('office update', 'PUT', "/admin/offices/{$officeId}", 200, [
    'block' => 'BRILEY ONE',
    'floor_number' => 'QA-' . $suffix,
    'company_name' => 'QA COMPANY ' . $suffix,
    'contact_person' => 'QA Manager',
    'allocated_vehicle_count' => 4,
    'status' => 'Active',
], $adminToken);
expect_status('office status patch', 'PATCH', "/admin/offices/{$officeId}/status", 200, ['status' => 'Inactive'], $adminToken);

$visitor = expect_status('visitor entry', 'POST', '/admin/visitors/entry', 201, [
    'name' => 'QA Visitor ' . $suffix,
    'phone' => '+9188' . random_int(10000000, 99999999),
    'block' => 'BRILEY ONE',
    'floor_number' => 'QA-' . $suffix,
    'company_name' => 'QA COMPANY ' . $suffix,
    'whom_to_meet' => 'QA Manager',
    'reason' => 'Endpoint validation',
], $securityToken);
$visitorId = data_id($visitor);
expect_status('visitor list', 'GET', '/admin/visitors', 200, null, $adminToken);
expect_status('visitor active list', 'GET', '/admin/visitors/active', 200, null, $securityToken);
expect_status('visitor show', 'GET', "/admin/visitors/{$visitorId}", 200, null, $adminToken);
expect_status('visitor checkout', 'POST', "/admin/visitors/{$visitorId}/checkout", 200, [], $securityToken);
expect_status('visitor double checkout rejected', 'POST', "/admin/visitors/{$visitorId}/checkout", 409, [], $securityToken);

$vehicleNo = 'TNQA' . substr($suffix, -8);
$vehicle = expect_status('vehicle entry', 'POST', '/admin/vehicles/entry', 201, [
    'vehicle_no' => $vehicleNo,
    'vehicle_type' => '4-Wheeler',
    'owner_name' => 'QA Driver',
    'block' => 'BRILEY ONE',
    'floor_number' => 'QA-' . $suffix,
    'company_name' => 'QA COMPANY ' . $suffix,
    'parking_user_type' => 'Visitor',
], $securityToken);
$vehicleId = data_id($vehicle);
expect_status('vehicle list', 'GET', '/admin/vehicles', 200, null, $adminToken);
expect_status('vehicle active list', 'GET', '/admin/vehicles/active', 200, null, $securityToken);
expect_status('vehicle show', 'GET', "/admin/vehicles/{$vehicleId}", 200, null, $adminToken);
expect_status('duplicate active vehicle rejected', 'POST', '/admin/vehicles/entry', 409, [
    'vehicle_no' => $vehicleNo,
    'vehicle_type' => '4-Wheeler',
], $securityToken);
expect_status('vehicle checkout', 'POST', "/admin/vehicles/{$vehicleId}/checkout", 200, [], $securityToken);

$vendor = expect_status('vendor create', 'POST', '/admin/vendors', 201, [
    'name' => 'QA Vendor ' . $suffix,
    'company' => 'QA Services',
    'service_type' => 'Testing',
    'category' => 'Ad-Hoc Vendors',
    'contact' => '+9177' . random_int(10000000, 99999999),
], $adminToken);
$vendorId = data_id($vendor);
expect_status('vendor list', 'GET', '/admin/vendors', 200, null, $adminToken);
expect_status('vendor show', 'GET', "/admin/vendors/{$vendorId}", 200, null, $adminToken);
expect_status('vendor update', 'PUT', "/admin/vendors/{$vendorId}", 200, [
    'name' => 'QA Vendor Updated ' . $suffix,
    'company' => 'QA Services',
    'service_type' => 'Testing',
    'category' => 'Ad-Hoc Vendors',
    'contact' => '+9177' . random_int(10000000, 99999999),
    'status' => 'Active',
], $adminToken);

$staff = expect_status('staff create', 'POST', '/admin/staff', 201, [
    'name' => 'QA Staff ' . $suffix,
    'role' => 'Security',
    'department' => 'Security',
    'contact' => '+9166' . random_int(10000000, 99999999),
    'join_date' => date('Y-m-d'),
], $adminToken);
$staffId = data_id($staff);
expect_status('staff list', 'GET', '/admin/staff', 200, null, $securityToken);
expect_status('staff update', 'PUT', "/admin/staff/{$staffId}", 200, [
    'name' => 'QA Staff Updated ' . $suffix,
    'role' => 'Security',
    'department' => 'Security',
    'contact' => '+9166' . random_int(10000000, 99999999),
    'join_date' => date('Y-m-d'),
], $adminToken);
expect_status('staff attendance mark', 'POST', "/admin/staff/{$staffId}/attendance", 200, ['date' => date('Y-m-d'), 'status' => 'P'], $securityToken);
expect_status('staff attendance summary', 'GET', '/admin/staff/attendance/summary?date=' . date('Y-m-d'), 200, null, $securityToken);

$inventory = expect_status('inventory create', 'POST', '/admin/inventory', 201, [
    'item_name' => 'QA Item ' . $suffix,
    'category' => 'General',
    'quantity' => 10,
    'unit_cost' => 25.50,
    'vendor' => 'QA Services',
    'purchase_date' => date('Y-m-d'),
], $adminToken);
$inventoryId = data_id($inventory);
expect_status('inventory list', 'GET', '/admin/inventory', 200, null, $adminToken);
expect_status('inventory update', 'PUT', "/admin/inventory/{$inventoryId}", 200, [
    'item_name' => 'QA Item Updated ' . $suffix,
    'category' => 'General',
    'quantity' => 10,
    'unit_cost' => 30,
    'vendor' => 'QA Services',
], $adminToken);
expect_status('inventory movement', 'POST', "/admin/inventory/{$inventoryId}/movements", 200, [
    'movement_type' => 'out',
    'quantity' => 1,
    'location' => 'QA Floor',
    'used_by' => 'QA Staff',
], $adminToken);

$utility = expect_status('utility create', 'POST', '/admin/utilities', 201, [
    'description' => 'QA Utility ' . $suffix,
    'type' => 'General',
    'scheduled_date' => date('Y-m-d', strtotime('+1 day')),
    'assigned_staff' => 'QA Staff',
], $adminToken);
$utilityId = data_id($utility);
expect_status('utility list', 'GET', '/admin/utilities', 200, null, $adminToken);
expect_status('utility update', 'PUT', "/admin/utilities/{$utilityId}", 200, [
    'description' => 'QA Utility Updated ' . $suffix,
    'type' => 'General',
    'scheduled_date' => date('Y-m-d', strtotime('+2 days')),
    'assigned_staff' => 'QA Staff',
    'status' => 'Upcoming',
], $adminToken);
expect_status('utility complete', 'POST', "/admin/utilities/{$utilityId}/complete", 200, [], $adminToken);

$invoice = expect_status('invoice create', 'POST', '/admin/invoices', 201, [
    'office_id' => $officeId,
    'invoice_no' => 'QA-INV-' . $suffix,
    'description' => 'QA Invoice',
    'amount' => 1000,
    'due_date' => date('Y-m-d', strtotime('+15 days')),
], $adminToken);
$invoiceId = data_id($invoice);
expect_status('invoice list', 'GET', '/admin/invoices', 200, null, $adminToken);
expect_status('invoice update', 'PUT', "/admin/invoices/{$invoiceId}", 200, [
    'office_id' => $officeId,
    'invoice_no' => 'QA-INV-' . $suffix,
    'description' => 'QA Invoice Updated',
    'amount' => 1000,
    'due_date' => date('Y-m-d', strtotime('+20 days')),
    'status' => 'Pending',
], $adminToken);
expect_status('invoice payment', 'POST', "/admin/invoices/{$invoiceId}/payments", 200, [
    'amount' => 250,
    'mode' => 'cash',
    'reference_no' => 'QA-PAY-' . $suffix,
], $adminToken);
expect_status('financial summary', 'GET', '/admin/financials/summary', 200, null, $adminToken);

foreach (['visitors', 'vehicles', 'staff-attendance', 'inventory', 'financials'] as $reportType) {
    expect_status("report {$reportType}", 'GET', "/admin/reports/{$reportType}", 200, null, $adminToken);
}

expect_status('security dashboard', 'GET', '/security/dashboard', 200, null, $securityToken);
expect_status('tenant dashboard', 'GET', '/tenant/dashboard', 200, null, $tenantToken);

expect_status('public invalid gate token rejected', 'POST', '/public/scan/visitor-entry?token=invalid-token', 401, [
    'name' => 'Invalid',
    'phone' => '+919812345678',
    'company_name' => 'Invalid',
    'whom_to_meet' => 'Invalid',
    'reason' => 'Invalid',
]);
expect_status('public query gate token rejected', 'POST', '/public/scan/visitor-entry?token=dev-visitor-entry-token', 401, [
    'name' => 'Invalid',
    'phone' => '+919812345679',
    'company_name' => 'Invalid',
    'whom_to_meet' => 'Invalid',
    'reason' => 'Invalid',
]);
expect_status('public body gate token rejected', 'POST', '/public/scan/visitor-entry', 401, [
    'token' => 'dev-visitor-entry-token',
    'name' => 'Invalid',
    'phone' => '+919812345680',
    'company_name' => 'Invalid',
    'whom_to_meet' => 'Invalid',
    'reason' => 'Invalid',
]);

$publicVisitorEntryHeaders = ['X-Gate-Token: dev-visitor-entry-token'];
$publicVisitorCheckoutHeaders = ['X-Gate-Token: dev-visitor-checkout-token'];
$publicVehicleEntryHeaders = ['X-Gate-Token: dev-vehicle-entry-token'];
$publicVehicleCheckoutHeaders = ['X-Gate-Token: dev-vehicle-checkout-token'];

$publicVisitor = expect_status('public visitor entry', 'POST', '/public/scan/visitor-entry', 201, [
    'name' => 'Public Visitor ' . $suffix,
    'phone' => '+9155' . random_int(10000000, 99999999),
    'company_name' => 'QA COMPANY ' . $suffix,
    'whom_to_meet' => 'Reception',
    'reason' => 'Public endpoint validation',
], null, $publicVisitorEntryHeaders);
$publicVisitorCheckoutToken = (string) ($publicVisitor['json']['data']['checkout_token'] ?? '');
expect_data_key_absent('public visitor token hash hidden', $publicVisitor, 'public_checkout_token_hash');
expect_status('public visitor checkout wrong token rejected', 'POST', '/public/scan/visitor-checkout', 401, ['visitor_id' => data_id($publicVisitor), 'checkout_token' => 'wrong-token'], null, $publicVisitorCheckoutHeaders);
expect_status('public visitor checkout', 'POST', '/public/scan/visitor-checkout', 200, ['visitor_id' => data_id($publicVisitor), 'checkout_token' => $publicVisitorCheckoutToken], null, $publicVisitorCheckoutHeaders);
expect_status('public visitor checkout replay rejected', 'POST', '/public/scan/visitor-checkout', 401, ['visitor_id' => data_id($publicVisitor), 'checkout_token' => $publicVisitorCheckoutToken], null, $publicVisitorCheckoutHeaders);

$publicVehicleNo = 'TNPU' . substr($suffix, -8);
$publicVehicle = expect_status('public vehicle entry', 'POST', '/public/scan/vehicle-entry', 201, [
    'vehicle_no' => $publicVehicleNo,
    'vehicle_type' => '2-Wheeler',
    'owner_name' => 'Public Driver',
], null, $publicVehicleEntryHeaders);
$publicVehicleCheckoutToken = (string) ($publicVehicle['json']['data']['checkout_token'] ?? '');
expect_data_key_absent('public vehicle token hash hidden', $publicVehicle, 'public_checkout_token_hash');
expect_status('public duplicate vehicle rejected', 'POST', '/public/scan/vehicle-entry', 409, [
    'vehicle_no' => $publicVehicleNo,
    'vehicle_type' => '2-Wheeler',
], null, $publicVehicleEntryHeaders);
expect_status('public vehicle checkout wrong token rejected', 'POST', '/public/scan/vehicle-checkout', 401, ['vehicle_id' => data_id($publicVehicle), 'checkout_token' => 'wrong-token'], null, $publicVehicleCheckoutHeaders);
expect_status('public vehicle checkout', 'POST', '/public/scan/vehicle-checkout', 200, ['vehicle_id' => data_id($publicVehicle), 'checkout_token' => $publicVehicleCheckoutToken], null, $publicVehicleCheckoutHeaders);
expect_status('public vehicle checkout replay rejected', 'POST', '/public/scan/vehicle-checkout', 401, ['vehicle_id' => data_id($publicVehicle), 'checkout_token' => $publicVehicleCheckoutToken], null, $publicVehicleCheckoutHeaders);

expect_status('logout', 'POST', '/auth/logout', 200, ['refreshToken' => $adminRefresh], $adminToken);

echo "\nEndpoint/security test summary: {$passed} passed, {$failed} failed\n";
exit($failed > 0 ? 1 : 0);
