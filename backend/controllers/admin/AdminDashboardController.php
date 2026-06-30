<?php

declare(strict_types=1);

class AdminDashboardController
{
    public function summary(Request $request): void
    {
        $today = date('Y-m-d');

        // Single round-trip: all scalar counts in one query using subqueries
        $row = Database::fetch(
            "SELECT
                (SELECT COUNT(*) FROM offices           WHERE deleted_at IS NULL)                                                   AS offices,
                (SELECT COUNT(*) FROM visitors          WHERE status = 'Inside'  AND deleted_at IS NULL)                           AS activeVisitors,
                (SELECT COUNT(*) FROM vehicles          WHERE status = 'Inside'  AND deleted_at IS NULL)                           AS activeVehicles,
                (SELECT COUNT(*) FROM staff             WHERE deleted_at IS NULL)                                                   AS staff,
                (SELECT COUNT(*) FROM vendors           WHERE deleted_at IS NULL)                                                   AS vendors,
                (SELECT COUNT(*) FROM utility_tasks     WHERE status != 'Done'   AND scheduled_date < :today AND deleted_at IS NULL) AS overdueUtilities,
                (SELECT COUNT(*) FROM complaints        WHERE status NOT IN ('Resolved','Closed') AND deleted_at IS NULL)           AS openComplaints,
                (SELECT COUNT(*) FROM notifications     WHERE is_read = 0        AND deleted_at IS NULL)                           AS unreadNotifications,
                (SELECT COUNT(*) FROM notifications     WHERE substr(created_at, 1, 10) = :today2 AND deleted_at IS NULL)           AS todayNotifications,
                (SELECT COUNT(*) FROM notifications     WHERE priority IN ('High','Emergency')    AND deleted_at IS NULL)           AS highPriorityAlerts",
            ['today' => $today, 'today2' => $today]
        );

        $counts = [
            'offices'              => (int)($row['offices']              ?? 0),
            'activeVisitors'       => (int)($row['activeVisitors']       ?? 0),
            'activeVehicles'       => (int)($row['activeVehicles']       ?? 0),
            'staff'                => (int)($row['staff']                ?? 0),
            'vendors'              => (int)($row['vendors']              ?? 0),
            'overdueUtilities'     => (int)($row['overdueUtilities']     ?? 0),
            'openComplaints'       => (int)($row['openComplaints']       ?? 0),
            'unreadNotifications'  => (int)($row['unreadNotifications']  ?? 0),
            'todayNotifications'   => (int)($row['todayNotifications']   ?? 0),
            'highPriorityAlerts'   => (int)($row['highPriorityAlerts']   ?? 0),
        ];

        $counts['complaintsByStatus'] = Database::fetchAll(
            "SELECT status, COUNT(*) AS count FROM complaints WHERE deleted_at IS NULL GROUP BY status"
        );

        Response::success($counts);
    }
}

