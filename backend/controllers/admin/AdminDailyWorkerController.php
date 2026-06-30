<?php

declare(strict_types=1);

class AdminDailyWorkerController
{
    public function index(Request $request): void
    {
        [$rows, $total, $page, $perPage] = DailyWorker::list($request);
        Response::paginated($rows, $total, $page, $perPage);
    }

    public function show(Request $request): void
    {
        $worker = DailyWorker::find((int) $request->params['id']);
        if (!$worker) {
            throw new AppException('Worker not found', 404);
        }
        $worker['attendance'] = Database::fetchAll(
            'SELECT * FROM worker_attendance WHERE worker_id = :id ORDER BY work_date DESC LIMIT 30',
            ['id' => $worker['id']]
        );
        $worker['recent_visits'] = Database::fetchAll(
            'SELECT * FROM worker_visits WHERE worker_id = :id ORDER BY id DESC LIMIT 20',
            ['id' => $worker['id']]
        );
        Response::success($worker);
    }

    public function store(Request $request): void
    {
        Validator::require($request->all(), ['name', 'worker_type']);
        Validator::enum((string) $request->input('worker_type'), DailyWorker::WORKER_TYPES, 'worker_type');
        $worker = DailyWorker::create([
            'name'                  => $request->input('name'),
            'phone'                 => $request->input('phone') ?: null,
            'worker_type'           => $request->input('worker_type'),
            'photo_attachment_id'   => $request->input('photo_attachment_id') ? (int) $request->input('photo_attachment_id') : null,
            'id_proof_attachment_id' => $request->input('id_proof_attachment_id') ? (int) $request->input('id_proof_attachment_id') : null,
            'address'               => $request->input('address') ?: null,
            'office_id'             => $request->input('office_id') ? (int) $request->input('office_id') : null,
            'status'                => 'Active',
        ]);
        $worker['qr_code'] = DailyWorker::generateQr((int) $worker['id']);
        AuditService::log((int) $request->user['id'], 'daily_worker.create', 'daily_worker', (int) $worker['id']);
        Response::success($worker, 'Worker registered', 201);
    }

    public function update(Request $request): void
    {
        $worker = DailyWorker::find((int) $request->params['id']);
        if (!$worker) {
            throw new AppException('Worker not found', 404);
        }
        $updated = DailyWorker::update((int) $worker['id'], array_filter([
            'name'                  => $request->input('name'),
            'phone'                 => $request->input('phone'),
            'worker_type'           => $request->input('worker_type'),
            'photo_attachment_id'   => $request->input('photo_attachment_id') ? (int) $request->input('photo_attachment_id') : null,
            'id_proof_attachment_id' => $request->input('id_proof_attachment_id') ? (int) $request->input('id_proof_attachment_id') : null,
            'address'               => $request->input('address'),
            'office_id'             => $request->input('office_id') ? (int) $request->input('office_id') : null,
            'status'                => $request->input('status'),
        ], fn ($v) => $v !== null));
        AuditService::log((int) $request->user['id'], 'daily_worker.update', 'daily_worker', (int) $updated['id']);
        Response::success($updated, 'Worker updated');
    }

    public function destroy(Request $request): void
    {
        $worker = DailyWorker::find((int) $request->params['id']);
        if (!$worker) {
            throw new AppException('Worker not found', 404);
        }
        DailyWorker::softDelete((int) $worker['id']);
        AuditService::log((int) $request->user['id'], 'daily_worker.delete', 'daily_worker', (int) $worker['id']);
        Response::success([], 'Worker removed');
    }

    public function generateQr(Request $request): void
    {
        $worker = DailyWorker::find((int) $request->params['id']);
        if (!$worker) {
            throw new AppException('Worker not found', 404);
        }
        $qr = DailyWorker::generateQr((int) $worker['id']);
        AuditService::log((int) $request->user['id'], 'daily_worker.qr_generated', 'daily_worker', (int) $worker['id']);
        Response::success(['qr_code' => $qr]);
    }

    public function markAttendance(Request $request): void
    {
        Validator::require($request->all(), ['worker_id', 'status']);
        $status = Validator::enum((string) $request->input('status'), WorkerAttendance::STATUSES, 'status');
        $attendance = WorkerAttendance::upsertToday(
            (int) $request->input('worker_id'),
            $status,
            (int) $request->user['id'],
            $request->input('entry_time') ?: null,
            $request->input('exit_time') ?: null,
            $request->input('notes') ?: null
        );
        AuditService::log((int) $request->user['id'], 'worker_attendance.mark', 'worker_attendance', (int) $attendance['id'], ['status' => $status]);
        Response::success($attendance, 'Attendance recorded');
    }

    public function attendance(Request $request): void
    {
        [$rows, $total, $page, $perPage] = WorkerAttendance::list($request);
        Response::paginated($rows, $total, $page, $perPage);
    }

    public function todaySummary(Request $request): void
    {
        $summary = WorkerAttendance::todaySummary();
        $totalWorkers = (int) Database::fetch(
            "SELECT COUNT(*) AS c FROM daily_workers WHERE status = 'Active' AND deleted_at IS NULL"
        )['c'];
        Response::success(['summary' => $summary, 'total' => $totalWorkers]);
    }

    public function recordEntry(Request $request): void
    {
        Validator::require($request->all(), ['worker_id']);
        $worker = DailyWorker::find((int) $request->input('worker_id'));
        if (!$worker || $worker['status'] !== 'Active') {
            throw new AppException('Worker not found or inactive', 404);
        }
        Database::query(
            'INSERT INTO worker_visits (worker_id, office_id, entry_time, authorized_by, notes, created_at)
             VALUES (:wid, :oid, :now, :auth, :notes, :created)',
            [
                'wid'     => $worker['id'],
                'oid'     => $request->input('office_id') ? (int) $request->input('office_id') : null,
                'now'     => db_time(),
                'auth'    => (int) $request->user['id'],
                'notes'   => $request->input('notes') ?: null,
                'created' => db_time(),
            ]
        );
        AuditService::log((int) $request->user['id'], 'worker_visit.entry', 'daily_worker', (int) $worker['id']);
        Response::success($worker, 'Worker entry recorded');
    }

    public function recordExit(Request $request): void
    {
        Validator::require($request->all(), ['visit_id']);
        Database::query(
            'UPDATE worker_visits SET exit_time = :now WHERE id = :id',
            ['now' => db_time(), 'id' => (int) $request->input('visit_id')]
        );
        Response::success(['exit_recorded' => true]);
    }
}
