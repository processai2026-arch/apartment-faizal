<?php

declare(strict_types=1);

class AdminAnnouncementController
{
    public function index(Request $request): void
    {
        [$rows, $total, $page, $perPage] = Announcement::list($request);
        Response::paginated($rows, $total, $page, $perPage);
    }

    public function show(Request $request): void
    {
        $ann = Announcement::find((int) $request->params['id']);
        if (!$ann) {
            throw new AppException('Announcement not found', 404);
        }
        $ann['read_count'] = (int) Database::fetch(
            'SELECT COUNT(*) AS c FROM announcement_reads WHERE announcement_id = :id',
            ['id' => $ann['id']]
        )['c'];
        Response::success($ann);
    }

    public function store(Request $request): void
    {
        Validator::require($request->all(), ['title', 'description']);
        Validator::maxLength((string) $request->input('title'), 255, 'title');
        Validator::maxLength((string) $request->input('description'), 10000, 'description');
        $priority = $request->input('priority') ?: 'Medium';
        Validator::enum($priority, Announcement::PRIORITIES, 'priority');

        $status = $request->input('publish_at') ? 'Scheduled' : 'Draft';
        if ($request->input('publish_now')) {
            $status = 'Published';
        }

        $ann = Announcement::create([
            'title'         => $request->input('title'),
            'description'   => $request->input('description'),
            'priority'      => $priority,
            'audience'      => $request->input('audience') ?: 'All',
            'attachment_id' => $request->input('attachment_id') ? (int) $request->input('attachment_id') : null,
            'publish_at'    => $request->input('publish_at') ?: null,
            'expires_at'    => $request->input('expires_at') ?: null,
            'status'        => $status,
            'created_by'    => (int) $request->user['id'],
        ]);

        AuditService::log((int) $request->user['id'], 'announcement.create', 'announcement', (int) $ann['id']);

        if ($ann['status'] === 'Published') {
            $this->sendNotifications($ann, (int) $request->user['id']);
        }

        Response::success($ann, 'Announcement created', 201);
    }

    public function update(Request $request): void
    {
        $ann = Announcement::find((int) $request->params['id']);
        if (!$ann) {
            throw new AppException('Announcement not found', 404);
        }

        if ($request->input('title') !== null) {
            Validator::maxLength((string) $request->input('title'), 255, 'title');
        }
        if ($request->input('description') !== null) {
            Validator::maxLength((string) $request->input('description'), 10000, 'description');
        }

        $updated = Announcement::update((int) $ann['id'], array_filter([
            'title'         => $request->input('title'),
            'description'   => $request->input('description'),
            'priority'      => $request->input('priority'),
            'audience'      => $request->input('audience'),
            'attachment_id' => $request->input('attachment_id') ? (int) $request->input('attachment_id') : null,
            'publish_at'    => $request->input('publish_at'),
            'expires_at'    => $request->input('expires_at'),
            'status'        => $request->input('status'),
        ], fn ($v) => $v !== null));

        AuditService::log((int) $request->user['id'], 'announcement.update', 'announcement', (int) $updated['id']);
        Response::success($updated, 'Announcement updated');
    }

    public function publish(Request $request): void
    {
        $ann = Announcement::update((int) $request->params['id'], ['status' => 'Published', 'publish_at' => db_time()]);
        AuditService::log((int) $request->user['id'], 'announcement.publish', 'announcement', (int) $ann['id']);
        $this->sendNotifications($ann, (int) $request->user['id']);
        Response::success($ann, 'Announcement published');
    }

    public function destroy(Request $request): void
    {
        $ann = Announcement::find((int) $request->params['id']);
        if (!$ann) {
            throw new AppException('Announcement not found', 404);
        }
        Announcement::softDelete((int) $ann['id']);
        AuditService::log((int) $request->user['id'], 'announcement.delete', 'announcement', (int) $ann['id']);
        Response::success([], 'Announcement deleted');
    }

    private function sendNotifications(array $ann, int $createdBy): void
    {
        $userIds = array_column(Database::fetchAll(
            "SELECT id FROM users WHERE deleted_at IS NULL AND status = 'active'"
        ), 'id');

        NotificationService::createForUsers($userIds, [
            'title'          => $ann['title'],
            'message'        => mb_substr((string) $ann['description'], 0, 200),
            'type'           => 'Announcement',
            'category'       => 'Announcement',
            'priority'       => $ann['priority'] ?? 'Medium',
            'reference_type' => 'announcement',
            'reference_id'   => $ann['id'],
            'created_by'     => $createdBy,
        ]);
    }
}
