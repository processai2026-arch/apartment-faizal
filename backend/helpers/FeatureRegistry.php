<?php

declare(strict_types=1);

/**
 * Canonical per-organization feature registry.
 *
 * Every key here is toggleable per organization from the Super Admin portal.
 * ALWAYS-ON core surfaces (auth, dashboard, users, offices, notifications,
 * profile, change-password, UI settings, secretary management, public QR scan)
 * are intentionally NOT listed — they are never gated. Super-admin-only tooling
 * (business ads, ad billing, /super/*) is gated by RoleMiddleware, not here.
 *
 * The effective-enabled rule (see OrganizationFeature) is default-ON: a feature
 * is enabled for an org unless an explicit organization_features row disables it.
 */
class FeatureRegistry
{
    /**
     * Ordered catalog. Each entry: key, label, group, roles (comma list of the
     * roles for which the module surfaces in navigation).
     *
     * @var array<int, array{key:string,label:string,group:string,roles:string}>
     */
    private const FEATURES = [
        ['key' => 'visitors',           'label' => 'Visitor Management',      'group' => 'Security & Access', 'roles' => 'admin,security'],
        ['key' => 'vehicles',           'label' => 'Vehicle & Gate Access',   'group' => 'Security & Access', 'roles' => 'admin,security'],
        ['key' => 'cctv',               'label' => 'CCTV',                    'group' => 'Security & Access', 'roles' => 'admin,security'],
        ['key' => 'daily_workers',      'label' => 'Daily Workers',           'group' => 'Security & Access', 'roles' => 'admin,security'],
        ['key' => 'staff',              'label' => 'Staff Attendance',        'group' => 'Operations',        'roles' => 'admin'],
        ['key' => 'payroll',            'label' => 'Payroll',                 'group' => 'Operations',        'roles' => 'admin'],
        ['key' => 'medical',            'label' => 'Medical Reports',         'group' => 'Operations',        'roles' => 'admin'],
        ['key' => 'inventory',          'label' => 'Inventory & Audit',       'group' => 'Operations',        'roles' => 'admin'],
        ['key' => 'assets',             'label' => 'Asset Tracking',          'group' => 'Operations',        'roles' => 'admin'],
        ['key' => 'utilities',          'label' => 'Utility Management',      'group' => 'Operations',        'roles' => 'admin'],
        ['key' => 'daily_ops',          'label' => 'Daily Operations',        'group' => 'Operations',        'roles' => 'admin'],
        ['key' => 'amc',                'label' => 'AMC & DG',                'group' => 'Operations',        'roles' => 'admin'],
        ['key' => 'documents',          'label' => 'Documents',               'group' => 'Operations',        'roles' => 'admin'],
        ['key' => 'name_transfers',     'label' => 'Name Transfer',           'group' => 'Operations',        'roles' => 'admin'],
        ['key' => 'finance',            'label' => 'Financials & Payments',   'group' => 'Finance',           'roles' => 'admin'],
        ['key' => 'expenses',           'label' => 'Office Expenses',         'group' => 'Finance',           'roles' => 'admin'],
        ['key' => 'compliance',         'label' => 'Accounts & Compliance',   'group' => 'Finance',           'roles' => 'admin'],
        ['key' => 'reports',            'label' => 'Reports',                 'group' => 'Finance',           'roles' => 'admin'],
        ['key' => 'analytics',          'label' => 'Community Analytics',     'group' => 'Finance',           'roles' => 'admin'],
        ['key' => 'complaints',         'label' => 'Complaints',              'group' => 'Community',         'roles' => 'admin,tenant'],
        ['key' => 'maintenance',        'label' => 'Maintenance',             'group' => 'Community',         'roles' => 'admin,tenant'],
        ['key' => 'rental',             'label' => 'Rental Marketplace',      'group' => 'Community',         'roles' => 'admin,tenant'],
        ['key' => 'announcements',      'label' => 'Announcements',           'group' => 'Community',         'roles' => 'admin,tenant'],
        ['key' => 'events',             'label' => 'Community Events',        'group' => 'Community',         'roles' => 'admin,tenant'],
        ['key' => 'emergency_contacts', 'label' => 'Emergency Contacts',      'group' => 'Community',         'roles' => 'admin,tenant,security'],
        ['key' => 'vendors',            'label' => 'Vendor Management',       'group' => 'Community',         'roles' => 'admin'],
        ['key' => 'vendor_marketplace', 'label' => 'Vendor Marketplace',      'group' => 'Community',         'roles' => 'admin,tenant'],
        ['key' => 'subscriptions',      'label' => 'Subscription (own plan)', 'group' => 'Community',         'roles' => 'admin,tenant'],
        ['key' => 'iot',                'label' => 'IoT Monitoring',          'group' => 'Automation',        'roles' => 'admin'],
        ['key' => 'home_automation',    'label' => 'Home Automation',         'group' => 'Automation',        'roles' => 'admin,tenant'],
        ['key' => 'whatsapp',           'label' => 'WhatsApp Hub',            'group' => 'Community',         'roles' => 'admin'],
    ];

    /**
     * Full catalog with roles exploded into arrays — the shape returned by
     * GET /super/features/catalog.
     *
     * @return array<int, array{key:string,label:string,group:string,roles:array<int,string>}>
     */
    public static function catalog(): array
    {
        return array_map(static function (array $feature): array {
            return [
                'key'   => $feature['key'],
                'label' => $feature['label'],
                'group' => $feature['group'],
                'roles' => array_values(array_filter(array_map('trim', explode(',', $feature['roles'])))),
            ];
        }, self::FEATURES);
    }

    /**
     * All feature keys, in registry order.
     *
     * @return array<int, string>
     */
    public static function keys(): array
    {
        return array_map(static fn (array $feature): string => $feature['key'], self::FEATURES);
    }

    public static function has(string $key): bool
    {
        return in_array($key, self::keys(), true);
    }
}
