<?php

declare(strict_types=1);

class ListingFavorite
{
    public static function toggle(int $listingId, int $userId): bool
    {
        $existing = Database::fetch(
            'SELECT id FROM listing_favorites WHERE listing_id = :lid AND user_id = :uid LIMIT 1',
            ['lid' => $listingId, 'uid' => $userId]
        );

        if ($existing) {
            Database::query(
                'DELETE FROM listing_favorites WHERE listing_id = :lid AND user_id = :uid',
                ['lid' => $listingId, 'uid' => $userId]
            );
            Database::query(
                'UPDATE rental_listings SET favorite_count = CASE WHEN favorite_count > 0 THEN favorite_count - 1 ELSE 0 END, updated_at = :now WHERE id = :id',
                ['now' => db_time(), 'id' => $listingId]
            );
            return false;
        }

        Database::query(
            sql_insert_ignore() . ' INTO listing_favorites (listing_id, user_id, created_at) VALUES (:lid, :uid, :now)',
            ['lid' => $listingId, 'uid' => $userId, 'now' => db_time()]
        );
        Database::query(
            'UPDATE rental_listings SET favorite_count = favorite_count + 1, updated_at = :now WHERE id = :id',
            ['now' => db_time(), 'id' => $listingId]
        );
        return true;
    }

    public static function isFavorite(int $listingId, int $userId): bool
    {
        return (bool) Database::fetch(
            'SELECT id FROM listing_favorites WHERE listing_id = :lid AND user_id = :uid LIMIT 1',
            ['lid' => $listingId, 'uid' => $userId]
        );
    }

    public static function userFavoriteIds(int $userId): array
    {
        $rows = Database::fetchAll(
            'SELECT listing_id FROM listing_favorites WHERE user_id = :uid',
            ['uid' => $userId]
        );
        return array_column($rows, 'listing_id');
    }
}
