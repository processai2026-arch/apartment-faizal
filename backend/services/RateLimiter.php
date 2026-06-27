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
        $handle = fopen($file, 'c+');
        if (!$handle) {
            throw new AppException('Rate limiter unavailable', 500);
        }

        flock($handle, LOCK_EX);
        $raw = stream_get_contents($handle) ?: '[]';
        $data = json_decode($raw, true);
        if (!is_array($data)) {
            $data = [];
        }
        $hits = array_values(array_filter($data['hits'] ?? [], fn ($ts) => $ts > $now - $windowSeconds));
        if (count($hits) >= $limit) {
            flock($handle, LOCK_UN);
            fclose($handle);
            throw new AppException('Too many requests', 429);
        }
        $hits[] = $now;
        ftruncate($handle, 0);
        rewind($handle);
        fwrite($handle, json_encode(['hits' => $hits], JSON_UNESCAPED_SLASHES));
        fflush($handle);
        flock($handle, LOCK_UN);
        fclose($handle);
    }
}
