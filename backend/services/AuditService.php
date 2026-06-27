<?php

declare(strict_types=1);

class AuditService
{
    public static function log(?int $userId, string $action, string $entityType, ?int $entityId = null, array $metadata = []): void
    {
        Database::query(
            'INSERT INTO audit_logs (user_id, action, entity_type, entity_id, ip_address, user_agent, metadata, created_at)
             VALUES (:user_id, :action, :entity_type, :entity_id, :ip_address, :user_agent, :metadata, :created_at)',
            [
                'user_id' => $userId,
                'action' => $action,
                'entity_type' => $entityType,
                'entity_id' => $entityId,
                'ip_address' => $_SERVER['REMOTE_ADDR'] ?? null,
                'user_agent' => substr($_SERVER['HTTP_USER_AGENT'] ?? '', 0, 255),
                'metadata' => json_encode($metadata, JSON_UNESCAPED_SLASHES),
                'created_at' => db_time(),
            ]
        );
    }
}
