<?php

declare(strict_types=1);

class EbLog extends CrudModel
{
    protected static string $table = 'eb_logs';
    protected static array $columns = [
        'log_date', 'meter_start', 'meter_end', 'power_cut_minutes', 'generator_note', 'notes', 'created_by',
    ];
    protected static array $searchColumns = ['generator_note', 'notes'];

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
            'SELECT * FROM eb_logs WHERE deleted_at IS NULL AND log_date = :date ORDER BY id ASC',
            ['date' => $date]
        );
    }
}
