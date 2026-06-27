<?php

declare(strict_types=1);

class AuthMiddleware
{
    public function handle(Request $request, ?string $argument = null): void
    {
        $token = $request->bearerToken();
        if (!$token) {
            throw new AppException('Authentication required', 401);
        }

        $payload = JWT::decode($token, config('app.jwt_access_secret'));
        if (($payload['type'] ?? null) !== 'access') {
            throw new AppException('Invalid access token', 401);
        }

        $user = User::findById((int) $payload['sub']);
        if (!$user || $user['status'] !== 'active') {
            throw new AppException('User account is inactive', 401);
        }

        $request->user = User::public($user);
    }
}
