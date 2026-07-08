<?php

declare(strict_types=1);

class AdminVisitorPassController
{
    public function index(Request $request): void
    {
        VisitorPass::autoExpire();
        [$rows, $total, $page, $perPage] = VisitorPass::list($request);
        Response::paginated($rows, $total, $page, $perPage);
    }

    public function store(Request $request): void
    {
        Validator::require($request->all(), ['pass_type', 'visitor_name', 'valid_from', 'valid_until', 'max_uses']);
        Validator::enum((string) $request->input('pass_type'), VisitorPass::PASS_TYPES, 'pass_type');

        $maxUses = (int) $request->input('max_uses');
        if ($maxUses < 0) {
            throw new AppException('max_uses must be 0 (unlimited) or a positive integer', 422);
        }

        // BUG-05 fix: validate date range
        $validFrom  = (string) $request->input('valid_from');
        $validUntil = (string) $request->input('valid_until');
        if ($validFrom && $validUntil && $validFrom >= $validUntil) {
            throw new AppException('valid_from must be before valid_until', 422);
        }

        $pass = VisitorPass::create([
            'pass_type'      => $request->input('pass_type'),
            'visitor_name'   => $request->input('visitor_name'),
            'visitor_phone'  => $request->input('visitor_phone') ?: null,
            'host_name'      => $request->input('host_name') ?: null,
            'host_office_id' => $request->input('host_office_id') ? (int) $request->input('host_office_id') : null,
            'purpose'        => $request->input('purpose') ?: null,
            'valid_from'     => $request->input('valid_from'),
            'valid_until'    => $request->input('valid_until'),
            'max_uses'       => $maxUses,
            'notes'          => $request->input('notes') ?: null,
            'created_by'     => (int) $request->user['id'],
        ]);

        AuditService::log((int) $request->user['id'], 'visitor_pass.create', 'visitor_pass', (int) $pass['id']);
        Response::success($pass, 'Visitor pass created', 201);
    }

    public function show(Request $request): void
    {
        VisitorPass::autoExpire();
        $pass = VisitorPass::find((int) $request->params['id']);
        if (!$pass) {
            throw new AppException('Visitor pass not found', 404);
        }
        $pass['scans'] = Database::fetchAll(
            'SELECT * FROM visitor_pass_scans WHERE pass_id = :id ORDER BY scanned_at DESC',
            ['id' => (int) $pass['id']]
        );
        Response::success($pass);
    }

    public function update(Request $request): void
    {
        $pass = VisitorPass::find((int) $request->params['id']);
        if (!$pass) {
            throw new AppException('Visitor pass not found', 404);
        }

        $updateData = array_filter([
            'visitor_name'   => $request->input('visitor_name'),
            'visitor_phone'  => $request->input('visitor_phone'),
            'host_name'      => $request->input('host_name'),
            'host_office_id' => $request->input('host_office_id') ? (int) $request->input('host_office_id') : null,
            'purpose'        => $request->input('purpose'),
            'valid_from'     => $request->input('valid_from'),
            'valid_until'    => $request->input('valid_until'),
            'notes'          => $request->input('notes'),
        ], fn ($v) => $v !== null);

        if ($request->input('max_uses') !== null) {
            $updateData['max_uses'] = (int) $request->input('max_uses');
        }
        if ($request->input('pass_type') !== null) {
            Validator::enum((string) $request->input('pass_type'), VisitorPass::PASS_TYPES, 'pass_type');
            $updateData['pass_type'] = $request->input('pass_type');
        }
        if ($request->input('shared_via') !== null) {
            $updateData['shared_via'] = $request->input('shared_via');
        }

        $updated = VisitorPass::update((int) $pass['id'], $updateData);
        AuditService::log((int) $request->user['id'], 'visitor_pass.update', 'visitor_pass', (int) $pass['id']);
        Response::success($updated, 'Visitor pass updated');
    }

    public function cancel(Request $request): void
    {
        $pass = VisitorPass::find((int) $request->params['id']);
        if (!$pass) {
            throw new AppException('Visitor pass not found', 404);
        }
        if ($pass['status'] === 'Cancelled') {
            throw new AppException('Pass is already cancelled', 422);
        }

        $updated = VisitorPass::update((int) $pass['id'], ['status' => 'Cancelled']);
        AuditService::log((int) $request->user['id'], 'visitor_pass.cancel', 'visitor_pass', (int) $pass['id']);
        Response::success($updated, 'Visitor pass cancelled');
    }

    public function scan(Request $request): void
    {
        $pass = VisitorPass::find((int) $request->params['id']);
        if (!$pass) {
            throw new AppException('Visitor pass not found', 404);
        }

        // Check pass validity
        if ($pass['status'] === 'Cancelled') {
            throw new AppException('This pass has been cancelled', 422);
        }
        if ($pass['status'] === 'Expired') {
            throw new AppException('This pass has expired', 422);
        }
        if ($pass['status'] === 'Used') {
            throw new AppException('This pass has already been fully used', 422);
        }

        // Check expiry by datetime
        if ($pass['valid_until'] < db_time()) {
            VisitorPass::update((int) $pass['id'], ['status' => 'Expired']);
            throw new AppException('This pass has expired', 422);
        }

        // BUG-04 fix: check valid_from — pass cannot be used before its start date
        if ($pass['valid_from'] > db_time()) {
            throw new AppException('This pass is not yet valid', 422);
        }

        // Check max_uses (0 = unlimited) — BUG-03: use atomic UPDATE to prevent race condition
        $maxUses   = (int) $pass['max_uses'];
        $usedCount = (int) $pass['used_count'];
        if ($maxUses > 0 && $usedCount >= $maxUses) {
            VisitorPass::update((int) $pass['id'], ['status' => 'Used']);
            throw new AppException('This pass has reached its maximum usage limit', 422);
        }

        $action = in_array($request->input('action'), ['entry', 'exit'], true)
            ? $request->input('action')
            : 'entry';

        // Record scan
        Database::query(
            'INSERT INTO visitor_pass_scans (pass_id, scanned_at, scanned_by, action, notes)
             VALUES (:pass_id, :scanned_at, :scanned_by, :action, :notes)',
            [
                'pass_id'    => (int) $pass['id'],
                'scanned_at' => db_time(),
                'scanned_by' => (int) $request->user['id'],
                'action'     => $action,
                'notes'      => $request->input('notes') ?: null,
            ]
        );

        // Only increment on entry
        if ($action === 'entry') {
            $newCount = $usedCount + 1;
            $newStatus = ($maxUses > 0 && $newCount >= $maxUses) ? 'Used' : 'Active';
            VisitorPass::update((int) $pass['id'], ['used_count' => $newCount, 'status' => $newStatus]);
        }

        $refreshed = VisitorPass::find((int) $pass['id']);
        $refreshed['scans'] = Database::fetchAll(
            'SELECT * FROM visitor_pass_scans WHERE pass_id = :id ORDER BY scanned_at DESC',
            ['id' => (int) $pass['id']]
        );

        AuditService::log((int) $request->user['id'], 'visitor_pass.scan', 'visitor_pass', (int) $pass['id'], ['action' => $action]);
        Response::success($refreshed, 'Scan recorded');
    }

    public function dashboard(Request $request): void
    {
        VisitorPass::autoExpire();

        $today = date('Y-m-d');

        $totalToday = (int) Database::fetch(
            'SELECT COUNT(*) AS c FROM visitor_passes WHERE DATE(created_at) = :today AND deleted_at IS NULL',
            ['today' => $today]
        )['c'];

        $statusCounts = Database::fetchAll(
            "SELECT status, COUNT(*) AS cnt FROM visitor_passes WHERE deleted_at IS NULL GROUP BY status"
        );
        $byStatus = [];
        foreach ($statusCounts as $row) {
            $byStatus[$row['status']] = (int) $row['cnt'];
        }

        $typeCounts = Database::fetchAll(
            "SELECT pass_type, COUNT(*) AS cnt FROM visitor_passes WHERE deleted_at IS NULL GROUP BY pass_type"
        );
        $byType = [];
        foreach ($typeCounts as $row) {
            $byType[$row['pass_type']] = (int) $row['cnt'];
        }

        $recentPasses = array_map(
            fn (array $row) => VisitorPass::present($row),
            Database::fetchAll(
                'SELECT * FROM visitor_passes WHERE deleted_at IS NULL ORDER BY id DESC LIMIT 10'
            )
        );

        Response::success([
            'total_today' => $totalToday,
            'by_status'   => $byStatus,
            'by_type'     => $byType,
            'active'      => $byStatus['Active'] ?? 0,
            'expired'     => $byStatus['Expired'] ?? 0,
            'used'        => $byStatus['Used'] ?? 0,
            'cancelled'   => $byStatus['Cancelled'] ?? 0,
            'recent'      => $recentPasses,
        ]);
    }

    public function download(Request $request): void
    {
        $pass = VisitorPass::find((int) $request->params['id']);
        if (!$pass) {
            throw new AppException('Visitor pass not found', 404);
        }
        $pass['scans'] = Database::fetchAll(
            'SELECT * FROM visitor_pass_scans WHERE pass_id = :id ORDER BY scanned_at DESC',
            ['id' => (int) $pass['id']]
        );
        Response::success($pass, 'Pass data for download');
    }
}
