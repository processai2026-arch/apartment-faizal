<?php

declare(strict_types=1);

class AdminEventController
{
    public function index(Request $request): void
    {
        [$rows, $total, $page, $perPage] = CommunityEvent::list($request);
        // Attach registration count to each event
        $rows = array_map(function (array $event) {
            $event['registration_count'] = CommunityEvent::getRegistrationCount((int) $event['id']);
            return $event;
        }, $rows);
        Response::paginated($rows, $total, $page, $perPage);
    }

    public function store(Request $request): void
    {
        Validator::require($request->all(), ['title', 'event_date']);
        Validator::maxLength((string) $request->input('title'), 255, 'title');
        if ($request->input('description') !== null) {
            Validator::maxLength((string) $request->input('description'), 10000, 'description');
        }
        if ($request->input('location') !== null) {
            Validator::maxLength((string) $request->input('location'), 255, 'location');
        }
        if ($request->input('organizer') !== null) {
            Validator::maxLength((string) $request->input('organizer'), 100, 'organizer');
        }

        $status = $request->input('status') ?: 'Draft';
        Validator::enum($status, CommunityEvent::EVENT_STATUSES, 'status');

        $event = CommunityEvent::create([
            'title'                 => $request->input('title'),
            'description'           => $request->input('description') ?: null,
            'location'              => $request->input('location') ?: null,
            'organizer'             => $request->input('organizer') ?: null,
            'event_date'            => $request->input('event_date'),
            'event_time'            => $request->input('event_time') ?: null,
            'image_attachment_id'   => $request->input('image_attachment_id') ? (int) $request->input('image_attachment_id') : null,
            'attachment_id'         => $request->input('attachment_id') ? (int) $request->input('attachment_id') : null,
            'capacity'              => (int) ($request->input('capacity') ?? 0),
            'registration_required' => (int) ($request->input('registration_required') ?? 0),
            'status'                => $status,
            'created_by'            => (int) $request->user['id'],
        ]);

        AuditService::log((int) $request->user['id'], 'event.create', 'community_event', (int) $event['id']);
        Response::success($event, 'Event created', 201);
    }

    public function show(Request $request): void
    {
        $event = CommunityEvent::find((int) $request->params['id']);
        if (!$event) {
            throw new AppException('Event not found', 404);
        }
        $event['registration_count'] = CommunityEvent::getRegistrationCount((int) $event['id']);
        $event['recent_registrations'] = array_slice(EventRegistration::forEvent((int) $event['id']), 0, 10);
        Response::success($event);
    }

    public function update(Request $request): void
    {
        $event = CommunityEvent::find((int) $request->params['id']);
        if (!$event) {
            throw new AppException('Event not found', 404);
        }

        if ($request->input('title') !== null) {
            Validator::maxLength((string) $request->input('title'), 255, 'title');
        }
        if ($request->input('description') !== null) {
            Validator::maxLength((string) $request->input('description'), 10000, 'description');
        }
        if ($request->input('location') !== null) {
            Validator::maxLength((string) $request->input('location'), 255, 'location');
        }
        if ($request->input('organizer') !== null) {
            Validator::maxLength((string) $request->input('organizer'), 100, 'organizer');
        }

        $data = [];
        foreach (['title', 'description', 'location', 'organizer', 'event_date', 'event_time', 'status'] as $field) {
            $val = $request->input($field);
            if ($val !== null) {
                $data[$field] = $val ?: null;
            }
        }
        if ($request->input('title') !== null)      $data['title']      = $request->input('title');
        if ($request->input('event_date') !== null)  $data['event_date'] = $request->input('event_date');
        if ($request->input('capacity') !== null)    $data['capacity']   = (int) $request->input('capacity');
        if ($request->input('registration_required') !== null) {
            $data['registration_required'] = (int) $request->input('registration_required');
        }
        if ($request->input('image_attachment_id') !== null) {
            $data['image_attachment_id'] = $request->input('image_attachment_id') ? (int) $request->input('image_attachment_id') : null;
        }
        if ($request->input('attachment_id') !== null) {
            $data['attachment_id'] = $request->input('attachment_id') ? (int) $request->input('attachment_id') : null;
        }

        if (!empty($data['status'])) {
            Validator::enum($data['status'], CommunityEvent::EVENT_STATUSES, 'status');
        }

        $updated = CommunityEvent::update((int) $event['id'], $data);
        AuditService::log((int) $request->user['id'], 'event.update', 'community_event', (int) $updated['id']);
        Response::success($updated, 'Event updated');
    }

    public function publish(Request $request): void
    {
        $event = CommunityEvent::find((int) $request->params['id']);
        if (!$event) {
            throw new AppException('Event not found', 404);
        }
        $updated = CommunityEvent::update((int) $event['id'], ['status' => 'Published']);
        AuditService::log((int) $request->user['id'], 'event.publish', 'community_event', (int) $updated['id']);
        Response::success($updated, 'Event published');
    }

    public function cancel(Request $request): void
    {
        $event = CommunityEvent::find((int) $request->params['id']);
        if (!$event) {
            throw new AppException('Event not found', 404);
        }
        $updated = CommunityEvent::update((int) $event['id'], ['status' => 'Cancelled']);
        AuditService::log((int) $request->user['id'], 'event.cancel', 'community_event', (int) $updated['id']);
        Response::success($updated, 'Event cancelled');
    }

    public function destroy(Request $request): void
    {
        $event = CommunityEvent::find((int) $request->params['id']);
        if (!$event) {
            throw new AppException('Event not found', 404);
        }
        CommunityEvent::softDelete((int) $event['id']);
        AuditService::log((int) $request->user['id'], 'event.delete', 'community_event', (int) $event['id']);
        Response::success([], 'Event deleted');
    }

    public function registrations(Request $request): void
    {
        $event = CommunityEvent::find((int) $request->params['id']);
        if (!$event) {
            throw new AppException('Event not found', 404);
        }
        $registrations = EventRegistration::forEvent((int) $event['id']);
        Response::success($registrations);
    }

    public function dashboard(Request $request): void
    {
        $today = date('Y-m-d');
        $monthStart = date('Y-m-01');
        $monthEnd   = date('Y-m-t');

        $upcomingCount = (int) Database::fetch(
            "SELECT COUNT(*) AS cnt FROM community_events WHERE event_date >= :today AND status = 'Published' AND deleted_at IS NULL",
            ['today' => $today]
        )['cnt'];

        $thisMonthCount = (int) Database::fetch(
            "SELECT COUNT(*) AS cnt FROM community_events WHERE event_date BETWEEN :start AND :end AND deleted_at IS NULL",
            ['start' => $monthStart, 'end' => $monthEnd]
        )['cnt'];

        $totalPublished = (int) Database::fetch(
            "SELECT COUNT(*) AS cnt FROM community_events WHERE status = 'Published' AND deleted_at IS NULL"
        )['cnt'];

        $todayRegistrations = (int) Database::fetch(
            "SELECT COUNT(*) AS cnt FROM event_registrations WHERE DATE(registered_at) = :today AND status = 'Registered'",
            ['today' => $today]
        )['cnt'];

        $recentRows = Database::fetchAll(
            "SELECT * FROM community_events WHERE deleted_at IS NULL ORDER BY created_at DESC LIMIT 5"
        );
        $recentEvents = array_map(function (array $row) {
            $exposed = CommunityEvent::present($row);
            $exposed['registration_count'] = CommunityEvent::getRegistrationCount((int) $row['id']);
            return $exposed;
        }, $recentRows);

        Response::success([
            'upcoming_count'       => $upcomingCount,
            'this_month_count'     => $thisMonthCount,
            'total_published'      => $totalPublished,
            'today_registrations'  => $todayRegistrations,
            'recent_events'        => $recentEvents,
        ]);
    }
}
