<?php

declare(strict_types=1);

class AdminMaintenanceRequestController extends ResourceController
{
    protected string $model = MaintenanceRequest::class;
    protected array $requiredCreate = ['tenant_id', 'office_id', 'category', 'title', 'description'];
    protected string $entityType = 'maintenance_request';

    public function show(Request $request): void
    {
        $row = MaintenanceRequest::find((int) $request->params['id']);
        if (!$row) {
            throw new AppException('Record not found', 404);
        }
        $row['history'] = MaintenanceRequest::history((int) $row['id']);
        Response::success($row);
    }

    public function assign(Request $request): void
    {
        Validator::require($request->all(), ['vendor_id']);
        $row = MaintenanceRequest::assignVendor(
            (int) $request->params['id'],
            (int) $request->input('vendor_id'),
            (int) $request->user['id'],
            $request->input('remarks')
        );
        AuditService::log((int) $request->user['id'], 'maintenance_request.assign_vendor', 'maintenance_request', (int) $row['id'], ['vendor_id' => (int) $request->input('vendor_id')]);
        NotificationService::notifyMaintenanceRequestAssigned($row, (int) $request->user['id']);
        Response::success($row, 'Vendor assigned');
    }

    public function assignStaff(Request $request): void
    {
        Validator::require($request->all(), ['staff_id']);
        $row = MaintenanceRequest::assignStaff(
            (int) $request->params['id'],
            (int) $request->input('staff_id'),
            (int) $request->user['id'],
            $request->input('remarks')
        );
        AuditService::log((int) $request->user['id'], 'maintenance_request.assign_staff', 'maintenance_request', (int) $row['id'], ['staff_id' => (int) $request->input('staff_id')]);
        NotificationService::notifyMaintenanceRequestAssigned($row, (int) $request->user['id']);
        Response::success($row, 'Staff assigned');
    }

    public function status(Request $request): void
    {
        Validator::require($request->all(), ['status']);
        $status = Validator::enum((string) $request->input('status'), ['Open', 'Assigned', 'In Progress', 'Completed', 'Cancelled'], 'status');
        $row = MaintenanceRequest::changeStatus(
            (int) $request->params['id'],
            $status,
            $request->input('remarks'),
            (int) $request->user['id']
        );
        AuditService::log((int) $request->user['id'], 'maintenance_request.status_change', 'maintenance_request', (int) $row['id'], ['status' => $status]);
        NotificationService::notifyMaintenanceRequestStatusChanged($row, $status, (int) $request->user['id']);
        Response::success($row, 'Status updated');
    }
}
