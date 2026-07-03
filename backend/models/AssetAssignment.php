<?php

declare(strict_types=1);

class AssetAssignment extends CrudModel
{
    protected static string $table = 'asset_assignments';
    protected static array $columns = [
        'asset_id', 'staff_id', 'issued_by', 'issued_at', 'due_at',
        'returned_at', 'return_condition', 'notes',
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
        $sql = 'INSERT INTO ' . static::$table . ' (' . implode(',', $columns) . ') VALUES (:' . implode(',:', $columns) . ')';
        $id = Database::insert($sql, $data);
        return static::find($id) ?? [];
    }

    /** find() in CrudModel filters on deleted_at which this table lacks; override. */
    public static function find(int $id): ?array
    {
        $row = Database::fetch('SELECT * FROM asset_assignments WHERE id = :id LIMIT 1', ['id' => $id]);
        return $row ?: null;
    }

    /** The current open (not-yet-returned) assignment for an asset, if any. */
    public static function openForAsset(int $assetId): ?array
    {
        return Database::fetch(
            'SELECT * FROM asset_assignments WHERE asset_id = :id AND returned_at IS NULL ORDER BY id DESC LIMIT 1',
            ['id' => $assetId]
        ) ?: null;
    }

    /** Assignment history for an asset (newest first). */
    public static function historyForAsset(int $assetId, int $limit = 50): array
    {
        return Database::fetchAll(
            'SELECT a.*, s.name AS staff_name
             FROM asset_assignments a
             LEFT JOIN staff s ON s.id = a.staff_id
             WHERE a.asset_id = :id ORDER BY a.id DESC LIMIT ' . $limit,
            ['id' => $assetId]
        );
    }
}
