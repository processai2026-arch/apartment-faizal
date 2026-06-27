<?php

declare(strict_types=1);

class Database
{
    private static ?PDO $pdo = null;

    public static function pdo(): PDO
    {
        if (self::$pdo) {
            return self::$pdo;
        }

        $driver = config('database.driver', 'sqlite');
        if ($driver === 'sqlite') {
            $database = config('database.sqlite.database', 'storage/database.sqlite');
            $path = str_starts_with($database, '/') ? $database : BASE_PATH . '/' . $database;
            $dir = dirname($path);
            if (!is_dir($dir)) {
                mkdir($dir, 0775, true);
            }
            self::$pdo = new PDO('sqlite:' . $path);
        } elseif ($driver === 'mysql') {
            $cfg = config('database.mysql');
            if (!$cfg['database'] || !$cfg['username']) {
                throw new AppException('Database configuration is incomplete', 500);
            }
            $dsn = sprintf('mysql:host=%s;port=%d;dbname=%s;charset=%s', $cfg['host'], $cfg['port'], $cfg['database'], $cfg['charset']);
            self::$pdo = new PDO($dsn, $cfg['username'], $cfg['password']);
            self::$pdo->exec("SET time_zone = '+05:30'");
        } else {
            throw new AppException('Unsupported database driver', 500);
        }

        self::$pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
        self::$pdo->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
        self::$pdo->setAttribute(PDO::ATTR_EMULATE_PREPARES, false);

        return self::$pdo;
    }

    public static function driver(): string
    {
        return config('database.driver', 'sqlite');
    }

    public static function query(string $sql, array $params = []): PDOStatement
    {
        $stmt = self::pdo()->prepare($sql);
        $stmt->execute($params);
        return $stmt;
    }

    public static function fetch(string $sql, array $params = []): ?array
    {
        $row = self::query($sql, $params)->fetch();
        return $row ?: null;
    }

    public static function fetchAll(string $sql, array $params = []): array
    {
        return self::query($sql, $params)->fetchAll();
    }

    public static function insert(string $sql, array $params = []): int
    {
        self::query($sql, $params);
        return (int) self::pdo()->lastInsertId();
    }

    public static function transaction(callable $callback): mixed
    {
        $pdo = self::pdo();
        $pdo->beginTransaction();
        try {
            $result = $callback();
            $pdo->commit();
            return $result;
        } catch (Throwable $e) {
            $pdo->rollBack();
            throw $e;
        }
    }
}
