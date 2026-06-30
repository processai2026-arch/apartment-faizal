<?php

declare(strict_types=1);

class Validator
{
    public static function require(array $data, array $fields): void
    {
        $missing = [];
        foreach ($fields as $field) {
            if (!array_key_exists($field, $data) || self::isBlank($data[$field])) {
                $missing[$field] = 'Required';
            }
        }
        if ($missing) {
            throw new AppException('Validation failed', 422, $missing);
        }
    }

    private static function isBlank(mixed $value): bool
    {
        if (is_array($value)) {
            return $value === [];
        }
        return trim((string) $value) === '';
    }

    public static function email(?string $email): ?string
    {
        $email = strtolower(trim((string) $email));
        if ($email === '') {
            return null;
        }
        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            throw new AppException('Invalid email address', 422);
        }
        return $email;
    }

    public static function phone(?string $phone): ?string
    {
        $phone = preg_replace('/\s+/', '', trim((string) $phone));
        if ($phone === '') {
            return null;
        }
        if (!preg_match('/^\+?[0-9]{8,15}$/', $phone)) {
            throw new AppException('Invalid phone number', 422);
        }
        return $phone;
    }

    public static function enum(string $value, array $allowed, string $field): string
    {
        if (!in_array($value, $allowed, true)) {
            throw new AppException("Invalid {$field}", 422, [$field => $allowed]);
        }
        return $value;
    }

    public static function page(Request $request): array
    {
        $page = max(1, (int) ($request->query['page'] ?? 1));
        $perPage = min(100, max(1, (int) ($request->query['perPage'] ?? 25)));
        return [$page, $perPage, ($page - 1) * $perPage];
    }

    public static function vehicleNo(string $vehicleNo): string
    {
        $value = strtoupper(preg_replace('/[^A-Z0-9]/i', '', $vehicleNo));
        if (strlen($value) < 4 || strlen($value) > 20) {
            throw new AppException('Invalid vehicle number', 422);
        }
        return $value;
    }

    /**
     * Strip HTML tags and encode special characters to prevent XSS in stored text.
     */
    public static function sanitizeString(string $value): string
    {
        return htmlspecialchars(strip_tags($value), ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
    }

    /**
     * Validate email format (returns bool, does not throw).
     */
    public static function validateEmail(string $email): bool
    {
        return (bool) filter_var($email, FILTER_VALIDATE_EMAIL);
    }

    /**
     * Validate phone number (7-15 digits, optional leading +). Returns bool.
     */
    public static function validatePhone(string $phone): bool
    {
        return (bool) preg_match('/^\+?[0-9]{7,15}$/', preg_replace('/\s+/', '', $phone));
    }

    /**
     * Validate URL: must be http or https. Returns bool.
     */
    public static function validateUrl(string $url): bool
    {
        if (!filter_var($url, FILTER_VALIDATE_URL)) {
            return false;
        }
        $scheme = strtolower((string) parse_url($url, PHP_URL_SCHEME));
        return in_array($scheme, ['http', 'https'], true);
    }

    /**
     * Enforce a maximum string length. Throws AppException if exceeded.
     */
    public static function maxLength(string $value, int $max, string $field): void
    {
        if (mb_strlen($value, 'UTF-8') > $max) {
            throw new AppException("{$field} must not exceed {$max} characters", 422, [$field => "Max {$max} characters"]);
        }
    }

    /**
     * Validate uploaded file MIME type against an allowed list. Returns bool.
     */
    public static function validateFileType(string $mimeType, array $allowedTypes): bool
    {
        return in_array($mimeType, $allowedTypes, true);
    }
}
