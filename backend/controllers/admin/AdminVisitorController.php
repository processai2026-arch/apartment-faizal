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

    public function checkout(Request $request): void
    {
        $row = Visitor::checkout((int) $request->params['id'], (int) $request->user['id']);
        AuditService::log((int) $request->user['id'], 'visitor.checkout', 'visitor', (int) $row['id']);
        Response::success($row, 'Visitor checked out');
    }
}
