<?php

declare(strict_types=1);

class VendorReview extends CrudModel
{
    protected static string $table = 'vendor_reviews';
    protected static array $columns = ['vendor_id', 'user_id', 'booking_id', 'rating', 'title', 'comment', 'attachment_id', 'status'];
    protected static array $searchColumns = ['title', 'comment'];

    protected static function filters(Request $request): array
    {
        [$where, $params] = parent::filters($request);
        $conditions = $where !== '' ? [substr($where, 6)] : [];

        if (($request->query['vendor_id'] ?? '') !== '') {
            $conditions[] = 'vendor_id = :vendor_id';
            $params['vendor_id'] = (int) $request->query['vendor_id'];
        }
        if (($request->query['user_id'] ?? '') !== '') {
            $conditions[] = 'user_id = :user_id';
            $params['user_id'] = (int) $request->query['user_id'];
        }
        if (($request->query['rating'] ?? '') !== '') {
            $conditions[] = 'rating = :rating';
            $params['rating'] = (int) $request->query['rating'];
        }

        return [$conditions ? 'WHERE ' . implode(' AND ', $conditions) : '', $params];
    }

    /**
     * Set a review's moderation status and refresh the vendor's cached rating.
     */
    public static function setStatus(int $id, string $status): array
    {
        $review = static::find($id);
        if (!$review) {
            throw new AppException('Review not found', 404);
        }
        $row = static::update($id, ['status' => $status]);
        Vendor::refreshRating((int) $review['vendor_id']);
        return $row;
    }

    /**
     * Approved-review distribution (1..5 star counts) for a vendor.
     */
    public static function distribution(int $vendorId): array
    {
        $rows = Database::fetchAll(
            "SELECT rating, COUNT(*) AS count FROM vendor_reviews
             WHERE vendor_id = :id AND status = 'Approved' AND deleted_at IS NULL
             GROUP BY rating",
            ['id' => $vendorId]
        );
        $dist = [1 => 0, 2 => 0, 3 => 0, 4 => 0, 5 => 0];
        foreach ($rows as $row) {
            $dist[(int) $row['rating']] = (int) $row['count'];
        }
        return $dist;
    }
}
