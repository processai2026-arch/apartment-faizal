<?php

declare(strict_types=1);

abstract class NotificationController
{
    public function index(Request $request): void
    {
        $userId = (int) $request->user['id'];
        [$rows, $total, $page, $perPage] = Notification::listForUser($request, $userId);
        Response::success($rows, 'OK', 200, [
            'pagination' => [
                'page' => $page,
                'perPage' => $perPage,
                'total' => $total,
                'totalPages' => (int) ceil($total / max(1, $perPage)),
            ],
            'summary' => Notification::summaryForUser($userId),
        ]);
    }

    public function show(Request $request): void
    {
        $row = Notification::findForUser((int) $request->params['id'], (int) $request->user['id']);
        if (!$row) {
            throw new AppException('Notification not found', 404);
        }

        Response::success($row);
    }

    public function markRead(Request $request): void
    {
        $row = Notification::markRead((int) $request->params['id'], (int) $request->user['id']);
        Response::success($row, 'Notification marked as read');
    }

    public function markAllRead(Request $request): void
    {
        $count = Notification::markAllRead((int) $request->user['id']);
        Response::success(['updated' => $count], 'All notifications marked as read');
    }

    public function destroy(Request $request): void
    {
        $row = Notification::softDeleteForUser((int) $request->params['id'], (int) $request->user['id']);
        AuditService::log((int) $request->user['id'], 'notification.delete', 'notification', (int) $row['id']);
        Response::success(['id' => $row['id']], 'Deleted');
    }
}
