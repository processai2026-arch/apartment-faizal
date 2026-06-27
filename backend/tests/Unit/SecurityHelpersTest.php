<?php

declare(strict_types=1);

use PHPUnit\Framework\TestCase;

final class SecurityHelpersTest extends TestCase
{
    public function testJwtRoundTripRejectsWrongSecret(): void
    {
        $token = JWT::encode(['sub' => 7, 'type' => 'access'], 'unit-test-secret-unit-test-secret-1234', 60);
        $payload = JWT::decode($token, 'unit-test-secret-unit-test-secret-1234');

        self::assertSame(7, $payload['sub']);
        self::assertSame('access', $payload['type']);

        $this->expectException(AppException::class);
        JWT::decode($token, 'wrong-secret-wrong-secret-wrong-secret');
    }

    public function testValidatorNormalizesEmailAndRejectsInvalidPhone(): void
    {
        self::assertSame('admin@example.com', Validator::email('  Admin@Example.COM  '));

        $this->expectException(AppException::class);
        Validator::phone('123');
    }
}
