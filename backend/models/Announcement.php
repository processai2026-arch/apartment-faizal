<?php

declare(strict_types=1);

class Announcement extends CrudModel
{
    protected static string $table = 'announcements';
    protected static array $columns = [
        'title', 'description', 'priority', 'audience', 'attachment_id',
        'publish_at', 'expires_at', 'status', 'created_by',
    ];
    protected static array $searchColumns = ['title', 'description'];

    public const STATUSES   = ['Draft', 'Published', 'Scheduled', 'Expired', 'Archived'];
    public const PRIORITIES = ['Low', 'Medium', 'High', 'Emergency'];
    public const AUDIENCES  = ['All', 'Tenants', 'Security', 'Admin'];

    protected static function filters(Request $request): array
    {
        [$where, $params] = parent::filters($request);
        $conditions = $where !== '' ? [substr($where, 6)] : [];

        if (($request->query['audience'] ?? '') !== '') {
            $conditions[] = "(audience = :audience OR audience = 'All')";
            $params['audience'] = $request->query['audience'];
        }
        if (($request->query['priority'] ?? '') !== '') {
            $conditions[] = 'priority = :priority';
            $params['priority'] = $request->query['priority'];
        }

        return [$conditions ? 'WHERE ' . implode(' AND ', $conditions) : '', $params];
    }

    public static function markRead(int $announcementId, int $userId): void
    {
        Database::query(
            sql_insert_ignore() . ' INTO announcement_reads (announcement_id, user_id, read_at) VALUES (:aid, :uid, :now)',
            ['aid' => $announcementId, 'uid' => $userId, 'now' => db_time()]
        );
    }

    public static function unreadCount(int $userId, string $audience): int
    {
        $row = Database::fetch(
            "SELECT COUNT(*) AS c FROM announcements a
             WHERE a.deleted_at IS NULL AND a.status = 'Published'
               AND (a.audience = 'All' OR a.audience = :audience)
               AND (a.expires_at IS NULL OR a.expires_at > :now)
               AND NOT EXISTS (
                 SELECT 1 FROM announcement_reads r
                 WHERE r.announcement_id = a.id AND r.user_id = :uid
               )",
            ['audience' => $audience, 'uid' => $userId, 'now' => db_time()]
        );
        return (int) $row['c'];
    }

    public static function publishDue(): void
    {
        // Native MySQL prepared statements (EMULATE_PREPARES=false) reject a
        // named placeholder bound more than once per query, so :now needs a
        // distinct name at each occurrence even though the value is identical.
        $now = db_time();
        Database::query(
            "UPDATE announcements SET status = 'Published', updated_at = :now1
             WHERE status = 'Scheduled' AND publish_at <= :now2 AND deleted_at IS NULL",
            ['now1' => $now, 'now2' => $now]
        );
        Database::query(
            "UPDATE announcements SET status = 'Expired', updated_at = :now1
             WHERE status = 'Published' AND expires_at IS NOT NULL AND expires_at < :now2 AND deleted_at IS NULL",
            ['now1' => $now, 'now2' => $now]
        );
    }
}
