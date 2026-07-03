<?php

declare(strict_types=1);

class Organization extends CrudModel
{
    protected static string $table = 'organizations';
    protected static array $columns = [
        'name', 'slug', 'contact_person', 'contact_email', 'contact_phone',
        'plan', 'status', 'ads_enabled', 'notes',
    ];
    protected static array $searchColumns = ['name', 'slug', 'contact_person', 'contact_email'];

    public const PLANS = ['Free', 'Standard', 'Premium'];
    public const STATUSES = ['Active', 'Suspended', 'Trial'];

    protected static function expose(array $row): array
    {
        $row['id'] = (int) $row['id'];
        $row['ads_enabled'] = (int) ($row['ads_enabled'] ?? 0) === 1;
        return $row;
    }

    protected static function orderBy(): string
    {
        return 'ORDER BY id ASC';
    }

    public static function findBySlug(string $slug): ?array
    {
        $row = Database::fetch(
            'SELECT * FROM organizations WHERE slug = :slug AND deleted_at IS NULL LIMIT 1',
            ['slug' => $slug]
        );
        return $row ? static::expose($row) : null;
    }
}
