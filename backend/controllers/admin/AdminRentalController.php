<?php

declare(strict_types=1);

class AdminRentalController
{
    public function index(Request $request): void
    {
        [$rows, $total, $page, $perPage] = RentalListing::list($request);
        Response::paginated($rows, $total, $page, $perPage);
    }

    public function show(Request $request): void
    {
        $listing = RentalListing::find((int) $request->params['id']);
        if (!$listing) {
            throw new AppException('Listing not found', 404);
        }
        $listing['images']  = Database::fetchAll(
            'SELECT * FROM listing_images WHERE listing_id = :id AND deleted_at IS NULL ORDER BY sort_order ASC',
            ['id' => $listing['id']]
        );
        $listing['history'] = RentalListing::statusHistory((int) $listing['id']);
        Response::success($listing);
    }

    public function approve(Request $request): void
    {
        Validator::require($request->all(), ['status']);
        $status = Validator::enum((string) $request->input('status'), RentalListing::STATUSES, 'status');
        $listing = RentalListing::approve(
            (int) $request->params['id'],
            (int) $request->user['id'],
            $status,
            $request->input('comment') ?: null
        );

        AuditService::log((int) $request->user['id'], 'rental_listing.status', 'rental_listing', (int) $listing['id'], ['status' => $status]);

        $ownerId = (int) $listing['owner_id'];
        if ($status === 'Approved' || $status === 'Active') {
            NotificationService::createForUsers([$ownerId], [
                'title'          => 'Listing Approved',
                'message'        => "Your listing \"{$listing['title']}\" has been approved.",
                'type'           => 'Rental Approved',
                'category'       => 'Rental',
                'priority'       => 'Medium',
                'reference_type' => 'rental_listing',
                'reference_id'   => $listing['id'],
                'created_by'     => (int) $request->user['id'],
            ]);
        } elseif ($status === 'Rejected') {
            NotificationService::createForUsers([$ownerId], [
                'title'          => 'Listing Rejected',
                'message'        => "Your listing \"{$listing['title']}\" was not approved.",
                'type'           => 'Rental Rejected',
                'category'       => 'Rental',
                'priority'       => 'Medium',
                'reference_type' => 'rental_listing',
                'reference_id'   => $listing['id'],
                'created_by'     => (int) $request->user['id'],
            ]);
        }

        Response::success($listing, 'Listing status updated');
    }

    public function feature(Request $request): void
    {
        $listing = RentalListing::update((int) $request->params['id'], [
            'featured' => (int) (bool) $request->input('featured', true),
        ]);
        AuditService::log((int) $request->user['id'], 'rental_listing.feature', 'rental_listing', (int) $listing['id']);
        Response::success($listing, 'Listing featured status updated');
    }

    public function destroy(Request $request): void
    {
        $listing = RentalListing::find((int) $request->params['id']);
        if (!$listing) {
            throw new AppException('Listing not found', 404);
        }
        RentalListing::softDelete((int) $listing['id']);
        AuditService::log((int) $request->user['id'], 'rental_listing.delete', 'rental_listing', (int) $listing['id']);
        Response::success([], 'Listing deleted');
    }

    public function dashboard(Request $request): void
    {
        $stats = Database::fetch(
            "SELECT
               COUNT(*) AS total,
               COALESCE(SUM(CASE WHEN status='Pending' THEN 1 ELSE 0 END), 0) AS pending,
               COALESCE(SUM(CASE WHEN status='Active' THEN 1 ELSE 0 END), 0) AS active,
               COALESCE(SUM(CASE WHEN status='Approved' THEN 1 ELSE 0 END), 0) AS approved,
               COALESCE(SUM(CASE WHEN status='Rejected' THEN 1 ELSE 0 END), 0) AS rejected,
               COALESCE(SUM(featured), 0) AS featured,
               COALESCE(SUM(view_count), 0) AS total_views,
               COALESCE(SUM(favorite_count), 0) AS total_favorites
             FROM rental_listings WHERE deleted_at IS NULL"
        );

        $byType = Database::fetchAll(
            'SELECT listing_type, COUNT(*) AS count FROM rental_listings WHERE deleted_at IS NULL GROUP BY listing_type'
        );
        $byProperty = Database::fetchAll(
            'SELECT property_type, COUNT(*) AS count FROM rental_listings WHERE deleted_at IS NULL GROUP BY property_type'
        );
        $recentPending = Database::fetchAll(
            "SELECT * FROM rental_listings WHERE status = 'Pending' AND deleted_at IS NULL ORDER BY id DESC LIMIT 10"
        );
        $mostViewed = Database::fetchAll(
            "SELECT id, title, property_type, listing_type, price, view_count, favorite_count, status
             FROM rental_listings WHERE deleted_at IS NULL ORDER BY view_count DESC LIMIT 5"
        );

        Response::success([
            'stats'         => $stats,
            'byType'        => $byType,
            'byProperty'    => $byProperty,
            'recentPending' => $recentPending,
            'mostViewed'    => $mostViewed,
        ]);
    }
}
