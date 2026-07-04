<?php

declare(strict_types=1);

class TenantMaintenanceRequestController extends MaintenanceRequestController
{
    public function index(Request $request): void
    {
        $officeId = $request->user['officeId'] ?? null;
        $request->query['office_id'] = $officeId ? (string) $officeId : '0';
        $request->query['tenant_id'] = (string) $request->user['id'];
        [$rows, $total, $page, $perPage] = MaintenanceRequest::list($request);
        Response::paginated($rows, $total, $page, $perPage);
    }

    public function store(Request $request): void
    {
        Validator::require($request->all(), ['category', 'title', 'description']);
        $officeId = $request->user['officeId'] ?? null;
        if (!$officeId) {
            throw new AppException('No office linked to this account', 422);
        }

        $row = MaintenanceRequest::create([
            'tenant_id' => (int) $request->user['id'],
            'office_id' => (int) $officeId,
            'category' => $request->input('category'),
            'title' => $request->input('title'),
            'description' => $request->input('description'),
            'priority' => $request->input('priority') ?: 'Low',
            'status' => 'Open',
            'attachment_id' => $request->input('attachment_id') ?: null,
            'expected_completion' => $request->input('expected_completion') ?: null,
        ]);

        AuditService::log((int) $request->user['id'], 'maintenance_request.create', 'maintenance_request', (int) $row['id']);
        NotificationService::notifyMaintenanceRequestCreated($row, (int) $request->user['id']);
        Response::success($row, 'Maintenance request submitted', 201);
    }

    public function show(Request $request): void
    {
        $officeId = $request->user['officeId'] ?? null;
        $this->scopedShow($request, $officeId ? (int) $officeId : null);
    }

    public function cancel(Request $request): void
    {
        $officeId = $request->user['officeId'] ?? null;
        $row = MaintenanceRequest::find((int) $request->params['id']);
        if (!$row || ($officeId !== null && (int) $row['office_id'] !== (int) $officeId)) {
            throw new AppException('Maintenance request not found', 404);
        }
        if (in_array($row['status'], ['Completed', 'Cancelled'], true)) {
            throw new AppException('Request cannot be cancelled in its current state', 422);
        }

        $row = MaintenanceRequest::cancel((int) $row['id'], (int) $request->user['id'], $request->input('remarks'));
        AuditService::log((int) $request->user['id'], 'maintenance_request.cancel', 'maintenance_request', (int) $row['id']);
        NotificationService::notifyMaintenanceRequestStatusChanged($row, 'Cancelled', (int) $request->user['id']);
        Response::success($row, 'Maintenance request cancelled');
    }
}
