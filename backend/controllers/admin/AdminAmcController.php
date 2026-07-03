<?php

declare(strict_types=1);

/**
 * AMC contracts (annual maintenance, DG maintenance, lift, fire safety …)
 * and diesel-generator maintenance logs.
 */
class AdminAmcController
{
    // ── AMC contracts ─────────────────────────────────────────────────────

    public function index(Request $request): void
    {
        [$rows, $total, $page, $perPage] = AmcContract::list($request);
        Response::paginated($rows, $total, $page, $perPage);
    }

    public function show(Request $request): void
    {
        $contract = AmcContract::find((int) $request->params['id']);
        if (!$contract) {
            throw new AppException('Contract not found', 404);
        }
        Response::success($contract);
    }

    public function store(Request $request): void
    {
        Validator::require($request->all(), ['title', 'contract_type', 'start_date', 'end_date']);
        Validator::enum((string) $request->input('contract_type'), AmcContract::TYPES, 'contract_type');
        if ($request->input('payment_frequency') !== null && $request->input('payment_frequency') !== '') {
            Validator::enum((string) $request->input('payment_frequency'), AmcContract::FREQUENCIES, 'payment_frequency');
        }
        if ($request->input('status') !== null && $request->input('status') !== '') {
            Validator::enum((string) $request->input('status'), AmcContract::STATUSES, 'status');
        }

        $contract = AmcContract::create([
            'contract_no'            => AmcContract::nextContractNo(),
            'title'                  => $request->input('title'),
            'contract_type'          => $request->input('contract_type'),
            'vendor_id'              => $request->input('vendor_id') ? (int) $request->input('vendor_id') : null,
            'vendor_name'            => $request->input('vendor_name') ?: null,
            'start_date'             => $request->input('start_date'),
            'end_date'               => $request->input('end_date'),
            'amount'                 => (float) ($request->input('amount') ?: 0),
            'payment_frequency'      => $request->input('payment_frequency') ?: 'Yearly',
            'reminder_days'          => $request->input('reminder_days') !== null && $request->input('reminder_days') !== '' ? (int) $request->input('reminder_days') : 30,
            'document_attachment_id' => $request->input('document_attachment_id') ? (int) $request->input('document_attachment_id') : null,
            'status'                 => $request->input('status') ?: 'Active',
            'notes'                  => $request->input('notes') ?: null,
        ]);
        AuditService::log((int) $request->user['id'], 'amc_contract.create', 'amc_contract', (int) $contract['id']);
        Response::success($contract, 'Contract created', 201);
    }

    public function update(Request $request): void
    {
        $contract = AmcContract::find((int) $request->params['id']);
        if (!$contract) {
            throw new AppException('Contract not found', 404);
        }
        if ($request->input('contract_type') !== null) {
            Validator::enum((string) $request->input('contract_type'), AmcContract::TYPES, 'contract_type');
        }
        if ($request->input('payment_frequency') !== null) {
            Validator::enum((string) $request->input('payment_frequency'), AmcContract::FREQUENCIES, 'payment_frequency');
        }
        if ($request->input('status') !== null) {
            Validator::enum((string) $request->input('status'), AmcContract::STATUSES, 'status');
        }

        $data = array_filter([
            'title'                  => $request->input('title'),
            'contract_type'          => $request->input('contract_type'),
            'vendor_id'              => $request->input('vendor_id') !== null && $request->input('vendor_id') !== '' ? (int) $request->input('vendor_id') : null,
            'vendor_name'            => $request->input('vendor_name'),
            'start_date'             => $request->input('start_date'),
            'end_date'               => $request->input('end_date'),
            'amount'                 => $request->input('amount') !== null ? (float) $request->input('amount') : null,
            'payment_frequency'      => $request->input('payment_frequency'),
            'reminder_days'          => $request->input('reminder_days') !== null ? (int) $request->input('reminder_days') : null,
            'document_attachment_id' => $request->input('document_attachment_id') ? (int) $request->input('document_attachment_id') : null,
            'status'                 => $request->input('status'),
            'notes'                  => $request->input('notes'),
        ], fn ($v) => $v !== null);

        $updated = AmcContract::update((int) $contract['id'], $data);
        AuditService::log((int) $request->user['id'], 'amc_contract.update', 'amc_contract', (int) $updated['id']);
        Response::success($updated, 'Contract updated');
    }

    public function destroy(Request $request): void
    {
        $contract = AmcContract::find((int) $request->params['id']);
        if (!$contract) {
            throw new AppException('Contract not found', 404);
        }
        AmcContract::softDelete((int) $contract['id']);
        AuditService::log((int) $request->user['id'], 'amc_contract.delete', 'amc_contract', (int) $contract['id']);
        Response::success([], 'Contract removed');
    }

    /** GET /admin/amc/expiring — active contracts inside their reminder window. */
    public function expiring(Request $request): void
    {
        Response::success(AmcContract::expiring());
    }

    // ── DG maintenance logs ──────────────────────────────────────────────

    public function dgIndex(Request $request): void
    {
        [$rows, $total, $page, $perPage] = DgMaintenanceLog::list($request);
        Response::paginated($rows, $total, $page, $perPage);
    }

    public function dgStore(Request $request): void
    {
        Validator::require($request->all(), ['log_date']);

        $log = DgMaintenanceLog::create([
            'log_date'            => $request->input('log_date'),
            'dg_name'             => $request->input('dg_name') ?: 'DG-1',
            'run_hours'           => (float) ($request->input('run_hours') ?: 0),
            'diesel_added_litres' => (float) ($request->input('diesel_added_litres') ?: 0),
            'diesel_cost'         => (float) ($request->input('diesel_cost') ?: 0),
            'service_performed'   => $request->input('service_performed') ?: null,
            'next_service_date'   => $request->input('next_service_date') ?: null,
            'performed_by'        => $request->input('performed_by') ?: null,
            'remarks'             => $request->input('remarks') ?: null,
            'attachment_id'       => $request->input('attachment_id') ? (int) $request->input('attachment_id') : null,
        ]);
        AuditService::log((int) $request->user['id'], 'dg_log.create', 'dg_log', (int) $log['id']);
        Response::success($log, 'DG log recorded', 201);
    }

    public function dgUpdate(Request $request): void
    {
        $log = DgMaintenanceLog::find((int) $request->params['id']);
        if (!$log) {
            throw new AppException('DG log not found', 404);
        }

        $data = array_filter([
            'log_date'            => $request->input('log_date'),
            'dg_name'             => $request->input('dg_name'),
            'run_hours'           => $request->input('run_hours') !== null ? (float) $request->input('run_hours') : null,
            'diesel_added_litres' => $request->input('diesel_added_litres') !== null ? (float) $request->input('diesel_added_litres') : null,
            'diesel_cost'         => $request->input('diesel_cost') !== null ? (float) $request->input('diesel_cost') : null,
            'service_performed'   => $request->input('service_performed'),
            'next_service_date'   => $request->input('next_service_date'),
            'performed_by'        => $request->input('performed_by'),
            'remarks'             => $request->input('remarks'),
            'attachment_id'       => $request->input('attachment_id') ? (int) $request->input('attachment_id') : null,
        ], fn ($v) => $v !== null);

        $updated = DgMaintenanceLog::update((int) $log['id'], $data);
        AuditService::log((int) $request->user['id'], 'dg_log.update', 'dg_log', (int) $updated['id']);
        Response::success($updated, 'DG log updated');
    }

    public function dgDestroy(Request $request): void
    {
        $log = DgMaintenanceLog::find((int) $request->params['id']);
        if (!$log) {
            throw new AppException('DG log not found', 404);
        }
        DgMaintenanceLog::softDelete((int) $log['id']);
        AuditService::log((int) $request->user['id'], 'dg_log.delete', 'dg_log', (int) $log['id']);
        Response::success([], 'DG log removed');
    }

    /** GET /admin/dg/summary — run hours + diesel for the current month, next service due. */
    public function dgSummary(Request $request): void
    {
        $monthAgg = Database::fetch(
            'SELECT COUNT(*) AS logs,
                    COALESCE(SUM(run_hours), 0) AS hours,
                    COALESCE(SUM(diesel_added_litres), 0) AS litres,
                    COALESCE(SUM(diesel_cost), 0) AS cost
             FROM dg_maintenance_logs
             WHERE deleted_at IS NULL AND ' . sql_month('log_date') . ' = ' . sql_month_now()
        );

        $nextService = Database::fetch(
            'SELECT dg_name, next_service_date
             FROM dg_maintenance_logs
             WHERE deleted_at IS NULL
               AND next_service_date IS NOT NULL
               AND ' . sql_date('next_service_date') . ' >= ' . sql_current_date() . '
             ORDER BY ' . sql_date('next_service_date') . ' ASC
             LIMIT 1'
        );

        Response::success([
            'month_logs'          => (int) ($monthAgg['logs'] ?? 0),
            'month_run_hours'     => (float) ($monthAgg['hours'] ?? 0),
            'month_diesel_litres' => (float) ($monthAgg['litres'] ?? 0),
            'month_diesel_cost'   => (float) ($monthAgg['cost'] ?? 0),
            'next_service_date'   => $nextService['next_service_date'] ?? null,
            'next_service_dg'     => $nextService['dg_name'] ?? null,
        ]);
    }
}
