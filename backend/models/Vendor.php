<?php

declare(strict_types=1);

class Vendor extends CrudModel
{
    protected static string $table = 'vendors';
    protected static array $columns = ['name', 'company', 'service_type', 'category', 'contact', 'last_visit', 'next_visit', 'status'];
    protected static array $searchColumns = ['name', 'company', 'service_type', 'contact'];
}
