<?php

declare(strict_types=1);

class Vehicle extends CrudModel
{
    protected static string $table = 'vehicles';
    protected static array $columns = ['vehicle_no', 'vehicle_no_normalized', 'vehicle_type', 'vehicle_model', 'owner_name', 'office_id', 'block', 'floor_number', 'company_name', 'parking_user_type', 'status', 'entry_time', 'exit_time'];
    protected static array $searchColumns = ['vehicle_no', 'vehicle_no_normalized', 'owner_name', 'company_name', 'vehicle_model'];

    public static function create(array $data): array
    {
        $data['vehicle_no_normalized'] = Validator::vehicleNo($data['vehicle_no'] ?? '');
        $active = Database::fetch(
            'SELECT id FROM vehicles WHERE vehicle_no_normalized = :vehicle_no AND status = :status AND deleted_at IS NULL LIMIT 1',
            ['vehicle_no' => $data['vehicle_no_normalized'], 'status' => 'Inside']
        );
        if ($active) {
            throw new AppException('Vehicle is already inside', 409);
        }
        return parent::create($data);
    }

    public static function checkout(int $id, ?int $userId = null): array
    {
        $vehicle = static::find($id);
        if (!$vehicle) {
            throw new AppException('Vehicle not found', 404);
        }
        if ($vehicle['status'] !== 'Inside') {
            throw new AppException('Vehicle is not currently inside', 409);
        }

        $exit = db_time();
        Database::query(
            'UPDATE vehicles SET status = :status, exit_time = :exit_time, updated_at = :now WHERE id = :id',
            ['status' => 'Exited', 'exit_time' => $exit, 'now' => $exit, 'id' => $id]
        );
        Database::query(
            'INSERT INTO vehicle_movements (vehicle_id, movement_type, occurred_at, actor_user_id, created_at)
             VALUES (:vehicle_id, :movement_type, :occurred_at, :actor_user_id, :created_at)',
            ['vehicle_id' => $id, 'movement_type' => 'checkout', 'occurred_at' => $exit, 'actor_user_id' => $userId, 'created_at' => $exit]
        );
        if (!empty($vehicle['office_id'])) {
            Office::updateUsedVehicleCount((int) $vehicle['office_id']);
        }
        return static::find($id);
    }
}
