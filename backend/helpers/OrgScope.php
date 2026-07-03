<?php

declare(strict_types=1);

/**
 * Organization scoping for multi-tenant queries.
 *
 * Pragmatic first pass (see docs/MULTI_TENANT_ARCHITECTURE.md):
 * - super_admin sees every organization by default and may narrow a list
 *   endpoint with an optional ?orgId= query parameter.
 * - Regular admins (and other roles) are pinned to their own users.org_id;
 *   accounts predating the organizations table fall back to the default
 *   organization (id 1).
 */
class OrgScope
{
    public const DEFAULT_ORG_ID = 1;

    /**
     * Org id a LIST query must be filtered to, or null for "all organizations"
     * (super_admin without an explicit ?orgId= filter, or unauthenticated
     * internal calls).
     */
    public static function orgIdFor(Request $request): ?int
    {
        $user = $request->user;
        if (!$user) {
            return null;
        }

        if (($user['role'] ?? '') === 'super_admin') {
            $requested = (string) ($request->query['orgId'] ?? $request->query['org_id'] ?? '');
            return $requested !== '' ? (int) $requested : null;
        }

        return self::userOrgId($user);
    }

    /**
     * Org id to stamp onto newly created org-scoped rows. super_admin may
     * target another organization via ?orgId= / org_id in the query string;
     * everyone else writes into their own organization.
     */
    public static function stampFor(Request $request): int
    {
        return self::orgIdFor($request)
            ?? self::userOrgId($request->user ?? [])
            ?? self::DEFAULT_ORG_ID;
    }

    private static function userOrgId(array $user): ?int
    {
        $orgId = $user['orgId'] ?? $user['org_id'] ?? null;
        return $orgId !== null && (int) $orgId > 0 ? (int) $orgId : self::DEFAULT_ORG_ID;
    }
}
