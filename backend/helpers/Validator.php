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
}
