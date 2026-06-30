<?php

declare(strict_types=1);

use PHPUnit\Framework\TestCase;

/**
 * Feature tests for the /auth/* endpoints.
 *
 * These tests make real HTTP requests to a running server. Set the
 * OFFICEGATE_BASE_URL environment variable to target a different host
 * (default: http://127.0.0.1:8010). Run before executing:
 *   php -S 127.0.0.1:8010 public/index.php &
 *   php scripts/seed.php
 */
final class AuthTest extends TestCase
{
    private string $baseUrl;

    protected function setUp(): void
    {
        $this->baseUrl = rtrim((string)(getenv('OFFICEGATE_BASE_URL') ?: 'http://127.0.0.1:8010'), '/');
    }

    // ─── Helper ────────────────────────────────────────────────────────────────

    private function httpJson(string $method, string $path, array $body = [], ?string $token = null): array
    {
        $headers = ['Content-Type: application/json'];
        if ($token !== null) {
            $headers[] = "Authorization: Bearer {$token}";
        }

        $opts = [
            'http' => [
                'method'        => $method,
                'header'        => implode("\r\n", $headers),
                'content'       => $body ? json_encode($body) : null,
                'ignore_errors' => true,
                'timeout'       => 10,
            ],
        ];
        $raw = @file_get_contents($this->baseUrl . $path, false, stream_context_create($opts));
        $statusLine = $http_response_header[0] ?? 'HTTP/1.1 000';
        preg_match('/\s(\d{3})\s/', $statusLine, $m);

        return [
            'status' => (int)($m[1] ?? 0),
            'json'   => is_string($raw) ? (json_decode($raw, true) ?? []) : [],
        ];
    }

    // ─── Tests ─────────────────────────────────────────────────────────────────

    public function testLoginWithValidCredentialsReturnsToken(): void
    {
        $res = $this->httpJson('POST', '/auth/login', [
            'email'    => 'admin@officegate.com',
            'password' => 'ChangeMe@12345',
        ]);

        self::assertSame(200, $res['status']);
        self::assertTrue($res['json']['success'] ?? false);
        self::assertNotEmpty($res['json']['data']['accessToken'] ?? '');
        self::assertNotEmpty($res['json']['data']['refreshToken'] ?? '');
    }

    public function testLoginWithWrongPasswordReturns401(): void
    {
        $res = $this->httpJson('POST', '/auth/login', [
            'email'    => 'admin@officegate.com',
            'password' => 'completely-wrong-password',
        ]);

        self::assertSame(401, $res['status']);
        self::assertFalse($res['json']['success'] ?? true);
    }

    public function testLoginWithUnknownEmailReturns401(): void
    {
        $res = $this->httpJson('POST', '/auth/login', [
            'email'    => 'nobody@nowhere.com',
            'password' => 'ChangeMe@12345',
        ]);

        self::assertSame(401, $res['status']);
    }

    public function testMeWithValidTokenReturnsUserData(): void
    {
        // First log in to get a token
        $login = $this->httpJson('POST', '/auth/login', [
            'email'    => 'admin@officegate.com',
            'password' => 'ChangeMe@12345',
        ]);
        $token = $login['json']['data']['accessToken'] ?? '';
        self::assertNotEmpty($token, 'Login must succeed to test /auth/me');

        $res = $this->httpJson('GET', '/auth/me', [], $token);

        self::assertSame(200, $res['status']);
        self::assertSame('admin@officegate.com', $res['json']['data']['email'] ?? '');
        self::assertSame('admin', $res['json']['data']['role'] ?? '');
    }

    public function testMeWithNoTokenReturns401(): void
    {
        $res = $this->httpJson('GET', '/auth/me');

        self::assertSame(401, $res['status']);
    }

    public function testMeWithInvalidTokenReturns401(): void
    {
        $res = $this->httpJson('GET', '/auth/me', [], 'not-a-valid-token');

        self::assertSame(401, $res['status']);
    }

    public function testOtpSendReturns200(): void
    {
        $phone = '+9198' . random_int(10000000, 99999999);
        $res = $this->httpJson('POST', '/auth/otp/send', [
            'phone'   => $phone,
            'purpose' => 'visitor-entry',
        ]);

        self::assertSame(200, $res['status']);
        self::assertTrue($res['json']['success'] ?? false);
    }

    public function testRefreshTokenReturnsNewTokenPair(): void
    {
        $login = $this->httpJson('POST', '/auth/login', [
            'email'    => 'security@officegate.com',
            'password' => 'ChangeMe@12345',
        ]);
        $refreshToken = $login['json']['data']['refreshToken'] ?? '';
        self::assertNotEmpty($refreshToken);

        $res = $this->httpJson('POST', '/auth/refresh', ['refreshToken' => $refreshToken]);

        self::assertSame(200, $res['status']);
        self::assertNotEmpty($res['json']['data']['accessToken'] ?? '');
    }
}
