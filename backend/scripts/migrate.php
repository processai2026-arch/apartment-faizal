<?php

declare(strict_types=1);

if (PHP_SAPI !== 'cli') {
    http_response_code(404);
    exit;
}

require_once dirname(__DIR__) . '/core/bootstrap.php';

if (Database::driver() !== 'sqlite') {
    fwrite(STDERR, "The PHP migration runner is SQLite-only. Import database/officegate_production.sql for MySQL.\n");
    exit(1);
}

$pdo = Database::pdo();
$pdo->exec('CREATE TABLE IF NOT EXISTS migrations (id INTEGER PRIMARY KEY AUTOINCREMENT, migration TEXT NOT NULL UNIQUE, ran_at TEXT NOT NULL)');

$files = glob(BASE_PATH . '/database/migrations/*.sql') ?: [];
sort($files);

foreach ($files as $file) {
    $name = basename($file);
    $ran = Database::fetch('SELECT id FROM migrations WHERE migration = :migration', ['migration' => $name]);
    if ($ran) {
        echo "skip {$name}\n";
        continue;
    }
    $sql = file_get_contents($file);
    Database::transaction(function () use ($pdo, $sql, $name): void {
        $pdo->exec($sql);
        Database::query('INSERT INTO migrations (migration, ran_at) VALUES (:migration, :ran_at)', [
            'migration' => $name,
            'ran_at' => db_time(),
        ]);
    });
    echo "ran {$name}\n";
}
