<?php

declare(strict_types=1);

class TenantBusinessAdController
{
    public function index(Request $request): void
    {
        if (!isset($request->query['status'])) {
            $request->query['status'] = 'Active';
        }
        [$rows, $total, $page, $perPage] = BusinessAd::list($request);
        Response::paginated($rows, $total, $page, $perPage);
    }

    public function show(Request $request): void
    {
        $ad = BusinessAd::find((int) $request->params['id']);
        if (!$ad || $ad['status'] !== 'Active') {
            throw new AppException('Ad not found', 404);
        }
        BusinessAd::recordClick((int) $ad['id'], (int) $request->user['id'], 'view', $_SERVER['REMOTE_ADDR'] ?? null);
        Response::success($ad);
    }

    public function click(Request $request): void
    {
        $ad = BusinessAd::find((int) $request->params['id']);
        if (!$ad || $ad['status'] !== 'Active') {
            throw new AppException('Ad not found', 404);
        }
        BusinessAd::recordClick((int) $ad['id'], (int) $request->user['id'], 'click', $_SERVER['REMOTE_ADDR'] ?? null);
        Response::success(['clicked' => true]);
    }

    public function categories(Request $request): void
    {
        [$rows, $total, $page, $perPage] = BusinessCategory::list($request);
        Response::paginated($rows, $total, $page, $perPage);
    }
}
