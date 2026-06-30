<?php

declare(strict_types=1);

class RentalListing extends CrudModel
{
    protected static string $table = 'rental_listings';
    protected static array $columns = [
        'office_id', 'owner_id', 'title', 'description', 'listing_type', 'property_type',
        'price', 'deposit', 'area_sqft', 'bedrooms', 'bathrooms', 'furnishing',
        'available_from', 'status', 'featured', 'contact_name', 'contact_phone', 'admin_notes',
    ];
    protected static array $searchColumns = ['title', 'description', 'contact_name', 'contact_phone'];

    public const LISTING_TYPES   = ['Rent', 'Sale'];
    public const PROPERTY_TYPES  = ['Office', 'Apartment', 'Shop', 'Parking'];
    public const STATUSES        = ['Pending', 'Approved', 'Rejected', 'Active', 'Closed'];
    public const FURNISHING_OPTS = ['Unfurnished', 'Semi-furnished', 'Fully Furnished'];

    protected static function filters(Request $request): array
    {
        [$where, $params] = parent::filters($request);
        $conditions = $where !== '' ? [substr($where, 6)] : [];

        if (($request->query['listing_type'] ?? '') !== '') {
            $conditions[] = 'listing_type = :listing_type';
            $params['listing_type'] = $request->query['listing_type'];
        }
        if (($request->query['property_type'] ?? '') !== '') {
            $conditions[] = 'property_type = :property_type';
            $params['property_type'] = $request->query['property_type'];
        }
        if (($request->query['owner_id'] ?? '') !== '') {
            $conditions[] = 'owner_id = :owner_id';
            $params['owner_id'] = (int) $request->query['owner_id'];
        }
        if (($request->query['featured'] ?? '') !== '') {
            $conditions[] = 'featured = :featured';
            $params['featured'] = (int) (bool) $request->query['featured'];
        }
        if (($request->query['min_price'] ?? '') !== '') {
            $conditions[] = 'price >= :min_price';
            $params['min_price'] = (float) $request->query['min_price'];
        }
        if (($request->query['max_price'] ?? '') !== '') {
            $conditions[] = 'price <= :max_price';
            $params['max_price'] = (float) $request->query['max_price'];
        }
        if (($request->query['min_area'] ?? '') !== '') {
            $conditions[] = 'area_sqft >= :min_area';
            $params['min_area'] = (float) $request->query['min_area'];
        }

        return [$conditions ? 'WHERE ' . implode(' AND ', $conditions) : '', $params];
    }

    protected static function orderBy(): string
    {
        return 'ORDER BY featured DESC, id DESC';
    }

    public static function approve(int $id, int $adminId, string $status, ?string $comment = null): array
    {
        $listing = static::find($id);
        if (!$listing) {
            throw new AppException('Listing not found', 404);
        }

        $from = $listing['status'];
        $updated = static::update($id, ['status' => $status]);

        Database::query(
            'INSERT INTO listing_status_history (listing_id, changed_by, from_status, to_status, comment, created_at)
             VALUES (:listing_id, :changed_by, :from_status, :to_status, :comment, :created_at)',
            [
                'listing_id' => $id,
                'changed_by' => $adminId,
                'from_status' => $from,
                'to_status' => $status,
                'comment' => $comment,
                'created_at' => db_time(),
            ]
        );

        return $updated;
    }

    public static function incrementView(int $id, ?int $userId, ?string $ip): void
    {
        Database::query(
            'INSERT INTO listing_views (listing_id, user_id, ip_address, created_at) VALUES (:lid, :uid, :ip, :now)',
            ['lid' => $id, 'uid' => $userId, 'ip' => $ip, 'now' => db_time()]
        );
        Database::query(
            'UPDATE rental_listings SET view_count = view_count + 1, updated_at = :now WHERE id = :id',
            ['now' => db_time(), 'id' => $id]
        );
    }

    public static function statusHistory(int $id): array
    {
        return Database::fetchAll(
            'SELECT h.*, u.name AS changed_by_name FROM listing_status_history h
             LEFT JOIN users u ON h.changed_by = u.id
             WHERE h.listing_id = :id ORDER BY h.id ASC',
            ['id' => $id]
        );
    }
}
