<?php

declare(strict_types=1);

class Request
{
    public array $params = [];
    public ?array $user = null;
    private array $body = [];

    public function __construct(
        public string $method,
        public string $path,
        public array $query,
        public array $headers,
        public array $files,
        string $rawBody
    ) {
        $this->body = $this->parseBody($rawBody);
    }

    public static function capture(): self
    {
        $method = strtoupper($_SERVER['REQUEST_METHOD'] ?? 'GET');
        $uri = parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH) ?: '/';
        $path = '/' . trim($uri, '/');
        if ($path === '/api') {
            $path = '/';
        } elseif (str_starts_with($path, '/api/')) {
            $path = substr($path, 4);
        }
        if ($path === '/') {
            $path = '/';
        }

        $length = (int) ($_SERVER['CONTENT_LENGTH'] ?? 0);
        $max = str_starts_with($_SERVER['CONTENT_TYPE'] ?? '', 'multipart/form-data') ? 10485760 : 8388608;
        if ($length > $max) {
            throw new AppException('Request body is too large', 413);
        }

        return new self($method, $path, $_GET, self::headers(), $_FILES, file_get_contents('php://input') ?: '');
    }

    public function all(): array
    {
        return $this->body;
    }

    public function input(string $key, mixed $default = null): mixed
    {
        return $this->body[$key] ?? $default;
    }

    public function only(array $keys): array
    {
        return array_intersect_key($this->body, array_flip($keys));
    }

    public function bearerToken(): ?string
    {
        $header = $this->headers['authorization'] ?? '';
        if (preg_match('/^Bearer\s+(.+)$/i', $header, $m)) {
            return trim($m[1]);
        }
        return null;
    }

    public function ip(): string
    {
        $remote = $_SERVER['REMOTE_ADDR'] ?? '';
        if ($this->isTrustedProxy($remote)) {
            foreach (['HTTP_CF_CONNECTING_IP', 'HTTP_X_FORWARDED_FOR'] as $key) {
                $value = $_SERVER[$key] ?? null;
                if ($value) {
                    $ip = trim(explode(',', $value)[0]);
                    if (filter_var($ip, FILTER_VALIDATE_IP)) {
                        return $ip;
                    }
                }
            }
        }

        return filter_var($remote, FILTER_VALIDATE_IP) ? $remote : '0.0.0.0';
    }

    private function parseBody(string $rawBody): array
    {
        if (!empty($_POST)) {
            return $_POST;
        }
        if ($rawBody === '') {
            return [];
        }

        $contentType = strtolower($_SERVER['CONTENT_TYPE'] ?? '');
        if (str_contains($contentType, 'application/json') || $contentType === '') {
            $decoded = json_decode($rawBody, true);
            if (json_last_error() !== JSON_ERROR_NONE) {
                throw new AppException('Invalid JSON request body', 400);
            }
            return is_array($decoded) ? $decoded : [];
        }

        parse_str($rawBody, $data);
        return is_array($data) ? $data : [];
    }

    private static function headers(): array
    {
        $headers = [];
        foreach ($_SERVER as $key => $value) {
            if (str_starts_with($key, 'HTTP_')) {
                $name = strtolower(str_replace('_', '-', substr($key, 5)));
                $headers[$name] = $value;
            }
        }
        if (isset($_SERVER['CONTENT_TYPE'])) {
            $headers['content-type'] = $_SERVER['CONTENT_TYPE'];
        }
        return $headers;
    }

    private function isTrustedProxy(string $remote): bool
    {
        if (!filter_var($remote, FILTER_VALIDATE_IP)) {
            return false;
        }

        foreach (config('app.trusted_proxies', []) as $proxy) {
            if ($proxy === '*') {
                return true;
            }
            if ($proxy === $remote || (str_contains($proxy, '/') && self::ipInCidr($remote, $proxy))) {
                return true;
            }
        }

        return false;
    }

    private static function ipInCidr(string $ip, string $cidr): bool
    {
        [$network, $bits] = array_pad(explode('/', $cidr, 2), 2, null);
        if ($network === null || $bits === null || !ctype_digit($bits)) {
            return false;
        }

        $ipBin = inet_pton($ip);
        $networkBin = inet_pton($network);
        if ($ipBin === false || $networkBin === false || strlen($ipBin) !== strlen($networkBin)) {
            return false;
        }

        $bitCount = (int) $bits;
        $maxBits = strlen($ipBin) * 8;
        if ($bitCount < 0 || $bitCount > $maxBits) {
            return false;
        }

        $bytes = intdiv($bitCount, 8);
        $remainingBits = $bitCount % 8;
        if ($bytes > 0 && substr($ipBin, 0, $bytes) !== substr($networkBin, 0, $bytes)) {
            return false;
        }
        if ($remainingBits === 0) {
            return true;
        }

        $mask = (0xff << (8 - $remainingBits)) & 0xff;
        return (ord($ipBin[$bytes]) & $mask) === (ord($networkBin[$bytes]) & $mask);
    }
}
