<?php

declare(strict_types=1);

class Notification extends CrudModel
{
    protected static string $table = 'notifications';
    protected static array $columns = [
        'user_id',
        'title',
        'message',
        'type',
        'category',
        'priority',
        'is_read',
        'action_url',
        'reference_type',
        'reference_id',
        'created_by',
    ];
    protected static array $searchColumns = ['title', 'message', 'type', 'category'];

    public static function listForUser(Request $request, int $userId): array
    {
        [$page, $perPage, $offset] = Validator::page($request);
        [$where, $params] = static::filtersForUser($request, $userId);
        $order = static::orderByForRequest($request);
        $base = ' FROM notifications n LEFT JOIN users u ON u.id = n.created_by';

        $total = (int) (Database::fetch("SELECT COUNT(*) AS total{$base} {$where}", $params)['total'] ?? 0);
        $rows = Database::fetchAll(
            "SELECT n.*, u.name AS created_by_name{$base} {$where} {$order} LIMIT {$perPage} OFFSET {$offset}",
            $params
        );

        return [static::presentMany($rows), $total, $page, $perPage];
    }

    public static function findForUser(int $id, int $userId): ?array
    {
        $row = Database::fetch(
            'SELECT n.*, u.name AS created_by_name
             FROM notifications n
             LEFT JOIN users u ON u.id = n.created_by
             WHERE n.id = :id AND n.user_id = :user_id AND n.deleted_at IS NULL
             LIMIT 1',
            ['id' => $id, 'user_id' => $userId]
        );

        return $row ? static::present($row) : null;
    }

    public static function markRead(int $id, int $userId): array
    {
        $row = static::findForUser($id, $userId);
        if (!$row) {
            throw new AppException('Notification not found', 404);
        }

        Database::query(
            'UPDATE notifications SET is_read = 1, updated_at = :updated_at WHERE id = :id AND user_id = :user_id AND deleted_at IS NULL',
            ['updated_at' => db_time(), 'id' => $id, 'user_id' => $userId]
        );

        return static::findForUser($id, $userId) ?? $row;
    }

    public static function markAllRead(int $userId): int
    {
        return Database::query(
            'UPDATE notifications SET is_read = 1, updated_at = :updated_at WHERE user_id = :user_id AND is_read = 0 AND deleted_at IS NULL',
            ['updated_at' => db_time(), 'user_id' => $userId]
        )->rowCount();
    }

    public static function softDeleteForUser(int $id, int $userId): array
    {
        $row = static::findForUser($id, $userId);
        if (!$row) {
            throw new AppException('Notification not found', 404);
        }

        Database::query(
            'UPDATE notifications SET deleted_at = :deleted_at, updated_at = :updated_at WHERE id = :id AND user_id = :user_id AND deleted_at IS NULL',
            ['deleted_at' => db_time(), 'updated_at' => db_time(), 'id' => $id, 'user_id' => $userId]
        );

        return $row;
    }

    public static function summaryForUser(int $userId): array
    {
        $today = substr(db_time(), 0, 10);

        return [
            'totalCount' => (int) (Database::fetch(
                'SELECT COUNT(*) AS total FROM notifications WHERE user_id = :user_id AND deleted_at IS NULL',
                ['user_id' => $userId]
            )['total'] ?? 0),
            'unreadCount' => (int) (Database::fetch(
                'SELECT COUNT(*) AS total FROM notifications WHERE user_id = :user_id AND is_read = 0 AND deleted_at IS NULL',
                ['user_id' => $userId]
            )['total'] ?? 0),
            'todayCount' => (int) (Database::fetch(
                'SELECT COUNT(*) AS total FROM notifications WHERE user_id = :user_id AND deleted_at IS NULL AND substr(created_at, 1, 10) = :today',
                ['user_id' => $userId, 'today' => $today]
            )['total'] ?? 0),
            'highPriorityCount' => (int) (Database::fetch(
                "SELECT COUNT(*) AS total FROM notifications WHERE user_id = :user_id AND priority IN ('High', 'Emergency') AND deleted_at IS NULL",
                ['user_id' => $userId]
            )['total'] ?? 0),
        ];
    }

    protected static function orderByForRequest(Request $request): string
    {
        return match ($request->query['sort'] ?? 'newest') {
            'oldest' => 'ORDER BY n.created_at ASC, n.id ASC',
            'priority' => "ORDER BY CASE n.priority WHEN 'Emergency' THEN 4 WHEN 'High' THEN 3 WHEN 'Medium' THEN 2 ELSE 1 END DESC, n.created_at DESC, n.id DESC",
            default => 'ORDER BY n.created_at DESC, n.id DESC',
        };
    }

    private static function filtersForUser(Request $request, int $userId): array
    {
        $conditions = ['n.user_id = :user_id', 'n.deleted_at IS NULL'];
        $params = ['user_id' => $userId];

        $read = strtolower((string) ($request->query['read'] ?? $request->query['status'] ?? ''));
        if ($read === 'read') {
            $conditions[] = 'n.is_read = 1';
        } elseif ($read === 'unread') {
            $conditions[] = 'n.is_read = 0';
        }

        if (($request->query['priority'] ?? '') !== '') {
            $conditions[] = 'n.priority = :priority';
            $params['priority'] = (string) $request->query['priority'];
        }

        if (($request->query['category'] ?? '') !== '') {
            $conditions[] = 'n.category = :category';
            $params['category'] = (string) $request->query['category'];
        }

        if (($request->query['date'] ?? '') !== '') {
            $conditions[] = 'substr(n.created_at, 1, 10) = :date';
            $params['date'] = (string) $request->query['date'];
        }

        if (($request->query['search'] ?? '') !== '') {
            $search = '%' . $request->query['search'] . '%';
            $conditions[] = '(n.title LIKE :search_title OR n.message LIKE :search_message OR n.type LIKE :search_type OR n.category LIKE :search_category)';
            $params['search_title'] = $search;
            $params['search_message'] = $search;
            $params['search_type'] = $search;
            $params['search_category'] = $search;
        }

        return ['WHERE ' . implode(' AND ', $conditions), $params];
    }
}
