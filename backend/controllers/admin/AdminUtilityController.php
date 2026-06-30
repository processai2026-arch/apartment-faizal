<?php

declare(strict_types=1);

class AdminUtilityController extends ResourceController
{
    protected string $model = UtilityTask::class;
    protected array $requiredCreate = ['description', 'type', 'scheduled_date'];
    protected string $entityType = 'utility_task';

    public function store(Request $request): void
    {
        Validator::require($request->all(), $this->requiredCreate);
        $row = $this->model::create($this->prepare($request->all(), $request));
        AuditService::log((int) $request->user['id'], $this->entityType . '.create', $this->entityType, (int) $row['id']);
        NotificationService::notifyMaintenanceReminder($row, (int) $request->user['id']);
        Response::success($row, 'Created', 201);
    }

    public function complete(Request $request): void
    {
        $row = UtilityTask::update((int) $request->params['id'], [
            'status' => 'Done',
            'last_completed' => (string) ($request->input('completed_at') ?: date('Y-m-d')),
        ]);
        AuditService::log((int) $request->user['id'], 'utility.complete', 'utility_task', (int) $row['id']);
        Response::success($row, 'Task completed');
    }
}

