<?php

declare(strict_types=1);

/**
 * Public device-facing endpoints for the on-site hardware communication module
 * (ESP32 / Ethernet-WiFi I/O board). Authenticated with a per-device secret in
 * the X-Device-Token header — never with user JWTs.
 *
 * See docs/IOT_INTEGRATION_RESEARCH.md for the wiring / data-flow design.
 */
class IotIngestController
{
    /**
     * POST /iot/ingest
     * Records a hardware event. On warning/critical severity it raises an
     * internal panel notification for all admins and emails the association
     * secretary (fail-soft), with repeat-alert suppression per device+type+line.
     */
    public function ingest(Request $request): void
    {
        $device = $this->authenticateDevice($request);

        $eventType = (string) ($request->input('event_type') ?: 'fault');
        Validator::enum($eventType, IotEvent::EVENT_TYPES, 'event_type');

        $severity = (string) ($request->input('severity') ?: 'info');
        Validator::enum($severity, IotEvent::SEVERITIES, 'severity');

        $ioLine = $request->input('io_line');
        $ioLine = ($ioLine === null || $ioLine === '') ? null : (int) $ioLine;

        $payload = $request->input('payload');
        if (is_array($payload)) {
            $payload = json_encode($payload, JSON_UNESCAPED_SLASHES);
        } elseif ($payload !== null) {
            $payload = (string) $payload;
        }

        $message = $request->input('message') !== null
            ? Validator::sanitizeString((string) $request->input('message'))
            : null;
        if ($message !== null && strlen($message) > 500) {
            $message = substr($message, 0, 500);
        }

        IotDevice::touchLastSeen((int) $device['id']);

        // Repeat-alert suppression: identical alert shape within the cooldown
        // window is stored but does not re-notify. Checked before insert.
        $shouldAlert = in_array($severity, IotEvent::ALERT_SEVERITIES, true) && $eventType !== 'heartbeat';
        $suppressed = $shouldAlert && IotEvent::hasRecentSimilarAlert(
            (int) $device['id'],
            $eventType,
            $ioLine,
            (int) config('app.iot_alert_cooldown', 900)
        );

        $event = IotEvent::record([
            'device_id' => (int) $device['id'],
            'event_type' => $eventType,
            'severity' => $severity,
            'io_line' => $ioLine,
            'value' => $request->input('value') !== null ? (string) $request->input('value') : null,
            'message' => $message,
            'payload' => $payload,
        ]);

        $alerted = false;
        if ($shouldAlert && !$suppressed) {
            $alerted = $this->dispatchAlerts($device, $event);
        }

        Response::success([
            'event_id' => $event['id'],
            'alerted' => $alerted,
            'suppressed' => $suppressed,
        ], 'Event recorded', 201);
    }

    /**
     * POST /iot/heartbeat
     * Lightweight liveness ping — updates last_seen_at without storing a row.
     * Firmware should call this every ~60s; use /iot/ingest with
     * event_type=heartbeat if an audit trail of pings is wanted instead.
     */
    public function heartbeat(Request $request): void
    {
        $device = $this->authenticateDevice($request);

        IotDevice::touchLastSeen((int) $device['id']);

        Response::success([
            'device_id' => (int) $device['id'],
            'last_seen_at' => db_time(),
        ], 'Heartbeat recorded');
    }

    private function authenticateDevice(Request $request): array
    {
        $token = trim((string) ($request->headers['x-device-token'] ?? ''));
        if ($token === '') {
            throw new AppException('Missing X-Device-Token header', 401);
        }

        $device = IotDevice::findByToken($token);
        if (!$device) {
            throw new AppException('Invalid device token', 401);
        }
        if (($device['status'] ?? '') !== 'Active') {
            throw new AppException('Device is inactive', 403);
        }

        return $device;
    }

    /** Internal panel notification for all admins + secretary email. Fail-soft. */
    private function dispatchAlerts(array $device, array $event): bool
    {
        $severity = (string) $event['severity'];
        $deviceName = (string) ($device['name'] ?? ('Device #' . $device['id']));
        $location = trim((string) ($device['location'] ?? ''));
        $line = $event['io_line'] !== null ? " (I/O line {$event['io_line']})" : '';

        $title = sprintf('[%s] %s: %s', strtoupper($severity), $deviceName, str_replace('_', ' ', (string) $event['event_type']));
        $detail = (string) ($event['message'] ?? '');
        $summary = trim(sprintf(
            '%s reported %s%s%s.%s',
            $deviceName,
            str_replace('_', ' ', (string) $event['event_type']),
            $line,
            $location !== '' ? " at {$location}" : '',
            $detail !== '' ? ' ' . $detail : ''
        ));

        // 1) Internal panel alert — reuse the existing notifications system.
        try {
            $adminIds = NotificationService::resolveRecipients(['role' => 'admin']);
            NotificationService::createForUsers($adminIds, [
                'title' => $title,
                'message' => $summary,
                'type' => $severity === 'critical' ? 'Emergency Alert' : 'System Notification',
                'category' => 'IoT',
                'priority' => $severity === 'critical' ? 'Emergency' : 'High',
                'action_url' => '/iot',
                'reference_type' => 'iot_event',
                'reference_id' => $event['id'],
            ]);
        } catch (Throwable $e) {
            error_log('[' . db_time() . '] IoT panel alert failed: ' . $e->getMessage() . PHP_EOL, 3, STORAGE_PATH . '/logs/app.log');
        }

        // 2) Email to the association secretary (fail-soft inside MailService).
        $body = "OfficeGate hardware alert\n\n"
            . "Device:    {$deviceName} (#{$event['device_id']})\n"
            . 'Type:      ' . str_replace('_', ' ', (string) $event['event_type']) . "\n"
            . "Severity:  {$severity}\n"
            . ($event['io_line'] !== null ? "I/O line:  {$event['io_line']}\n" : '')
            . (($event['value'] ?? null) !== null ? "Value:     {$event['value']}\n" : '')
            . ($location !== '' ? "Location:  {$location}\n" : '')
            . ($detail !== '' ? "Message:   {$detail}\n" : '')
            . "Time:      {$event['created_at']}\n\n"
            . "Review and acknowledge this alert in the OfficeGate admin panel (IoT Monitoring page).\n";
        MailService::sendSecretaryAlert($title, $body);

        return true;
    }
}
