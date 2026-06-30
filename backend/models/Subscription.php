<?php

declare(strict_types=1);

class Subscription extends CrudModel
{
    protected static string $table = 'subscriptions';
    protected static array $columns = [
        'user_id', 'plan_id', 'status', 'billing_cycle',
        'started_at', 'expires_at', 'cancelled_at',
        'amount_paid', 'payment_ref', 'notes',
    ];
    protected static array $searchColumns = ['payment_ref', 'notes'];

    const STATUSES = ['Active', 'Cancelled', 'Expired', 'Pending'];
    const BILLING_CYCLES = ['Monthly', 'Yearly'];

    protected static function expose(array $row): array
    {
        $row['amount_paid'] = (float) ($row['amount_paid'] ?? 0);
        $row['user_id']     = (int) ($row['user_id'] ?? 0);
        $row['plan_id']     = (int) ($row['plan_id'] ?? 0);
        return $row;
    }

    protected static function filters(Request $request): array
    {
        $where  = [];
        $params = [];

        if (($request->query['status'] ?? '') !== '') {
            $where[]          = 's.status = :status';
            $params['status'] = $request->query['status'];
        }
        if (($request->query['plan_id'] ?? '') !== '') {
            $where[]           = 's.plan_id = :plan_id';
            $params['plan_id'] = (int) $request->query['plan_id'];
        }
        if (($request->query['search'] ?? '') !== '') {
            $where[]           = '(u.name LIKE :search0 OR u.email LIKE :search1)';
            $params['search0'] = '%' . $request->query['search'] . '%';
            $params['search1'] = '%' . $request->query['search'] . '%';
        }

        return [$where ? 'WHERE ' . implode(' AND ', $where) : '', $params];
    }

    protected static function orderBy(): string
    {
        return 'ORDER BY s.id DESC';
    }

    public static function list(Request $request): array
    {
        [$page, $perPage, $offset] = Validator::page($request);
        [$where, $params] = static::filters($request);

        $sql = "
            SELECT s.*, u.name AS user_name, u.email AS user_email, sp.name AS plan_name, sp.slug AS plan_slug
            FROM subscriptions s
            LEFT JOIN users u ON u.id = s.user_id
            LEFT JOIN subscription_plans sp ON sp.id = s.plan_id
            {$where}
            ORDER BY s.id DESC
            LIMIT {$perPage} OFFSET {$offset}
        ";
        $countSql = "
            SELECT COUNT(*) AS total
            FROM subscriptions s
            LEFT JOIN users u ON u.id = s.user_id
            LEFT JOIN subscription_plans sp ON sp.id = s.plan_id
            {$where}
        ";

        $total = (int) Database::fetch($countSql, $params)['total'];
        $rows  = array_map([static::class, 'expose'], Database::fetchAll($sql, $params));

        return [$rows, $total, $page, $perPage];
    }

    public static function find(int $id): ?array
    {
        $row = Database::fetch(
            "SELECT s.*, u.name AS user_name, u.email AS user_email, sp.name AS plan_name, sp.slug AS plan_slug
             FROM subscriptions s
             LEFT JOIN users u ON u.id = s.user_id
             LEFT JOIN subscription_plans sp ON sp.id = s.plan_id
             WHERE s.id = :id LIMIT 1",
            ['id' => $id]
        );
        return $row ? static::expose($row) : null;
    }

    public static function getActiveForUser(int $userId): ?array
    {
        $row = Database::fetch(
            "SELECT s.*, sp.name AS plan_name, sp.slug AS plan_slug, sp.features AS plan_features,
                    sp.price_monthly, sp.price_yearly, sp.max_listings, sp.max_ads,
                    sp.analytics_access, sp.featured_vendor, sp.featured_rental, sp.priority_support
             FROM subscriptions s
             LEFT JOIN subscription_plans sp ON sp.id = s.plan_id
             WHERE s.user_id = :user_id AND s.status = 'Active'
             ORDER BY s.id DESC LIMIT 1",
            ['user_id' => $userId]
        );
        if (!$row) {
            return null;
        }
        $row = static::expose($row);
        if (isset($row['plan_features']) && is_string($row['plan_features'])) {
            $decoded = json_decode($row['plan_features'], true);
            $row['plan_features'] = is_array($decoded) ? $decoded : [];
        }
        return $row;
    }

    public static function getStats(): array
    {
        $total = (int) Database::fetch(
            "SELECT COUNT(*) AS cnt FROM subscriptions"
        )['cnt'];

        $active = (int) Database::fetch(
            "SELECT COUNT(*) AS cnt FROM subscriptions WHERE status = 'Active'"
        )['cnt'];

        $byPlanRows = Database::fetchAll(
            "SELECT sp.name AS plan_name, COUNT(s.id) AS cnt
             FROM subscriptions s
             LEFT JOIN subscription_plans sp ON sp.id = s.plan_id
             WHERE s.status = 'Active'
             GROUP BY s.plan_id, sp.name"
        );
        $byPlan = [];
        foreach ($byPlanRows as $row) {
            $byPlan[$row['plan_name'] ?? 'Unknown'] = (int) $row['cnt'];
        }

        $byStatusRows = Database::fetchAll(
            "SELECT status, COUNT(*) AS cnt FROM subscriptions GROUP BY status"
        );
        $byStatus = [];
        foreach ($byStatusRows as $row) {
            $byStatus[$row['status']] = (int) $row['cnt'];
        }

        // MRR: sum of amount_paid for active monthly subscriptions this month
        $mrr = (float) (Database::fetch(
            "SELECT COALESCE(SUM(amount_paid), 0) AS mrr
             FROM subscriptions
             WHERE status = 'Active' AND billing_cycle = 'Monthly'"
        )['mrr'] ?? 0);

        return [
            'total'      => $total,
            'active'     => $active,
            'by_plan'    => $byPlan,
            'by_status'  => $byStatus,
            'mrr'        => $mrr,
        ];
    }
}
