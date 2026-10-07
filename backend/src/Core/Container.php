<?php
namespace App\Core;

final class Container
{
    private static array $config = [];

    public static function setConfig(array $config): void
    {
        self::$config = $config;
    }

    public static function config(string $key): mixed
    {
        $value = self::$config;
        foreach (explode('.', $key) as $part) {
            $value = $value[$part] ?? null;
        }
        return $value;
    }
}
