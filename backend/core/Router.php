<?php

declare(strict_types=1);

class Router
{
    private array $routes = [];

    public function get(string $path, array $handler, array $middleware = []): void { $this->add('GET', $path, $handler, $middleware); }
    public function post(string $path, array $handler, array $middleware = []): void { $this->add('POST', $path, $handler, $middleware); }
    public function put(string $path, array $handler, array $middleware = []): void { $this->add('PUT', $path, $handler, $middleware); }
    public function patch(string $path, array $handler, array $middleware = []): void { $this->add('PATCH', $path, $handler, $middleware); }
    public function delete(string $path, array $handler, array $middleware = []): void { $this->add('DELETE', $path, $handler, $middleware); }

    public function dispatch(Request $request): void
    {
        $allowed = [];
        foreach ($this->routes as $route) {
            $params = $this->match($route['path'], $request->path);
            if ($params === null) {
                continue;
            }
            if ($route['method'] !== $request->method) {
                $allowed[] = $route['method'];
                continue;
            }

            $request->params = $params;
            foreach ($route['middleware'] as $middleware) {
                $this->runMiddleware($middleware, $request);
            }

            [$class, $method] = $route['handler'];
            (new $class())->$method($request);
            return;
        }

        if ($allowed) {
            header('Allow: ' . implode(', ', array_unique($allowed)));
            Response::error('Method not allowed', 405);
        }
        Response::error('Route not found', 404);
    }

    private function add(string $method, string $path, array $handler, array $middleware): void
    {
        $this->routes[] = [
            'method' => $method,
            'path' => '/' . trim($path, '/'),
            'handler' => $handler,
            'middleware' => $middleware,
        ];
    }

    private function match(string $routePath, string $requestPath): ?array
    {
        $names = [];
        $pattern = preg_replace_callback('/\{([a-zA-Z_][a-zA-Z0-9_]*)\}/', function ($m) use (&$names) {
            $names[] = $m[1];
            return '([^/]+)';
        }, $routePath);

        if (!preg_match('#^' . $pattern . '$#', $requestPath, $matches)) {
            return null;
        }

        array_shift($matches);
        return array_combine($names, array_map('urldecode', $matches)) ?: [];
    }

    private function runMiddleware(string $middleware, Request $request): void
    {
        [$class, $argument] = array_pad(explode(':', $middleware, 2), 2, null);
        if (!class_exists($class)) {
            throw new AppException('Middleware not found: ' . $class, 500);
        }
        (new $class())->handle($request, $argument);
    }
}
