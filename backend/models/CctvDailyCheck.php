<?php

declare(strict_types=1);

/**
 * Daily CCTV working-status checks. One row per camera per day
 * (UNIQUE(check_date, camera_id)); no soft delete, so this does
 * not extend CrudModel.
 */
class CctvDailyCheck
{
    public const STATUSES = ['Working', 'Faulty', 'Offline'];

    /** Insert or update the check for a camera on a date (unique key upsert). */
    public static function upsert(string $checkDate, int $cameraId, string $status, ?string $remarks, int $checkedBy): array
    {
        $params = [
            'check_date' => $checkDate,
            'camera_id'  => $cameraId,
            'status'     => $status,
            'remarks'    => $remarks,
            'checked_by' => $checkedBy,
            'created_at' => db_time(),
        ];

        if (Database::driver() === 'mysql') {
            Database::query(
                'INSERT INTO cctv_daily_checks (check_date, camera_id, status, remarks, checked_by, created_at)
                 VALUES (:check_date, :camera_id, :status, :remarks, :checked_by, :created_at)
                 ON DUPLICATE KEY UPDATE status = VALUES(status), remarks = VALUES(remarks), checked_by = VALUES(checked_by)',
                $params
            );
        } else {
            Database::query(
                'INSERT INTO cctv_daily_checks (check_date, camera_id, status, remarks, checked_by, created_at)
                 VALUES (:check_date, :camera_id, :status, :remarks, :checked_by, :created_at)
                 ON CONFLICT(check_date, camera_id) DO UPDATE SET status = excluded.status, remarks = excluded.remarks, checked_by = excluded.checked_by',
                $params
            );
        }

        return Database::fetch(
            'SELECT * FROM cctv_daily_checks WHERE check_date = :date AND camera_id = :cid LIMIT 1',
            ['date' => $checkDate, 'cid' => $cameraId]
        ) ?: [];
    }

    /** Every active camera with its check (if any) for the date. */
    public static function checklistForDate(string $checkDate): array
    {
        return Database::fetchAll(
            'SELECT cd.id AS camera_id, cd.name AS camera_name, cd.location, cd.zone,
                    c.id AS check_id, c.status, c.remarks, c.checked_by, c.created_at
             FROM camera_devices cd
             LEFT JOIN cctv_daily_checks c ON c.camera_id = cd.id AND c.check_date = :date
             WHERE cd.deleted_at IS NULL AND cd.is_active = 1
             ORDER BY cd.name ASC',
            ['date' => $checkDate]
        );
    }

    /** Summary counts for the date: total cameras, checked, and per-status. */
    public static function summaryForDate(string $checkDate): array
    {
        $total = (int) Database::fetch(
            'SELECT COUNT(*) AS c FROM camera_devices WHERE deleted_at IS NULL AND is_active = 1'
        )['c'];

        $rows = Database::fetchAll(
            'SELECT c.status, COUNT(*) AS cnt FROM cctv_daily_checks c
             INNER JOIN camera_devices cd ON cd.id = c.camera_id AND cd.deleted_at IS NULL AND cd.is_active = 1
             WHERE c.check_date = :date GROUP BY c.status',
            ['date' => $checkDate]
        );

        $summary = ['total_cameras' => $total, 'checked' => 0, 'working' => 0, 'faulty' => 0, 'offline' => 0];
        foreach ($rows as $row) {
            $summary['checked'] += (int) $row['cnt'];
            $key = strtolower((string) $row['status']);
            if (array_key_exists($key, $summary)) {
                $summary[$key] = (int) $row['cnt'];
            }
        }
        $summary['unchecked'] = max(0, $total - $summary['checked']);

        return $summary;
    }
}
