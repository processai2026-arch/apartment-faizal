<?php

declare(strict_types=1);

class HealthController
{
    public function show(Request $request): void
    {
        Response::success([
            'service' => config('app.name'),
            'environment' => config('app.env'),
            'time' => db_time(),
        ]);
    }
}
