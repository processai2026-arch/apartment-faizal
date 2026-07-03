<?php

declare(strict_types=1);

class AdminDocumentController
{
    public function index(Request $request): void
    {
        [$rows, $total, $page, $perPage] = Document::list($request);
        $rows = array_map([self::class, 'withAttachment'], $rows);
        Response::paginated($rows, $total, $page, $perPage);
    }

    public function show(Request $request): void
    {
        $document = Document::find((int) $request->params['id']);
        if (!$document) {
            throw new AppException('Document not found', 404);
        }
        Response::success(self::withAttachment($document));
    }

    public function store(Request $request): void
    {
        Validator::require($request->all(), ['title', 'category', 'attachment_id']);
        Validator::enum((string) $request->input('category'), Document::CATEGORIES, 'category');
        if ($request->input('status') !== null && $request->input('status') !== '') {
            Validator::enum((string) $request->input('status'), Document::STATUSES, 'status');
        }

        $attachmentId = (int) $request->input('attachment_id');
        $attachment = Database::fetch('SELECT * FROM attachments WHERE id = :id', ['id' => $attachmentId]);
        if (!$attachment) {
            throw new AppException('Attachment not found — upload the file first', 422);
        }

        $document = Document::create([
            'doc_no'        => Document::nextDocNo(),
            'title'         => $request->input('title'),
            'category'      => $request->input('category'),
            'office_id'     => $request->input('office_id') ? (int) $request->input('office_id') : null,
            'attachment_id' => $attachmentId,
            'file_name'     => $request->input('file_name') ?: ($attachment['original_name'] ?? null),
            'expiry_date'   => $request->input('expiry_date') ?: null,
            'tags'          => $request->input('tags') ?: null,
            'status'        => $request->input('status') ?: 'Active',
            'uploaded_by'   => (int) $request->user['id'],
            'notes'         => $request->input('notes') ?: null,
        ]);
        AuditService::log((int) $request->user['id'], 'document.create', 'document', (int) $document['id']);
        Response::success(self::withAttachment($document), 'Document stored', 201);
    }

    public function update(Request $request): void
    {
        $document = Document::find((int) $request->params['id']);
        if (!$document) {
            throw new AppException('Document not found', 404);
        }
        if ($request->input('category') !== null) {
            Validator::enum((string) $request->input('category'), Document::CATEGORIES, 'category');
        }
        if ($request->input('status') !== null) {
            Validator::enum((string) $request->input('status'), Document::STATUSES, 'status');
        }

        $data = array_filter([
            'title'         => $request->input('title'),
            'category'      => $request->input('category'),
            'office_id'     => $request->input('office_id') !== null ? ($request->input('office_id') ? (int) $request->input('office_id') : null) : null,
            'attachment_id' => $request->input('attachment_id') ? (int) $request->input('attachment_id') : null,
            'file_name'     => $request->input('file_name'),
            'expiry_date'   => $request->input('expiry_date'),
            'tags'          => $request->input('tags'),
            'status'        => $request->input('status'),
            'notes'         => $request->input('notes'),
        ], fn ($v) => $v !== null);

        $updated = Document::update((int) $document['id'], $data);
        AuditService::log((int) $request->user['id'], 'document.update', 'document', (int) $updated['id']);
        Response::success(self::withAttachment($updated), 'Document updated');
    }

    public function destroy(Request $request): void
    {
        $document = Document::find((int) $request->params['id']);
        if (!$document) {
            throw new AppException('Document not found', 404);
        }
        Document::softDelete((int) $document['id']);
        AuditService::log((int) $request->user['id'], 'document.delete', 'document', (int) $document['id']);
        Response::success([], 'Document removed');
    }

    /** GET /admin/documents/summary — dashboard totals. */
    public function summary(Request $request): void
    {
        $total = (int) (Database::fetch(
            'SELECT COUNT(*) AS c FROM documents WHERE deleted_at IS NULL'
        )['c'] ?? 0);

        $officeDocs = (int) (Database::fetch(
            "SELECT COUNT(*) AS c FROM documents WHERE deleted_at IS NULL AND category = 'Office Documents'"
        )['c'] ?? 0);

        $expiringSoon = (int) (Database::fetch(
            "SELECT COUNT(*) AS c FROM documents
             WHERE deleted_at IS NULL AND status <> 'Archived'
               AND expiry_date IS NOT NULL AND expiry_date <> ''
               AND " . sql_date('expiry_date') . ' >= :today
               AND ' . sql_date('expiry_date') . ' <= :boundary',
            ['today' => date('Y-m-d'), 'boundary' => date('Y-m-d', strtotime('+30 day'))]
        )['c'] ?? 0);

        $expired = (int) (Database::fetch(
            "SELECT COUNT(*) AS c FROM documents
             WHERE deleted_at IS NULL
               AND expiry_date IS NOT NULL AND expiry_date <> ''
               AND " . sql_date('expiry_date') . ' < :today',
            ['today' => date('Y-m-d')]
        )['c'] ?? 0);

        $byCategory = Database::fetchAll(
            'SELECT category, COUNT(*) AS count FROM documents
             WHERE deleted_at IS NULL GROUP BY category'
        );

        Response::success([
            'total'         => $total,
            'office_docs'   => $officeDocs,
            'expiring_soon' => $expiringSoon,
            'expired'       => $expired,
            'by_category'   => $byCategory,
        ]);
    }

    /** Enrich a document row with attachment file metadata for view/download. */
    private static function withAttachment(array $document): array
    {
        $document['attachment'] = null;
        if (!empty($document['attachment_id'])) {
            $attachment = Database::fetch(
                'SELECT id, original_name, stored_path, mime_type, size_bytes FROM attachments WHERE id = :id',
                ['id' => (int) $document['attachment_id']]
            );
            if ($attachment) {
                $document['attachment'] = $attachment;
            }
        }
        return $document;
    }
}
