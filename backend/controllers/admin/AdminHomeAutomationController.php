<?php

declare(strict_types=1);

/**
 * Admin Home Automation portal: manage Home Assistant hubs (one per client),
 * sync/curate their entities, and view/command devices. All routes are
 * RoleMiddleware:admin (super_admin inherits admin).
 *
 * The hub's HA long-lived token is write-only from the API's perspective: it is
 * accepted on create/update and used server-side, but never returned (the model
 * masks it). See docs/HOME_AUTOMATION_RESEARCH.md.
 */
class AdminHomeAutomationController
{
    private function ha(): HomeAssistantService
    {
        return new HomeAssistantService();
    }

    // ── Hub CRUD ─────────────────────────────────────────────────────────────

    public function hubs(Request $request): void
    {
        [$rows, $total, $page, $perPage] = HomeAutomationHub::list($request);
        Response::paginated($rows, $total, $page, $perPage);
    }

    public function showHub(Request $request): void
    {
        $hub = HomeAutomationHub::find((int) $request->params['id']);
        if (!$hub) {
            throw new AppException('Hub not found', 404);
        }
        Response::success($hub);
    }

    public function storeHub(Request $request): void
    {
        Validator::require($request->all(), ['name', 'base_url', 'access_token']);

        $baseUrl = $this->normalizeBaseUrl((string) $request->input('base_url'));
        $status = Validator::enum((string) ($request->input('status') ?: 'Active'), HomeAutomationHub::STATUSES, 'status');
        $provider = Validator::enum((string) ($request->input('provider') ?: 'home_assistant'), HomeAutomationHub::PROVIDERS, 'provider');

        $hub = HomeAutomationHub::create([
            'name'          => trim((string) $request->input('name')),
            'owner_user_id' => $this->nullableUserId($request->input('owner_user_id')),
            'office_id'     => $request->input('office_id') !== null && $request->input('office_id') !== '' ? (int) $request->input('office_id') : null,
            'provider'      => $provider,
            'base_url'      => $baseUrl,
            'access_token'  => (string) $request->input('access_token'),
            'status'        => $status,
            'notes'         => $request->input('notes') ?: null,
        ]);

        AuditService::log((int) $request->user['id'], 'ha_hub.create', 'ha_hub', (int) $hub['id']);
        Response::success($hub, 'Hub added', 201);
    }

    public function updateHub(Request $request): void
    {
        $hub = HomeAutomationHub::find((int) $request->params['id']);
        if (!$hub) {
            throw new AppException('Hub not found', 404);
        }

        $data = [];
        if ($request->input('name') !== null) {
            $data['name'] = trim((string) $request->input('name'));
        }
        if ($request->input('base_url') !== null && $request->input('base_url') !== '') {
            $data['base_url'] = $this->normalizeBaseUrl((string) $request->input('base_url'));
        }
        // Only overwrite the token when a non-empty value is supplied.
        if ($request->input('access_token') !== null && $request->input('access_token') !== '') {
            $data['access_token'] = (string) $request->input('access_token');
        }
        if ($request->input('status') !== null) {
            $data['status'] = Validator::enum((string) $request->input('status'), HomeAutomationHub::STATUSES, 'status');
        }
        if ($request->input('owner_user_id') !== null) {
            $data['owner_user_id'] = $this->nullableUserId($request->input('owner_user_id'));
        }
        if ($request->input('office_id') !== null) {
            $data['office_id'] = $request->input('office_id') !== '' ? (int) $request->input('office_id') : null;
        }
        if ($request->input('notes') !== null) {
            $data['notes'] = $request->input('notes') ?: null;
        }

        if (!$data) {
            throw new AppException('Nothing to update', 422);
        }

        $updated = HomeAutomationHub::update((int) $hub['id'], $data);
        AuditService::log((int) $request->user['id'], 'ha_hub.update', 'ha_hub', (int) $hub['id']);
        Response::success($updated, 'Hub updated');
    }

    public function destroyHub(Request $request): void
    {
        $hub = HomeAutomationHub::find((int) $request->params['id']);
        if (!$hub) {
            throw new AppException('Hub not found', 404);
        }
        HomeAutomationHub::softDelete((int) $hub['id']);
        AuditService::log((int) $request->user['id'], 'ha_hub.delete', 'ha_hub', (int) $hub['id']);
        Response::success(['id' => $hub['id']], 'Hub removed');
    }

    // ── Connectivity & device sync ───────────────────────────────────────────

    public function health(Request $request): void
    {
        $raw = HomeAutomationHub::rawFind((int) $request->params['id']);
        if (!$raw) {
            throw new AppException('Hub not found', 404);
        }
        $ok = $this->ha()->ping($raw);
        HomeAutomationHub::recordCheck((int) $raw['id'], $ok);
        Response::success([
            'id'      => (int) $raw['id'],
            'ok'      => $ok,
            'checked_at' => db_time(),
        ], $ok ? 'Hub reachable' : 'Hub unreachable — check the base URL and token');
    }

    /**
     * Pull the hub's live entities and upsert them into home_automation_devices
     * (registering new ones, keeping existing curation flags). Returns a summary.
     */
    public function syncDevices(Request $request): void
    {
        $raw = HomeAutomationHub::rawFind((int) $request->params['id']);
        if (!$raw) {
            throw new AppException('Hub not found', 404);
        }

        $states = $this->ha()->states($raw);
        HomeAutomationHub::recordCheck((int) $raw['id'], true);

        $imported = 0;
        $existing = 0;
        foreach ($states as $entity) {
            if (!in_array($entity['domain'], HomeAutomationDevice::SYNC_DOMAINS, true)) {
                continue;
            }
            $known = HomeAutomationDevice::findByHubAndEntity((int) $raw['id'], $entity['entity_id']);
            if ($known) {
                // Refresh the friendly name only; leave curation flags untouched.
                HomeAutomationDevice::update((int) $known['id'], ['friendly_name' => $entity['friendly_name']]);
                $existing++;
                continue;
            }
            HomeAutomationDevice::create([
                'hub_id'          => (int) $raw['id'],
                'entity_id'       => $entity['entity_id'],
                'friendly_name'   => $entity['friendly_name'],
                'domain'          => $entity['domain'],
                'is_controllable' => in_array($entity['domain'], HomeAutomationDevice::COMMANDABLE_DOMAINS, true) ? 1 : 0,
                'visible_to_owner' => 1,
            ]);
            $imported++;
        }

        AuditService::log((int) $request->user['id'], 'ha_hub.sync', 'ha_hub', (int) $raw['id'], ['imported' => $imported]);
        Response::success([
            'hub_id'   => (int) $raw['id'],
            'imported' => $imported,
            'existing' => $existing,
            'total'    => $imported + $existing,
        ], "Synced {$imported} new device(s)");
    }

    /** Registered (curated) devices for a hub, merged with live state where reachable. */
    public function devices(Request $request): void
    {
        $raw = HomeAutomationHub::rawFind((int) $request->params['id']);
        if (!$raw) {
            throw new AppException('Hub not found', 404);
        }

        $devices = HomeAutomationDevice::forHub((int) $raw['id']);
        Response::success($this->mergeLiveState($raw, $devices, false));
    }

    public function updateDevice(Request $request): void
    {
        $device = HomeAutomationDevice::find((int) $request->params['id']);
        if (!$device) {
            throw new AppException('Device not found', 404);
        }

        $data = [];
        if ($request->input('friendly_name') !== null) {
            $data['friendly_name'] = trim((string) $request->input('friendly_name'));
        }
        if ($request->input('is_controllable') !== null) {
            $data['is_controllable'] = (int) (bool) $request->input('is_controllable');
        }
        if ($request->input('visible_to_owner') !== null) {
            $data['visible_to_owner'] = (int) (bool) $request->input('visible_to_owner');
        }
        if (!$data) {
            throw new AppException('Nothing to update', 422);
        }

        $updated = HomeAutomationDevice::update((int) $device['id'], $data);
        AuditService::log((int) $request->user['id'], 'ha_device.update', 'ha_device', (int) $device['id']);
        Response::success($updated, 'Device updated');
    }

    public function destroyDevice(Request $request): void
    {
        $device = HomeAutomationDevice::find((int) $request->params['id']);
        if (!$device) {
            throw new AppException('Device not found', 404);
        }
        HomeAutomationDevice::softDelete((int) $device['id']);
        AuditService::log((int) $request->user['id'], 'ha_device.delete', 'ha_device', (int) $device['id']);
        Response::success(['id' => $device['id']], 'Device removed');
    }

    // ── Command proxy ────────────────────────────────────────────────────────

    public function command(Request $request): void
    {
        Validator::require($request->all(), ['hubId', 'entityId', 'service']);

        $raw = HomeAutomationHub::rawFind((int) $request->input('hubId'));
        if (!$raw) {
            throw new AppException('Hub not found', 404);
        }
        if (($raw['status'] ?? '') !== 'Active') {
            throw new AppException('Hub is disabled', 422);
        }

        $entityId = (string) $request->input('entityId');
        $service = (string) $request->input('service');
        $domain = HomeAssistantService::domainOf($entityId);

        // Command must target a registered, controllable device on this hub.
        $device = HomeAutomationDevice::findByHubAndEntity((int) $raw['id'], $entityId);
        if (!$device) {
            throw new AppException('Device is not registered on this hub', 404);
        }
        if ((int) $device['is_controllable'] !== 1) {
            throw new AppException('Device is not controllable', 422);
        }

        $this->ha()->callService($raw, $domain, $service, $entityId);
        AuditService::log((int) $request->user['id'], 'ha_device.command', 'ha_device', (int) $device['id'], [
            'entity' => $entityId,
            'service' => $domain . '.' . $service,
        ]);
        Response::success(['entity_id' => $entityId, 'service' => $domain . '.' . $service], 'Command sent');
    }

    // ── Summary ──────────────────────────────────────────────────────────────

    public function summary(Request $request): void
    {
        $hubs = Database::fetchAll('SELECT status, last_check_ok FROM home_automation_hubs WHERE deleted_at IS NULL');
        $total = count($hubs);
        $active = 0;
        $reachable = 0;
        foreach ($hubs as $h) {
            if (($h['status'] ?? '') === 'Active') {
                $active++;
            }
            if ((int) ($h['last_check_ok'] ?? 0) === 1) {
                $reachable++;
            }
        }

        Response::success([
            'hubs'            => $total,
            'active_hubs'     => $active,
            'reachable_hubs'  => $reachable,
            'devices'         => HomeAutomationDevice::countAll(),
        ]);
    }

    // ── helpers ──────────────────────────────────────────────────────────────

    /**
     * Attach live HA state to each registered device (best-effort: if the hub is
     * unreachable the devices are returned with state=null rather than erroring).
     */
    private function mergeLiveState(array $rawHub, array $devices, bool $visibleOnly): array
    {
        $stateByEntity = [];
        try {
            foreach ($this->ha()->states($rawHub) as $s) {
                $stateByEntity[$s['entity_id']] = $s;
            }
            HomeAutomationHub::recordCheck((int) $rawHub['id'], true);
        } catch (AppException $e) {
            HomeAutomationHub::recordCheck((int) $rawHub['id'], false);
        }

        $out = [];
        foreach ($devices as $d) {
            if ($visibleOnly && (int) $d['visible_to_owner'] !== 1) {
                continue;
            }
            $live = $stateByEntity[$d['entity_id']] ?? null;
            $d['state'] = $live['state'] ?? null;
            $d['unit'] = $live['unit'] ?? null;
            $d['reachable'] = $live !== null;
            $out[] = $d;
        }
        return $out;
    }

    private function normalizeBaseUrl(string $url): string
    {
        $url = rtrim(trim($url), '/');
        if (!preg_match('#^https://#i', $url) && !preg_match('#^http://(localhost|127\.0\.0\.1)([:/]|$)#i', $url)) {
            throw new AppException('base_url must be an https:// URL (Nabu Casa or a TLS reverse proxy)', 422);
        }
        return $url;
    }

    private function nullableUserId(mixed $value): ?int
    {
        if ($value === null || $value === '') {
            return null;
        }
        $id = (int) $value;
        if ($id <= 0 || !User::findById($id)) {
            throw new AppException('owner_user_id does not match a known user', 422);
        }
        return $id;
    }
}
