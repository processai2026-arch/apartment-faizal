<?php

declare(strict_types=1);

class EventRegistration
{
    protected static string $table = 'event_registrations';

    protected static function expose(array $row): array
    {
        return [
            'id'            => (int) $row['id'],
            'event_id'      => (int) $row['event_id'],
            'user_id'       => $row['user_id'] !== null ? (int) $row['user_id'] : null,
            'name'          => $row['name'] ?? '',
            'phone'         => $row['phone'] ?? null,
            'email'         => $row['email'] ?? null,
            'status'        => $row['status'] ?? 'Registered',
            'registered_at' => $row['registered_at'] ?? '',
            'notes'         => $row['notes'] ?? null,
        ];
    }

    public static function find(int $id): ?array
    {
        $row = Database::fetch('SELECT * FROM ' . static::$table . ' WHERE id = :id LIMIT 1', ['id' => $id]);
        return $row ? static::expose($row) : null;
    }

    public static function create(array $data): array
    {
        $allowed = ['event_id', 'user_id', 'name', 'phone', 'email', 'status', 'registered_at', 'notes'];
        $data = array_intersect_key($data, array_flip($allowed));
        $data['registered_at'] = $data['registered_at'] ?? db_time();

        $columns = array_keys($data);
        $sql = 'INSERT INTO ' . static::$table . ' (' . implode(',', $columns) . ') VALUES (:' . implode(',:', $columns) . ')';
        $id = Database::insert($sql, $data);
        return static::find($id);
    }

    public static function update(int $id, array $data): array
    {
        $allowed = ['status', 'notes'];
        $data = array_intersect_key($data, array_flip($allowed));
        $sets = array_map(fn ($col) => "{$col} = :{$col}", array_keys($data));
        $data['id'] = $id;
        Database::query('UPDATE ' . static::$table . ' SET ' . implode(', ', $sets) . ' WHERE id = :id', $data);
        return static::find($id);
    }

    public static function forEvent(int $eventId): array
    {
        $rows = Database::fetchAll(
            'SELECT * FROM ' . static::$table . ' WHERE event_id = :event_id ORDER BY registered_at ASC',
            ['event_id' => $eventId]
        );
        return array_map(fn (array $row) => static::expose($row), $rows);
    }

    public static function findByUserAndEvent(int $userId, int $eventId): ?array
    {
        $row = Database::fetch(
            'SELECT * FROM ' . static::$table . ' WHERE user_id = :user_id AND event_id = :event_id LIMIT 1',
            ['user_id' => $userId, 'event_id' => $eventId]
        );
        return $row ? static::expose($row) : null;
    }
}
