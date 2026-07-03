<?php

declare(strict_types=1);

class Invoice extends CrudModel
{
    protected static string $table = 'invoices';
    protected static array $columns = [
        'office_id', 'invoice_no', 'description', 'amount', 'paid_amount', 'due_date', 'status',
        // GST (029)
        'gstin', 'taxable_amount', 'gst_rate', 'cgst_amount', 'sgst_amount', 'igst_amount', 'gst_total',
    ];

    public const GST_RATES = [0.0, 5.0, 12.0, 18.0, 28.0];
    protected static array $searchColumns = ['invoice_no', 'description', 'status'];

    protected static function filters(Request $request): array
    {
        [$where, $params] = parent::filters($request);
        $conditions = $where !== '' ? [substr($where, 6)] : [];

        if (($request->query['office_id'] ?? '') !== '') {
            $conditions[] = 'office_id = :office_id';
            $params['office_id'] = (int) $request->query['office_id'];
        }

        return [$conditions ? 'WHERE ' . implode(' AND ', $conditions) : '', $params];
    }

    public static function recordPayment(int $invoiceId, float $amount, array $data, int $userId): array
    {
        if ($amount <= 0) {
            throw new AppException('Payment amount must be positive', 422);
        }

        return Database::transaction(function () use ($invoiceId, $amount, $data, $userId): array {
            $updated = Database::query(
                "UPDATE invoices
                 SET paid_amount = paid_amount + :amount_delta,
                     status = CASE
                         WHEN paid_amount + :amount_for_status >= amount THEN 'Paid'
                         ELSE 'Pending'
                     END,
                     updated_at = :now
                 WHERE id = :id
                   AND deleted_at IS NULL
                   AND status <> 'Cancelled'",
                [
                    'amount_delta' => $amount,
                    'amount_for_status' => $amount,
                    'now' => db_time(),
                    'id' => $invoiceId,
                ]
            )->rowCount();
            if ($updated !== 1) {
                $invoice = static::find($invoiceId);
                if (!$invoice) {
                    throw new AppException('Invoice not found', 404);
                }
                if ($invoice['status'] === 'Cancelled') {
                    throw new AppException('Cancelled invoice cannot receive payment', 409);
                }
                throw new AppException('Payment could not be recorded', 409);
            }

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
            return static::find($invoiceId);
        });
    }
}
