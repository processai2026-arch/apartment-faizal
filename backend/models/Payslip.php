<?php

declare(strict_types=1);

class Payslip extends CrudModel
{
    protected static string $table = 'payslips';
    protected static array $columns = [
        'payroll_run_id', 'staff_id', 'period_month', 'base_salary',
        'present_days', 'paid_days', 'absent_days', 'overtime_amount',
        'allowances', 'deductions', 'gross_pay', 'net_pay',
        'payment_method', 'paid_at', 'notes',
    ];

    public const PAYMENT_METHODS = ['Bank Transfer', 'Cash', 'Cheque'];

    protected static function filters(Request $request): array
    {
        [$where, $params] = parent::filters($request);
        $conditions = $where !== '' ? [substr($where, 6)] : [];

        if (($request->query['payroll_run_id'] ?? '') !== '') {
            $conditions[] = 'payroll_run_id = :payroll_run_id';
            $params['payroll_run_id'] = (int) $request->query['payroll_run_id'];
        }
        if (($request->query['staff_id'] ?? '') !== '') {
            $conditions[] = 'staff_id = :staff_id';
            $params['staff_id'] = (int) $request->query['staff_id'];
        }

        return [$conditions ? 'WHERE ' . implode(' AND ', $conditions) : '', $params];
    }

    protected static function orderBy(): string
    {
        return 'ORDER BY id ASC';
    }

    /** Payslips for a run, joined with staff name/role for display. */
    public static function forRun(int $runId): array
    {
        $rows = Database::fetchAll(
            'SELECT p.*, s.name AS staff_name, s.role AS staff_role, s.department AS staff_department
             FROM payslips p
             LEFT JOIN staff s ON s.id = p.staff_id
             WHERE p.payroll_run_id = :run_id AND p.deleted_at IS NULL
             ORDER BY s.name ASC, p.id ASC',
            ['run_id' => $runId]
        );
        return array_map(fn (array $row) => static::present($row), $rows);
    }

    /** Recompute gross/net from stored components. */
    public static function recompute(array $slip): array
    {
        $daysInMonth = (int) date('t', (int) strtotime(((string) $slip['period_month']) . '-01'));
        $baseProrated = $daysInMonth > 0
            ? (float) $slip['base_salary'] * (float) $slip['paid_days'] / $daysInMonth
            : (float) $slip['base_salary'];
        $gross = round($baseProrated + (float) $slip['overtime_amount'] + (float) $slip['allowances'], 2);
        $net = round($gross - (float) $slip['deductions'], 2);
        return ['gross_pay' => $gross, 'net_pay' => $net];
    }
}
