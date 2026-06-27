<?php

declare(strict_types=1);

class GateTokenMiddleware
{
    public function handle(Request $request, ?string $argument = null): void
    {
        $token = (string) ($request->headers['x-gate-token'] ?? '');
        if ($token === '') {
            throw new AppException('Gate token required', 401);
        }

        $scope = (string) $argument;
        $row = Database::fetch(
            'SELECT * FROM gate_tokens WHERE token_hash = :hash AND scope = :scope AND status = :status AND expires_at > :now',
            ['hash' => hash('sha256', $token), 'scope' => $scope, 'status' => 'active', 'now' => db_time()]
        );
        if (!$row) {
            throw new AppException('Invalid or expired gate token', 401);
        }
    }
}
