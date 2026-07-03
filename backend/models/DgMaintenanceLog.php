<?php

declare(strict_types=1);

class DgMaintenanceLog extends CrudModel
{
    protected static string $table = 'dg_maintenance_logs';
    protected static array $columns = [
        'log_date', 'dg_name', 'run_hours', 'diesel_added_litres', 'diesel_cost',
        'service_performed', 'next_service_date', 'performed_by', 'remarks', 'attachment_id',
    ];
    protected static array $searchColumns = ['dg_name', 'service_performed', 'performed_by', 'remarks'];

    protected static function filters(Request $request): array
    {
        [$where, $params] = parent::filters($request);
        $conditions = $where !== '' ? [substr($where, 6)] : [];

        if (($request->query['dg_name'] ?? '') !== '') {
            $conditions[] = 'dg_name = :dg_name';
            $params['dg_name'] = $request->query['dg_name'];
        }
        if (($request->query['from'] ?? '') !== '') {
            $conditions[] = sql_date('log_date') . ' >= :from_date';
            $params['from_date'] = $request->query['from'];
        }
        if (($request->query['to'] ?? '') !== '') {
            $conditions[] = sql_date('log_date') . ' <= :to_date';
            $params['to_date'] = $request->query['to'];
        }

        return [$conditions ? 'WHERE ' . implode(' AND ', $conditions) : '', $params];
    }

    protected static function orderBy(): string
    {
        return 'ORDER BY log_date DESC, id DESC';
    }
}
