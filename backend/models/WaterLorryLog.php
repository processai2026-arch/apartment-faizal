<?php

declare(strict_types=1);

class WaterLorryLog extends CrudModel
{
    protected static string $table = 'water_lorry_logs';
    protected static array $columns = [
        'log_date', 'supplier_name', 'vehicle_no', 'capacity_litres', 'trips', 'amount', 'notes', 'created_by',
    ];
    protected static array $searchColumns = ['supplier_name', 'vehicle_no', 'notes'];

    protected static function filters(Request $request): array
    {
        [$where, $params] = parent::filters($request);
        $conditions = $where !== '' ? [substr($where, 6)] : [];

        if (($request->query['date'] ?? '') !== '') {
            $conditions[] = 'log_date = :log_date';
            $params['log_date'] = $request->query['date'];
        }
        if (($request->query['from_date'] ?? '') !== '') {
            $conditions[] = 'log_date >= :from_date';
            $params['from_date'] = $request->query['from_date'];
        }
        if (($request->query['to_date'] ?? '') !== '') {
            $conditions[] = 'log_date <= :to_date';
            $params['to_date'] = $request->query['to_date'];
        }

        return [$conditions ? 'WHERE ' . implode(' AND ', $conditions) : '', $params];
    }

    public static function forDate(string $date): array
    {
        return Database::fetchAll(
            'SELECT * FROM water_lorry_logs WHERE deleted_at IS NULL AND log_date = :date ORDER BY id ASC',
            ['date' => $date]
        );
    }

    public static function totalsForDate(string $date): array
    {
        $row = Database::fetch(
            'SELECT COUNT(*) AS entries,
                    COALESCE(SUM(trips), 0) AS total_trips,
                    COALESCE(SUM(capacity_litres * trips), 0) AS total_litres,
                    COALESCE(SUM(amount), 0) AS total_amount
             FROM water_lorry_logs WHERE deleted_at IS NULL AND log_date = :date',
            ['date' => $date]
        );

        return [
            'entries'      => (int) ($row['entries'] ?? 0),
            'total_trips'  => (int) ($row['total_trips'] ?? 0),
            'total_litres' => (float) ($row['total_litres'] ?? 0),
            'total_amount' => (float) ($row['total_amount'] ?? 0),
        ];
    }
}
