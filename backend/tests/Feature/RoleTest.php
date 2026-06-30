<?php

declare(strict_types=1);

use PHPUnit\Framework\TestCase;

/**
 * Feature tests verifying that role-based access control is enforced correctly.
 *
 * Rules tested:
 *  - /admin/* routes require the 'admin' role; tenant and security are rejected with 403
 *  - /tenant/* routes require the 'tenant' role; admin and security are rejected with 403
 *  - /security/* routes require the 'security' role; tenant is rejected with 403
 *
 * Requires a running server (default http://127.0.0.1:8010) seeded with
 * the default users. Run before executing:
 *   php -S 127.0.0.1:8010 public/index.php &
 *   php scripts/seed.php
 */
final class RoleTest extends TestCase
{
    private string $baseUrl;
    private string $adminToken    = '';
    private string $securityToken = '';
    private string $tenantToken   = '';

    protected function setUp(): void
    {
        $this->baseUrl       = rtrim((string)(getenv('OFFICEGATE_BASE_URL') ?: 'http://127.0.0.1:8010'), '/');
        $this->adminToken    = $this->login('admin@officegate.com', 'ChangeMe@12345');
        $this->securityToken = $this->login('security@officegate.com', 'ChangeMe@12345');
        $this->tenantToken   = $this->login('tenant@officegate.com', 'ChangeMe@12345');
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

    // ─── Admin route protection ────────────────────────────────────────────────

    public function testAdminOfficeListRequiresAdminRole(): void
    {
        self::assertNotEmpty($this->adminToken, 'Admin login must succeed');

        // Admin succeeds
        $res = $this->httpJson('GET', '/admin/offices', [], $this->adminToken);
        self::assertSame(200, $res['status'], 'Admin should access /admin/offices');
    }

    public function testTenantTokenRejectedOnAdminRoute(): void
    {
        self::assertNotEmpty($this->tenantToken, 'Tenant login must succeed');

        $res = $this->httpJson('GET', '/admin/offices', [], $this->tenantToken);
        self::assertSame(403, $res['status'], 'Tenant must be forbidden from /admin/offices');
    }

    public function testSecurityTokenRejectedOnAdminOnlyRoute(): void
    {
        self::assertNotEmpty($this->securityToken, 'Security login must succeed');

        // /admin/offices is admin-only (RoleMiddleware:admin)
        $res = $this->httpJson('GET', '/admin/offices', [], $this->securityToken);
        self::assertSame(403, $res['status'], 'Security must be forbidden from admin-only /admin/offices');
    }

    // ─── Tenant route protection ───────────────────────────────────────────────

    public function testTenantDashboardRequiresTenantRole(): void
    {
        self::assertNotEmpty($this->tenantToken);

        $res = $this->httpJson('GET', '/tenant/dashboard', [], $this->tenantToken);
        self::assertSame(200, $res['status'], 'Tenant should access /tenant/dashboard');
    }

    public function testAdminTokenRejectedOnTenantDashboard(): void
    {
        self::assertNotEmpty($this->adminToken);

        $res = $this->httpJson('GET', '/tenant/dashboard', [], $this->adminToken);
        self::assertSame(403, $res['status'], 'Admin must be forbidden from /tenant/dashboard');
    }

    public function testSecurityTokenRejectedOnTenantRoute(): void
    {
        self::assertNotEmpty($this->securityToken);

        $res = $this->httpJson('GET', '/tenant/dashboard', [], $this->securityToken);
        self::assertSame(403, $res['status'], 'Security must be forbidden from /tenant/dashboard');
    }

    // ─── Security route protection ─────────────────────────────────────────────

    public function testSecurityDashboardRequiresSecurityRole(): void
    {
        self::assertNotEmpty($this->securityToken);

        $res = $this->httpJson('GET', '/security/dashboard', [], $this->securityToken);
        self::assertSame(200, $res['status'], 'Security user should access /security/dashboard');
    }

    public function testAdminCanAccessSecurityDashboard(): void
    {
        // RoleMiddleware:security,admin allows both
        self::assertNotEmpty($this->adminToken);

        $res = $this->httpJson('GET', '/security/dashboard', [], $this->adminToken);
        self::assertSame(200, $res['status'], 'Admin should also be allowed on /security/dashboard');
    }

    public function testTenantTokenRejectedOnSecurityDashboard(): void
    {
        self::assertNotEmpty($this->tenantToken);

        $res = $this->httpJson('GET', '/security/dashboard', [], $this->tenantToken);
        self::assertSame(403, $res['status'], 'Tenant must be forbidden from /security/dashboard');
    }

    // ─── Unauthenticated access ─────────────────────────────────────────────────

    public function testUnauthenticatedRequestReturns401(): void
    {
        $res = $this->httpJson('GET', '/admin/offices');
        self::assertSame(401, $res['status'], 'Missing token must return 401');
    }
}
