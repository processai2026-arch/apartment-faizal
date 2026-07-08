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

    public function store(Request $request): void
    {
        Validator::require($request->all(), $this->requiredCreate);
        $row = $this->model::create($this->prepare($request->all(), $request));
        AuditService::log((int) $request->user['id'], $this->entityType . '.create', $this->entityType, (int) $row['id']);
        NotificationService::notifyInvoiceGenerated($row, (int) $request->user['id']);
        Response::success($row, 'Created', 201);
    }

    public function payment(Request $request): void
    {
        Validator::require($request->all(), ['amount']);
        $row = Invoice::recordPayment((int) $request->params['id'], (float) $request->input('amount'), $request->all(), (int) $request->user['id']);
        AuditService::log((int) $request->user['id'], 'invoice.payment', 'invoice', (int) $row['id'], ['amount' => (float) $request->input('amount')]);
        NotificationService::notifyPaymentReceived($row, (float) $request->input('amount'), (int) $request->user['id']);
        Response::success($row, 'Payment recorded');
    }

    // ── P24 Razorpay Payment Methods ─────────────────────────────────────────

    /**
     * POST /admin/invoices/{id}/payment-order
     * Creates a Razorpay order and a local payment_transactions record.
     */
    public function createPaymentOrder(Request $request): void
    {
        $invoiceId = (int) $request->params['id'];
        $invoice = Invoice::find($invoiceId);
        if (!$invoice) {
            throw new AppException('Invoice not found', 404);
        }
        if ($invoice['status'] === 'Paid') {
            throw new AppException('Invoice is already paid', 409);
        }
        if ($invoice['status'] === 'Cancelled') {
            throw new AppException('Cancelled invoice cannot be paid', 409);
        }

        $outstanding  = max(0.0, (float) $invoice['amount'] - (float) $invoice['paid_amount']);
        if ($outstanding <= 0) {
            throw new AppException('Invoice has no outstanding balance', 409);
        }

        $amountPaise  = (int) round($outstanding * 100);
        $receiptId    = 'inv_' . $invoiceId . '_' . time();
        $notes        = [
            'invoice_id' => (string) $invoiceId,
            'invoice_no' => $invoice['invoice_no'] ?? '',
        ];

        $razorpay = new RazorpayService();
        $order    = $razorpay->createOrder($amountPaise, 'INR', $receiptId, $notes);

        // Persist order_id on invoice
        Database::query(
            'UPDATE invoices SET razorpay_order_id = :order_id, payment_gateway_status = :gw_status,
                payment_initiated_at = :initiated_at, payment_method = :method, updated_at = :now
             WHERE id = :id AND deleted_at IS NULL',
            [
                'order_id'    => $order['id'],
                'gw_status'   => 'created',
                'initiated_at' => db_time(),
                'method'      => 'razorpay',
                'now'         => db_time(),
                'id'          => $invoiceId,
            ]
        );

        // Create local transaction record
        PaymentTransaction::createFromOrder($invoiceId, $order);

        Response::success([
            'order_id'   => $order['id'],
            'amount'     => $amountPaise,
            'currency'   => $order['currency'] ?? 'INR',
            'key_id'     => (string) config('app.razorpay_key_id'),
            'invoice_id' => $invoiceId,
        ], 'Payment order created');
    }

    /**
     * POST /admin/invoices/{id}/verify-payment
     * Verifies Razorpay signature and marks invoice as Paid.
     */
    public function verifyPayment(Request $request): void
    {
        $invoiceId = (int) $request->params['id'];
        $invoice   = Invoice::find($invoiceId);
        if (!$invoice) {
            throw new AppException('Invoice not found', 404);
        }

        Validator::require($request->all(), ['razorpay_order_id', 'razorpay_payment_id', 'razorpay_signature']);

        $orderId    = (string) $request->input('razorpay_order_id');
        $paymentId  = (string) $request->input('razorpay_payment_id');
        $signature  = (string) $request->input('razorpay_signature');

        $razorpay = new RazorpayService();
        if (!$razorpay->verifySignature($orderId, $paymentId, $signature)) {
            throw new AppException('Payment signature verification failed', 422);
        }

        // BUG-10 fix: idempotency — return success if already verified with same payment
        if ($invoice['status'] === 'Paid' && $invoice['razorpay_payment_id'] === $paymentId) {
            Response::success(Invoice::find($invoiceId), 'Payment already verified');
            return;
        }
        if ($invoice['status'] === 'Paid') {
            throw new AppException('Invoice is already paid with a different payment', 409);
        }

        // BUG-01 fix: ensure the order_id in the request matches the invoice's order_id
        if (!empty($invoice['razorpay_order_id']) && $invoice['razorpay_order_id'] !== $orderId) {
            throw new AppException('Payment order does not match this invoice', 422);
        }

        $now = db_time();

        // Update invoice
        Database::query(
            'UPDATE invoices
             SET status = :status,
                 paid_amount = amount,
                 razorpay_payment_id = :payment_id,
                 razorpay_signature = :signature,
                 payment_gateway_status = :gw_status,
                 payment_completed_at = :completed_at,
                 updated_at = :now
             WHERE id = :id AND deleted_at IS NULL',
            [
                'status'       => 'Paid',
                'payment_id'   => $paymentId,
                'signature'    => $signature,
                'gw_status'    => 'paid',
                'completed_at' => $now,
                'now'          => $now,
                'id'           => $invoiceId,
            ]
        );

        // Update transaction record
        Database::query(
            "UPDATE payment_transactions
             SET status = 'paid',
                 razorpay_payment_id = :payment_id,
                 razorpay_signature = :signature,
                 updated_at = :now
             WHERE invoice_id = :invoice_id
               AND razorpay_order_id = :order_id",
            [
                'payment_id' => $paymentId,
                'signature'  => $signature,
                'now'        => $now,
                'invoice_id' => $invoiceId,
                'order_id'   => $orderId,
            ]
        );

        $updated = Invoice::find($invoiceId);
        AuditService::log(
            (int) $request->user['id'],
            'invoice.razorpay_payment',
            'invoice',
            $invoiceId,
            ['payment_id' => $paymentId, 'order_id' => $orderId]
        );

        Response::success($updated, 'Payment verified and recorded');
    }

    /**
     * GET /admin/invoices/{id}/payment-history
     * Returns all PaymentTransaction records for the invoice.
     */
    public function paymentHistory(Request $request): void
    {
        $invoiceId = (int) $request->params['id'];
        $invoice   = Invoice::find($invoiceId);
        if (!$invoice) {
            throw new AppException('Invoice not found', 404);
        }
        $transactions = PaymentTransaction::forInvoice($invoiceId);
        Response::success($transactions);
    }

    /**
     * POST /admin/invoices/{id}/retry-payment
     * Creates a fresh Razorpay order for an invoice (resets previous failed order).
     */
    public function retryPayment(Request $request): void
    {
        // Delegates entirely to createPaymentOrder — fresh order each time
        $this->createPaymentOrder($request);
    }

    /**
     * POST /admin/invoices/{id}/refund
     * Initiates a refund for a paid invoice.
     */
    public function refundPayment(Request $request): void
    {
        $invoiceId = (int) $request->params['id'];
        $invoice   = Invoice::find($invoiceId);
        if (!$invoice) {
            throw new AppException('Invoice not found', 404);
        }
        if ($invoice['status'] !== 'Paid') {
            throw new AppException('Only paid invoices can be refunded', 409);
        }
        if (($invoice['refund_status'] ?? 'None') === 'Pending' || ($invoice['refund_status'] ?? 'None') === 'Processed') {
            throw new AppException('A refund is already in progress or has been processed for this invoice', 409);
        }

        $paymentId = $invoice['razorpay_payment_id'] ?? '';
        if (empty($paymentId)) {
            throw new AppException('No Razorpay payment ID found on this invoice — cannot refund', 422);
        }

        $amountPaise = (int) round((float) $invoice['amount'] * 100);
        $razorpay    = new RazorpayService();
        $refund      = $razorpay->initiateRefund($paymentId, $amountPaise);

        $now = db_time();
        Database::query(
            'UPDATE invoices
             SET refund_id = :refund_id, refund_status = :refund_status, updated_at = :now
             WHERE id = :id AND deleted_at IS NULL',
            [
                'refund_id'     => $refund['id'] ?? null,
                'refund_status' => 'Pending',
                'now'           => $now,
                'id'            => $invoiceId,
            ]
        );

        // Update transaction status
        Database::query(
            "UPDATE payment_transactions
             SET status = 'refunded', updated_at = :now
             WHERE invoice_id = :invoice_id AND razorpay_payment_id = :payment_id",
            [
                'now'        => $now,
                'invoice_id' => $invoiceId,
                'payment_id' => $paymentId,
            ]
        );

        AuditService::log(
            (int) $request->user['id'],
            'invoice.refund_initiated',
            'invoice',
            $invoiceId,
            ['refund_id' => $refund['id'] ?? null, 'payment_id' => $paymentId]
        );

        Response::success([
            'status'    => 'pending',
            'message'   => 'Refund initiated successfully',
            'refund_id' => $refund['id'] ?? null,
        ], 'Refund initiated');
    }

    /**
     * POST /payments/webhook
     * Public endpoint — no auth middleware. Handles Razorpay webhook events.
     */
    public function handleWebhook(Request $request): void
    {
        $rawBody         = file_get_contents('php://input') ?: '';
        $headerSignature = $_SERVER['HTTP_X_RAZORPAY_SIGNATURE'] ?? '';

        $razorpay = new RazorpayService();
        if (!$razorpay->verifyWebhookSignature($rawBody, $headerSignature)) {
            // Return 200 to prevent Razorpay from retrying, but log the failure
            error_log('[Webhook] Signature mismatch — ignoring event');
            Response::success(['received' => false], 'Signature mismatch');
            return;
        }

        $payload = json_decode($rawBody, true);
        if (!is_array($payload)) {
            Response::success(['received' => true], 'OK');
            return;
        }

        $event      = $payload['event'] ?? '';
        $paymentObj = $payload['payload']['payment']['entity'] ?? [];
        $refundObj  = $payload['payload']['refund']['entity'] ?? [];

        $now = db_time();

        switch ($event) {
            case 'payment.captured':
                $paymentId = $paymentObj['id'] ?? '';
                $orderId   = $paymentObj['order_id'] ?? '';
                if ($paymentId && $orderId) {
                    // Find the matching transaction
                    $tx = Database::fetch(
                        'SELECT * FROM payment_transactions WHERE razorpay_order_id = :order_id LIMIT 1',
                        ['order_id' => $orderId]
                    );
                    if ($tx && $tx['status'] !== 'paid') {
                        $invoiceId = (int) $tx['invoice_id'];
                        Database::query(
                            "UPDATE payment_transactions
                             SET status = 'paid', razorpay_payment_id = :payment_id,
                                 webhook_received = 1, updated_at = :now
                             WHERE id = :id",
                            ['payment_id' => $paymentId, 'now' => $now, 'id' => $tx['id']]
                        );
                        Database::query(
                            "UPDATE invoices
                             SET status = 'Paid', paid_amount = amount,
                                 razorpay_payment_id = :payment_id,
                                 payment_gateway_status = 'paid',
                                 payment_completed_at = :completed_at, updated_at = :now
                             WHERE id = :id AND deleted_at IS NULL AND status <> 'Paid'",
                            ['payment_id' => $paymentId, 'completed_at' => $now, 'now' => $now, 'id' => $invoiceId]
                        );
                    }
                }
                break;

            case 'payment.failed':
                $paymentId = $paymentObj['id'] ?? '';
                $orderId   = $paymentObj['order_id'] ?? '';
                $errCode   = $paymentObj['error_code'] ?? '';
                $errDesc   = $paymentObj['error_description'] ?? '';
                if ($orderId) {
                    Database::query(
                        "UPDATE payment_transactions
                         SET status = 'failed', error_code = :err_code, error_description = :err_desc,
                             razorpay_payment_id = :payment_id, webhook_received = 1, updated_at = :now
                         WHERE razorpay_order_id = :order_id",
                        [
                            'err_code'   => $errCode,
                            'err_desc'   => $errDesc,
                            'payment_id' => $paymentId,
                            'now'        => $now,
                            'order_id'   => $orderId,
                        ]
                    );
                    Database::query(
                        "UPDATE invoices
                         SET payment_gateway_status = 'failed', updated_at = :now
                         WHERE razorpay_order_id = :order_id AND deleted_at IS NULL",
                        ['now' => $now, 'order_id' => $orderId]
                    );
                }
                break;

            case 'refund.processed':
                $refundId  = $refundObj['id'] ?? '';
                $paymentId = $refundObj['payment_id'] ?? '';
                if ($paymentId) {
                    Database::query(
                        "UPDATE invoices
                         SET refund_status = 'Processed', updated_at = :now
                         WHERE razorpay_payment_id = :payment_id AND deleted_at IS NULL",
                        ['now' => $now, 'payment_id' => $paymentId]
                    );
                    Database::query(
                        "UPDATE payment_transactions
                         SET status = 'refunded', webhook_received = 1, updated_at = :now
                         WHERE razorpay_payment_id = :payment_id",
                        ['now' => $now, 'payment_id' => $paymentId]
                    );
                }
                break;

            default:
                // Unknown events are acknowledged silently
                break;
        }

        Response::success(['received' => true], 'Webhook processed');
    }

    /**
     * GET /admin/payments/dashboard
     * Aggregated payment metrics.
     */
    public function paymentDashboard(Request $request): void
    {
        // Financial totals
        $summary = Database::fetchAll(
            'SELECT status, COALESCE(SUM(amount),0) AS total_amount FROM invoices WHERE deleted_at IS NULL GROUP BY status'
        );

        $totalInvoiced = 0.0;
        $totalPaid     = 0.0;
        $totalPending  = 0.0;
        $totalOverdue  = 0.0;
        $byStatus      = [];

        foreach ($summary as $row) {
            $byStatus[$row['status']] = (float) $row['total_amount'];
            $totalInvoiced += (float) $row['total_amount'];
            if ($row['status'] === 'Paid') {
                $totalPaid = (float) $row['total_amount'];
            } elseif ($row['status'] === 'Pending') {
                $totalPending = (float) $row['total_amount'];
            } elseif ($row['status'] === 'Overdue') {
                $totalOverdue = (float) $row['total_amount'];
            }
        }

        // Today's payments (invoices paid today)
        $todayPayments = (float) (Database::fetch(
            "SELECT COALESCE(SUM(amount),0) AS total FROM invoices
             WHERE deleted_at IS NULL AND status = 'Paid'
               AND " . sql_date('payment_completed_at') . ' = ' . sql_current_date()
        )['total'] ?? 0.0);

        // This month revenue
        $thisMonthRevenue = (float) (Database::fetch(
            "SELECT COALESCE(SUM(amount),0) AS total FROM invoices
             WHERE deleted_at IS NULL AND status = 'Paid'
               AND " . sql_month('payment_completed_at') . ' = ' . sql_month_now()
        )['total'] ?? 0.0);

        // Payment method breakdown (from payment_transactions)
        $methodRows    = Database::fetchAll(
            "SELECT payment_method, COUNT(*) AS cnt FROM payment_transactions
             WHERE status = 'paid' GROUP BY payment_method"
        );
        $paymentMethods = [];
        foreach ($methodRows as $row) {
            $paymentMethods[$row['payment_method'] ?? 'unknown'] = (int) $row['cnt'];
        }

        // Recent 10 transactions
        $recentTxRows = Database::fetchAll(
            'SELECT pt.*, i.invoice_no FROM payment_transactions pt
             LEFT JOIN invoices i ON i.id = pt.invoice_id
             ORDER BY pt.id DESC LIMIT 10'
        );
        $recentTransactions = array_map(function (array $row): array {
            return [
                'id'                  => (int) $row['id'],
                'invoice_id'          => (int) $row['invoice_id'],
                'invoice_no'          => $row['invoice_no'] ?? null,
                'razorpay_order_id'   => $row['razorpay_order_id'] ?? null,
                'razorpay_payment_id' => $row['razorpay_payment_id'] ?? null,
                'amount'              => (float) $row['amount'],
                'currency'            => $row['currency'] ?? 'INR',
                'status'              => $row['status'] ?? 'created',
                'payment_method'      => $row['payment_method'] ?? null,
                'error_code'          => $row['error_code'] ?? null,
                'error_description'   => $row['error_description'] ?? null,
                'created_at'          => $row['created_at'] ?? null,
            ];
        }, $recentTxRows);

        // Transaction status counts
        $txStatusRows = Database::fetchAll(
            'SELECT status, COUNT(*) AS cnt FROM payment_transactions GROUP BY status'
        );
        $txByStatus = [];
        foreach ($txStatusRows as $row) {
            $txByStatus[$row['status']] = (int) $row['cnt'];
        }

        Response::success([
            'total_invoiced'      => $totalInvoiced,
            'total_paid'          => $totalPaid,
            'total_pending'       => $totalPending,
            'total_overdue'       => $totalOverdue,
            'today_payments'      => $todayPayments,
            'this_month_revenue'  => $thisMonthRevenue,
            'payment_methods'     => $paymentMethods,
            'recent_transactions' => $recentTransactions,
            'by_status'           => $txByStatus,
        ]);
    }

    /**
     * GET /admin/financials/gst-report?from&to
     * Output tax (GST charged on invoices) vs input tax (GST paid on office
     * expenses) for the period, with per-rate breakup and net GST liability.
     */
    public function gstReport(Request $request): void
    {
        $from = (string) ($request->query['from'] ?? date('Y-m-01'));
        $to   = (string) ($request->query['to'] ?? date('Y-m-d'));

        // ── Output tax: invoices raised in the period carrying GST fields ──
        $invoiceRows = Database::fetchAll(
            "SELECT * FROM invoices
             WHERE deleted_at IS NULL
               AND status <> 'Cancelled'
               AND (gst_rate IS NOT NULL OR COALESCE(gst_total, 0) <> 0)
               AND " . sql_date('created_at') . ' BETWEEN :from AND :to
             ORDER BY id ASC',
            ['from' => $from, 'to' => $to]
        );

        $output = ['taxable' => 0.0, 'cgst' => 0.0, 'sgst' => 0.0, 'igst' => 0.0, 'total' => 0.0, 'byRate' => [], 'invoices' => []];
        $outputByRate = [];
        foreach ($invoiceRows as $row) {
            $rate    = (float) ($row['gst_rate'] ?? 0);
            $taxable = (float) ($row['taxable_amount'] ?? 0);
            $tax     = (float) ($row['gst_total'] ?? 0);
            $output['taxable'] += $taxable;
            $output['cgst']    += (float) ($row['cgst_amount'] ?? 0);
            $output['sgst']    += (float) ($row['sgst_amount'] ?? 0);
            $output['igst']    += (float) ($row['igst_amount'] ?? 0);
            $output['total']   += $tax;
            $key = (string) $rate;
            $outputByRate[$key] ??= ['rate' => $rate, 'taxable' => 0.0, 'tax' => 0.0];
            $outputByRate[$key]['taxable'] += $taxable;
            $outputByRate[$key]['tax']     += $tax;
            $output['invoices'][] = [
                'id'             => (int) $row['id'],
                'invoice_no'     => $row['invoice_no'],
                'date'           => $row['created_at'],
                'gstin'          => $row['gstin'] ?? null,
                'taxable_amount' => $taxable,
                'gst_rate'       => $rate,
                'cgst_amount'    => (float) ($row['cgst_amount'] ?? 0),
                'sgst_amount'    => (float) ($row['sgst_amount'] ?? 0),
                'igst_amount'    => (float) ($row['igst_amount'] ?? 0),
                'gst_total'      => $tax,
                'amount'         => (float) ($row['amount'] ?? 0),
                'status'         => $row['status'],
            ];
        }
        ksort($outputByRate, SORT_NUMERIC);
        $output['byRate'] = array_values($outputByRate);

        // ── Input tax: GST paid on office expenses (amount is GST-inclusive) ──
        $expenseRows = Database::fetchAll(
            "SELECT * FROM office_expenses
             WHERE deleted_at IS NULL
               AND status <> 'Rejected'
               AND (gst_rate IS NOT NULL OR COALESCE(gst_amount, 0) <> 0)
               AND " . sql_date('expense_date') . ' BETWEEN :from AND :to
             ORDER BY id ASC',
            ['from' => $from, 'to' => $to]
        );

        $input = ['taxable' => 0.0, 'cgst' => 0.0, 'sgst' => 0.0, 'igst' => 0.0, 'total' => 0.0, 'byRate' => [], 'expenses' => []];
        $inputByRate = [];
        foreach ($expenseRows as $row) {
            $rate    = (float) ($row['gst_rate'] ?? 0);
            $tax     = (float) ($row['gst_amount'] ?? 0);
            $taxable = max(0.0, (float) ($row['amount'] ?? 0) - $tax);
            $input['taxable'] += $taxable;
            $input['cgst']    += $tax / 2;
            $input['sgst']    += $tax / 2;
            $input['total']   += $tax;
            $key = (string) $rate;
            $inputByRate[$key] ??= ['rate' => $rate, 'taxable' => 0.0, 'tax' => 0.0];
            $inputByRate[$key]['taxable'] += $taxable;
            $inputByRate[$key]['tax']     += $tax;
            $input['expenses'][] = [
                'id'             => (int) $row['id'],
                'expense_no'     => $row['expense_no'],
                'date'           => $row['expense_date'],
                'payee'          => $row['payee'] ?? null,
                'gstin'          => $row['gstin'] ?? null,
                'category'       => $row['category'],
                'taxable_amount' => $taxable,
                'gst_rate'       => $rate,
                'gst_amount'     => $tax,
                'amount'         => (float) ($row['amount'] ?? 0),
            ];
        }
        ksort($inputByRate, SORT_NUMERIC);
        $input['byRate'] = array_values($inputByRate);

        Response::success([
            'from'      => $from,
            'to'        => $to,
            'outputTax' => $output,
            'inputTax'  => $input,
            'netGst'    => round($output['total'] - $input['total'], 2),
        ]);
    }
}
