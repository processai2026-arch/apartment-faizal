<?php

declare(strict_types=1);

class IotDevice extends CrudModel
{
    protected static string $table = 'iot_devices';

    protected static array $columns = [
        'name', 'device_type', 'protocol', 'ip_address', 'io_lines',
        'api_token', 'location', 'status', 'last_seen_at', 'notes',
    ];

    protected static array $searchColumns = ['name', 'location', 'ip_address', 'device_type'];

    // Never expose the device secret in list/show responses.
    // It is returned exactly once: in the create / regenerate-token response.
    protected static array $hidden = ['api_token'];

    const DEVICE_TYPES = ['lift', 'electrical_board', 'sensor', 'gateway', 'other'];
    const PROTOCOLS = ['http', 'mqtt', 'modbus'];
    const STATUSES = ['Active', 'Inactive'];

    public static function expose(array $row): array
    {
        $row = parent::expose($row);

        $row['id'] = (int) $row['id'];
        $row['io_lines'] = isset($row['io_lines']) && $row['io_lines'] !== null && $row['io_lines'] !== ''
            ? (int) $row['io_lines']
            : null;

        return $row;
    }

    /** Raw row (including id/status) for ingest authentication. */
    public static function findByToken(string $token): ?array
    {
        if ($token === '') {
            return null;
        }

        $row = Database::fetch(
            'SELECT * FROM iot_devices WHERE api_token = :token AND deleted_at IS NULL LIMIT 1',
            ['token' => $token]
        );

        return $row ?: null;
    }

    public static function touchLastSeen(int $id): void
    {
        $now = db_time();
        Database::query(
            'UPDATE iot_devices SET last_seen_at = :seen, updated_at = :updated WHERE id = :id AND deleted_at IS NULL',
            ['seen' => $now, 'updated' => $now, 'id' => $id]
        );
    }

    /**
     * Dashboard summary: totals, offline devices (Active but silent for
     * longer than $offlineMinutes), unacknowledged critical events.
     */
    public static function summary(int $offlineMinutes): array
    {
        $total = (int) (Database::fetch(
            'SELECT COUNT(*) AS cnt FROM iot_devices WHERE deleted_at IS NULL'
        )['cnt'] ?? 0);

        $active = (int) (Database::fetch(
            "SELECT COUNT(*) AS cnt FROM iot_devices WHERE deleted_at IS NULL AND status = 'Active'"
        )['cnt'] ?? 0);

        $cutoff = db_time(time() - max(1, $offlineMinutes) * 60);
        $offlineRows = Database::fetchAll(
            "SELECT * FROM iot_devices
             WHERE deleted_at IS NULL AND status = 'Active'
               AND (last_seen_at IS NULL OR last_seen_at < :cutoff)
             ORDER BY last_seen_at ASC",
            ['cutoff' => $cutoff]
        );
        $offline = array_map(fn (array $row) => static::expose($row), $offlineRows);

        $unackedCritical = (int) (Database::fetch(
            "SELECT COUNT(*) AS cnt FROM iot_events
             WHERE severity = 'critical' AND acknowledged_at IS NULL AND event_type != 'heartbeat'"
        )['cnt'] ?? 0);

        $unacked = (int) (Database::fetch(
            "SELECT COUNT(*) AS cnt FROM iot_events
             WHERE severity IN ('warning', 'critical') AND acknowledged_at IS NULL AND event_type != 'heartbeat'"
        )['cnt'] ?? 0);

        $eventsToday = (int) (Database::fetch(
            'SELECT COUNT(*) AS cnt FROM iot_events WHERE substr(created_at, 1, 10) = :today',
            ['today' => substr(db_time(), 0, 10)]
        )['cnt'] ?? 0);

        return [
            'total_devices' => $total,
            'active_devices' => $active,
            'online_devices' => max(0, $active - count($offline)),
            'offline_devices' => $offline,
            'offline_count' => count($offline),
            'offline_threshold_minutes' => $offlineMinutes,
            'unacknowledged_critical' => $unackedCritical,
            'unacknowledged_alerts' => $unacked,
            'events_today' => $eventsToday,
        ];
    }

    protected static function filters(Request $request): array
    {
        [$where, $params] = parent::filters($request);
        $conditions = $where === '' ? [] : [substr($where, strlen('WHERE '))];

        if (($request->query['device_type'] ?? '') !== '') {
            $conditions[] = 'device_type = :device_type';
            $params['device_type'] = $request->query['device_type'];
        }
        if (($request->query['protocol'] ?? '') !== '') {
            $conditions[] = 'protocol = :protocol';
            $params['protocol'] = $request->query['protocol'];
        }

        return [$conditions ? 'WHERE ' . implode(' AND ', $conditions) : '', $params];
    }
}
