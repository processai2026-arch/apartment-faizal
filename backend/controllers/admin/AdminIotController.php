<?php

declare(strict_types=1);

class AdminIotController
{
    // ── Devices CRUD ──────────────────────────────────────────────────────────

    public function index(Request $request): void
    {
        [$rows, $total, $page, $perPage] = IotDevice::list($request);
        Response::paginated($rows, $total, $page, $perPage);
    }

    public function store(Request $request): void
    {
        Validator::require($request->all(), ['name']);

        $deviceType = (string) ($request->input('device_type') ?: 'other');
        Validator::enum($deviceType, IotDevice::DEVICE_TYPES, 'device_type');

        $protocol = (string) ($request->input('protocol') ?: 'http');
        Validator::enum($protocol, IotDevice::PROTOCOLS, 'protocol');

        $status = (string) ($request->input('status') ?: 'Active');
        Validator::enum($status, IotDevice::STATUSES, 'status');

        // Device secret: shown exactly once, in this response.
        $token = bin2hex(random_bytes(24));

        $device = IotDevice::create([
            'name' => $request->input('name'),
            'device_type' => $deviceType,
            'protocol' => $protocol,
            'ip_address' => $request->input('ip_address') ?: null,
            'io_lines' => $request->input('io_lines') !== null && $request->input('io_lines') !== ''
                ? (int) $request->input('io_lines')
                : null,
            'api_token' => $token,
            'location' => $request->input('location') ?: null,
            'status' => $status,
            'notes' => $request->input('notes') ?: null,
        ]);

        AuditService::log((int) $request->user['id'], 'iot_device.create', 'iot_device', (int) $device['id']);

        // api_token is hidden by the model; expose it once on create.
        $device['api_token'] = $token;
        Response::success($device, 'Device created', 201);
    }

    public function show(Request $request): void
    {
        $device = IotDevice::find((int) $request->params['id']);
        if (!$device) {
            throw new AppException('Device not found', 404);
        }

        $device['recent_events'] = IotEvent::recentForDevice((int) $device['id']);
        Response::success($device);
    }

    public function update(Request $request): void
    {
        $device = IotDevice::find((int) $request->params['id']);
        if (!$device) {
            throw new AppException('Device not found', 404);
        }

        if ($request->input('device_type')) {
            Validator::enum((string) $request->input('device_type'), IotDevice::DEVICE_TYPES, 'device_type');
        }
        if ($request->input('protocol')) {
            Validator::enum((string) $request->input('protocol'), IotDevice::PROTOCOLS, 'protocol');
        }
        if ($request->input('status')) {
            Validator::enum((string) $request->input('status'), IotDevice::STATUSES, 'status');
        }

        $data = array_filter([
            'name' => $request->input('name'),
            'device_type' => $request->input('device_type'),
            'protocol' => $request->input('protocol'),
            'ip_address' => $request->input('ip_address'),
            'io_lines' => $request->input('io_lines') !== null && $request->input('io_lines') !== ''
                ? (int) $request->input('io_lines')
                : null,
            'location' => $request->input('location'),
            'status' => $request->input('status'),
            'notes' => $request->input('notes'),
        ], fn ($v) => $v !== null);

        // api_token is never updatable here — use regenerate-token.
        $updated = IotDevice::update((int) $device['id'], $data);
        AuditService::log((int) $request->user['id'], 'iot_device.update', 'iot_device', (int) $device['id']);
        Response::success($updated);
    }

    public function destroy(Request $request): void
    {
        $device = IotDevice::find((int) $request->params['id']);
        if (!$device) {
            throw new AppException('Device not found', 404);
        }

        IotDevice::softDelete((int) $device['id']);
        AuditService::log((int) $request->user['id'], 'iot_device.delete', 'iot_device', (int) $device['id']);
        Response::success(['id' => $device['id']], 'Device deleted');
    }

    public function regenerateToken(Request $request): void
    {
        $device = IotDevice::find((int) $request->params['id']);
        if (!$device) {
            throw new AppException('Device not found', 404);
        }

        $token = bin2hex(random_bytes(24));
        IotDevice::update((int) $device['id'], ['api_token' => $token]);
        AuditService::log((int) $request->user['id'], 'iot_device.regenerate_token', 'iot_device', (int) $device['id']);

        Response::success([
            'id' => (int) $device['id'],
            'api_token' => $token,
        ], 'Token regenerated — the previous token is now invalid');
    }

    // ── Events ────────────────────────────────────────────────────────────────

    public function events(Request $request): void
    {
        if (($request->query['event_type'] ?? '') !== '') {
            Validator::enum((string) $request->query['event_type'], IotEvent::EVENT_TYPES, 'event_type');
        }
        if (($request->query['severity'] ?? '') !== '') {
            Validator::enum((string) $request->query['severity'], IotEvent::SEVERITIES, 'severity');
        }

        [$rows, $total, $page, $perPage] = IotEvent::listWithDevice($request);
        Response::paginated($rows, $total, $page, $perPage);
    }

    public function acknowledgeEvent(Request $request): void
    {
        $event = IotEvent::acknowledge((int) $request->params['id'], (int) $request->user['id']);
        AuditService::log((int) $request->user['id'], 'iot_event.acknowledge', 'iot_event', (int) $event['id']);
        Response::success($event, 'Event acknowledged');
    }

    // ── Summary ───────────────────────────────────────────────────────────────

    public function summary(Request $request): void
    {
        $minutes = (int) ($request->query['offline_minutes'] ?? config('app.iot_offline_minutes', 10));
        $minutes = max(1, min(1440, $minutes));

        Response::success(IotDevice::summary($minutes));
    }
}
