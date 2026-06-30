<?php

declare(strict_types=1);

class AdminVisitorController extends ResourceController
{
    protected string $model = Visitor::class;
    protected array $requiredCreate = ['name', 'phone', 'company_name', 'whom_to_meet', 'reason'];
    protected string $entityType = 'visitor';

    protected function prepare(array $data, Request $request): array
    {
        $data['phone'] = Validator::phone($data['phone'] ?? '');
        $data['status'] = $data['status'] ?? 'Inside';
        $data['entry_time'] = $data['entry_time'] ?? db_time();
        $data['guard_name'] = $data['guard_name'] ?? ($request->user['name'] ?? null);
        return $data;
    }

    public function active(Request $request): void
    {
        $request->query['status'] = 'Inside';
        $this->index($request);
    }

    public function store(Request $request): void
    {
        Validator::require($request->all(), $this->requiredCreate);
        $row = Visitor::create($this->prepare($request->all(), $request));
        Database::query(
            'INSERT INTO visitor_movements (visitor_id, movement_type, occurred_at, actor_user_id, created_at) VALUES (:visitor_id, :movement_type, :occurred_at, :actor_user_id, :created_at)',
            ['visitor_id' => (int) $row['id'], 'movement_type' => 'entry', 'occurred_at' => $row['entry_time'], 'actor_user_id' => (int) $request->user['id'], 'created_at' => db_time()]
        );
        AuditService::log((int) $request->user['id'], 'visitor.create', 'visitor', (int) $row['id']);
        NotificationService::notifyVisitorEntered($row, (int) $request->user['id']);
        Response::success($row, 'Created', 201);
    }

    public function checkout(Request $request): void
    {
        $row = Visitor::checkout((int) $request->params['id'], (int) $request->user['id']);
        AuditService::log((int) $request->user['id'], 'visitor.checkout', 'visitor', (int) $row['id']);
        NotificationService::notifyVisitorExited($row, (int) $request->user['id']);
        Response::success($row, 'Visitor checked out');
    }
}

