<?php

declare(strict_types=1);

class Vehicle extends CrudModel
{
    protected static string $table = 'vehicles';
    protected static array $columns = ['vehicle_no', 'vehicle_no_normalized', 'vehicle_type', 'vehicle_model', 'owner_name', 'office_id', 'block', 'floor_number', 'company_name', 'parking_user_type', 'status', 'entry_time', 'exit_time'];
    protected static array $searchColumns = ['vehicle_no', 'vehicle_no_normalized', 'owner_name', 'company_name', 'vehicle_model'];
    protected static array $hidden = ['public_checkout_token_hash', 'public_checkout_token_expires_at', 'public_checkout_used_at'];

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

    public static function issuePublicCheckoutToken(int $id): array
    {
        $token = self::newPublicCheckoutToken();
        $expiresAt = db_time(time() + 86400);
        Database::query(
            'UPDATE vehicles
             SET public_checkout_token_hash = :hash,
                 public_checkout_token_expires_at = :expires_at,
                 public_checkout_used_at = NULL,
                 updated_at = :now
             WHERE id = :id',
            [
                'hash' => hash('sha256', $token),
                'expires_at' => $expiresAt,
                'now' => db_time(),
                'id' => $id,
            ]
        );

        $row = static::find($id);
        if (!$row) {
            throw new AppException('Vehicle not found', 404);
        }
        $row['checkout_token'] = $token;
        $row['checkout_token_expires_at'] = $expiresAt;
        return $row;
    }

    public static function publicCheckout(int $id, string $token): array
    {
        if ($token === '') {
            throw new AppException('Checkout token required', 422);
        }

        return Database::transaction(function () use ($id, $token): array {
            $now = db_time();
            $updated = Database::query(
                'UPDATE vehicles
                 SET public_checkout_used_at = :used_at,
                     updated_at = :updated_at
                 WHERE id = :id
                   AND status = :status
                   AND public_checkout_token_hash = :hash
                   AND public_checkout_used_at IS NULL
                   AND public_checkout_token_expires_at > :expires_after',
                [
                    'used_at' => $now,
                    'updated_at' => $now,
                    'expires_after' => $now,
                    'id' => $id,
                    'status' => 'Inside',
                    'hash' => hash('sha256', $token),
                ]
            )->rowCount();

            if ($updated !== 1) {
                throw new AppException('Invalid or expired checkout token', 401);
            }

            return static::checkout($id);
        });
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

    private static function newPublicCheckoutToken(): string
    {
        return rtrim(strtr(base64_encode(random_bytes(32)), '+/', '-_'), '=');
    }
}
