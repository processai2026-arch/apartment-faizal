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

$isProduction = config('app.env') === 'production';
foreach (['app.jwt_access_secret', 'app.jwt_refresh_secret'] as $secretKey) {
    $secret = (string) config($secretKey);
    $unsafeProductionSecret = $isProduction && (
        str_starts_with($secret, 'dev-only') ||
        str_starts_with(strtolower($secret), 'replace-with') ||
        str_starts_with($secret, 'REPLACE_')
    );
    if (strlen($secret) < 32 || str_starts_with($secret, 'change-this') || $unsafeProductionSecret) {
        throw new AppException('JWT secrets must be configured with strong values', 500);
    }
}
if ($isProduction && config('app.otp_driver') === 'log') {
    throw new AppException('OTP_DRIVER=log is not allowed in production', 500);
}
if ($isProduction && in_array('*', config('app.trusted_proxies', []), true)) {
    throw new AppException('TRUSTED_PROXIES=* is not allowed in production', 500);
}

$router = new Router();

require BASE_PATH . '/routes/api.php';

$router->dispatch(Request::capture());
