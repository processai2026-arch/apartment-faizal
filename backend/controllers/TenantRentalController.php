<?php

declare(strict_types=1);

class TenantRentalController
{
    /** Public marketplace — only Active/Approved listings. */
    public function index(Request $request): void
    {
        if (!isset($request->query['status'])) {
            $request->query['status'] = 'Active';
        }
        [$rows, $total, $page, $perPage] = RentalListing::list($request);
        Response::paginated($rows, $total, $page, $perPage);
    }

    public function show(Request $request): void
    {
        $listing = RentalListing::find((int) $request->params['id']);
        if (!$listing || !in_array($listing['status'], ['Active', 'Approved'], true)) {
            throw new AppException('Listing not found', 404);
        }

        $listing['images'] = Database::fetchAll(
            'SELECT * FROM listing_images WHERE listing_id = :id AND deleted_at IS NULL ORDER BY sort_order ASC, id ASC',
            ['id' => $listing['id']]
        );
        $listing['history'] = RentalListing::statusHistory((int) $listing['id']);
        $listing['is_favorite'] = ListingFavorite::isFavorite((int) $listing['id'], (int) $request->user['id']);

        RentalListing::incrementView((int) $listing['id'], (int) $request->user['id'], $_SERVER['REMOTE_ADDR'] ?? null);

        Response::success($listing);
    }

    public function myListings(Request $request): void
    {
        $request->query['owner_id'] = (string) $request->user['id'];
        [$rows, $total, $page, $perPage] = RentalListing::list($request);
        Response::paginated($rows, $total, $page, $perPage);
    }

    public function store(Request $request): void
    {
        Validator::require($request->all(), ['title', 'listing_type', 'property_type']);
        Validator::enum((string) $request->input('listing_type'), RentalListing::LISTING_TYPES, 'listing_type');
        Validator::enum((string) $request->input('property_type'), RentalListing::PROPERTY_TYPES, 'property_type');

        $listing = RentalListing::create([
            'owner_id'       => (int) $request->user['id'],
            'office_id'      => $request->user['officeId'] ?? null,
            'title'          => $request->input('title'),
            'description'    => $request->input('description') ?: null,
            'listing_type'   => $request->input('listing_type'),
            'property_type'  => $request->input('property_type'),
            'price'          => $request->input('price') !== null ? (float) $request->input('price') : null,
            'deposit'        => $request->input('deposit') !== null ? (float) $request->input('deposit') : null,
            'area_sqft'      => $request->input('area_sqft') !== null ? (float) $request->input('area_sqft') : null,
            'bedrooms'       => $request->input('bedrooms') !== null ? (int) $request->input('bedrooms') : null,
            'bathrooms'      => $request->input('bathrooms') !== null ? (int) $request->input('bathrooms') : null,
            'furnishing'     => $request->input('furnishing') ?: null,
            'available_from' => $request->input('available_from') ?: null,
            'contact_name'   => $request->input('contact_name') ?: null,
            'contact_phone'  => $request->input('contact_phone') ?: null,
            'status'         => 'Pending',
            'featured'       => 0,
        ]);

        AuditService::log((int) $request->user['id'], 'rental_listing.create', 'rental_listing', (int) $listing['id']);
        Response::success($listing, 'Listing submitted for approval', 201);
    }

    public function update(Request $request): void
    {
        $listing = RentalListing::find((int) $request->params['id']);
        if (!$listing || (int) $listing['owner_id'] !== (int) $request->user['id']) {
            throw new AppException('Listing not found', 404);
        }
        if (!in_array($listing['status'], ['Pending', 'Rejected'], true)) {
            throw new AppException('Only pending or rejected listings can be edited', 422);
        }

        $updated = RentalListing::update((int) $listing['id'], array_filter([
            'title'          => $request->input('title'),
            'description'    => $request->input('description'),
            'listing_type'   => $request->input('listing_type'),
            'property_type'  => $request->input('property_type'),
            'price'          => $request->input('price') !== null ? (float) $request->input('price') : null,
            'deposit'        => $request->input('deposit') !== null ? (float) $request->input('deposit') : null,
            'area_sqft'      => $request->input('area_sqft') !== null ? (float) $request->input('area_sqft') : null,
            'bedrooms'       => $request->input('bedrooms') !== null ? (int) $request->input('bedrooms') : null,
            'bathrooms'      => $request->input('bathrooms') !== null ? (int) $request->input('bathrooms') : null,
            'furnishing'     => $request->input('furnishing'),
            'available_from' => $request->input('available_from'),
            'contact_name'   => $request->input('contact_name'),
            'contact_phone'  => $request->input('contact_phone'),
            'status'         => 'Pending',
        ], fn ($v) => $v !== null));

        AuditService::log((int) $request->user['id'], 'rental_listing.update', 'rental_listing', (int) $updated['id']);
        Response::success($updated, 'Listing updated and resubmitted for approval');
    }

    public function destroy(Request $request): void
    {
        $listing = RentalListing::find((int) $request->params['id']);
        if (!$listing || (int) $listing['owner_id'] !== (int) $request->user['id']) {
            throw new AppException('Listing not found', 404);
        }
        RentalListing::softDelete((int) $listing['id']);
        AuditService::log((int) $request->user['id'], 'rental_listing.delete', 'rental_listing', (int) $listing['id']);
        Response::success([], 'Listing deleted');
    }

    public function toggleFavorite(Request $request): void
    {
        $id = (int) $request->params['id'];
        $listing = RentalListing::find($id);
        if (!$listing) {
            throw new AppException('Listing not found', 404);
        }
        $favorited = ListingFavorite::toggle($id, (int) $request->user['id']);
        Response::success(['favorited' => $favorited]);
    }

    public function myFavorites(Request $request): void
    {
        $ids = ListingFavorite::userFavoriteIds((int) $request->user['id']);
        if (empty($ids)) {
            Response::paginated([], 0, 1, 20);
            return;
        }
        $placeholders = implode(',', array_fill(0, count($ids), '?'));
        $rows = Database::fetchAll(
            "SELECT * FROM rental_listings WHERE id IN ({$placeholders}) AND deleted_at IS NULL",
            $ids
        );
        Response::paginated($rows, count($rows), 1, 100);
    }
}
