<?php

declare(strict_types=1);

/**
 * Tenant-facing Vendor Marketplace: browse/search vendors, view details, book a
 * vendor, list own bookings, and submit reviews.
 */
class TenantVendorController
{
    /** Marketplace listing — only verified/active vendors are browsable by tenants. */
    public function index(Request $request): void
    {
        $request->query['status'] = $request->query['status'] ?? 'Active';
        $request->query['verified'] = '1';
        [$rows, $total, $page, $perPage] = Vendor::list($request);
        Response::paginated($rows, $total, $page, $perPage);
    }

    public function show(Request $request): void
    {
        $vendor = Vendor::find((int) $request->params['id']);
        if (!$vendor || (int) $vendor['is_verified'] !== 1) {
            throw new AppException('Vendor not found', 404);
        }

        $vendor['services'] = Database::fetchAll(
            'SELECT * FROM vendor_services WHERE vendor_id = :id AND is_active = 1 AND deleted_at IS NULL ORDER BY id ASC',
            ['id' => $vendor['id']]
        );
        $vendor['gallery'] = Database::fetchAll(
            'SELECT * FROM vendor_gallery WHERE vendor_id = :id AND deleted_at IS NULL ORDER BY sort_order ASC, id ASC',
            ['id' => $vendor['id']]
        );
        $vendor['reviews'] = Database::fetchAll(
            "SELECT * FROM vendor_reviews WHERE vendor_id = :id AND status = 'Approved' AND deleted_at IS NULL ORDER BY id DESC LIMIT 50",
            ['id' => $vendor['id']]
        );
        $vendor['reviewDistribution'] = VendorReview::distribution((int) $vendor['id']);

        Response::success($vendor);
    }

    public function categories(Request $request): void
    {
        [$rows, $total, $page, $perPage] = VendorCategory::list($request);
        Response::paginated($rows, $total, $page, $perPage);
    }

    // ---- Vendor Recommendation ----

    /**
     * Tenant recommends a new vendor.
     * Saved with status='Pending' so an admin can review before it goes live.
     */
    public function store(Request $request): void
    {
        Validator::require($request->all(), ['name', 'service_type', 'contact']);

        $vendor = Vendor::create([
            'name'             => $request->input('name'),
            'service_type'     => $request->input('service_type'),
            'contact'          => $request->input('contact'),
            'description'      => $request->input('description') ?: null,
            'company'          => $request->input('company') ?: null,
            'status'           => 'Pending',
            'is_verified'      => 0,
            'is_featured'      => 0,
            'recommended_by'   => (int) $request->user['id'],
        ]);

        AuditService::log(
            (int) $request->user['id'],
            'vendor.recommend',
            'vendor',
            (int) $vendor['id'],
            ['name' => $vendor['name']]
        );

        Response::success($vendor, 'Vendor recommendation submitted for review', 201);
    }

    // ---- Bookings ----

    public function bookings(Request $request): void
    {
        $request->query['user_id'] = (string) $request->user['id'];
        [$rows, $total, $page, $perPage] = VendorBooking::list($request);
        Response::paginated($rows, $total, $page, $perPage);
    }

    public function book(Request $request): void
    {
        Validator::require($request->all(), ['vendor_id', 'title']);
        $vendor = Vendor::find((int) $request->input('vendor_id'));
        if (!$vendor || (int) $vendor['is_verified'] !== 1) {
            throw new AppException('Vendor not available for booking', 404);
        }

        $booking = VendorBooking::create([
            'vendor_id' => (int) $request->input('vendor_id'),
            'user_id' => (int) $request->user['id'],
            'office_id' => $request->user['officeId'] ?? null,
            'service_id' => $request->input('service_id') ?: null,
            'title' => $request->input('title'),
            'description' => $request->input('description') ?: null,
            'scheduled_for' => $request->input('scheduled_for') ?: null,
            'status' => 'Requested',
        ]);
        Vendor::refreshBookingCount((int) $vendor['id']);

        AuditService::log((int) $request->user['id'], 'vendor_booking.create', 'vendor_booking', (int) $booking['id']);
        NotificationService::notifyBookingCreated($booking, (int) $request->user['id']);
        Response::success($booking, 'Booking requested', 201);
    }

    public function cancelBooking(Request $request): void
    {
        $booking = VendorBooking::find((int) $request->params['id']);
        if (!$booking || (int) $booking['user_id'] !== (int) $request->user['id']) {
            throw new AppException('Booking not found', 404);
        }
        if (in_array($booking['status'], ['Completed', 'Cancelled'], true)) {
            throw new AppException('Booking cannot be cancelled in its current state', 422);
        }

        $booking = VendorBooking::transition((int) $booking['id'], 'Cancelled');
        AuditService::log((int) $request->user['id'], 'vendor_booking.cancel', 'vendor_booking', (int) $booking['id']);
        NotificationService::notifyBookingStatusChanged($booking, 'Cancelled', (int) $request->user['id']);
        Response::success($booking, 'Booking cancelled');
    }

    // ---- Reviews ----

    public function review(Request $request): void
    {
        Validator::require($request->all(), ['vendor_id', 'rating']);
        $rating = (int) $request->input('rating');
        if ($rating < 1 || $rating > 5) {
            throw new AppException('Rating must be between 1 and 5', 422);
        }
        $vendor = Vendor::find((int) $request->input('vendor_id'));
        if (!$vendor) {
            throw new AppException('Vendor not found', 404);
        }

        // If a booking is referenced, it must belong to this tenant.
        $bookingId = $request->input('booking_id') ?: null;
        if ($bookingId !== null) {
            $booking = VendorBooking::find((int) $bookingId);
            if (!$booking || (int) $booking['user_id'] !== (int) $request->user['id']) {
                throw new AppException('Booking not found', 404);
            }
        }

        $review = VendorReview::create([
            'vendor_id' => (int) $request->input('vendor_id'),
            'user_id' => (int) $request->user['id'],
            'booking_id' => $bookingId ? (int) $bookingId : null,
            'rating' => $rating,
            'title' => $request->input('title') ?: null,
            'comment' => $request->input('comment') ?: null,
            'attachment_id' => $request->input('attachment_id') ?: null,
            'status' => 'Pending',
        ]);

        AuditService::log((int) $request->user['id'], 'vendor_review.create', 'vendor_review', (int) $review['id'], ['rating' => $rating]);
        NotificationService::notifyReviewSubmitted($review, (int) $request->user['id']);
        Response::success($review, 'Review submitted for moderation', 201);
    }
}
