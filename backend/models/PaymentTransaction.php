<?php

declare(strict_types=1);

class PaymentTransaction extends CrudModel
{
    protected static string $table = 'payment_transactions';
    protected static array $columns = [
        'invoice_id',
        'razorpay_order_id',
        'razorpay_payment_id',
        'razorpay_signature',
        'amount',
        'currency',
        'status',
        'payment_method',
        'error_code',
        'error_description',
        'webhook_received',
        'metadata',
    ];

    protected static function expose(array $row): array
    {
        $row['id']         = isset($row['id']) ? (int) $row['id'] : null;
        $row['invoice_id'] = isset($row['invoice_id']) ? (int) $row['invoice_id'] : null;
        $row['amount']     = isset($row['amount']) ? (float) $row['amount'] : 0.0;
        $row['webhook_received'] = (int) ($row['webhook_received'] ?? 0);
        return $row;
    }

    /**
     * Return all transactions for a specific invoice.
     */
    public static function forInvoice(int $invoiceId): array
    {
        $rows = Database::fetchAll(
            'SELECT * FROM payment_transactions WHERE invoice_id = :invoice_id ORDER BY id DESC',
            ['invoice_id' => $invoiceId]
        );
        return array_map(fn (array $row) => static::expose($row), $rows);
    }

    /**
     * Create a new transaction record from a Razorpay order response.
     *
     * @param  int   $invoiceId  Internal invoice ID.
     * @param  array $order      Razorpay order object returned by createOrder().
     * @return array  The newly created transaction row.
     */
    public static function createFromOrder(int $invoiceId, array $order): array
    {
        $now = db_time();
        $id  = Database::insert(
            'INSERT INTO payment_transactions
               (invoice_id, razorpay_order_id, amount, currency, status, webhook_received, created_at, updated_at)
             VALUES
               (:invoice_id, :razorpay_order_id, :amount, :currency, :status, 0, :created_at, :updated_at)',
            [
                'invoice_id'        => $invoiceId,
                'razorpay_order_id' => $order['id'] ?? null,
                'amount'            => isset($order['amount']) ? (float) $order['amount'] / 100 : 0.0,
                'currency'          => $order['currency'] ?? 'INR',
                'status'            => 'created',
                'created_at'        => $now,
                'updated_at'        => $now,
            ]
        );
        $row = Database::fetch('SELECT * FROM payment_transactions WHERE id = :id', ['id' => $id]);
        return static::expose($row);
    }
}
