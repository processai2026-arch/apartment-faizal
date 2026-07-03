<?php

declare(strict_types=1);

/**
 * Tenant-facing Home Automation: a client controls only the hubs assigned to
 * them (home_automation_hubs.owner_user_id = their user id) and only the devices
 * an admin has marked visible_to_owner. All routes are RoleMiddleware:tenant.
 */
class TenantHomeAutomationController
{
    private function ha(): HomeAssistantService
    {
        return new HomeAssistantService();
    }

    /** Hubs owned by the signed-in tenant (tokens masked by the model). */
    public function hubs(Request $request): void
    {
        $hubs = HomeAutomationHub::forOwner((int) $request->user['id']);
        Response::success($hubs);
    }

    /** Visible devices for one owned hub, merged with live HA state. */
    public function devices(Request $request): void
    {
        $raw = $this->ownedHubOrFail($request);

        $devices = HomeAutomationDevice::forHub((int) $raw['id'], true);

        $stateByEntity = [];
        try {
            foreach ($this->ha()->states($raw) as $s) {
                $stateByEntity[$s['entity_id']] = $s;
            }
            HomeAutomationHub::recordCheck((int) $raw['id'], true);
        } catch (AppException $e) {
            HomeAutomationHub::recordCheck((int) $raw['id'], false);
        }

        $out = [];
        foreach ($devices as $d) {
            $live = $stateByEntity[$d['entity_id']] ?? null;
            $d['state'] = $live['state'] ?? null;
            $d['unit'] = $live['unit'] ?? null;
            $d['reachable'] = $live !== null;
            $out[] = $d;
        }
        Response::success($out);
    }

    /** Command a device on an owned hub. */
    public function command(Request $request): void
    {
        Validator::require($request->all(), ['hubId', 'entityId', 'service']);
        $raw = $this->ownedHubOrFail($request, (int) $request->input('hubId'));

        if (($raw['status'] ?? '') !== 'Active') {
            throw new AppException('Hub is disabled', 422);
        }

        $entityId = (string) $request->input('entityId');
        $service = (string) $request->input('service');
        $domain = HomeAssistantService::domainOf($entityId);

        $device = HomeAutomationDevice::findByHubAndEntity((int) $raw['id'], $entityId);
        if (!$device || (int) $device['visible_to_owner'] !== 1) {
            throw new AppException('Device not available', 404);
        }
        if ((int) $device['is_controllable'] !== 1) {
            throw new AppException('Device is not controllable', 422);
        }

        $this->ha()->callService($raw, $domain, $service, $entityId);
        AuditService::log((int) $request->user['id'], 'ha_device.command', 'ha_device', (int) $device['id'], [
            'entity' => $entityId,
            'service' => $domain . '.' . $service,
            'via' => 'tenant',
        ]);
        Response::success(['entity_id' => $entityId, 'service' => $domain . '.' . $service], 'Command sent');
    }

    /**
     * Fetch a raw hub row and assert the signed-in tenant owns it. Accepts an
     * explicit id (command body) or falls back to the route param.
     */
    private function ownedHubOrFail(Request $request, ?int $hubId = null): array
    {
        $id = $hubId ?? (int) ($request->params['id'] ?? 0);
        $raw = HomeAutomationHub::rawFind($id);
        if (!$raw || (int) ($raw['owner_user_id'] ?? 0) !== (int) $request->user['id']) {
            throw new AppException('Hub not found', 404);
        }
        return $raw;
    }
}
