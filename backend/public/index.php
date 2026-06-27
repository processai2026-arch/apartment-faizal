<?php

declare(strict_types=1);

require_once dirname(__DIR__) . '/core/bootstrap.php';

$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
$allowedOrigins = config('app.cors_allowed_origins', []);
if ($origin && in_array($origin, $allowedOrigins, true)) {
    header('Access-Control-Allow-Origin: ' . $origin);
    header('Vary: Origin');
}

header('Access-Control-Allow-Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Authorization, Content-Type, X-Requested-With, Idempotency-Key, X-Gate-Token');
header('Access-Control-Max-Age: 600');
header('X-Content-Type-Options: nosniff');
header('X-Frame-Options: DENY');
header('Referrer-Policy: no-referrer');
header("Content-Security-Policy: default-src 'none'; frame-ancestors 'none'");

if (($_SERVER['REQUEST_METHOD'] ?? '') === 'OPTIONS') {
    http_response_code(204);
    exit;
}

if (in_array($_SERVER['REQUEST_METHOD'] ?? 'GET', ['POST', 'PUT', 'PATCH'], true)) {
    $contentType = strtolower($_SERVER['CONTENT_TYPE'] ?? '');
    if ($contentType && !str_contains($contentType, 'application/json') && !str_contains($contentType, 'multipart/form-data') && !str_contains($contentType, 'application/x-www-form-urlencoded')) {
        Response::error('Unsupported media type', 415);
    }
}

foreach (['app.jwt_access_secret', 'app.jwt_refresh_secret'] as $secretKey) {
    $secret = (string) config($secretKey);
    $isProduction = config('app.env') === 'production';
    $unsafeProductionSecret = $isProduction && (
        str_starts_with($secret, 'dev-only') ||
        str_starts_with(strtolower($secret), 'replace-with') ||
        str_starts_with($secret, 'REPLACE_')
    );
    if (strlen($secret) < 32 || str_starts_with($secret, 'change-this') || $unsafeProductionSecret) {
        throw new AppException('JWT secrets must be configured with strong values', 500);
    }
}

$router = new Router();

$router->get('/health', [HealthController::class, 'show']);

$router->post('/auth/login', [AuthController::class, 'login'], ['RateLimitMiddleware:10,300']);
$router->post('/auth/otp/send', [AuthController::class, 'sendOtp'], ['RateLimitMiddleware:5,300']);
$router->post('/auth/otp/verify', [AuthController::class, 'verifyOtp'], ['RateLimitMiddleware:10,300']);
$router->post('/auth/refresh', [AuthController::class, 'refresh'], ['RateLimitMiddleware:30,300']);
$router->post('/auth/logout', [AuthController::class, 'logout'], ['AuthMiddleware']);
$router->get('/auth/me', [AuthController::class, 'me'], ['AuthMiddleware']);
$router->put('/auth/change-password', [AuthController::class, 'changePassword'], ['AuthMiddleware']);
$router->get('/ui-settings', [UiSettingsController::class, 'show'], ['AuthMiddleware']);
$router->put('/ui-settings', [UiSettingsController::class, 'update'], ['AuthMiddleware']);
$router->post('/uploads', [UploadController::class, 'store'], ['RoleMiddleware:admin,security']);

$router->get('/admin/dashboard/summary', [AdminDashboardController::class, 'summary'], ['RoleMiddleware:admin']);

$router->get('/admin/offices', [AdminOfficeController::class, 'index'], ['RoleMiddleware:admin']);
$router->post('/admin/offices', [AdminOfficeController::class, 'store'], ['RoleMiddleware:admin']);
$router->get('/admin/offices/{id}', [AdminOfficeController::class, 'show'], ['RoleMiddleware:admin']);
$router->put('/admin/offices/{id}', [AdminOfficeController::class, 'update'], ['RoleMiddleware:admin']);
$router->patch('/admin/offices/{id}/status', [AdminOfficeController::class, 'status'], ['RoleMiddleware:admin']);

$router->get('/admin/visitors', [AdminVisitorController::class, 'index'], ['RoleMiddleware:admin,security']);
$router->post('/admin/visitors/entry', [AdminVisitorController::class, 'store'], ['RoleMiddleware:admin,security']);
$router->get('/admin/visitors/active', [AdminVisitorController::class, 'active'], ['RoleMiddleware:admin,security']);
$router->get('/admin/visitors/{id}', [AdminVisitorController::class, 'show'], ['RoleMiddleware:admin,security']);
$router->post('/admin/visitors/{id}/checkout', [AdminVisitorController::class, 'checkout'], ['RoleMiddleware:admin,security']);

$router->get('/admin/vehicles', [AdminVehicleController::class, 'index'], ['RoleMiddleware:admin,security']);
$router->post('/admin/vehicles/entry', [AdminVehicleController::class, 'store'], ['RoleMiddleware:admin,security']);
$router->get('/admin/vehicles/active', [AdminVehicleController::class, 'active'], ['RoleMiddleware:admin,security']);
$router->get('/admin/vehicles/{id}', [AdminVehicleController::class, 'show'], ['RoleMiddleware:admin,security']);
$router->post('/admin/vehicles/{id}/checkout', [AdminVehicleController::class, 'checkout'], ['RoleMiddleware:admin,security']);

$router->get('/admin/vendors', [AdminVendorController::class, 'index'], ['RoleMiddleware:admin']);
$router->post('/admin/vendors', [AdminVendorController::class, 'store'], ['RoleMiddleware:admin']);
$router->get('/admin/vendors/{id}', [AdminVendorController::class, 'show'], ['RoleMiddleware:admin']);
$router->put('/admin/vendors/{id}', [AdminVendorController::class, 'update'], ['RoleMiddleware:admin']);

$router->get('/admin/staff', [AdminStaffController::class, 'index'], ['RoleMiddleware:admin,security']);
$router->post('/admin/staff', [AdminStaffController::class, 'store'], ['RoleMiddleware:admin']);
$router->put('/admin/staff/{id}', [AdminStaffController::class, 'update'], ['RoleMiddleware:admin']);
$router->post('/admin/staff/{id}/attendance', [AdminStaffController::class, 'markAttendance'], ['RoleMiddleware:admin,security']);
$router->get('/admin/staff/attendance/summary', [AdminStaffController::class, 'attendanceSummary'], ['RoleMiddleware:admin,security']);

$router->get('/admin/inventory', [AdminInventoryController::class, 'index'], ['RoleMiddleware:admin']);
$router->post('/admin/inventory', [AdminInventoryController::class, 'store'], ['RoleMiddleware:admin']);
$router->put('/admin/inventory/{id}', [AdminInventoryController::class, 'update'], ['RoleMiddleware:admin']);
$router->post('/admin/inventory/{id}/movements', [AdminInventoryController::class, 'movement'], ['RoleMiddleware:admin']);

$router->get('/admin/utilities', [AdminUtilityController::class, 'index'], ['RoleMiddleware:admin']);
$router->post('/admin/utilities', [AdminUtilityController::class, 'store'], ['RoleMiddleware:admin']);
$router->put('/admin/utilities/{id}', [AdminUtilityController::class, 'update'], ['RoleMiddleware:admin']);
$router->post('/admin/utilities/{id}/complete', [AdminUtilityController::class, 'complete'], ['RoleMiddleware:admin']);

$router->get('/admin/invoices', [AdminFinanceController::class, 'index'], ['RoleMiddleware:admin']);
$router->post('/admin/invoices', [AdminFinanceController::class, 'store'], ['RoleMiddleware:admin']);
$router->put('/admin/invoices/{id}', [AdminFinanceController::class, 'update'], ['RoleMiddleware:admin']);
$router->post('/admin/invoices/{id}/payments', [AdminFinanceController::class, 'payment'], ['RoleMiddleware:admin']);
$router->get('/admin/financials/summary', [AdminFinanceController::class, 'summary'], ['RoleMiddleware:admin']);

$router->get('/admin/reports/{type}', [AdminReportController::class, 'show'], ['RoleMiddleware:admin']);

$router->get('/security/dashboard', [SecurityController::class, 'dashboard'], ['RoleMiddleware:security,admin']);
$router->get('/tenant/dashboard', [TenantController::class, 'dashboard'], ['RoleMiddleware:tenant']);

$router->post('/public/scan/visitor-entry', [PublicScanController::class, 'visitorEntry'], ['RateLimitMiddleware:20,300', 'GateTokenMiddleware:visitor-entry']);
$router->post('/public/scan/visitor-checkout', [PublicScanController::class, 'visitorCheckout'], ['RateLimitMiddleware:20,300', 'GateTokenMiddleware:visitor-checkout']);
$router->post('/public/scan/vehicle-entry', [PublicScanController::class, 'vehicleEntry'], ['RateLimitMiddleware:20,300', 'GateTokenMiddleware:vehicle-entry']);
$router->post('/public/scan/vehicle-checkout', [PublicScanController::class, 'vehicleCheckout'], ['RateLimitMiddleware:20,300', 'GateTokenMiddleware:vehicle-checkout']);

$router->dispatch(Request::capture());
