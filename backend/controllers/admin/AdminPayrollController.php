<?php

declare(strict_types=1);

class AdminPayrollController
{
    // ── Payroll runs ─────────────────────────────────────────────────────────

    /** GET /admin/payroll/runs — list runs with payslip counts + totals. */
    public function index(Request $request): void
    {
        [$rows, $total, $page, $perPage] = PayrollRun::list($request);
        $rows = array_map(function (array $run): array {
            $agg = Database::fetch(
                'SELECT COUNT(*) AS staff_count,
                        COALESCE(SUM(net_pay), 0) AS total_net,
                        COALESCE(SUM(gross_pay), 0) AS total_gross,
                        SUM(CASE WHEN paid_at IS NOT NULL THEN 1 ELSE 0 END) AS paid_count
                 FROM payslips WHERE payroll_run_id = :id AND deleted_at IS NULL',
                ['id' => (int) $run['id']]
            );
            $run['staff_count'] = (int) ($agg['staff_count'] ?? 0);
            $run['total_net']   = (float) ($agg['total_net'] ?? 0);
            $run['total_gross'] = (float) ($agg['total_gross'] ?? 0);
            $run['paid_count']  = (int) ($agg['paid_count'] ?? 0);
            return $run;
        }, $rows);
        Response::paginated($rows, $total, $page, $perPage);
    }

    /** GET /admin/payroll/runs/{id} — run + its payslips. */
    public function show(Request $request): void
    {
        $run = PayrollRun::find((int) $request->params['id']);
        if (!$run) {
            throw new AppException('Payroll run not found', 404);
        }
        $run['payslips'] = Payslip::forRun((int) $run['id']);
        Response::success($run);
    }

    /**
     * POST /admin/payroll/runs {periodMonth}
     * Creates a Draft run and generates a payslip per active staff member.
     * Present/absent days are derived from staff_attendance (P/A/H) for the month.
     */
    public function generate(Request $request): void
    {
        Validator::require($request->all(), ['period_month']);
        $period = (string) $request->input('period_month');
        if (!preg_match('/^\d{4}-\d{2}$/', $period)) {
            throw new AppException('period_month must be YYYY-MM', 422);
        }

        $run = PayrollRun::create([
            'period_month' => $period,
            'status'       => 'Draft',
            'generated_by' => (int) $request->user['id'],
            'notes'        => $request->input('notes') ?: null,
        ]);

        $daysInMonth = (int) date('t', (int) strtotime($period . '-01'));
        $staff = Database::fetchAll(
            "SELECT id, base_salary FROM staff WHERE deleted_at IS NULL AND status = 'Active'"
        );

        $generated = 0;
        foreach ($staff as $member) {
            $staffId = (int) $member['id'];
            $baseSalary = (float) ($member['base_salary'] ?? 0);

            $counts = Database::fetch(
                'SELECT
                    SUM(CASE WHEN status = :p THEN 1 ELSE 0 END) AS present,
                    SUM(CASE WHEN status = :a THEN 1 ELSE 0 END) AS absent,
                    SUM(CASE WHEN status = :h THEN 1 ELSE 0 END) AS half
                 FROM staff_attendance
                 WHERE staff_id = :sid AND ' . sql_month('attendance_date') . ' = :period',
                ['p' => 'P', 'a' => 'A', 'h' => 'H', 'sid' => $staffId, 'period' => $period]
            );
            $present = (int) ($counts['present'] ?? 0);
            $absent  = (int) ($counts['absent'] ?? 0);
            $half    = (int) ($counts['half'] ?? 0);
            $recorded = $present + $absent + $half;

            if ($recorded > 0) {
                $paidDays = $present + 0.5 * $half;
            } else {
                // No attendance recorded — assume the staff worked the full month.
                $present  = $daysInMonth;
                $absent   = 0;
                $paidDays = $daysInMonth;
            }

            $baseProrated = $daysInMonth > 0 ? $baseSalary * $paidDays / $daysInMonth : $baseSalary;
            $gross = round($baseProrated, 2);
            $net   = $gross; // no allowances/deductions yet at generation time

            Payslip::create([
                'payroll_run_id' => (int) $run['id'],
                'staff_id'       => $staffId,
                'period_month'   => $period,
                'base_salary'    => $baseSalary,
                'present_days'   => $present,
                'paid_days'      => $paidDays,
                'absent_days'    => $absent,
                'overtime_amount' => 0,
                'allowances'     => 0,
                'deductions'     => 0,
                'gross_pay'      => $gross,
                'net_pay'        => $net,
                'payment_method' => 'Bank Transfer',
            ]);
            $generated++;
        }

        AuditService::log((int) $request->user['id'], 'payroll_run.generate', 'payroll_run', (int) $run['id'], [
            'period_month' => $period,
            'payslips'     => $generated,
        ]);

        $run['payslips'] = Payslip::forRun((int) $run['id']);
        Response::success($run, "Generated {$generated} payslip(s)", 201);
    }

    /** POST /admin/payroll/runs/{id}/finalize */
    public function finalize(Request $request): void
    {
        $run = PayrollRun::find((int) $request->params['id']);
        if (!$run) {
            throw new AppException('Payroll run not found', 404);
        }
        $updated = PayrollRun::update((int) $run['id'], ['status' => 'Finalized']);
        AuditService::log((int) $request->user['id'], 'payroll_run.finalize', 'payroll_run', (int) $run['id']);
        Response::success($updated, 'Payroll run finalized');
    }

    /** POST /admin/payroll/runs/{id}/pay — mark run + all unpaid payslips paid. */
    public function markRunPaid(Request $request): void
    {
        $run = PayrollRun::find((int) $request->params['id']);
        if (!$run) {
            throw new AppException('Payroll run not found', 404);
        }
        Database::query(
            'UPDATE payslips SET paid_at = :paid_at, updated_at = :updated_at
             WHERE payroll_run_id = :id AND paid_at IS NULL AND deleted_at IS NULL',
            ['paid_at' => db_time(), 'updated_at' => db_time(), 'id' => (int) $run['id']]
        );
        $updated = PayrollRun::update((int) $run['id'], ['status' => 'Paid']);
        AuditService::log((int) $request->user['id'], 'payroll_run.pay', 'payroll_run', (int) $run['id']);
        $updated['payslips'] = Payslip::forRun((int) $run['id']);
        Response::success($updated, 'Payroll run marked paid');
    }

    // ── Payslips ─────────────────────────────────────────────────────────────

    /** GET /admin/payroll/payslips/{id} */
    public function showPayslip(Request $request): void
    {
        $slip = Payslip::find((int) $request->params['id']);
        if (!$slip) {
            throw new AppException('Payslip not found', 404);
        }
        Response::success($slip);
    }

    /** PUT /admin/payroll/payslips/{id} — adjust components, recompute gross/net. */
    public function updatePayslip(Request $request): void
    {
        $slip = Payslip::find((int) $request->params['id']);
        if (!$slip) {
            throw new AppException('Payslip not found', 404);
        }
        if ($request->input('payment_method') !== null && $request->input('payment_method') !== '') {
            Validator::enum((string) $request->input('payment_method'), Payslip::PAYMENT_METHODS, 'payment_method');
        }

        $data = [];
        foreach (['overtime_amount', 'allowances', 'deductions'] as $field) {
            if ($request->input($field) !== null) {
                $data[$field] = (float) $request->input($field);
            }
        }
        if ($request->input('payment_method') !== null && $request->input('payment_method') !== '') {
            $data['payment_method'] = (string) $request->input('payment_method');
        }
        if ($request->input('notes') !== null) {
            $data['notes'] = $request->input('notes') ?: null;
        }

        // Recompute gross/net from the merged components.
        $merged = array_merge($slip, $data);
        $data = array_merge($data, Payslip::recompute($merged));

        $updated = Payslip::update((int) $slip['id'], $data);
        AuditService::log((int) $request->user['id'], 'payslip.update', 'payslip', (int) $slip['id']);
        Response::success($updated, 'Payslip updated');
    }

    /** POST /admin/payroll/payslips/{id}/pay */
    public function payPayslip(Request $request): void
    {
        $slip = Payslip::find((int) $request->params['id']);
        if (!$slip) {
            throw new AppException('Payslip not found', 404);
        }
        $data = ['paid_at' => db_time()];
        if ($request->input('payment_method') !== null && $request->input('payment_method') !== '') {
            Validator::enum((string) $request->input('payment_method'), Payslip::PAYMENT_METHODS, 'payment_method');
            $data['payment_method'] = (string) $request->input('payment_method');
        }
        $updated = Payslip::update((int) $slip['id'], $data);
        AuditService::log((int) $request->user['id'], 'payslip.pay', 'payslip', (int) $slip['id']);
        Response::success($updated, 'Payslip marked paid');
    }

    // ── Summary ──────────────────────────────────────────────────────────────

    /** GET /admin/payroll/summary — current month payout + paid/pending. */
    public function summary(Request $request): void
    {
        $period = (string) ($request->query['period_month'] ?? date('Y-m'));

        $agg = Database::fetch(
            'SELECT COALESCE(SUM(net_pay), 0) AS month_payout,
                    COUNT(*) AS payslip_count,
                    SUM(CASE WHEN paid_at IS NOT NULL THEN 1 ELSE 0 END) AS paid_count,
                    COALESCE(SUM(CASE WHEN paid_at IS NOT NULL THEN net_pay ELSE 0 END), 0) AS paid_amount,
                    COALESCE(SUM(CASE WHEN paid_at IS NULL THEN net_pay ELSE 0 END), 0) AS pending_amount
             FROM payslips WHERE period_month = :period AND deleted_at IS NULL',
            ['period' => $period]
        );

        $staffCount = (int) (Database::fetch(
            "SELECT COUNT(*) AS c FROM staff WHERE deleted_at IS NULL AND status = 'Active'"
        )['c'] ?? 0);

        $payslipCount = (int) ($agg['payslip_count'] ?? 0);
        $paidCount = (int) ($agg['paid_count'] ?? 0);

        Response::success([
            'period_month'   => $period,
            'month_payout'   => (float) ($agg['month_payout'] ?? 0),
            'staff_count'    => $staffCount,
            'payslip_count'  => $payslipCount,
            'paid_count'     => $paidCount,
            'pending_count'  => $payslipCount - $paidCount,
            'paid_amount'    => (float) ($agg['paid_amount'] ?? 0),
            'pending_amount' => (float) ($agg['pending_amount'] ?? 0),
        ]);
    }
}
