<?php

declare(strict_types=1);

class CameraEvent extends CrudModel
{
    protected static string $table = 'camera_events';

    protected static array $columns = [
        'camera_id', 'event_type', 'severity', 'description',
        'snapshot_id', 'metadata', 'acknowledged', 'acknowledged_by',
        'acknowledged_at', 'occurred_at',
    ];

    protected static array $searchColumns = ['event_type', 'description'];

    const EVENT_TYPES = [
        'Motion', 'Unknown Person', 'Vehicle', 'Intrusion',
        'Tamper', 'Offline', 'Online', 'Manual',
    ];

    const SEVERITIES = ['Low', 'Medium', 'High', 'Critical'];

    public static function expose(array $row): array
    {
        $row['id']             = (int) $row['id'];
        $row['camera_id']      = (int) $row['camera_id'];
        $row['snapshot_id']    = isset($row['snapshot_id']) ? (int) $row['snapshot_id'] : null;
        $row['acknowledged']   = (int) ($row['acknowledged']    ?? 0) === 1;
        $row['acknowledged_by'] = isset($row['acknowledged_by']) ? (int) $row['acknowledged_by'] : null;
        $row['acknowledged_at'] = $row['acknowledged_at'] ?? null;
        $row['occurred_at']    = $row['occurred_at'] ?? '';
        $row['created_at']     = $row['created_at'] ?? '';

        return $row;
    }

    protected static function filters(Request $request): array
    {
        $where  = [];
        $params = [];

        if (($request->query['camera_id'] ?? '') !== '') {
            $where[]               = 'camera_id = :camera_id';
            $params['camera_id']   = (int) $request->query['camera_id'];
        }
        if (($request->query['event_type'] ?? '') !== '') {
            $where[]               = 'event_type = :event_type';
            $params['event_type']  = $request->query['event_type'];
        }
        if (($request->query['severity'] ?? '') !== '') {
            $where[]               = 'severity = :severity';
            $params['severity']    = $request->query['severity'];
        }

        return [$where ? 'WHERE ' . implode(' AND ', $where) : '', $params];
    }

    protected static function orderBy(): string
    {
        return 'ORDER BY occurred_at DESC';
    }

    public static function getTimeline(int $cameraId, int $limit = 50): array
    {
        $rows = Database::fetchAll(
            'SELECT * FROM camera_events WHERE camera_id = :cid ORDER BY occurred_at DESC LIMIT :lim',
            ['cid' => $cameraId, 'lim' => $limit]
        );

        return array_map(fn (array $row) => static::expose($row), $rows);
    }
}
