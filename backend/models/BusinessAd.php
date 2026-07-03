<?php

declare(strict_types=1);

class BusinessAd extends CrudModel
{
    protected static string $table = 'business_ads';
    protected static array $columns = [
        'category_id', 'business_name', 'description', 'offer', 'website', 'phone', 'whatsapp',
        'address', 'logo_attachment_id', 'banner_attachment_id', 'featured', 'priority',
        'status', 'expires_at', 'org_id',
    ];
    protected static array $searchColumns = ['business_name', 'description', 'offer', 'address'];

    public const STATUSES = ['Pending', 'Active', 'Rejected', 'Expired', 'Inactive'];

    protected static function filters(Request $request): array
    {
        [$where, $params] = parent::filters($request);
        $conditions = $where !== '' ? [substr($where, 6)] : [];

        if (($request->query['category_id'] ?? '') !== '') {
            $conditions[] = 'category_id = :category_id';
            $params['category_id'] = (int) $request->query['category_id'];
        }
        if (($request->query['featured'] ?? '') !== '') {
            $conditions[] = 'featured = :featured';
            $params['featured'] = (int) (bool) $request->query['featured'];
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
        return 'ORDER BY featured DESC, priority DESC, id DESC';
    }

    public static function recordClick(int $adId, ?int $userId, string $type, ?string $ip): void
    {
        Database::query(
            'INSERT INTO ad_clicks (ad_id, user_id, click_type, ip_address, created_at) VALUES (:aid, :uid, :type, :ip, :now)',
            ['aid' => $adId, 'uid' => $userId, 'type' => $type, 'ip' => $ip, 'now' => db_time()]
        );
        $col = $type === 'view' ? 'view_count' : 'click_count';
        Database::query(
            "UPDATE business_ads SET {$col} = {$col} + 1, updated_at = :now WHERE id = :id",
            ['now' => db_time(), 'id' => $adId]
        );
    }
}
