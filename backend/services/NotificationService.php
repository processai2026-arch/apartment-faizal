<?php

declare(strict_types=1);

class NotificationService
{
    public const TYPES = [
        'Visitor Entry',
        'Visitor Exit',
        'Complaint Created',
        'Complaint Assigned',
        'Complaint Status Changed',
        'Maintenance Reminder',
        'Maintenance Request Created',
        'Maintenance Request Assigned',
        'Maintenance Request Status Changed',
        'Vendor Assigned',
        'Booking Created',
        'Booking Confirmed',
        'Booking Completed',
        'Review Submitted',
        'Review Approved',
        'Announcement',
        'Invoice Generated',
        'Payment Received',
        'Rental Approved',
        'Rental Rejected',
        'Emergency Alert',
        'System Notification',
    ];

    public const PRIORITIES = ['Low', 'Medium', 'High', 'Emergency'];

    public static function createForUsers(array $userIds, array $payload): array
    {
        $uniqueUserIds = array_values(array_unique(array_filter(array_map('intval', $userIds), fn (int $id) => $id > 0)));
        if ($uniqueUserIds === []) {
            return [];
        }

        $created = [];
        foreach ($uniqueUserIds as $userId) {
            $created[] = Notification::create([
                'user_id' => $userId,
                'title' => (string) $payload['title'],
                'message' => (string) $payload['message'],
                'type' => (string) $payload['type'],
                'category' => (string) $payload['category'],
                'priority' => (string) ($payload['priority'] ?? 'Medium'),
                'is_read' => 0,
                'action_url' => $payload['action_url'] ?? null,
                'reference_type' => $payload['reference_type'] ?? null,
                'reference_id' => isset($payload['reference_id']) ? (int) $payload['reference_id'] : null,
                'created_by' => isset($payload['created_by']) ? (int) $payload['created_by'] : null,
            ]);
        }

        return $created;
    }

    public static function resolveRecipients(array $payload): array
    {
        $userIds = [];

        if (!empty($payload['user_id'])) {
            $userIds[] = (int) $payload['user_id'];
        }
        foreach (($payload['user_ids'] ?? []) as $id) {
            $userIds[] = (int) $id;
        }

        $roles = [];
        if (!empty($payload['role'])) {
            $roles[] = (string) $payload['role'];
        }
        foreach (($payload['roles'] ?? []) as $role) {
            $roles[] = (string) $role;
        }
        $roles = array_values(array_unique(array_filter($roles)));

        if ($roles !== []) {
            $placeholders = [];
            $params = ['active_status' => 'active'];
            foreach ($roles as $index => $role) {
                $key = 'role_' . $index;
                $placeholders[] = ':' . $key;
                $params[$key] = $role;
            }

            $sql = 'SELECT id FROM users WHERE deleted_at IS NULL AND status = :active_status AND role IN (' . implode(',', $placeholders) . ')';
            if (!empty($payload['office_id'])) {
                $sql .= ' AND office_id = :office_id';
                $params['office_id'] = (int) $payload['office_id'];
            }

            foreach (Database::fetchAll($sql, $params) as $row) {
                $userIds[] = (int) $row['id'];
            }
        }

        if ($userIds === []) {
            $sql = 'SELECT id FROM users WHERE deleted_at IS NULL AND status = :active_status';
            $params = ['active_status' => 'active'];
            if (!empty($payload['office_id'])) {
                $sql .= ' AND office_id = :office_id';
                $params['office_id'] = (int) $payload['office_id'];
            }

            foreach (Database::fetchAll($sql, $params) as $row) {
                $userIds[] = (int) $row['id'];
            }
        }

        return array_values(array_unique(array_filter($userIds)));
    }

    public static function notifyComplaintCreated(array $complaint, ?int $actorUserId = null): void
    {
        $recipients = self::adminAndSecurityUserIds();
        if (!empty($complaint['tenant_id'])) {
            $recipients[] = (int) $complaint['tenant_id'];
        }

        self::createForUsers($recipients, [
            'title' => 'New complaint submitted',
            'message' => sprintf('%s complaint "%s" was created.', (string) ($complaint['priority'] ?? 'Low'), (string) ($complaint['subject'] ?? 'Untitled complaint')),
            'type' => 'Complaint Created',
            'category' => 'Complaint',
            'priority' => $complaint['priority'] ?? 'Medium',
            'action_url' => '/complaints',
            'reference_type' => 'complaint',
            'reference_id' => $complaint['id'] ?? null,
            'created_by' => $actorUserId,
        ]);
    }

    public static function notifyComplaintAssigned(array $complaint, ?int $actorUserId = null): void
    {
        $recipients = self::adminAndSecurityUserIds();
        if (!empty($complaint['tenant_id'])) {
            $recipients[] = (int) $complaint['tenant_id'];
        }

        self::createForUsers($recipients, [
            'title' => 'Complaint assigned',
            'message' => sprintf('Complaint "%s" was assigned to a vendor.', (string) ($complaint['subject'] ?? 'Untitled complaint')),
            'type' => 'Complaint Assigned',
            'category' => 'Complaint',
            'priority' => $complaint['priority'] ?? 'Medium',
            'action_url' => '/complaints',
            'reference_type' => 'complaint',
            'reference_id' => $complaint['id'] ?? null,
            'created_by' => $actorUserId,
        ]);

        self::createForUsers($recipients, [
            'title' => 'Vendor assigned',
            'message' => sprintf('A vendor was assigned for complaint "%s".', (string) ($complaint['subject'] ?? 'Untitled complaint')),
            'type' => 'Vendor Assigned',
            'category' => 'Vendor',
            'priority' => $complaint['priority'] ?? 'Medium',
            'action_url' => '/complaints',
            'reference_type' => 'complaint',
            'reference_id' => $complaint['id'] ?? null,
            'created_by' => $actorUserId,
        ]);
    }

    public static function notifyComplaintStatusChanged(array $complaint, string $status, ?int $actorUserId = null): void
    {
        $recipients = self::adminAndSecurityUserIds();
        if (!empty($complaint['tenant_id'])) {
            $recipients[] = (int) $complaint['tenant_id'];
        }

        self::createForUsers($recipients, [
            'title' => 'Complaint status updated',
            'message' => sprintf('Complaint "%s" is now %s.', (string) ($complaint['subject'] ?? 'Untitled complaint'), $status),
            'type' => 'Complaint Status Changed',
            'category' => 'Complaint',
            'priority' => $complaint['priority'] ?? 'Medium',
            'action_url' => '/complaints',
            'reference_type' => 'complaint',
            'reference_id' => $complaint['id'] ?? null,
            'created_by' => $actorUserId,
        ]);
    }

    public static function notifyMaintenanceRequestCreated(array $maintenanceRequest, ?int $actorUserId = null): void
    {
        $recipients = self::adminAndSecurityUserIds();
        if (!empty($maintenanceRequest['tenant_id'])) {
            $recipients[] = (int) $maintenanceRequest['tenant_id'];
        }

        self::createForUsers($recipients, [
            'title' => 'New maintenance request submitted',
            'message' => sprintf('%s maintenance request "%s" was created.', (string) ($maintenanceRequest['priority'] ?? 'Low'), (string) ($maintenanceRequest['title'] ?? 'Untitled request')),
            'type' => 'Maintenance Request Created',
            'category' => 'Maintenance',
            'priority' => $maintenanceRequest['priority'] ?? 'Medium',
            'action_url' => '/maintenance',
            'reference_type' => 'maintenance_request',
            'reference_id' => $maintenanceRequest['id'] ?? null,
            'created_by' => $actorUserId,
        ]);
    }

    public static function notifyMaintenanceRequestAssigned(array $maintenanceRequest, ?int $actorUserId = null): void
    {
        $recipients = self::adminAndSecurityUserIds();
        if (!empty($maintenanceRequest['tenant_id'])) {
            $recipients[] = (int) $maintenanceRequest['tenant_id'];
        }

        self::createForUsers($recipients, [
            'title' => 'Maintenance request assigned',
            'message' => sprintf('Maintenance request "%s" has been assigned.', (string) ($maintenanceRequest['title'] ?? 'Untitled request')),
            'type' => 'Maintenance Request Assigned',
            'category' => 'Maintenance',
            'priority' => $maintenanceRequest['priority'] ?? 'Medium',
            'action_url' => '/maintenance',
            'reference_type' => 'maintenance_request',
            'reference_id' => $maintenanceRequest['id'] ?? null,
            'created_by' => $actorUserId,
        ]);
    }

    public static function notifyMaintenanceRequestStatusChanged(array $maintenanceRequest, string $status, ?int $actorUserId = null): void
    {
        $recipients = self::adminAndSecurityUserIds();
        if (!empty($maintenanceRequest['tenant_id'])) {
            $recipients[] = (int) $maintenanceRequest['tenant_id'];
        }

        self::createForUsers($recipients, [
            'title' => 'Maintenance request status updated',
            'message' => sprintf('Maintenance request "%s" is now %s.', (string) ($maintenanceRequest['title'] ?? 'Untitled request'), $status),
            'type' => 'Maintenance Request Status Changed',
            'category' => 'Maintenance',
            'priority' => $maintenanceRequest['priority'] ?? 'Medium',
            'action_url' => '/maintenance',
            'reference_type' => 'maintenance_request',
            'reference_id' => $maintenanceRequest['id'] ?? null,
            'created_by' => $actorUserId,
        ]);
    }

    public static function notifyBookingCreated(array $booking, ?int $actorUserId = null): void
    {
        $recipients = self::adminAndSecurityUserIds();
        if (!empty($booking['user_id'])) {
            $recipients[] = (int) $booking['user_id'];
        }

        self::createForUsers($recipients, [
            'title' => 'New vendor booking requested',
            'message' => sprintf('Booking "%s" has been requested.', (string) ($booking['title'] ?? 'Untitled booking')),
            'type' => 'Booking Created',
            'category' => 'Vendor',
            'priority' => 'Medium',
            'action_url' => '/vendors',
            'reference_type' => 'vendor_booking',
            'reference_id' => $booking['id'] ?? null,
            'created_by' => $actorUserId,
        ]);
    }

    public static function notifyBookingStatusChanged(array $booking, string $status, ?int $actorUserId = null): void
    {
        $recipients = self::adminAndSecurityUserIds();
        if (!empty($booking['user_id'])) {
            $recipients[] = (int) $booking['user_id'];
        }

        $type = $status === 'Completed' ? 'Booking Completed' : ($status === 'Confirmed' ? 'Booking Confirmed' : 'Booking Created');
        self::createForUsers($recipients, [
            'title' => 'Vendor booking updated',
            'message' => sprintf('Booking "%s" is now %s.', (string) ($booking['title'] ?? 'Untitled booking'), $status),
            'type' => $type,
            'category' => 'Vendor',
            'priority' => 'Medium',
            'action_url' => '/vendors',
            'reference_type' => 'vendor_booking',
            'reference_id' => $booking['id'] ?? null,
            'created_by' => $actorUserId,
        ]);
    }

    public static function notifyReviewSubmitted(array $review, ?int $actorUserId = null): void
    {
        self::createForUsers(self::adminAndSecurityUserIds(), [
            'title' => 'New vendor review submitted',
            'message' => sprintf('A %d-star review was submitted and awaits moderation.', (int) ($review['rating'] ?? 0)),
            'type' => 'Review Submitted',
            'category' => 'Vendor',
            'priority' => 'Low',
            'action_url' => '/vendors',
            'reference_type' => 'vendor_review',
            'reference_id' => $review['id'] ?? null,
            'created_by' => $actorUserId,
        ]);
    }

    public static function notifyReviewApproved(array $review, ?int $actorUserId = null): void
    {
        $recipients = [];
        if (!empty($review['user_id'])) {
            $recipients[] = (int) $review['user_id'];
        }
        if ($recipients === []) {
            return;
        }

        self::createForUsers($recipients, [
            'title' => 'Your review was approved',
            'message' => 'Your vendor review is now published.',
            'type' => 'Review Approved',
            'category' => 'Vendor',
            'priority' => 'Low',
            'action_url' => '/vendors',
            'reference_type' => 'vendor_review',
            'reference_id' => $review['id'] ?? null,
            'created_by' => $actorUserId,
        ]);
    }

    public static function notifyVisitorEntered(array $visitor, ?int $actorUserId = null): void
    {
        $recipients = self::adminAndSecurityUserIds();
        $recipients = array_merge($recipients, self::tenantUserIdsForOffice($visitor['office_id'] ?? null));

        self::createForUsers($recipients, [
            'title' => 'Visitor entered',
            'message' => sprintf('%s checked in to visit %s.', (string) ($visitor['name'] ?? 'A visitor'), (string) ($visitor['company_name'] ?? 'the building')),
            'type' => 'Visitor Entry',
            'category' => 'Visitor',
            'priority' => 'Medium',
            'action_url' => '/visitors/manage',
            'reference_type' => 'visitor',
            'reference_id' => $visitor['id'] ?? null,
            'created_by' => $actorUserId,
        ]);
    }

    public static function notifyVisitorExited(array $visitor, ?int $actorUserId = null): void
    {
        $recipients = self::adminAndSecurityUserIds();
        $recipients = array_merge($recipients, self::tenantUserIdsForOffice($visitor['office_id'] ?? null));

        self::createForUsers($recipients, [
            'title' => 'Visitor exited',
            'message' => sprintf('%s checked out.', (string) ($visitor['name'] ?? 'A visitor')),
            'type' => 'Visitor Exit',
            'category' => 'Visitor',
            'priority' => 'Low',
            'action_url' => '/visitors/manage',
            'reference_type' => 'visitor',
            'reference_id' => $visitor['id'] ?? null,
            'created_by' => $actorUserId,
        ]);
    }

    public static function notifyInvoiceGenerated(array $invoice, ?int $actorUserId = null): void
    {
        $recipients = self::adminUserIds();
        $recipients = array_merge($recipients, self::tenantUserIdsForOffice($invoice['office_id'] ?? null));

        self::createForUsers($recipients, [
            'title' => 'Invoice generated',
            'message' => sprintf('Invoice %s was generated for %.2f.', (string) ($invoice['invoice_no'] ?? 'N/A'), (float) ($invoice['amount'] ?? 0)),
            'type' => 'Invoice Generated',
            'category' => 'Finance',
            'priority' => 'High',
            'action_url' => '/financials',
            'reference_type' => 'invoice',
            'reference_id' => $invoice['id'] ?? null,
            'created_by' => $actorUserId,
        ]);
    }

    public static function notifyPaymentReceived(array $invoice, float $amount, ?int $actorUserId = null): void
    {
        $recipients = self::adminUserIds();
        $recipients = array_merge($recipients, self::tenantUserIdsForOffice($invoice['office_id'] ?? null));

        self::createForUsers($recipients, [
            'title' => 'Payment received',
            'message' => sprintf('Payment of %.2f was recorded for invoice %s.', $amount, (string) ($invoice['invoice_no'] ?? 'N/A')),
            'type' => 'Payment Received',
            'category' => 'Finance',
            'priority' => 'Medium',
            'action_url' => '/financials',
            'reference_type' => 'invoice',
            'reference_id' => $invoice['id'] ?? null,
            'created_by' => $actorUserId,
        ]);
    }

    public static function notifyMaintenanceReminder(array $task, ?int $actorUserId = null): void
    {
        self::createForUsers(self::adminAndSecurityUserIds(), [
            'title' => 'Maintenance reminder scheduled',
            'message' => sprintf('%s is scheduled for %s.', (string) ($task['description'] ?? 'Maintenance task'), (string) ($task['scheduled_date'] ?? 'upcoming date')),
            'type' => 'Maintenance Reminder',
            'category' => 'Maintenance',
            'priority' => 'Medium',
            'action_url' => '/utilities',
            'reference_type' => 'utility_task',
            'reference_id' => $task['id'] ?? null,
            'created_by' => $actorUserId,
        ]);
    }

    private static function adminUserIds(): array
    {
        return array_map(fn (array $row) => (int) $row['id'], Database::fetchAll(
            "SELECT id FROM users WHERE role = 'admin' AND status = 'active' AND deleted_at IS NULL"
        ));
    }

    private static function adminAndSecurityUserIds(): array
    {
        return array_map(fn (array $row) => (int) $row['id'], Database::fetchAll(
            "SELECT id FROM users WHERE role IN ('admin', 'security') AND status = 'active' AND deleted_at IS NULL"
        ));
    }

    private static function tenantUserIdsForOffice(mixed $officeId): array
    {
        if (!$officeId) {
            return [];
        }

        return array_map(fn (array $row) => (int) $row['id'], Database::fetchAll(
            "SELECT id FROM users WHERE role = 'tenant' AND office_id = :office_id AND status = 'active' AND deleted_at IS NULL",
            ['office_id' => (int) $officeId]
        ));
    }
}
