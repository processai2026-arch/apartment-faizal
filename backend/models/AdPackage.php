<?php

declare(strict_types=1);

class AdPackage extends CrudModel
{
    protected static string $table = 'ad_packages';
    protected static array $columns = [
        'name', 'description', 'price', 'duration_days', 'max_impressions',
        'features', 'is_active', 'sort_order',
    ];

    protected static function orderBy(): string
    {
        return 'ORDER BY sort_order ASC, id ASC';
    }

    protected static function expose(array $row): array
    {
        $row['id']              = (int) $row['id'];
        $row['price']           = (float) ($row['price'] ?? 0);
        $row['duration_days']   = (int) ($row['duration_days'] ?? 30);
        $row['max_impressions'] = (int) ($row['max_impressions'] ?? 0);
        $row['sort_order']      = (int) ($row['sort_order'] ?? 0);
        $row['is_active']       = (int) ($row['is_active'] ?? 1);

        if (isset($row['features']) && is_string($row['features'])) {
            $decoded = json_decode($row['features'], true);
            $row['features'] = is_array($decoded) ? $decoded : [];
        } else {
            $row['features'] = [];
        }

        return $row;
    }

    public static function getActive(): array
    {
        $rows = Database::fetchAll(
            'SELECT * FROM ad_packages WHERE is_active = 1 ORDER BY sort_order ASC, id ASC'
        );
        return array_map([static::class, 'expose'], $rows);
    }
}
