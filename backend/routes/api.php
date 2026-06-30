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
$router->put('/auth/change-password', [AuthController::class, 'changePassword'], ['AuthMiddleware', 'RateLimitMiddleware:5,300']);
$router->get('/ui-settings', [UiSettingsController::class, 'show'], ['AuthMiddleware']);
$router->put('/ui-settings', [UiSettingsController::class, 'update'], ['AuthMiddleware']);
$router->post('/uploads', [UploadController::class, 'store'], ['RoleMiddleware:admin,security,tenant']);

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

$router->get('/admin/visitors', [AdminVisitorController::class, 'index'], ['RoleMiddleware:admin,security']);
$router->post('/admin/visitors/entry', [AdminVisitorController::class, 'store'], ['RoleMiddleware:admin,security']);
$router->get('/admin/visitors/active', [AdminVisitorController::class, 'active'], ['RoleMiddleware:admin,security']);
$router->get('/admin/visitors/{id}', [AdminVisitorController::class, 'show'], ['RoleMiddleware:admin,security']);
$router->post('/admin/visitors/{id}/checkout', [AdminVisitorController::class, 'checkout'], ['RoleMiddleware:admin,security']);

$router->get('/admin/vehicles', [AdminVehicleController::class, 'index'], ['RoleMiddleware:admin,security']);
$router->post('/admin/vehicles/entry', [AdminVehicleController::class, 'store'], ['RoleMiddleware:admin,security']);
$router->get('/admin/vehicles/active', [AdminVehicleController::class, 'active'], ['RoleMiddleware:admin,security']);
$router->get('/admin/vehicles/{id}', [AdminVehicleController::class, 'show'], ['RoleMiddleware:admin,security']);
$router->post('/admin/vehicles/{id}/checkout', [AdminVehicleController::class, 'checkout'], ['RoleMiddleware:admin,security']);

$router->get('/admin/vendors', [AdminVendorController::class, 'index'], ['RoleMiddleware:admin']);
$router->post('/admin/vendors', [AdminVendorController::class, 'store'], ['RoleMiddleware:admin']);
$router->get('/admin/vendors/{id}', [AdminVendorController::class, 'show'], ['RoleMiddleware:admin']);
$router->put('/admin/vendors/{id}', [AdminVendorController::class, 'update'], ['RoleMiddleware:admin']);

// Vendor Marketplace (admin) — extends the vendor module, distinct path prefixes avoid /vendors/{id} collisions
$router->get('/admin/vendor-marketplace/dashboard', [AdminVendorMarketplaceController::class, 'dashboard'], ['RoleMiddleware:admin']);
$router->get('/admin/vendor-marketplace/statistics', [AdminVendorMarketplaceController::class, 'statistics'], ['RoleMiddleware:admin']);
$router->get('/admin/vendor-marketplace/vendors/{id}', [AdminVendorMarketplaceController::class, 'detail'], ['RoleMiddleware:admin']);
$router->post('/admin/vendor-marketplace/vendors/{id}/verify', [AdminVendorMarketplaceController::class, 'verify'], ['RoleMiddleware:admin']);
$router->post('/admin/vendor-marketplace/vendors/{id}/feature', [AdminVendorMarketplaceController::class, 'feature'], ['RoleMiddleware:admin']);

$router->get('/admin/vendor-reviews', [AdminVendorMarketplaceController::class, 'reviews'], ['RoleMiddleware:admin']);
$router->post('/admin/vendor-reviews/{id}/moderate', [AdminVendorMarketplaceController::class, 'moderateReview'], ['RoleMiddleware:admin']);

$router->get('/admin/vendor-bookings', [AdminVendorMarketplaceController::class, 'bookings'], ['RoleMiddleware:admin']);
$router->post('/admin/vendor-bookings/{id}/status', [AdminVendorMarketplaceController::class, 'bookingStatus'], ['RoleMiddleware:admin']);

$router->get('/admin/vendor-categories', [AdminVendorMarketplaceController::class, 'categories'], ['RoleMiddleware:admin']);
$router->post('/admin/vendor-categories', [AdminVendorMarketplaceController::class, 'createCategory'], ['RoleMiddleware:admin']);
$router->put('/admin/vendor-categories/{id}', [AdminVendorMarketplaceController::class, 'updateCategory'], ['RoleMiddleware:admin']);
$router->delete('/admin/vendor-categories/{id}', [AdminVendorMarketplaceController::class, 'deleteCategory'], ['RoleMiddleware:admin']);

$router->post('/admin/vendor-services', [AdminVendorMarketplaceController::class, 'createService'], ['RoleMiddleware:admin']);
$router->put('/admin/vendor-services/{id}', [AdminVendorMarketplaceController::class, 'updateService'], ['RoleMiddleware:admin']);
$router->delete('/admin/vendor-services/{id}', [AdminVendorMarketplaceController::class, 'deleteService'], ['RoleMiddleware:admin']);

$router->post('/admin/vendor-gallery', [AdminVendorMarketplaceController::class, 'addGallery'], ['RoleMiddleware:admin']);
$router->delete('/admin/vendor-gallery/{id}', [AdminVendorMarketplaceController::class, 'deleteGallery'], ['RoleMiddleware:admin']);

// Vendor Marketplace (tenant)
$router->get('/tenant/vendors', [TenantVendorController::class, 'index'], ['RoleMiddleware:tenant']);
$router->get('/tenant/vendor-categories', [TenantVendorController::class, 'categories'], ['RoleMiddleware:tenant']);
$router->get('/tenant/vendors/{id}', [TenantVendorController::class, 'show'], ['RoleMiddleware:tenant']);
$router->get('/tenant/vendor-bookings', [TenantVendorController::class, 'bookings'], ['RoleMiddleware:tenant']);
$router->post('/tenant/vendor-bookings', [TenantVendorController::class, 'book'], ['RoleMiddleware:tenant']);
$router->post('/tenant/vendor-bookings/{id}/cancel', [TenantVendorController::class, 'cancelBooking'], ['RoleMiddleware:tenant']);
$router->post('/tenant/vendor-reviews', [TenantVendorController::class, 'review'], ['RoleMiddleware:tenant']);

$router->get('/admin/staff', [AdminStaffController::class, 'index'], ['RoleMiddleware:admin,security']);
$router->post('/admin/staff', [AdminStaffController::class, 'store'], ['RoleMiddleware:admin']);
$router->put('/admin/staff/{id}', [AdminStaffController::class, 'update'], ['RoleMiddleware:admin']);
$router->post('/admin/staff/{id}/attendance', [AdminStaffController::class, 'markAttendance'], ['RoleMiddleware:admin,security']);
$router->get('/admin/staff/attendance/summary', [AdminStaffController::class, 'attendanceSummary'], ['RoleMiddleware:admin,security']);

$router->get('/admin/inventory', [AdminInventoryController::class, 'index'], ['RoleMiddleware:admin']);
$router->post('/admin/inventory', [AdminInventoryController::class, 'store'], ['RoleMiddleware:admin']);
$router->put('/admin/inventory/{id}', [AdminInventoryController::class, 'update'], ['RoleMiddleware:admin']);
$router->post('/admin/inventory/{id}/movements', [AdminInventoryController::class, 'movement'], ['RoleMiddleware:admin']);

$router->get('/admin/utilities', [AdminUtilityController::class, 'index'], ['RoleMiddleware:admin']);
$router->post('/admin/utilities', [AdminUtilityController::class, 'store'], ['RoleMiddleware:admin']);
$router->put('/admin/utilities/{id}', [AdminUtilityController::class, 'update'], ['RoleMiddleware:admin']);
$router->post('/admin/utilities/{id}/complete', [AdminUtilityController::class, 'complete'], ['RoleMiddleware:admin']);

$router->get('/admin/invoices', [AdminFinanceController::class, 'index'], ['RoleMiddleware:admin']);
$router->post('/admin/invoices', [AdminFinanceController::class, 'store'], ['RoleMiddleware:admin']);
$router->put('/admin/invoices/{id}', [AdminFinanceController::class, 'update'], ['RoleMiddleware:admin']);
$router->post('/admin/invoices/{id}/payments', [AdminFinanceController::class, 'payment'], ['RoleMiddleware:admin']);
$router->get('/admin/financials/summary', [AdminFinanceController::class, 'summary'], ['RoleMiddleware:admin']);

$router->get('/admin/reports/{type}', [AdminReportController::class, 'show'], ['RoleMiddleware:admin']);

$router->get('/security/dashboard', [SecurityController::class, 'dashboard'], ['RoleMiddleware:security,admin']);
$router->get('/security/notifications', [SecurityNotificationController::class, 'index'], ['RoleMiddleware:security,admin']);
$router->put('/security/notifications/{id}/read', [SecurityNotificationController::class, 'markRead'], ['RoleMiddleware:security,admin']);
$router->put('/security/notifications/read-all', [SecurityNotificationController::class, 'markAllRead'], ['RoleMiddleware:security,admin']);
$router->get('/tenant/dashboard', [TenantController::class, 'dashboard'], ['RoleMiddleware:tenant']);
$router->get('/tenant/notifications', [TenantNotificationController::class, 'index'], ['RoleMiddleware:tenant']);
$router->put('/tenant/notifications/{id}/read', [TenantNotificationController::class, 'markRead'], ['RoleMiddleware:tenant']);
$router->put('/tenant/notifications/read-all', [TenantNotificationController::class, 'markAllRead'], ['RoleMiddleware:tenant']);

$router->get('/tenant/complaints', [TenantComplaintController::class, 'index'], ['RoleMiddleware:tenant']);
$router->post('/tenant/complaints', [TenantComplaintController::class, 'store'], ['RoleMiddleware:tenant']);
$router->get('/tenant/complaints/{id}', [TenantComplaintController::class, 'show'], ['RoleMiddleware:tenant']);

$router->get('/admin/complaints', [AdminComplaintController::class, 'index'], ['RoleMiddleware:admin']);
$router->get('/admin/complaints/{id}', [AdminComplaintController::class, 'show'], ['RoleMiddleware:admin']);
$router->put('/admin/complaints/{id}', [AdminComplaintController::class, 'update'], ['RoleMiddleware:admin']);
$router->delete('/admin/complaints/{id}', [AdminComplaintController::class, 'destroy'], ['RoleMiddleware:admin']);
$router->post('/admin/complaints/{id}/assign', [AdminComplaintController::class, 'assign'], ['RoleMiddleware:admin']);
$router->post('/admin/complaints/{id}/status', [AdminComplaintController::class, 'status'], ['RoleMiddleware:admin']);

$router->get('/tenant/maintenance-requests', [TenantMaintenanceRequestController::class, 'index'], ['RoleMiddleware:tenant']);
$router->post('/tenant/maintenance-requests', [TenantMaintenanceRequestController::class, 'store'], ['RoleMiddleware:tenant']);
$router->get('/tenant/maintenance-requests/{id}', [TenantMaintenanceRequestController::class, 'show'], ['RoleMiddleware:tenant']);
$router->post('/tenant/maintenance-requests/{id}/cancel', [TenantMaintenanceRequestController::class, 'cancel'], ['RoleMiddleware:tenant']);

$router->get('/admin/maintenance-requests', [AdminMaintenanceRequestController::class, 'index'], ['RoleMiddleware:admin']);
$router->get('/admin/maintenance-requests/{id}', [AdminMaintenanceRequestController::class, 'show'], ['RoleMiddleware:admin']);
$router->put('/admin/maintenance-requests/{id}', [AdminMaintenanceRequestController::class, 'update'], ['RoleMiddleware:admin']);
$router->delete('/admin/maintenance-requests/{id}', [AdminMaintenanceRequestController::class, 'destroy'], ['RoleMiddleware:admin']);
$router->post('/admin/maintenance-requests/{id}/assign', [AdminMaintenanceRequestController::class, 'assign'], ['RoleMiddleware:admin']);
$router->post('/admin/maintenance-requests/{id}/assign-staff', [AdminMaintenanceRequestController::class, 'assignStaff'], ['RoleMiddleware:admin']);
$router->post('/admin/maintenance-requests/{id}/status', [AdminMaintenanceRequestController::class, 'status'], ['RoleMiddleware:admin']);

$router->post('/public/scan/visitor-entry', [PublicScanController::class, 'visitorEntry'], ['RateLimitMiddleware:20,300', 'GateTokenMiddleware:visitor-entry']);
$router->post('/public/scan/visitor-checkout', [PublicScanController::class, 'visitorCheckout'], ['RateLimitMiddleware:20,300', 'GateTokenMiddleware:visitor-checkout']);
$router->post('/public/scan/vehicle-entry', [PublicScanController::class, 'vehicleEntry'], ['RateLimitMiddleware:20,300', 'GateTokenMiddleware:vehicle-entry']);
$router->post('/public/scan/vehicle-checkout', [PublicScanController::class, 'vehicleCheckout'], ['RateLimitMiddleware:20,300', 'GateTokenMiddleware:vehicle-checkout']);

// ── Rental Marketplace (P9/P10) ──────────────────────────────────────────────
$router->get('/admin/rental/dashboard', [AdminRentalController::class, 'dashboard'], ['RoleMiddleware:admin']);
$router->get('/admin/rental/listings', [AdminRentalController::class, 'index'], ['RoleMiddleware:admin']);
$router->get('/admin/rental/listings/{id}', [AdminRentalController::class, 'show'], ['RoleMiddleware:admin']);
$router->post('/admin/rental/listings/{id}/approve', [AdminRentalController::class, 'approve'], ['RoleMiddleware:admin']);
$router->post('/admin/rental/listings/{id}/feature', [AdminRentalController::class, 'feature'], ['RoleMiddleware:admin']);
$router->delete('/admin/rental/listings/{id}', [AdminRentalController::class, 'destroy'], ['RoleMiddleware:admin']);

$router->get('/tenant/rental/listings', [TenantRentalController::class, 'index'], ['RoleMiddleware:tenant']);
$router->get('/tenant/rental/listings/{id}', [TenantRentalController::class, 'show'], ['RoleMiddleware:tenant']);
$router->get('/tenant/rental/my-listings', [TenantRentalController::class, 'myListings'], ['RoleMiddleware:tenant']);
$router->post('/tenant/rental/listings', [TenantRentalController::class, 'store'], ['RoleMiddleware:tenant']);
$router->put('/tenant/rental/listings/{id}', [TenantRentalController::class, 'update'], ['RoleMiddleware:tenant']);
$router->delete('/tenant/rental/listings/{id}', [TenantRentalController::class, 'destroy'], ['RoleMiddleware:tenant']);
$router->post('/tenant/rental/listings/{id}/favorite', [TenantRentalController::class, 'toggleFavorite'], ['RoleMiddleware:tenant']);
$router->get('/tenant/rental/favorites', [TenantRentalController::class, 'myFavorites'], ['RoleMiddleware:tenant']);

// ── Local Business Ads (P11) ──────────────────────────────────────────────────
$router->get('/admin/business-ads', [AdminBusinessAdController::class, 'index'], ['RoleMiddleware:admin']);
$router->post('/admin/business-ads', [AdminBusinessAdController::class, 'store'], ['RoleMiddleware:admin']);
$router->get('/admin/business-ads/dashboard', [AdminBusinessAdController::class, 'dashboard'], ['RoleMiddleware:admin']);
$router->get('/admin/business-ads/{id}', [AdminBusinessAdController::class, 'show'], ['RoleMiddleware:admin']);
$router->put('/admin/business-ads/{id}', [AdminBusinessAdController::class, 'update'], ['RoleMiddleware:admin']);
$router->delete('/admin/business-ads/{id}', [AdminBusinessAdController::class, 'destroy'], ['RoleMiddleware:admin']);
$router->post('/admin/business-ads/{id}/status', [AdminBusinessAdController::class, 'status'], ['RoleMiddleware:admin']);
$router->get('/admin/business-categories', [AdminBusinessAdController::class, 'categories'], ['RoleMiddleware:admin']);
$router->post('/admin/business-categories', [AdminBusinessAdController::class, 'createCategory'], ['RoleMiddleware:admin']);
$router->put('/admin/business-categories/{id}', [AdminBusinessAdController::class, 'updateCategory'], ['RoleMiddleware:admin']);
$router->delete('/admin/business-categories/{id}', [AdminBusinessAdController::class, 'deleteCategory'], ['RoleMiddleware:admin']);

$router->get('/tenant/business-ads', [TenantBusinessAdController::class, 'index'], ['RoleMiddleware:tenant']);
$router->get('/tenant/business-ads/{id}', [TenantBusinessAdController::class, 'show'], ['RoleMiddleware:tenant']);
$router->post('/tenant/business-ads/{id}/click', [TenantBusinessAdController::class, 'click'], ['RoleMiddleware:tenant']);
$router->get('/tenant/business-categories', [TenantBusinessAdController::class, 'categories'], ['RoleMiddleware:tenant']);

// ── Announcements (P12) ───────────────────────────────────────────────────────
$router->get('/admin/announcements', [AdminAnnouncementController::class, 'index'], ['RoleMiddleware:admin']);
$router->post('/admin/announcements', [AdminAnnouncementController::class, 'store'], ['RoleMiddleware:admin']);
$router->get('/admin/announcements/{id}', [AdminAnnouncementController::class, 'show'], ['RoleMiddleware:admin']);
$router->put('/admin/announcements/{id}', [AdminAnnouncementController::class, 'update'], ['RoleMiddleware:admin']);
$router->post('/admin/announcements/{id}/publish', [AdminAnnouncementController::class, 'publish'], ['RoleMiddleware:admin']);
$router->delete('/admin/announcements/{id}', [AdminAnnouncementController::class, 'destroy'], ['RoleMiddleware:admin']);

$router->get('/tenant/announcements', [TenantAnnouncementController::class, 'index'], ['RoleMiddleware:tenant']);
$router->get('/tenant/announcements/unread-count', [TenantAnnouncementController::class, 'unreadCount'], ['RoleMiddleware:tenant']);
$router->get('/tenant/announcements/{id}', [TenantAnnouncementController::class, 'show'], ['RoleMiddleware:tenant']);
$router->post('/tenant/announcements/{id}/read', [TenantAnnouncementController::class, 'markRead'], ['RoleMiddleware:tenant']);

// ── Emergency Contacts (P13) ──────────────────────────────────────────────────
$router->get('/admin/emergency-contacts', [AdminEmergencyController::class, 'index'], ['RoleMiddleware:admin']);
$router->post('/admin/emergency-contacts', [AdminEmergencyController::class, 'store'], ['RoleMiddleware:admin']);
$router->put('/admin/emergency-contacts/{id}', [AdminEmergencyController::class, 'update'], ['RoleMiddleware:admin']);
$router->delete('/admin/emergency-contacts/{id}', [AdminEmergencyController::class, 'destroy'], ['RoleMiddleware:admin']);

$router->get('/tenant/emergency-contacts', [TenantEmergencyController::class, 'index'], ['RoleMiddleware:tenant']);
$router->get('/security/emergency-contacts', [TenantEmergencyController::class, 'index'], ['RoleMiddleware:security,admin']);

// ── Daily Workers (P14) ───────────────────────────────────────────────────────
$router->get('/admin/daily-workers', [AdminDailyWorkerController::class, 'index'], ['RoleMiddleware:admin,security']);
$router->post('/admin/daily-workers', [AdminDailyWorkerController::class, 'store'], ['RoleMiddleware:admin']);
$router->get('/admin/daily-workers/today-summary', [AdminDailyWorkerController::class, 'todaySummary'], ['RoleMiddleware:admin,security']);
$router->get('/admin/daily-workers/attendance', [AdminDailyWorkerController::class, 'attendance'], ['RoleMiddleware:admin,security']);
$router->get('/admin/daily-workers/{id}', [AdminDailyWorkerController::class, 'show'], ['RoleMiddleware:admin,security']);
$router->put('/admin/daily-workers/{id}', [AdminDailyWorkerController::class, 'update'], ['RoleMiddleware:admin']);
$router->delete('/admin/daily-workers/{id}', [AdminDailyWorkerController::class, 'destroy'], ['RoleMiddleware:admin']);
$router->post('/admin/daily-workers/{id}/qr', [AdminDailyWorkerController::class, 'generateQr'], ['RoleMiddleware:admin']);
$router->post('/admin/worker-attendance', [AdminDailyWorkerController::class, 'markAttendance'], ['RoleMiddleware:admin,security']);
$router->post('/admin/worker-entry', [AdminDailyWorkerController::class, 'recordEntry'], ['RoleMiddleware:admin,security']);
$router->post('/admin/worker-exit', [AdminDailyWorkerController::class, 'recordExit'], ['RoleMiddleware:admin,security']);


