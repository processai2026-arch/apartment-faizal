<?php

declare(strict_types=1);

class MaintenanceRequest extends CrudModel
{
    protected static string $table = 'maintenance_requests';
    protected static array $columns = [
        'tenant_id', 'office_id', 'category', 'title', 'description',
        'priority', 'status', 'assigned_vendor_id', 'assigned_staff_id',
        'attachment_id', 'expected_completion', 'completed_at',
    ];
    protected static array $searchColumns = ['title', 'description', 'category'];

    public static function history(int $requestId): array
    {
        return Database::fetchAll(
            'SELECT * FROM maintenance_updates WHERE maintenance_request_id = :request_id ORDER BY id DESC',
            ['request_id' => $requestId]
        );
    }

    public static function assignVendor(int $id, int $vendorId, ?int $updatedBy = null, ?string $remarks = null): array
    {
        $request = static::find($id);
        if (!$request) {
            throw new AppException('Maintenance request not found', 404);
        }

        $oldStatus = $request['status'];
        $newStatus = $oldStatus === 'Open' ? 'Assigned' : $oldStatus;

        return Database::transaction(function () use ($id, $vendorId, $oldStatus, $newStatus, $updatedBy, $remarks) {
            Database::query(
                'UPDATE maintenance_requests SET assigned_vendor_id = :vendor_id, status = :status, updated_at = :updated_at WHERE id = :id AND deleted_at IS NULL',
                ['vendor_id' => $vendorId, 'status' => $newStatus, 'updated_at' => db_time(), 'id' => $id]
            );

            if ($oldStatus !== $newStatus) {
                self::recordUpdate($id, $updatedBy, $oldStatus, $newStatus, $remarks);
            }

            return static::find($id);
        });
    }

    public static function assignStaff(int $id, int $staffId, ?int $updatedBy = null, ?string $remarks = null): array
    {
        $request = static::find($id);
        if (!$request) {
            throw new AppException('Maintenance request not found', 404);
        }

        $oldStatus = $request['status'];
        $newStatus = $oldStatus === 'Open' ? 'Assigned' : $oldStatus;

        return Database::transaction(function () use ($id, $staffId, $oldStatus, $newStatus, $updatedBy, $remarks) {
            Database::query(
                'UPDATE maintenance_requests SET assigned_staff_id = :staff_id, status = :status, updated_at = :updated_at WHERE id = :id AND deleted_at IS NULL',
                ['staff_id' => $staffId, 'status' => $newStatus, 'updated_at' => db_time(), 'id' => $id]
            );

            if ($oldStatus !== $newStatus) {
                self::recordUpdate($id, $updatedBy, $oldStatus, $newStatus, $remarks);
            }

            return static::find($id);
        });
    }

    public static function changeStatus(int $id, string $newStatus, ?string $remarks = null, ?int $updatedBy = null): array
    {
        $request = static::find($id);
        if (!$request) {
            throw new AppException('Maintenance request not found', 404);
        }

        $oldStatus = $request['status'];

        return Database::transaction(function () use ($id, $oldStatus, $newStatus, $remarks, $updatedBy) {
            $completedAt = $newStatus === 'Completed' ? db_time() : null;

            Database::query(
                'UPDATE maintenance_requests SET status = :status, completed_at = COALESCE(:completed_at, completed_at), updated_at = :updated_at WHERE id = :id AND deleted_at IS NULL',
                ['status' => $newStatus, 'completed_at' => $completedAt, 'updated_at' => db_time(), 'id' => $id]
            );

            self::recordUpdate($id, $updatedBy, $oldStatus, $newStatus, $remarks);

            return static::find($id);
        });
    }

    public static function cancel(int $id, ?int $updatedBy = null, ?string $remarks = null): array
    {
        return static::changeStatus($id, 'Cancelled', $remarks, $updatedBy);
    }

    private static function recordUpdate(int $requestId, ?int $updatedBy, ?string $oldStatus, string $newStatus, ?string $remarks): void
    {
        Database::query(
            'INSERT INTO maintenance_updates (maintenance_request_id, updated_by, old_status, new_status, remarks, created_at)
             VALUES (:request_id, :updated_by, :old_status, :new_status, :remarks, :created_at)',
            [
                'request_id' => $requestId,
                'updated_by' => $updatedBy,
                'old_status' => $oldStatus,
                'new_status' => $newStatus,
                'remarks' => $remarks,
                'created_at' => db_time(),
            ]
        );
    }

    protected static function filters(Request $request): array
    {
        [$where, $params] = parent::filters($request);
        $conditions = $where !== '' ? [substr($where, 6)] : [];

        if (($request->query['category'] ?? '') !== '') {
            $conditions[] = 'category = :category';
            $params['category'] = $request->query['category'];
        }
        if (($request->query['priority'] ?? '') !== '') {
            $conditions[] = 'priority = :priority';
            $params['priority'] = $request->query['priority'];
        }
        if (($request->query['office_id'] ?? '') !== '') {
            $conditions[] = 'office_id = :office_id';
            $params['office_id'] = (int) $request->query['office_id'];
        }
        if (($request->query['tenant_id'] ?? '') !== '') {
            $conditions[] = 'tenant_id = :tenant_id';
            $params['tenant_id'] = (int) $request->query['tenant_id'];
        }

        return [$conditions ? 'WHERE ' . implode(' AND ', $conditions) : '', $params];
    }
}
