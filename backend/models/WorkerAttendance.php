<?php

declare(strict_types=1);

class WorkerAttendance extends CrudModel
{
    protected static string $table = 'worker_attendance';
    protected static array $columns = ['worker_id', 'work_date', 'entry_time', 'exit_time', 'status', 'marked_by', 'notes'];

    public const STATUSES = ['Present', 'Absent', 'Half Day', 'Leave'];

    protected static function filters(Request $request): array
    {
        [$where, $params] = parent::filters($request);
        $conditions = $where !== '' ? [substr($where, 6)] : [];

        if (($request->query['worker_id'] ?? '') !== '') {
            $conditions[] = 'worker_id = :worker_id';
            $params['worker_id'] = (int) $request->query['worker_id'];
        }
        if (($request->query['work_date'] ?? '') !== '') {
            $conditions[] = 'work_date = :work_date';
            $params['work_date'] = $request->query['work_date'];
        }
        if (($request->query['from_date'] ?? '') !== '') {
            $conditions[] = 'work_date >= :from_date';
            $params['from_date'] = $request->query['from_date'];
        }
        if (($request->query['to_date'] ?? '') !== '') {
            $conditions[] = 'work_date <= :to_date';
            $params['to_date'] = $request->query['to_date'];
        }

        return [$conditions ? 'WHERE ' . implode(' AND ', $conditions) : '', $params];
    }

    public static function upsertToday(int $workerId, string $status, int $markedBy, ?string $entryTime, ?string $exitTime, ?string $notes): array
    {
        $date = date('Y-m-d');
        $existing = Database::fetch(
            'SELECT id FROM worker_attendance WHERE worker_id = :wid AND work_date = :date LIMIT 1',
            ['wid' => $workerId, 'date' => $date]
        );

        if ($existing) {
            return static::update((int) $existing['id'], [
                'status' => $status,
                'marked_by' => $markedBy,
                'entry_time' => $entryTime,
                'exit_time' => $exitTime,
                'notes' => $notes,
            ]);
        }

        return static::create([
            'worker_id' => $workerId,
            'work_date' => $date,
            'status' => $status,
            'marked_by' => $markedBy,
            'entry_time' => $entryTime,
            'exit_time' => $exitTime,
            'notes' => $notes,
        ]);
    }

    public static function todaySummary(): array
    {
        $date = date('Y-m-d');
        $rows = Database::fetchAll(
            "SELECT status, COUNT(*) AS count FROM worker_attendance WHERE work_date = :date GROUP BY status",
            ['date' => $date]
        );
        $summary = ['Present' => 0, 'Absent' => 0, 'Half Day' => 0, 'Leave' => 0];
        foreach ($rows as $row) {
            $summary[$row['status']] = (int) $row['count'];
        }
        return $summary;
    }
}
