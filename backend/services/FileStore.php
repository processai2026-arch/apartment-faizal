<?php

declare(strict_types=1);

class FileStore
{
    private array $allowed = [
        'image/jpeg' => 'jpg',
        'image/png' => 'png',
        'image/webp' => 'webp',
        'application/pdf' => 'pdf',
    ];

    public function store(array $file, string $module, ?int $userId = null): array
    {
        if (($file['error'] ?? UPLOAD_ERR_NO_FILE) !== UPLOAD_ERR_OK) {
            throw new AppException('Upload failed', 422);
        }
        if (($file['size'] ?? 0) > 5 * 1024 * 1024) {
            throw new AppException('File is too large', 422);
        }

        $mime = mime_content_type($file['tmp_name']);
        if (!isset($this->allowed[$mime])) {
            throw new AppException('Unsupported file type', 422);
        }

        $safeModule = preg_replace('/[^a-z0-9_-]/i', '', $module) ?: 'general';
        $relativeDir = 'uploads/' . $safeModule . '/' . date('Y/m');
        $dir = STORAGE_PATH . '/' . $relativeDir;
        if (!is_dir($dir)) {
            mkdir($dir, 0775, true);
        }

        $name = bin2hex(random_bytes(20)) . '.' . $this->allowed[$mime];
        $path = $dir . '/' . $name;
        if (!move_uploaded_file($file['tmp_name'], $path)) {
            throw new AppException('Could not store upload', 500);
        }

        $id = Database::insert(
            'INSERT INTO attachments (module, original_name, stored_path, mime_type, size_bytes, uploaded_by, created_at)
             VALUES (:module, :original_name, :stored_path, :mime_type, :size_bytes, :uploaded_by, :created_at)',
            [
                'module' => $safeModule,
                'original_name' => basename((string) $file['name']),
                'stored_path' => $relativeDir . '/' . $name,
                'mime_type' => $mime,
                'size_bytes' => (int) $file['size'],
                'uploaded_by' => $userId,
                'created_at' => db_time(),
            ]
        );

        return Database::fetch('SELECT * FROM attachments WHERE id = :id', ['id' => $id]);
    }
}
