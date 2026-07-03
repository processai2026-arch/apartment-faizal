<?php

declare(strict_types=1);

class RoleMiddleware
{
    public function handle(Request $request, ?string $argument = null): void
    {
        (new AuthMiddleware())->handle($request);
        $allowed = array_filter(array_map('trim', explode(',', (string) $argument)));
        if ($allowed && !self::passes((string) $request->user['role'], $allowed)) {
            AuditService::log((int) $request->user['id'], 'auth.forbidden', 'route', null, ['path' => $request->path]);
            throw new AppException('Forbidden', 403);
        }
    }

    /**
     * Central role matching. 'super_admin' is a strict superset of 'admin':
     * any route that allows 'admin' implicitly allows 'super_admin'. Routes
     * may also require 'super_admin' explicitly, which a regular admin does
     * NOT satisfy.
     */
    public static function passes(string $role, array $allowed): bool
    {
        if (in_array($role, $allowed, true)) {
            return true;
        }

        return $role === 'super_admin' && in_array('admin', $allowed, true);
    }
}
