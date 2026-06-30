<?php

declare(strict_types=1);

class PremiumFeature extends CrudModel
{
    protected static string $table = 'premium_features';
    protected static array $columns = [
        'feature_key', 'feature_name', 'description', 'min_plan', 'is_active',
    ];
    protected static array $searchColumns = ['feature_key', 'feature_name', 'description'];

    protected static function expose(array $row): array
    {
        $row['is_active'] = (int) ($row['is_active'] ?? 1);
        return $row;
    }

    protected static function filters(Request $request): array
    {
        $where  = [];
        $params = [];

        if (($request->query['search'] ?? '') !== '') {
            $where[]           = '(feature_key LIKE :search0 OR feature_name LIKE :search1)';
            $params['search0'] = '%' . $request->query['search'] . '%';
            $params['search1'] = '%' . $request->query['search'] . '%';
        }

        return [$where ? 'WHERE ' . implode(' AND ', $where) : '', $params];
    }

    protected static function orderBy(): string
    {
        return 'ORDER BY id ASC';
    }

    public static function find(int $id): ?array
    {
        $row = Database::fetch(
            'SELECT * FROM premium_features WHERE id = :id LIMIT 1',
            ['id' => $id]
        );
        return $row ? static::expose($row) : null;
    }

    public static function getAll(): array
    {
        $rows = Database::fetchAll('SELECT * FROM premium_features ORDER BY id ASC');
        return array_map([static::class, 'expose'], $rows);
    }

    /**
     * Check if a user's active subscription plan grants access to a given feature.
     */
    public static function hasAccess(int $userId, string $featureKey): bool
    {
        $feature = Database::fetch(
            'SELECT * FROM premium_features WHERE feature_key = :key AND is_active = 1 LIMIT 1',
            ['key' => $featureKey]
        );
        if (!$feature) {
            return false;
        }

        $planOrder = ['free' => 1, 'premium' => 2, 'enterprise' => 3];
        $minPlan   = $feature['min_plan'] ?? 'premium';
        $minOrder  = $planOrder[$minPlan] ?? 2;

        $subscription = Subscription::getActiveForUser($userId);
        if (!$subscription) {
            // No active subscription → treat as Free
            return $minOrder <= ($planOrder['free'] ?? 1);
        }

        $userPlanSlug  = $subscription['plan_slug'] ?? 'free';
        $userPlanOrder = $planOrder[$userPlanSlug] ?? 1;

        return $userPlanOrder >= $minOrder;
    }
}
