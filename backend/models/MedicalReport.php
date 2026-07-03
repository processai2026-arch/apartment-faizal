<?php

declare(strict_types=1);

class MedicalReport extends CrudModel
{
    protected static string $table = 'medical_reports';
    protected static array $columns = [
        'report_no', 'staff_id', 'person_name', 'report_type', 'report_date',
        'provider', 'summary', 'result', 'next_checkup_date', 'attachment_id',
        'confidential', 'recorded_by', 'notes',
    ];
    protected static array $searchColumns = ['report_no', 'person_name', 'provider', 'summary'];

    public const TYPES   = ['Fitness Certificate', 'Checkup', 'Injury', 'Insurance', 'Other'];
    public const RESULTS = ['Fit', 'Unfit', 'Follow-up', 'N/A'];

    protected static function filters(Request $request): array
    {
        [$where, $params] = parent::filters($request);
        $conditions = $where !== '' ? [substr($where, 6)] : [];

        if (($request->query['staff_id'] ?? '') !== '') {
            $conditions[] = 'staff_id = :staff_id';
            $params['staff_id'] = (int) $request->query['staff_id'];
        }
        if (($request->query['report_type'] ?? '') !== '') {
            $conditions[] = 'report_type = :report_type';
            $params['report_type'] = $request->query['report_type'];
        }
        if (($request->query['result'] ?? '') !== '') {
            $conditions[] = 'result = :result';
            $params['result'] = $request->query['result'];
        }
        if (($request->query['due_checkup'] ?? '') === '1') {
            $conditions[] = 'next_checkup_date IS NOT NULL AND ' . sql_date('next_checkup_date')
                . ' <= ' . self::dueCutoff(); // within the next 30 days
        }

        return [$conditions ? 'WHERE ' . implode(' AND ', $conditions) : '', $params];
    }

    protected static function orderBy(): string
    {
        return 'ORDER BY report_date DESC, id DESC';
    }

    /** SQL date expression for "today + 30 days" (checkup due window). */
    public static function dueCutoff(): string
    {
        return Database::driver() === 'mysql'
            ? "DATE_ADD(CURDATE(), INTERVAL 30 DAY)"
            : "date('now', '+30 days')";
    }

    /** Row joined with staff + attachment metadata for display/download. */
    protected static function expose(array $row): array
    {
        return $row;
    }

    public static function withRelations(array $row): array
    {
        $attachment = null;
        if (!empty($row['attachment_id'])) {
            $attachment = Database::fetch(
                'SELECT id, original_name, stored_path, mime_type FROM attachments WHERE id = :id',
                ['id' => (int) $row['attachment_id']]
            ) ?: null;
        }
        $row['attachment'] = $attachment;
        return $row;
    }

    /** Generate the next sequential report number, e.g. MED-2026-0001. */
    public static function nextReportNo(): string
    {
        $year = date('Y');
        $prefix = 'MED-' . $year . '-';
        $row = Database::fetch(
            'SELECT report_no FROM medical_reports WHERE report_no LIKE :prefix ORDER BY report_no DESC LIMIT 1',
            ['prefix' => $prefix . '%']
        );
        $next = 1;
        if ($row && preg_match('/(\d+)$/', (string) $row['report_no'], $m)) {
            $next = ((int) $m[1]) + 1;
        }
        return $prefix . str_pad((string) $next, 4, '0', STR_PAD_LEFT);
    }
}
