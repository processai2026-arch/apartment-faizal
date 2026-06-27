<?php

declare(strict_types=1);

class AdminDashboardController
{
    public function summary(Request $request): void
    {
        $counts = [
            'offices' => Database::fetch('SELECT COUNT(*) AS total FROM offices WHERE deleted_at IS NULL')['total'] ?? 0,
            'activeVisitors' => Database::fetch("SELECT COUNT(*) AS total FROM visitors WHERE status = 'Inside' AND deleted_at IS NULL")['total'] ?? 0,
            'activeVehicles' => Database::fetch("SELECT COUNT(*) AS total FROM vehicles WHERE status = 'Inside' AND deleted_at IS NULL")['total'] ?? 0,
            'staff' => Database::fetch('SELECT COUNT(*) AS total FROM staff WHERE deleted_at IS NULL')['total'] ?? 0,
            'vendors' => Database::fetch('SELECT COUNT(*) AS total FROM vendors WHERE deleted_at IS NULL')['total'] ?? 0,
            'overdueUtilities' => Database::fetch("SELECT COUNT(*) AS total FROM utility_tasks WHERE status != 'Done' AND scheduled_date < :today AND deleted_at IS NULL", ['today' => date('Y-m-d')])['total'] ?? 0,
        ];
        Response::success($counts);
    }
}
