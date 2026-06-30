<?php

declare(strict_types=1);

/**
 * Admin-facing Vendor Marketplace operations. Extends the vendor module without
 * touching the existing AdminVendorController CRUD.
 */
class AdminVendorMarketplaceController
{
    /** Full vendor profile: base record + services, gallery, approved-review summary. */
    public function detail(Request $request): void
    {
        $vendor = Vendor::find((int) $request->params['id']);
        if (!$vendor) {
            throw new AppException('Vendor not found', 404);
        }

        $vendor['services'] = Database::fetchAll(
            'SELECT * FROM vendor_services WHERE vendor_id = :id AND deleted_at IS NULL ORDER BY id ASC',
            ['id' => $vendor['id']]
        );
        $vendor['gallery'] = Database::fetchAll(
            'SELECT * FROM vendor_gallery WHERE vendor_id = :id AND deleted_at IS NULL ORDER BY sort_order ASC, id ASC',
            ['id' => $vendor['id']]
        );
        $vendor['reviewDistribution'] = VendorReview::distribution((int) $vendor['id']);

        Response::success($vendor);
    }

    public function verify(Request $request): void
    {
        $vendor = Vendor::update((int) $request->params['id'], ['is_verified' => (int) (bool) $request->input('verified', true)]);
        AuditService::log((int) $request->user['id'], 'vendor.verify', 'vendor', (int) $vendor['id'], ['verified' => $vendor['is_verified']]);
        Response::success($vendor, 'Vendor verification updated');
    }

    public function feature(Request $request): void
    {
        $vendor = Vendor::update((int) $request->params['id'], ['is_featured' => (int) (bool) $request->input('featured', true)]);
        AuditService::log((int) $request->user['id'], 'vendor.feature', 'vendor', (int) $vendor['id'], ['featured' => $vendor['is_featured']]);
        Response::success($vendor, 'Vendor featured status updated');
    }

    // ---- Reviews (moderation) ----

    public function reviews(Request $request): void
    {
        [$rows, $total, $page, $perPage] = VendorReview::list($request);
        Response::paginated($rows, $total, $page, $perPage);
    }

    public function moderateReview(Request $request): void
    {
        Validator::require($request->all(), ['status']);
        $status = Validator::enum((string) $request->input('status'), ['Pending', 'Approved', 'Hidden'], 'status');
        $review = VendorReview::setStatus((int) $request->params['id'], $status);
        AuditService::log((int) $request->user['id'], 'vendor_review.moderate', 'vendor_review', (int) $review['id'], ['status' => $status]);
        if ($status === 'Approved') {
            NotificationService::notifyReviewApproved($review, (int) $request->user['id']);
        }
        Response::success($review, 'Review updated');
    }

    // ---- Bookings ----

    public function bookings(Request $request): void
    {
        [$rows, $total, $page, $perPage] = VendorBooking::list($request);
        Response::paginated($rows, $total, $page, $perPage);
    }

    public function bookingStatus(Request $request): void
    {
        Validator::require($request->all(), ['status']);
        $status = Validator::enum((string) $request->input('status'), VendorBooking::STATUSES, 'status');
        $booking = VendorBooking::transition((int) $request->params['id'], $status);
        AuditService::log((int) $request->user['id'], 'vendor_booking.status_change', 'vendor_booking', (int) $booking['id'], ['status' => $status]);
        NotificationService::notifyBookingStatusChanged($booking, $status, (int) $request->user['id']);
        Response::success($booking, 'Booking updated');
    }

    // ---- Categories ----

    public function categories(Request $request): void
    {
        [$rows, $total, $page, $perPage] = VendorCategory::list($request);
        Response::paginated($rows, $total, $page, $perPage);
    }

    public function createCategory(Request $request): void
    {
        Validator::require($request->all(), ['name', 'slug']);
        $row = VendorCategory::create([
            'name' => $request->input('name'),
            'slug' => $request->input('slug'),
            'description' => $request->input('description') ?: null,
            'icon' => $request->input('icon') ?: null,
        ]);
        AuditService::log((int) $request->user['id'], 'vendor_category.create', 'vendor_category', (int) $row['id']);
        Response::success($row, 'Category created', 201);
    }

    public function updateCategory(Request $request): void
    {
        $row = VendorCategory::update((int) $request->params['id'], $request->all());
        AuditService::log((int) $request->user['id'], 'vendor_category.update', 'vendor_category', (int) $row['id']);
        Response::success($row, 'Category updated');
    }

    public function deleteCategory(Request $request): void
    {
        $row = VendorCategory::softDelete((int) $request->params['id']);
        AuditService::log((int) $request->user['id'], 'vendor_category.delete', 'vendor_category', (int) $row['id']);
        Response::success(['id' => $row['id']], 'Category deleted');
    }

    // ---- Services ----

    public function createService(Request $request): void
    {
        Validator::require($request->all(), ['vendor_id', 'name']);
        $row = VendorService::create([
            'vendor_id' => (int) $request->input('vendor_id'),
            'name' => $request->input('name'),
            'description' => $request->input('description') ?: null,
            'price' => $request->input('price') !== null ? (float) $request->input('price') : null,
            'unit' => $request->input('unit') ?: null,
            'is_active' => (int) (bool) $request->input('is_active', true),
        ]);
        AuditService::log((int) $request->user['id'], 'vendor_service.create', 'vendor_service', (int) $row['id']);
        Response::success($row, 'Service created', 201);
    }

    public function updateService(Request $request): void
    {
        $row = VendorService::update((int) $request->params['id'], $request->all());
        AuditService::log((int) $request->user['id'], 'vendor_service.update', 'vendor_service', (int) $row['id']);
        Response::success($row, 'Service updated');
    }

    public function deleteService(Request $request): void
    {
        $row = VendorService::softDelete((int) $request->params['id']);
        AuditService::log((int) $request->user['id'], 'vendor_service.delete', 'vendor_service', (int) $row['id']);
        Response::success(['id' => $row['id']], 'Service deleted');
    }

    // ---- Gallery ----

    public function addGallery(Request $request): void
    {
        Validator::require($request->all(), ['vendor_id', 'attachment_id']);
        $row = VendorGallery::create([
            'vendor_id' => (int) $request->input('vendor_id'),
            'attachment_id' => (int) $request->input('attachment_id'),
            'caption' => $request->input('caption') ?: null,
            'sort_order' => (int) $request->input('sort_order', 0),
        ]);
        AuditService::log((int) $request->user['id'], 'vendor_gallery.create', 'vendor_gallery', (int) $row['id']);
        Response::success($row, 'Gallery image added', 201);
    }

    public function deleteGallery(Request $request): void
    {
        $row = VendorGallery::softDelete((int) $request->params['id']);
        AuditService::log((int) $request->user['id'], 'vendor_gallery.delete', 'vendor_gallery', (int) $row['id']);
        Response::success(['id' => $row['id']], 'Gallery image removed');
    }

    // ---- Statistics & Dashboard ----

    public function statistics(Request $request): void
    {
        Response::success($this->buildStatistics());
    }

    public function dashboard(Request $request): void
    {
        $stats = $this->buildStatistics();

        $topRated = Database::fetchAll(
            "SELECT id, name, company, rating_avg, review_count FROM vendors
             WHERE deleted_at IS NULL AND review_count > 0
             ORDER BY rating_avg DESC, review_count DESC LIMIT 5"
        );
        $mostBooked = Database::fetchAll(
            "SELECT id, name, company, booking_count FROM vendors
             WHERE deleted_at IS NULL
             ORDER BY booking_count DESC LIMIT 5"
        );
        $recentReviews = Database::fetchAll(
            "SELECT * FROM vendor_reviews WHERE deleted_at IS NULL ORDER BY id DESC LIMIT 10"
        );

        Response::success([
            'stats' => $stats,
            'topRated' => $topRated,
            'mostBooked' => $mostBooked,
            'recentReviews' => $recentReviews,
        ]);
    }

    private function buildStatistics(): array
    {
        $vendorTotals = Database::fetch(
            "SELECT COUNT(*) AS total,
                    COALESCE(SUM(is_verified), 0) AS verified,
                    COALESCE(SUM(is_featured), 0) AS featured,
                    COALESCE(AVG(rating_avg), 0) AS avg_rating
             FROM vendors WHERE deleted_at IS NULL"
        );
        $bookingByStatus = Database::fetchAll(
            'SELECT status, COUNT(*) AS count FROM vendor_bookings WHERE deleted_at IS NULL GROUP BY status'
        );
        $reviewByStatus = Database::fetchAll(
            'SELECT status, COUNT(*) AS count FROM vendor_reviews WHERE deleted_at IS NULL GROUP BY status'
        );

        return [
            'vendors' => [
                'total' => (int) $vendorTotals['total'],
                'verified' => (int) $vendorTotals['verified'],
                'featured' => (int) $vendorTotals['featured'],
                'avgRating' => round((float) $vendorTotals['avg_rating'], 2),
            ],
            'bookingsByStatus' => $bookingByStatus,
            'reviewsByStatus' => $reviewByStatus,
        ];
    }
}
