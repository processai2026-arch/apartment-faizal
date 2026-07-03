<?php

declare(strict_types=1);

class AdminMedicalController
{
    /** GET /admin/medical — filters staff/type/result/search + due_checkup, paginated. */
    public function index(Request $request): void
    {
        [$rows, $total, $page, $perPage] = MedicalReport::list($request);
        $rows = array_map(fn (array $row) => MedicalReport::withRelations($row), $rows);
        Response::paginated($rows, $total, $page, $perPage);
    }

    /** GET /admin/medical/{id} */
    public function show(Request $request): void
    {
        $report = MedicalReport::find((int) $request->params['id']);
        if (!$report) {
            throw new AppException('Medical report not found', 404);
        }
        Response::success(MedicalReport::withRelations($report));
    }

    /** POST /admin/medical — auto report_no, optional scanned attachment. */
    public function store(Request $request): void
    {
        Validator::require($request->all(), ['person_name', 'report_type', 'report_date']);
        Validator::enum((string) $request->input('report_type'), MedicalReport::TYPES, 'report_type');
        if ($request->input('result') !== null && $request->input('result') !== '') {
            Validator::enum((string) $request->input('result'), MedicalReport::RESULTS, 'result');
        }

        $report = MedicalReport::create([
            'report_no'         => MedicalReport::nextReportNo(),
            'staff_id'          => $request->input('staff_id') ? (int) $request->input('staff_id') : null,
            'person_name'       => (string) $request->input('person_name'),
            'report_type'       => (string) $request->input('report_type'),
            'report_date'       => (string) $request->input('report_date'),
            'provider'          => $request->input('provider') ?: null,
            'summary'           => $request->input('summary') ?: null,
            'result'            => $request->input('result') ?: 'N/A',
            'next_checkup_date' => $request->input('next_checkup_date') ?: null,
            'attachment_id'     => $request->input('attachment_id') ? (int) $request->input('attachment_id') : null,
            'confidential'      => $request->input('confidential') === false || $request->input('confidential') === '0' ? 0 : 1,
            'recorded_by'       => (int) $request->user['id'],
            'notes'             => $request->input('notes') ?: null,
        ]);
        AuditService::log((int) $request->user['id'], 'medical_report.create', 'medical_report', (int) $report['id']);
        Response::success(MedicalReport::withRelations($report), 'Medical report recorded', 201);
    }

    /** PUT /admin/medical/{id} */
    public function update(Request $request): void
    {
        $report = MedicalReport::find((int) $request->params['id']);
        if (!$report) {
            throw new AppException('Medical report not found', 404);
        }
        if ($request->input('report_type') !== null && $request->input('report_type') !== '') {
            Validator::enum((string) $request->input('report_type'), MedicalReport::TYPES, 'report_type');
        }
        if ($request->input('result') !== null && $request->input('result') !== '') {
            Validator::enum((string) $request->input('result'), MedicalReport::RESULTS, 'result');
        }

        $data = array_filter([
            'staff_id'          => $request->input('staff_id') !== null ? ($request->input('staff_id') ? (int) $request->input('staff_id') : null) : null,
            'person_name'       => $request->input('person_name'),
            'report_type'       => $request->input('report_type'),
            'report_date'       => $request->input('report_date'),
            'provider'          => $request->input('provider'),
            'summary'           => $request->input('summary'),
            'result'            => $request->input('result'),
            'next_checkup_date' => $request->input('next_checkup_date'),
            'attachment_id'     => $request->input('attachment_id') ? (int) $request->input('attachment_id') : null,
            'notes'             => $request->input('notes'),
        ], fn ($v) => $v !== null);

        if ($request->input('confidential') !== null) {
            $data['confidential'] = ($request->input('confidential') === false || $request->input('confidential') === '0' || $request->input('confidential') === 0) ? 0 : 1;
        }

        $updated = MedicalReport::update((int) $report['id'], $data);
        AuditService::log((int) $request->user['id'], 'medical_report.update', 'medical_report', (int) $updated['id']);
        Response::success(MedicalReport::withRelations($updated), 'Medical report updated');
    }

    /** DELETE /admin/medical/{id} — soft delete. */
    public function destroy(Request $request): void
    {
        $report = MedicalReport::find((int) $request->params['id']);
        if (!$report) {
            throw new AppException('Medical report not found', 404);
        }
        MedicalReport::softDelete((int) $report['id']);
        AuditService::log((int) $request->user['id'], 'medical_report.delete', 'medical_report', (int) $report['id']);
        Response::success([], 'Medical report removed');
    }

    /** GET /admin/medical/summary — totals + fit/unfit + checkups due within 30 days. */
    public function summary(Request $request): void
    {
        $counts = Database::fetch(
            "SELECT COUNT(*) AS total,
                    SUM(CASE WHEN result = 'Fit' THEN 1 ELSE 0 END) AS fit,
                    SUM(CASE WHEN result = 'Unfit' THEN 1 ELSE 0 END) AS unfit,
                    SUM(CASE WHEN result = 'Follow-up' THEN 1 ELSE 0 END) AS follow_up
             FROM medical_reports WHERE deleted_at IS NULL"
        );

        $checkupsDue = (int) (Database::fetch(
            'SELECT COUNT(*) AS c FROM medical_reports
             WHERE deleted_at IS NULL AND next_checkup_date IS NOT NULL
               AND ' . sql_date('next_checkup_date') . ' >= ' . sql_current_date() . '
               AND ' . sql_date('next_checkup_date') . ' <= ' . MedicalReport::dueCutoff()
        )['c'] ?? 0);

        $byType = Database::fetchAll(
            "SELECT report_type, COUNT(*) AS count FROM medical_reports
             WHERE deleted_at IS NULL GROUP BY report_type"
        );

        Response::success([
            'total'        => (int) ($counts['total'] ?? 0),
            'fit'          => (int) ($counts['fit'] ?? 0),
            'unfit'        => (int) ($counts['unfit'] ?? 0),
            'follow_up'    => (int) ($counts['follow_up'] ?? 0),
            'checkups_due' => $checkupsDue,
            'by_type'      => $byType,
        ]);
    }
}
