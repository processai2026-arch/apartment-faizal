<?php

declare(strict_types=1);

class OtpService
{
    public function send(string $phone, string $purpose, ?int $userId = null): array
    {
        $code = (string) random_int(100000, 999999);
        $expiresAt = db_time(time() + config('app.otp_ttl'));
        Database::query(
            'INSERT INTO otp_challenges (phone, purpose, code_hash, attempts, expires_at, created_at)
             VALUES (:phone, :purpose, :code_hash, 0, :expires_at, :created_at)',
            [
                'phone' => $phone,
                'purpose' => $purpose,
                'code_hash' => password_hash($code, PASSWORD_DEFAULT),
                'expires_at' => $expiresAt,
                'created_at' => db_time(),
            ]
        );

        if (config('app.otp_driver') === 'log') {
            if (!is_dir(STORAGE_PATH . '/logs')) {
                mkdir(STORAGE_PATH . '/logs', 0775, true);
            }
            file_put_contents(STORAGE_PATH . '/logs/otp.log', db_time() . " {$purpose} {$phone} {$code}" . PHP_EOL, FILE_APPEND);
        }

        AuditService::log($userId, 'otp.send', 'otp', null, ['phone' => $phone, 'purpose' => $purpose]);

        return ['phone' => $phone, 'purpose' => $purpose, 'expiresAt' => $expiresAt];
    }

    public function verify(string $phone, string $purpose, string $code): void
    {
        $challenge = Database::fetch(
            'SELECT * FROM otp_challenges
             WHERE phone = :phone AND purpose = :purpose AND verified_at IS NULL AND expires_at > :now
             ORDER BY id DESC LIMIT 1',
            ['phone' => $phone, 'purpose' => $purpose, 'now' => db_time()]
        );

        if (!$challenge || (int) $challenge['attempts'] >= 5) {
            throw new AppException('OTP expired or unavailable', 422);
        }

        Database::query('UPDATE otp_challenges SET attempts = attempts + 1 WHERE id = :id', ['id' => $challenge['id']]);
        if (!password_verify($code, $challenge['code_hash'])) {
            throw new AppException('Invalid OTP', 422);
        }

        Database::query('UPDATE otp_challenges SET verified_at = :now WHERE id = :id', ['now' => db_time(), 'id' => $challenge['id']]);
    }
}
