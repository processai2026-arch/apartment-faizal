<?php

declare(strict_types=1);

class TenantComplaintController extends ComplaintController
{
    public function index(Request $request): void
    {
        $officeId = $request->user['officeId'] ?? null;
        $request->query['office_id'] = $officeId ? (string) $officeId : '0';
        $request->query['tenant_id'] = (string) $request->user['id'];
        [$rows, $total, $page, $perPage] = Complaint::list($request);
        Response::paginated($rows, $total, $page, $perPage);
    }

    public function store(Request $request): void
    {
        Validator::require($request->all(), ['category', 'subject', 'description']);
        $officeId = $request->user['officeId'] ?? null;
        if (!$officeId) {
            throw new AppException('No office linked to this account', 422);
        }

        $row = Complaint::create([
            'tenant_id' => (int) $request->user['id'],
            'office_id' => (int) $officeId,
            'category' => $request->input('category'),
            'subject' => $request->input('subject'),
            'description' => $request->input('description'),
            'priority' => $request->input('priority') ?: 'Low',
            'status' => 'Open',
            'attachment_id' => $request->input('attachment_id') ?: null,
        ]);

        AuditService::log((int) $request->user['id'], 'complaint.create', 'complaint', (int) $row['id']);
        NotificationService::notifyComplaintCreated($row, (int) $request->user['id']);
        Response::success($row, 'Complaint submitted', 201);
    }

    public function show(Request $request): void
    {
        $officeId = $request->user['officeId'] ?? null;
        $this->scopedShow($request, $officeId ? (int) $officeId : null);
    }
}

