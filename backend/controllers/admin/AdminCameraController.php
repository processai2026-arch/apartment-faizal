<?php

declare(strict_types=1);

class AdminCameraController
{
    // ── Camera CRUD ───────────────────────────────────────────────────────────

    public function index(Request $request): void
    {
        [$rows, $total, $page, $perPage] = CameraDevice::list($request);
        $health = CameraDevice::getHealthSummary();

        Response::paginated($rows, $total, $page, $perPage, ['health' => $health]);
    }

    public function store(Request $request): void
    {
        Validator::require($request->all(), ['name', 'location']);

        if ($request->input('status')) {
            Validator::enum((string) $request->input('status'), CameraDevice::STATUSES, 'status');
        }
        if ($request->input('zone')) {
            Validator::enum((string) $request->input('zone'), CameraDevice::ZONES, 'zone');
        }

        $camera = CameraDevice::create([
            'name'         => $request->input('name'),
            'location'     => $request->input('location'),
            'zone'         => $request->input('zone')         ?: null,
            'rtsp_url'     => $request->input('rtsp_url')     ?: null,
            'ip_address'   => $request->input('ip_address')   ?: null,
            'port'         => $request->input('port')         ? (int) $request->input('port') : 554,
            'username'     => $request->input('username')     ?: null,
            // NEVER store plain password — store placeholder or hash only
            'password_hash' => $request->input('password')   ? password_hash((string) $request->input('password'), PASSWORD_BCRYPT) : null,
            'manufacturer' => $request->input('manufacturer') ?: null,
            'model'        => $request->input('model')        ?: null,
            'resolution'   => $request->input('resolution')   ?: null,
            'status'       => $request->input('status')       ?: 'Offline',
            'snapshot_url' => $request->input('snapshot_url') ?: null,
            'is_recording' => $request->input('is_recording') ? 1 : 0,
            'is_active'    => $request->input('is_active') !== null ? (int) $request->input('is_active') : 1,
            'notes'        => $request->input('notes')        ?: null,
        ]);

        AuditService::log((int) $request->user['id'], 'camera.create', 'camera_device', (int) $camera['id']);
        Response::success($camera, 'Camera created', 201);
    }

    public function show(Request $request): void
    {
        $camera = CameraDevice::find((int) $request->params['id']);
        if (!$camera) {
            throw new AppException('Camera not found', 404);
        }

        $camera['recent_events'] = Database::fetchAll(
            'SELECT * FROM camera_events WHERE camera_id = :cid ORDER BY occurred_at DESC LIMIT 10',
            ['cid' => $camera['id']]
        );
        $camera['recent_events'] = array_map(fn (array $row) => CameraEvent::present($row), $camera['recent_events']);

        $camera['recent_snapshots'] = Database::fetchAll(
            'SELECT * FROM camera_snapshots WHERE camera_id = :cid ORDER BY captured_at DESC LIMIT 5',
            ['cid' => $camera['id']]
        );
        $camera['recent_snapshots'] = array_map(fn (array $row) => CameraSnapshot::present($row), $camera['recent_snapshots']);

        Response::success($camera);
    }

    public function update(Request $request): void
    {
        $camera = CameraDevice::find((int) $request->params['id']);
        if (!$camera) {
            throw new AppException('Camera not found', 404);
        }

        if ($request->input('status')) {
            Validator::enum((string) $request->input('status'), CameraDevice::STATUSES, 'status');
        }
        if ($request->input('zone')) {
            Validator::enum((string) $request->input('zone'), CameraDevice::ZONES, 'zone');
        }

        $data = array_filter([
            'name'         => $request->input('name'),
            'location'     => $request->input('location'),
            'zone'         => $request->input('zone'),
            'rtsp_url'     => $request->input('rtsp_url'),
            'ip_address'   => $request->input('ip_address'),
            'port'         => $request->input('port') ? (int) $request->input('port') : null,
            'username'     => $request->input('username'),
            'manufacturer' => $request->input('manufacturer'),
            'model'        => $request->input('model'),
            'resolution'   => $request->input('resolution'),
            'status'       => $request->input('status'),
            'snapshot_url' => $request->input('snapshot_url'),
            'is_recording' => $request->input('is_recording') !== null ? (int) $request->input('is_recording') : null,
            'is_active'    => $request->input('is_active')    !== null ? (int) $request->input('is_active')    : null,
            'notes'        => $request->input('notes'),
        ], fn ($v) => $v !== null);

        // NEVER expose or overwrite password_hash unless explicitly provided
        if ($request->input('password')) {
            $data['password_hash'] = password_hash((string) $request->input('password'), PASSWORD_BCRYPT);
        }

        $updated = CameraDevice::update((int) $camera['id'], $data);
        AuditService::log((int) $request->user['id'], 'camera.update', 'camera_device', (int) $camera['id']);
        Response::success($updated);
    }

    public function destroy(Request $request): void
    {
        $camera = CameraDevice::find((int) $request->params['id']);
        if (!$camera) {
            throw new AppException('Camera not found', 404);
        }

        CameraDevice::softDelete((int) $camera['id']);
        AuditService::log((int) $request->user['id'], 'camera.delete', 'camera_device', (int) $camera['id']);
        Response::success(['id' => $camera['id']], 'Camera deleted');
    }

    // ── Heartbeat ─────────────────────────────────────────────────────────────

    public function heartbeat(Request $request): void
    {
        $camera = CameraDevice::find((int) $request->params['id']);
        if (!$camera) {
            throw new AppException('Camera not found', 404);
        }

        CameraDevice::updateHeartbeat((int) $camera['id']);
        $updated = CameraDevice::find((int) $camera['id']);
        Response::success($updated, 'Heartbeat recorded');
    }

    // ── Events ────────────────────────────────────────────────────────────────

    public function events(Request $request): void
    {
        $camera = CameraDevice::find((int) $request->params['id']);
        if (!$camera) {
            throw new AppException('Camera not found', 404);
        }

        [$page, $perPage, $offset] = Validator::page($request);

        $where  = ['camera_id = :camera_id'];
        $params = ['camera_id' => (int) $camera['id']];

        if (($request->query['event_type'] ?? '') !== '') {
            $where[]              = 'event_type = :event_type';
            $params['event_type'] = $request->query['event_type'];
        }
        if (($request->query['severity'] ?? '') !== '') {
            $where[]           = 'severity = :severity';
            $params['severity'] = $request->query['severity'];
        }

        $whereClause = 'WHERE ' . implode(' AND ', $where);
        $total       = (int) Database::fetch(
            "SELECT COUNT(*) AS total FROM camera_events {$whereClause}",
            $params
        )['total'];

        $rows = Database::fetchAll(
            "SELECT * FROM camera_events {$whereClause} ORDER BY occurred_at DESC LIMIT {$perPage} OFFSET {$offset}",
            $params
        );

        $rows = array_map(fn (array $row) => CameraEvent::present($row), $rows);
        Response::paginated($rows, $total, $page, $perPage);
    }

    public function createEvent(Request $request): void
    {
        $camera = CameraDevice::find((int) $request->params['id']);
        if (!$camera) {
            throw new AppException('Camera not found', 404);
        }

        Validator::require($request->all(), ['event_type']);
        Validator::enum((string) $request->input('event_type'), CameraEvent::EVENT_TYPES, 'event_type');

        if ($request->input('severity')) {
            Validator::enum((string) $request->input('severity'), CameraEvent::SEVERITIES, 'severity');
        }

        $now   = db_time();
        $event = Database::insert(
            'INSERT INTO camera_events (camera_id, event_type, severity, description, metadata, occurred_at, created_at)
             VALUES (:camera_id, :event_type, :severity, :description, :metadata, :occurred_at, :created_at)',
            [
                'camera_id'   => (int) $camera['id'],
                'event_type'  => $request->input('event_type'),
                'severity'    => $request->input('severity') ?: 'Low',
                'description' => $request->input('description') ?: null,
                'metadata'    => $request->input('metadata')    ?: null,
                'occurred_at' => $request->input('occurred_at') ?: $now,
                'created_at'  => $now,
            ]
        );

        $row = Database::fetch('SELECT * FROM camera_events WHERE id = :id', ['id' => $event]);
        AuditService::log((int) $request->user['id'], 'camera_event.create', 'camera_event', (int) $row['id']);
        Response::success(CameraEvent::present($row), 'Event logged', 201);
    }

    public function acknowledgeEvent(Request $request): void
    {
        $eventId = (int) $request->params['id'];
        $row     = Database::fetch('SELECT * FROM camera_events WHERE id = :id', ['id' => $eventId]);
        if (!$row) {
            throw new AppException('Event not found', 404);
        }

        $now = db_time();
        Database::query(
            'UPDATE camera_events SET acknowledged = 1, acknowledged_by = :by, acknowledged_at = :at WHERE id = :id',
            ['by' => (int) $request->user['id'], 'at' => $now, 'id' => $eventId]
        );

        $updated = Database::fetch('SELECT * FROM camera_events WHERE id = :id', ['id' => $eventId]);
        AuditService::log((int) $request->user['id'], 'camera_event.acknowledge', 'camera_event', $eventId);
        Response::success(CameraEvent::present($updated), 'Event acknowledged');
    }

    // ── Snapshots ─────────────────────────────────────────────────────────────

    public function snapshots(Request $request): void
    {
        $camera = CameraDevice::find((int) $request->params['id']);
        if (!$camera) {
            throw new AppException('Camera not found', 404);
        }

        [$page, $perPage, $offset] = Validator::page($request);
        $total = (int) Database::fetch(
            'SELECT COUNT(*) AS total FROM camera_snapshots WHERE camera_id = :cid',
            ['cid' => $camera['id']]
        )['total'];

        $rows = Database::fetchAll(
            "SELECT * FROM camera_snapshots WHERE camera_id = :cid ORDER BY captured_at DESC LIMIT {$perPage} OFFSET {$offset}",
            ['cid' => $camera['id']]
        );

        $rows = array_map(fn (array $row) => CameraSnapshot::present($row), $rows);
        Response::paginated($rows, $total, $page, $perPage);
    }

    public function createSnapshot(Request $request): void
    {
        $camera = CameraDevice::find((int) $request->params['id']);
        if (!$camera) {
            throw new AppException('Camera not found', 404);
        }

        $now = db_time();
        $id  = Database::insert(
            'INSERT INTO camera_snapshots (camera_id, file_path, file_url, captured_at, trigger, event_id, notes, created_at)
             VALUES (:camera_id, :file_path, :file_url, :captured_at, :trigger, :event_id, :notes, :created_at)',
            [
                'camera_id'   => (int) $camera['id'],
                'file_path'   => null,
                'file_url'    => $camera['snapshot_url'] ?? null,
                'captured_at' => $now,
                'trigger'     => 'Manual',
                'event_id'    => null,
                'notes'       => $request->input('notes') ?: null,
                'created_at'  => $now,
            ]
        );

        $row = Database::fetch('SELECT * FROM camera_snapshots WHERE id = :id', ['id' => $id]);
        AuditService::log((int) $request->user['id'], 'camera_snapshot.create', 'camera_snapshot', (int) $row['id']);
        Response::success(CameraSnapshot::present($row), 'Snapshot logged', 201);
    }

    // ── Dashboard ─────────────────────────────────────────────────────────────

    public function dashboard(Request $request): void
    {
        $totalCameras = (int) Database::fetch(
            'SELECT COUNT(*) AS cnt FROM camera_devices WHERE deleted_at IS NULL'
        )['cnt'];

        $byStatus = CameraDevice::getHealthSummary();

        $today = date('Y-m-d');
        $totalEventsToday = (int) Database::fetch(
            "SELECT COUNT(*) AS cnt FROM camera_events WHERE DATE(occurred_at) = :today",
            ['today' => $today]
        )['cnt'];

        $unacknowledgedEvents = (int) Database::fetch(
            'SELECT COUNT(*) AS cnt FROM camera_events WHERE acknowledged = 0'
        )['cnt'];

        $recentEvents = Database::fetchAll(
            'SELECT ce.*, cd.name AS camera_name FROM camera_events ce
             LEFT JOIN camera_devices cd ON cd.id = ce.camera_id
             ORDER BY ce.occurred_at DESC LIMIT 10'
        );
        $recentEvents = array_map(function (array $row) {
            return CameraEvent::present($row);
        }, $recentEvents);

        $zoneRows = Database::fetchAll(
            'SELECT zone, COUNT(*) AS cnt FROM camera_devices WHERE deleted_at IS NULL AND zone IS NOT NULL GROUP BY zone ORDER BY cnt DESC'
        );
        $camerasByZone = array_map(fn ($r) => ['zone' => $r['zone'], 'count' => (int) $r['cnt']], $zoneRows);

        Response::success([
            'total_cameras'         => $totalCameras,
            'by_status'             => $byStatus,
            'total_events_today'    => $totalEventsToday,
            'unacknowledged_events' => $unacknowledgedEvents,
            'recent_events'         => $recentEvents,
            'cameras_by_zone'       => $camerasByZone,
        ]);
    }

    // ── Timeline ──────────────────────────────────────────────────────────────

    public function timeline(Request $request): void
    {
        $camera = CameraDevice::find((int) $request->params['id']);
        if (!$camera) {
            throw new AppException('Camera not found', 404);
        }

        $cameraId = (int) $camera['id'];

        $events = Database::fetchAll(
            'SELECT * FROM camera_events WHERE camera_id = :cid ORDER BY occurred_at DESC LIMIT 50',
            ['cid' => $cameraId]
        );

        $snapshots = Database::fetchAll(
            'SELECT * FROM camera_snapshots WHERE camera_id = :cid ORDER BY captured_at DESC LIMIT 50',
            ['cid' => $cameraId]
        );

        $timeline = [];

        foreach ($events as $row) {
            $item         = CameraEvent::present($row);
            $item['_type'] = 'event';
            $item['_time'] = $row['occurred_at'];
            $timeline[]   = $item;
        }

        foreach ($snapshots as $row) {
            $item          = CameraSnapshot::present($row);
            $item['_type'] = 'snapshot';
            $item['_time'] = $row['captured_at'];
            $timeline[]    = $item;
        }

        usort($timeline, fn ($a, $b) => strcmp($b['_time'], $a['_time']));

        Response::success($timeline);
    }
}
