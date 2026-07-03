<?php

declare(strict_types=1);

class AdminNameTransferController
{
    public function index(Request $request): void
    {
        [$rows, $total, $page, $perPage] = NameTransfer::list($request);
        $rows = array_map([self::class, 'withOffice'], $rows);
        Response::paginated($rows, $total, $page, $perPage);
    }

    public function show(Request $request): void
    {
        $transfer = NameTransfer::find((int) $request->params['id']);
        if (!$transfer) {
            throw new AppException('Name transfer not found', 404);
        }
        Response::success(self::withOffice($transfer));
    }

    public function store(Request $request): void
    {
        Validator::require($request->all(), ['office_id', 'to_name']);

        $office = Office::find((int) $request->input('office_id'));
        if (!$office) {
            throw new AppException('Office not found', 404);
        }

        $transfer = NameTransfer::create([
            'transfer_no'                  => NameTransfer::nextTransferNo(),
            'office_id'                    => (int) $office['id'],
            // Capture the current occupant/owner name at request time.
            'from_name'                    => $office['company_name'] ?? null,
            'to_name'                      => $request->input('to_name'),
            'to_contact_person'            => $request->input('to_contact_person') ?: null,
            'to_phone'                     => $request->input('to_phone') ?: null,
            'to_email'                     => $request->input('to_email') ?: null,
            'reason'                       => $request->input('reason') ?: null,
            'effective_date'               => $request->input('effective_date') ?: null,
            'status'                       => 'Pending',
            'supporting_doc_attachment_id' => $request->input('supporting_doc_attachment_id') ? (int) $request->input('supporting_doc_attachment_id') : null,
            'requested_by'                 => (int) $request->user['id'],
            'notes'                        => $request->input('notes') ?: null,
        ]);
        AuditService::log((int) $request->user['id'], 'name_transfer.create', 'name_transfer', (int) $transfer['id']);
        Response::success(self::withOffice($transfer), 'Name transfer requested', 201);
    }

    public function update(Request $request): void
    {
        $transfer = NameTransfer::find((int) $request->params['id']);
        if (!$transfer) {
            throw new AppException('Name transfer not found', 404);
        }
        if ($request->input('status') !== null) {
            Validator::enum((string) $request->input('status'), NameTransfer::STATUSES, 'status');
        }

        $data = array_filter([
            'to_name'                      => $request->input('to_name'),
            'to_contact_person'            => $request->input('to_contact_person'),
            'to_phone'                     => $request->input('to_phone'),
            'to_email'                     => $request->input('to_email'),
            'reason'                       => $request->input('reason'),
            'effective_date'               => $request->input('effective_date'),
            'status'                       => $request->input('status'),
            'supporting_doc_attachment_id' => $request->input('supporting_doc_attachment_id') ? (int) $request->input('supporting_doc_attachment_id') : null,
            'notes'                        => $request->input('notes'),
        ], fn ($v) => $v !== null);

        $updated = NameTransfer::update((int) $transfer['id'], $data);
        AuditService::log((int) $request->user['id'], 'name_transfer.update', 'name_transfer', (int) $updated['id']);
        Response::success(self::withOffice($updated), 'Name transfer updated');
    }

    /** POST /admin/name-transfers/{id}/approve — mark Approved, stamp approver. */
    public function approve(Request $request): void
    {
        $transfer = $this->requirePending($request);
        $updated = NameTransfer::update((int) $transfer['id'], [
            'status'      => 'Approved',
            'approved_by' => (int) $request->user['id'],
        ]);
        AuditService::log((int) $request->user['id'], 'name_transfer.approve', 'name_transfer', (int) $updated['id']);
        Response::success(self::withOffice($updated), 'Name transfer approved');
    }

    /** POST /admin/name-transfers/{id}/reject — mark Rejected. */
    public function reject(Request $request): void
    {
        $transfer = $this->requirePending($request);
        $updated = NameTransfer::update((int) $transfer['id'], [
            'status'      => 'Rejected',
            'approved_by' => (int) $request->user['id'],
            'notes'       => $request->input('notes') ?: ($transfer['notes'] ?? null),
        ]);
        AuditService::log((int) $request->user['id'], 'name_transfer.reject', 'name_transfer', (int) $updated['id']);
        Response::success(self::withOffice($updated), 'Name transfer rejected');
    }

    /**
     * POST /admin/name-transfers/{id}/complete — APPLY the transfer to the office.
     * Updates the linked office occupant fields to the to_* values and marks the
     * transfer Completed. Both writes run inside a single transaction so the
     * office mutation and the status change succeed or fail together.
     */
    public function complete(Request $request): void
    {
        $transfer = NameTransfer::find((int) $request->params['id']);
        if (!$transfer) {
            throw new AppException('Name transfer not found', 404);
        }
        if ($transfer['status'] === 'Completed') {
            throw new AppException('Name transfer is already completed', 409);
        }
        if ($transfer['status'] === 'Rejected') {
            throw new AppException('Rejected transfers cannot be completed', 409);
        }

        $office = Office::find((int) $transfer['office_id']);
        if (!$office) {
            throw new AppException('Linked office no longer exists', 404);
        }

        $userId = (int) $request->user['id'];

        Database::transaction(function () use ($transfer, $office, $userId): void {
            // 1. Apply the incoming tenant details onto the office/unit.
            $officeData = [
                'company_name'   => $transfer['to_name'],
                'contact_person' => $transfer['to_contact_person'] ?? $office['contact_person'] ?? null,
                'contact_phone'  => $transfer['to_phone'] ?? $office['contact_phone'] ?? null,
                'contact_email'  => $transfer['to_email'] ?? $office['contact_email'] ?? null,
            ];
            Office::update((int) $office['id'], $officeData);

            // 2. Stamp the transfer as completed.
            NameTransfer::update((int) $transfer['id'], [
                'status'      => 'Completed',
                'approved_by' => $transfer['approved_by'] ?: $userId,
            ]);
        });

        $updated = NameTransfer::find((int) $transfer['id']);
        AuditService::log($userId, 'name_transfer.complete', 'name_transfer', (int) $transfer['id'], [
            'office_id' => (int) $office['id'],
            'from_name' => $transfer['from_name'],
            'to_name'   => $transfer['to_name'],
        ]);
        Response::success(self::withOffice($updated), 'Name transfer completed — office updated');
    }

    public function destroy(Request $request): void
    {
        $transfer = NameTransfer::find((int) $request->params['id']);
        if (!$transfer) {
            throw new AppException('Name transfer not found', 404);
        }
        NameTransfer::softDelete((int) $transfer['id']);
        AuditService::log((int) $request->user['id'], 'name_transfer.delete', 'name_transfer', (int) $transfer['id']);
        Response::success([], 'Name transfer removed');
    }

    /** GET /admin/name-transfers/summary — dashboard totals. */
    public function summary(Request $request): void
    {
        $pending = (int) (Database::fetch(
            "SELECT COUNT(*) AS c FROM name_transfers WHERE deleted_at IS NULL AND status = 'Pending'"
        )['c'] ?? 0);
        $approved = (int) (Database::fetch(
            "SELECT COUNT(*) AS c FROM name_transfers WHERE deleted_at IS NULL AND status = 'Approved'"
        )['c'] ?? 0);
        $completedThisMonth = (int) (Database::fetch(
            "SELECT COUNT(*) AS c FROM name_transfers
             WHERE deleted_at IS NULL AND status = 'Completed'
               AND " . sql_month('updated_at') . ' = ' . sql_month_now()
        )['c'] ?? 0);

        Response::success([
            'pending'               => $pending,
            'approved'              => $approved,
            'completed_this_month'  => $completedThisMonth,
        ]);
    }

    private function requirePending(Request $request): array
    {
        $transfer = NameTransfer::find((int) $request->params['id']);
        if (!$transfer) {
            throw new AppException('Name transfer not found', 404);
        }
        if (!in_array($transfer['status'], ['Pending', 'Approved'], true)) {
            throw new AppException('Only pending or approved transfers can be actioned', 409);
        }
        return $transfer;
    }

    /** Enrich a transfer row with a light office summary for display. */
    private static function withOffice(array $transfer): array
    {
        $transfer['office'] = null;
        if (!empty($transfer['office_id'])) {
            $office = Database::fetch(
                'SELECT id, block, floor_number, company_name FROM offices WHERE id = :id',
                ['id' => (int) $transfer['office_id']]
            );
            if ($office) {
                $transfer['office'] = $office;
            }
        }
        return $transfer;
    }
}
