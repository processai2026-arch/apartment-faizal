<?php

declare(strict_types=1);

/**
 * Per-organization feature gate. Registered as `FeatureMiddleware:<key>` AFTER
 * the module's RoleMiddleware, so $request->user is already populated.
 *
 * super_admin bypasses every gate (it is not pinned to one organization).
 * Everyone else is checked against their org's effective entitlement; a disabled
 * feature yields 403.
 */
class FeatureMiddleware
{
    public function handle(Request $request, ?string $key = null): void
    {
        // Defensive: authentication should already have run via RoleMiddleware.
        if (!$request->user) {
            (new AuthMiddleware())->handle($request);
        }

        if (($request->user['role'] ?? '') === 'super_admin') {
            return; // bypass all feature gates
        }

        if ($key === null || $key === '') {
            return; // nothing to enforce
        }

        $orgId = (int) ($request->user['orgId'] ?? OrgScope::DEFAULT_ORG_ID);
        if ($orgId <= 0) {
            $orgId = OrgScope::DEFAULT_ORG_ID;
        }

        if (!OrganizationFeature::isEnabled($orgId, $key)) {
            AuditService::log((int) $request->user['id'], 'feature.forbidden', 'feature', null, [
                'feature' => $key,
                'orgId'   => $orgId,
                'path'    => $request->path,
            ]);
            throw new AppException('This feature is not enabled for your organization', 403);
        }
    }
}
