<?php

declare(strict_types=1);

class Response
{
    public static function success(mixed $data = null, string $message = 'OK', int $status = 200, array $meta = []): void
    {
        self::json(['success' => true, 'message' => $message, 'data' => $data, 'meta' => $meta], $status);
    }

    public static function error(string $message, int $status = 400, array $errors = []): void
    {
        self::json(['success' => false, 'message' => $message, 'errors' => (object) $errors], $status);
    }

    public static function paginated(array $items, int $total, int $page, int $perPage): void
    {
        self::success($items, 'OK', 200, [
            'pagination' => [
                'page' => $page,
                'perPage' => $perPage,
                'total' => $total,
                'totalPages' => (int) ceil($total / max(1, $perPage)),
            ],
        ]);
    }

    private static function json(array $payload, int $status): void
    {
        if (!headers_sent()) {
            http_response_code($status);
            header('Content-Type: application/json; charset=utf-8');
        }
        echo json_encode($payload, JSON_UNESCAPED_SLASHES);
        exit;
    }
}
