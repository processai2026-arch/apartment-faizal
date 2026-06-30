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
    'otp_max_attempts' => (int) env('OTP_MAX_ATTEMPTS', 5),
    'otp_resend_cooldown' => (int) env('OTP_RESEND_COOLDOWN_SECONDS', 30),
    'otp_lockout_threshold' => (int) env('OTP_LOCKOUT_THRESHOLD', 3),
    'otp_lockout_window' => (int) env('OTP_LOCKOUT_WINDOW_SECONDS', 900),
    'otp_driver' => env('OTP_DRIVER', 'log'),
    'otp_webhook_url' => env('OTP_WEBHOOK_URL', ''),
    'otp_webhook_token' => env('OTP_WEBHOOK_TOKEN', ''),
    // Razorpay Payment Gateway (P24)
    'razorpay_key_id' => env('RAZORPAY_KEY_ID', ''),
    'razorpay_key_secret' => env('RAZORPAY_KEY_SECRET', ''),
    'razorpay_webhook_secret' => env('RAZORPAY_WEBHOOK_SECRET', ''),
    'razorpay_mode' => env('RAZORPAY_MODE', 'test'),
];
