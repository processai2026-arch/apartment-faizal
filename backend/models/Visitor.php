<?php

declare(strict_types=1);

class Visitor extends CrudModel
{
    protected static string $table = 'visitors';
    protected static array $columns = ['name', 'phone', 'gender', 'address', 'city', 'pincode', 'office_id', 'block', 'floor_number', 'company_name', 'whom_to_meet', 'reason', 'vehicle_type', 'vehicle_no', 'status', 'entry_time', 'exit_time', 'guard_name', 'remarks'];
    protected static array $searchColumns = ['name', 'phone', 'company_name', 'whom_to_meet', 'vehicle_no'];

    public static function checkout(int $id, ?int $userId = null): array
    {
        $visitor = static::find($id);
        if (!$visitor) {
            throw new AppException('Visitor not found', 404);
        }
        if ($visitor['status'] !== 'Inside') {
            throw new AppException('Visitor is not currently inside', 409);
        }

        $exit = db_time();
        Database::query(
            'UPDATE visitors SET status = :status, exit_time = :exit_time, updated_at = :now WHERE id = :id',
            ['status' => 'Exited', 'exit_time' => $exit, 'now' => $exit, 'id' => $id]
        );
        Database::query(
            'INSERT INTO visitor_movements (visitor_id, movement_type, occurred_at, actor_user_id, created_at)
             VALUES (:visitor_id, :movement_type, :occurred_at, :actor_user_id, :created_at)',
            ['visitor_id' => $id, 'movement_type' => 'checkout', 'occurred_at' => $exit, 'actor_user_id' => $userId, 'created_at' => $exit]
        );
        return static::find($id);
    }
}
