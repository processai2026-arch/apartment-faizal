<?php

declare(strict_types=1);

class AdminVendorController extends ResourceController
{
    protected string $model = Vendor::class;
    protected array $requiredCreate = ['name', 'company', 'service_type', 'category', 'contact'];
    protected string $entityType = 'vendor';

    protected function prepare(array $data, Request $request): array
    {
        // Never trust a client-supplied org_id; stamp the requester's org on
        // create (POST). Updates keep the row's existing organization — moving
        // a vendor between orgs is a super-admin concern, out of scope here.
        unset($data['org_id']);
        if ($request->method === 'POST') {
            $data['org_id'] = OrgScope::stampFor($request);
        }
        return $data;
    }
}
