<?php

declare(strict_types=1);

$backendFrontController = dirname(__DIR__, 2) . '/backend/public/index.php';
if (!is_file($backendFrontController)) {
    http_response_code(500);
    header('Content-Type: application/json');
    echo json_encode([
        'success' => false,
        'message' => 'Backend front controller not found',
    ], JSON_UNESCAPED_SLASHES);
    exit;
}

require $backendFrontController;
