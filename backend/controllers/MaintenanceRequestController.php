<?php

declare(strict_types=1);

class MaintenanceRequestController
{
    protected function scopedShow(Request $request, ?int $officeId): void
    {
        $row = MaintenanceRequest::find((int) $request->params['id']);
        if (!$row || ($officeId !== null && (int) $row['office_id'] !== $officeId)) {
            throw new AppException('Maintenance request not found', 404);
        }
        $row['history'] = MaintenanceRequest::history((int) $row['id']);
        Response::success($row);
    }
}
