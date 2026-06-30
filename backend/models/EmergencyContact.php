<?php

declare(strict_types=1);

class EmergencyContact extends CrudModel
{
    protected static string $table = 'emergency_contacts';
    protected static array $columns = [
        'name', 'category', 'phone', 'alternate_phone', 'email', 'address',
        'priority', 'available_24h', 'is_pinned', 'status',
    ];
    protected static array $searchColumns = ['name', 'phone', 'address', 'category'];

    public const CATEGORIES = ['Police', 'Fire', 'Hospital', 'Ambulance', 'Electrician', 'Plumber', 'Apartment Office', 'Security', 'Other'];

    protected static function filters(Request $request): array
    {
        [$where, $params] = parent::filters($request);
        $conditions = $where !== '' ? [substr($where, 6)] : [];

        if (($request->query['category'] ?? '') !== '') {
            $conditions[] = 'category = :category';
            $params['category'] = $request->query['category'];
        }
        if (($request->query['pinned'] ?? '') !== '') {
            $conditions[] = 'is_pinned = :pinned';
            $params['pinned'] = (int) (bool) $request->query['pinned'];
        }
        if (($request->query['available_24h'] ?? '') !== '') {
            $conditions[] = 'available_24h = 1';
        }

        return [$conditions ? 'WHERE ' . implode(' AND ', $conditions) : '', $params];
    }

    protected static function orderBy(): string
    {
        return 'ORDER BY is_pinned DESC, priority DESC, id ASC';
    }
}
