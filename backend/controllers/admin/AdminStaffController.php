<?php

declare(strict_types=1);

class AdminStaffController extends ResourceController
{
    protected string $model = Staff::class;
    protected array $requiredCreate = ['name', 'role', 'department', 'contact', 'join_date'];
    protected string $entityType = 'staff';

    public function index(Request $request): void
    {
        [$rows, $total, $page, $perPage] = $this->model::list($request);

        // For each staff member, load attendance for current month
        $month = date('Y-m');
        if (Database::driver() === 'mysql') {
            $attendanceRows = Database::fetchAll(
                "SELECT staff_id, attendance_date, status FROM staff_attendance WHERE DATE_FORMAT(attendance_date, '%Y-%m') = :month",
                ['month' => $month]
            );
        } else {
            $attendanceRows = Database::fetchAll(
                "SELECT staff_id, attendance_date, status FROM staff_attendance WHERE strftime('%Y-%m', attendance_date) = :month",
                ['month' => $month]
            );
        }

        // Build map: staff_id -> [date => status]
        $attendanceMap = [];
        foreach ($attendanceRows as $row) {
            $attendanceMap[(int)$row['staff_id']][$row['attendance_date']] = $row['status'];
        }

        // Add to each staff row
        $rows = array_map(function($staff) use ($attendanceMap) {
            $staff['attendance'] = $attendanceMap[(int)$staff['id']] ?? [];
            return $staff;
        }, $rows);

        Response::paginated($rows, $total, $page, $perPage);
    }

    public function markAttendance(Request $request): void
    {
        Validator::require($request->all(), ['date', 'status']);
        $status = Validator::enum((string) $request->input('status'), ['P', 'A', 'H'], 'status');
        $staffId = (int) $request->params['id'];
        if (!Staff::find($staffId)) {
            throw new AppException('Staff not found', 404);
        }
        $params = [
            'staff_id' => $staffId,
            'attendance_date' => (string) $request->input('date'),
            'status' => $status,
            'marked_by' => $request->user['id'],
            'created_at' => db_time(),
            'updated_at' => db_time(),
        ];
        if (Database::driver() === 'mysql') {
            Database::query(
                'INSERT INTO staff_attendance (staff_id, attendance_date, status, marked_by, created_at, updated_at)
                 VALUES (:staff_id, :attendance_date, :status, :marked_by, :created_at, :updated_at)
                 ON DUPLICATE KEY UPDATE status = VALUES(status), marked_by = VALUES(marked_by), updated_at = VALUES(updated_at)',
                $params
            );
        } else {
            Database::query(
                'INSERT INTO staff_attendance (staff_id, attendance_date, status, marked_by, created_at, updated_at)
                 VALUES (:staff_id, :attendance_date, :status, :marked_by, :created_at, :updated_at)
                 ON CONFLICT(staff_id, attendance_date) DO UPDATE SET status = excluded.status, marked_by = excluded.marked_by, updated_at = excluded.updated_at',
                $params
            );
        }
        AuditService::log((int) $request->user['id'], 'staff.attendance', 'staff', $staffId, ['status' => $status]);
        Response::success(['staffId' => $staffId, 'status' => $status], 'Attendance marked');
    }

    public function attendanceSummary(Request $request): void
    {
        $date = (string) ($request->query['date'] ?? date('Y-m-d'));
        $rows = Database::fetchAll(
            'SELECT status, COUNT(*) AS total FROM staff_attendance WHERE attendance_date = :date GROUP BY status',
            ['date' => $date]
        );
        Response::success(['date' => $date, 'summary' => $rows]);
    }
}
