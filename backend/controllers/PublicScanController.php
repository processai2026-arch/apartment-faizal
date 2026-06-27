<?php

declare(strict_types=1);

class PublicScanController
{
    public function visitorEntry(Request $request): void
    {
        Validator::require($request->all(), ['name', 'phone', 'company_name', 'whom_to_meet', 'reason']);
        $data = $request->all();
        $data['phone'] = Validator::phone($data['phone']);
        $data['status'] = 'Inside';
        $data['entry_time'] = db_time();
        $row = Visitor::create($data);
        $row = Visitor::issuePublicCheckoutToken((int) $row['id']);
        AuditService::log(null, 'public_scan.visitor_entry', 'visitor', (int) $row['id']);
        Response::success($row, 'Visitor entry submitted', 201);
    }

    public function visitorCheckout(Request $request): void
    {
        Validator::require($request->all(), ['visitor_id', 'checkout_token']);
        $row = Visitor::publicCheckout((int) $request->input('visitor_id'), (string) $request->input('checkout_token'));
        Response::success($row, 'Visitor checked out');
    }

    public function vehicleEntry(Request $request): void
    {
        Validator::require($request->all(), ['vehicle_no', 'vehicle_type']);
        $data = $request->all();
        $data['status'] = 'Inside';
        $data['entry_time'] = db_time();
        $row = Vehicle::create($data);
        $row = Vehicle::issuePublicCheckoutToken((int) $row['id']);
        AuditService::log(null, 'public_scan.vehicle_entry', 'vehicle', (int) $row['id']);
        Response::success($row, 'Vehicle entry submitted', 201);
    }

    public function vehicleCheckout(Request $request): void
    {
        Validator::require($request->all(), ['vehicle_id', 'checkout_token']);
        $row = Vehicle::publicCheckout((int) $request->input('vehicle_id'), (string) $request->input('checkout_token'));
        Response::success($row, 'Vehicle checked out');
    }
}
