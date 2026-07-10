<?php

declare(strict_types=1);

/** @var Router $router */

$router->get('/health', [HealthController::class, 'show']);

$router->post('/auth/login', [AuthController::class, 'login'], ['RateLimitMiddleware:10,300']);
$router->post('/auth/otp/send', [AuthController::class, 'sendOtp'], ['RateLimitMiddleware:5,300']);
$router->post('/auth/otp/verify', [AuthController::class, 'verifyOtp'], ['RateLimitMiddleware:10,300']);
$router->post('/auth/refresh', [AuthController::class, 'refresh'], ['RateLimitMiddleware:30,300']);
$router->post('/auth/logout', [AuthController::class, 'logout'], ['AuthMiddleware']);
$router->get('/auth/me', [AuthController::class, 'me'], ['AuthMiddleware']);
$router->get('/me/features', [MeController::class, 'features'], ['AuthMiddleware']);
$router->put('/auth/change-password', [AuthController::class, 'changePassword'], ['AuthMiddleware', 'RateLimitMiddleware:5,300']);
$router->get('/ui-settings', [UiSettingsController::class, 'show'], ['AuthMiddleware']);
$router->put('/ui-settings', [UiSettingsController::class, 'update'], ['AuthMiddleware']);
$router->post('/uploads', [UploadController::class, 'store'], ['RoleMiddleware:admin,security,tenant', 'RateLimitMiddleware:10,60']);

$router->get('/admin/dashboard/summary', [AdminDashboardController::class, 'summary'], ['RoleMiddleware:admin']);
$router->get('/admin/notifications', [AdminNotificationController::class, 'index'], ['RoleMiddleware:admin']);
$router->get('/admin/notifications/{id}', [AdminNotificationController::class, 'show'], ['RoleMiddleware:admin']);
$router->put('/admin/notifications/{id}/read', [AdminNotificationController::class, 'markRead'], ['RoleMiddleware:admin']);
$router->put('/admin/notifications/read-all', [AdminNotificationController::class, 'markAllRead'], ['RoleMiddleware:admin']);
$router->delete('/admin/notifications/{id}', [AdminNotificationController::class, 'destroy'], ['RoleMiddleware:admin']);
$router->post('/admin/notifications', [AdminNotificationController::class, 'store'], ['RoleMiddleware:admin']);

$router->get('/admin/offices', [AdminOfficeController::class, 'index'], ['RoleMiddleware:admin']);
$router->post('/admin/offices', [AdminOfficeController::class, 'store'], ['RoleMiddleware:admin']);
$router->get('/admin/offices/{id}', [AdminOfficeController::class, 'show'], ['RoleMiddleware:admin']);
$router->put('/admin/offices/{id}', [AdminOfficeController::class, 'update'], ['RoleMiddleware:admin']);
$router->patch('/admin/offices/{id}/status', [AdminOfficeController::class, 'status'], ['RoleMiddleware:admin']);
$router->delete('/admin/offices/{id}', [AdminOfficeController::class, 'destroy'], ['RoleMiddleware:admin']);

$router->get('/admin/users', [AdminUserController::class, 'index'], ['RoleMiddleware:admin']);
$router->post('/admin/users', [AdminUserController::class, 'store'], ['RoleMiddleware:admin']);
$router->put('/admin/users/{id}', [AdminUserController::class, 'update'], ['RoleMiddleware:admin']);
$router->delete('/admin/users/{id}', [AdminUserController::class, 'destroy'], ['RoleMiddleware:admin']);

$router->get('/admin/visitors', [AdminVisitorController::class, 'index'], ['RoleMiddleware:admin,security', 'FeatureMiddleware:visitors']);
$router->post('/admin/visitors/entry', [AdminVisitorController::class, 'store'], ['RoleMiddleware:admin,security', 'FeatureMiddleware:visitors']);
$router->get('/admin/visitors/active', [AdminVisitorController::class, 'active'], ['RoleMiddleware:admin,security', 'FeatureMiddleware:visitors']);
$router->get('/admin/visitors/{id}', [AdminVisitorController::class, 'show'], ['RoleMiddleware:admin,security', 'FeatureMiddleware:visitors']);
$router->post('/admin/visitors/{id}/checkout', [AdminVisitorController::class, 'checkout'], ['RoleMiddleware:admin,security', 'FeatureMiddleware:visitors']);

$router->get('/admin/vehicles', [AdminVehicleController::class, 'index'], ['RoleMiddleware:admin,security', 'FeatureMiddleware:vehicles']);
$router->post('/admin/vehicles/entry', [AdminVehicleController::class, 'store'], ['RoleMiddleware:admin,security', 'FeatureMiddleware:vehicles']);
$router->get('/admin/vehicles/active', [AdminVehicleController::class, 'active'], ['RoleMiddleware:admin,security', 'FeatureMiddleware:vehicles']);
$router->get('/admin/vehicles/{id}', [AdminVehicleController::class, 'show'], ['RoleMiddleware:admin,security', 'FeatureMiddleware:vehicles']);
$router->post('/admin/vehicles/{id}/checkout', [AdminVehicleController::class, 'checkout'], ['RoleMiddleware:admin,security', 'FeatureMiddleware:vehicles']);

$router->get('/admin/vendors', [AdminVendorController::class, 'index'], ['RoleMiddleware:admin', 'FeatureMiddleware:vendors']);
$router->post('/admin/vendors', [AdminVendorController::class, 'store'], ['RoleMiddleware:admin', 'FeatureMiddleware:vendors']);
$router->get('/admin/vendors/{id}', [AdminVendorController::class, 'show'], ['RoleMiddleware:admin', 'FeatureMiddleware:vendors']);
$router->put('/admin/vendors/{id}', [AdminVendorController::class, 'update'], ['RoleMiddleware:admin', 'FeatureMiddleware:vendors']);

// Vendor Marketplace (admin) — extends the vendor module, distinct path prefixes avoid /vendors/{id} collisions
$router->get('/admin/vendor-marketplace/dashboard', [AdminVendorMarketplaceController::class, 'dashboard'], ['RoleMiddleware:admin', 'FeatureMiddleware:vendor_marketplace']);
$router->get('/admin/vendor-marketplace/statistics', [AdminVendorMarketplaceController::class, 'statistics'], ['RoleMiddleware:admin', 'FeatureMiddleware:vendor_marketplace']);
$router->get('/admin/vendor-marketplace/vendors/{id}', [AdminVendorMarketplaceController::class, 'detail'], ['RoleMiddleware:admin', 'FeatureMiddleware:vendor_marketplace']);
$router->post('/admin/vendor-marketplace/vendors/{id}/verify', [AdminVendorMarketplaceController::class, 'verify'], ['RoleMiddleware:admin', 'FeatureMiddleware:vendor_marketplace']);
$router->post('/admin/vendor-marketplace/vendors/{id}/feature', [AdminVendorMarketplaceController::class, 'feature'], ['RoleMiddleware:admin', 'FeatureMiddleware:vendor_marketplace']);
$router->post('/admin/vendor-marketplace/vendors/{id}/rating', [AdminVendorMarketplaceController::class, 'setRating'], ['RoleMiddleware:admin', 'FeatureMiddleware:vendor_marketplace']);

$router->get('/admin/vendor-reviews', [AdminVendorMarketplaceController::class, 'reviews'], ['RoleMiddleware:admin', 'FeatureMiddleware:vendor_marketplace']);
$router->post('/admin/vendor-reviews/{id}/moderate', [AdminVendorMarketplaceController::class, 'moderateReview'], ['RoleMiddleware:admin', 'FeatureMiddleware:vendor_marketplace']);

$router->get('/admin/vendor-bookings', [AdminVendorMarketplaceController::class, 'bookings'], ['RoleMiddleware:admin', 'FeatureMiddleware:vendor_marketplace']);
$router->post('/admin/vendor-bookings/{id}/status', [AdminVendorMarketplaceController::class, 'bookingStatus'], ['RoleMiddleware:admin', 'FeatureMiddleware:vendor_marketplace']);

$router->get('/admin/vendor-categories', [AdminVendorMarketplaceController::class, 'categories'], ['RoleMiddleware:admin', 'FeatureMiddleware:vendor_marketplace']);
$router->post('/admin/vendor-categories', [AdminVendorMarketplaceController::class, 'createCategory'], ['RoleMiddleware:admin', 'FeatureMiddleware:vendor_marketplace']);
$router->put('/admin/vendor-categories/{id}', [AdminVendorMarketplaceController::class, 'updateCategory'], ['RoleMiddleware:admin', 'FeatureMiddleware:vendor_marketplace']);
$router->delete('/admin/vendor-categories/{id}', [AdminVendorMarketplaceController::class, 'deleteCategory'], ['RoleMiddleware:admin', 'FeatureMiddleware:vendor_marketplace']);

$router->post('/admin/vendor-services', [AdminVendorMarketplaceController::class, 'createService'], ['RoleMiddleware:admin', 'FeatureMiddleware:vendor_marketplace']);
$router->put('/admin/vendor-services/{id}', [AdminVendorMarketplaceController::class, 'updateService'], ['RoleMiddleware:admin', 'FeatureMiddleware:vendor_marketplace']);
$router->delete('/admin/vendor-services/{id}', [AdminVendorMarketplaceController::class, 'deleteService'], ['RoleMiddleware:admin', 'FeatureMiddleware:vendor_marketplace']);

$router->post('/admin/vendor-gallery', [AdminVendorMarketplaceController::class, 'addGallery'], ['RoleMiddleware:admin', 'FeatureMiddleware:vendor_marketplace']);
$router->delete('/admin/vendor-gallery/{id}', [AdminVendorMarketplaceController::class, 'deleteGallery'], ['RoleMiddleware:admin', 'FeatureMiddleware:vendor_marketplace']);

// Vendor Marketplace (tenant)
$router->get('/tenant/vendors', [TenantVendorController::class, 'index'], ['RoleMiddleware:tenant', 'FeatureMiddleware:vendor_marketplace']);
$router->post('/tenant/vendors', [TenantVendorController::class, 'store'], ['RoleMiddleware:tenant', 'FeatureMiddleware:vendor_marketplace']);
$router->get('/tenant/vendor-categories', [TenantVendorController::class, 'categories'], ['RoleMiddleware:tenant', 'FeatureMiddleware:vendor_marketplace']);
$router->get('/tenant/vendors/{id}', [TenantVendorController::class, 'show'], ['RoleMiddleware:tenant', 'FeatureMiddleware:vendor_marketplace']);
$router->get('/tenant/vendor-bookings', [TenantVendorController::class, 'bookings'], ['RoleMiddleware:tenant', 'FeatureMiddleware:vendor_marketplace']);
$router->post('/tenant/vendor-bookings', [TenantVendorController::class, 'book'], ['RoleMiddleware:tenant', 'FeatureMiddleware:vendor_marketplace']);
$router->post('/tenant/vendor-bookings/{id}/cancel', [TenantVendorController::class, 'cancelBooking'], ['RoleMiddleware:tenant', 'FeatureMiddleware:vendor_marketplace']);
$router->post('/tenant/vendor-reviews', [TenantVendorController::class, 'review'], ['RoleMiddleware:tenant', 'FeatureMiddleware:vendor_marketplace']);

$router->get('/admin/staff', [AdminStaffController::class, 'index'], ['RoleMiddleware:admin,security', 'FeatureMiddleware:staff']);
$router->post('/admin/staff', [AdminStaffController::class, 'store'], ['RoleMiddleware:admin', 'FeatureMiddleware:staff']);
$router->put('/admin/staff/{id}', [AdminStaffController::class, 'update'], ['RoleMiddleware:admin', 'FeatureMiddleware:staff']);
$router->post('/admin/staff/{id}/attendance', [AdminStaffController::class, 'markAttendance'], ['RoleMiddleware:admin,security', 'FeatureMiddleware:staff']);
$router->get('/admin/staff/attendance/summary', [AdminStaffController::class, 'attendanceSummary'], ['RoleMiddleware:admin,security', 'FeatureMiddleware:staff']);

$router->get('/admin/inventory', [AdminInventoryController::class, 'index'], ['RoleMiddleware:admin', 'FeatureMiddleware:inventory']);
$router->post('/admin/inventory', [AdminInventoryController::class, 'store'], ['RoleMiddleware:admin', 'FeatureMiddleware:inventory']);
$router->put('/admin/inventory/{id}', [AdminInventoryController::class, 'update'], ['RoleMiddleware:admin', 'FeatureMiddleware:inventory']);
$router->post('/admin/inventory/{id}/movements', [AdminInventoryController::class, 'movement'], ['RoleMiddleware:admin', 'FeatureMiddleware:inventory']);

$router->get('/admin/utilities', [AdminUtilityController::class, 'index'], ['RoleMiddleware:admin', 'FeatureMiddleware:utilities']);
$router->post('/admin/utilities', [AdminUtilityController::class, 'store'], ['RoleMiddleware:admin', 'FeatureMiddleware:utilities']);
$router->put('/admin/utilities/{id}', [AdminUtilityController::class, 'update'], ['RoleMiddleware:admin', 'FeatureMiddleware:utilities']);
$router->post('/admin/utilities/{id}/complete', [AdminUtilityController::class, 'complete'], ['RoleMiddleware:admin', 'FeatureMiddleware:utilities']);

$router->get('/admin/invoices', [AdminFinanceController::class, 'index'], ['RoleMiddleware:admin', 'FeatureMiddleware:finance']);
$router->post('/admin/invoices', [AdminFinanceController::class, 'store'], ['RoleMiddleware:admin', 'FeatureMiddleware:finance']);
$router->get('/admin/invoices/{id}', [AdminFinanceController::class, 'show'], ['RoleMiddleware:admin', 'FeatureMiddleware:finance']);
$router->put('/admin/invoices/{id}', [AdminFinanceController::class, 'update'], ['RoleMiddleware:admin', 'FeatureMiddleware:finance']);
$router->post('/admin/invoices/{id}/payments', [AdminFinanceController::class, 'payment'], ['RoleMiddleware:admin', 'FeatureMiddleware:finance']);
$router->get('/admin/financials/summary', [AdminFinanceController::class, 'summary'], ['RoleMiddleware:admin', 'FeatureMiddleware:finance']);

$router->get('/admin/expenses', [AdminExpenseController::class, 'index'], ['RoleMiddleware:admin', 'FeatureMiddleware:expenses']);
$router->post('/admin/expenses', [AdminExpenseController::class, 'store'], ['RoleMiddleware:admin', 'FeatureMiddleware:expenses']);
$router->get('/admin/expenses/summary', [AdminExpenseController::class, 'summary'], ['RoleMiddleware:admin', 'FeatureMiddleware:expenses']);
$router->get('/admin/expenses/report', [AdminExpenseController::class, 'report'], ['RoleMiddleware:admin', 'FeatureMiddleware:expenses']);
$router->get('/admin/expenses/{id}', [AdminExpenseController::class, 'show'], ['RoleMiddleware:admin', 'FeatureMiddleware:expenses']);
$router->put('/admin/expenses/{id}', [AdminExpenseController::class, 'update'], ['RoleMiddleware:admin', 'FeatureMiddleware:expenses']);
$router->delete('/admin/expenses/{id}', [AdminExpenseController::class, 'destroy'], ['RoleMiddleware:admin', 'FeatureMiddleware:expenses']);

// Staff Payroll
$router->get('/admin/payroll/summary', [AdminPayrollController::class, 'summary'], ['RoleMiddleware:admin', 'FeatureMiddleware:payroll']);
$router->get('/admin/payroll/runs', [AdminPayrollController::class, 'index'], ['RoleMiddleware:admin', 'FeatureMiddleware:payroll']);
$router->post('/admin/payroll/runs', [AdminPayrollController::class, 'generate'], ['RoleMiddleware:admin', 'FeatureMiddleware:payroll']);
$router->get('/admin/payroll/runs/{id}', [AdminPayrollController::class, 'show'], ['RoleMiddleware:admin', 'FeatureMiddleware:payroll']);
$router->post('/admin/payroll/runs/{id}/finalize', [AdminPayrollController::class, 'finalize'], ['RoleMiddleware:admin', 'FeatureMiddleware:payroll']);
$router->post('/admin/payroll/runs/{id}/pay', [AdminPayrollController::class, 'markRunPaid'], ['RoleMiddleware:admin', 'FeatureMiddleware:payroll']);
$router->get('/admin/payroll/payslips/{id}', [AdminPayrollController::class, 'showPayslip'], ['RoleMiddleware:admin', 'FeatureMiddleware:payroll']);
$router->put('/admin/payroll/payslips/{id}', [AdminPayrollController::class, 'updatePayslip'], ['RoleMiddleware:admin', 'FeatureMiddleware:payroll']);
$router->post('/admin/payroll/payslips/{id}/pay', [AdminPayrollController::class, 'payPayslip'], ['RoleMiddleware:admin', 'FeatureMiddleware:payroll']);

// Medical Reports
$router->get('/admin/medical/summary', [AdminMedicalController::class, 'summary'], ['RoleMiddleware:admin', 'FeatureMiddleware:medical']);
$router->get('/admin/medical', [AdminMedicalController::class, 'index'], ['RoleMiddleware:admin', 'FeatureMiddleware:medical']);
$router->post('/admin/medical', [AdminMedicalController::class, 'store'], ['RoleMiddleware:admin', 'FeatureMiddleware:medical']);
$router->get('/admin/medical/{id}', [AdminMedicalController::class, 'show'], ['RoleMiddleware:admin', 'FeatureMiddleware:medical']);
$router->put('/admin/medical/{id}', [AdminMedicalController::class, 'update'], ['RoleMiddleware:admin', 'FeatureMiddleware:medical']);
$router->delete('/admin/medical/{id}', [AdminMedicalController::class, 'destroy'], ['RoleMiddleware:admin', 'FeatureMiddleware:medical']);

$router->get('/admin/documents', [AdminDocumentController::class, 'index'], ['RoleMiddleware:admin', 'FeatureMiddleware:documents']);
$router->post('/admin/documents', [AdminDocumentController::class, 'store'], ['RoleMiddleware:admin', 'FeatureMiddleware:documents']);
$router->get('/admin/documents/summary', [AdminDocumentController::class, 'summary'], ['RoleMiddleware:admin', 'FeatureMiddleware:documents']);
$router->get('/admin/documents/{id}', [AdminDocumentController::class, 'show'], ['RoleMiddleware:admin', 'FeatureMiddleware:documents']);
$router->put('/admin/documents/{id}', [AdminDocumentController::class, 'update'], ['RoleMiddleware:admin', 'FeatureMiddleware:documents']);
$router->delete('/admin/documents/{id}', [AdminDocumentController::class, 'destroy'], ['RoleMiddleware:admin', 'FeatureMiddleware:documents']);

$router->get('/admin/name-transfers', [AdminNameTransferController::class, 'index'], ['RoleMiddleware:admin', 'FeatureMiddleware:name_transfers']);
$router->post('/admin/name-transfers', [AdminNameTransferController::class, 'store'], ['RoleMiddleware:admin', 'FeatureMiddleware:name_transfers']);
$router->get('/admin/name-transfers/summary', [AdminNameTransferController::class, 'summary'], ['RoleMiddleware:admin', 'FeatureMiddleware:name_transfers']);
$router->post('/admin/name-transfers/{id}/approve', [AdminNameTransferController::class, 'approve'], ['RoleMiddleware:admin', 'FeatureMiddleware:name_transfers']);
$router->post('/admin/name-transfers/{id}/reject', [AdminNameTransferController::class, 'reject'], ['RoleMiddleware:admin', 'FeatureMiddleware:name_transfers']);
$router->post('/admin/name-transfers/{id}/complete', [AdminNameTransferController::class, 'complete'], ['RoleMiddleware:admin', 'FeatureMiddleware:name_transfers']);
$router->get('/admin/name-transfers/{id}', [AdminNameTransferController::class, 'show'], ['RoleMiddleware:admin', 'FeatureMiddleware:name_transfers']);
$router->put('/admin/name-transfers/{id}', [AdminNameTransferController::class, 'update'], ['RoleMiddleware:admin', 'FeatureMiddleware:name_transfers']);
$router->delete('/admin/name-transfers/{id}', [AdminNameTransferController::class, 'destroy'], ['RoleMiddleware:admin', 'FeatureMiddleware:name_transfers']);

// Consolidated audit report — static path must be registered before /admin/reports/{type}
$router->get('/admin/reports/audit', [AdminComplianceController::class, 'auditReport'], ['RoleMiddleware:admin', 'FeatureMiddleware:compliance']);
$router->get('/admin/reports/{type}', [AdminReportController::class, 'show'], ['RoleMiddleware:admin', 'FeatureMiddleware:reports']);

$router->get('/security/dashboard', [SecurityController::class, 'dashboard'], ['RoleMiddleware:security,admin']);
$router->get('/security/notifications', [SecurityNotificationController::class, 'index'], ['RoleMiddleware:security,admin']);
$router->put('/security/notifications/{id}/read', [SecurityNotificationController::class, 'markRead'], ['RoleMiddleware:security,admin']);
$router->put('/security/notifications/read-all', [SecurityNotificationController::class, 'markAllRead'], ['RoleMiddleware:security,admin']);
$router->get('/tenant/dashboard', [TenantController::class, 'dashboard'], ['RoleMiddleware:tenant']);
$router->get('/tenant/notifications', [TenantNotificationController::class, 'index'], ['RoleMiddleware:tenant']);
$router->put('/tenant/notifications/{id}/read', [TenantNotificationController::class, 'markRead'], ['RoleMiddleware:tenant']);
$router->put('/tenant/notifications/read-all', [TenantNotificationController::class, 'markAllRead'], ['RoleMiddleware:tenant']);

$router->get('/tenant/complaints', [TenantComplaintController::class, 'index'], ['RoleMiddleware:tenant', 'FeatureMiddleware:complaints']);
$router->post('/tenant/complaints', [TenantComplaintController::class, 'store'], ['RoleMiddleware:tenant', 'FeatureMiddleware:complaints']);
$router->get('/tenant/complaints/{id}', [TenantComplaintController::class, 'show'], ['RoleMiddleware:tenant', 'FeatureMiddleware:complaints']);

$router->get('/admin/complaints', [AdminComplaintController::class, 'index'], ['RoleMiddleware:admin', 'FeatureMiddleware:complaints']);
$router->get('/admin/complaints/{id}', [AdminComplaintController::class, 'show'], ['RoleMiddleware:admin', 'FeatureMiddleware:complaints']);
$router->put('/admin/complaints/{id}', [AdminComplaintController::class, 'update'], ['RoleMiddleware:admin', 'FeatureMiddleware:complaints']);
$router->delete('/admin/complaints/{id}', [AdminComplaintController::class, 'destroy'], ['RoleMiddleware:admin', 'FeatureMiddleware:complaints']);
$router->post('/admin/complaints/{id}/assign', [AdminComplaintController::class, 'assign'], ['RoleMiddleware:admin', 'FeatureMiddleware:complaints']);
$router->post('/admin/complaints/{id}/status', [AdminComplaintController::class, 'status'], ['RoleMiddleware:admin', 'FeatureMiddleware:complaints']);

$router->get('/tenant/maintenance-requests', [TenantMaintenanceRequestController::class, 'index'], ['RoleMiddleware:tenant', 'FeatureMiddleware:maintenance']);
$router->post('/tenant/maintenance-requests', [TenantMaintenanceRequestController::class, 'store'], ['RoleMiddleware:tenant', 'FeatureMiddleware:maintenance']);
$router->get('/tenant/maintenance-requests/{id}', [TenantMaintenanceRequestController::class, 'show'], ['RoleMiddleware:tenant', 'FeatureMiddleware:maintenance']);
$router->post('/tenant/maintenance-requests/{id}/cancel', [TenantMaintenanceRequestController::class, 'cancel'], ['RoleMiddleware:tenant', 'FeatureMiddleware:maintenance']);

$router->get('/admin/maintenance-requests', [AdminMaintenanceRequestController::class, 'index'], ['RoleMiddleware:admin', 'FeatureMiddleware:maintenance']);
$router->get('/admin/maintenance-requests/{id}', [AdminMaintenanceRequestController::class, 'show'], ['RoleMiddleware:admin', 'FeatureMiddleware:maintenance']);
$router->put('/admin/maintenance-requests/{id}', [AdminMaintenanceRequestController::class, 'update'], ['RoleMiddleware:admin', 'FeatureMiddleware:maintenance']);
$router->delete('/admin/maintenance-requests/{id}', [AdminMaintenanceRequestController::class, 'destroy'], ['RoleMiddleware:admin', 'FeatureMiddleware:maintenance']);
$router->post('/admin/maintenance-requests/{id}/assign', [AdminMaintenanceRequestController::class, 'assign'], ['RoleMiddleware:admin', 'FeatureMiddleware:maintenance']);
$router->post('/admin/maintenance-requests/{id}/assign-staff', [AdminMaintenanceRequestController::class, 'assignStaff'], ['RoleMiddleware:admin', 'FeatureMiddleware:maintenance']);
$router->post('/admin/maintenance-requests/{id}/status', [AdminMaintenanceRequestController::class, 'status'], ['RoleMiddleware:admin', 'FeatureMiddleware:maintenance']);

$router->post('/public/scan/visitor-entry', [PublicScanController::class, 'visitorEntry'], ['RateLimitMiddleware:20,300', 'GateTokenMiddleware:visitor-entry']);
$router->post('/public/scan/visitor-checkout', [PublicScanController::class, 'visitorCheckout'], ['RateLimitMiddleware:20,300', 'GateTokenMiddleware:visitor-checkout']);
$router->post('/public/scan/vehicle-entry', [PublicScanController::class, 'vehicleEntry'], ['RateLimitMiddleware:20,300', 'GateTokenMiddleware:vehicle-entry']);
$router->post('/public/scan/vehicle-checkout', [PublicScanController::class, 'vehicleCheckout'], ['RateLimitMiddleware:20,300', 'GateTokenMiddleware:vehicle-checkout']);

// ── Rental Marketplace (P9/P10) ──────────────────────────────────────────────
$router->get('/admin/rental/dashboard', [AdminRentalController::class, 'dashboard'], ['RoleMiddleware:admin', 'FeatureMiddleware:rental']);
$router->get('/admin/rental/listings', [AdminRentalController::class, 'index'], ['RoleMiddleware:admin', 'FeatureMiddleware:rental']);
$router->get('/admin/rental/listings/{id}', [AdminRentalController::class, 'show'], ['RoleMiddleware:admin', 'FeatureMiddleware:rental']);
$router->post('/admin/rental/listings/{id}/approve', [AdminRentalController::class, 'approve'], ['RoleMiddleware:admin', 'FeatureMiddleware:rental']);
$router->post('/admin/rental/listings/{id}/feature', [AdminRentalController::class, 'feature'], ['RoleMiddleware:admin', 'FeatureMiddleware:rental']);
$router->delete('/admin/rental/listings/{id}', [AdminRentalController::class, 'destroy'], ['RoleMiddleware:admin', 'FeatureMiddleware:rental']);

$router->get('/tenant/rental/listings', [TenantRentalController::class, 'index'], ['RoleMiddleware:tenant', 'FeatureMiddleware:rental']);
$router->get('/tenant/rental/listings/{id}', [TenantRentalController::class, 'show'], ['RoleMiddleware:tenant', 'FeatureMiddleware:rental']);
$router->get('/tenant/rental/my-listings', [TenantRentalController::class, 'myListings'], ['RoleMiddleware:tenant', 'FeatureMiddleware:rental']);
$router->post('/tenant/rental/listings', [TenantRentalController::class, 'store'], ['RoleMiddleware:tenant', 'FeatureMiddleware:rental']);
$router->put('/tenant/rental/listings/{id}', [TenantRentalController::class, 'update'], ['RoleMiddleware:tenant', 'FeatureMiddleware:rental']);
$router->delete('/tenant/rental/listings/{id}', [TenantRentalController::class, 'destroy'], ['RoleMiddleware:tenant', 'FeatureMiddleware:rental']);
$router->post('/tenant/rental/listings/{id}/favorite', [TenantRentalController::class, 'toggleFavorite'], ['RoleMiddleware:tenant', 'FeatureMiddleware:rental']);
$router->get('/tenant/rental/favorites', [TenantRentalController::class, 'myFavorites'], ['RoleMiddleware:tenant', 'FeatureMiddleware:rental']);

// ── Local Business Ads (P11) ─────────────────────────────────────────────────
// Management routes (index/store/update/delete) are admin-only.
// Tenant-facing read routes are open to tenant, security, and admin roles.
// Super-admin billing / analytics / ad-packages remain super_admin only.
$router->get('/admin/business-ads', [AdminBusinessAdController::class, 'index'], ['RoleMiddleware:admin']);
$router->post('/admin/business-ads', [AdminBusinessAdController::class, 'store'], ['RoleMiddleware:admin']);
$router->get('/admin/business-ads/dashboard', [AdminBusinessAdController::class, 'dashboard'], ['RoleMiddleware:admin']);

// ── Ad Billing & Analytics (P23) — SUPER ADMIN ONLY ──────────────────────
$router->get('/admin/business-ads/analytics', [AdminBusinessAdController::class, 'analytics'], ['RoleMiddleware:super_admin']);
$router->get('/admin/business-ads/billing', [AdminBusinessAdController::class, 'billing'], ['RoleMiddleware:super_admin']);
$router->post('/admin/business-ads/billing', [AdminBusinessAdController::class, 'createBilling'], ['RoleMiddleware:super_admin']);
$router->get('/admin/business-ads/billing/summary', [AdminBusinessAdController::class, 'billingSummary'], ['RoleMiddleware:super_admin']);
$router->get('/admin/business-ads/export', [AdminBusinessAdController::class, 'exportReport'], ['RoleMiddleware:super_admin']);
$router->get('/admin/ad-packages', [AdminBusinessAdController::class, 'packages'], ['RoleMiddleware:super_admin']);
$router->post('/admin/ad-packages', [AdminBusinessAdController::class, 'createPackage'], ['RoleMiddleware:super_admin']);
$router->put('/admin/ad-packages/{id}', [AdminBusinessAdController::class, 'updatePackage'], ['RoleMiddleware:super_admin']);
$router->delete('/admin/ad-packages/{id}', [AdminBusinessAdController::class, 'destroyPackage'], ['RoleMiddleware:super_admin']);

$router->get('/admin/business-ads/{id}', [AdminBusinessAdController::class, 'show'], ['RoleMiddleware:admin']);
$router->put('/admin/business-ads/{id}', [AdminBusinessAdController::class, 'update'], ['RoleMiddleware:admin']);
$router->delete('/admin/business-ads/{id}', [AdminBusinessAdController::class, 'destroy'], ['RoleMiddleware:admin']);
$router->post('/admin/business-ads/{id}/status', [AdminBusinessAdController::class, 'status'], ['RoleMiddleware:admin']);
$router->post('/admin/business-ads/{id}/impression', [AdminBusinessAdController::class, 'trackImpression'], ['RoleMiddleware:admin']);
$router->post('/admin/business-ads/{id}/renewal-reminder', [AdminBusinessAdController::class, 'sendRenewalReminder'], ['RoleMiddleware:admin']);
$router->post('/admin/business-ads/billing/{id}/pay', [AdminBusinessAdController::class, 'payBilling'], ['RoleMiddleware:super_admin']);
$router->get('/admin/business-categories', [AdminBusinessAdController::class, 'categories'], ['RoleMiddleware:admin']);
$router->post('/admin/business-categories', [AdminBusinessAdController::class, 'createCategory'], ['RoleMiddleware:admin']);
$router->put('/admin/business-categories/{id}', [AdminBusinessAdController::class, 'updateCategory'], ['RoleMiddleware:admin']);
$router->delete('/admin/business-categories/{id}', [AdminBusinessAdController::class, 'deleteCategory'], ['RoleMiddleware:admin']);

// Tenant-facing ad routes: open to tenant, security, and admin roles.
$router->get('/tenant/business-ads', [TenantBusinessAdController::class, 'index'], ['RoleMiddleware:tenant,security,admin']);
$router->get('/tenant/business-ads/{id}', [TenantBusinessAdController::class, 'show'], ['RoleMiddleware:tenant,security,admin']);
$router->post('/tenant/business-ads/{id}/click', [TenantBusinessAdController::class, 'click'], ['RoleMiddleware:tenant,security,admin']);
$router->get('/tenant/business-categories', [TenantBusinessAdController::class, 'categories'], ['RoleMiddleware:tenant,security,admin']);

// ── Announcements (P12) ───────────────────────────────────────────────────────
$router->get('/admin/announcements', [AdminAnnouncementController::class, 'index'], ['RoleMiddleware:admin', 'FeatureMiddleware:announcements']);
$router->post('/admin/announcements', [AdminAnnouncementController::class, 'store'], ['RoleMiddleware:admin', 'FeatureMiddleware:announcements']);
$router->get('/admin/announcements/{id}', [AdminAnnouncementController::class, 'show'], ['RoleMiddleware:admin', 'FeatureMiddleware:announcements']);
$router->put('/admin/announcements/{id}', [AdminAnnouncementController::class, 'update'], ['RoleMiddleware:admin', 'FeatureMiddleware:announcements']);
$router->post('/admin/announcements/{id}/publish', [AdminAnnouncementController::class, 'publish'], ['RoleMiddleware:admin', 'FeatureMiddleware:announcements']);
$router->delete('/admin/announcements/{id}', [AdminAnnouncementController::class, 'destroy'], ['RoleMiddleware:admin', 'FeatureMiddleware:announcements']);

$router->get('/tenant/announcements', [TenantAnnouncementController::class, 'index'], ['RoleMiddleware:tenant', 'FeatureMiddleware:announcements']);
$router->get('/tenant/announcements/unread-count', [TenantAnnouncementController::class, 'unreadCount'], ['RoleMiddleware:tenant', 'FeatureMiddleware:announcements']);
$router->get('/tenant/announcements/{id}', [TenantAnnouncementController::class, 'show'], ['RoleMiddleware:tenant', 'FeatureMiddleware:announcements']);
$router->post('/tenant/announcements/{id}/read', [TenantAnnouncementController::class, 'markRead'], ['RoleMiddleware:tenant', 'FeatureMiddleware:announcements']);

// ── Emergency Contacts (P13) ──────────────────────────────────────────────────
$router->get('/admin/emergency-contacts', [AdminEmergencyController::class, 'index'], ['RoleMiddleware:admin', 'FeatureMiddleware:emergency_contacts']);
$router->post('/admin/emergency-contacts', [AdminEmergencyController::class, 'store'], ['RoleMiddleware:admin', 'FeatureMiddleware:emergency_contacts']);
$router->put('/admin/emergency-contacts/{id}', [AdminEmergencyController::class, 'update'], ['RoleMiddleware:admin', 'FeatureMiddleware:emergency_contacts']);
$router->delete('/admin/emergency-contacts/{id}', [AdminEmergencyController::class, 'destroy'], ['RoleMiddleware:admin', 'FeatureMiddleware:emergency_contacts']);

$router->get('/tenant/emergency-contacts', [TenantEmergencyController::class, 'index'], ['RoleMiddleware:tenant', 'FeatureMiddleware:emergency_contacts']);
$router->get('/security/emergency-contacts', [TenantEmergencyController::class, 'index'], ['RoleMiddleware:security,admin', 'FeatureMiddleware:emergency_contacts']);

// ── Daily Workers (P14) ───────────────────────────────────────────────────────
$router->get('/admin/daily-workers', [AdminDailyWorkerController::class, 'index'], ['RoleMiddleware:admin,security', 'FeatureMiddleware:daily_workers']);
$router->post('/admin/daily-workers', [AdminDailyWorkerController::class, 'store'], ['RoleMiddleware:admin', 'FeatureMiddleware:daily_workers']);
$router->get('/admin/daily-workers/today-summary', [AdminDailyWorkerController::class, 'todaySummary'], ['RoleMiddleware:admin,security', 'FeatureMiddleware:daily_workers']);
$router->get('/admin/daily-workers/attendance', [AdminDailyWorkerController::class, 'attendance'], ['RoleMiddleware:admin,security', 'FeatureMiddleware:daily_workers']);
$router->get('/admin/daily-workers/{id}', [AdminDailyWorkerController::class, 'show'], ['RoleMiddleware:admin,security', 'FeatureMiddleware:daily_workers']);
$router->put('/admin/daily-workers/{id}', [AdminDailyWorkerController::class, 'update'], ['RoleMiddleware:admin', 'FeatureMiddleware:daily_workers']);
$router->delete('/admin/daily-workers/{id}', [AdminDailyWorkerController::class, 'destroy'], ['RoleMiddleware:admin', 'FeatureMiddleware:daily_workers']);
$router->post('/admin/daily-workers/{id}/qr', [AdminDailyWorkerController::class, 'generateQr'], ['RoleMiddleware:admin', 'FeatureMiddleware:daily_workers']);
$router->post('/admin/worker-attendance', [AdminDailyWorkerController::class, 'markAttendance'], ['RoleMiddleware:admin,security', 'FeatureMiddleware:daily_workers']);
$router->post('/admin/worker-entry', [AdminDailyWorkerController::class, 'recordEntry'], ['RoleMiddleware:admin,security', 'FeatureMiddleware:daily_workers']);
$router->post('/admin/worker-exit', [AdminDailyWorkerController::class, 'recordExit'], ['RoleMiddleware:admin,security', 'FeatureMiddleware:daily_workers']);

// ── Visitor Passes (P17) — part of Visitor Management ─────────────────────────
$router->get('/admin/visitor-passes', [AdminVisitorPassController::class, 'index'], ['RoleMiddleware:admin,security', 'FeatureMiddleware:visitors']);
$router->post('/admin/visitor-passes', [AdminVisitorPassController::class, 'store'], ['RoleMiddleware:admin,security', 'FeatureMiddleware:visitors']);
$router->get('/admin/visitor-passes/dashboard', [AdminVisitorPassController::class, 'dashboard'], ['RoleMiddleware:admin,security', 'FeatureMiddleware:visitors']);
$router->get('/admin/visitor-passes/{id}', [AdminVisitorPassController::class, 'show'], ['RoleMiddleware:admin,security', 'FeatureMiddleware:visitors']);
$router->put('/admin/visitor-passes/{id}', [AdminVisitorPassController::class, 'update'], ['RoleMiddleware:admin,security', 'FeatureMiddleware:visitors']);
$router->post('/admin/visitor-passes/{id}/cancel', [AdminVisitorPassController::class, 'cancel'], ['RoleMiddleware:admin,security', 'FeatureMiddleware:visitors']);
$router->post('/admin/visitor-passes/{id}/scan', [AdminVisitorPassController::class, 'scan'], ['RoleMiddleware:admin,security', 'FeatureMiddleware:visitors']);
$router->get('/admin/visitor-passes/{id}/download', [AdminVisitorPassController::class, 'download'], ['RoleMiddleware:admin,security', 'FeatureMiddleware:visitors']);

// ── Community Analytics (P18) ────────────────────────────────────────────────
$router->get('/admin/analytics/summary', [AdminAnalyticsController::class, 'summary'], ['RoleMiddleware:admin', 'FeatureMiddleware:analytics']);
$router->get('/admin/analytics/occupancy', [AdminAnalyticsController::class, 'occupancy'], ['RoleMiddleware:admin', 'FeatureMiddleware:analytics']);
$router->get('/admin/analytics/complaints', [AdminAnalyticsController::class, 'complaints'], ['RoleMiddleware:admin', 'FeatureMiddleware:analytics']);
$router->get('/admin/analytics/maintenance', [AdminAnalyticsController::class, 'maintenance'], ['RoleMiddleware:admin', 'FeatureMiddleware:analytics']);
$router->get('/admin/analytics/vendors', [AdminAnalyticsController::class, 'vendors'], ['RoleMiddleware:admin', 'FeatureMiddleware:analytics']);
$router->get('/admin/analytics/rentals', [AdminAnalyticsController::class, 'rentals'], ['RoleMiddleware:admin', 'FeatureMiddleware:analytics']);
$router->get('/admin/analytics/visitors', [AdminAnalyticsController::class, 'visitors'], ['RoleMiddleware:admin', 'FeatureMiddleware:analytics']);
$router->get('/admin/analytics/revenue', [AdminAnalyticsController::class, 'revenue'], ['RoleMiddleware:admin', 'FeatureMiddleware:analytics']);
$router->get('/admin/analytics/daily-workers', [AdminAnalyticsController::class, 'dailyWorkers'], ['RoleMiddleware:admin', 'FeatureMiddleware:analytics']);

// ── Community Events (P19) ────────────────────────────────────────────────
$router->get('/admin/events', [AdminEventController::class, 'index'], ['RoleMiddleware:admin', 'FeatureMiddleware:events']);
$router->post('/admin/events', [AdminEventController::class, 'store'], ['RoleMiddleware:admin', 'FeatureMiddleware:events']);
$router->get('/admin/events/dashboard', [AdminEventController::class, 'dashboard'], ['RoleMiddleware:admin', 'FeatureMiddleware:events']);
$router->get('/admin/events/{id}', [AdminEventController::class, 'show'], ['RoleMiddleware:admin', 'FeatureMiddleware:events']);
$router->put('/admin/events/{id}', [AdminEventController::class, 'update'], ['RoleMiddleware:admin', 'FeatureMiddleware:events']);
$router->post('/admin/events/{id}/publish', [AdminEventController::class, 'publish'], ['RoleMiddleware:admin', 'FeatureMiddleware:events']);
$router->post('/admin/events/{id}/cancel', [AdminEventController::class, 'cancel'], ['RoleMiddleware:admin', 'FeatureMiddleware:events']);
$router->delete('/admin/events/{id}', [AdminEventController::class, 'destroy'], ['RoleMiddleware:admin', 'FeatureMiddleware:events']);
$router->get('/admin/events/{id}/registrations', [AdminEventController::class, 'registrations'], ['RoleMiddleware:admin', 'FeatureMiddleware:events']);

$router->get('/tenant/events/my-registrations', [TenantEventController::class, 'myRegistrations'], ['RoleMiddleware:tenant', 'FeatureMiddleware:events']);
$router->get('/tenant/events', [TenantEventController::class, 'index'], ['RoleMiddleware:tenant', 'FeatureMiddleware:events']);
$router->get('/tenant/events/{id}', [TenantEventController::class, 'show'], ['RoleMiddleware:tenant', 'FeatureMiddleware:events']);
$router->post('/tenant/events/{id}/register', [TenantEventController::class, 'register'], ['RoleMiddleware:tenant', 'FeatureMiddleware:events']);
$router->post('/tenant/events/{id}/cancel-registration', [TenantEventController::class, 'cancelRegistration'], ['RoleMiddleware:tenant', 'FeatureMiddleware:events']);

// ── Secretary Portal (P15) ──────────────────────────────────────────────
$router->get('/admin/secretaries', [AdminSecretaryController::class, 'index'], ['RoleMiddleware:admin']);
$router->post('/admin/secretaries', [AdminSecretaryController::class, 'store'], ['RoleMiddleware:admin']);
$router->get('/admin/secretaries/{id}', [AdminSecretaryController::class, 'show'], ['RoleMiddleware:admin']);
$router->put('/admin/secretaries/{id}', [AdminSecretaryController::class, 'update'], ['RoleMiddleware:admin']);
$router->post('/admin/secretaries/{id}/permissions', [AdminSecretaryController::class, 'setPermissions'], ['RoleMiddleware:admin']);
$router->delete('/admin/secretaries/{id}', [AdminSecretaryController::class, 'destroy'], ['RoleMiddleware:admin']);
$router->get('/secretary/dashboard', [AdminSecretaryController::class, 'dashboard'], ['RoleMiddleware:admin']);
$router->get('/secretary/permissions', [AdminSecretaryController::class, 'myPermissions'], ['RoleMiddleware:admin']);

// ── CCTV Foundation (P21) ─────────────────────────────────────────────────
$router->get('/admin/cameras', [AdminCameraController::class, 'index'], ['RoleMiddleware:admin,security', 'FeatureMiddleware:cctv']);
$router->post('/admin/cameras', [AdminCameraController::class, 'store'], ['RoleMiddleware:admin', 'FeatureMiddleware:cctv']);
$router->get('/admin/cameras/dashboard', [AdminCameraController::class, 'dashboard'], ['RoleMiddleware:admin,security', 'FeatureMiddleware:cctv']);
$router->get('/admin/cameras/{id}', [AdminCameraController::class, 'show'], ['RoleMiddleware:admin,security', 'FeatureMiddleware:cctv']);
$router->put('/admin/cameras/{id}', [AdminCameraController::class, 'update'], ['RoleMiddleware:admin', 'FeatureMiddleware:cctv']);
$router->delete('/admin/cameras/{id}', [AdminCameraController::class, 'destroy'], ['RoleMiddleware:admin', 'FeatureMiddleware:cctv']);
$router->post('/admin/cameras/{id}/heartbeat', [AdminCameraController::class, 'heartbeat'], ['RoleMiddleware:admin,security', 'FeatureMiddleware:cctv']);
$router->get('/admin/cameras/{id}/events', [AdminCameraController::class, 'events'], ['RoleMiddleware:admin,security', 'FeatureMiddleware:cctv']);
$router->post('/admin/cameras/{id}/events', [AdminCameraController::class, 'createEvent'], ['RoleMiddleware:admin,security', 'FeatureMiddleware:cctv']);
$router->post('/admin/camera-events/{id}/acknowledge', [AdminCameraController::class, 'acknowledgeEvent'], ['RoleMiddleware:admin,security', 'FeatureMiddleware:cctv']);
$router->get('/admin/cameras/{id}/snapshots', [AdminCameraController::class, 'snapshots'], ['RoleMiddleware:admin,security', 'FeatureMiddleware:cctv']);
$router->post('/admin/cameras/{id}/snapshots', [AdminCameraController::class, 'createSnapshot'], ['RoleMiddleware:admin,security', 'FeatureMiddleware:cctv']);
$router->get('/admin/cameras/{id}/timeline', [AdminCameraController::class, 'timeline'], ['RoleMiddleware:admin,security', 'FeatureMiddleware:cctv']);

// ── Premium Membership (P22) ──────────────────────────────────────────────
$router->get('/admin/subscription-plans', [AdminSubscriptionController::class, 'plans'], ['RoleMiddleware:admin', 'FeatureMiddleware:subscriptions']);
$router->post('/admin/subscription-plans', [AdminSubscriptionController::class, 'createPlan'], ['RoleMiddleware:admin', 'FeatureMiddleware:subscriptions']);
$router->put('/admin/subscription-plans/{id}', [AdminSubscriptionController::class, 'updatePlan'], ['RoleMiddleware:admin', 'FeatureMiddleware:subscriptions']);
$router->delete('/admin/subscription-plans/{id}', [AdminSubscriptionController::class, 'destroyPlan'], ['RoleMiddleware:admin', 'FeatureMiddleware:subscriptions']);
$router->get('/admin/subscriptions/dashboard', [AdminSubscriptionController::class, 'dashboard'], ['RoleMiddleware:admin', 'FeatureMiddleware:subscriptions']);
$router->get('/admin/subscriptions', [AdminSubscriptionController::class, 'subscriptions'], ['RoleMiddleware:admin', 'FeatureMiddleware:subscriptions']);
$router->post('/admin/subscriptions', [AdminSubscriptionController::class, 'createSubscription'], ['RoleMiddleware:admin', 'FeatureMiddleware:subscriptions']);
$router->get('/admin/subscriptions/{id}', [AdminSubscriptionController::class, 'showSubscription'], ['RoleMiddleware:admin', 'FeatureMiddleware:subscriptions']);
$router->post('/admin/subscriptions/{id}/cancel', [AdminSubscriptionController::class, 'cancelSubscription'], ['RoleMiddleware:admin', 'FeatureMiddleware:subscriptions']);
$router->get('/admin/premium-features', [AdminSubscriptionController::class, 'features'], ['RoleMiddleware:admin', 'FeatureMiddleware:subscriptions']);
$router->put('/admin/premium-features/{id}', [AdminSubscriptionController::class, 'updateFeature'], ['RoleMiddleware:admin', 'FeatureMiddleware:subscriptions']);
$router->get('/tenant/subscription/my-plan', [TenantSubscriptionController::class, 'myPlan'], ['RoleMiddleware:tenant', 'FeatureMiddleware:subscriptions']);
$router->get('/tenant/subscription/plans', [TenantSubscriptionController::class, 'plans'], ['RoleMiddleware:tenant', 'FeatureMiddleware:subscriptions']);
$router->post('/tenant/subscription/upgrade', [TenantSubscriptionController::class, 'upgrade'], ['RoleMiddleware:tenant', 'FeatureMiddleware:subscriptions']);
$router->post('/tenant/subscription/cancel', [TenantSubscriptionController::class, 'cancelMySubscription'], ['RoleMiddleware:tenant', 'FeatureMiddleware:subscriptions']);

// ── Razorpay Payments (P24) ───────────────────────────────────────────────
// NOTE: /admin/payments/dashboard must be registered BEFORE any /admin/payments/{id} pattern
$router->get('/admin/payments/dashboard', [AdminFinanceController::class, 'paymentDashboard'], ['RoleMiddleware:admin', 'FeatureMiddleware:finance']);
$router->post('/admin/invoices/{id}/payment-order', [AdminFinanceController::class, 'createPaymentOrder'], ['RoleMiddleware:admin', 'FeatureMiddleware:finance', 'RateLimitMiddleware:5,60']);
$router->post('/admin/invoices/{id}/verify-payment', [AdminFinanceController::class, 'verifyPayment'], ['RoleMiddleware:admin', 'FeatureMiddleware:finance', 'RateLimitMiddleware:10,60']);
$router->get('/admin/invoices/{id}/payment-history', [AdminFinanceController::class, 'paymentHistory'], ['RoleMiddleware:admin', 'FeatureMiddleware:finance']);
$router->post('/admin/invoices/{id}/retry-payment', [AdminFinanceController::class, 'retryPayment'], ['RoleMiddleware:admin', 'FeatureMiddleware:finance', 'RateLimitMiddleware:5,60']);
$router->post('/admin/invoices/{id}/refund', [AdminFinanceController::class, 'refundPayment'], ['RoleMiddleware:admin', 'FeatureMiddleware:finance']);
$router->post('/payments/webhook', [AdminFinanceController::class, 'handleWebhook'], ['RateLimitMiddleware:60,60']); // signature-verified Razorpay webhook

// ── Facility & Daily Operations (P25) ────────────────────────────────────
$router->get('/admin/daily-ops/report', [AdminDailyOpsController::class, 'report'], ['RoleMiddleware:admin,security', 'FeatureMiddleware:daily_ops']);
$router->get('/admin/daily-ops/cctv-checks', [AdminDailyOpsController::class, 'cctvChecks'], ['RoleMiddleware:admin,security', 'FeatureMiddleware:daily_ops']);
$router->post('/admin/daily-ops/cctv-checks/bulk', [AdminDailyOpsController::class, 'bulkCctvChecks'], ['RoleMiddleware:admin,security', 'FeatureMiddleware:daily_ops']);
$router->post('/admin/daily-ops/cctv-checks', [AdminDailyOpsController::class, 'storeCctvCheck'], ['RoleMiddleware:admin,security', 'FeatureMiddleware:daily_ops']);
$router->get('/admin/daily-ops/water-lorry', [AdminDailyOpsController::class, 'waterLorryIndex'], ['RoleMiddleware:admin,security', 'FeatureMiddleware:daily_ops']);
$router->post('/admin/daily-ops/water-lorry', [AdminDailyOpsController::class, 'waterLorryStore'], ['RoleMiddleware:admin,security', 'FeatureMiddleware:daily_ops']);
$router->put('/admin/daily-ops/water-lorry/{id}', [AdminDailyOpsController::class, 'waterLorryUpdate'], ['RoleMiddleware:admin,security', 'FeatureMiddleware:daily_ops']);
$router->delete('/admin/daily-ops/water-lorry/{id}', [AdminDailyOpsController::class, 'waterLorryDestroy'], ['RoleMiddleware:admin,security', 'FeatureMiddleware:daily_ops']);
$router->get('/admin/daily-ops/eb', [AdminDailyOpsController::class, 'ebIndex'], ['RoleMiddleware:admin,security', 'FeatureMiddleware:daily_ops']);
$router->post('/admin/daily-ops/eb', [AdminDailyOpsController::class, 'ebStore'], ['RoleMiddleware:admin,security', 'FeatureMiddleware:daily_ops']);
$router->put('/admin/daily-ops/eb/{id}', [AdminDailyOpsController::class, 'ebUpdate'], ['RoleMiddleware:admin,security', 'FeatureMiddleware:daily_ops']);
$router->delete('/admin/daily-ops/eb/{id}', [AdminDailyOpsController::class, 'ebDestroy'], ['RoleMiddleware:admin,security', 'FeatureMiddleware:daily_ops']);
$router->get('/admin/daily-ops/housekeeping', [AdminDailyOpsController::class, 'housekeepingIndex'], ['RoleMiddleware:admin,security', 'FeatureMiddleware:daily_ops']);
$router->post('/admin/daily-ops/housekeeping', [AdminDailyOpsController::class, 'housekeepingStore'], ['RoleMiddleware:admin,security', 'FeatureMiddleware:daily_ops']);
$router->put('/admin/daily-ops/housekeeping/{id}', [AdminDailyOpsController::class, 'housekeepingUpdate'], ['RoleMiddleware:admin,security', 'FeatureMiddleware:daily_ops']);
$router->delete('/admin/daily-ops/housekeeping/{id}', [AdminDailyOpsController::class, 'housekeepingDestroy'], ['RoleMiddleware:admin,security', 'FeatureMiddleware:daily_ops']);

// ── IoT Monitoring & Hardware Automation ─────────────────────────────────
// Device-facing endpoints: no user auth, authenticated via X-Device-Token header
$router->post('/iot/ingest', [IotIngestController::class, 'ingest'], ['RateLimitMiddleware:60,60']);
$router->post('/iot/heartbeat', [IotIngestController::class, 'heartbeat'], ['RateLimitMiddleware:120,60']);
// Admin panel endpoints
$router->get('/admin/iot/devices', [AdminIotController::class, 'index'], ['RoleMiddleware:admin', 'FeatureMiddleware:iot']);
$router->post('/admin/iot/devices', [AdminIotController::class, 'store'], ['RoleMiddleware:admin', 'FeatureMiddleware:iot']);
$router->get('/admin/iot/summary', [AdminIotController::class, 'summary'], ['RoleMiddleware:admin', 'FeatureMiddleware:iot']);
$router->get('/admin/iot/events', [AdminIotController::class, 'events'], ['RoleMiddleware:admin', 'FeatureMiddleware:iot']);
$router->post('/admin/iot/events/{id}/acknowledge', [AdminIotController::class, 'acknowledgeEvent'], ['RoleMiddleware:admin', 'FeatureMiddleware:iot']);
$router->get('/admin/iot/devices/{id}', [AdminIotController::class, 'show'], ['RoleMiddleware:admin', 'FeatureMiddleware:iot']);
$router->put('/admin/iot/devices/{id}', [AdminIotController::class, 'update'], ['RoleMiddleware:admin', 'FeatureMiddleware:iot']);
$router->delete('/admin/iot/devices/{id}', [AdminIotController::class, 'destroy'], ['RoleMiddleware:admin', 'FeatureMiddleware:iot']);
$router->post('/admin/iot/devices/{id}/regenerate-token', [AdminIotController::class, 'regenerateToken'], ['RoleMiddleware:admin', 'FeatureMiddleware:iot']);

// ── Home Automation (Home Assistant REST connector, per client) ──────────
// Admin manages hubs + curates devices; the token is proxied server-side only.
$router->get('/admin/home-automation/summary', [AdminHomeAutomationController::class, 'summary'], ['RoleMiddleware:admin', 'FeatureMiddleware:home_automation']);
$router->get('/admin/home-automation/hubs', [AdminHomeAutomationController::class, 'hubs'], ['RoleMiddleware:admin', 'FeatureMiddleware:home_automation']);
$router->post('/admin/home-automation/hubs', [AdminHomeAutomationController::class, 'storeHub'], ['RoleMiddleware:admin', 'FeatureMiddleware:home_automation']);
$router->get('/admin/home-automation/hubs/{id}', [AdminHomeAutomationController::class, 'showHub'], ['RoleMiddleware:admin', 'FeatureMiddleware:home_automation']);
$router->put('/admin/home-automation/hubs/{id}', [AdminHomeAutomationController::class, 'updateHub'], ['RoleMiddleware:admin', 'FeatureMiddleware:home_automation']);
$router->delete('/admin/home-automation/hubs/{id}', [AdminHomeAutomationController::class, 'destroyHub'], ['RoleMiddleware:admin', 'FeatureMiddleware:home_automation']);
$router->post('/admin/home-automation/hubs/{id}/health', [AdminHomeAutomationController::class, 'health'], ['RoleMiddleware:admin', 'FeatureMiddleware:home_automation', 'RateLimitMiddleware:30,60']);
$router->post('/admin/home-automation/hubs/{id}/sync', [AdminHomeAutomationController::class, 'syncDevices'], ['RoleMiddleware:admin', 'FeatureMiddleware:home_automation', 'RateLimitMiddleware:20,60']);
$router->get('/admin/home-automation/hubs/{id}/devices', [AdminHomeAutomationController::class, 'devices'], ['RoleMiddleware:admin', 'FeatureMiddleware:home_automation', 'RateLimitMiddleware:60,60']);
$router->put('/admin/home-automation/devices/{id}', [AdminHomeAutomationController::class, 'updateDevice'], ['RoleMiddleware:admin', 'FeatureMiddleware:home_automation']);
$router->delete('/admin/home-automation/devices/{id}', [AdminHomeAutomationController::class, 'destroyDevice'], ['RoleMiddleware:admin', 'FeatureMiddleware:home_automation']);
$router->post('/admin/home-automation/command', [AdminHomeAutomationController::class, 'command'], ['RoleMiddleware:admin', 'FeatureMiddleware:home_automation', 'RateLimitMiddleware:60,60']);

// Tenant-facing: control only owner-assigned hubs and owner-visible devices.
$router->get('/tenant/home-automation/hubs', [TenantHomeAutomationController::class, 'hubs'], ['RoleMiddleware:tenant', 'FeatureMiddleware:home_automation']);
$router->get('/tenant/home-automation/hubs/{id}/devices', [TenantHomeAutomationController::class, 'devices'], ['RoleMiddleware:tenant', 'FeatureMiddleware:home_automation', 'RateLimitMiddleware:60,60']);
$router->post('/tenant/home-automation/command', [TenantHomeAutomationController::class, 'command'], ['RoleMiddleware:tenant', 'FeatureMiddleware:home_automation', 'RateLimitMiddleware:60,60']);

// ── Asset & Utility Tracking (individually-tracked assets + checkout + audits) ──
// Static paths registered before {id} patterns to avoid collisions.
$router->get('/admin/assets', [AdminAssetController::class, 'index'], ['RoleMiddleware:admin', 'FeatureMiddleware:assets']);
$router->post('/admin/assets', [AdminAssetController::class, 'store'], ['RoleMiddleware:admin', 'FeatureMiddleware:assets']);
$router->get('/admin/assets/summary', [AdminAssetController::class, 'summary'], ['RoleMiddleware:admin', 'FeatureMiddleware:assets']);
$router->get('/admin/assets/audits', [AdminAssetController::class, 'audits'], ['RoleMiddleware:admin', 'FeatureMiddleware:assets']);
$router->get('/admin/assets/assignments', [AdminAssetController::class, 'assignments'], ['RoleMiddleware:admin', 'FeatureMiddleware:assets']);
$router->get('/admin/assets/{id}', [AdminAssetController::class, 'show'], ['RoleMiddleware:admin', 'FeatureMiddleware:assets']);
$router->put('/admin/assets/{id}', [AdminAssetController::class, 'update'], ['RoleMiddleware:admin', 'FeatureMiddleware:assets']);
$router->delete('/admin/assets/{id}', [AdminAssetController::class, 'destroy'], ['RoleMiddleware:admin', 'FeatureMiddleware:assets']);
$router->post('/admin/assets/{id}/checkout', [AdminAssetController::class, 'checkout'], ['RoleMiddleware:admin', 'FeatureMiddleware:assets']);
$router->post('/admin/assets/{id}/checkin', [AdminAssetController::class, 'checkin'], ['RoleMiddleware:admin', 'FeatureMiddleware:assets']);
$router->post('/admin/assets/{id}/audit', [AdminAssetController::class, 'audit'], ['RoleMiddleware:admin', 'FeatureMiddleware:assets']);

// ── Accounts & Compliance (GST report, suspend list) + AMC/DG Maintenance ──
$router->get('/admin/financials/gst-report', [AdminFinanceController::class, 'gstReport'], ['RoleMiddleware:admin', 'FeatureMiddleware:compliance']);
$router->get('/admin/compliance/suspended', [AdminComplianceController::class, 'suspended'], ['RoleMiddleware:admin', 'FeatureMiddleware:compliance']);
$router->post('/admin/compliance/suspend', [AdminComplianceController::class, 'suspend'], ['RoleMiddleware:admin', 'FeatureMiddleware:compliance']);
$router->post('/admin/compliance/unsuspend', [AdminComplianceController::class, 'unsuspend'], ['RoleMiddleware:admin', 'FeatureMiddleware:compliance']);
// AMC contracts — static /expiring registered before {id} patterns.
$router->get('/admin/amc', [AdminAmcController::class, 'index'], ['RoleMiddleware:admin', 'FeatureMiddleware:amc']);
$router->post('/admin/amc', [AdminAmcController::class, 'store'], ['RoleMiddleware:admin', 'FeatureMiddleware:amc']);
$router->get('/admin/amc/expiring', [AdminAmcController::class, 'expiring'], ['RoleMiddleware:admin', 'FeatureMiddleware:amc']);
$router->get('/admin/amc/{id}', [AdminAmcController::class, 'show'], ['RoleMiddleware:admin', 'FeatureMiddleware:amc']);
$router->put('/admin/amc/{id}', [AdminAmcController::class, 'update'], ['RoleMiddleware:admin', 'FeatureMiddleware:amc']);
$router->delete('/admin/amc/{id}', [AdminAmcController::class, 'destroy'], ['RoleMiddleware:admin', 'FeatureMiddleware:amc']);
// DG maintenance logs
$router->get('/admin/dg/summary', [AdminAmcController::class, 'dgSummary'], ['RoleMiddleware:admin', 'FeatureMiddleware:amc']);
$router->get('/admin/dg/logs', [AdminAmcController::class, 'dgIndex'], ['RoleMiddleware:admin', 'FeatureMiddleware:amc']);
$router->post('/admin/dg/logs', [AdminAmcController::class, 'dgStore'], ['RoleMiddleware:admin', 'FeatureMiddleware:amc']);
$router->put('/admin/dg/logs/{id}', [AdminAmcController::class, 'dgUpdate'], ['RoleMiddleware:admin', 'FeatureMiddleware:amc']);
$router->delete('/admin/dg/logs/{id}', [AdminAmcController::class, 'dgDestroy'], ['RoleMiddleware:admin', 'FeatureMiddleware:amc']);

// ── Super Admin: Organizations & Multi-tenant Management ─────────────────
// 'super_admin' is a strict superset of 'admin' (see RoleMiddleware): it
// passes every admin-gated route above, while these routes are exclusive.
$router->get('/super/overview', [SuperAdminController::class, 'overview'], ['RoleMiddleware:super_admin']);
// Feature entitlements: catalog + per-org read/set. Static /features/catalog is
// registered before the /organizations/{id}/features patterns to avoid clashes.
$router->get('/super/features/catalog', [SuperAdminController::class, 'catalog'], ['RoleMiddleware:super_admin']);
$router->get('/super/organizations/{id}/features', [SuperAdminController::class, 'showFeatures'], ['RoleMiddleware:super_admin']);
$router->put('/super/organizations/{id}/features', [SuperAdminController::class, 'updateFeatures'], ['RoleMiddleware:super_admin']);
$router->get('/super/organizations', [SuperAdminController::class, 'organizations'], ['RoleMiddleware:super_admin']);
$router->post('/super/organizations', [SuperAdminController::class, 'storeOrganization'], ['RoleMiddleware:super_admin']);
$router->get('/super/organizations/{id}', [SuperAdminController::class, 'showOrganization'], ['RoleMiddleware:super_admin']);
$router->put('/super/organizations/{id}', [SuperAdminController::class, 'updateOrganization'], ['RoleMiddleware:super_admin']);
$router->post('/super/organizations/{id}/status', [SuperAdminController::class, 'statusOrganization'], ['RoleMiddleware:super_admin']);
$router->delete('/super/organizations/{id}', [SuperAdminController::class, 'destroyOrganization'], ['RoleMiddleware:super_admin']);
$router->post('/super/organizations/{id}/assign-user', [SuperAdminController::class, 'assignUser'], ['RoleMiddleware:super_admin']);

// ── Super Admin Task Manager ──────────────────────────────────────────────────
$router->get('/super/tasks/dashboard', [SuperTaskController::class, 'dashboard'], ['RoleMiddleware:super_admin']);
$router->get('/super/tasks', [SuperTaskController::class, 'index'], ['RoleMiddleware:super_admin']);
$router->post('/super/tasks', [SuperTaskController::class, 'store'], ['RoleMiddleware:super_admin']);
$router->get('/super/tasks/{id}', [SuperTaskController::class, 'show'], ['RoleMiddleware:super_admin']);
$router->put('/super/tasks/{id}', [SuperTaskController::class, 'update'], ['RoleMiddleware:super_admin']);
$router->post('/super/tasks/{id}/complete', [SuperTaskController::class, 'complete'], ['RoleMiddleware:super_admin']);
$router->delete('/super/tasks/{id}', [SuperTaskController::class, 'destroy'], ['RoleMiddleware:super_admin']);
