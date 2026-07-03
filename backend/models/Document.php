<?php

declare(strict_types=1);

class Document extends CrudModel
{
    protected static string $table = 'documents';
    protected static array $columns = [
        'doc_no', 'title', 'category', 'office_id', 'attachment_id', 'file_name',
        'expiry_date', 'tags', 'status', 'uploaded_by', 'notes',
    ];
    protected static array $searchColumns = ['doc_no', 'title', 'tags', 'file_name', 'notes'];

    public const CATEGORIES = ['Office Documents', 'Legal', 'Financial', 'Compliance', 'Contracts', 'Correspondence', 'Other'];
    public const STATUSES   = ['Active', 'Archived', 'Expired'];

    protected static function filters(Request $request): array
    {
        [$where, $params] = parent::filters($request);
        $conditions = $where !== '' ? [substr($where, 6)] : [];

        if (($request->query['category'] ?? '') !== '') {
            $conditions[] = 'category = :category';
            $params['category'] = $request->query['category'];
        }
        if (($request->query['office_id'] ?? '') !== '') {
            $conditions[] = 'office_id = :office_id';
            $params['office_id'] = (int) $request->query['office_id'];
        }
        // expiring within N days (default 30) when the flag is present
        if (($request->query['expiring_soon'] ?? '') !== '' && $request->query['expiring_soon'] !== '0') {
            $days = (int) ($request->query['expiring_days'] ?? 30);
            if ($days <= 0) {
                $days = 30;
            }
            $conditions[] = "expiry_date IS NOT NULL AND expiry_date <> ''";
            $conditions[] = sql_date('expiry_date') . ' >= :exp_today';
            $conditions[] = sql_date('expiry_date') . ' <= :exp_boundary';
            $params['exp_today'] = date('Y-m-d');
            $params['exp_boundary'] = date('Y-m-d', strtotime("+{$days} day"));
        }

        return [$conditions ? 'WHERE ' . implode(' AND ', $conditions) : '', $params];
    }

    protected static function orderBy(): string
    {
        return 'ORDER BY created_at DESC, id DESC';
    }

    /** Generate the next sequential document number, e.g. DOC-2026-0001. */
    public static function nextDocNo(): string
    {
        $year = date('Y');
        $prefix = 'DOC-' . $year . '-';
        $row = Database::fetch(
            'SELECT doc_no FROM documents WHERE doc_no LIKE :prefix ORDER BY doc_no DESC LIMIT 1',
            ['prefix' => $prefix . '%']
        );
        $next = 1;
        if ($row && preg_match('/(\d+)$/', (string) $row['doc_no'], $m)) {
            $next = ((int) $m[1]) + 1;
        }
        return $prefix . str_pad((string) $next, 4, '0', STR_PAD_LEFT);
    }
}
