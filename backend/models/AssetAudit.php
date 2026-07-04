<?php

declare(strict_types=1);

class AssetAudit extends CrudModel
{
    protected static string $table = 'asset_audits';
    protected static array $columns = [
        'asset_id', 'audited_by', 'audit_date', 'found_status', 'condition', 'remarks',
    ];

    protected static function orderBy(): string
    {
        return 'ORDER BY id DESC';
    }

    /** This table has only created_at (no updated_at); insert without the CrudModel updated_at stamp. */
    public static function create(array $data): array
    {
        $data = array_intersect_key($data, array_flip(static::$columns));
        $data['created_at'] = db_time();
        $columns = array_keys($data);
        $quoted  = array_map(fn ($c) => "`{$c}`", $columns);
        $sql = 'INSERT INTO `' . static::$table . '` (' . implode(',', $quoted) . ') VALUES (:' . implode(',:', $columns) . ')';
        $id = Database::insert($sql, $data);
        return static::find($id) ?? [];
    }

    /** find() in CrudModel filters on deleted_at which this table lacks; override. */
    public static function find(int $id): ?array
    {
        $row = Database::fetch('SELECT * FROM asset_audits WHERE id = :id LIMIT 1', ['id' => $id]);
        return $row ?: null;
    }

    /** Audit history for a single asset (newest first). */
    public static function historyForAsset(int $assetId, int $limit = 50): array
    {
        return Database::fetchAll(
            'SELECT * FROM asset_audits WHERE asset_id = :id ORDER BY id DESC LIMIT ' . $limit,
            ['id' => $assetId]
        );
    }
}
