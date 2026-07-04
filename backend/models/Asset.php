<?php

declare(strict_types=1);

class Asset extends CrudModel
{
    protected static string $table = 'assets';
    protected static array $columns = [
        'asset_tag', 'name', 'category', 'asset_type', 'serial_no', 'condition',
        'status', 'photo_attachment_id', 'purchase_date', 'notes',
    ];
    protected static array $searchColumns = ['asset_tag', 'name', 'asset_type', 'serial_no'];

    public const CATEGORIES  = ['Safety Gear', 'Cleaning Equipment', 'Tools', 'Utility Gear', 'Other'];
    public const CONDITIONS  = ['New', 'Good', 'Fair', 'Damaged', 'Retired'];
    public const STATUSES     = ['Available', 'Checked Out', 'Under Maintenance', 'Retired'];

    protected static function filters(Request $request): array
    {
        [$where, $params] = parent::filters($request);
        $conditions = $where !== '' ? [substr($where, 6)] : [];

        if (($request->query['category'] ?? '') !== '') {
            $conditions[] = 'category = :category';
            $params['category'] = $request->query['category'];
        }
        if (($request->query['condition'] ?? '') !== '') {
            $conditions[] = '`condition` = :condition';
            $params['condition'] = $request->query['condition'];
        }

        return [$conditions ? 'WHERE ' . implode(' AND ', $conditions) : '', $params];
    }

    protected static function orderBy(): string
    {
        return 'ORDER BY id DESC';
    }

    /** Generate the next sequential asset tag, e.g. AST-2026-0001. */
    public static function nextAssetTag(): string
    {
        $year = date('Y');
        $prefix = 'AST-' . $year . '-';
        $row = Database::fetch(
            'SELECT asset_tag FROM assets WHERE asset_tag LIKE :prefix ORDER BY asset_tag DESC LIMIT 1',
            ['prefix' => $prefix . '%']
        );
        $next = 1;
        if ($row && preg_match('/(\d+)$/', (string) $row['asset_tag'], $m)) {
            $next = ((int) $m[1]) + 1;
        }
        return $prefix . str_pad((string) $next, 4, '0', STR_PAD_LEFT);
    }
}
