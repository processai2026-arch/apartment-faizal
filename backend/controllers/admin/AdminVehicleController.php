<?php

declare(strict_types=1);

class AdminVehicleController extends ResourceController
{
    protected string $model = Vehicle::class;
    protected array $requiredCreate = ['vehicle_no', 'vehicle_type'];
    protected string $entityType = 'vehicle';

    protected function prepare(array $data, Request $request): array
    {
        $data['status'] = $data['status'] ?? 'Inside';
        $data['entry_time'] = $data['entry_time'] ?? db_time();
        return $data;
    }

    public function active(Request $request): void
    {
        $request->query['status'] = 'Inside';
        $this->index($request);
    }

    public function checkout(Request $request): void
    {
        $row = Vehicle::checkout((int) $request->params['id'], (int) $request->user['id']);
        AuditService::log((int) $request->user['id'], 'vehicle.checkout', 'vehicle', (int) $row['id']);
        Response::success($row, 'Vehicle checked out');
    }
}
