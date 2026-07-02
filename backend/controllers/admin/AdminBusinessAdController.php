<?php

declare(strict_types=1);

class AdminBusinessAdController
{
    public function index(Request $request): void
    {
        [$rows, $total, $page, $perPage] = BusinessAd::list($request);
        Response::paginated($rows, $total, $page, $perPage);
    }

    public function show(Request $request): void
    {
        $ad = BusinessAd::find((int) $request->params['id']);
        if (!$ad) {
            throw new AppException('Ad not found', 404);
        }
        Response::success($ad);
    }

    public function store(Request $request): void
    {
        Validator::require($request->all(), ['business_name']);
        $ad = BusinessAd::create([
            'category_id'         => $request->input('category_id') ? (int) $request->input('category_id') : null,
            'business_name'       => $request->input('business_name'),
            'description'         => $request->input('description') ?: null,
            'offer'               => $request->input('offer') ?: null,
            'website'             => $request->input('website') ?: null,
            'phone'               => $request->input('phone') ?: null,
            'whatsapp'            => $request->input('whatsapp') ?: null,
            'address'             => $request->input('address') ?: null,
            'logo_attachment_id'  => $request->input('logo_attachment_id') ? (int) $request->input('logo_attachment_id') : null,
            'banner_attachment_id' => $request->input('banner_attachment_id') ? (int) $request->input('banner_attachment_id') : null,
            'featured'            => (int) (bool) $request->input('featured', false),
            'priority'            => $request->input('priority') !== null ? (int) $request->input('priority') : 0,
            'status'              => 'Active',
            'expires_at'          => $request->input('expires_at') ?: null,
        ]);
        AuditService::log((int) $request->user['id'], 'business_ad.create', 'business_ad', (int) $ad['id']);
        Response::success($ad, 'Ad created', 201);
    }

    public function update(Request $request): void
    {
        $ad = BusinessAd::find((int) $request->params['id']);
        if (!$ad) {
            throw new AppException('Ad not found', 404);
        }
        $updated = BusinessAd::update((int) $ad['id'], array_filter([
            'category_id'          => $request->input('category_id') ? (int) $request->input('category_id') : null,
            'business_name'        => $request->input('business_name'),
            'description'          => $request->input('description'),
            'offer'                => $request->input('offer'),
            'website'              => $request->input('website'),
            'phone'                => $request->input('phone'),
            'whatsapp'             => $request->input('whatsapp'),
            'address'              => $request->input('address'),
            'logo_attachment_id'   => $request->input('logo_attachment_id') ? (int) $request->input('logo_attachment_id') : null,
            'banner_attachment_id' => $request->input('banner_attachment_id') ? (int) $request->input('banner_attachment_id') : null,
            'featured'             => $request->input('featured') !== null ? (int) (bool) $request->input('featured') : null,
            'priority'             => $request->input('priority') !== null ? (int) $request->input('priority') : null,
            'status'               => $request->input('status'),
            'expires_at'           => $request->input('expires_at'),
        ], fn ($v) => $v !== null));
        AuditService::log((int) $request->user['id'], 'business_ad.update', 'business_ad', (int) $updated['id']);
        Response::success($updated, 'Ad updated');
    }

    public function destroy(Request $request): void
    {
        $ad = BusinessAd::find((int) $request->params['id']);
        if (!$ad) {
            throw new AppException('Ad not found', 404);
        }
        BusinessAd::softDelete((int) $ad['id']);
        AuditService::log((int) $request->user['id'], 'business_ad.delete', 'business_ad', (int) $ad['id']);
        Response::success([], 'Ad deleted');
    }

    public function status(Request $request): void
    {
        Validator::require($request->all(), ['status']);
        $status = Validator::enum((string) $request->input('status'), BusinessAd::STATUSES, 'status');
        $ad = BusinessAd::update((int) $request->params['id'], ['status' => $status]);
        AuditService::log((int) $request->user['id'], 'business_ad.status', 'business_ad', (int) $ad['id'], ['status' => $status]);
        Response::success($ad, 'Ad status updated');
    }

    public function dashboard(Request $request): void
    {
        $stats = Database::fetch(
            "SELECT
               COUNT(*) AS total,
               COALESCE(SUM(CASE WHEN status='Active' THEN 1 ELSE 0 END), 0) AS active,
               COALESCE(SUM(CASE WHEN status='Pending' THEN 1 ELSE 0 END), 0) AS pending,
               COALESCE(SUM(CASE WHEN status='Expired' THEN 1 ELSE 0 END), 0) AS expired,
               COALESCE(SUM(featured), 0) AS featured,
               COALESCE(SUM(view_count), 0) AS total_views,
               COALESCE(SUM(click_count), 0) AS total_clicks
             FROM business_ads WHERE deleted_at IS NULL"
        );
        $byCategory = Database::fetchAll(
            'SELECT bc.name, COUNT(ba.id) AS count
             FROM business_ads ba LEFT JOIN business_categories bc ON ba.category_id = bc.id
             WHERE ba.deleted_at IS NULL GROUP BY ba.category_id'
        );
        $mostClicked = Database::fetchAll(
            'SELECT id, business_name, click_count, view_count, status
             FROM business_ads WHERE deleted_at IS NULL ORDER BY click_count DESC LIMIT 5'
        );
        Response::success(['stats' => $stats, 'byCategory' => $byCategory, 'mostClicked' => $mostClicked]);
    }

    // Category management
    public function categories(Request $request): void
    {
        [$rows, $total, $page, $perPage] = BusinessCategory::list($request);
        Response::paginated($rows, $total, $page, $perPage);
    }

    public function createCategory(Request $request): void
    {
        Validator::require($request->all(), ['name', 'slug']);
        $cat = BusinessCategory::create([
            'name' => $request->input('name'),
            'slug' => $request->input('slug'),
            'icon' => $request->input('icon') ?: null,
        ]);
        AuditService::log((int) $request->user['id'], 'business_category.create', 'business_category', (int) $cat['id']);
        Response::success($cat, 'Category created', 201);
    }

    public function updateCategory(Request $request): void
    {
        $cat = BusinessCategory::update((int) $request->params['id'], array_filter([
            'name' => $request->input('name'),
            'slug' => $request->input('slug'),
            'icon' => $request->input('icon'),
        ], fn ($v) => $v !== null));
        Response::success($cat, 'Category updated');
    }

    public function deleteCategory(Request $request): void
    {
        BusinessCategory::softDelete((int) $request->params['id']);
        Response::success([], 'Category deleted');
    }

    // ── Analytics (P23) ──────────────────────────────────────────────────────

    public function analytics(Request $request): void
    {
        $stats = Database::fetch(
            "SELECT
               COUNT(*) AS total_ads,
               COALESCE(SUM(CASE WHEN status='Active' THEN 1 ELSE 0 END), 0) AS active_ads,
               COALESCE(SUM(impressions), 0) AS total_impressions,
               COALESCE(SUM(clicks), 0) AS total_clicks,
               COALESCE(AVG(CASE WHEN impressions > 0 THEN ctr END), 0) AS avg_ctr
             FROM business_ads WHERE deleted_at IS NULL"
        );

        $topClicked = Database::fetchAll(
            'SELECT id, business_name AS title, clicks, ctr FROM business_ads
             WHERE deleted_at IS NULL ORDER BY clicks DESC LIMIT 5'
        );

        $topViewed = Database::fetchAll(
            'SELECT id, business_name AS title, impressions FROM business_ads
             WHERE deleted_at IS NULL ORDER BY impressions DESC LIMIT 5'
        );

        $monthlyImpressions = Database::fetchAll(
            'SELECT ' . sql_month('created_at') . " AS month, COALESCE(SUM(impressions), 0) AS count
             FROM business_ads
             WHERE deleted_at IS NULL
               AND created_at >= " . sql_months_ago(6) . '
             GROUP BY ' . sql_month('created_at') . '
             ORDER BY month ASC'
        );

        $activeVsExpired = Database::fetch(
            "SELECT
               COALESCE(SUM(CASE WHEN status='Active' THEN 1 ELSE 0 END), 0) AS active,
               COALESCE(SUM(CASE WHEN status='Expired' THEN 1 ELSE 0 END), 0) AS expired
             FROM business_ads WHERE deleted_at IS NULL"
        );

        $revenueSummary = AdBilling::getStats();

        Response::success([
            'total_ads'           => (int) ($stats['total_ads'] ?? 0),
            'active_ads'          => (int) ($stats['active_ads'] ?? 0),
            'total_impressions'   => (int) ($stats['total_impressions'] ?? 0),
            'total_clicks'        => (int) ($stats['total_clicks'] ?? 0),
            'avg_ctr'             => round((float) ($stats['avg_ctr'] ?? 0), 2),
            'top_clicked'         => $topClicked,
            'top_viewed'          => $topViewed,
            'monthly_impressions' => $monthlyImpressions,
            'active_vs_expired'   => $activeVsExpired,
            'revenue_summary'     => $revenueSummary,
        ]);
    }

    public function trackImpression(Request $request): void
    {
        $id = (int) $request->params['id'];
        $ad = BusinessAd::find($id);
        if (!$ad) {
            throw new AppException('Ad not found', 404);
        }
        $newImpressions = (int) $ad['impressions'] + 1;
        $clicks = (int) $ad['clicks'];
        $newCtr = $newImpressions > 0 ? round(($clicks / $newImpressions) * 100, 2) : 0;
        Database::query(
            'UPDATE business_ads SET impressions = :imp, ctr = :ctr, updated_at = :now WHERE id = :id',
            ['imp' => $newImpressions, 'ctr' => $newCtr, 'now' => db_time(), 'id' => $id]
        );
        Response::success(['impressions' => $newImpressions, 'ctr' => $newCtr]);
    }

    // ── Packages (P23) ───────────────────────────────────────────────────────

    public function packages(Request $request): void
    {
        $rows = AdPackage::getActive();
        Response::success($rows);
    }

    public function createPackage(Request $request): void
    {
        Validator::require($request->all(), ['name', 'price']);
        $features = $request->input('features');
        $pkg = AdPackage::create([
            'name'            => $request->input('name'),
            'description'     => $request->input('description') ?: null,
            'price'           => (float) $request->input('price'),
            'duration_days'   => $request->input('duration_days') ? (int) $request->input('duration_days') : 30,
            'max_impressions' => $request->input('max_impressions') ? (int) $request->input('max_impressions') : 0,
            'features'        => is_array($features) ? json_encode($features) : ($features ?: '[]'),
            'is_active'       => 1,
            'sort_order'      => $request->input('sort_order') ? (int) $request->input('sort_order') : 0,
        ]);
        AuditService::log((int) $request->user['id'], 'ad_package.create', 'ad_package', (int) $pkg['id']);
        Response::success($pkg, 'Package created', 201);
    }

    public function updatePackage(Request $request): void
    {
        $id = (int) $request->params['id'];
        $features = $request->input('features');
        $data = array_filter([
            'name'            => $request->input('name'),
            'description'     => $request->input('description'),
            'price'           => $request->input('price') !== null ? (float) $request->input('price') : null,
            'duration_days'   => $request->input('duration_days') !== null ? (int) $request->input('duration_days') : null,
            'max_impressions' => $request->input('max_impressions') !== null ? (int) $request->input('max_impressions') : null,
            'features'        => $features !== null ? (is_array($features) ? json_encode($features) : $features) : null,
            'is_active'       => $request->input('is_active') !== null ? (int) (bool) $request->input('is_active') : null,
            'sort_order'      => $request->input('sort_order') !== null ? (int) $request->input('sort_order') : null,
        ], fn ($v) => $v !== null);
        $pkg = AdPackage::update($id, $data);
        AuditService::log((int) $request->user['id'], 'ad_package.update', 'ad_package', $id);
        Response::success($pkg, 'Package updated');
    }

    public function destroyPackage(Request $request): void
    {
        $id = (int) $request->params['id'];
        Database::query('DELETE FROM ad_packages WHERE id = :id', ['id' => $id]);
        AuditService::log((int) $request->user['id'], 'ad_package.delete', 'ad_package', $id);
        Response::success([], 'Package deleted');
    }

    // ── Billing (P23) ────────────────────────────────────────────────────────

    public function billing(Request $request): void
    {
        $rows = Database::fetchAll(
            "SELECT ab.*, ba.business_name, ap.name AS package_name
             FROM ad_billing ab
             JOIN business_ads ba ON ba.id = ab.ad_id
             LEFT JOIN ad_packages ap ON ap.id = ab.package_id
             ORDER BY ab.id DESC
             LIMIT 200"
        );
        $mapped = array_map(function (array $row): array {
            $row['id']               = (int) $row['id'];
            $row['ad_id']            = (int) $row['ad_id'];
            $row['package_id']       = $row['package_id'] !== null ? (int) $row['package_id'] : null;
            $row['amount']           = (float) $row['amount'];
            $row['renewal_reminded'] = (int) ($row['renewal_reminded'] ?? 0) === 1;
            return $row;
        }, $rows);
        Response::success($mapped);
    }

    public function createBilling(Request $request): void
    {
        Validator::require($request->all(), ['ad_id', 'amount']);
        $adId = (int) $request->input('ad_id');
        $ad   = BusinessAd::find($adId);
        if (!$ad) {
            throw new AppException('Ad not found', 404);
        }
        $record = AdBilling::create([
            'ad_id'          => $adId,
            'package_id'     => $request->input('package_id') ? (int) $request->input('package_id') : null,
            'amount'         => (float) $request->input('amount'),
            'billing_status' => 'Pending',
            'due_date'       => $request->input('due_date') ?: null,
            'payment_ref'    => $request->input('payment_ref') ?: null,
            'notes'          => $request->input('notes') ?: null,
        ]);
        AuditService::log((int) $request->user['id'], 'ad_billing.create', 'ad_billing', (int) $record['id']);
        Response::success($record, 'Billing record created', 201);
    }

    public function payBilling(Request $request): void
    {
        $id = (int) $request->params['id'];
        $row = Database::fetch('SELECT * FROM ad_billing WHERE id = :id LIMIT 1', ['id' => $id]);
        if (!$row) {
            throw new AppException('Billing record not found', 404);
        }
        $now = db_time();
        Database::query(
            "UPDATE ad_billing SET billing_status = 'Paid', paid_at = :now1, payment_ref = :ref, updated_at = :now2 WHERE id = :id",
            [
                'now1' => $now,
                'now2' => $now,
                'ref' => $request->input('payment_ref') ?: ($row['payment_ref'] ?? null),
                'id'  => $id,
            ]
        );
        $updated = Database::fetch('SELECT * FROM ad_billing WHERE id = :id LIMIT 1', ['id' => $id]);
        AuditService::log((int) $request->user['id'], 'ad_billing.pay', 'ad_billing', $id);
        Response::success($updated, 'Billing marked as paid');
    }

    public function billingSummary(Request $request): void
    {
        $stats = AdBilling::getStats();
        $byStatus = Database::fetchAll(
            "SELECT billing_status AS status, COUNT(*) AS count, COALESCE(SUM(amount), 0) AS total
             FROM ad_billing GROUP BY billing_status"
        );
        Response::success(array_merge($stats, ['by_status' => $byStatus]));
    }

    public function sendRenewalReminder(Request $request): void
    {
        $id = (int) $request->params['id'];
        $ad = BusinessAd::find($id);
        if (!$ad) {
            throw new AppException('Ad not found', 404);
        }

        // Mark renewal notified on the ad
        Database::query(
            'UPDATE business_ads SET renewal_notified = 1, updated_at = :now WHERE id = :id',
            ['now' => db_time(), 'id' => $id]
        );

        // Find the ad owner via billing or look up user
        $ownerRow = Database::fetch(
            "SELECT u.id FROM users u
             WHERE u.role = 'admin' AND u.deleted_at IS NULL AND u.status = 'active'
             ORDER BY u.id ASC LIMIT 1"
        );
        if ($ownerRow) {
            NotificationService::createForUsers([(int) $ownerRow['id']], [
                'title'          => 'Ad Renewal Reminder',
                'message'        => "Business ad \"{$ad['business_name']}\" is due for renewal.",
                'type'           => 'System Notification',
                'category'       => 'ad_renewal',
                'priority'       => 'Medium',
                'reference_type' => 'business_ad',
                'reference_id'   => $id,
                'created_by'     => (int) $request->user['id'],
            ]);
        }

        AuditService::log((int) $request->user['id'], 'business_ad.renewal_reminder', 'business_ad', $id);
        Response::success(['reminded' => true], 'Renewal reminder sent');
    }

    public function exportReport(Request $request): void
    {
        $rows = Database::fetchAll(
            "SELECT
               ba.id,
               ba.business_name,
               ba.status,
               ba.impressions,
               ba.clicks,
               ba.ctr,
               ba.is_featured,
               ba.expires_at,
               ba.created_at,
               ab.billing_status,
               ab.amount AS billing_amount,
               ab.due_date AS billing_due_date,
               ab.paid_at,
               ap.name AS package_name
             FROM business_ads ba
             LEFT JOIN ad_billing ab ON ab.id = (
               SELECT id FROM ad_billing WHERE ad_id = ba.id ORDER BY id DESC LIMIT 1
             )
             LEFT JOIN ad_packages ap ON ap.id = ab.package_id
             WHERE ba.deleted_at IS NULL
             ORDER BY ba.id DESC"
        );
        $mapped = array_map(function (array $row): array {
            $row['impressions']      = (int) ($row['impressions'] ?? 0);
            $row['clicks']           = (int) ($row['clicks'] ?? 0);
            $row['ctr']              = (float) ($row['ctr'] ?? 0);
            $row['is_featured']      = (int) ($row['is_featured'] ?? 0) === 1;
            $row['billing_amount']   = (float) ($row['billing_amount'] ?? 0);
            return $row;
        }, $rows);
        Response::success($mapped);
    }
}
