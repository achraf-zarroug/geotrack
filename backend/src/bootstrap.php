<?php
declare(strict_types=1);

// Charge Composer autoload si disponible
$composerAutoload = dirname(__DIR__) . '/vendor/autoload.php';
if (file_exists($composerAutoload)) {
    require $composerAutoload;
}

// Autoloader PSR-4 natif pour l'espace de noms App\
spl_autoload_register(function (string $class): void {
    $prefix = 'App\\';
    if (!str_starts_with($class, $prefix)) return;
    $file = dirname(__DIR__) . '/src/' . str_replace('\\', '/', substr($class, strlen($prefix))) . '.php';
    if (is_file($file)) require $file;
});

date_default_timezone_set('Africa/Tunis');

$config = [
    'app' => [
        'env' => getenv('APP_ENV') ?: 'local',
        'url' => getenv('APP_URL') ?: 'http://localhost:5173',
    ],
    'db' => [
        'host' => getenv('DB_HOST') ?: '127.0.0.1',
        'port' => getenv('DB_PORT') ?: '3306',
        'name' => getenv('DB_NAME') ?: getenv('DB_DATABASE') ?: 'geotrack',
        'user' => getenv('DB_USER') ?: getenv('DB_USERNAME') ?: 'root',
        'password' => getenv('DB_PASSWORD') !== false ? getenv('DB_PASSWORD') : '',
    ],
    'elasticsearch' => [
        'host' => getenv('ELASTICSEARCH_HOST') ?: getenv('ELASTICSEARCH_URL') ?: 'http://127.0.0.1:9200',
        'user' => getenv('ELASTICSEARCH_USER') ?: null,
        'password' => getenv('ELASTICSEARCH_PASSWORD') ?: null,
        'api_key' => getenv('ELASTICSEARCH_API_KEY') ?: null,
    ],
    'cors' => [
        'allowed_origins' => getenv('CORS_ALLOWED_ORIGINS') ?: '*',
    ]
];

App\Core\Container::setConfig($config);
