<?php

declare(strict_types=1);

class AdminOfficeController extends ResourceController
{
    protected string $model = Office::class;
    protected array $requiredCreate = ['block', 'floor_number', 'company_name'];
    protected string $entityType = 'office';

    public function status(Request $request): void
    {
        Validator::require($request->all(), ['status']);
        $status = Validator::enum((string) $request->input('status'), ['Active', 'Inactive', 'Vacant'], 'status');
        $row = Office::update((int) $request->params['id'], ['status' => $status]);
        AuditService::log((int) $request->user['id'], 'office.status', 'office', (int) $row['id'], ['status' => $status]);
        Response::success($row, 'Status updated');
    }
}
