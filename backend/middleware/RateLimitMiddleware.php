<?php

declare(strict_types=1);

class RateLimitMiddleware
{
    public function handle(Request $request, ?string $argument = null): void
    {
        [$limit, $window] = array_pad(explode(',', (string) $argument), 2, null);
        RateLimiter::hit($request->ip() . ':' . $request->path, (int) ($limit ?: 60), (int) ($window ?: 60));
    }
}
