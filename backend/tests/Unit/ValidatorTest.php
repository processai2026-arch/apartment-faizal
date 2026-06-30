<?php

declare(strict_types=1);

use PHPUnit\Framework\TestCase;

/**
 * Tests for static helper methods on the Validator class.
 * All methods tested here are pure (no database, no HTTP) so they
 * can run without an active SQLite connection.
 */
final class ValidatorTest extends TestCase
{
    // ─── sanitizeString ────────────────────────────────────────────────────────

    public function testSanitizeStringStripsHtmlTags(): void
    {
        $result = Validator::sanitizeString('<script>alert("xss")</script>Hello');
        self::assertStringNotContainsString('<script>', $result);
        self::assertStringContainsString('Hello', $result);
    }

    public function testSanitizeStringEncodesSpecialChars(): void
    {
        $result = Validator::sanitizeString('Tom & Jerry <br>');
        self::assertStringContainsString('&amp;', $result);
        self::assertStringNotContainsString('<br>', $result);
    }

    public function testSanitizeStringPreservesPlainText(): void
    {
        $plain = 'Hello World 123';
        self::assertSame($plain, Validator::sanitizeString($plain));
    }

    // ─── validateEmail ─────────────────────────────────────────────────────────

    public function testValidateEmailAcceptsValidAddress(): void
    {
        self::assertTrue(Validator::validateEmail('admin@officegate.com'));
        self::assertTrue(Validator::validateEmail('user+tag@sub.domain.org'));
    }

    public function testValidateEmailRejectsMissingAt(): void
    {
        self::assertFalse(Validator::validateEmail('notanemail'));
    }

    public function testValidateEmailRejectsMissingDomain(): void
    {
        self::assertFalse(Validator::validateEmail('user@'));
    }

    public function testValidateEmailRejectsEmptyString(): void
    {
        self::assertFalse(Validator::validateEmail(''));
    }

    // ─── validatePhone ─────────────────────────────────────────────────────────

    public function testValidatePhoneAcceptsValidIndianNumber(): void
    {
        self::assertTrue(Validator::validatePhone('+919876543210'));
        self::assertTrue(Validator::validatePhone('9876543210'));
    }

    public function testValidatePhoneAcceptsMinimumLength(): void
    {
        // 7-digit local number (minimum allowed)
        self::assertTrue(Validator::validatePhone('1234567'));
    }

    public function testValidatePhoneRejectsTooShort(): void
    {
        self::assertFalse(Validator::validatePhone('123'));
    }

    public function testValidatePhoneRejectsNonDigits(): void
    {
        self::assertFalse(Validator::validatePhone('abc-def-ghij'));
    }

    // ─── maxLength ─────────────────────────────────────────────────────────────

    public function testMaxLengthPassesWhenUnderLimit(): void
    {
        // Should not throw
        Validator::maxLength('hello', 10, 'field');
        self::assertTrue(true); // reached here without exception
    }

    public function testMaxLengthThrowsOnExceed(): void
    {
        $this->expectException(AppException::class);
        Validator::maxLength('This string is longer than five chars', 5, 'description');
    }

    public function testMaxLengthPassesOnExactLimit(): void
    {
        // Exactly at the limit — must not throw
        Validator::maxLength('12345', 5, 'code');
        self::assertTrue(true);
    }

    // ─── validateFileType ──────────────────────────────────────────────────────

    public function testValidateFileTypeAcceptsAllowedMime(): void
    {
        $allowed = ['image/jpeg', 'image/png', 'application/pdf'];
        self::assertTrue(Validator::validateFileType('image/jpeg', $allowed));
        self::assertTrue(Validator::validateFileType('application/pdf', $allowed));
    }

    public function testValidateFileTypeRejectsDisallowedMime(): void
    {
        $allowed = ['image/jpeg', 'image/png'];
        self::assertFalse(Validator::validateFileType('text/html', $allowed));
        self::assertFalse(Validator::validateFileType('application/x-php', $allowed));
    }

    public function testValidateFileTypeRejectsEmptyMime(): void
    {
        self::assertFalse(Validator::validateFileType('', ['image/jpeg']));
    }
}
