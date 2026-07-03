<?php

declare(strict_types=1);

/**
 * Facility & Daily Operations — daily-check entry logs (CCTV, water lorry,
 * EB, housekeeping) plus the aggregated Daily Activity Report that also
 * pulls staff attendance, maintenance/utility schedules and vendor payments
 * from the existing tables.
 */
class AdminDailyOpsController
{
    private function date(Request $request, string $key = 'date'): string
    {
        $date = (string) ($request->query[$key] ?? $request->input($key) ?? date('Y-m-d'));
        if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $date)) {
            throw new AppException('Invalid date, expected YYYY-MM-DD', 422);
        }
        return $date;
    }

    // ── CCTV Daily Checks ─────────────────────────────────────────────────────

    /** GET /admin/daily-ops/cctv-checks?date=YYYY-MM-DD — every camera + its check for the day. */
    public function cctvChecks(Request $request): void
    {
        $date = $this->date($request);
        Response::success([
            'date'    => $date,
            'summary' => CctvDailyCheck::summaryForDate($date),
            'checks'  => CctvDailyCheck::checklistForDate($date),
        ]);
    }

    /** POST /admin/daily-ops/cctv-checks — upsert a single camera check. */
    public function storeCctvCheck(Request $request): void
    {
        Validator::require($request->all(), ['camera_id', 'status']);
        $status = Validator::enum((string) $request->input('status'), CctvDailyCheck::STATUSES, 'status');
        $date = $this->date($request, 'check_date');

        $camera = CameraDevice::find((int) $request->input('camera_id'));
        if (!$camera) {
            throw new AppException('Camera not found', 404);
        }

        $check = CctvDailyCheck::upsert($date, (int) $camera['id'], $status, $request->input('remarks') ?: null, (int) $request->user['id']);
        AuditService::log((int) $request->user['id'], 'cctv_daily_check.upsert', 'cctv_daily_check', (int) ($check['id'] ?? 0), ['status' => $status, 'date' => $date]);
        Response::success($check, 'CCTV check recorded', 201);
    }

    /** POST /admin/daily-ops/cctv-checks/bulk — {check_date, checks: [{camera_id, status, remarks}]}. */
    public function bulkCctvChecks(Request $request): void
    {
        Validator::require($request->all(), ['check_date', 'checks']);
        $date = $this->date($request, 'check_date');
        $checks = $request->input('checks');
        if (!is_array($checks) || $checks === []) {
            throw new AppException('checks must be a non-empty array', 422);
        }

        $saved = 0;
        foreach ($checks as $check) {
            if (!is_array($check) || empty($check['camera_id']) || empty($check['status'])) {
                continue;
            }
            $status = Validator::enum((string) $check['status'], CctvDailyCheck::STATUSES, 'status');
            if (!CameraDevice::find((int) $check['camera_id'])) {
                continue;
            }
            CctvDailyCheck::upsert($date, (int) $check['camera_id'], $status, isset($check['remarks']) && $check['remarks'] !== '' ? (string) $check['remarks'] : null, (int) $request->user['id']);
            $saved++;
        }

        AuditService::log((int) $request->user['id'], 'cctv_daily_check.bulk', 'cctv_daily_check', 0, ['date' => $date, 'saved' => $saved]);
        Response::success([
            'date'    => $date,
            'saved'   => $saved,
            'summary' => CctvDailyCheck::summaryForDate($date),
            'checks'  => CctvDailyCheck::checklistForDate($date),
        ], "{$saved} camera checks recorded");
    }

    // ── Water Lorry Logs ──────────────────────────────────────────────────────

    public function waterLorryIndex(Request $request): void
    {
        [$rows, $total, $page, $perPage] = WaterLorryLog::list($request);
        Response::paginated($rows, $total, $page, $perPage);
    }

    public function waterLorryStore(Request $request): void
    {
        Validator::require($request->all(), ['supplier_name']);
        $log = WaterLorryLog::create([
            'log_date'        => $this->date($request, 'log_date'),
            'supplier_name'   => $request->input('supplier_name'),
            'vehicle_no'      => $request->input('vehicle_no') ?: null,
            'capacity_litres' => $request->input('capacity_litres') !== null && $request->input('capacity_litres') !== '' ? (float) $request->input('capacity_litres') : null,
            'trips'           => $request->input('trips') ? max(1, (int) $request->input('trips')) : 1,
            'amount'          => $request->input('amount') !== null && $request->input('amount') !== '' ? (float) $request->input('amount') : null,
            'notes'           => $request->input('notes') ?: null,
            'created_by'      => (int) $request->user['id'],
        ]);
        AuditService::log((int) $request->user['id'], 'water_lorry_log.create', 'water_lorry_log', (int) $log['id']);
        Response::success($log, 'Water lorry entry recorded', 201);
    }

    public function waterLorryUpdate(Request $request): void
    {
        $log = WaterLorryLog::find((int) $request->params['id']);
        if (!$log) {
            throw new AppException('Log not found', 404);
        }
        $updated = WaterLorryLog::update((int) $log['id'], array_filter([
            'log_date'        => $request->input('log_date'),
            'supplier_name'   => $request->input('supplier_name'),
            'vehicle_no'      => $request->input('vehicle_no'),
            'capacity_litres' => $request->input('capacity_litres') !== null && $request->input('capacity_litres') !== '' ? (float) $request->input('capacity_litres') : null,
            'trips'           => $request->input('trips') !== null ? max(1, (int) $request->input('trips')) : null,
            'amount'          => $request->input('amount') !== null && $request->input('amount') !== '' ? (float) $request->input('amount') : null,
            'notes'           => $request->input('notes'),
        ], fn ($v) => $v !== null));
        AuditService::log((int) $request->user['id'], 'water_lorry_log.update', 'water_lorry_log', (int) $log['id']);
        Response::success($updated, 'Water lorry entry updated');
    }

    public function waterLorryDestroy(Request $request): void
    {
        $log = WaterLorryLog::find((int) $request->params['id']);
        if (!$log) {
            throw new AppException('Log not found', 404);
        }
        WaterLorryLog::softDelete((int) $log['id']);
        AuditService::log((int) $request->user['id'], 'water_lorry_log.delete', 'water_lorry_log', (int) $log['id']);
        Response::success([], 'Water lorry entry removed');
    }

    // ── EB (Electricity) Logs ─────────────────────────────────────────────────

    public function ebIndex(Request $request): void
    {
        [$rows, $total, $page, $perPage] = EbLog::list($request);
        Response::paginated($rows, $total, $page, $perPage);
    }

    public function ebStore(Request $request): void
    {
        $log = EbLog::create([
            'log_date'          => $this->date($request, 'log_date'),
            'meter_start'       => $request->input('meter_start') !== null && $request->input('meter_start') !== '' ? (float) $request->input('meter_start') : null,
            'meter_end'         => $request->input('meter_end') !== null && $request->input('meter_end') !== '' ? (float) $request->input('meter_end') : null,
            'power_cut_minutes' => $request->input('power_cut_minutes') ? max(0, (int) $request->input('power_cut_minutes')) : 0,
            'generator_note'    => $request->input('generator_note') ?: null,
            'notes'             => $request->input('notes') ?: null,
            'created_by'        => (int) $request->user['id'],
        ]);
        AuditService::log((int) $request->user['id'], 'eb_log.create', 'eb_log', (int) $log['id']);
        Response::success($log, 'EB entry recorded', 201);
    }

    public function ebUpdate(Request $request): void
    {
        $log = EbLog::find((int) $request->params['id']);
        if (!$log) {
            throw new AppException('Log not found', 404);
        }
        $updated = EbLog::update((int) $log['id'], array_filter([
            'log_date'          => $request->input('log_date'),
            'meter_start'       => $request->input('meter_start') !== null && $request->input('meter_start') !== '' ? (float) $request->input('meter_start') : null,
            'meter_end'         => $request->input('meter_end') !== null && $request->input('meter_end') !== '' ? (float) $request->input('meter_end') : null,
            'power_cut_minutes' => $request->input('power_cut_minutes') !== null ? max(0, (int) $request->input('power_cut_minutes')) : null,
            'generator_note'    => $request->input('generator_note'),
            'notes'             => $request->input('notes'),
        ], fn ($v) => $v !== null));
        AuditService::log((int) $request->user['id'], 'eb_log.update', 'eb_log', (int) $log['id']);
        Response::success($updated, 'EB entry updated');
    }

    public function ebDestroy(Request $request): void
    {
        $log = EbLog::find((int) $request->params['id']);
        if (!$log) {
            throw new AppException('Log not found', 404);
        }
        EbLog::softDelete((int) $log['id']);
        AuditService::log((int) $request->user['id'], 'eb_log.delete', 'eb_log', (int) $log['id']);
        Response::success([], 'EB entry removed');
    }

    // ── Housekeeping Logs ─────────────────────────────────────────────────────

    public function housekeepingIndex(Request $request): void
    {
        [$rows, $total, $page, $perPage] = HousekeepingLog::list($request);
        Response::paginated($rows, $total, $page, $perPage);
    }

    public function housekeepingStore(Request $request): void
    {
        Validator::require($request->all(), ['area', 'task']);
        $status = $request->input('status')
            ? Validator::enum((string) $request->input('status'), HousekeepingLog::STATUSES, 'status')
            : 'Pending';
        $log = HousekeepingLog::create([
            'log_date'   => $this->date($request, 'log_date'),
            'area'       => $request->input('area'),
            'task'       => $request->input('task'),
            'status'     => $status,
            'staff_name' => $request->input('staff_name') ?: null,
            'remarks'    => $request->input('remarks') ?: null,
            'created_by' => (int) $request->user['id'],
        ]);
        AuditService::log((int) $request->user['id'], 'housekeeping_log.create', 'housekeeping_log', (int) $log['id']);
        Response::success($log, 'Housekeeping entry recorded', 201);
    }

    public function housekeepingUpdate(Request $request): void
    {
        $log = HousekeepingLog::find((int) $request->params['id']);
        if (!$log) {
            throw new AppException('Log not found', 404);
        }
        if ($request->input('status')) {
            Validator::enum((string) $request->input('status'), HousekeepingLog::STATUSES, 'status');
        }
        $updated = HousekeepingLog::update((int) $log['id'], array_filter([
            'log_date'   => $request->input('log_date'),
            'area'       => $request->input('area'),
            'task'       => $request->input('task'),
            'status'     => $request->input('status'),
            'staff_name' => $request->input('staff_name'),
            'remarks'    => $request->input('remarks'),
        ], fn ($v) => $v !== null));
        AuditService::log((int) $request->user['id'], 'housekeeping_log.update', 'housekeeping_log', (int) $log['id']);
        Response::success($updated, 'Housekeeping entry updated');
    }

    public function housekeepingDestroy(Request $request): void
    {
        $log = HousekeepingLog::find((int) $request->params['id']);
        if (!$log) {
            throw new AppException('Log not found', 404);
        }
        HousekeepingLog::softDelete((int) $log['id']);
        AuditService::log((int) $request->user['id'], 'housekeeping_log.delete', 'housekeeping_log', (int) $log['id']);
        Response::success([], 'Housekeeping entry removed');
    }

    // ── Aggregated Daily Report ───────────────────────────────────────────────

    /** GET /admin/daily-ops/report?date=YYYY-MM-DD — combined daily activity report. */
    public function report(Request $request): void
    {
        $date = $this->date($request);

        // CCTV — status of all cameras for the day
        $cctv = CctvDailyCheck::summaryForDate($date);
        $cctv['checks'] = CctvDailyCheck::checklistForDate($date);

        // Water lorry deliveries + totals
        $water = WaterLorryLog::totalsForDate($date);
        $water['logs'] = array_map(fn (array $row) => WaterLorryLog::present($row), WaterLorryLog::forDate($date));

        // EB logs
        $ebLogs = array_map(fn (array $row) => EbLog::present($row), EbLog::forDate($date));
        $powerCutMinutes = 0;
        foreach ($ebLogs as $row) {
            $powerCutMinutes += (int) ($row['power_cut_minutes'] ?? 0);
        }

        // Housekeeping + completion %
        $housekeeping = HousekeepingLog::completionForDate($date);
        $housekeeping['logs'] = array_map(fn (array $row) => HousekeepingLog::present($row), HousekeepingLog::forDate($date));

        // Staff attendance — reuse existing staff_attendance data
        $attendanceRows = Database::fetchAll(
            'SELECT status, COUNT(*) AS total FROM staff_attendance WHERE attendance_date = :date GROUP BY status',
            ['date' => $date]
        );
        $attendance = ['P' => 0, 'A' => 0, 'H' => 0];
        foreach ($attendanceRows as $row) {
            if (isset($attendance[$row['status']])) {
                $attendance[$row['status']] = (int) $row['total'];
            }
        }
        $totalStaff = (int) Database::fetch(
            "SELECT COUNT(*) AS c FROM staff WHERE deleted_at IS NULL AND status = 'Active'"
        )['c'];

        // Maintenance requests due that day (open work only)
        $maintenanceDue = Database::fetchAll(
            "SELECT mr.id, mr.title, mr.category, mr.priority, mr.status, mr.expected_completion,
                    o.block AS office_block, o.company_name AS office_name, s.name AS staff_name
             FROM maintenance_requests mr
             LEFT JOIN offices o ON o.id = mr.office_id
             LEFT JOIN staff s ON s.id = mr.assigned_staff_id
             WHERE mr.deleted_at IS NULL
               AND mr.status NOT IN ('Completed', 'Cancelled')
               AND " . sql_date('mr.expected_completion') . ' = :date
             ORDER BY mr.priority DESC, mr.id ASC',
            ['date' => $date]
        );

        // Utility tasks scheduled that day
        $utilityTasks = Database::fetchAll(
            'SELECT id, description, type, scheduled_date, status, assigned_staff, notes
             FROM utility_tasks
             WHERE deleted_at IS NULL AND ' . sql_date('scheduled_date') . ' = :date
             ORDER BY id ASC',
            ['date' => $date]
        );

        // Vendor payments made that day — from existing payments/invoices tables
        $payments = Database::fetchAll(
            'SELECT p.id, p.invoice_id, p.amount, p.paid_at, p.mode, p.reference_no,
                    i.invoice_no, i.description AS invoice_description
             FROM payments p
             LEFT JOIN invoices i ON i.id = p.invoice_id
             WHERE ' . sql_date('p.paid_at') . ' = :date
             ORDER BY p.id ASC',
            ['date' => $date]
        );
        $paymentsTotal = 0.0;
        foreach ($payments as $row) {
            $paymentsTotal += (float) $row['amount'];
        }

        Response::success([
            'date'         => $date,
            'cctv'         => $cctv,
            'water_lorry'  => $water,
            'eb'           => [
                'logs'                    => $ebLogs,
                'total_power_cut_minutes' => $powerCutMinutes,
            ],
            'housekeeping' => $housekeeping,
            'staff_attendance' => [
                'total_staff' => $totalStaff,
                'present'     => $attendance['P'],
                'absent'      => $attendance['A'],
                'half_day'    => $attendance['H'],
                'unmarked'    => max(0, $totalStaff - $attendance['P'] - $attendance['A'] - $attendance['H']),
            ],
            'maintenance_due' => $maintenanceDue,
            'utility_tasks'   => $utilityTasks,
            'vendor_payments' => [
                'entries'      => count($payments),
                'total_amount' => $paymentsTotal,
                'payments'     => $payments,
            ],
        ]);
    }
}
