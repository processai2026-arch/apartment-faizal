<?php

declare(strict_types=1);

class InventoryItem extends CrudModel
{
    protected static string $table = 'inventory_items';
    protected static array $columns = ['item_name', 'category', 'quantity', 'unit_cost', 'vendor', 'purchase_date', 'used_quantity', 'location', 'used_by'];
    protected static array $searchColumns = ['item_name', 'category', 'vendor', 'location'];
}
