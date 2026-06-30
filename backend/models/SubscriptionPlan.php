<?php

declare(strict_types=1);

class SubscriptionPlan extends CrudModel
{
    protected static string $table = 'subscription_plans';
    protected static array $columns = [
        'name', 'slug', 'description', 'price_monthly', 'price_yearly',
        'features', 'max_listings', 'max_ads', 'analytics_access',
        'featured_vendor', 'featured_rental', 'priority_support',
        'is_active', 'sort_order',
    ];
    protected static array $searchColumns = ['name', 'slug', 'description'];

    protected static function expose(array $row): array
    {
        if (isset($row['features']) && is_string($row['features'])) {
            $decoded = json_decode($row['features'], true);
            $row['features'] = is_array($decoded) ? $decoded : [];
        } else {
            $row['features'] = [];
        }
        $row['analytics_access']  = (int) ($row['analytics_access']  ?? 0);
        $row['featured_vendor']   = (int) ($row['featured_vendor']   ?? 0);
        $row['featured_rental']   = (int) ($row['featured_rental']   ?? 0);
        $row['priority_support']  = (int) ($row['priority_support']  ?? 0);
        $row['is_active']         = (int) ($row['is_active']         ?? 1);
        $row['price_monthly']     = (float) ($row['price_monthly']   ?? 0);
        $row['price_yearly']      = (float) ($row['price_yearly']    ?? 0);
        $row['max_listings']      = (int) ($row['max_listings']      ?? 3);
        $row['max_ads']           = (int) ($row['max_ads']           ?? 1);
        $row['sort_order']        = (int) ($row['sort_order']        ?? 0);
        return $row;
    }

    protected static function filters(Request $request): array
    {
        $where  = [];
        $params = [];

        if (($request->query['search'] ?? '') !== '') {
            $where[]             = '(name LIKE :search0 OR description LIKE :search1)';
            $params['search0']   = '%' . $request->query['search'] . '%';
            $params['search1']   = '%' . $request->query['search'] . '%';
        }

        return [$where ? 'WHERE ' . implode(' AND ', $where) : '', $params];
    }

    protected static function orderBy(): string
    {
        return 'ORDER BY sort_order ASC, id ASC';
    }

    public static function find(int $id): ?array
    {
        $row = Database::fetch(
            'SELECT * FROM subscription_plans WHERE id = :id LIMIT 1',
            ['id' => $id]
        );
        return $row ? static::expose($row) : null;
    }

    public static function getActive(): array
    {
        $rows = Database::fetchAll(
            'SELECT * FROM subscription_plans WHERE is_active = 1 ORDER BY sort_order ASC, id ASC'
        );
        return array_map([static::class, 'expose'], $rows);
    }

    public static function findBySlug(string $slug): ?array
    {
        $row = Database::fetch(
            'SELECT * FROM subscription_plans WHERE slug = :slug LIMIT 1',
            ['slug' => $slug]
        );
        return $row ? static::expose($row) : null;
    }
}
