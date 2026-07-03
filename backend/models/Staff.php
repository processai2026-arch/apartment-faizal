<?php

declare(strict_types=1);

class Staff extends CrudModel
{
    protected static string $table = 'staff';
    protected static array $columns = ['name', 'role', 'department', 'contact', 'join_date', 'status', 'base_salary'];
    protected static array $searchColumns = ['name', 'role', 'department', 'contact'];
}
