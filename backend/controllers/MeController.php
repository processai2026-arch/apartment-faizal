<?php

declare(strict_types=1);

/**
 * Current-user self-service endpoints that sit outside a specific module. The
 * frontend uses /me/features to hide navigation for org-disabled modules.
 */
class MeController
{
    /**
     * GET /me/features → {role, orgId, features: [enabledKey, ...]}.
     *
     * super_admin is never org-scoped: it receives the full catalog so its nav
     * exposes every module. Everyone else gets their org's effective set.
     */
    public function features(Request $request): void
    {
        $role = (string) ($request->user['role'] ?? '');
        $orgId = (int) ($request->user['orgId'] ?? OrgScope::DEFAULT_ORG_ID);
        if ($orgId <= 0) {
            $orgId = OrgScope::DEFAULT_ORG_ID;
        }

        $features = $role === 'super_admin'
            ? FeatureRegistry::keys()
            : OrganizationFeature::enabledFor($orgId);

        Response::success([
            'role'     => $role,
            'orgId'    => $orgId,
            'features' => array_values($features),
        ]);
    }
}
