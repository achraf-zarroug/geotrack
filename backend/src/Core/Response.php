<?php
namespace App\Core;

final class Response
{
    public function __construct(private array $data = [], private int $status = 200) {}

    public static function json(array $data, int $status = 200): self
    {
        return new self($data, $status);
    }

    public function send(): void
    {
        http_response_code($this->status);
        self::sendCorsHeaders();
        header('Content-Type: application/json; charset=utf-8');
        echo json_encode($this->data, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
    }

    public static function sendCorsHeaders(): void
    {
        $allowed = Container::config('cors.allowed_origins') ?: '*';
        $origin = $_SERVER['HTTP_ORIGIN'] ?? '';

        if ($allowed === '*') {
            header('Access-Control-Allow-Origin: *');
        } else {
            $allowedList = array_map('trim', explode(',', $allowed));
            if ($origin && in_array($origin, $allowedList, true)) {
                header("Access-Control-Allow-Origin: {$origin}");
                header('Vary: Origin');
            } elseif (!empty($allowedList)) {
                header("Access-Control-Allow-Origin: {$allowedList[0]}");
                header('Vary: Origin');
            }
        }

        header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
        header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');
        header('Access-Control-Max-Age: 86400');
    }
}
