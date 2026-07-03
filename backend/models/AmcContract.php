<?php

declare(strict_types=1);

class AmcContract extends CrudModel
{
    protected static string $table = 'amc_contracts';
    protected static array $columns = [
        'contract_no', 'title', 'contract_type', 'vendor_id', 'vendor_name',
        'start_date', 'end_date', 'amount', 'payment_frequency', 'reminder_days',
        'document_attachment_id', 'status', 'notes',
    ];
    protected static array $searchColumns = ['contract_no', 'title', 'vendor_name', 'contract_type'];

    public const TYPES       = ['AMC', 'DG Maintenance', 'Lift AMC', 'Fire Safety', 'Other'];
    public const FREQUENCIES = ['Monthly', 'Quarterly', 'Half-Yearly', 'Yearly', 'One-Time'];
    public const STATUSES    = ['Active', 'Expired', 'Cancelled'];

    protected static function filters(Request $request): array
    {
        [$where, $params] = parent::filters($request);
        $conditions = $where !== '' ? [substr($where, 6)] : [];

        if (($request->query['contract_type'] ?? '') !== '') {
            $conditions[] = 'contract_type = :contract_type';
            $params['contract_type'] = $request->query['contract_type'];
        }
        if (($request->query['vendor_id'] ?? '') !== '') {
            $conditions[] = 'vendor_id = :vendor_id';
            $params['vendor_id'] = (int) $request->query['vendor_id'];
        }

        return [$conditions ? 'WHERE ' . implode(' AND ', $conditions) : '', $params];
    }

    /** Generate the next sequential contract number, e.g. AMC-2026-0001. */
    public static function nextContractNo(): string
    {
        $year = date('Y');
        $prefix = 'AMC-' . $year . '-';
        $row = Database::fetch(
            'SELECT contract_no FROM amc_contracts WHERE contract_no LIKE :prefix ORDER BY contract_no DESC LIMIT 1',
            ['prefix' => $prefix . '%']
        );
        $next = 1;
        if ($row && preg_match('/(\d+)$/', (string) $row['contract_no'], $m)) {
            $next = ((int) $m[1]) + 1;
        }
        return $prefix . str_pad((string) $next, 4, '0', STR_PAD_LEFT);
    }

    /**
     * Active contracts whose end_date falls within each contract's own
     * reminder window (or is already past — overdue renewals surface too).
     */
    public static function expiring(): array
    {
        $windowEnd = Database::driver() === 'mysql'
            ? 'DATE_ADD(CURDATE(), INTERVAL reminder_days DAY)'
            : "date('now', '+' || reminder_days || ' days')";

        return Database::fetchAll(
            "SELECT * FROM amc_contracts
             WHERE deleted_at IS NULL
               AND status = 'Active'
               AND end_date IS NOT NULL
               AND " . sql_date('end_date') . " <= {$windowEnd}
             ORDER BY " . sql_date('end_date') . ' ASC, id ASC'
        );
    }
}
