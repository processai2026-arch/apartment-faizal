<?php

declare(strict_types=1);

class AdminExpenseController
{
    public function index(Request $request): void
    {
        [$rows, $total, $page, $perPage] = OfficeExpense::list($request);
        Response::paginated($rows, $total, $page, $perPage);
    }

    public function show(Request $request): void
    {
        $expense = OfficeExpense::find((int) $request->params['id']);
        if (!$expense) {
            throw new AppException('Expense not found', 404);
        }
        Response::success($expense);
    }

    public function store(Request $request): void
    {
        Validator::require($request->all(), ['category', 'payment_method', 'amount']);
        Validator::enum((string) $request->input('category'), OfficeExpense::CATEGORIES, 'category');
        Validator::enum((string) $request->input('payment_method'), OfficeExpense::PAYMENT_METHODS, 'payment_method');
        if ($request->input('status') !== null && $request->input('status') !== '') {
            Validator::enum((string) $request->input('status'), OfficeExpense::STATUSES, 'status');
        }

        $expense = OfficeExpense::create([
            'expense_no'                 => OfficeExpense::nextExpenseNo(),
            'category'                   => $request->input('category'),
            'payment_method'             => $request->input('payment_method'),
            'payee'                      => $request->input('payee') ?: null,
            'description'                => $request->input('description') ?: null,
            'amount'                     => (float) $request->input('amount'),
            'expense_date'               => $request->input('expense_date') ?: date('Y-m-d'),
            'cheque_no'                  => $request->input('cheque_no') ?: null,
            'cheque_date'                => $request->input('cheque_date') ?: null,
            'bank_name'                  => $request->input('bank_name') ?: null,
            'cheque_front_attachment_id' => $request->input('cheque_front_attachment_id') ? (int) $request->input('cheque_front_attachment_id') : null,
            'cheque_back_attachment_id'  => $request->input('cheque_back_attachment_id') ? (int) $request->input('cheque_back_attachment_id') : null,
            'receipt_attachment_id'      => $request->input('receipt_attachment_id') ? (int) $request->input('receipt_attachment_id') : null,
            'status'                     => $request->input('status') ?: 'Pending',
            'notes'                      => $request->input('notes') ?: null,
            'created_by'                 => (int) $request->user['id'],
            // GST input-tax fields (optional)
            'gstin'                      => $request->input('gstin') ?: null,
            'gst_rate'                   => $request->input('gst_rate') !== null && $request->input('gst_rate') !== '' ? (float) $request->input('gst_rate') : null,
            'gst_amount'                 => $request->input('gst_amount') !== null && $request->input('gst_amount') !== '' ? (float) $request->input('gst_amount') : null,
        ]);
        AuditService::log((int) $request->user['id'], 'office_expense.create', 'office_expense', (int) $expense['id']);
        Response::success($expense, 'Expense recorded', 201);
    }

    public function update(Request $request): void
    {
        $expense = OfficeExpense::find((int) $request->params['id']);
        if (!$expense) {
            throw new AppException('Expense not found', 404);
        }
        if ($request->input('category') !== null) {
            Validator::enum((string) $request->input('category'), OfficeExpense::CATEGORIES, 'category');
        }
        if ($request->input('payment_method') !== null) {
            Validator::enum((string) $request->input('payment_method'), OfficeExpense::PAYMENT_METHODS, 'payment_method');
        }
        if ($request->input('status') !== null) {
            Validator::enum((string) $request->input('status'), OfficeExpense::STATUSES, 'status');
        }

        $data = array_filter([
            'category'                   => $request->input('category'),
            'payment_method'             => $request->input('payment_method'),
            'payee'                      => $request->input('payee'),
            'description'                => $request->input('description'),
            'amount'                     => $request->input('amount') !== null ? (float) $request->input('amount') : null,
            'expense_date'               => $request->input('expense_date'),
            'cheque_no'                  => $request->input('cheque_no'),
            'cheque_date'                => $request->input('cheque_date'),
            'bank_name'                  => $request->input('bank_name'),
            'cheque_front_attachment_id' => $request->input('cheque_front_attachment_id') ? (int) $request->input('cheque_front_attachment_id') : null,
            'cheque_back_attachment_id'  => $request->input('cheque_back_attachment_id') ? (int) $request->input('cheque_back_attachment_id') : null,
            'receipt_attachment_id'      => $request->input('receipt_attachment_id') ? (int) $request->input('receipt_attachment_id') : null,
            'status'                     => $request->input('status'),
            'notes'                      => $request->input('notes'),
            'gstin'                      => $request->input('gstin'),
            'gst_rate'                   => $request->input('gst_rate') !== null && $request->input('gst_rate') !== '' ? (float) $request->input('gst_rate') : null,
            'gst_amount'                 => $request->input('gst_amount') !== null && $request->input('gst_amount') !== '' ? (float) $request->input('gst_amount') : null,
        ], fn ($v) => $v !== null);

        // Stamp approver when the expense transitions into Approved/Paid.
        $newStatus = $request->input('status');
        if ($newStatus !== null && in_array($newStatus, ['Approved', 'Paid'], true) && $expense['status'] !== $newStatus) {
            $data['approved_by'] = (int) $request->user['id'];
        }

        $updated = OfficeExpense::update((int) $expense['id'], $data);
        AuditService::log((int) $request->user['id'], 'office_expense.update', 'office_expense', (int) $updated['id']);
        Response::success($updated, 'Expense updated');
    }

    public function destroy(Request $request): void
    {
        $expense = OfficeExpense::find((int) $request->params['id']);
        if (!$expense) {
            throw new AppException('Expense not found', 404);
        }
        OfficeExpense::softDelete((int) $expense['id']);
        AuditService::log((int) $request->user['id'], 'office_expense.delete', 'office_expense', (int) $expense['id']);
        Response::success([], 'Expense removed');
    }

    /** GET /admin/expenses/summary — dashboard totals. */
    public function summary(Request $request): void
    {
        $monthTotal = (float) (Database::fetch(
            "SELECT COALESCE(SUM(amount), 0) AS total FROM office_expenses
             WHERE deleted_at IS NULL AND status <> 'Rejected'
               AND " . sql_month('expense_date') . ' = ' . sql_month_now()
        )['total'] ?? 0.0);

        $pettyCashTotal = (float) (Database::fetch(
            "SELECT COALESCE(SUM(amount), 0) AS total FROM office_expenses
             WHERE deleted_at IS NULL AND status <> 'Rejected' AND payment_method = 'Petty Cash'
               AND " . sql_month('expense_date') . ' = ' . sql_month_now()
        )['total'] ?? 0.0);

        $chequeTotal = (float) (Database::fetch(
            "SELECT COALESCE(SUM(amount), 0) AS total FROM office_expenses
             WHERE deleted_at IS NULL AND status <> 'Rejected' AND payment_method = 'Cheque'
               AND " . sql_month('expense_date') . ' = ' . sql_month_now()
        )['total'] ?? 0.0);

        $pendingCount = (int) (Database::fetch(
            "SELECT COUNT(*) AS c FROM office_expenses WHERE deleted_at IS NULL AND status = 'Pending'"
        )['c'] ?? 0);

        $byCategory = Database::fetchAll(
            "SELECT category, COUNT(*) AS count, COALESCE(SUM(amount), 0) AS amount
             FROM office_expenses
             WHERE deleted_at IS NULL AND status <> 'Rejected'
               AND " . sql_month('expense_date') . ' = ' . sql_month_now() . '
             GROUP BY category'
        );

        Response::success([
            'month_total'      => $monthTotal,
            'petty_cash_total' => $pettyCashTotal,
            'cheque_total'     => $chequeTotal,
            'pending_count'    => $pendingCount,
            'by_category'      => $byCategory,
        ]);
    }

    /** GET /admin/expenses/report?from&to&payment_method — rows + totals for printing. */
    public function report(Request $request): void
    {
        $conditions = ["deleted_at IS NULL", "status <> 'Rejected'"];
        $params = [];

        if (($request->query['from'] ?? '') !== '') {
            $conditions[] = sql_date('expense_date') . ' >= :from_date';
            $params['from_date'] = $request->query['from'];
        }
        if (($request->query['to'] ?? '') !== '') {
            $conditions[] = sql_date('expense_date') . ' <= :to_date';
            $params['to_date'] = $request->query['to'];
        }
        if (($request->query['payment_method'] ?? '') !== '') {
            Validator::enum((string) $request->query['payment_method'], OfficeExpense::PAYMENT_METHODS, 'payment_method');
            $conditions[] = 'payment_method = :payment_method';
            $params['payment_method'] = $request->query['payment_method'];
        }

        $where = 'WHERE ' . implode(' AND ', $conditions);
        $rows = Database::fetchAll(
            "SELECT * FROM office_expenses {$where} ORDER BY expense_date ASC, id ASC",
            $params
        );

        $totalAmount = 0.0;
        $byMethod = [];
        foreach ($rows as $row) {
            $totalAmount += (float) $row['amount'];
            $method = (string) ($row['payment_method'] ?? 'Other');
            $byMethod[$method] = ($byMethod[$method] ?? 0.0) + (float) $row['amount'];
        }

        Response::success([
            'rows'   => $rows,
            'totals' => [
                'count'     => count($rows),
                'amount'    => $totalAmount,
                'by_method' => $byMethod,
            ],
            'filters' => [
                'from'           => $request->query['from'] ?? null,
                'to'             => $request->query['to'] ?? null,
                'payment_method' => $request->query['payment_method'] ?? null,
            ],
        ]);
    }
}
