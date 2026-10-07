<?php
namespace App\Core;

final class Router
{
    private array $routes = [];

    public function get(string $path, mixed $handler): void { $this->add('GET', $path, $handler); }
    public function post(string $path, mixed $handler): void { $this->add('POST', $path, $handler); }
    public function put(string $path, mixed $handler): void { $this->add('PUT', $path, $handler); }
    public function delete(string $path, mixed $handler): void { $this->add('DELETE', $path, $handler); }

    private function add(string $method, string $path, mixed $handler): void
    {
        $this->routes[] = compact('method', 'path', 'handler');
    }

    public function dispatch(Request $request, Response $response): void
    {
        if ($request->method() === 'OPTIONS') {
            Response::sendCorsHeaders();
            http_response_code(204);
            return;
        }

        foreach ($this->routes as $route) {
            if ($route['method'] !== $request->method()) continue;

            $pattern = preg_replace('#\{id\}#', '(\d+)', $route['path']);
            $pattern = preg_replace('#\{([a-zA-Z_][a-zA-Z0-9_]*)\}#', '([^/]+)', $pattern);
            if (!preg_match('#^' . $pattern . '$#', $request->path(), $matches)) continue;

            array_shift($matches);
            $handler = $route['handler'];

            if (is_array($handler)) {
                [$class, $method] = $handler;
                $controller = new $class();
                $result = $controller->$method($request, ...$matches);
            } else {
                $result = $handler($request, ...$matches);
            }

            if ($result instanceof Response) $result->send();
            return;
        }

        Response::json(['error' => 'Route introuvable', 'path' => $request->path()], 404)->send();
    }
}
