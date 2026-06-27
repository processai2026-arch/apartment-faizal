<?php

declare(strict_types=1);

class AuthService
{
    public function login(string $email, string $password, Request $request): array
    {
        $user = User::findByEmail($email);
        if (!$user || !password_verify($password, $user['password_hash']) || $user['status'] !== 'active') {
            throw new AppException('Invalid credentials', 401);
        }

        return $this->issueTokens($user, $request);
    }

    public function issueTokens(array $user, Request $request): array
    {
        $access = JWT::encode([
            'sub' => (int) $user['id'],
            'role' => $user['role'],
            'type' => 'access',
        ], config('app.jwt_access_secret'), config('app.jwt_access_ttl'));

        $refresh = JWT::encode([
            'sub' => (int) $user['id'],
            'type' => 'refresh',
        ], config('app.jwt_refresh_secret'), config('app.jwt_refresh_ttl'));

        $payload = JWT::decode($refresh, config('app.jwt_refresh_secret'));
        Database::query(
            'INSERT INTO refresh_tokens (user_id, token_hash, expires_at, ip_address, user_agent, created_at)
             VALUES (:user_id, :token_hash, :expires_at, :ip_address, :user_agent, :created_at)',
            [
                'user_id' => $user['id'],
                'token_hash' => hash('sha256', $refresh),
                'expires_at' => db_time((int) $payload['exp']),
                'ip_address' => $request->ip(),
                'user_agent' => substr($_SERVER['HTTP_USER_AGENT'] ?? '', 0, 255),
                'created_at' => db_time(),
            ]
        );

        AuditService::log((int) $user['id'], 'auth.login', 'user', (int) $user['id']);

        return [
            'accessToken' => $access,
            'refreshToken' => $refresh,
            'expiresIn' => config('app.jwt_access_ttl'),
            'user' => User::public($user),
        ];
    }

    public function refresh(string $refreshToken, Request $request): array
    {
        $payload = JWT::decode($refreshToken, config('app.jwt_refresh_secret'));
        if (($payload['type'] ?? null) !== 'refresh') {
            throw new AppException('Invalid refresh token', 401);
        }

        $hash = hash('sha256', $refreshToken);
        $session = Database::fetch(
            'SELECT * FROM refresh_tokens WHERE token_hash = :hash AND revoked_at IS NULL AND expires_at > :now',
            ['hash' => $hash, 'now' => db_time()]
        );
        if (!$session) {
            throw new AppException('Refresh token revoked or expired', 401);
        }

        Database::query('UPDATE refresh_tokens SET revoked_at = :now WHERE id = :id', ['now' => db_time(), 'id' => $session['id']]);
        $user = User::findById((int) $payload['sub']);
        if (!$user || $user['status'] !== 'active') {
            throw new AppException('User unavailable', 401);
        }

        return $this->issueTokens($user, $request);
    }

    public function logout(?string $refreshToken, ?int $userId): void
    {
        if ($refreshToken) {
            Database::query('UPDATE refresh_tokens SET revoked_at = :now WHERE token_hash = :hash', [
                'now' => db_time(),
                'hash' => hash('sha256', $refreshToken),
            ]);
        } elseif ($userId) {
            Database::query('UPDATE refresh_tokens SET revoked_at = :now WHERE user_id = :user_id AND revoked_at IS NULL', [
                'now' => db_time(),
                'user_id' => $userId,
            ]);
        }
        AuditService::log($userId, 'auth.logout', 'user', $userId);
    }
}
