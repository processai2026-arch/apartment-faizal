<?php

declare(strict_types=1);

class TenantAnnouncementController
{
    public function index(Request $request): void
    {
        Announcement::publishDue();
        $request->query['status'] = 'Published';
        $request->query['audience'] = ucfirst($request->user['role'] ?? 'tenant');
        [$rows, $total, $page, $perPage] = Announcement::list($request);
        $userId = (int) $request->user['id'];
        foreach ($rows as &$row) {
            $row['is_read'] = (bool) Database::fetch(
                'SELECT id FROM announcement_reads WHERE announcement_id = :aid AND user_id = :uid LIMIT 1',
                ['aid' => $row['id'], 'uid' => $userId]
            );
        }
        Response::paginated($rows, $total, $page, $perPage);
    }

    public function show(Request $request): void
    {
        Announcement::publishDue();
        $ann = Announcement::find((int) $request->params['id']);
        if (!$ann || $ann['status'] !== 'Published') {
            throw new AppException('Announcement not found', 404);
        }
        $userId = (int) $request->user['id'];
        $ann['is_read'] = (bool) Database::fetch(
            'SELECT id FROM announcement_reads WHERE announcement_id = :aid AND user_id = :uid LIMIT 1',
            ['aid' => $ann['id'], 'uid' => $userId]
        );
        Announcement::markRead((int) $ann['id'], $userId);
        $ann['is_read'] = true;
        Response::success($ann);
    }

    public function markRead(Request $request): void
    {
        $ann = Announcement::find((int) $request->params['id']);
        if (!$ann) {
            throw new AppException('Announcement not found', 404);
        }
        Announcement::markRead((int) $ann['id'], (int) $request->user['id']);
        Response::success(['read' => true]);
    }

    public function unreadCount(Request $request): void
    {
        $audience = ucfirst($request->user['role'] ?? 'tenant');
        $count = Announcement::unreadCount((int) $request->user['id'], $audience);
        Response::success(['count' => $count]);
    }
}
