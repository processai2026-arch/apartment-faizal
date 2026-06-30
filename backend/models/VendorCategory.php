<?php

declare(strict_types=1);

class VendorCategory extends CrudModel
{
    protected static string $table = 'vendor_categories';
    protected static array $columns = ['name', 'slug', 'description', 'icon'];
    protected static array $searchColumns = ['name', 'slug', 'description'];

    protected static function orderBy(): string
    {
        return 'ORDER BY name ASC';
    }
}
