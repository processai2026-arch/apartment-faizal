<?php

declare(strict_types=1);

class TenantSubscriptionController
{
    public function myPlan(Request $request): void
    {
        $userId = (int) $request->user['id'];
        $sub    = Subscription::getActiveForUser($userId);

        if ($sub) {
            Response::success($sub);
            return;
        }

        // No active subscription — return the Free plan details
        $freePlan = SubscriptionPlan::findBySlug('free');
        if (!$freePlan) {
            $freePlan = [
                'id'               => null,
                'name'             => 'Free',
                'slug'             => 'free',
                'description'      => 'Basic access for all residents',
                'price_monthly'    => 0,
                'price_yearly'     => 0,
                'features'         => ['3 rental listings', '1 business ad', 'Basic notifications'],
                'max_listings'     => 3,
                'max_ads'          => 1,
                'analytics_access' => 0,
                'featured_vendor'  => 0,
                'featured_rental'  => 0,
                'priority_support' => 0,
                'is_active'        => 1,
            ];
        }

        Response::success([
            'subscription' => null,
            'plan'         => $freePlan,
            'is_free'      => true,
        ]);
    }

    public function plans(Request $request): void
    {
        $plans = SubscriptionPlan::getActive();
        Response::success($plans);
    }

    public function upgrade(Request $request): void
    {
        Validator::require($request->all(), ['plan_id', 'billing_cycle']);

        $billingCycle = $request->input('billing_cycle');
        Validator::enum($billingCycle, Subscription::BILLING_CYCLES, 'billing_cycle');

        $plan = SubscriptionPlan::find((int) $request->input('plan_id'));
        if (!$plan || !$plan['is_active']) {
            throw new AppException('Plan not found', 404);
        }

        $userId = (int) $request->user['id'];

        // Record a Pending subscription as a placeholder (payment integration coming later)
        $sub = Subscription::create([
            'user_id'       => $userId,
            'plan_id'       => (int) $plan['id'],
            'status'        => 'Pending',
            'billing_cycle' => $billingCycle,
            'started_at'    => db_time(),
            'expires_at'    => null,
            'amount_paid'   => 0,
            'payment_ref'   => 'PENDING',
            'notes'         => 'Upgrade request — awaiting payment integration',
        ]);

        AuditService::log($userId, 'subscription.upgrade_request', 'subscriptions', (int) $sub['id']);

        Response::success([
            'status'       => 'pending',
            'subscription' => $sub,
            'message'      => 'Payment integration coming soon. Your upgrade request has been recorded.',
        ]);
    }

    public function cancelMySubscription(Request $request): void
    {
        $userId = (int) $request->user['id'];
        $sub    = Subscription::getActiveForUser($userId);

        if (!$sub) {
            throw new AppException('No active subscription found', 404);
        }

        $updated = Subscription::update((int) $sub['id'], [
            'status'       => 'Cancelled',
            'cancelled_at' => db_time(),
        ]);

        AuditService::log($userId, 'subscription.cancel', 'subscriptions', (int) $sub['id']);
        Response::success($updated, 'Subscription cancelled');
    }
}
