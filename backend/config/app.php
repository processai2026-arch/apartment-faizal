<?php

return [
    'name' => env('APP_NAME', 'OfficeGate API'),
    'env' => env('APP_ENV', 'production'),
    'debug' => filter_var(env('APP_DEBUG', false), FILTER_VALIDATE_BOOLEAN),
    'url' => rtrim(env('APP_URL', ''), '/'),
    'timezone' => env('APP_TIMEZONE', 'Asia/Kolkata'),
    'cors_allowed_origins' => array_values(array_filter(array_map('trim', explode(',', env('CORS_ALLOWED_ORIGINS', ''))))),
    'trusted_proxies' => array_values(array_filter(array_map('trim', explode(',', env('TRUSTED_PROXIES', ''))))),
    'jwt_access_secret' => env('JWT_ACCESS_SECRET'),
    'jwt_refresh_secret' => env('JWT_REFRESH_SECRET'),
    'jwt_access_ttl' => (int) env('JWT_ACCESS_TTL_SECONDS', 900),
    'jwt_refresh_ttl' => (int) env('JWT_REFRESH_TTL_SECONDS', 1209600),
    'otp_ttl' => (int) env('OTP_TTL_SECONDS', 300),
    'otp_driver' => env('OTP_DRIVER', 'log'),
];
