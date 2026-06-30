<?php

declare(strict_types=1);

class BusinessCategory extends CrudModel
{
    protected static string $table = 'business_categories';
    protected static array $columns = ['name', 'slug', 'icon'];
    protected static array $searchColumns = ['name', 'slug'];
}
