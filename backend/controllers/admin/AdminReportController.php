<?php

declare(strict_types=1);

class AdminReportController
{
    public function show(Request $request): void
    {
        $type = Validator::enum((string) $request->params['type'], ['visitors', 'vehicles', 'staff-attendance', 'inventory', 'financials'], 'type');
        $from = (string) ($request->query['from'] ?? date('Y-m-01'));
        $to = (string) ($request->query['to'] ?? date('Y-m-d'));

        $data = match ($type) {
            'visitors' => Database::fetchAll('SELECT * FROM visitors WHERE date(entry_time) BETWEEN :from AND :to AND deleted_at IS NULL ORDER BY entry_time DESC', ['from' => $from, 'to' => $to]),
            'vehicles' => Database::fetchAll('SELECT * FROM vehicles WHERE date(entry_time) BETWEEN :from AND :to AND deleted_at IS NULL ORDER BY entry_time DESC', ['from' => $from, 'to' => $to]),
            'staff-attendance' => Database::fetchAll('SELECT s.name, s.role, a.* FROM staff_attendance a JOIN staff s ON s.id = a.staff_id WHERE a.attendance_date BETWEEN :from AND :to ORDER BY a.attendance_date DESC', ['from' => $from, 'to' => $to]),
            'inventory' => Database::fetchAll('SELECT * FROM inventory_items WHERE deleted_at IS NULL ORDER BY item_name'),
            'financials' => Database::fetchAll('SELECT * FROM invoices WHERE deleted_at IS NULL ORDER BY due_date DESC'),
        };

        Response::success(['type' => $type, 'from' => $from, 'to' => $to, 'rows' => $data]);
    }
}
