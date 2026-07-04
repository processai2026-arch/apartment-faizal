<?php

declare(strict_types=1);

class AdBilling extends CrudModel
{
    protected static string $table = 'ad_billing';
    protected static array $columns = [
        'ad_id', 'package_id', 'amount', 'billing_status',
        'due_date', 'paid_at', 'payment_ref', 'renewal_reminded', 'notes',
    ];

    public const STATUSES = ['Pending', 'Paid', 'Overdue', 'Waived'];

    protected static function orderBy(): string
    {
        return 'ORDER BY id DESC';
    }

    protected static function expose(array $row): array
    {
        $row['id']               = (int) $row['id'];
        $row['ad_id']            = (int) $row['ad_id'];
        $row['package_id']       = $row['package_id'] !== null ? (int) $row['package_id'] : null;
        $row['amount']           = (float) ($row['amount'] ?? 0);
        $row['renewal_reminded'] = (int) ($row['renewal_reminded'] ?? 0) === 1;
        return $row;
    }

    /**
     * Latest billing record for a given ad.
     */
    public static function getForAd(int $adId): ?array
    {
        $row = Database::fetch(
            'SELECT * FROM ad_billing WHERE ad_id = :ad_id ORDER BY id DESC LIMIT 1',
            ['ad_id' => $adId]
        );
        return $row ? static::expose($row) : null;
    }

    /**
     * Billing records that are Pending and past due date.
     */
    public static function getOverdue(): array
    {
        $rows = Database::fetchAll(
            "SELECT ab.*, ba.business_name
             FROM ad_billing ab
             JOIN business_ads ba ON ba.id = ab.ad_id
             WHERE ab.billing_status = 'Pending'
               AND ab.due_date IS NOT NULL
               AND ab.due_date < " . sql_current_date() . '
             ORDER BY ab.due_date ASC'
        );
        return array_map([static::class, 'expose'], $rows);
    }

    /**
     * Revenue summary statistics.
     */
    public static function getStats(): array
    {
        $row = Database::fetch(
            "SELECT
               COALESCE(SUM(CASE WHEN billing_status = 'Paid' THEN amount ELSE 0 END), 0) AS total_revenue,
               COALESCE(SUM(CASE WHEN billing_status = 'Pending' THEN amount ELSE 0 END), 0) AS pending,
               COALESCE(SUM(CASE WHEN billing_status = 'Overdue' THEN amount ELSE 0 END), 0) AS overdue_amount,
               COUNT(CASE WHEN billing_status = 'Overdue' THEN 1 END) AS overdue_count
             FROM ad_billing"
        );
        return [
            'total_revenue' => (float) ($row['total_revenue'] ?? 0),
            'pending'       => (float) ($row['pending'] ?? 0),
            'overdue_amount'=> (float) ($row['overdue_amount'] ?? 0),
            'overdue_count' => (int) ($row['overdue_count'] ?? 0),
        ];
    }
}
