<?php

declare(strict_types=1);

class ComplaintController
{
    protected function scopedShow(Request $request, ?int $officeId): void
    {
        $row = Complaint::find((int) $request->params['id']);
        if (!$row || ($officeId !== null && (int) $row['office_id'] !== $officeId)) {
            throw new AppException('Complaint not found', 404);
        }
        $row['history'] = Complaint::history((int) $row['id']);
        Response::success($row);
    }
}
