<?php

declare(strict_types=1);

class NameTransfer extends CrudModel
{
    protected static string $table = 'name_transfers';
    protected static array $columns = [
        'transfer_no', 'office_id', 'from_name', 'to_name', 'to_contact_person',
        'to_phone', 'to_email', 'reason', 'effective_date', 'status',
        'supporting_doc_attachment_id', 'requested_by', 'approved_by', 'notes',
    ];
    protected static array $searchColumns = ['transfer_no', 'from_name', 'to_name', 'to_contact_person', 'to_phone'];

    public const STATUSES = ['Pending', 'Approved', 'Rejected', 'Completed'];

    protected static function filters(Request $request): array
    {
        [$where, $params] = parent::filters($request);
        $conditions = $where !== '' ? [substr($where, 6)] : [];

        if (($request->query['office_id'] ?? '') !== '') {
            $conditions[] = 'office_id = :office_id';
            $params['office_id'] = (int) $request->query['office_id'];
        }

        return [$conditions ? 'WHERE ' . implode(' AND ', $conditions) : '', $params];
    }

    protected static function orderBy(): string
    {
        return 'ORDER BY created_at DESC, id DESC';
    }

    /** Generate the next sequential transfer number, e.g. NT-2026-0001. */
    public static function nextTransferNo(): string
    {
        $year = date('Y');
        $prefix = 'NT-' . $year . '-';
        $row = Database::fetch(
            'SELECT transfer_no FROM name_transfers WHERE transfer_no LIKE :prefix ORDER BY transfer_no DESC LIMIT 1',
            ['prefix' => $prefix . '%']
        );
        $next = 1;
        if ($row && preg_match('/(\d+)$/', (string) $row['transfer_no'], $m)) {
            $next = ((int) $m[1]) + 1;
        }
        return $prefix . str_pad((string) $next, 4, '0', STR_PAD_LEFT);
    }
}
