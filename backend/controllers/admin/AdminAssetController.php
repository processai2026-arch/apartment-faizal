<?php

declare(strict_types=1);

class AdminAssetController
{
    public function index(Request $request): void
    {
        [$rows, $total, $page, $perPage] = Asset::list($request);
        Response::paginated($rows, $total, $page, $perPage);
    }

    public function show(Request $request): void
    {
        $asset = Asset::find((int) $request->params['id']);
        if (!$asset) {
            throw new AppException('Asset not found', 404);
        }
        $open = AssetAssignment::openForAsset((int) $asset['id']);
        if ($open) {
            $staff = Staff::find((int) $open['staff_id']);
            $open['staff_name'] = $staff['name'] ?? null;
        }
        $asset['current_assignment'] = $open;
        $asset['assignment_history'] = AssetAssignment::historyForAsset((int) $asset['id']);
        $asset['audit_history'] = AssetAudit::historyForAsset((int) $asset['id']);
        Response::success($asset);
    }

    public function store(Request $request): void
    {
        Validator::require($request->all(), ['name', 'category']);
        Validator::enum((string) $request->input('category'), Asset::CATEGORIES, 'category');
        if ($request->input('condition') !== null && $request->input('condition') !== '') {
            Validator::enum((string) $request->input('condition'), Asset::CONDITIONS, 'condition');
        }

        $asset = Asset::create([
            'asset_tag'           => Asset::nextAssetTag((string)($request->input('category') ?: 'Other')),
            'name'                => $request->input('name'),
            'category'            => $request->input('category'),
            'asset_type'          => $request->input('asset_type') ?: null,
            'serial_no'           => $request->input('serial_no') ?: null,
            'condition'           => $request->input('condition') ?: 'Good',
            'status'              => 'Available',
            'photo_attachment_id' => $request->input('photo_attachment_id') ? (int) $request->input('photo_attachment_id') : null,
            'purchase_date'       => $request->input('purchase_date') ?: null,
            'notes'               => $request->input('notes') ?: null,
        ]);
        AuditService::log((int) $request->user['id'], 'asset.create', 'asset', (int) $asset['id']);
        Response::success($asset, 'Asset registered', 201);
    }

    public function update(Request $request): void
    {
        $asset = Asset::find((int) $request->params['id']);
        if (!$asset) {
            throw new AppException('Asset not found', 404);
        }
        if ($request->input('category') !== null) {
            Validator::enum((string) $request->input('category'), Asset::CATEGORIES, 'category');
            // BUG-08 fix: prevent category change after creation — asset tag would become invalid
            if ($request->input('category') !== $asset['category']) {
                throw new AppException(
                    'Category cannot be changed after asset creation — the asset tag would become invalid. Delete and re-register under the new category.',
                    422
                );
            }
        }
        if ($request->input('condition') !== null) {
            Validator::enum((string) $request->input('condition'), Asset::CONDITIONS, 'condition');
        }
        if ($request->input('status') !== null) {
            Validator::enum((string) $request->input('status'), Asset::STATUSES, 'status');
        }

        $data = array_filter([
            'name'                => $request->input('name'),
            'category'            => $request->input('category'),
            'asset_type'          => $request->input('asset_type'),
            'serial_no'           => $request->input('serial_no'),
            'condition'           => $request->input('condition'),
            'status'              => $request->input('status'),
            'photo_attachment_id' => $request->input('photo_attachment_id') ? (int) $request->input('photo_attachment_id') : null,
            'purchase_date'       => $request->input('purchase_date'),
            'notes'               => $request->input('notes'),
        ], fn ($v) => $v !== null);

        $updated = Asset::update((int) $asset['id'], $data);
        AuditService::log((int) $request->user['id'], 'asset.update', 'asset', (int) $updated['id']);
        Response::success($updated, 'Asset updated');
    }

    public function destroy(Request $request): void
    {
        $asset = Asset::find((int) $request->params['id']);
        if (!$asset) {
            throw new AppException('Asset not found', 404);
        }
        Asset::softDelete((int) $asset['id']);
        AuditService::log((int) $request->user['id'], 'asset.delete', 'asset', (int) $asset['id']);
        Response::success([], 'Asset removed');
    }

    /** GET /admin/assets/summary — dashboard totals. */
    public function summary(Request $request): void
    {
        $total = (int) (Database::fetch(
            'SELECT COUNT(*) AS c FROM assets WHERE deleted_at IS NULL'
        )['c'] ?? 0);
        $available = (int) (Database::fetch(
            "SELECT COUNT(*) AS c FROM assets WHERE deleted_at IS NULL AND status = 'Available'"
        )['c'] ?? 0);
        $checkedOut = (int) (Database::fetch(
            "SELECT COUNT(*) AS c FROM assets WHERE deleted_at IS NULL AND status = 'Checked Out'"
        )['c'] ?? 0);
        $underMaintenance = (int) (Database::fetch(
            "SELECT COUNT(*) AS c FROM assets WHERE deleted_at IS NULL AND status = 'Under Maintenance'"
        )['c'] ?? 0);
        $byCategory = Database::fetchAll(
            'SELECT category, COUNT(*) AS count FROM assets WHERE deleted_at IS NULL GROUP BY category'
        );

        Response::success([
            'total'             => $total,
            'available'         => $available,
            'checked_out'       => $checkedOut,
            'under_maintenance' => $underMaintenance,
            'by_category'       => $byCategory,
        ]);
    }

    /** POST /admin/assets/{id}/checkout — issue an asset to a staff member. */
    public function checkout(Request $request): void
    {
        $asset = Asset::find((int) $request->params['id']);
        if (!$asset) {
            throw new AppException('Asset not found', 404);
        }
        if ($asset['status'] !== 'Available') {
            throw new AppException('Asset is not available for checkout', 422);
        }
        Validator::require($request->all(), ['staff_id']);
        $staffId = (int) $request->input('staff_id');
        if (!Staff::find($staffId)) {
            throw new AppException('Staff member not found', 404);
        }

        $assignment = AssetAssignment::create([
            'asset_id'  => (int) $asset['id'],
            'staff_id'  => $staffId,
            'issued_by' => (int) $request->user['id'],
            'issued_at' => db_time(),
            'due_at'    => $request->input('due_at') ?: null,
            'notes'     => $request->input('notes') ?: null,
        ]);
        Asset::update((int) $asset['id'], ['status' => 'Checked Out']);
        AuditService::log((int) $request->user['id'], 'asset.checkout', 'asset', (int) $asset['id'], ['staff_id' => $staffId]);
        Response::success($assignment, 'Asset checked out', 201);
    }

    /** POST /admin/assets/{id}/checkin — return the asset, closing the open assignment. */
    public function checkin(Request $request): void
    {
        $asset = Asset::find((int) $request->params['id']);
        if (!$asset) {
            throw new AppException('Asset not found', 404);
        }
        $open = AssetAssignment::openForAsset((int) $asset['id']);
        if (!$open) {
            throw new AppException('Asset is not currently checked out', 422);
        }

        $returnCondition = $request->input('return_condition') ?: null;
        if ($returnCondition !== null) {
            Validator::enum((string) $returnCondition, Asset::CONDITIONS, 'return_condition');
        }

        Database::query(
            'UPDATE asset_assignments SET returned_at = :now, return_condition = :cond, notes = COALESCE(:notes, notes) WHERE id = :id',
            [
                'now'   => db_time(),
                'cond'  => $returnCondition,
                'notes' => $request->input('notes') ?: null,
                'id'    => (int) $open['id'],
            ]
        );

        // Derive the asset's next status from the returned condition.
        $newStatus = 'Available';
        if ($returnCondition === 'Damaged') {
            $newStatus = 'Under Maintenance';
        } elseif ($returnCondition === 'Retired') {
            $newStatus = 'Retired';
        }
        $update = ['status' => $newStatus];
        if ($returnCondition !== null) {
            $update['condition'] = $returnCondition;
        }
        $updated = Asset::update((int) $asset['id'], $update);
        AuditService::log((int) $request->user['id'], 'asset.checkin', 'asset', (int) $asset['id'], ['status' => $newStatus]);
        Response::success($updated, 'Asset checked in');
    }

    /** POST /admin/assets/{id}/audit — record a physical verification. */
    public function audit(Request $request): void
    {
        $asset = Asset::find((int) $request->params['id']);
        if (!$asset) {
            throw new AppException('Asset not found', 404);
        }
        Validator::require($request->all(), ['found_status', 'condition']);
        Validator::enum((string) $request->input('found_status'), Asset::STATUSES, 'found_status');
        Validator::enum((string) $request->input('condition'), Asset::CONDITIONS, 'condition');

        $audit = AssetAudit::create([
            'asset_id'     => (int) $asset['id'],
            'audited_by'   => (int) $request->user['id'],
            'audit_date'   => $request->input('audit_date') ?: date('Y-m-d'),
            'found_status' => $request->input('found_status'),
            'condition'    => $request->input('condition'),
            'remarks'      => $request->input('remarks') ?: null,
        ]);
        // Keep the asset's condition in step with the latest audit finding.
        Asset::update((int) $asset['id'], ['condition' => (string) $request->input('condition')]);
        AuditService::log((int) $request->user['id'], 'asset.audit', 'asset', (int) $asset['id']);
        Response::success($audit, 'Audit recorded', 201);
    }

    /** GET /admin/assets/audits — recent audits across all assets. */
    public function audits(Request $request): void
    {
        $conditions = [];
        $params = [];
        if (($request->query['asset_id'] ?? '') !== '') {
            $conditions[] = 'a.asset_id = :asset_id';
            $params['asset_id'] = (int) $request->query['asset_id'];
        }
        if (($request->query['condition'] ?? '') !== '') {
            $conditions[] = 'a.`condition` = :condition';
            $params['condition'] = $request->query['condition'];
        }
        $where = $conditions ? 'WHERE ' . implode(' AND ', $conditions) : '';
        $rows = Database::fetchAll(
            "SELECT a.*, ast.asset_tag, ast.name AS asset_name
             FROM asset_audits a
             LEFT JOIN assets ast ON ast.id = a.asset_id
             {$where}
             ORDER BY a.id DESC LIMIT 100",
            $params
        );
        Response::success($rows);
    }

    /** GET /admin/assets/assignments?staff_id=&open=1 — who has what checked out. */
    public function assignments(Request $request): void
    {
        $conditions = [];
        $params = [];
        if (($request->query['staff_id'] ?? '') !== '') {
            $conditions[] = 'a.staff_id = :staff_id';
            $params['staff_id'] = (int) $request->query['staff_id'];
        }
        if (($request->query['open'] ?? '') === '1') {
            $conditions[] = 'a.returned_at IS NULL';
        }
        $where = $conditions ? 'WHERE ' . implode(' AND ', $conditions) : '';
        $rows = Database::fetchAll(
            "SELECT a.*, s.name AS staff_name, ast.asset_tag, ast.name AS asset_name, ast.category AS asset_category
             FROM asset_assignments a
             LEFT JOIN staff s ON s.id = a.staff_id
             LEFT JOIN assets ast ON ast.id = a.asset_id
             {$where}
             ORDER BY a.id DESC LIMIT 200",
            $params
        );
        Response::success($rows);
    }
}
