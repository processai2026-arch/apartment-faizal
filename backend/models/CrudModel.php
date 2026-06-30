<?php

declare(strict_types=1);

abstract class CrudModel
{
    protected static string $table;
    protected static array $columns = [];
    protected static array $searchColumns = [];
    protected static array $hidden = [];

    public static function list(Request $request): array
    {
        [$page, $perPage, $offset] = Validator::page($request);
        [$where, $params] = static::filters($request);
        $order = static::orderBy();
        $total = (int) Database::fetch("SELECT COUNT(*) AS total FROM " . static::$table . " {$where}", $params)['total'];
        $rows = array_map(fn (array $row) => static::expose($row), Database::fetchAll("SELECT * FROM " . static::$table . " {$where} {$order} LIMIT {$perPage} OFFSET {$offset}", $params));

        return [$rows, $total, $page, $perPage];
    }

    public static function find(int $id): ?array
    {
        $row = Database::fetch('SELECT * FROM ' . static::$table . ' WHERE id = :id AND deleted_at IS NULL LIMIT 1', ['id' => $id]);
        return $row ? static::expose($row) : null;
    }

    public static function present(array $row): array
    {
        return static::expose($row);
    }

    public static function presentMany(array $rows): array
    {
        return array_map(fn (array $row) => static::present($row), $rows);
    }

    public static function create(array $data): array
    {
        $data = static::clean($data);
        $data['created_at'] = db_time();
        $data['updated_at'] = db_time();

        $columns = array_keys($data);
        $sql = 'INSERT INTO ' . static::$table . ' (' . implode(',', $columns) . ') VALUES (:' . implode(',:', $columns) . ')';
        $id = Database::insert($sql, $data);
        return static::find($id);
    }

    public static function update(int $id, array $data): array
    {
        if (!static::find($id)) {
            throw new AppException('Record not found', 404);
        }
        $data = static::clean($data);
        $data['updated_at'] = db_time();
        $sets = array_map(fn ($column) => "{$column} = :{$column}", array_keys($data));
        $data['id'] = $id;
        Database::query('UPDATE ' . static::$table . ' SET ' . implode(', ', $sets) . ' WHERE id = :id AND deleted_at IS NULL', $data);
        return static::find($id);
    }

    public static function softDelete(int $id): array
    {
        $row = static::find($id);
        if (!$row) {
            throw new AppException('Record not found', 404);
        }
        Database::query('UPDATE ' . static::$table . ' SET deleted_at = :deleted_at, updated_at = :updated_at WHERE id = :id AND deleted_at IS NULL', [
            'deleted_at' => db_time(),
            'updated_at' => db_time(),
            'id' => $id,
        ]);
        return $row;
    }

    protected static function filters(Request $request): array
    {
        $where = ['deleted_at IS NULL'];
        $params = [];
        if (($request->query['status'] ?? '') !== '') {
            $where[] = 'status = :status';
            $params['status'] = $request->query['status'];
        }
        if (($request->query['search'] ?? '') !== '' && static::$searchColumns) {
            $parts = [];
            foreach (static::$searchColumns as $index => $column) {
                $key = 'search' . $index;
                $parts[] = "{$column} LIKE :{$key}";
                $params[$key] = '%' . $request->query['search'] . '%';
            }
            $where[] = '(' . implode(' OR ', $parts) . ')';
        }
        return [$where ? 'WHERE ' . implode(' AND ', $where) : '', $params];
    }

    protected static function orderBy(): string
    {
        return 'ORDER BY id DESC';
    }

    protected static function clean(array $data): array
    {
        return array_intersect_key($data, array_flip(static::$columns));
    }

    protected static function expose(array $row): array
    {
        if (!static::$hidden) {
            return $row;
        }

        return array_diff_key($row, array_flip(static::$hidden));
    }
}
