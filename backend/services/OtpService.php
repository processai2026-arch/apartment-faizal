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

        $driver = (string) config('app.otp_driver');
        if ($driver === 'log') {
            if (config('app.env') === 'production') {
                throw new AppException('OTP log driver is not allowed in production', 500);
            }
            if (!is_dir(STORAGE_PATH . '/logs')) {
                mkdir(STORAGE_PATH . '/logs', 0775, true);
            }
            file_put_contents(STORAGE_PATH . '/logs/otp.log', db_time() . " {$purpose} {$phone} {$code}" . PHP_EOL, FILE_APPEND);
        } elseif ($driver === 'webhook') {
            $this->sendWebhook($phone, $purpose, $code, $expiresAt);
        } else {
            throw new AppException('OTP delivery driver is not configured', 500);
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

        $updated = Database::query(
            'UPDATE otp_challenges
             SET attempts = attempts + 1
             WHERE id = :id AND verified_at IS NULL AND attempts < 5',
            ['id' => $challenge['id']]
        )->rowCount();
        if ($updated !== 1) {
            throw new AppException('OTP expired or unavailable', 422);
        }
        if (!password_verify($code, $challenge['code_hash'])) {
            throw new AppException('Invalid OTP', 422);
        }

        Database::query('UPDATE otp_challenges SET verified_at = :now WHERE id = :id', ['now' => db_time(), 'id' => $challenge['id']]);
    }

    private function sendWebhook(string $phone, string $purpose, string $code, string $expiresAt): void
    {
        $url = (string) config('app.otp_webhook_url');
        if (!filter_var($url, FILTER_VALIDATE_URL)) {
            throw new AppException('OTP webhook URL is not configured', 500);
        }

        $headers = ["Content-Type: application/json"];
        $token = (string) config('app.otp_webhook_token');
        if ($token !== '') {
            $headers[] = 'Authorization: Bearer ' . $token;
        }

        $payload = json_encode([
            'phone' => $phone,
            'purpose' => $purpose,
            'code' => $code,
            'expiresAt' => $expiresAt,
        ], JSON_UNESCAPED_SLASHES);

        $context = stream_context_create([
            'http' => [
                'method' => 'POST',
                'header' => implode("\r\n", $headers),
                'content' => $payload,
                'ignore_errors' => true,
                'timeout' => 5,
            ],
        ]);

        $result = @file_get_contents($url, false, $context);
        $statusLine = $http_response_header[0] ?? 'HTTP/1.1 000';
        preg_match('/\s(\d{3})\s/', $statusLine, $matches);
        $status = (int) ($matches[1] ?? 0);
        if ($result === false || $status < 200 || $status >= 300) {
            throw new AppException('OTP delivery failed', 502);
        }
    }
}
