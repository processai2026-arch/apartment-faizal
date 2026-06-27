<?php

declare(strict_types=1);

class RateLimiter
{
    public static function hit(string $key, int $limit, int $windowSeconds): void
    {
        $dir = STORAGE_PATH . '/rate-limit';
        if (!is_dir($dir)) {
            mkdir($dir, 0775, true);
        }
        $file = $dir . '/' . hash('sha256', $key) . '.json';
        $now = time();
        $data = is_file($file) ? json_decode(file_get_contents($file) ?: '[]', true) : [];
        $hits = array_values(array_filter($data['hits'] ?? [], fn ($ts) => $ts > $now - $windowSeconds));
        if (count($hits) >= $limit) {
            throw new AppException('Too many requests', 429);
        }
        $hits[] = $now;
        file_put_contents($file, json_encode(['hits' => $hits], JSON_UNESCAPED_SLASHES), LOCK_EX);
    }
}
