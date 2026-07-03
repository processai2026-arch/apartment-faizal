<?php

declare(strict_types=1);

class HomeAutomationDevice extends CrudModel
{
    protected static string $table = 'home_automation_devices';

    protected static array $columns = [
        'hub_id', 'entity_id', 'friendly_name', 'domain', 'is_controllable', 'visible_to_owner',
    ];

    protected static array $searchColumns = ['entity_id', 'friendly_name'];

    public const DOMAINS = ['switch', 'light', 'sensor', 'climate', 'cover', 'other'];
    /** Domains whose entities accept turn_on / turn_off / toggle service calls. */
    public const COMMANDABLE_DOMAINS = ['switch', 'light', 'climate'];
    /** Domains imported by sync-devices. */
    public const SYNC_DOMAINS = ['switch', 'light', 'sensor', 'climate', 'cover'];

    public static function expose(array $row): array
    {
        $row = parent::expose($row);

        $row['id'] = (int) $row['id'];
        $row['hub_id'] = (int) $row['hub_id'];
        $row['is_controllable'] = (int) $row['is_controllable'];
        $row['visible_to_owner'] = (int) $row['visible_to_owner'];

        return $row;
    }

    public static function findByHubAndEntity(int $hubId, string $entityId): ?array
    {
        $row = Database::fetch(
            'SELECT * FROM home_automation_devices
             WHERE hub_id = :hub_id AND entity_id = :entity_id AND deleted_at IS NULL LIMIT 1',
            ['hub_id' => $hubId, 'entity_id' => $entityId]
        );
        return $row ? static::expose($row) : null;
    }

    /** Registered devices for a hub; optionally only those visible to the owner. */
    public static function forHub(int $hubId, bool $visibleOnly = false): array
    {
        $sql = 'SELECT * FROM home_automation_devices WHERE hub_id = :hub_id AND deleted_at IS NULL';
        if ($visibleOnly) {
            $sql .= ' AND visible_to_owner = 1';
        }
        $sql .= ' ORDER BY domain ASC, entity_id ASC';

        $rows = Database::fetchAll($sql, ['hub_id' => $hubId]);
        return array_map(fn (array $row) => static::expose($row), $rows);
    }

    public static function countAll(): int
    {
        return (int) (Database::fetch(
            'SELECT COUNT(*) AS cnt FROM home_automation_devices WHERE deleted_at IS NULL'
        )['cnt'] ?? 0);
    }

    protected static function filters(Request $request): array
    {
        [$where, $params] = parent::filters($request);
        $conditions = $where === '' ? [] : [substr($where, strlen('WHERE '))];

        if (($request->query['hub_id'] ?? '') !== '') {
            $conditions[] = 'hub_id = :hub_id';
            $params['hub_id'] = (int) $request->query['hub_id'];
        }
        if (($request->query['domain'] ?? '') !== '') {
            $conditions[] = 'domain = :domain';
            $params['domain'] = $request->query['domain'];
        }

        return [$conditions ? 'WHERE ' . implode(' AND ', $conditions) : '', $params];
    }

    protected static function orderBy(): string
    {
        return 'ORDER BY hub_id ASC, domain ASC, entity_id ASC';
    }
}
