<?php

declare(strict_types=1);

class Complaint extends CrudModel
{
    protected static string $table = 'complaints';
    protected static array $columns = [
        'tenant_id', 'office_id', 'category', 'subject', 'description',
        'priority', 'status', 'assigned_vendor_id', 'attachment_id',
    ];
    protected static array $searchColumns = ['subject', 'description', 'category'];

    public static function history(int $complaintId): array
    {
        return Database::fetchAll(
            'SELECT * FROM complaint_updates WHERE complaint_id = :complaint_id ORDER BY id DESC',
            ['complaint_id' => $complaintId]
        );
    }

    public static function assign(int $id, int $vendorId, ?int $updatedBy = null, ?string $remarks = null): array
    {
        $complaint = static::find($id);
        if (!$complaint) {
            throw new AppException('Complaint not found', 404);
        }

        $oldStatus = $complaint['status'];
        $newStatus = $oldStatus === 'Open' ? 'Assigned' : $oldStatus;

        return Database::transaction(function () use ($id, $vendorId, $oldStatus, $newStatus, $updatedBy, $remarks) {
            Database::query(
                'UPDATE complaints SET assigned_vendor_id = :vendor_id, status = :status, updated_at = :updated_at WHERE id = :id AND deleted_at IS NULL',
                ['vendor_id' => $vendorId, 'status' => $newStatus, 'updated_at' => db_time(), 'id' => $id]
            );

            if ($oldStatus !== $newStatus) {
                Database::query(
                    'INSERT INTO complaint_updates (complaint_id, updated_by, old_status, new_status, remarks, created_at)
                     VALUES (:complaint_id, :updated_by, :old_status, :new_status, :remarks, :created_at)',
                    [
                        'complaint_id' => $id,
                        'updated_by' => $updatedBy,
                        'old_status' => $oldStatus,
                        'new_status' => $newStatus,
                        'remarks' => $remarks,
                        'created_at' => db_time(),
                    ]
                );
            }

            return static::find($id);
        });
    }

    public static function changeStatus(int $id, string $newStatus, ?string $remarks = null, ?int $updatedBy = null): array
    {
        $complaint = static::find($id);
        if (!$complaint) {
            throw new AppException('Complaint not found', 404);
        }

        $oldStatus = $complaint['status'];

        return Database::transaction(function () use ($id, $oldStatus, $newStatus, $remarks, $updatedBy) {
            Database::query(
                'UPDATE complaints SET status = :status, updated_at = :updated_at WHERE id = :id AND deleted_at IS NULL',
                ['status' => $newStatus, 'updated_at' => db_time(), 'id' => $id]
            );

            Database::query(
                'INSERT INTO complaint_updates (complaint_id, updated_by, old_status, new_status, remarks, created_at)
                 VALUES (:complaint_id, :updated_by, :old_status, :new_status, :remarks, :created_at)',
                [
                    'complaint_id' => $id,
                    'updated_by' => $updatedBy,
                    'old_status' => $oldStatus,
                    'new_status' => $newStatus,
                    'remarks' => $remarks,
                    'created_at' => db_time(),
                ]
            );

            return static::find($id);
        });
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
