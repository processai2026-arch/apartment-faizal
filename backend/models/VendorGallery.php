<?php

declare(strict_types=1);

class VendorGallery extends CrudModel
{
    protected static string $table = 'vendor_gallery';
    protected static array $columns = ['vendor_id', 'attachment_id', 'caption', 'sort_order'];

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

    protected static function orderBy(): string
    {
        return 'ORDER BY sort_order ASC, id ASC';
    }
}
