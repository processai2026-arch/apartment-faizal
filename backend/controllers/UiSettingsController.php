<?php

declare(strict_types=1);

class UiSettingsController
{
    public function show(Request $request): void
    {
        $page = (string) ($request->query['page'] ?? '');
        if ($page === '') {
            throw new AppException('Page key required', 422);
        }
        $row = Database::fetch('SELECT * FROM ui_settings WHERE user_id = :user_id AND page_key = :page_key', [
            'user_id' => $request->user['id'],
            'page_key' => $page,
        ]);
        Response::success($row ? json_decode($row['settings_json'], true) : null);
    }

    public function update(Request $request): void
    {
        Validator::require($request->all(), ['page', 'settings']);
        $settings = $request->input('settings');
        if (!is_array($settings)) {
            throw new AppException('Settings must be an object', 422);
        }
        $params = [
            'user_id' => $request->user['id'],
            'page_key' => (string) $request->input('page'),
            'settings_json' => json_encode($settings, JSON_UNESCAPED_SLASHES),
            'created_at' => db_time(),
            'updated_at' => db_time(),
        ];
        if (Database::driver() === 'mysql') {
            Database::query(
                'INSERT INTO ui_settings (user_id, page_key, settings_json, created_at, updated_at)
                 VALUES (:user_id, :page_key, :settings_json, :created_at, :updated_at)
                 ON DUPLICATE KEY UPDATE settings_json = VALUES(settings_json), updated_at = VALUES(updated_at)',
                $params
            );
        } else {
            Database::query(
                'INSERT INTO ui_settings (user_id, page_key, settings_json, created_at, updated_at)
                 VALUES (:user_id, :page_key, :settings_json, :created_at, :updated_at)
                 ON CONFLICT(user_id, page_key) DO UPDATE SET settings_json = excluded.settings_json, updated_at = excluded.updated_at',
                $params
            );
        }
        Response::success($settings, 'Settings saved');
    }
}
