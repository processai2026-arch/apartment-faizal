<?php

declare(strict_types=1);

/**
 * Accounts & Compliance hub: consolidated audit report and the suspend list
 * (users / vendors / offices status toggling).
 */
class AdminComplianceController
{
    /**
     * Suspend-list mapping per entity type:
     * entityType => [table, activeValue, suspendedValue, label columns...].
     * Values mirror what each table actually stores:
     *   users.status   'active'  / 'inactive' (CHECK constraint)
     *   vendors.status 'Active'  / 'Inactive'
     *   offices.status 'Active'  / 'Inactive' (CHECK allows 'Vacant' too)
     */
    private const ENTITIES = [
        'user'   => ['users', 'active', 'inactive'],
        'vendor' => ['vendors', 'Active', 'Inactive'],
        'office' => ['offices', 'Active', 'Inactive'],
    ];

    /**
     * GET /admin/reports/audit?from&to — consolidated compliance/audit report.
     */
    public function auditReport(Request $request): void
    {
        $from = (string) ($request->query['from'] ?? date('Y-m-01'));
        $to   = (string) ($request->query['to'] ?? date('Y-m-d'));
        $period = ['from' => $from, 'to' => $to];

        // ── Financial summary ────────────────────────────────────────────
        $invoiceAgg = Database::fetch(
            "SELECT COUNT(*) AS c,
                    COALESCE(SUM(amount), 0) AS billed,
                    COALESCE(SUM(paid_amount), 0) AS collected,
                    COALESCE(SUM(gst_total), 0) AS gst
             FROM invoices
             WHERE deleted_at IS NULL AND status <> 'Cancelled'
               AND " . sql_date('created_at') . ' BETWEEN :from AND :to',
            $period
        );
        $invoiceByStatus = Database::fetchAll(
            'SELECT status, COUNT(*) AS count, COALESCE(SUM(amount), 0) AS amount
             FROM invoices
             WHERE deleted_at IS NULL AND ' . sql_date('created_at') . ' BETWEEN :from AND :to
             GROUP BY status',
            $period
        );
        $paymentsAgg = Database::fetch(
            'SELECT COUNT(*) AS c, COALESCE(SUM(amount), 0) AS amount
             FROM payments
             WHERE ' . sql_date('paid_at') . ' BETWEEN :from AND :to',
            $period
        );
        $expenseAgg = Database::fetch(
            "SELECT COUNT(*) AS c,
                    COALESCE(SUM(amount), 0) AS amount,
                    COALESCE(SUM(gst_amount), 0) AS gst
             FROM office_expenses
             WHERE deleted_at IS NULL AND status <> 'Rejected'
               AND " . sql_date('expense_date') . ' BETWEEN :from AND :to',
            $period
        );
        $expensesByCategory = Database::fetchAll(
            "SELECT category,
                    COUNT(*) AS count,
                    COALESCE(SUM(amount), 0) AS amount,
                    COALESCE(SUM(gst_amount), 0) AS gst
             FROM office_expenses
             WHERE deleted_at IS NULL AND status <> 'Rejected'
               AND " . sql_date('expense_date') . ' BETWEEN :from AND :to
             GROUP BY category
             ORDER BY amount DESC',
            $period
        );

        // ── Inventory snapshot (point-in-time, not period-bound) ─────────
        $inventoryAgg = Database::fetch(
            'SELECT COUNT(*) AS items,
                    COALESCE(SUM(quantity), 0) AS total_quantity,
                    COALESCE(SUM(used_quantity), 0) AS used_quantity,
                    COALESCE(SUM(quantity * unit_cost), 0) AS stock_value
             FROM inventory_items WHERE deleted_at IS NULL'
        );
        $assetsByStatus = Database::fetchAll(
            'SELECT status, COUNT(*) AS count FROM assets WHERE deleted_at IS NULL GROUP BY status'
        );
        $assetTotal = 0;
        foreach ($assetsByStatus as $row) {
            $assetTotal += (int) $row['count'];
        }

        // ── Payroll totals for period (period_month is 'YYYY-MM') ────────
        $monthRange = ['fm' => substr($from, 0, 7), 'tm' => substr($to, 0, 7)];
        $payrollAgg = Database::fetch(
            'SELECT COUNT(*) AS slips,
                    COALESCE(SUM(gross_pay), 0) AS gross,
                    COALESCE(SUM(net_pay), 0) AS net,
                    COALESCE(SUM(CASE WHEN paid_at IS NOT NULL THEN 1 ELSE 0 END), 0) AS paid_slips
             FROM payslips
             WHERE deleted_at IS NULL AND period_month BETWEEN :fm AND :tm',
            $monthRange
        );
        $payrollRuns = (int) (Database::fetch(
            'SELECT COUNT(*) AS c FROM payroll_runs
             WHERE deleted_at IS NULL AND period_month BETWEEN :fm AND :tm',
            $monthRange
        )['c'] ?? 0);

        // ── Documents ─────────────────────────────────────────────────────
        $documentsTotal = (int) (Database::fetch(
            'SELECT COUNT(*) AS c FROM documents WHERE deleted_at IS NULL'
        )['c'] ?? 0);
        $documentsActive = (int) (Database::fetch(
            "SELECT COUNT(*) AS c FROM documents WHERE deleted_at IS NULL AND status = 'Active'"
        )['c'] ?? 0);

        // ── Active AMC contracts ──────────────────────────────────────────
        $activeContracts = Database::fetchAll(
            "SELECT * FROM amc_contracts
             WHERE deleted_at IS NULL AND status = 'Active'
             ORDER BY " . sql_date('end_date') . ' ASC, id ASC'
        );
        $expiringSoon = count(AmcContract::expiring());

        Response::success([
            'period' => $period,
            'financials' => [
                'invoices' => [
                    'count'        => (int) ($invoiceAgg['c'] ?? 0),
                    'billed'       => (float) ($invoiceAgg['billed'] ?? 0),
                    'collected'    => (float) ($invoiceAgg['collected'] ?? 0),
                    'gstCollected' => (float) ($invoiceAgg['gst'] ?? 0),
                    'byStatus'     => $invoiceByStatus,
                ],
                'payments' => [
                    'count'  => (int) ($paymentsAgg['c'] ?? 0),
                    'amount' => (float) ($paymentsAgg['amount'] ?? 0),
                ],
                'expenses' => [
                    'count'      => (int) ($expenseAgg['c'] ?? 0),
                    'amount'     => (float) ($expenseAgg['amount'] ?? 0),
                    'gstPaid'    => (float) ($expenseAgg['gst'] ?? 0),
                    'byCategory' => $expensesByCategory,
                ],
                'netCashFlow' => (float) ($paymentsAgg['amount'] ?? 0) - (float) ($expenseAgg['amount'] ?? 0),
            ],
            'inventory' => [
                'items'         => (int) ($inventoryAgg['items'] ?? 0),
                'totalQuantity' => (float) ($inventoryAgg['total_quantity'] ?? 0),
                'usedQuantity'  => (float) ($inventoryAgg['used_quantity'] ?? 0),
                'stockValue'    => (float) ($inventoryAgg['stock_value'] ?? 0),
                'assets'        => ['total' => $assetTotal, 'byStatus' => $assetsByStatus],
            ],
            'payroll' => [
                'runs'      => $payrollRuns,
                'payslips'  => (int) ($payrollAgg['slips'] ?? 0),
                'grossPay'  => (float) ($payrollAgg['gross'] ?? 0),
                'netPay'    => (float) ($payrollAgg['net'] ?? 0),
                'paidSlips' => (int) ($payrollAgg['paid_slips'] ?? 0),
            ],
            'documents' => ['total' => $documentsTotal, 'active' => $documentsActive],
            'amc' => [
                'active'       => count($activeContracts),
                'expiringSoon' => $expiringSoon,
                'contracts'    => $activeContracts,
            ],
        ]);
    }

    /**
     * GET /admin/compliance/suspended — suspended/inactive users, vendors, offices.
     */
    public function suspended(Request $request): void
    {
        $users = Database::fetchAll(
            "SELECT id, name, email, phone, role, status, updated_at
             FROM users WHERE deleted_at IS NULL AND status = 'inactive'
             ORDER BY id ASC"
        );
        $vendors = Database::fetchAll(
            "SELECT id, name, company, service_type, contact, status, updated_at
             FROM vendors WHERE deleted_at IS NULL AND status = 'Inactive'
             ORDER BY id ASC"
        );
        $offices = Database::fetchAll(
            "SELECT id, block, floor_number, company_name, contact_person, status, updated_at
             FROM offices WHERE deleted_at IS NULL AND status = 'Inactive'
             ORDER BY id ASC"
        );

        Response::success(['users' => $users, 'vendors' => $vendors, 'offices' => $offices]);
    }

    /** POST /admin/compliance/suspend {entityType, id, reason?} */
    public function suspend(Request $request): void
    {
        $this->toggleStatus($request, true);
    }

    /** POST /admin/compliance/unsuspend {entityType, id} */
    public function unsuspend(Request $request): void
    {
        $this->toggleStatus($request, false);
    }

    private function toggleStatus(Request $request, bool $suspend): void
    {
        Validator::require($request->all(), ['entityType', 'id']);
        $type = (string) $request->input('entityType');
        if (!isset(self::ENTITIES[$type])) {
            throw new AppException('Invalid entityType', 422, ['entityType' => array_keys(self::ENTITIES)]);
        }
        [$table, $activeValue, $suspendedValue] = self::ENTITIES[$type];
        $id = (int) $request->input('id');

        $row = Database::fetch("SELECT * FROM {$table} WHERE id = :id AND deleted_at IS NULL LIMIT 1", ['id' => $id]);
        if (!$row) {
            throw new AppException(ucfirst($type) . ' not found', 404);
        }
        if ($type === 'user' && ($row['role'] ?? '') === 'admin') {
            throw new AppException('Admin accounts cannot be suspended from the compliance panel', 403);
        }

        $newStatus = $suspend ? $suspendedValue : $activeValue;
        Database::query(
            "UPDATE {$table} SET status = :status, updated_at = :now WHERE id = :id AND deleted_at IS NULL",
            ['status' => $newStatus, 'now' => db_time(), 'id' => $id]
        );

        AuditService::log(
            (int) $request->user['id'],
            'compliance.' . ($suspend ? 'suspend' : 'unsuspend'),
            $type,
            $id,
            [
                'reason' => $suspend ? ($request->input('reason') ?: null) : null,
                'from'   => $row['status'] ?? null,
                'to'     => $newStatus,
            ]
        );

        Response::success(
            ['entityType' => $type, 'id' => $id, 'status' => $newStatus],
            $suspend ? ucfirst($type) . ' suspended' : ucfirst($type) . ' reactivated'
        );
    }
}
