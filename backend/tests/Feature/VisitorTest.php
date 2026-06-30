<?php

declare(strict_types=1);

use PHPUnit\Framework\TestCase;

/**
 * Feature tests for the /admin/visitors/* endpoints.
 *
 * Requires a running server (default http://127.0.0.1:8010) seeded with
 * the default users. Uses the security role for visitor entry/checkout
 * (matching the endpoint_security_test.php integration suite).
 *
 * Run before executing:
 *   php -S 127.0.0.1:8010 public/index.php &
 *   php scripts/seed.php
 */
final class VisitorTest extends TestCase
{
    private string $baseUrl;
    private string $securityToken = '';
    private string $adminToken = '';

    protected function setUp(): void
    {
        $this->baseUrl = rtrim((string)(getenv('OFFICEGATE_BASE_URL') ?: 'http://127.0.0.1:8010'), '/');
        $this->securityToken = $this->login('security@officegate.com', 'ChangeMe@12345');
        $this->adminToken    = $this->login('admin@officegate.com', 'ChangeMe@12345');
    }

    // ─── Helpers ───────────────────────────────────────────────────────────────

    private function login(string $email, string $password): string
    {
        $res = $this->httpJson('POST', '/auth/login', compact('email', 'password'));
        return $res['json']['data']['accessToken'] ?? '';
    }

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

    public function testCreateVisitorEntryReturns201(): void
    {
        self::assertNotEmpty($this->securityToken, 'Security login must succeed');

        $suffix = time() . random_int(100, 999);
        $res = $this->httpJson('POST', '/admin/visitors/entry', [
            'name'         => 'PHPUnit Visitor ' . $suffix,
            'phone'        => '+9188' . random_int(10000000, 99999999),
            'block'        => 'TEST BLOCK',
            'floor_number' => 'T-' . $suffix,
            'company_name' => 'PHPUnit Co ' . $suffix,
            'whom_to_meet' => 'Test Manager',
            'reason'       => 'PHPUnit test entry',
        ], $this->securityToken);

        self::assertSame(201, $res['status']);
        self::assertTrue($res['json']['success'] ?? false);
        self::assertNotEmpty($res['json']['data']['id'] ?? '');
        self::assertSame('Inside', $res['json']['data']['status'] ?? '');
    }

    public function testActiveVisitorListReturnsOnlyInsideVisitors(): void
    {
        self::assertNotEmpty($this->securityToken, 'Security login must succeed');

        $res = $this->httpJson('GET', '/admin/visitors/active', [], $this->securityToken);

        self::assertSame(200, $res['status']);
        self::assertTrue($res['json']['success'] ?? false);

        $rows = $res['json']['data'] ?? [];
        foreach ($rows as $visitor) {
            self::assertSame('Inside', $visitor['status'] ?? '', 'Active list must only return Inside visitors');
        }
    }

    public function testVisitorCheckoutSetsStatusExited(): void
    {
        self::assertNotEmpty($this->securityToken, 'Security login must succeed');

        // Create a visitor to check out
        $suffix = time() . random_int(100, 999);
        $create = $this->httpJson('POST', '/admin/visitors/entry', [
            'name'         => 'Checkout Visitor ' . $suffix,
            'phone'        => '+9177' . random_int(10000000, 99999999),
            'block'        => 'TEST BLOCK',
            'floor_number' => 'C-' . $suffix,
            'company_name' => 'Checkout Co',
            'whom_to_meet' => 'Checkout Host',
            'reason'       => 'Checkout test',
        ], $this->securityToken);

        self::assertSame(201, $create['status']);
        $visitorId = (string)($create['json']['data']['id'] ?? '');
        self::assertNotEmpty($visitorId);

        // Checkout
        $checkout = $this->httpJson('POST', "/admin/visitors/{$visitorId}/checkout", [], $this->securityToken);
        self::assertSame(200, $checkout['status']);

        // Re-fetch and confirm status
        $show = $this->httpJson('GET', "/admin/visitors/{$visitorId}", [], $this->adminToken);
        self::assertSame(200, $show['status']);
        self::assertSame('Exited', $show['json']['data']['status'] ?? '');
    }

    public function testDoubleCheckoutIsRejected(): void
    {
        self::assertNotEmpty($this->securityToken);

        $suffix = time() . random_int(100, 999);
        $create = $this->httpJson('POST', '/admin/visitors/entry', [
            'name'         => 'Double Checkout ' . $suffix,
            'phone'        => '+9166' . random_int(10000000, 99999999),
            'block'        => 'TEST BLOCK',
            'floor_number' => 'D-' . $suffix,
            'company_name' => 'DC Co',
            'whom_to_meet' => 'Host',
            'reason'       => 'Double checkout test',
        ], $this->securityToken);

        $visitorId = (string)($create['json']['data']['id'] ?? '');
        $this->httpJson('POST', "/admin/visitors/{$visitorId}/checkout", [], $this->securityToken);

        // Second checkout must fail with 409 Conflict
        $second = $this->httpJson('POST', "/admin/visitors/{$visitorId}/checkout", [], $this->securityToken);
        self::assertSame(409, $second['status']);
    }
}
