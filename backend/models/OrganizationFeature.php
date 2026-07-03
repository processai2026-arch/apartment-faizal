<?php

declare(strict_types=1);

/**
 * Per-organization feature entitlements.
 *
 * Effective rule (default-ON): a feature is ENABLED for an org when either a row
 * exists with enabled=1 OR no row exists at all for that (org, key). Only an
 * explicit enabled=0 row disables it. This keeps organizations provisioned
 * before a new feature shipped fully functional until a super admin narrows them.
 */
class OrganizationFeature
{
    private const TABLE = 'organization_features';

    /**
     * Enabled feature keys for an organization, restricted to keys the registry
     * still knows about (stale rows for removed keys are ignored).
     *
     * @return array<int, string>
     */
    public static function enabledFor(int $orgId): array
    {
        $overrides = self::overrides($orgId);
        $enabled = [];
        foreach (FeatureRegistry::keys() as $key) {
            // default-ON: absent → enabled; present → honour the stored flag.
            if (($overrides[$key] ?? true) === true) {
                $enabled[] = $key;
            }
        }
        return $enabled;
    }

    public static function isEnabled(int $orgId, string $key): bool
    {
        if (!FeatureRegistry::has($key)) {
            // Unknown keys are treated as always-on core; never gate them here.
            return true;
        }
        $row = Database::fetch(
            'SELECT enabled FROM ' . self::TABLE . ' WHERE org_id = :org_id AND feature_key = :feature_key LIMIT 1',
            ['org_id' => $orgId, 'feature_key' => $key]
        );
        if (!$row) {
            return true; // default-ON
        }
        return (int) $row['enabled'] === 1;
    }

    /**
     * {key => bool} for ALL registry keys (default-ON applied).
     *
     * @return array<string, bool>
     */
    public static function mapFor(int $orgId): array
    {
        $overrides = self::overrides($orgId);
        $map = [];
        foreach (FeatureRegistry::keys() as $key) {
            $map[$key] = ($overrides[$key] ?? true) === true;
        }
        return $map;
    }

    /**
     * Upsert explicit rows for the supplied {key => bool} map. Unknown keys are
     * silently ignored so a stale client payload can never create junk rows.
     *
     * @param array<string, mixed> $map
     */
    public static function setForOrg(int $orgId, array $map): void
    {
        $now = db_time();
        $driver = Database::driver();
        foreach ($map as $key => $value) {
            if (!FeatureRegistry::has((string) $key)) {
                continue;
            }
            $enabled = (int) (bool) $value;
            if ($driver === 'mysql') {
                Database::query(
                    'INSERT INTO ' . self::TABLE . ' (org_id, feature_key, enabled, created_at, updated_at)
                     VALUES (:org_id, :feature_key, :enabled, :created_at, :updated_at)
                     ON DUPLICATE KEY UPDATE enabled = VALUES(enabled), updated_at = VALUES(updated_at)',
                    ['org_id' => $orgId, 'feature_key' => $key, 'enabled' => $enabled, 'created_at' => $now, 'updated_at' => $now]
                );
            } else {
                Database::query(
                    'INSERT INTO ' . self::TABLE . ' (org_id, feature_key, enabled, created_at, updated_at)
                     VALUES (:org_id, :feature_key, :enabled, :created_at, :updated_at)
                     ON CONFLICT(org_id, feature_key) DO UPDATE SET enabled = excluded.enabled, updated_at = excluded.updated_at',
                    ['org_id' => $orgId, 'feature_key' => $key, 'enabled' => $enabled, 'created_at' => $now, 'updated_at' => $now]
                );
            }
        }
    }

    /**
     * Seed enabled=1 rows for every registry key that has no row yet. Called on
     * organization creation and by the seeder for the default org.
     */
    public static function seedDefaults(int $orgId): void
    {
        $existing = array_keys(self::overrides($orgId));
        $now = db_time();
        foreach (FeatureRegistry::keys() as $key) {
            if (in_array($key, $existing, true)) {
                continue;
            }
            Database::query(
                sql_insert_ignore() . ' INTO ' . self::TABLE . ' (org_id, feature_key, enabled, created_at, updated_at)
                 VALUES (:org_id, :feature_key, 1, :created_at, :updated_at)',
                ['org_id' => $orgId, 'feature_key' => $key, 'created_at' => $now, 'updated_at' => $now]
            );
        }
    }

    /**
     * Explicit stored overrides for an org as {key => bool}, keyed only by rows
     * that actually exist.
     *
     * @return array<string, bool>
     */
    private static function overrides(int $orgId): array
    {
        $rows = Database::fetchAll(
            'SELECT feature_key, enabled FROM ' . self::TABLE . ' WHERE org_id = :org_id',
            ['org_id' => $orgId]
        );
        $map = [];
        foreach ($rows as $row) {
            $map[(string) $row['feature_key']] = (int) $row['enabled'] === 1;
        }
        return $map;
    }
}
