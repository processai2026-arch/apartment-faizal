<?php

declare(strict_types=1);

class SecretaryPermission
{
    public const TABLE = 'secretary_permissions';

    public const MODULES = [
        'complaints',
        'maintenance',
        'visitors',
        'vendors',
        'rentals',
        'announcements',
        'emergency_contacts',
        'daily_workers',
        'reports',
        'payments',
        'occupancy',
    ];

    /**
     * Return all permission rows for a user, keyed by module.
     */
    public static function getForUser(int $userId): array
    {
        $rows = Database::fetchAll(
            'SELECT * FROM ' . self::TABLE . ' WHERE user_id = :user_id',
            ['user_id' => $userId]
        );

        $result = [];
        foreach ($rows as $row) {
            $result[$row['module']] = [
                'id'       => (int) $row['id'],
                'module'   => $row['module'],
                'canView'  => (bool)(int) $row['can_view'],
                'canEdit'  => (bool)(int) $row['can_edit'],
            ];
        }
        return $result;
    }

    /**
     * Upsert all permissions for a secretary. $modules is an array of:
     * [['module' => 'complaints', 'can_view' => 1, 'can_edit' => 0], ...]
     */
    public static function setPermissions(int $userId, array $modules): void
    {
        // Remove existing permissions for this user
        Database::query(
            'DELETE FROM ' . self::TABLE . ' WHERE user_id = :user_id',
            ['user_id' => $userId]
        );

        $now = db_time();
        foreach ($modules as $perm) {
            $module   = (string) ($perm['module'] ?? '');
            $canView  = isset($perm['can_view']) ? (int)(bool) $perm['can_view'] : 1;
            $canEdit  = isset($perm['can_edit']) ? (int)(bool) $perm['can_edit'] : 0;

            if (!in_array($module, self::MODULES, true)) {
                continue;
            }

            Database::query(
                'INSERT INTO ' . self::TABLE . ' (user_id, module, can_view, can_edit, created_at, updated_at)
                 VALUES (:user_id, :module, :can_view, :can_edit, :created_at, :updated_at)',
                [
                    'user_id'    => $userId,
                    'module'     => $module,
                    'can_view'   => $canView,
                    'can_edit'   => $canEdit,
                    'created_at' => $now,
                    'updated_at' => $now,
                ]
            );
        }
    }

    /**
     * Check if a secretary has permission for a module and action ('view' | 'edit').
     */
    public static function hasPermission(int $userId, string $module, string $action = 'view'): bool
    {
        $row = Database::fetch(
            'SELECT can_view, can_edit FROM ' . self::TABLE . ' WHERE user_id = :user_id AND module = :module LIMIT 1',
            ['user_id' => $userId, 'module' => $module]
        );

        if (!$row) {
            return false;
        }

        if ($action === 'edit') {
            return (bool)(int) $row['can_edit'];
        }

        return (bool)(int) $row['can_view'];
    }
}
