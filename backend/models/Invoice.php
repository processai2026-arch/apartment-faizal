<?php

declare(strict_types=1);

class Invoice extends CrudModel
{
    protected static string $table = 'invoices';
    protected static array $columns = ['office_id', 'invoice_no', 'description', 'amount', 'paid_amount', 'due_date', 'status'];
    protected static array $searchColumns = ['invoice_no', 'description', 'status'];

    public static function recordPayment(int $invoiceId, float $amount, array $data, int $userId): array
    {
        $invoice = static::find($invoiceId);
        if (!$invoice) {
            throw new AppException('Invoice not found', 404);
        }
        if ($invoice['status'] === 'Cancelled') {
            throw new AppException('Cancelled invoice cannot receive payment', 409);
        }
        if ($amount <= 0) {
            throw new AppException('Payment amount must be positive', 422);
        }

        return Database::transaction(function () use ($invoice, $invoiceId, $amount, $data, $userId): array {
            $paid = (float) $invoice['paid_amount'] + $amount;
            $status = $paid >= (float) $invoice['amount'] ? 'Paid' : 'Pending';
            Database::query(
                'INSERT INTO payments (invoice_id, amount, paid_at, mode, reference_no, actor_user_id, created_at)
                 VALUES (:invoice_id, :amount, :paid_at, :mode, :reference_no, :actor_user_id, :created_at)',
                [
                    'invoice_id' => $invoiceId,
                    'amount' => $amount,
                    'paid_at' => $data['paid_at'] ?? db_time(),
                    'mode' => $data['mode'] ?? null,
                    'reference_no' => $data['reference_no'] ?? null,
                    'actor_user_id' => $userId,
                    'created_at' => db_time(),
                ]
            );
            Database::query('UPDATE invoices SET paid_amount = :paid, status = :status, updated_at = :now WHERE id = :id', [
                'paid' => $paid,
                'status' => $status,
                'now' => db_time(),
                'id' => $invoiceId,
            ]);
            return static::find($invoiceId);
        });
    }
}
