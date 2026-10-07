<?php
namespace App\Core;

use PDO;

final class Database
{
    private static ?PDO $pdo = null;

    public static function connection(): PDO
    {
        if (self::$pdo) return self::$pdo;

        $host = Container::config('db.host');
        $port = Container::config('db.port');
        $name = Container::config('db.name');
        $user = Container::config('db.user');
        $password = Container::config('db.password');

        self::$pdo = new PDO(
            "mysql:host={$host};port={$port};dbname={$name};charset=utf8mb4",
            $user,
            $password,
            [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            ]
        );

        self::ensureSchema(self::$pdo);

        return self::$pdo;
    }

    private static function ensureSchema(PDO $pdo): void
    {
        try {
            $pdo->query("SELECT 1 FROM sites LIMIT 1");
        } catch (\Throwable) {
            $schemaFile = dirname(__DIR__, 2) . '/database/schema.sql';
            if (file_exists($schemaFile)) {
                $sql = file_get_contents($schemaFile);
                if ($sql) {
                    $pdo->exec($sql);
                }
            }
        }
    }
}
