<?php

declare(strict_types=1);

class CameraDevice extends CrudModel
{
    protected static string $table = 'camera_devices';

    protected static array $columns = [
        'name', 'location', 'zone', 'rtsp_url', 'ip_address', 'port',
        'username', 'password_hash', 'manufacturer', 'model', 'resolution',
        'status', 'last_heartbeat', 'snapshot_url', 'is_recording',
        'is_active', 'notes',
    ];

    protected static array $searchColumns = ['name', 'location', 'zone', 'ip_address'];

    // Never expose password_hash to any caller
    protected static array $hidden = ['password_hash'];

    const ZONES = [
        'Entrance', 'Parking', 'Lobby', 'Corridor',
        'Perimeter', 'Stairwell', 'Rooftop', 'Other',
    ];

    const STATUSES = ['Online', 'Offline', 'Maintenance', 'Fault'];

    public static function expose(array $row): array
    {
        $row = parent::expose($row);

        $row['id']           = (int) $row['id'];
        $row['port']         = isset($row['port']) ? (int) $row['port'] : 554;
        $row['is_recording'] = (int) ($row['is_recording'] ?? 0) === 1;
        $row['is_active']    = (int) ($row['is_active']    ?? 1) === 1;

        return $row;
    }

    public static function getHealthSummary(): array
    {
        $rows = Database::fetchAll(
            'SELECT status, COUNT(*) AS cnt FROM camera_devices WHERE deleted_at IS NULL GROUP BY status'
        );

        $summary = ['Online' => 0, 'Offline' => 0, 'Maintenance' => 0, 'Fault' => 0];
        foreach ($rows as $row) {
            if (isset($summary[$row['status']])) {
                $summary[$row['status']] = (int) $row['cnt'];
            }
        }

        return $summary;
    }

    public static function updateHeartbeat(int $id): void
    {
        $now = db_time();
        Database::query(
            'UPDATE camera_devices SET last_heartbeat = :ts1, status = :status, updated_at = :ts2 WHERE id = :id AND deleted_at IS NULL',
            ['ts1' => $now, 'ts2' => $now, 'status' => 'Online', 'id' => $id]
        );
    }
}
