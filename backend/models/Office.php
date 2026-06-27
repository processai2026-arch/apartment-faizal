<?php

declare(strict_types=1);

class Office extends CrudModel
{
    protected static string $table = 'offices';
    protected static array $columns = ['block', 'floor_number', 'company_name', 'contact_person', 'contact_phone', 'contact_email', 'allocated_vehicle_count', 'status'];
    protected static array $searchColumns = ['block', 'floor_number', 'company_name', 'contact_person', 'contact_phone'];

    public static function updateUsedVehicleCount(int $officeId): void
    {
        Database::query(
            'UPDATE offices SET used_vehicle_count = (
                SELECT COUNT(*) FROM vehicles WHERE office_id = :vehicle_office_id AND status = :inside AND deleted_at IS NULL
            ), updated_at = :now WHERE id = :office_id',
            ['vehicle_office_id' => $officeId, 'office_id' => $officeId, 'inside' => 'Inside', 'now' => db_time()]
        );
    }
}
