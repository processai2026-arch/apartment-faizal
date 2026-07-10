<?php

declare(strict_types=1);

class SuperTaskController
{
    public function index(Request $request): void
    {
        [$rows, $total, $page, $perPage] = SuperTask::list($request);
        Response::paginated($rows, $total, $page, $perPage);
    }

    public function dashboard(Request $request): void
    {
        $userId = (int) $request->user['id'];
        $summary = SuperTask::todaySummary($userId);

        // Today's tasks grouped
        $today = date('Y-m-d');
        $todayTasks = Database::fetchAll(
            "SELECT * FROM super_tasks WHERE due_date = :d AND deleted_at IS NULL ORDER BY FIELD(priority,'Urgent','High','Medium','Low'), due_time ASC",
            ['d' => $today]
        );
        $overdueTasks = Database::fetchAll(
            "SELECT * FROM super_tasks WHERE due_date < :d AND status NOT IN ('Completed','Cancelled') AND deleted_at IS NULL ORDER BY due_date ASC, FIELD(priority,'Urgent','High','Medium','Low') LIMIT 10",
            ['d' => $today]
        );
        $upcomingTasks = Database::fetchAll(
            "SELECT * FROM super_tasks WHERE due_date > :d AND status NOT IN ('Completed','Cancelled') AND deleted_at IS NULL ORDER BY due_date ASC LIMIT 5",
            ['d' => $today]
        );

        Response::success([
            'summary'      => $summary,
            'today_tasks'  => array_map([SuperTask::class, 'present'], $todayTasks),
            'overdue'      => array_map([SuperTask::class, 'present'], $overdueTasks),
            'upcoming'     => array_map([SuperTask::class, 'present'], $upcomingTasks),
        ]);
    }

    public function store(Request $request): void
    {
        Validator::require($request->all(), ['title']);
        if ($request->input('status') !== null) {
            Validator::enum((string) $request->input('status'), SuperTask::STATUSES, 'status');
        }
        if ($request->input('priority') !== null) {
            Validator::enum((string) $request->input('priority'), SuperTask::PRIORITIES, 'priority');
        }

        $task = SuperTask::create([
            'title'       => trim((string) $request->input('title')),
            'description' => $request->input('description') ?: null,
            'status'      => $request->input('status') ?: 'Pending',
            'priority'    => $request->input('priority') ?: 'Medium',
            'category'    => $request->input('category') ?: null,
            'due_date'    => $request->input('due_date') ?: null,
            'due_time'    => $request->input('due_time') ?: null,
            'assigned_to' => $request->input('assigned_to') ?: null,
            'notes'       => $request->input('notes') ?: null,
            'tags'        => $request->input('tags') ?: null,
            'created_by'  => (int) $request->user['id'],
        ]);

        AuditService::log((int) $request->user['id'], 'super_task.create', 'super_task', (int) $task['id']);
        Response::success($task, 'Task created', 201);
    }

    public function show(Request $request): void
    {
        $task = SuperTask::find((int) $request->params['id']);
        if (!$task) throw new AppException('Task not found', 404);
        Response::success($task);
    }

    public function update(Request $request): void
    {
        $task = SuperTask::find((int) $request->params['id']);
        if (!$task) throw new AppException('Task not found', 404);

        $data = array_filter([
            'title'       => $request->input('title') ? trim((string) $request->input('title')) : null,
            'description' => $request->input('description'),
            'status'      => $request->input('status'),
            'priority'    => $request->input('priority'),
            'category'    => $request->input('category'),
            'due_date'    => $request->input('due_date'),
            'due_time'    => $request->input('due_time'),
            'assigned_to' => $request->input('assigned_to'),
            'notes'       => $request->input('notes'),
            'tags'        => $request->input('tags'),
        ], fn($v) => $v !== null);

        // Auto-set completed_at when status changes to Completed
        if (isset($data['status']) && $data['status'] === 'Completed' && $task['status'] !== 'Completed') {
            $data['completed_at'] = db_time();
        }
        if (isset($data['status']) && $data['status'] !== 'Completed') {
            $data['completed_at'] = null;
        }

        $updated = SuperTask::update((int) $task['id'], $data);
        AuditService::log((int) $request->user['id'], 'super_task.update', 'super_task', (int) $task['id']);
        Response::success($updated, 'Task updated');
    }

    public function complete(Request $request): void
    {
        $task = SuperTask::find((int) $request->params['id']);
        if (!$task) throw new AppException('Task not found', 404);

        $updated = SuperTask::update((int) $task['id'], [
            'status'       => 'Completed',
            'completed_at' => db_time(),
        ]);
        AuditService::log((int) $request->user['id'], 'super_task.complete', 'super_task', (int) $task['id']);
        Response::success($updated, 'Task marked complete');
    }

    public function destroy(Request $request): void
    {
        $task = SuperTask::find((int) $request->params['id']);
        if (!$task) throw new AppException('Task not found', 404);
        SuperTask::softDelete((int) $task['id']);
        AuditService::log((int) $request->user['id'], 'super_task.delete', 'super_task', (int) $task['id']);
        Response::success(['id' => $task['id']], 'Task deleted');
    }
}
