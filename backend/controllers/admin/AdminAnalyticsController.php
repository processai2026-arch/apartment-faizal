<?php

declare(strict_types=1);

class AdminAnalyticsController
{
    // ── Occupancy ────────────────────────────────────────────────────────────

    public function occupancy(Request $request): void
    {
        $total    = (int) (Database::fetch('SELECT COUNT(*) AS n FROM offices WHERE deleted_at IS NULL')['n'] ?? 0);
        $occupied = (int) (Database::fetch("SELECT COUNT(*) AS n FROM offices WHERE status = 'Active' AND deleted_at IS NULL")['n'] ?? 0);
        $vacant   = $total - $occupied;
        $rate     = $total > 0 ? round($occupied / $total * 100, 1) : 0.0;

        $byBlock = Database::fetchAll(
            "SELECT block,
                    COUNT(*) AS total,
                    SUM(CASE WHEN status = 'Active' THEN 1 ELSE 0 END) AS occupied
             FROM offices
             WHERE deleted_at IS NULL
             GROUP BY block
             ORDER BY block"
        );

        Response::success([
            'total'          => $total,
            'occupied'       => $occupied,
            'vacant'         => $vacant,
            'occupancy_rate' => $rate,
            'by_block'       => array_map(fn($r) => [
                'block'    => $r['block'],
                'occupied' => (int) $r['occupied'],
                'total'    => (int) $r['total'],
            ], $byBlock),
        ]);
    }

    // ── Complaints ───────────────────────────────────────────────────────────

    public function complaints(Request $request): void
    {
        $total = (int) (Database::fetch('SELECT COUNT(*) AS n FROM complaints WHERE deleted_at IS NULL')['n'] ?? 0);

        $byStatus = Database::fetchAll(
            'SELECT status, COUNT(*) AS cnt FROM complaints WHERE deleted_at IS NULL GROUP BY status'
        );

        $byPriority = Database::fetchAll(
            'SELECT priority, COUNT(*) AS cnt FROM complaints WHERE deleted_at IS NULL GROUP BY priority'
        );

        $monthly = Database::fetchAll(
            "SELECT strftime('%Y-%m', created_at) AS month, COUNT(*) AS count
             FROM complaints
             WHERE created_at >= date('now', '-6 months') AND deleted_at IS NULL
             GROUP BY month
             ORDER BY month"
        );

        $avgRow = Database::fetch(
            "SELECT AVG((julianday(updated_at) - julianday(created_at)) * 24) AS avg_hours
             FROM complaints
             WHERE status IN ('Resolved','Closed') AND deleted_at IS NULL"
        );

        Response::success([
            'total'                => $total,
            'by_status'            => $this->toCountMap($byStatus, 'status', 'cnt'),
            'by_priority'          => $this->toCountMap($byPriority, 'priority', 'cnt'),
            'monthly_trend'        => $this->normaliseMonthly($monthly),
            'avg_resolution_hours' => round((float) ($avgRow['avg_hours'] ?? 0), 1),
        ]);
    }

    // ── Maintenance ──────────────────────────────────────────────────────────

    public function maintenance(Request $request): void
    {
        $total = (int) (Database::fetch('SELECT COUNT(*) AS n FROM maintenance_requests WHERE deleted_at IS NULL')['n'] ?? 0);

        $pending = (int) (Database::fetch(
            "SELECT COUNT(*) AS n FROM maintenance_requests WHERE status IN ('Open','Assigned') AND deleted_at IS NULL"
        )['n'] ?? 0);

        $byStatus = Database::fetchAll(
            'SELECT status, COUNT(*) AS cnt FROM maintenance_requests WHERE deleted_at IS NULL GROUP BY status'
        );

        $byType = Database::fetchAll(
            'SELECT category AS type, COUNT(*) AS cnt FROM maintenance_requests WHERE deleted_at IS NULL GROUP BY category'
        );

        $monthly = Database::fetchAll(
            "SELECT strftime('%Y-%m', created_at) AS month, COUNT(*) AS count
             FROM maintenance_requests
             WHERE created_at >= date('now', '-6 months') AND deleted_at IS NULL
             GROUP BY month
             ORDER BY month"
        );

        $avgRow = Database::fetch(
            "SELECT AVG((julianday(completed_at) - julianday(created_at)) * 24) AS avg_hours
             FROM maintenance_requests
             WHERE completed_at IS NOT NULL AND deleted_at IS NULL"
        );

        Response::success([
            'total'                => $total,
            'by_status'            => $this->toCountMap($byStatus, 'status', 'cnt'),
            'by_type'              => $this->toCountMap($byType, 'type', 'cnt'),
            'pending'              => $pending,
            'monthly_trend'        => $this->normaliseMonthly($monthly),
            'avg_resolution_hours' => round((float) ($avgRow['avg_hours'] ?? 0), 1),
        ]);
    }

    // ── Vendors ──────────────────────────────────────────────────────────────

    public function vendors(Request $request): void
    {
        $total = (int) (Database::fetch('SELECT COUNT(*) AS n FROM marketplace_vendors WHERE deleted_at IS NULL')['n'] ?? 0);

        $avgRating = (float) (Database::fetch(
            'SELECT COALESCE(AVG(rating_avg), 0) AS avg FROM marketplace_vendors WHERE deleted_at IS NULL'
        )['avg'] ?? 0);

        $totalBookings = (int) (Database::fetch(
            'SELECT COUNT(*) AS n FROM vendor_bookings WHERE deleted_at IS NULL'
        )['n'] ?? 0);

        $bookingsByStatus = Database::fetchAll(
            'SELECT status, COUNT(*) AS cnt FROM vendor_bookings WHERE deleted_at IS NULL GROUP BY status'
        );

        $topRated = Database::fetchAll(
            'SELECT id, name, rating_avg AS rating FROM marketplace_vendors WHERE deleted_at IS NULL ORDER BY rating_avg DESC LIMIT 5'
        );

        $topBooked = Database::fetchAll(
            'SELECT mv.id, mv.name, COUNT(vb.id) AS booking_count
             FROM marketplace_vendors mv
             LEFT JOIN vendor_bookings vb ON vb.vendor_id = mv.id AND vb.deleted_at IS NULL
             WHERE mv.deleted_at IS NULL
             GROUP BY mv.id, mv.name
             ORDER BY booking_count DESC
             LIMIT 5'
        );

        $monthly = Database::fetchAll(
            "SELECT strftime('%Y-%m', created_at) AS month, COUNT(*) AS count
             FROM vendor_bookings
             WHERE created_at >= date('now', '-6 months') AND deleted_at IS NULL
             GROUP BY month
             ORDER BY month"
        );

        Response::success([
            'total'              => $total,
            'avg_rating'         => round($avgRating, 2),
            'total_bookings'     => $totalBookings,
            'bookings_by_status' => $this->toCountMap($bookingsByStatus, 'status', 'cnt'),
            'top_rated'          => array_map(fn($r) => [
                'id'     => (string) $r['id'],
                'name'   => $r['name'],
                'rating' => round((float) $r['rating'], 2),
            ], $topRated),
            'top_booked'         => array_map(fn($r) => [
                'id'            => (string) $r['id'],
                'name'          => $r['name'],
                'booking_count' => (int) $r['booking_count'],
            ], $topBooked),
            'monthly_bookings'   => $this->normaliseMonthly($monthly),
        ]);
    }

    // ── Rentals ──────────────────────────────────────────────────────────────

    public function rentals(Request $request): void
    {
        $total = (int) (Database::fetch('SELECT COUNT(*) AS n FROM rental_listings WHERE deleted_at IS NULL')['n'] ?? 0);

        $active = (int) (Database::fetch(
            "SELECT COUNT(*) AS n FROM rental_listings WHERE status = 'Active' AND deleted_at IS NULL"
        )['n'] ?? 0);

        $pending = (int) (Database::fetch(
            "SELECT COUNT(*) AS n FROM rental_listings WHERE status = 'Pending' AND deleted_at IS NULL"
        )['n'] ?? 0);

        $byType = Database::fetchAll(
            'SELECT listing_type AS type, COUNT(*) AS cnt FROM rental_listings WHERE deleted_at IS NULL GROUP BY listing_type'
        );

        $avgRent = (float) (Database::fetch(
            "SELECT COALESCE(AVG(price), 0) AS avg FROM rental_listings WHERE deleted_at IS NULL AND listing_type = 'Rent'"
        )['avg'] ?? 0);

        $monthly = Database::fetchAll(
            "SELECT strftime('%Y-%m', created_at) AS month, COUNT(*) AS count
             FROM rental_listings
             WHERE created_at >= date('now', '-6 months') AND deleted_at IS NULL
             GROUP BY month
             ORDER BY month"
        );

        Response::success([
            'total'            => $total,
            'active'           => $active,
            'pending_approval' => $pending,
            'by_type'          => $this->toCountMap($byType, 'type', 'cnt'),
            'avg_rent'         => round($avgRent, 2),
            'monthly_listings' => $this->normaliseMonthly($monthly),
        ]);
    }

    // ── Visitors ─────────────────────────────────────────────────────────────

    public function visitors(Request $request): void
    {
        $today = (int) (Database::fetch(
            "SELECT COUNT(*) AS n FROM visitors WHERE date(entry_time) = date('now') AND deleted_at IS NULL"
        )['n'] ?? 0);

        $thisWeek = (int) (Database::fetch(
            "SELECT COUNT(*) AS n FROM visitors WHERE entry_time >= date('now', 'weekday 0', '-7 days') AND deleted_at IS NULL"
        )['n'] ?? 0);

        $thisMonth = (int) (Database::fetch(
            "SELECT COUNT(*) AS n FROM visitors WHERE strftime('%Y-%m', entry_time) = strftime('%Y-%m', 'now') AND deleted_at IS NULL"
        )['n'] ?? 0);

        $byDay = Database::fetchAll(
            "SELECT CASE CAST(strftime('%w', entry_time) AS INTEGER)
                    WHEN 0 THEN 'Sun' WHEN 1 THEN 'Mon' WHEN 2 THEN 'Tue'
                    WHEN 3 THEN 'Wed' WHEN 4 THEN 'Thu' WHEN 5 THEN 'Fri'
                    ELSE 'Sat' END AS day,
                    CAST(strftime('%w', entry_time) AS INTEGER) AS dow,
                    COUNT(*) AS cnt
             FROM visitors
             WHERE deleted_at IS NULL
             GROUP BY dow
             ORDER BY dow"
        );

        $monthly = Database::fetchAll(
            "SELECT strftime('%Y-%m', entry_time) AS month, COUNT(*) AS count
             FROM visitors
             WHERE entry_time >= date('now', '-6 months') AND deleted_at IS NULL
             GROUP BY month
             ORDER BY month"
        );

        $topHosts = Database::fetchAll(
            'SELECT whom_to_meet AS host, COUNT(*) AS visit_count
             FROM visitors
             WHERE deleted_at IS NULL AND whom_to_meet IS NOT NULL AND whom_to_meet != \'\'
             GROUP BY whom_to_meet
             ORDER BY visit_count DESC
             LIMIT 5'
        );

        Response::success([
            'today'           => $today,
            'this_week'       => $thisWeek,
            'this_month'      => $thisMonth,
            'by_day_of_week'  => array_map(fn($r) => ['day' => $r['day'], 'count' => (int) $r['cnt']], $byDay),
            'monthly_trend'   => $this->normaliseMonthly($monthly),
            'top_hosts'       => array_map(fn($r) => ['host' => $r['host'], 'visit_count' => (int) $r['visit_count']], $topHosts),
        ]);
    }

    // ── Revenue ──────────────────────────────────────────────────────────────

    public function revenue(Request $request): void
    {
        $totals = Database::fetch(
            "SELECT
                COALESCE(SUM(amount), 0)                                              AS total_invoiced,
                COALESCE(SUM(paid_amount), 0)                                         AS total_paid,
                COALESCE(SUM(CASE WHEN status = 'Pending' THEN amount - paid_amount ELSE 0 END), 0) AS total_pending,
                COALESCE(SUM(CASE WHEN status = 'Overdue'  THEN amount - paid_amount ELSE 0 END), 0) AS total_overdue
             FROM invoices WHERE deleted_at IS NULL"
        );

        $byStatus = Database::fetchAll(
            'SELECT status, COUNT(*) AS cnt FROM invoices WHERE deleted_at IS NULL GROUP BY status'
        );

        $monthly = Database::fetchAll(
            "SELECT strftime('%Y-%m', created_at) AS month,
                    COALESCE(SUM(paid_amount), 0) AS paid,
                    COALESCE(SUM(amount - paid_amount), 0) AS pending
             FROM invoices
             WHERE created_at >= date('now', '-6 months') AND deleted_at IS NULL
             GROUP BY month
             ORDER BY month"
        );

        Response::success([
            'total_invoiced'  => round((float) ($totals['total_invoiced'] ?? 0), 2),
            'total_paid'      => round((float) ($totals['total_paid'] ?? 0), 2),
            'total_pending'   => round((float) ($totals['total_pending'] ?? 0), 2),
            'total_overdue'   => round((float) ($totals['total_overdue'] ?? 0), 2),
            'monthly_revenue' => array_map(fn($r) => [
                'month'   => $r['month'],
                'paid'    => round((float) $r['paid'], 2),
                'pending' => round((float) $r['pending'], 2),
            ], $monthly),
            'by_status'       => $this->toCountMap($byStatus, 'status', 'cnt'),
        ]);
    }

    // ── Daily Workers ────────────────────────────────────────────────────────

    public function dailyWorkers(Request $request): void
    {
        $total = (int) (Database::fetch('SELECT COUNT(*) AS n FROM daily_workers WHERE deleted_at IS NULL')['n'] ?? 0);

        $active = (int) (Database::fetch(
            "SELECT COUNT(*) AS n FROM daily_workers WHERE status = 'Active' AND deleted_at IS NULL"
        )['n'] ?? 0);

        $today = date('Y-m-d');

        $todayPresent = (int) (Database::fetch(
            "SELECT COUNT(DISTINCT worker_id) AS n FROM worker_attendance WHERE work_date = :today AND status = 'Present'",
            ['today' => $today]
        )['n'] ?? 0);

        $todayAbsent = $active - $todayPresent;
        $todayAbsent = max(0, $todayAbsent);

        // Attendance rate this week (Mon–today)
        $weekStart = date('Y-m-d', strtotime('monday this week'));
        $daysInRange = max(1, (int) ((strtotime($today) - strtotime($weekStart)) / 86400) + 1);
        $totalPossible = $active * $daysInRange;

        $weekPresent = (int) (Database::fetch(
            "SELECT COUNT(*) AS n FROM worker_attendance
             WHERE work_date BETWEEN :start AND :end AND status = 'Present'",
            ['start' => $weekStart, 'end' => $today]
        )['n'] ?? 0);

        $attendanceRate = $totalPossible > 0 ? round($weekPresent / $totalPossible * 100, 1) : 0.0;

        $byType = Database::fetchAll(
            'SELECT worker_type AS type, COUNT(*) AS cnt FROM daily_workers WHERE deleted_at IS NULL GROUP BY worker_type'
        );

        Response::success([
            'total_workers'               => $total,
            'active'                      => $active,
            'today_present'               => $todayPresent,
            'today_absent'                => $todayAbsent,
            'attendance_rate_this_week'   => $attendanceRate,
            'by_type'                     => $this->toCountMap($byType, 'type', 'cnt'),
        ]);
    }

    // ── Summary (all sections in one call) ───────────────────────────────────

    public function summary(Request $request): void
    {
        ob_start();

        // occupancy
        $officeTotal    = (int) (Database::fetch('SELECT COUNT(*) AS n FROM offices WHERE deleted_at IS NULL')['n'] ?? 0);
        $officeOccupied = (int) (Database::fetch("SELECT COUNT(*) AS n FROM offices WHERE status = 'Active' AND deleted_at IS NULL")['n'] ?? 0);
        $officeVacant   = $officeTotal - $officeOccupied;
        $officeRate     = $officeTotal > 0 ? round($officeOccupied / $officeTotal * 100, 1) : 0.0;
        $byBlock        = Database::fetchAll(
            "SELECT block, COUNT(*) AS total, SUM(CASE WHEN status = 'Active' THEN 1 ELSE 0 END) AS occupied
             FROM offices WHERE deleted_at IS NULL GROUP BY block ORDER BY block"
        );

        // complaints
        $complaintTotal   = (int) (Database::fetch('SELECT COUNT(*) AS n FROM complaints WHERE deleted_at IS NULL')['n'] ?? 0);
        $complaintStatus  = Database::fetchAll('SELECT status, COUNT(*) AS cnt FROM complaints WHERE deleted_at IS NULL GROUP BY status');
        $complaintPrio    = Database::fetchAll('SELECT priority, COUNT(*) AS cnt FROM complaints WHERE deleted_at IS NULL GROUP BY priority');
        $complaintMonthly = Database::fetchAll(
            "SELECT strftime('%Y-%m', created_at) AS month, COUNT(*) AS count FROM complaints
             WHERE created_at >= date('now', '-6 months') AND deleted_at IS NULL GROUP BY month ORDER BY month"
        );
        $complaintAvg = Database::fetch(
            "SELECT AVG((julianday(updated_at) - julianday(created_at)) * 24) AS avg_hours
             FROM complaints WHERE status IN ('Resolved','Closed') AND deleted_at IS NULL"
        );

        // maintenance
        $maintTotal   = (int) (Database::fetch('SELECT COUNT(*) AS n FROM maintenance_requests WHERE deleted_at IS NULL')['n'] ?? 0);
        $maintPending = (int) (Database::fetch("SELECT COUNT(*) AS n FROM maintenance_requests WHERE status IN ('Open','Assigned') AND deleted_at IS NULL")['n'] ?? 0);
        $maintStatus  = Database::fetchAll('SELECT status, COUNT(*) AS cnt FROM maintenance_requests WHERE deleted_at IS NULL GROUP BY status');
        $maintType    = Database::fetchAll('SELECT category AS type, COUNT(*) AS cnt FROM maintenance_requests WHERE deleted_at IS NULL GROUP BY category');
        $maintMonthly = Database::fetchAll(
            "SELECT strftime('%Y-%m', created_at) AS month, COUNT(*) AS count FROM maintenance_requests
             WHERE created_at >= date('now', '-6 months') AND deleted_at IS NULL GROUP BY month ORDER BY month"
        );
        $maintAvg = Database::fetch(
            "SELECT AVG((julianday(completed_at) - julianday(created_at)) * 24) AS avg_hours
             FROM maintenance_requests WHERE completed_at IS NOT NULL AND deleted_at IS NULL"
        );

        // vendors
        $vendorTotal    = (int) (Database::fetch('SELECT COUNT(*) AS n FROM marketplace_vendors WHERE deleted_at IS NULL')['n'] ?? 0);
        $vendorAvgRat   = (float) (Database::fetch('SELECT COALESCE(AVG(rating_avg), 0) AS avg FROM marketplace_vendors WHERE deleted_at IS NULL')['avg'] ?? 0);
        $vendorBookings = (int) (Database::fetch('SELECT COUNT(*) AS n FROM vendor_bookings WHERE deleted_at IS NULL')['n'] ?? 0);
        $vendorBkStatus = Database::fetchAll('SELECT status, COUNT(*) AS cnt FROM vendor_bookings WHERE deleted_at IS NULL GROUP BY status');
        $vendorTopRated = Database::fetchAll('SELECT id, name, rating_avg AS rating FROM marketplace_vendors WHERE deleted_at IS NULL ORDER BY rating_avg DESC LIMIT 5');
        $vendorTopBook  = Database::fetchAll(
            'SELECT mv.id, mv.name, COUNT(vb.id) AS booking_count FROM marketplace_vendors mv
             LEFT JOIN vendor_bookings vb ON vb.vendor_id = mv.id AND vb.deleted_at IS NULL
             WHERE mv.deleted_at IS NULL GROUP BY mv.id, mv.name ORDER BY booking_count DESC LIMIT 5'
        );
        $vendorMonthly  = Database::fetchAll(
            "SELECT strftime('%Y-%m', created_at) AS month, COUNT(*) AS count FROM vendor_bookings
             WHERE created_at >= date('now', '-6 months') AND deleted_at IS NULL GROUP BY month ORDER BY month"
        );

        // rentals
        $rentalTotal   = (int) (Database::fetch('SELECT COUNT(*) AS n FROM rental_listings WHERE deleted_at IS NULL')['n'] ?? 0);
        $rentalActive  = (int) (Database::fetch("SELECT COUNT(*) AS n FROM rental_listings WHERE status = 'Active' AND deleted_at IS NULL")['n'] ?? 0);
        $rentalPending = (int) (Database::fetch("SELECT COUNT(*) AS n FROM rental_listings WHERE status = 'Pending' AND deleted_at IS NULL")['n'] ?? 0);
        $rentalTypes   = Database::fetchAll('SELECT listing_type AS type, COUNT(*) AS cnt FROM rental_listings WHERE deleted_at IS NULL GROUP BY listing_type');
        $rentalAvgRent = (float) (Database::fetch("SELECT COALESCE(AVG(price), 0) AS avg FROM rental_listings WHERE deleted_at IS NULL AND listing_type = 'Rent'")['avg'] ?? 0);
        $rentalMonthly = Database::fetchAll(
            "SELECT strftime('%Y-%m', created_at) AS month, COUNT(*) AS count FROM rental_listings
             WHERE created_at >= date('now', '-6 months') AND deleted_at IS NULL GROUP BY month ORDER BY month"
        );

        // visitors
        $visToday     = (int) (Database::fetch("SELECT COUNT(*) AS n FROM visitors WHERE date(entry_time) = date('now') AND deleted_at IS NULL")['n'] ?? 0);
        $visWeek      = (int) (Database::fetch("SELECT COUNT(*) AS n FROM visitors WHERE entry_time >= date('now', 'weekday 0', '-7 days') AND deleted_at IS NULL")['n'] ?? 0);
        $visMonth     = (int) (Database::fetch("SELECT COUNT(*) AS n FROM visitors WHERE strftime('%Y-%m', entry_time) = strftime('%Y-%m', 'now') AND deleted_at IS NULL")['n'] ?? 0);
        $visByDay     = Database::fetchAll(
            "SELECT CASE CAST(strftime('%w', entry_time) AS INTEGER)
                    WHEN 0 THEN 'Sun' WHEN 1 THEN 'Mon' WHEN 2 THEN 'Tue'
                    WHEN 3 THEN 'Wed' WHEN 4 THEN 'Thu' WHEN 5 THEN 'Fri'
                    ELSE 'Sat' END AS day,
                    CAST(strftime('%w', entry_time) AS INTEGER) AS dow,
                    COUNT(*) AS cnt
             FROM visitors WHERE deleted_at IS NULL GROUP BY dow ORDER BY dow"
        );
        $visMonthly   = Database::fetchAll(
            "SELECT strftime('%Y-%m', entry_time) AS month, COUNT(*) AS count FROM visitors
             WHERE entry_time >= date('now', '-6 months') AND deleted_at IS NULL GROUP BY month ORDER BY month"
        );

        // revenue
        $revTotals = Database::fetch(
            "SELECT COALESCE(SUM(amount), 0) AS total_invoiced,
                    COALESCE(SUM(paid_amount), 0) AS total_paid,
                    COALESCE(SUM(CASE WHEN status = 'Pending' THEN amount - paid_amount ELSE 0 END), 0) AS total_pending,
                    COALESCE(SUM(CASE WHEN status = 'Overdue'  THEN amount - paid_amount ELSE 0 END), 0) AS total_overdue
             FROM invoices WHERE deleted_at IS NULL"
        );
        $revStatus  = Database::fetchAll('SELECT status, COUNT(*) AS cnt FROM invoices WHERE deleted_at IS NULL GROUP BY status');
        $revMonthly = Database::fetchAll(
            "SELECT strftime('%Y-%m', created_at) AS month,
                    COALESCE(SUM(paid_amount), 0) AS paid,
                    COALESCE(SUM(amount - paid_amount), 0) AS pending
             FROM invoices WHERE created_at >= date('now', '-6 months') AND deleted_at IS NULL GROUP BY month ORDER BY month"
        );

        // workers
        $wTotal      = (int) (Database::fetch('SELECT COUNT(*) AS n FROM daily_workers WHERE deleted_at IS NULL')['n'] ?? 0);
        $wActive     = (int) (Database::fetch("SELECT COUNT(*) AS n FROM daily_workers WHERE status = 'Active' AND deleted_at IS NULL")['n'] ?? 0);
        $today       = date('Y-m-d');
        $weekStart   = date('Y-m-d', strtotime('monday this week'));
        $daysInRange = max(1, (int) ((strtotime($today) - strtotime($weekStart)) / 86400) + 1);
        $wPresent    = (int) (Database::fetch(
            "SELECT COUNT(DISTINCT worker_id) AS n FROM worker_attendance WHERE work_date = :today AND status = 'Present'",
            ['today' => $today]
        )['n'] ?? 0);
        $wWeekPresent = (int) (Database::fetch(
            "SELECT COUNT(*) AS n FROM worker_attendance WHERE work_date BETWEEN :start AND :end AND status = 'Present'",
            ['start' => $weekStart, 'end' => $today]
        )['n'] ?? 0);
        $wAttRate    = ($wActive * $daysInRange) > 0 ? round($wWeekPresent / ($wActive * $daysInRange) * 100, 1) : 0.0;
        $wByType     = Database::fetchAll('SELECT worker_type AS type, COUNT(*) AS cnt FROM daily_workers WHERE deleted_at IS NULL GROUP BY worker_type');

        ob_end_clean();

        Response::success([
            'occupancy' => [
                'total'          => $officeTotal,
                'occupied'       => $officeOccupied,
                'vacant'         => $officeVacant,
                'occupancy_rate' => $officeRate,
                'by_block'       => array_map(fn($r) => ['block' => $r['block'], 'occupied' => (int) $r['occupied'], 'total' => (int) $r['total']], $byBlock),
            ],
            'complaints' => [
                'total'                => $complaintTotal,
                'by_status'            => $this->toCountMap($complaintStatus, 'status', 'cnt'),
                'by_priority'          => $this->toCountMap($complaintPrio, 'priority', 'cnt'),
                'monthly_trend'        => $this->normaliseMonthly($complaintMonthly),
                'avg_resolution_hours' => round((float) ($complaintAvg['avg_hours'] ?? 0), 1),
            ],
            'maintenance' => [
                'total'                => $maintTotal,
                'by_status'            => $this->toCountMap($maintStatus, 'status', 'cnt'),
                'by_type'              => $this->toCountMap($maintType, 'type', 'cnt'),
                'pending'              => $maintPending,
                'monthly_trend'        => $this->normaliseMonthly($maintMonthly),
                'avg_resolution_hours' => round((float) ($maintAvg['avg_hours'] ?? 0), 1),
            ],
            'vendors' => [
                'total'              => $vendorTotal,
                'avg_rating'         => round($vendorAvgRat, 2),
                'total_bookings'     => $vendorBookings,
                'bookings_by_status' => $this->toCountMap($vendorBkStatus, 'status', 'cnt'),
                'top_rated'          => array_map(fn($r) => ['id' => (string) $r['id'], 'name' => $r['name'], 'rating' => round((float) $r['rating'], 2)], $vendorTopRated),
                'top_booked'         => array_map(fn($r) => ['id' => (string) $r['id'], 'name' => $r['name'], 'booking_count' => (int) $r['booking_count']], $vendorTopBook),
                'monthly_bookings'   => $this->normaliseMonthly($vendorMonthly),
            ],
            'rentals' => [
                'total'            => $rentalTotal,
                'active'           => $rentalActive,
                'pending_approval' => $rentalPending,
                'by_type'          => $this->toCountMap($rentalTypes, 'type', 'cnt'),
                'avg_rent'         => round($rentalAvgRent, 2),
                'monthly_listings' => $this->normaliseMonthly($rentalMonthly),
            ],
            'visitors' => [
                'today'          => $visToday,
                'this_week'      => $visWeek,
                'this_month'     => $visMonth,
                'by_day_of_week' => array_map(fn($r) => ['day' => $r['day'], 'count' => (int) $r['cnt']], $visByDay),
                'monthly_trend'  => $this->normaliseMonthly($visMonthly),
            ],
            'revenue' => [
                'total_invoiced'  => round((float) ($revTotals['total_invoiced'] ?? 0), 2),
                'total_paid'      => round((float) ($revTotals['total_paid'] ?? 0), 2),
                'total_pending'   => round((float) ($revTotals['total_pending'] ?? 0), 2),
                'total_overdue'   => round((float) ($revTotals['total_overdue'] ?? 0), 2),
                'monthly_revenue' => array_map(fn($r) => ['month' => $r['month'], 'paid' => round((float) $r['paid'], 2), 'pending' => round((float) $r['pending'], 2)], $revMonthly),
                'by_status'       => $this->toCountMap($revStatus, 'status', 'cnt'),
            ],
            'workers' => [
                'total_workers'              => $wTotal,
                'active'                     => $wActive,
                'today_present'              => $wPresent,
                'today_absent'               => max(0, $wActive - $wPresent),
                'attendance_rate_this_week'  => $wAttRate,
                'by_type'                    => $this->toCountMap($wByType, 'type', 'cnt'),
            ],
        ]);
    }

    // ── Helpers ──────────────────────────────────────────────────────────────

    /** Convert [{$keyCol => 'Foo', $valCol => 42}, ...] to ['Foo' => 42, ...] */
    private function toCountMap(array $rows, string $keyCol, string $valCol): array
    {
        $map = [];
        foreach ($rows as $row) {
            $key = (string) ($row[$keyCol] ?? 'Unknown');
            $map[$key] = (int) ($row[$valCol] ?? 0);
        }
        return $map;
    }

    /** Ensure each element has {month, count} with int count */
    private function normaliseMonthly(array $rows): array
    {
        return array_map(fn($r) => [
            'month' => (string) ($r['month'] ?? ''),
            'count' => (int) ($r['count'] ?? 0),
        ], $rows);
    }
}
