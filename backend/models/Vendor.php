<?php

declare(strict_types=1);

class Vendor extends CrudModel
{
    protected static string $table = 'vendors';
    protected static array $columns = [
        'name', 'company', 'service_type', 'category', 'contact', 'last_visit', 'next_visit', 'status',
        // Marketplace extensions
        'description', 'service_area', 'availability', 'is_verified', 'is_featured', 'category_id',
        // Multi-tenant scoping
        'org_id',
    ];
    protected static array $searchColumns = ['name', 'company', 'service_type', 'contact', 'service_area', 'description'];

    protected static function filters(Request $request): array
    {
        [$where, $params] = parent::filters($request);
        $conditions = $where !== '' ? [substr($where, 6)] : [];

        if (($request->query['category_id'] ?? '') !== '') {
            $conditions[] = 'category_id = :category_id';
            $params['category_id'] = (int) $request->query['category_id'];
        }
        if (($request->query['service_type'] ?? '') !== '') {
            $conditions[] = 'service_type = :service_type';
            $params['service_type'] = $request->query['service_type'];
        }
        if (($request->query['service_area'] ?? '') !== '') {
            $conditions[] = 'service_area LIKE :service_area';
            $params['service_area'] = '%' . $request->query['service_area'] . '%';
        }
        if (($request->query['featured'] ?? '') !== '') {
            $conditions[] = 'is_featured = :featured';
            $params['featured'] = (int) (bool) $request->query['featured'];
        }
        if (($request->query['verified'] ?? '') !== '') {
            $conditions[] = 'is_verified = :verified';
            $params['verified'] = (int) (bool) $request->query['verified'];
        }
        if (($request->query['min_rating'] ?? '') !== '') {
            $conditions[] = 'rating_avg >= :min_rating';
            $params['min_rating'] = (float) $request->query['min_rating'];
        }

        // Organization scoping (super_admin: all orgs or ?orgId=; others: own org).
        $orgId = OrgScope::orgIdFor($request);
        if ($orgId !== null) {
            $conditions[] = 'org_id = :org_scope';
            $params['org_scope'] = $orgId;
        }

        return [$conditions ? 'WHERE ' . implode(' AND ', $conditions) : '', $params];
    }

    protected static function orderBy(): string
    {
        // Featured first, then highest rated.
        return 'ORDER BY is_featured DESC, rating_avg DESC, id DESC';
    }

    /**
     * Recompute and persist the cached rating average / review count from approved reviews.
     */
    public static function refreshRating(int $vendorId): void
    {
        $row = Database::fetch(
            "SELECT COUNT(*) AS c, COALESCE(AVG(rating), 0) AS avg
             FROM vendor_reviews
             WHERE vendor_id = :id AND status = 'Approved' AND deleted_at IS NULL",
            ['id' => $vendorId]
        );
        Database::query(
            'UPDATE vendors SET rating_avg = :avg, review_count = :count, updated_at = :now WHERE id = :id',
            ['avg' => round((float) $row['avg'], 2), 'count' => (int) $row['c'], 'now' => db_time(), 'id' => $vendorId]
        );
    }

    /**
     * Recompute and persist the cached booking count from non-cancelled bookings.
     */
    public static function refreshBookingCount(int $vendorId): void
    {
        $count = (int) Database::fetch(
            "SELECT COUNT(*) AS c FROM vendor_bookings
             WHERE vendor_id = :id AND status <> 'Cancelled' AND deleted_at IS NULL",
            ['id' => $vendorId]
        )['c'];
        Database::query(
            'UPDATE vendors SET booking_count = :count, updated_at = :now WHERE id = :id',
            ['count' => $count, 'now' => db_time(), 'id' => $vendorId]
        );
    }
}
