<?php

declare(strict_types=1);

class CommunityEvent extends CrudModel
{
    protected static string $table = 'community_events';

    protected static array $columns = [
        'title', 'description', 'location', 'organizer',
        'event_date', 'event_time', 'image_attachment_id', 'attachment_id',
        'capacity', 'registration_required', 'status', 'created_by',
    ];

    protected static array $searchColumns = ['title', 'description', 'location', 'organizer'];

    public const EVENT_STATUSES = ['Draft', 'Published', 'Cancelled', 'Completed'];

    protected static function expose(array $row): array
    {
        return [
            'id'                     => (int) $row['id'],
            'title'                  => $row['title'] ?? '',
            'description'            => $row['description'] ?? null,
            'location'               => $row['location'] ?? null,
            'organizer'              => $row['organizer'] ?? null,
            'event_date'             => $row['event_date'] ?? '',
            'event_time'             => $row['event_time'] ?? null,
            'image_attachment_id'    => $row['image_attachment_id'] !== null ? (int) $row['image_attachment_id'] : null,
            'attachment_id'          => $row['attachment_id'] !== null ? (int) $row['attachment_id'] : null,
            'capacity'               => (int) ($row['capacity'] ?? 0),
            'registration_required'  => (bool) ($row['registration_required'] ?? false),
            'status'                 => $row['status'] ?? 'Draft',
            'created_by'             => $row['created_by'] !== null ? (int) $row['created_by'] : null,
            'created_at'             => $row['created_at'] ?? '',
            'updated_at'             => $row['updated_at'] ?? null,
            'deleted_at'             => $row['deleted_at'] ?? null,
        ];
    }

    protected static function filters(Request $request): array
    {
        $where = ['deleted_at IS NULL'];
        $params = [];

        if (($request->query['status'] ?? '') !== '') {
            $where[] = 'status = :status';
            $params['status'] = $request->query['status'];
        }

        if (($request->query['upcoming'] ?? '') !== '') {
            $today = date('Y-m-d');
            $where[] = "event_date >= :today_upcoming AND status = 'Published'";
            $params['today_upcoming'] = $today;
        }

        if (($request->query['search'] ?? '') !== '') {
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
        return 'ORDER BY event_date ASC, id DESC';
    }

    public static function getUpcoming(): array
    {
        $today = date('Y-m-d');
        $rows = Database::fetchAll(
            "SELECT * FROM community_events WHERE event_date >= :today AND status = 'Published' AND deleted_at IS NULL ORDER BY event_date ASC",
            ['today' => $today]
        );
        return array_map(fn (array $row) => static::expose($row), $rows);
    }

    public static function getPast(): array
    {
        $today = date('Y-m-d');
        $rows = Database::fetchAll(
            "SELECT * FROM community_events WHERE event_date < :today AND status IN ('Published','Completed') AND deleted_at IS NULL ORDER BY event_date DESC",
            ['today' => $today]
        );
        return array_map(fn (array $row) => static::expose($row), $rows);
    }

    public static function getRegistrationCount(int $eventId): int
    {
        $result = Database::fetch(
            "SELECT COUNT(*) AS cnt FROM event_registrations WHERE event_id = :event_id AND status = 'Registered'",
            ['event_id' => $eventId]
        );
        return (int) ($result['cnt'] ?? 0);
    }
}
