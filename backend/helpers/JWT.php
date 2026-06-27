<?php

declare(strict_types=1);

class JWT
{
    public static function encode(array $payload, string $secret, int $ttlSeconds): string
    {
        $now = time();
        $payload = array_merge($payload, [
            'iat' => $now,
            'nbf' => $now,
            'exp' => $now + $ttlSeconds,
            'jti' => bin2hex(random_bytes(16)),
        ]);

        $header = ['typ' => 'JWT', 'alg' => 'HS256'];
        $segments = [
            self::base64Url(json_encode($header, JSON_THROW_ON_ERROR)),
            self::base64Url(json_encode($payload, JSON_THROW_ON_ERROR)),
        ];
        $signature = hash_hmac('sha256', implode('.', $segments), $secret, true);
        $segments[] = self::base64Url($signature);

        return implode('.', $segments);
    }

    public static function decode(string $token, string $secret): array
    {
        $parts = explode('.', $token);
        if (count($parts) !== 3) {
            throw new AppException('Invalid token', 401);
        }

        [$header64, $payload64, $signature64] = $parts;
        $expected = self::base64Url(hash_hmac('sha256', $header64 . '.' . $payload64, $secret, true));
        if (!hash_equals($expected, $signature64)) {
            throw new AppException('Invalid token signature', 401);
        }

        $payload = json_decode(self::base64UrlDecode($payload64), true);
        if (!is_array($payload)) {
            throw new AppException('Invalid token payload', 401);
        }

        $now = time();
        if (($payload['nbf'] ?? 0) > $now || ($payload['exp'] ?? 0) < $now) {
            throw new AppException('Token expired', 401);
        }

        return $payload;
    }

    private static function base64Url(string $data): string
    {
        return rtrim(strtr(base64_encode($data), '+/', '-_'), '=');
    }

    private static function base64UrlDecode(string $data): string
    {
        $decoded = base64_decode(strtr($data, '-_', '+/'), true);
        if ($decoded === false) {
            throw new AppException('Invalid token encoding', 401);
        }
        return $decoded;
    }
}
