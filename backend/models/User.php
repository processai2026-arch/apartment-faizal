<?php

declare(strict_types=1);

class User
{
    public static function findByEmail(string $email): ?array
    {
        return Database::fetch('SELECT * FROM users WHERE email = :email AND deleted_at IS NULL LIMIT 1', ['email' => strtolower($email)]);
    }

    public static function findByPhone(string $phone): ?array
    {
        return Database::fetch('SELECT * FROM users WHERE phone = :phone AND deleted_at IS NULL LIMIT 1', ['phone' => $phone]);
    }

    public static function findById(int $id): ?array
    {
        return Database::fetch('SELECT * FROM users WHERE id = :id AND deleted_at IS NULL LIMIT 1', ['id' => $id]);
    }

    public static function public(array $user): array
    {
        return [
            'id' => (int) $user['id'],
            'name' => $user['name'],
            'email' => $user['email'],
            'phone' => $user['phone'],
            'role' => $user['role'],
            'officeId' => isset($user['office_id']) ? ($user['office_id'] ? (int) $user['office_id'] : null) : null,
            'status' => $user['status'],
            'createdAt' => $user['created_at'],
            'isSecretary' => isset($user['is_secretary']) ? (bool)(int) $user['is_secretary'] : false,
            'orgId' => isset($user['org_id']) && $user['org_id'] !== null ? (int) $user['org_id'] : null,
        ];
    }
}
