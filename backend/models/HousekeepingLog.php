<?php

declare(strict_types=1);

class HousekeepingLog extends CrudModel
{
    protected static string $table = 'housekeeping_logs';
    protected static array $columns = [
        'log_date', 'area', 'task', 'status', 'staff_name', 'remarks', 'created_by',
    ];
    protected static array $searchColumns = ['area', 'task', 'staff_name', 'remarks'];

    public const STATUSES = ['Done', 'Pending', 'Partial'];

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
            'SELECT * FROM housekeeping_logs WHERE deleted_at IS NULL AND log_date = :date ORDER BY id ASC',
            ['date' => $date]
        );
    }

    /** Completion percentage for a date: Done counts fully, Partial as half. */
    public static function completionForDate(string $date): array
    {
        $rows = Database::fetchAll(
            'SELECT status, COUNT(*) AS cnt FROM housekeeping_logs
             WHERE deleted_at IS NULL AND log_date = :date GROUP BY status',
            ['date' => $date]
        );

        $counts = ['Done' => 0, 'Pending' => 0, 'Partial' => 0];
        $total = 0;
        foreach ($rows as $row) {
            $status = (string) $row['status'];
            if (array_key_exists($status, $counts)) {
                $counts[$status] = (int) $row['cnt'];
            }
            $total += (int) $row['cnt'];
        }

        $completion = $total > 0
            ? round((($counts['Done'] + $counts['Partial'] * 0.5) / $total) * 100, 1)
            : 0.0;

        return [
            'total'        => $total,
            'done'         => $counts['Done'],
            'pending'      => $counts['Pending'],
            'partial'      => $counts['Partial'],
            'completion'   => $completion,
        ];
    }
}
