<?php

declare(strict_types=1);

class AdminComplaintController extends ResourceController
{
    protected string $model = Complaint::class;
    protected array $requiredCreate = ['tenant_id', 'office_id', 'category', 'subject', 'description'];
    protected string $entityType = 'complaint';

    protected function prepare(array $data, Request $request): array
    {
        if (!empty($data['subject'])) {
            Validator::maxLength((string) $data['subject'], 255, 'subject');
        }
        if (!empty($data['description'])) {
            Validator::maxLength((string) $data['description'], 10000, 'description');
        }
        if (!empty($data['category'])) {
            Validator::maxLength((string) $data['category'], 100, 'category');
        }
        return $data;
    }

    public function show(Request $request): void
    {
        $row = Complaint::find((int) $request->params['id']);
        if (!$row) {
            throw new AppException('Record not found', 404);
        }
        $row['history'] = Complaint::history((int) $row['id']);
        Response::success($row);
    }

    public function assign(Request $request): void
    {
        Validator::require($request->all(), ['vendor_id']);
        $row = Complaint::assign(
            (int) $request->params['id'],
            (int) $request->input('vendor_id'),
            (int) $request->user['id'],
            $request->input('remarks')
        );
        AuditService::log((int) $request->user['id'], 'complaint.assign', 'complaint', (int) $row['id'], ['vendor_id' => (int) $request->input('vendor_id')]);
        NotificationService::notifyComplaintAssigned($row, (int) $request->user['id']);
        Response::success($row, 'Vendor assigned');
    }

    public function status(Request $request): void
    {
        Validator::require($request->all(), ['status']);
        $status = Validator::enum((string) $request->input('status'), ['Open', 'Assigned', 'In Progress', 'Resolved', 'Closed'], 'status');
        if ($request->input('remarks') !== null) {
            Validator::maxLength((string) $request->input('remarks'), 5000, 'remarks');
        }
        $row = Complaint::changeStatus(
            (int) $request->params['id'],
            $status,
            $request->input('remarks'),
            (int) $request->user['id']
        );
        AuditService::log((int) $request->user['id'], 'complaint.status_change', 'complaint', (int) $row['id'], ['status' => $status]);
        NotificationService::notifyComplaintStatusChanged($row, $status, (int) $request->user['id']);
        Response::success($row, 'Status updated');
    }
}

