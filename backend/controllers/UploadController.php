<?php

declare(strict_types=1);

class UploadController
{
    public function store(Request $request): void
    {
        if (!isset($request->files['file'])) {
            throw new AppException('File is required', 422);
        }
        $module = (string) ($request->input('module', 'general'));
        $attachment = (new FileStore())->store($request->files['file'], $module, (int) $request->user['id']);
        AuditService::log((int) $request->user['id'], 'attachment.upload', 'attachment', (int) $attachment['id'], ['module' => $module]);
        Response::success($attachment, 'Uploaded', 201);
    }
}
