<?php

declare(strict_types=1);

class DailyWorker extends CrudModel
{
    protected static string $table = 'daily_workers';
    protected static array $columns = [
        'name', 'phone', 'worker_type', 'photo_attachment_id', 'id_proof_attachment_id',
        'address', 'office_id', 'status', 'qr_code',
    ];
    protected static array $searchColumns = ['name', 'phone', 'worker_type', 'address'];

    public const WORKER_TYPES = ['Housekeeping', 'Security', 'Electrician', 'Plumber', 'Carpenter', 'Delivery', 'Gardener', 'General'];
    public const STATUSES     = ['Active', 'Inactive', 'Blacklisted'];

    protected static function filters(Request $request): array
    {
        [$where, $params] = parent::filters($request);
        $conditions = $where !== '' ? [substr($where, 6)] : [];

        if (($request->query['worker_type'] ?? '') !== '') {
            $conditions[] = 'worker_type = :worker_type';
            $params['worker_type'] = $request->query['worker_type'];
        }
        if (($request->query['office_id'] ?? '') !== '') {
            $conditions[] = 'office_id = :office_id';
            $params['office_id'] = (int) $request->query['office_id'];
        }

        return [$conditions ? 'WHERE ' . implode(' AND ', $conditions) : '', $params];
    }

    public static function generateQr(int $id): string
    {
        $qr = 'WRK-' . strtoupper(bin2hex(random_bytes(6)));
        Database::query(
            'UPDATE daily_workers SET qr_code = :qr, updated_at = :now WHERE id = :id',
            ['qr' => $qr, 'now' => db_time(), 'id' => $id]
        );
        return $qr;
    }
}
