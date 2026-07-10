<?php

declare(strict_types=1);

class SuperTask extends CrudModel
{
    protected static string $table = 'super_tasks';
    protected static array $columns = [
        'title', 'description', 'status', 'priority', 'category',
        'due_date', 'due_time', 'completed_at', 'created_by',
        'assigned_to', 'notes', 'tags',
    ];
    protected static array $searchColumns = ['title', 'description', 'category', 'assigned_to', 'tags'];

    public const STATUSES   = ['Pending', 'In Progress', 'Completed', 'On Hold', 'Cancelled'];
    public const PRIORITIES = ['Low', 'Medium', 'High', 'Urgent'];
    public const CATEGORIES = ['Administrative', 'Technical', 'Financial', 'Client', 'Meeting', 'Follow-up', 'Other'];

    protected static function filters(Request $request): array
    {
        [$where, $params] = parent::filters($request);
        $conditions = $where !== '' ? [substr($where, 6)] : [];

        if (($request->query['status'] ?? '') !== '') {
            $conditions[] = 'status = :status';
            $params['status'] = $request->query['status'];
        }
        if (($request->query['priority'] ?? '') !== '') {
            $conditions[] = 'priority = :priority';
            $params['priority'] = $request->query['priority'];
        }
        if (($request->query['category'] ?? '') !== '') {
            $conditions[] = 'category = :category';
            $params['category'] = $request->query['category'];
        }
        if (($request->query['due_from'] ?? '') !== '') {
            $conditions[] = 'due_date >= :due_from';
            $params['due_from'] = $request->query['due_from'];
        }
        if (($request->query['due_to'] ?? '') !== '') {
            $conditions[] = 'due_date <= :due_to';
            $params['due_to'] = $request->query['due_to'];
        }
        if (($request->query['today'] ?? '') === '1') {
            $conditions[] = 'due_date = :today';
            $params['today'] = date('Y-m-d');
        }
        if (($request->query['overdue'] ?? '') === '1') {
            $conditions[] = "due_date < :today2 AND status NOT IN ('Completed','Cancelled')";
            $params['today2'] = date('Y-m-d');
        }
        if (($request->query['created_by'] ?? '') !== '') {
            $conditions[] = 'created_by = :created_by';
            $params['created_by'] = (int) $request->query['created_by'];
        }

        return [$conditions ? 'WHERE ' . implode(' AND ', $conditions) : '', $params];
    }

    protected static function orderBy(): string
    {
        return "ORDER BY FIELD(priority,'Urgent','High','Medium','Low'), due_date ASC, id DESC";
    }

    protected static function expose(array $row): array
    {
        $row['id']          = (int) $row['id'];
        $row['created_by']  = $row['created_by'] ? (int) $row['created_by'] : null;
        return $row;
    }

    public static function todaySummary(int $userId): array
    {
        $today = date('Y-m-d');
        return [
            'today_pending'    => (int) Database::fetch("SELECT COUNT(*) AS c FROM super_tasks WHERE due_date = :d AND status = 'Pending' AND (created_by = :u OR created_by IS NULL) AND deleted_at IS NULL", ['d' => $today, 'u' => $userId])['c'],
            'today_in_progress'=> (int) Database::fetch("SELECT COUNT(*) AS c FROM super_tasks WHERE due_date = :d AND status = 'In Progress' AND (created_by = :u OR created_by IS NULL) AND deleted_at IS NULL", ['d' => $today, 'u' => $userId])['c'],
            'overdue'          => (int) Database::fetch("SELECT COUNT(*) AS c FROM super_tasks WHERE due_date < :d AND status NOT IN ('Completed','Cancelled') AND (created_by = :u OR created_by IS NULL) AND deleted_at IS NULL", ['d' => $today, 'u' => $userId])['c'],
            'completed_today'  => (int) Database::fetch("SELECT COUNT(*) AS c FROM super_tasks WHERE DATE(completed_at) = :d AND (created_by = :u OR created_by IS NULL) AND deleted_at IS NULL", ['d' => $today, 'u' => $userId])['c'],
            'total_pending'    => (int) Database::fetch("SELECT COUNT(*) AS c FROM super_tasks WHERE status = 'Pending' AND (created_by = :u OR created_by IS NULL) AND deleted_at IS NULL", ['u' => $userId])['c'],
        ];
    }
}
