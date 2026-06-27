<?php

declare(strict_types=1);

if (PHP_SAPI !== 'cli') {
    http_response_code(404);
    exit;
}

require_once dirname(__DIR__) . '/core/bootstrap.php';

if (Database::driver() !== 'mysql') {
    fwrite(STDERR, "DB_DRIVER must be mysql for production restores.\n");
    exit(1);
}

$input = $argv[1] ?? '';
if ($input === '') {
    fwrite(STDERR, "Usage: php scripts/restore_mysql.php path/to/backup.sql\n");
    exit(1);
}

$inputPath = realpath(str_starts_with($input, '/') ? $input : BASE_PATH . '/' . $input);
if (!$inputPath || !is_file($inputPath)) {
    fwrite(STDERR, "Backup file not found: {$input}\n");
    exit(1);
}

$cfg = config('database.mysql');
if (config('app.env') === 'production' && !in_array('--confirm-production-restore', $argv, true)) {
    fwrite(STDERR, "Refusing production restore without --confirm-production-restore.\n");
    fwrite(STDERR, "Target: {$cfg['host']}:{$cfg['port']} database={$cfg['database']} user={$cfg['username']}\n");
    exit(1);
}

$command = [
    'mysql',
    '--default-character-set=utf8mb4',
    '-h', (string) $cfg['host'],
    '-P', (string) $cfg['port'],
    '-u', (string) $cfg['username'],
    (string) $cfg['database'],
];

$env = array_merge($_ENV, ['MYSQL_PWD' => (string) $cfg['password']]);
$process = proc_open($command, [
    0 => ['file', $inputPath, 'r'],
    1 => ['pipe', 'w'],
    2 => ['pipe', 'w'],
], $pipes, BASE_PATH, $env);

if (!is_resource($process)) {
    fwrite(STDERR, "Could not start mysql restore.\n");
    exit(1);
}

stream_get_contents($pipes[1]);
fclose($pipes[1]);
$stderr = stream_get_contents($pipes[2]);
fclose($pipes[2]);
$exitCode = proc_close($process);
if ($exitCode !== 0) {
    fwrite(STDERR, trim($stderr) . PHP_EOL);
    exit($exitCode);
}

echo "restore complete: {$inputPath}\n";
