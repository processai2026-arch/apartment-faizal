<?php

declare(strict_types=1);

class TenantController
{
    public function dashboard(Request $request): void
    {
        $officeId = $request->user['officeId'];
        Response::success([
            'office' => $officeId ? Office::find((int) $officeId) : null,
            'visitors' => $officeId ? Visitor::presentMany(Database::fetchAll('SELECT * FROM visitors WHERE office_id = :office_id AND deleted_at IS NULL ORDER BY entry_time DESC LIMIT 25', ['office_id' => $officeId])) : [],
            'vehicles' => $officeId ? Vehicle::presentMany(Database::fetchAll('SELECT * FROM vehicles WHERE office_id = :office_id AND deleted_at IS NULL ORDER BY entry_time DESC LIMIT 25', ['office_id' => $officeId])) : [],
        ]);
    }
}
