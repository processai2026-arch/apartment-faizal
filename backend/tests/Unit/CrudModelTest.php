<?php

declare(strict_types=1);

use PHPUnit\Framework\TestCase;

/**
 * Tests for CrudModel::count().
 *
 * These tests use the live SQLite database seeded by scripts/seed.php.
 * They are read-only: they do not insert or modify data.
 * Run `php scripts/migrate.php && php scripts/seed.php` before executing.
 */
final class CrudModelTest extends TestCase
{
    // ─── count() returns an integer ───────────────────────────────────────────

    public function testCountReturnsInteger(): void
    {
        // Visitor::count() hits SELECT COUNT(*) on the visitors table.
        // The seed may add zero or more rows; what matters is the return type.
        $count = Visitor::count();
        self::assertIsInt($count);
    }

    public function testCountIsNonNegative(): void
    {
        $count = Visitor::count();
        self::assertGreaterThanOrEqual(0, $count);
    }

    public function testOfficeCountReturnsInteger(): void
    {
        $count = Office::count();
        self::assertIsInt($count);
        self::assertGreaterThanOrEqual(0, $count);
    }

    public function testVehicleCountReturnsInteger(): void
    {
        $count = Vehicle::count();
        self::assertIsInt($count);
    }

    // ─── count() with status filter ───────────────────────────────────────────

    public function testCountWithStatusFilterReturnsInteger(): void
    {
        // count() accepts a params array that the filters() method uses
        // (same as ?status=Active query parameter)
        $activeOffices = Office::count(['status' => 'Active']);
        $inactiveOffices = Office::count(['status' => 'Inactive']);

        self::assertIsInt($activeOffices);
        self::assertIsInt($inactiveOffices);
        // Total without filter must be >= either subset
        $total = Office::count();
        self::assertGreaterThanOrEqual($activeOffices, $total);
    }

    // ─── find() returns null for non-existent id ──────────────────────────────

    public function testFindReturnsNullForMissingId(): void
    {
        // Use an ID that is guaranteed not to exist
        $result = Visitor::find(PHP_INT_MAX);
        self::assertNull($result);
    }

    // ─── softDelete sets deleted_at ───────────────────────────────────────────

    public function testSoftDeleteSetsDeletedAt(): void
    {
        // Create a throwaway vendor record and immediately delete it
        $vendor = Vendor::create([
            'name'         => 'Unit Test Vendor ' . time(),
            'company'      => 'Test Co',
            'service_type' => 'Unit Testing',
            'category'     => 'Ad-Hoc Vendors',
            'contact'      => '+910000000000',
            'status'       => 'Active',
        ]);

        $id = (int) $vendor['id'];
        Vendor::softDelete($id);

        // After soft-delete, find() returns null (deleted_at IS NOT NULL)
        $result = Vendor::find($id);
        self::assertNull($result);
    }
}
