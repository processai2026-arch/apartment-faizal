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
