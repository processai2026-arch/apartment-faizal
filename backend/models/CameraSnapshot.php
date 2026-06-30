<?php

declare(strict_types=1);

class CameraSnapshot extends CrudModel
{
    protected static string $table = 'camera_snapshots';

    protected static array $columns = [
        'camera_id', 'file_path', 'file_url', 'captured_at',
        'trigger', 'event_id', 'notes',
    ];

    protected static array $searchColumns = ['trigger', 'notes'];

    public static function expose(array $row): array
    {
        $row['id']         = (int) $row['id'];
        $row['camera_id']  = (int) $row['camera_id'];
        $row['event_id']   = isset($row['event_id']) ? (int) $row['event_id'] : null;
        $row['file_path']  = $row['file_path']  ?? null;
        $row['file_url']   = $row['file_url']   ?? null;
        $row['notes']      = $row['notes']      ?? null;

        return $row;
    }

    protected static function filters(Request $request): array
    {
        $where  = [];
        $params = [];

        if (($request->query['camera_id'] ?? '') !== '') {
            $where[]             = 'camera_id = :camera_id';
            $params['camera_id'] = (int) $request->query['camera_id'];
        }

        return [$where ? 'WHERE ' . implode(' AND ', $where) : '', $params];
    }

    protected static function orderBy(): string
    {
        return 'ORDER BY captured_at DESC';
    }

    public static function getLatestForCamera(int $cameraId): ?array
    {
        $row = Database::fetch(
            'SELECT * FROM camera_snapshots WHERE camera_id = :cid ORDER BY captured_at DESC LIMIT 1',
            ['cid' => $cameraId]
        );

        return $row ? static::expose($row) : null;
    }
}
