<?php

declare(strict_types=1);

class IotEvent
{
    const EVENT_TYPES = ['fault', 'voltage_fluctuation', 'status_change', 'heartbeat', 'test'];
    const SEVERITIES = ['info', 'warning', 'critical'];
    const ALERT_SEVERITIES = ['warning', 'critical'];

    public static function present(array $row): array
    {
        $row['id'] = (int) $row['id'];
        $row['device_id'] = (int) $row['device_id'];
        $row['io_line'] = isset($row['io_line']) && $row['io_line'] !== null && $row['io_line'] !== ''
            ? (int) $row['io_line']
            : null;
        $row['acknowledged_by'] = isset($row['acknowledged_by']) ? (int) $row['acknowledged_by'] : null;
        $row['acknowledged_at'] = $row['acknowledged_at'] ?? null;

        return $row;
    }

    /** Insert an event row and return it (presented). */
    public static function record(array $data): array
    {
        $id = Database::insert(
            'INSERT INTO iot_events (device_id, event_type, severity, io_line, value, message, payload, created_at)
             VALUES (:device_id, :event_type, :severity, :io_line, :value, :message, :payload, :created_at)',
            [
                'device_id' => (int) $data['device_id'],
                'event_type' => (string) $data['event_type'],
                'severity' => (string) $data['severity'],
                'io_line' => $data['io_line'] ?? null,
                'value' => $data['value'] ?? null,
                'message' => $data['message'] ?? null,
                'payload' => $data['payload'] ?? null,
                'created_at' => db_time(),
            ]
        );

        return static::find($id) ?? ['id' => $id];
    }

    public static function find(int $id): ?array
    {
        $row = Database::fetch('SELECT * FROM iot_events WHERE id = :id LIMIT 1', ['id' => $id]);

        return $row ? static::present($row) : null;
    }

    /**
     * Repeat-alert suppression: has an alert-worthy event of the same shape
     * (device + event_type + io_line) fired within the cooldown window?
     */
    public static function hasRecentSimilarAlert(int $deviceId, string $eventType, ?int $ioLine, int $cooldownSeconds): bool
    {
        $since = db_time(time() - max(1, $cooldownSeconds));
        $sql = "SELECT id FROM iot_events
                WHERE device_id = :device_id AND event_type = :event_type
                  AND severity IN ('warning', 'critical') AND created_at >= :since";
        $params = ['device_id' => $deviceId, 'event_type' => $eventType, 'since' => $since];

        if ($ioLine === null) {
            $sql .= ' AND io_line IS NULL';
        } else {
            $sql .= ' AND io_line = :io_line';
            $params['io_line'] = $ioLine;
        }

        return (bool) Database::fetch($sql . ' LIMIT 1', $params);
    }

    /** Paginated event list with device name, supporting panel filters. */
    public static function listWithDevice(Request $request): array
    {
        [$page, $perPage, $offset] = Validator::page($request);

        $where = [];
        $params = [];

        if (($request->query['device_id'] ?? '') !== '') {
            $where[] = 'e.device_id = :device_id';
            $params['device_id'] = (int) $request->query['device_id'];
        }
        if (($request->query['event_type'] ?? '') !== '') {
            $where[] = 'e.event_type = :event_type';
            $params['event_type'] = $request->query['event_type'];
        }
        if (($request->query['severity'] ?? '') !== '') {
            $where[] = 'e.severity = :severity';
            $params['severity'] = $request->query['severity'];
        }

        $ack = strtolower((string) ($request->query['acknowledged'] ?? ''));
        if ($ack === 'pending' || $ack === '0' || $ack === 'false') {
            $where[] = 'e.acknowledged_at IS NULL';
        } elseif ($ack === 'acknowledged' || $ack === '1' || $ack === 'true') {
            $where[] = 'e.acknowledged_at IS NOT NULL';
        }

        if (($request->query['date'] ?? '') !== '') {
            $where[] = 'substr(e.created_at, 1, 10) = :date';
            $params['date'] = (string) $request->query['date'];
        }

        $whereClause = $where ? 'WHERE ' . implode(' AND ', $where) : '';
        $base = ' FROM iot_events e LEFT JOIN iot_devices d ON d.id = e.device_id';

        $total = (int) (Database::fetch("SELECT COUNT(*) AS total{$base} {$whereClause}", $params)['total'] ?? 0);
        $rows = Database::fetchAll(
            "SELECT e.*, d.name AS device_name, d.device_type AS device_type{$base} {$whereClause}
             ORDER BY e.created_at DESC, e.id DESC LIMIT {$perPage} OFFSET {$offset}",
            $params
        );

        return [array_map(fn (array $row) => static::present($row), $rows), $total, $page, $perPage];
    }

    public static function acknowledge(int $id, int $userId): array
    {
        $row = static::find($id);
        if (!$row) {
            throw new AppException('Event not found', 404);
        }
        if (!empty($row['acknowledged_at'])) {
            return $row;
        }

        Database::query(
            'UPDATE iot_events SET acknowledged_at = :at, acknowledged_by = :by WHERE id = :id',
            ['at' => db_time(), 'by' => $userId, 'id' => $id]
        );

        return static::find($id) ?? $row;
    }

    public static function recentForDevice(int $deviceId, int $limit = 10): array
    {
        $limit = max(1, min(50, $limit));
        $rows = Database::fetchAll(
            "SELECT * FROM iot_events WHERE device_id = :device_id ORDER BY created_at DESC, id DESC LIMIT {$limit}",
            ['device_id' => $deviceId]
        );

        return array_map(fn (array $row) => static::present($row), $rows);
    }
}
