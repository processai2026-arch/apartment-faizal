<?php

declare(strict_types=1);

class Visitor extends CrudModel
{
    protected static string $table = 'visitors';
    protected static array $columns = ['name', 'phone', 'gender', 'address', 'city', 'pincode', 'office_id', 'block', 'floor_number', 'company_name', 'whom_to_meet', 'reason', 'vehicle_type', 'vehicle_no', 'status', 'entry_time', 'exit_time', 'guard_name', 'remarks'];
    protected static array $searchColumns = ['name', 'phone', 'company_name', 'whom_to_meet', 'vehicle_no'];
    protected static array $hidden = ['public_checkout_token_hash', 'public_checkout_token_expires_at', 'public_checkout_used_at'];

    public static function issuePublicCheckoutToken(int $id): array
    {
        $token = self::newPublicCheckoutToken();
        $expiresAt = db_time(time() + 86400);
        Database::query(
            'UPDATE visitors
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
            throw new AppException('Visitor not found', 404);
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
                'UPDATE visitors
                 SET public_checkout_used_at = :now,
                     updated_at = :now
                 WHERE id = :id
                   AND status = :status
                   AND public_checkout_token_hash = :hash
                   AND public_checkout_used_at IS NULL
                   AND public_checkout_token_expires_at > :now',
                [
                    'now' => $now,
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

    private static function newPublicCheckoutToken(): string
    {
        return rtrim(strtr(base64_encode(random_bytes(32)), '+/', '-_'), '=');
    }
}
