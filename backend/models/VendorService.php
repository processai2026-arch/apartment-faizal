<?php

declare(strict_types=1);

class VendorService extends CrudModel
{
    protected static string $table = 'vendor_services';
    protected static array $columns = ['vendor_id', 'name', 'description', 'price', 'unit', 'is_active'];
    protected static array $searchColumns = ['name', 'description'];

    protected static function filters(Request $request): array
    {
        [$where, $params] = parent::filters($request);
        $conditions = $where !== '' ? [substr($where, 6)] : [];

        if (($request->query['vendor_id'] ?? '') !== '') {
            $conditions[] = 'vendor_id = :vendor_id';
            $params['vendor_id'] = (int) $request->query['vendor_id'];
        }

        return [$conditions ? 'WHERE ' . implode(' AND ', $conditions) : '', $params];
    }
}
