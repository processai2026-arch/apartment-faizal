<?php

declare(strict_types=1);

class RoleMiddleware
{
    public function handle(Request $request, ?string $argument = null): void
    {
        (new AuthMiddleware())->handle($request);
        $allowed = array_filter(array_map('trim', explode(',', (string) $argument)));
        if ($allowed && !in_array($request->user['role'], $allowed, true)) {
            AuditService::log((int) $request->user['id'], 'auth.forbidden', 'route', null, ['path' => $request->path]);
            throw new AppException('Forbidden', 403);
        }
    }
}
