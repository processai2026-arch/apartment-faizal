<?php

declare(strict_types=1);

class AdminFinanceController extends ResourceController
{
    protected string $model = Invoice::class;
    protected array $requiredCreate = ['invoice_no', 'amount'];
    protected string $entityType = 'invoice';

    public function summary(Request $request): void
    {
        $rows = Database::fetchAll('SELECT status, COUNT(*) AS count, COALESCE(SUM(amount), 0) AS amount, COALESCE(SUM(paid_amount), 0) AS paid FROM invoices WHERE deleted_at IS NULL GROUP BY status');
        $totals = ['invoiceCount' => 0, 'billed' => 0.0, 'collected' => 0.0, 'pending' => 0.0, 'byStatus' => $rows];
        foreach ($rows as $row) {
            $totals['invoiceCount'] += (int) $row['count'];
            $totals['billed'] += (float) $row['amount'];
            $totals['collected'] += (float) $row['paid'];
        }
        $totals['pending'] = max(0, $totals['billed'] - $totals['collected']);
        Response::success($totals);
    }

    public function payment(Request $request): void
    {
        Validator::require($request->all(), ['amount']);
        $row = Invoice::recordPayment((int) $request->params['id'], (float) $request->input('amount'), $request->all(), (int) $request->user['id']);
        AuditService::log((int) $request->user['id'], 'invoice.payment', 'invoice', (int) $row['id'], ['amount' => (float) $request->input('amount')]);
        Response::success($row, 'Payment recorded');
    }
}
