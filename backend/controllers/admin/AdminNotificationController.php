<?php

declare(strict_types=1);

class AdminNotificationController extends NotificationController
{
    public function store(Request $request): void
    {
        Validator::require($request->all(), ['title', 'message', 'type', 'category']);
        $type = Validator::enum((string) $request->input('type'), NotificationService::TYPES, 'type');
        $priority = Validator::enum((string) ($request->input('priority') ?: 'Medium'), NotificationService::PRIORITIES, 'priority');

        $recipients = NotificationService::resolveRecipients($request->all());
        if ($recipients === []) {
            throw new AppException('No notification recipients resolved', 422);
        }

        $rows = NotificationService::createForUsers($recipients, [
            'title' => (string) $request->input('title'),
            'message' => (string) $request->input('message'),
            'type' => $type,
            'category' => (string) $request->input('category'),
            'priority' => $priority,
            'action_url' => $request->input('action_url'),
            'reference_type' => $request->input('reference_type'),
            'reference_id' => $request->input('reference_id'),
            'created_by' => (int) $request->user['id'],
        ]);

        AuditService::log((int) $request->user['id'], 'notification.create', 'notification', null, [
            'type' => $type,
            'category' => (string) $request->input('category'),
            'recipient_count' => count($rows),
        ]);

        Response::success(['items' => $rows, 'created' => count($rows)], 'Created', 201);
    }
}
