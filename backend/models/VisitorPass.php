<?php

declare(strict_types=1);

class VisitorPass extends CrudModel
{
    protected static string $table = 'visitor_passes';
    protected static array $columns = [
        'pass_code', 'pass_type', 'visitor_name', 'visitor_phone',
        'host_name', 'host_office_id', 'purpose', 'valid_from', 'valid_until',
        'max_uses', 'used_count', 'status', 'qr_payload',
        'created_by', 'shared_via', 'notes',
    ];
    protected static array $searchColumns = ['visitor_name', 'visitor_phone', 'pass_code', 'host_name'];

    public const PASS_TYPES = ['Temporary', 'One Day', 'Recurring', 'Delivery', 'Worker', 'Guest'];
    public const STATUSES   = ['Active', 'Used', 'Expired', 'Cancelled'];

    protected static function filters(Request $request): array
    {
        [$where, $params] = parent::filters($request);
        $conditions = $where !== '' ? [substr($where, 6)] : [];

        if (($request->query['pass_type'] ?? '') !== '') {
            $conditions[] = 'pass_type = :pass_type';
            $params['pass_type'] = $request->query['pass_type'];
        }

        return [$conditions ? 'WHERE ' . implode(' AND ', $conditions) : '', $params];
    }

    protected static function orderBy(): string
    {
        return 'ORDER BY id DESC';
    }

    /**
     * Generate a unique 12-character uppercase alphanumeric pass code.
     */
    public static function generatePassCode(): string
    {
        $chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
        do {
            $code = '';
            for ($i = 0; $i < 12; $i++) {
                $code .= $chars[random_int(0, strlen($chars) - 1)];
            }
            $existing = Database::fetch(
                'SELECT id FROM visitor_passes WHERE pass_code = :code LIMIT 1',
                ['code' => $code]
            );
        } while ($existing);

        return $code;
    }

    /**
     * Find a pass by its unique pass_code (not by id).
     */
    public static function findByCode(string $code): ?array
    {
        $row = Database::fetch(
            'SELECT * FROM visitor_passes WHERE pass_code = :code AND deleted_at IS NULL LIMIT 1',
            ['code' => $code]
        );
        return $row ? static::expose($row) : null;
    }

    /**
     * Mark all Active passes whose valid_until < now as Expired.
     */
    public static function autoExpire(): void
    {
        Database::query(
            "UPDATE visitor_passes SET status = 'Expired', updated_at = :now
             WHERE status = 'Active' AND valid_until < :now2 AND deleted_at IS NULL",
            ['now' => db_time(), 'now2' => db_time()]
        );
    }

    /**
     * Override create to auto-generate pass_code and qr_payload.
     */
    public static function create(array $data): array
    {
        $data['pass_code']  = static::generatePassCode();
        $data['qr_payload'] = json_encode([
            'pass_code'    => $data['pass_code'],
            'pass_type'    => $data['pass_type'] ?? '',
            'visitor_name' => $data['visitor_name'] ?? '',
            'valid_until'  => $data['valid_until'] ?? '',
        ]);
        $data['used_count'] = 0;
        $data['status']     = 'Active';
        return parent::create($data);
    }

    protected static function expose(array $row): array
    {
        $row['id']         = (string) $row['id'];
        $row['max_uses']   = (int) ($row['max_uses'] ?? 1);
        $row['used_count'] = (int) ($row['used_count'] ?? 0);
        if (isset($row['host_office_id']) && $row['host_office_id'] !== null) {
            $row['host_office_id'] = (int) $row['host_office_id'];
        }
        if (isset($row['created_by']) && $row['created_by'] !== null) {
            $row['created_by'] = (int) $row['created_by'];
        }
        return $row;
    }
}
