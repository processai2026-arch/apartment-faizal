<?php

declare(strict_types=1);

define('BASE_PATH', dirname(__DIR__));
define('STORAGE_PATH', BASE_PATH . '/storage');

$composerAutoload = BASE_PATH . '/vendor/autoload.php';
if (is_file($composerAutoload)) {
    require_once $composerAutoload;
}

spl_autoload_register(function (string $class): void {
    $paths = [
        BASE_PATH . '/core/' . $class . '.php',
        BASE_PATH . '/helpers/' . $class . '.php',
        BASE_PATH . '/middleware/' . $class . '.php',
        BASE_PATH . '/models/' . $class . '.php',
        BASE_PATH . '/services/' . $class . '.php',
        BASE_PATH . '/controllers/' . $class . '.php',
        BASE_PATH . '/controllers/admin/' . $class . '.php',
    ];

    foreach ($paths as $path) {
        if (is_file($path)) {
            require_once $path;
            return;
        }
    }
});

function env(string $key, mixed $default = null): mixed
{
    static $loaded = false;

    if (!$loaded) {
        $file = BASE_PATH . '/.env';
        if (is_file($file)) {
            foreach (file($file, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES) ?: [] as $line) {
                $line = trim($line);
                if ($line === '' || str_starts_with($line, '#') || !str_contains($line, '=')) {
                    continue;
                }
                [$name, $value] = explode('=', $line, 2);
                $name = trim($name);
                $value = trim($value);
                if ((str_starts_with($value, '"') && str_ends_with($value, '"')) || (str_starts_with($value, "'") && str_ends_with($value, "'"))) {
                    $value = substr($value, 1, -1);
                }
                $_ENV[$name] = $value;
            }
        }
        $loaded = true;
    }

    return $_ENV[$key] ?? getenv($key) ?: $default;
}

function config(string $key, mixed $default = null): mixed
{
    static $configs = [];

    [$file, $path] = array_pad(explode('.', $key, 2), 2, null);
    if (!isset($configs[$file])) {
        $configFile = BASE_PATH . '/config/' . $file . '.php';
        $configs[$file] = is_file($configFile) ? require $configFile : [];
    }

    if ($path === null) {
        return $configs[$file] ?? $default;
    }

    $value = $configs[$file] ?? [];
    foreach (explode('.', $path) as $segment) {
        if (!is_array($value) || !array_key_exists($segment, $value)) {
            return $default;
        }
        $value = $value[$segment];
    }

    return $value;
}

function db_time(?int $timestamp = null): string
{
    $timestamp ??= time();
    return Database::driver() === 'mysql' ? date('Y-m-d H:i:s', $timestamp) : date('c', $timestamp);
}

/**
 * Driver-aware SQL fragments. Raw SQL in controllers/models must run on both
 * SQLite (local/tests) and MySQL/MariaDB (production); these helpers emit the
 * correct dialect for date/aggregation expressions.
 */
function sql_month(string $column): string
{
    return Database::driver() === 'mysql'
        ? "DATE_FORMAT($column, '%Y-%m')"
        : "strftime('%Y-%m', $column)";
}

function sql_month_now(): string
{
    return Database::driver() === 'mysql'
        ? "DATE_FORMAT(NOW(), '%Y-%m')"
        : "strftime('%Y-%m', 'now')";
}

function sql_current_date(): string
{
    return Database::driver() === 'mysql' ? 'CURDATE()' : "date('now')";
}

function sql_date(string $column): string
{
    return Database::driver() === 'mysql' ? "DATE($column)" : "date($column)";
}

/** Hours elapsed between two datetime columns ($from -> $to). */
function sql_hours_between(string $from, string $to): string
{
    return Database::driver() === 'mysql'
        ? "TIMESTAMPDIFF(SECOND, $from, $to) / 3600.0"
        : "(julianday($to) - julianday($from)) * 24";
}

/** Day of week for a datetime column, normalized to 0=Sunday..6=Saturday. */
function sql_dow(string $column): string
{
    return Database::driver() === 'mysql'
        ? "(DAYOFWEEK($column) - 1)"
        : "CAST(strftime('%w', $column) AS INTEGER)";
}

/** INSERT that silently skips unique-constraint duplicates. */
function sql_insert_ignore(): string
{
    return Database::driver() === 'mysql' ? 'INSERT IGNORE' : 'INSERT OR IGNORE';
}

/** Date expression for N months before today. */
function sql_months_ago(int $months): string
{
    return Database::driver() === 'mysql'
        ? "DATE_SUB(CURDATE(), INTERVAL $months MONTH)"
        : "date('now', '-$months months')";
}

date_default_timezone_set(config('app.timezone', 'UTC'));

set_exception_handler(function (Throwable $e): void {
    $debug = (bool) config('app.debug', false);
    if (!is_dir(STORAGE_PATH . '/logs')) {
        mkdir(STORAGE_PATH . '/logs', 0775, true);
    }
    error_log('[' . db_time() . '] ' . $e . PHP_EOL, 3, STORAGE_PATH . '/logs/app.log');

    $status = $e instanceof AppException ? $e->status : 500;
    $message = $e instanceof AppException || $debug ? $e->getMessage() : 'Internal server error';
    $errors = $e instanceof AppException ? $e->context : [];
    if ($debug && !$errors) {
        $errors = ['exception' => get_class($e)];
    }
    Response::error($message, $status, $errors);
});
