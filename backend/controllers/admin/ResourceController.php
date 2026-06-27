<?php

declare(strict_types=1);

abstract class ResourceController
{
    protected string $model;
    protected array $requiredCreate = [];
    protected string $entityType = 'record';

    public function index(Request $request): void
    {
        [$rows, $total, $page, $perPage] = $this->model::list($request);
        Response::paginated($rows, $total, $page, $perPage);
    }

    public function show(Request $request): void
    {
        $row = $this->model::find((int) $request->params['id']);
        if (!$row) {
            throw new AppException('Record not found', 404);
        }
        Response::success($row);
    }

    public function store(Request $request): void
    {
        Validator::require($request->all(), $this->requiredCreate);
        $row = $this->model::create($this->prepare($request->all(), $request));
        AuditService::log((int) $request->user['id'], $this->entityType . '.create', $this->entityType, (int) $row['id']);
        Response::success($row, 'Created', 201);
    }

    public function update(Request $request): void
    {
        $row = $this->model::update((int) $request->params['id'], $this->prepare($request->all(), $request));
        AuditService::log((int) $request->user['id'], $this->entityType . '.update', $this->entityType, (int) $row['id']);
        Response::success($row, 'Updated');
    }

    protected function prepare(array $data, Request $request): array
    {
        return $data;
    }
}
