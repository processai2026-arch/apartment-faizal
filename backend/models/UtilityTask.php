<?php

declare(strict_types=1);

class UtilityTask extends CrudModel
{
    protected static string $table = 'utility_tasks';
    protected static array $columns = ['description', 'type', 'scheduled_date', 'last_completed', 'status', 'assigned_staff', 'notes'];
    protected static array $searchColumns = ['description', 'type', 'assigned_staff'];
}
