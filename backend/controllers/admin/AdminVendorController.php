<?php

declare(strict_types=1);

class AdminVendorController extends ResourceController
{
    protected string $model = Vendor::class;
    protected array $requiredCreate = ['name', 'company', 'service_type', 'category', 'contact'];
    protected string $entityType = 'vendor';
}
