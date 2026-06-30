<?php

declare(strict_types=1);

class SecurityController
{
    public function dashboard(Request $request): void
    {
        $userId = (int) ($request->user['id'] ?? 0);
        Response::success([
            'activeVisitors' => Visitor::presentMany(Database::fetchAll("SELECT * FROM visitors WHERE status = 'Inside' AND deleted_at IS NULL ORDER BY entry_time DESC LIMIT 50")),
            'activeVehicles' => Vehicle::presentMany(Database::fetchAll("SELECT * FROM vehicles WHERE status = 'Inside' AND deleted_at IS NULL ORDER BY entry_time DESC LIMIT 50")),
            'staffToday' => Database::fetchAll(
                'SELECT s.id, s.name, s.role, a.status FROM staff s LEFT JOIN staff_attendance a ON a.staff_id = s.id AND a.attendance_date = :today WHERE s.deleted_at IS NULL ORDER BY s.name',
                ['today' => date('Y-m-d')]
            ),
            'notificationSummary' => Notification::summaryForUser($userId),
        ]);
    }
}

