<?php

declare(strict_types=1);

class OfficeExpense extends CrudModel
{
    protected static string $table = 'office_expenses';
    protected static array $columns = [
        'expense_no', 'category', 'payment_method', 'payee', 'description', 'amount',
        'expense_date', 'cheque_no', 'cheque_date', 'bank_name',
        'cheque_front_attachment_id', 'cheque_back_attachment_id', 'receipt_attachment_id',
        'status', 'approved_by', 'notes', 'created_by',
        // GST input-tax fields (029)
        'gstin', 'gst_rate', 'gst_amount',
    ];
    protected static array $searchColumns = ['expense_no', 'payee', 'description', 'cheque_no', 'bank_name'];

    public const CATEGORIES      = ['Maintenance', 'Utilities', 'Supplies', 'Salary', 'Repairs', 'Security', 'Housekeeping', 'Other'];
    public const PAYMENT_METHODS = ['Petty Cash', 'Cheque', 'Bank Transfer', 'Cash'];
    public const STATUSES        = ['Pending', 'Approved', 'Paid', 'Rejected'];

    protected static function filters(Request $request): array
    {
        [$where, $params] = parent::filters($request);
        $conditions = $where !== '' ? [substr($where, 6)] : [];

        if (($request->query['category'] ?? '') !== '') {
            $conditions[] = 'category = :category';
            $params['category'] = $request->query['category'];
        }
        if (($request->query['payment_method'] ?? '') !== '') {
            $conditions[] = 'payment_method = :payment_method';
            $params['payment_method'] = $request->query['payment_method'];
        }
        if (($request->query['from'] ?? '') !== '') {
            $conditions[] = sql_date('expense_date') . ' >= :from_date';
            $params['from_date'] = $request->query['from'];
        }
        if (($request->query['to'] ?? '') !== '') {
            $conditions[] = sql_date('expense_date') . ' <= :to_date';
            $params['to_date'] = $request->query['to'];
        }

        return [$conditions ? 'WHERE ' . implode(' AND ', $conditions) : '', $params];
    }

    protected static function orderBy(): string
    {
        return 'ORDER BY expense_date DESC, id DESC';
    }

    /** Generate the next sequential expense number, e.g. EXP-2026-0001. */
    public static function nextExpenseNo(): string
    {
        $year = date('Y');
        $prefix = 'EXP-' . $year . '-';
        $row = Database::fetch(
            'SELECT expense_no FROM office_expenses WHERE expense_no LIKE :prefix ORDER BY expense_no DESC LIMIT 1',
            ['prefix' => $prefix . '%']
        );
        $next = 1;
        if ($row && preg_match('/(\d+)$/', (string) $row['expense_no'], $m)) {
            $next = ((int) $m[1]) + 1;
        }
        return $prefix . str_pad((string) $next, 4, '0', STR_PAD_LEFT);
    }
}
