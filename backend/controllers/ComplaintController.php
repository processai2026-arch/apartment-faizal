<?php

declare(strict_types=1);

class ComplaintController
{
    protected function scopedShow(Request $request, ?int $officeId): void
    {
        $row = Complaint::find((int) $request->params['id']);
        $currentUserId = (int) $request->user['id'];

        // BUG-02 + BUG-06 fix: enforce tenant ownership
        $tenantId   = isset($row['tenant_id']) ? (int) $row['tenant_id'] : null;
        $notOwner   = $tenantId !== null && $tenantId !== $currentUserId;
        $wrongOffice = $officeId !== null && isset($row['office_id']) && $row['office_id'] !== null && (int) $row['office_id'] !== $officeId;

        if (!$row || $notOwner || $wrongOffice) {
            throw new AppException('Complaint not found', 404);
        }

        $row['history'] = Complaint::history((int) $row['id']);
        Response::success($row);
    }
}
