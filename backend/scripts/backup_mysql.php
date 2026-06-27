<?php

declare(strict_types=1);

if (PHP_SAPI !== 'cli') {
    http_response_code(404);
    exit;
}

require_once dirname(__DIR__) . '/core/bootstrap.php';

if (Database::driver() !== 'mysql') {
    fwrite(STDERR, "DB_DRIVER must be mysql for production backups.\n");
    exit(1);
}

$cfg = config('database.mysql');
$output = $argv[1] ?? STORAGE_PATH . '/backups/officegate-' . date('Ymd-His') . '.sql';
$outputPath = str_starts_with($output, '/') ? $output : BASE_PATH . '/' . $output;
$outputDir = dirname($outputPath);
if (!is_dir($outputDir)) {
    mkdir($outputDir, 0770, true);
}

$command = [
    'mysqldump',
    '--single-transaction',
    '--routines',
    '--triggers',
    '--default-character-set=utf8mb4',
    '-h', (string) $cfg['host'],
    '-P', (string) $cfg['port'],
    '-u', (string) $cfg['username'],
    (string) $cfg['database'],
];

$env = array_merge($_ENV, ['MYSQL_PWD' => (string) $cfg['password']]);
$process = proc_open($command, [
    1 => ['file', $outputPath, 'w'],
    2 => ['pipe', 'w'],
], $pipes, BASE_PATH, $env);

if (!is_resource($process)) {
    fwrite(STDERR, "Could not start mysqldump.\n");
    exit(1);
}

$stderr = stream_get_contents($pipes[2]);
fclose($pipes[2]);
$exitCode = proc_close($process);
if ($exitCode !== 0) {
    @unlink($outputPath);
    fwrite(STDERR, trim($stderr) . PHP_EOL);
    exit($exitCode);
}

chmod($outputPath, 0600);
echo "backup written: {$outputPath}\n";
