<?php

declare(strict_types=1);

class VendorBooking extends CrudModel
{
    protected static string $table = 'vendor_bookings';
    protected static array $columns = ['vendor_id', 'user_id', 'office_id', 'service_id', 'title', 'description', 'scheduled_for', 'status', 'completed_at'];
    protected static array $searchColumns = ['title', 'description'];

    public const STATUSES = ['Requested', 'Confirmed', 'In Progress', 'Completed', 'Cancelled'];

    protected static function filters(Request $request): array
    {
        [$where, $params] = parent::filters($request);
        $conditions = $where !== '' ? [substr($where, 6)] : [];

        if (($request->query['vendor_id'] ?? '') !== '') {
            $conditions[] = 'vendor_id = :vendor_id';
            $params['vendor_id'] = (int) $request->query['vendor_id'];
        }
        if (($request->query['user_id'] ?? '') !== '') {
            $conditions[] = 'user_id = :user_id';
            $params['user_id'] = (int) $request->query['user_id'];
        }
        if (($request->query['office_id'] ?? '') !== '') {
            $conditions[] = 'office_id = :office_id';
            $params['office_id'] = (int) $request->query['office_id'];
        }

        return [$conditions ? 'WHERE ' . implode(' AND ', $conditions) : '', $params];
    }

    /**
     * Transition a booking to a new status, stamping completed_at on completion,
     * and keep the vendor's cached booking count in sync.
     */
    public static function transition(int $id, string $status): array
    {
        $booking = static::find($id);
        if (!$booking) {
            throw new AppException('Booking not found', 404);
        }
        if (!in_array($status, self::STATUSES, true)) {
            throw new AppException('Invalid booking status', 422);
        }

        $data = ['status' => $status];
        if ($status === 'Completed') {
            $data['completed_at'] = db_time();
        }
        $row = static::update($id, $data);
        Vendor::refreshBookingCount((int) $booking['vendor_id']);
        return $row;
    }
}
