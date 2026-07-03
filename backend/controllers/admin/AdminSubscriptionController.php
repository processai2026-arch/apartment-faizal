<?php

declare(strict_types=1);

class AdminSubscriptionController
{
    // ── Plans ─────────────────────────────────────────────────────────────────

    public function plans(Request $request): void
    {
        [$rows, $total, $page, $perPage] = SubscriptionPlan::list($request);
        Response::paginated($rows, $total, $page, $perPage);
    }

    public function createPlan(Request $request): void
    {
        Validator::require($request->all(), ['name', 'slug']);

        $features = $request->input('features');
        if (is_array($features)) {
            $features = json_encode($features);
        } elseif ($features === null) {
            $features = '[]';
        }

        $plan = SubscriptionPlan::create([
            'name'             => $request->input('name'),
            'slug'             => $request->input('slug'),
            'description'      => $request->input('description') ?: null,
            'price_monthly'    => (float) ($request->input('price_monthly') ?? 0),
            'price_yearly'     => (float) ($request->input('price_yearly') ?? 0),
            'features'         => $features,
            'max_listings'     => (int) ($request->input('max_listings') ?? 3),
            'max_ads'          => (int) ($request->input('max_ads') ?? 1),
            'analytics_access' => (int) ($request->input('analytics_access') ?? 0),
            'featured_vendor'  => (int) ($request->input('featured_vendor') ?? 0),
            'featured_rental'  => (int) ($request->input('featured_rental') ?? 0),
            'priority_support' => (int) ($request->input('priority_support') ?? 0),
            'is_active'        => (int) ($request->input('is_active') ?? 1),
            'sort_order'       => (int) ($request->input('sort_order') ?? 0),
        ]);

        AuditService::log((int) $request->user['id'], 'subscription_plan.create', 'subscription_plans', (int) $plan['id']);
        Response::success($plan, 'Plan created', 201);
    }

    public function updatePlan(Request $request): void
    {
        $plan = SubscriptionPlan::find((int) $request->params['id']);
        if (!$plan) {
            throw new AppException('Plan not found', 404);
        }

        $data = [];
        $stringFields = ['name', 'slug', 'description'];
        foreach ($stringFields as $field) {
            if ($request->input($field) !== null) {
                $data[$field] = $request->input($field);
            }
        }

        $floatFields = ['price_monthly', 'price_yearly'];
        foreach ($floatFields as $field) {
            if ($request->input($field) !== null) {
                $data[$field] = (float) $request->input($field);
            }
        }

        $intFields = ['max_listings', 'max_ads', 'analytics_access', 'featured_vendor', 'featured_rental', 'priority_support', 'is_active', 'sort_order'];
        foreach ($intFields as $field) {
            if ($request->input($field) !== null) {
                $data[$field] = (int) $request->input($field);
            }
        }

        $features = $request->input('features');
        if ($features !== null) {
            $data['features'] = is_array($features) ? json_encode($features) : $features;
        }

        if (!empty($data)) {
            $plan = SubscriptionPlan::update((int) $plan['id'], $data);
        }

        AuditService::log((int) $request->user['id'], 'subscription_plan.update', 'subscription_plans', (int) $plan['id']);
        Response::success($plan, 'Plan updated');
    }

    public function destroyPlan(Request $request): void
    {
        $plan = SubscriptionPlan::find((int) $request->params['id']);
        if (!$plan) {
            throw new AppException('Plan not found', 404);
        }
        SubscriptionPlan::update((int) $plan['id'], ['is_active' => 0]);
        AuditService::log((int) $request->user['id'], 'subscription_plan.deactivate', 'subscription_plans', (int) $plan['id']);
        Response::success(['id' => $plan['id']], 'Plan deactivated');
    }

    // ── Subscriptions ─────────────────────────────────────────────────────────

    public function subscriptions(Request $request): void
    {
        [$rows, $total, $page, $perPage] = Subscription::list($request);
        Response::paginated($rows, $total, $page, $perPage);
    }

    public function showSubscription(Request $request): void
    {
        $sub = Subscription::find((int) $request->params['id']);
        if (!$sub) {
            throw new AppException('Subscription not found', 404);
        }
        Response::success($sub);
    }

    public function createSubscription(Request $request): void
    {
        Validator::require($request->all(), ['user_id', 'plan_id', 'started_at']);

        $billingCycle = $request->input('billing_cycle') ?: 'Monthly';
        Validator::enum($billingCycle, Subscription::BILLING_CYCLES, 'billing_cycle');

        $status = $request->input('status') ?: 'Active';
        Validator::enum($status, Subscription::STATUSES, 'status');

        $plan = SubscriptionPlan::find((int) $request->input('plan_id'));
        if (!$plan) {
            throw new AppException('Plan not found', 404);
        }

        $sub = Subscription::create([
            'user_id'       => (int) $request->input('user_id'),
            'plan_id'       => (int) $request->input('plan_id'),
            'status'        => $status,
            'billing_cycle' => $billingCycle,
            'started_at'    => $request->input('started_at'),
            'expires_at'    => $request->input('expires_at') ?: null,
            'amount_paid'   => (float) ($request->input('amount_paid') ?? 0),
            'payment_ref'   => $request->input('payment_ref') ?: null,
            'notes'         => $request->input('notes') ?: null,
            'org_id'        => OrgScope::stampFor($request),
        ]);

        AuditService::log((int) $request->user['id'], 'subscription.create', 'subscriptions', (int) $sub['id']);
        Response::success($sub, 'Subscription created', 201);
    }

    public function cancelSubscription(Request $request): void
    {
        $sub = Subscription::find((int) $request->params['id']);
        if (!$sub) {
            throw new AppException('Subscription not found', 404);
        }
        $updated = Subscription::update((int) $sub['id'], [
            'status'       => 'Cancelled',
            'cancelled_at' => db_time(),
        ]);
        AuditService::log((int) $request->user['id'], 'subscription.cancel', 'subscriptions', (int) $sub['id']);
        Response::success($updated, 'Subscription cancelled');
    }

    public function dashboard(Request $request): void
    {
        $stats = Subscription::getStats();

        $recentRows = Database::fetchAll(
            "SELECT s.*, u.name AS user_name, u.email AS user_email, sp.name AS plan_name, sp.slug AS plan_slug
             FROM subscriptions s
             LEFT JOIN users u ON u.id = s.user_id
             LEFT JOIN subscription_plans sp ON sp.id = s.plan_id
             ORDER BY s.id DESC LIMIT 5"
        );
        $recentSubscriptions = array_map(
            fn (array $row) => Subscription::present($row),
            $recentRows
        );

        Response::success([
            'total_subscribers'    => $stats['total'],
            'active'               => $stats['active'],
            'by_plan'              => $stats['by_plan'],
            'mrr'                  => $stats['mrr'],
            'recent_subscriptions' => $recentSubscriptions,
        ]);
    }

    // ── Premium Features ──────────────────────────────────────────────────────

    public function features(Request $request): void
    {
        $rows = PremiumFeature::getAll();
        Response::success($rows);
    }

    public function updateFeature(Request $request): void
    {
        $feature = PremiumFeature::find((int) $request->params['id']);
        if (!$feature) {
            throw new AppException('Feature not found', 404);
        }

        $data = [];
        $stringFields = ['feature_key', 'feature_name', 'description', 'min_plan'];
        foreach ($stringFields as $field) {
            if ($request->input($field) !== null) {
                $data[$field] = $request->input($field);
            }
        }
        if ($request->input('is_active') !== null) {
            $data['is_active'] = (int) $request->input('is_active');
        }

        if (!empty($data)) {
            $feature = PremiumFeature::update((int) $feature['id'], $data);
        }

        AuditService::log((int) $request->user['id'], 'premium_feature.update', 'premium_features', (int) $feature['id']);
        Response::success($feature, 'Feature updated');
    }
}
