<?php

declare(strict_types=1);

class PublicScanController
{
    public function visitorEntry(Request $request): void
    {
        Validator::require($request->all(), ['name', 'phone', 'company_name', 'whom_to_meet', 'reason']);
        $data = $request->only([
            'name',
            'phone',
            'gender',
            'address',
            'city',
            'pincode',
            'block',
            'floor_number',
            'company_name',
            'whom_to_meet',
            'reason',
            'vehicle_type',
            'vehicle_no',
        ]);
        $data['phone'] = Validator::phone((string) $data['phone']);
        $data['status'] = 'Inside';
        $data['entry_time'] = db_time();
        $data['guard_name'] = 'Self Check-in';
        $row = Visitor::create($data);
        Database::query(
            'INSERT INTO visitor_movements (visitor_id, movement_type, occurred_at, actor_user_id, created_at) VALUES (:visitor_id, :movement_type, :occurred_at, :actor_user_id, :created_at)',
            ['visitor_id' => (int) $row['id'], 'movement_type' => 'entry', 'occurred_at' => $row['entry_time'], 'actor_user_id' => null, 'created_at' => db_time()]
        );
        $row = Visitor::issuePublicCheckoutToken((int) $row['id']);
        AuditService::log(null, 'public_scan.visitor_entry', 'visitor', (int) $row['id']);
        NotificationService::notifyVisitorEntered($row, null);
        Response::success($row, 'Visitor entry submitted', 201);
    }

    public function visitorCheckout(Request $request): void
    {
        Validator::require($request->all(), ['visitor_id', 'checkout_token']);
        $row = Visitor::publicCheckout((int) $request->input('visitor_id'), (string) $request->input('checkout_token'));
        NotificationService::notifyVisitorExited($row, null);
        Response::success($row, 'Visitor checked out');
    }

    public function vehicleEntry(Request $request): void
    {
        Validator::require($request->all(), ['vehicle_no', 'vehicle_type']);
        $data = $request->only([
            'vehicle_no',
            'vehicle_type',
            'vehicle_model',
            'owner_name',
            'block',
            'floor_number',
            'company_name',
        ]);
        $data['parking_user_type'] = 'Visitor';
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

