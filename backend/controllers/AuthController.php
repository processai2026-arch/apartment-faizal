<?php

declare(strict_types=1);

class AuthController
{
    public function login(Request $request): void
    {
        Validator::require($request->all(), ['email', 'password']);
        RateLimiter::hit('login:' . $request->ip() . ':' . strtolower((string) $request->input('email')), 5, 300);
        $result = (new AuthService())->login(Validator::email((string) $request->input('email')), (string) $request->input('password'), $request);
        Response::success($result, 'Logged in');
    }

    public function sendOtp(Request $request): void
    {
        Validator::require($request->all(), ['phone', 'purpose']);
        RateLimiter::hit('otp:' . $request->ip() . ':' . $request->input('phone'), 3, 300);
        $phone = Validator::phone((string) $request->input('phone'));
        $purpose = Validator::enum((string) $request->input('purpose'), ['login', 'visitor-entry', 'visitor-checkout'], 'purpose');
        Response::success((new OtpService())->send($phone, $purpose), 'OTP sent');
    }

    public function verifyOtp(Request $request): void
    {
        Validator::require($request->all(), ['phone', 'purpose', 'otp']);
        $phone = Validator::phone((string) $request->input('phone'));
        $purpose = Validator::enum((string) $request->input('purpose'), ['login', 'visitor-entry', 'visitor-checkout'], 'purpose');
        (new OtpService())->verify($phone, $purpose, (string) $request->input('otp'), $request->user ? (int) $request->user['id'] : null);

        if ($purpose === 'login') {
            $user = User::findByPhone($phone);
            if (!$user || $user['status'] !== 'active') {
                throw new AppException('No active user for this phone', 404);
            }
            Response::success((new AuthService())->issueTokens($user, $request), 'Logged in');
        }

        Response::success(['verified' => true], 'OTP verified');
    }

    public function refresh(Request $request): void
    {
        Validator::require($request->all(), ['refreshToken']);
        Response::success((new AuthService())->refresh((string) $request->input('refreshToken'), $request), 'Token refreshed');
    }

    public function logout(Request $request): void
    {
        (new AuthService())->logout($request->input('refreshToken'), $request->user ? (int) $request->user['id'] : null);
        Response::success(null, 'Logged out');
    }

    public function me(Request $request): void
    {
        Response::success($request->user, 'OK');
    }

    public function changePassword(Request $request): void
    {
        Validator::require($request->all(), ['currentPassword', 'newPassword']);
        if (strlen((string) $request->input('newPassword')) < 10) {
            throw new AppException('New password must be at least 10 characters', 422);
        }
        $user = User::findById((int) $request->user['id']);
        if (!$user || !password_verify((string) $request->input('currentPassword'), $user['password_hash'])) {
            throw new AppException('Current password is incorrect', 422);
        }
        Database::query('UPDATE users SET password_hash = :hash, updated_at = :now WHERE id = :id', [
            'hash' => password_hash((string) $request->input('newPassword'), PASSWORD_DEFAULT),
            'now' => db_time(),
            'id' => $user['id'],
        ]);
        Database::query('UPDATE refresh_tokens SET revoked_at = :now WHERE user_id = :id AND revoked_at IS NULL', [
            'now' => db_time(),
            'id' => $user['id'],
        ]);
        AuditService::log((int) $user['id'], 'auth.change_password', 'user', (int) $user['id']);
        Response::success(null, 'Password changed');
    }
}
