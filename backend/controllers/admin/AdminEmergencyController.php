<?php

declare(strict_types=1);

class AdminEmergencyController
{
    public function index(Request $request): void
    {
        [$rows, $total, $page, $perPage] = EmergencyContact::list($request);
        Response::paginated($rows, $total, $page, $perPage);
    }

    public function store(Request $request): void
    {
        Validator::require($request->all(), ['name', 'phone', 'category']);
        $cat = Validator::enum((string) $request->input('category'), EmergencyContact::CATEGORIES, 'category');
        $contact = EmergencyContact::create([
            'name'           => $request->input('name'),
            'category'       => $cat,
            'phone'          => $request->input('phone'),
            'alternate_phone' => $request->input('alternate_phone') ?: null,
            'email'          => $request->input('email') ?: null,
            'address'        => $request->input('address') ?: null,
            'priority'       => $request->input('priority') !== null ? (int) $request->input('priority') : 0,
            'available_24h'  => (int) (bool) $request->input('available_24h', false),
            'is_pinned'      => (int) (bool) $request->input('is_pinned', false),
            'status'         => 'Active',
        ]);
        AuditService::log((int) $request->user['id'], 'emergency_contact.create', 'emergency_contact', (int) $contact['id']);
        Response::success($contact, 'Contact created', 201);
    }

    public function update(Request $request): void
    {
        $contact = EmergencyContact::find((int) $request->params['id']);
        if (!$contact) {
            throw new AppException('Contact not found', 404);
        }
        $updated = EmergencyContact::update((int) $contact['id'], array_filter([
            'name'            => $request->input('name'),
            'category'        => $request->input('category'),
            'phone'           => $request->input('phone'),
            'alternate_phone' => $request->input('alternate_phone'),
            'email'           => $request->input('email'),
            'address'         => $request->input('address'),
            'priority'        => $request->input('priority') !== null ? (int) $request->input('priority') : null,
            'available_24h'   => $request->input('available_24h') !== null ? (int) (bool) $request->input('available_24h') : null,
            'is_pinned'       => $request->input('is_pinned') !== null ? (int) (bool) $request->input('is_pinned') : null,
            'status'          => $request->input('status'),
        ], fn ($v) => $v !== null));
        AuditService::log((int) $request->user['id'], 'emergency_contact.update', 'emergency_contact', (int) $updated['id']);
        Response::success($updated, 'Contact updated');
    }

    public function destroy(Request $request): void
    {
        $contact = EmergencyContact::find((int) $request->params['id']);
        if (!$contact) {
            throw new AppException('Contact not found', 404);
        }
        EmergencyContact::softDelete((int) $contact['id']);
        AuditService::log((int) $request->user['id'], 'emergency_contact.delete', 'emergency_contact', (int) $contact['id']);
        Response::success([], 'Contact deleted');
    }
}
