<?php

declare(strict_types=1);

/**
 * Super Admin portal: organizations CRUD, cross-organization rollups and
 * user→organization assignment. Every route is RoleMiddleware:super_admin —
 * regular admins never reach this controller.
 */
class SuperAdminController
{
    // ── Organizations CRUD ───────────────────────────────────────────────────

    public function organizations(Request $request): void
    {
        [$rows, $total, $page, $perPage] = Organization::list($request);
        Response::paginated($rows, $total, $page, $perPage);
    }

    public function showOrganization(Request $request): void
    {
        $org = Organization::find((int) $request->params['id']);
        if (!$org) {
            throw new AppException('Organization not found', 404);
        }
        Response::success($org);
    }

    public function storeOrganization(Request $request): void
    {
        Validator::require($request->all(), ['name']);

        $name = trim((string) $request->input('name'));
        $slug = $this->normalizeSlug((string) ($request->input('slug') ?: $name));
        if ($slug === '') {
            throw new AppException('A URL-safe slug could not be derived; provide one explicitly', 422);
        }
        if (Organization::findBySlug($slug)) {
            throw new AppException('An organization with this slug already exists', 409);
        }

        $plan = Validator::enum((string) ($request->input('plan') ?: 'Free'), Organization::PLANS, 'plan');
        $status = Validator::enum((string) ($request->input('status') ?: 'Trial'), Organization::STATUSES, 'status');

        $org = Organization::create([
            'name'           => $name,
            'slug'           => $slug,
            'contact_person' => $request->input('contact_person') ?: null,
            'contact_email'  => $request->input('contact_email') ?: null,
            'contact_phone'  => $request->input('contact_phone') ?: null,
            'plan'           => $plan,
            'status'         => $status,
            'ads_enabled'    => (int) (bool) $request->input('ads_enabled', false),
            'notes'          => $request->input('notes') ?: null,
        ]);

        // Provision the new apartment with every feature enabled by default;
        // the super admin narrows the set afterwards via PUT .../features.
        OrganizationFeature::seedDefaults((int) $org['id']);

        AuditService::log((int) $request->user['id'], 'organization.create', 'organization', (int) $org['id']);
        Response::success($org, 'Organization created', 201);
    }

    public function updateOrganization(Request $request): void
    {
        $org = Organization::find((int) $request->params['id']);
        if (!$org) {
            throw new AppException('Organization not found', 404);
        }

        $data = [];
        foreach (['name', 'contact_person', 'contact_email', 'contact_phone', 'notes'] as $field) {
            if ($request->input($field) !== null) {
                $data[$field] = trim((string) $request->input($field)) ?: null;
            }
        }
        if ($request->input('name') !== null && ($data['name'] ?? '') === null) {
            throw new AppException('Name cannot be empty', 422);
        }
        if ($request->input('slug') !== null) {
            $slug = $this->normalizeSlug((string) $request->input('slug'));
            if ($slug === '') {
                throw new AppException('Slug cannot be empty', 422);
            }
            $clash = Organization::findBySlug($slug);
            if ($clash && (int) $clash['id'] !== (int) $org['id']) {
                throw new AppException('An organization with this slug already exists', 409);
            }
            $data['slug'] = $slug;
        }
        if ($request->input('plan') !== null) {
            $data['plan'] = Validator::enum((string) $request->input('plan'), Organization::PLANS, 'plan');
        }
        if ($request->input('status') !== null) {
            $data['status'] = Validator::enum((string) $request->input('status'), Organization::STATUSES, 'status');
        }
        if ($request->input('ads_enabled') !== null) {
            $data['ads_enabled'] = (int) (bool) $request->input('ads_enabled');
        }

        if (!$data) {
            throw new AppException('Nothing to update', 422);
        }

        $updated = Organization::update((int) $org['id'], $data);
        AuditService::log((int) $request->user['id'], 'organization.update', 'organization', (int) $org['id']);
        Response::success($updated, 'Organization updated');
    }

    public function statusOrganization(Request $request): void
    {
        Validator::require($request->all(), ['status']);
        $status = Validator::enum((string) $request->input('status'), Organization::STATUSES, 'status');

        $org = Organization::find((int) $request->params['id']);
        if (!$org) {
            throw new AppException('Organization not found', 404);
        }

        $updated = Organization::update((int) $org['id'], ['status' => $status]);
        AuditService::log((int) $request->user['id'], 'organization.status', 'organization', (int) $org['id'], ['status' => $status]);
        Response::success($updated, 'Organization status updated');
    }

    public function destroyOrganization(Request $request): void
    {
        $id = (int) $request->params['id'];
        if ($id === OrgScope::DEFAULT_ORG_ID) {
            throw new AppException('The default organization cannot be deleted', 422);
        }
        $org = Organization::softDelete($id);
        AuditService::log((int) $request->user['id'], 'organization.delete', 'organization', $id);
        Response::success(['id' => $org['id']], 'Organization deleted');
    }

    // ── User assignment ──────────────────────────────────────────────────────

    public function assignUser(Request $request): void
    {
        Validator::require($request->all(), ['userId']);

        $org = Organization::find((int) $request->params['id']);
        if (!$org) {
            throw new AppException('Organization not found', 404);
        }

        $userId = (int) $request->input('userId');
        $user = User::findById($userId);
        if (!$user) {
            throw new AppException('User not found', 404);
        }

        Database::query('UPDATE users SET org_id = :org_id, updated_at = :now WHERE id = :id AND deleted_at IS NULL', [
            'org_id' => (int) $org['id'],
            'now'    => db_time(),
            'id'     => $userId,
        ]);

        AuditService::log((int) $request->user['id'], 'organization.assign_user', 'organization', (int) $org['id'], ['userId' => $userId]);
        Response::success(User::public(User::findById($userId)), 'User assigned to organization');
    }

    // ── Cross-organization overview ──────────────────────────────────────────

    public function overview(Request $request): void
    {
        $orgs = Database::fetchAll('SELECT * FROM organizations WHERE deleted_at IS NULL ORDER BY id ASC');

        $users = $this->groupByOrg(
            'SELECT org_id, COUNT(*) AS metric FROM users WHERE deleted_at IS NULL GROUP BY org_id'
        );
        $activeSubs = $this->groupByOrg(
            "SELECT org_id, COUNT(*) AS metric FROM subscriptions WHERE status = 'Active' GROUP BY org_id"
        );
        $subRevenue = $this->groupByOrg(
            'SELECT org_id, COALESCE(SUM(amount_paid), 0) AS metric FROM subscriptions GROUP BY org_id'
        );
        $ads = $this->groupByOrg(
            'SELECT org_id, COUNT(*) AS metric FROM business_ads WHERE deleted_at IS NULL GROUP BY org_id'
        );
        $adBilling = $this->groupByOrg(
            'SELECT org_id, COALESCE(SUM(amount), 0) AS metric FROM ad_billing GROUP BY org_id'
        );
        $vendors = $this->groupByOrg(
            'SELECT org_id, COUNT(*) AS metric FROM vendors WHERE deleted_at IS NULL GROUP BY org_id'
        );

        $rows = [];
        foreach ($orgs as $org) {
            $orgId = (int) $org['id'];
            $rows[] = [
                'org'                  => Organization::present($org),
                'users'                => (int) ($users[$orgId] ?? 0),
                'active_subscriptions' => (int) ($activeSubs[$orgId] ?? 0),
                'subscription_revenue' => (float) ($subRevenue[$orgId] ?? 0),
                'business_ads'         => (int) ($ads[$orgId] ?? 0),
                'ad_billing_total'     => (float) ($adBilling[$orgId] ?? 0),
                'vendors'              => (int) ($vendors[$orgId] ?? 0),
            ];
        }

        // Totals include rows not yet assigned to any organization (org_id NULL).
        Response::success([
            'organizations' => $rows,
            'totals' => [
                'organizations'        => count($orgs),
                'users'                => (int) array_sum($users),
                'active_subscriptions' => (int) array_sum($activeSubs),
                'subscription_revenue' => (float) array_sum($subRevenue),
                'business_ads'         => (int) array_sum($ads),
                'ad_billing_total'     => (float) array_sum($adBilling),
                'vendors'              => (int) array_sum($vendors),
            ],
        ]);
    }

    // ── Feature entitlements ─────────────────────────────────────────────────

    /** GET /super/features/catalog — the full toggleable feature registry. */
    public function catalog(Request $request): void
    {
        Response::success(FeatureRegistry::catalog());
    }

    /** GET /super/organizations/{id}/features — {orgId, features:{key:bool}}. */
    public function showFeatures(Request $request): void
    {
        $org = Organization::find((int) $request->params['id']);
        if (!$org) {
            throw new AppException('Organization not found', 404);
        }

        Response::success([
            'orgId'    => (int) $org['id'],
            'features' => OrganizationFeature::mapFor((int) $org['id']),
        ]);
    }

    /** PUT /super/organizations/{id}/features — upsert {features:{key:bool}}. */
    public function updateFeatures(Request $request): void
    {
        $org = Organization::find((int) $request->params['id']);
        if (!$org) {
            throw new AppException('Organization not found', 404);
        }

        $features = $request->input('features');
        if (!is_array($features)) {
            throw new AppException('A features map is required', 422, ['features' => 'Expected an object of {key: bool}']);
        }

        OrganizationFeature::setForOrg((int) $org['id'], $features);
        AuditService::log((int) $request->user['id'], 'organization.features.update', 'organization', (int) $org['id'], ['features' => $features]);

        Response::success([
            'orgId'    => (int) $org['id'],
            'features' => OrganizationFeature::mapFor((int) $org['id']),
        ], 'Organization features updated');
    }

    /** @return array<int, float> metric keyed by org_id (NULL bucketed as 0). */
    private function groupByOrg(string $sql): array
    {
        $map = [];
        foreach (Database::fetchAll($sql) as $row) {
            $map[(int) ($row['org_id'] ?? 0)] = (float) $row['metric'];
        }
        return $map;
    }

    private function normalizeSlug(string $value): string
    {
        $slug = strtolower(trim($value));
        $slug = (string) preg_replace('/[^a-z0-9]+/', '-', $slug);
        return trim($slug, '-');
    }
}
