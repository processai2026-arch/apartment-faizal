<?php

declare(strict_types=1);

class TenantEmergencyController
{
    public function index(Request $request): void
    {
        $request->query['status'] = 'Active';
        [$rows, $total, $page, $perPage] = EmergencyContact::list($request);
        Response::paginated($rows, $total, $page, $perPage);
    }
}
