<?php

declare(strict_types=1);

class PayrollRun extends CrudModel
{
    protected static string $table = 'payroll_runs';
    protected static array $columns = ['period_month', 'status', 'generated_by', 'notes'];
    protected static array $searchColumns = ['period_month', 'notes'];

    public const STATUSES = ['Draft', 'Finalized', 'Paid'];

    protected static function filters(Request $request): array
    {
        [$where, $params] = parent::filters($request);
        $conditions = $where !== '' ? [substr($where, 6)] : [];

        if (($request->query['period_month'] ?? '') !== '') {
            $conditions[] = 'period_month = :period_month';
            $params['period_month'] = $request->query['period_month'];
        }

        return [$conditions ? 'WHERE ' . implode(' AND ', $conditions) : '', $params];
    }

    protected static function orderBy(): string
    {
        return 'ORDER BY period_month DESC, id DESC';
    }
}
