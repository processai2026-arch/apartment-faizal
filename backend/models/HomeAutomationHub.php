<?php

declare(strict_types=1);

class HomeAutomationHub extends CrudModel
{
    protected static string $table = 'home_automation_hubs';

    protected static array $columns = [
        'name', 'owner_user_id', 'office_id', 'provider', 'base_url', 'access_token',
        'status', 'last_check_at', 'last_check_ok', 'notes',
    ];

    protected static array $searchColumns = ['name', 'base_url', 'notes'];

    // The HA long-lived token is a bearer credential: never expose it.
    protected static array $hidden = ['access_token'];

    public const PROVIDERS = ['home_assistant'];
    public const STATUSES = ['Active', 'Disabled'];

    public static function expose(array $row): array
    {
        // Mask BEFORE the parent strips the hidden column.
        $token = (string) ($row['access_token'] ?? '');
        $row = parent::expose($row);

        $row['id'] = (int) $row['id'];
        $row['owner_user_id'] = isset($row['owner_user_id']) && $row['owner_user_id'] !== null && $row['owner_user_id'] !== ''
            ? (int) $row['owner_user_id']
            : null;
        $row['office_id'] = isset($row['office_id']) && $row['office_id'] !== null && $row['office_id'] !== ''
            ? (int) $row['office_id']
            : null;
        $row['last_check_ok'] = isset($row['last_check_ok']) && $row['last_check_ok'] !== null && $row['last_check_ok'] !== ''
            ? (int) $row['last_check_ok']
            : null;
        $row['access_token_masked'] = $token !== '' ? substr($token, 0, 3) . '***' : null;

        return $row;
    }

    /** Raw row INCLUDING the access token — internal proxy use only. Never echo it. */
    public static function rawFind(int $id): ?array
    {
        $row = Database::fetch(
            'SELECT * FROM home_automation_hubs WHERE id = :id AND deleted_at IS NULL LIMIT 1',
            ['id' => $id]
        );
        return $row ?: null;
    }

    public static function recordCheck(int $id, bool $ok): void
    {
        Database::query(
            'UPDATE home_automation_hubs SET last_check_at = :at, last_check_ok = :ok, updated_at = :updated
             WHERE id = :id AND deleted_at IS NULL',
            ['at' => db_time(), 'ok' => $ok ? 1 : 0, 'updated' => db_time(), 'id' => $id]
        );
    }

    /** Hubs owned by a given user (tenant view). */
    public static function forOwner(int $userId): array
    {
        $rows = Database::fetchAll(
            "SELECT * FROM home_automation_hubs
             WHERE deleted_at IS NULL AND status = 'Active' AND owner_user_id = :uid
             ORDER BY name ASC",
            ['uid' => $userId]
        );
        return array_map(fn (array $row) => static::expose($row), $rows);
    }

    /** All non-deleted hubs (admin shared view). */
    public static function allActive(): array
    {
        $rows = Database::fetchAll(
            "SELECT * FROM home_automation_hubs WHERE deleted_at IS NULL AND status = 'Active' ORDER BY name ASC"
        );
        return array_map(fn (array $row) => static::expose($row), $rows);
    }

    protected static function filters(Request $request): array
    {
        [$where, $params] = parent::filters($request);
        $conditions = $where === '' ? [] : [substr($where, strlen('WHERE '))];

        if (($request->query['owner_user_id'] ?? '') !== '') {
            $conditions[] = 'owner_user_id = :owner_user_id';
            $params['owner_user_id'] = (int) $request->query['owner_user_id'];
        }

        return [$conditions ? 'WHERE ' . implode(' AND ', $conditions) : '', $params];
    }

    protected static function orderBy(): string
    {
        return 'ORDER BY name ASC, id DESC';
    }
}
