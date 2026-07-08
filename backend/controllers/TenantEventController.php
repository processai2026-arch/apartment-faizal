<?php

declare(strict_types=1);

class TenantEventController
{
    public function index(Request $request): void
    {
        // Build where clause manually — only Published events for tenants
        $where = ["deleted_at IS NULL", "status = 'Published'"];
        $params = [];

        if (($request->query['upcoming'] ?? '') !== '') {
            $today = date('Y-m-d');
            $where[] = 'event_date >= :today';
            $params['today'] = $today;
        }

        if (($request->query['search'] ?? '') !== '') {
            $search = $request->query['search'];
            $parts = [];
            foreach (['title', 'description', 'location', 'organizer'] as $index => $column) {
                $key = 'search' . $index;
                $parts[] = "{$column} LIKE :{$key}";
                $params[$key] = '%' . $search . '%';
            }
            $where[] = '(' . implode(' OR ', $parts) . ')';
        }

        $whereStr = 'WHERE ' . implode(' AND ', $where);

        $page    = max(1, (int) ($request->query['page'] ?? 1));
        $perPage = min(50, max(1, (int) ($request->query['perPage'] ?? 20)));
        $offset  = ($page - 1) * $perPage;

        $total = (int) Database::fetch(
            "SELECT COUNT(*) AS total FROM community_events {$whereStr}",
            $params
        )['total'];

        $rows = Database::fetchAll(
            "SELECT * FROM community_events {$whereStr} ORDER BY event_date ASC LIMIT {$perPage} OFFSET {$offset}",
            $params
        );

        $userId = (int) $request->user['id'];
        $rows = array_map(function (array $row) use ($userId) {
            $event = CommunityEvent::present($row);
            $event['registration_count'] = CommunityEvent::getRegistrationCount((int) $row['id']);
            $reg = EventRegistration::findByUserAndEvent($userId, (int) $row['id']);
            $event['my_registration'] = $reg;
            $event['is_registered'] = $reg !== null && $reg['status'] === 'Registered';
            return $event;
        }, $rows);

        Response::paginated($rows, $total, $page, $perPage);
    }

    public function show(Request $request): void
    {
        $event = CommunityEvent::find((int) $request->params['id']);
        if (!$event || $event['status'] !== 'Published') {
            throw new AppException('Event not found', 404);
        }
        $event['registration_count'] = CommunityEvent::getRegistrationCount((int) $event['id']);
        $userId = (int) $request->user['id'];
        $reg = EventRegistration::findByUserAndEvent($userId, (int) $event['id']);
        $event['my_registration'] = $reg;
        $event['is_registered'] = $reg !== null && $reg['status'] === 'Registered';
        Response::success($event);
    }

    public function register(Request $request): void
    {
        $event = CommunityEvent::find((int) $request->params['id']);
        if (!$event || $event['status'] !== 'Published') {
            throw new AppException('Event not found', 404);
        }

        $userId = (int) $request->user['id'];

        // Check if already registered
        $existing = EventRegistration::findByUserAndEvent($userId, (int) $event['id']);
        if ($existing && $existing['status'] === 'Registered') {
            throw new AppException('You are already registered for this event', 409);
        }

        // BUG-09 fix: wrap capacity check + insert in a transaction to prevent race condition
        $user = Database::fetch('SELECT * FROM users WHERE id = :id LIMIT 1', ['id' => $userId]);
        $name  = $user ? ($user['name'] ?? '') : ($request->input('name') ?: '');
        $phone = $user ? ($user['phone'] ?? null) : null;
        $email = $user ? ($user['email'] ?? null) : null;

        $registration = Database::transaction(function () use ($event, $userId, $existing, $name, $phone, $email, $request): array {
            // Re-check capacity inside transaction
            if ((int) $event['capacity'] > 0) {
                $count = CommunityEvent::getRegistrationCount((int) $event['id']);
                if ($count >= (int) $event['capacity']) {
                    throw new AppException('Event is full', 409);
                }
            }

            if ($existing && $existing['status'] === 'Cancelled') {
                return EventRegistration::update((int) $existing['id'], ['status' => 'Registered']);
            }
            return EventRegistration::create([
                'event_id'      => (int) $event['id'],
                'user_id'       => $userId,
                'name'          => $name,
                'phone'         => $phone,
                'email'         => $email,
                'status'        => 'Registered',
                'registered_at' => db_time(),
                'notes'         => $request->input('notes') ?: null,
            ]);
        });

        Response::success($registration, 'Registered successfully', 201);
    }

    public function cancelRegistration(Request $request): void
    {
        $event = CommunityEvent::find((int) $request->params['id']);
        if (!$event) {
            throw new AppException('Event not found', 404);
        }

        $userId = (int) $request->user['id'];
        $registration = EventRegistration::findByUserAndEvent($userId, (int) $event['id']);
        if (!$registration || $registration['status'] !== 'Registered') {
            throw new AppException('No active registration found', 404);
        }

        $updated = EventRegistration::update((int) $registration['id'], ['status' => 'Cancelled']);
        Response::success($updated, 'Registration cancelled');
    }

    public function myRegistrations(Request $request): void
    {
        $userId = (int) $request->user['id'];
        $rows = Database::fetchAll(
            "SELECT er.*, ce.title AS event_title, ce.event_date, ce.event_time, ce.location, ce.status AS event_status
             FROM event_registrations er
             JOIN community_events ce ON ce.id = er.event_id
             WHERE er.user_id = :user_id AND ce.deleted_at IS NULL
             ORDER BY ce.event_date ASC",
            ['user_id' => $userId]
        );

        $result = array_map(function (array $row) {
            return [
                'id'           => (int) $row['id'],
                'event_id'     => (int) $row['event_id'],
                'event_title'  => $row['event_title'],
                'event_date'   => $row['event_date'],
                'event_time'   => $row['event_time'] ?? null,
                'location'     => $row['location'] ?? null,
                'event_status' => $row['event_status'],
                'status'       => $row['status'],
                'registered_at'=> $row['registered_at'],
                'notes'        => $row['notes'] ?? null,
            ];
        }, $rows);

        Response::success($result);
    }
}
