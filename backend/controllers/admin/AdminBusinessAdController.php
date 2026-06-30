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
}
