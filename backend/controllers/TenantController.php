<?php

declare(strict_types=1);

class TenantController
{
    public function dashboard(Request $request): void
    {
        $officeId = $request->user['officeId'] ?? null;

        if (!$officeId) {
            Response::success([
                'office' => null,
                'visitors' => [],
                'vehicles' => [],
                'invoices' => [],
                'summary' => ['pendingApprovals' => 0, 'visitorsThisMonth' => 0, 'pendingPayments' => 0, 'pendingPaymentsAmount' => 0, 'recentNotifications' => 0],
            ]);
            return;
        }

        $officeId = (int) $officeId;
        $visitors = Visitor::presentMany(Database::fetchAll(
            'SELECT * FROM visitors WHERE office_id = :office_id AND deleted_at IS NULL ORDER BY entry_time DESC LIMIT 50',
            ['office_id' => $officeId]
        ));
        $vehicles = Vehicle::presentMany(Database::fetchAll(
            'SELECT * FROM vehicles WHERE office_id = :office_id AND deleted_at IS NULL ORDER BY entry_time DESC LIMIT 50',
            ['office_id' => $officeId]
        ));
        $invoices = Database::fetchAll(
            'SELECT id, invoice_no, description, amount, paid_amount, due_date, status, created_at
             FROM invoices WHERE office_id = :office_id AND deleted_at IS NULL ORDER BY due_date ASC, id DESC',
            ['office_id' => $officeId]
        );

        $monthStart = date('Y-m-01 00:00:00');
        $visitorsThisMonth = (int) (Database::fetch(
            'SELECT COUNT(*) AS c FROM visitors WHERE office_id = :office_id AND deleted_at IS NULL AND entry_time >= :since',
            ['office_id' => $officeId, 'since' => $monthStart]
        )['c'] ?? 0);

        $pendingPayments = array_values(array_filter($invoices, fn ($i) => in_array($i['status'], ['Pending', 'Overdue'], true)));
        $pendingAmount = array_sum(array_map(fn ($i) => (float) $i['amount'] - (float) $i['paid_amount'], $pendingPayments));

        Response::success([
            'office' => Office::find($officeId),
            'visitors' => $visitors,
            'vehicles' => $vehicles,
            'invoices' => $invoices,
            'summary' => [
                'pendingApprovals' => 0,
                'visitorsThisMonth' => $visitorsThisMonth,
                'pendingPayments' => count($pendingPayments),
                'pendingPaymentsAmount' => round($pendingAmount, 2),
                'recentNotifications' => Notification::summaryForUser((int) $request->user['id'])['unreadCount'] ?? 0,
            ],
        ]);
    }
}



