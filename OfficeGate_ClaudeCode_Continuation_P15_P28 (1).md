# OfficeGate Claude Code Continuation Guide

## Continue Development from Prompt 14 to Prompt 28

> This document is intended for a Claude Code agent taking over the
> project after Prompt 14. Read this entire document before making
> changes.

# 1. Current Architecture

## Tech Stack

-   Backend: PHP 8.2 (Custom REST API)
-   Frontend: React + TypeScript + Vite
-   Styling: TailwindCSS + shadcn/ui
-   State: Zustand
-   Authentication: JWT + Refresh Tokens + OTP
-   Database: SQLite (Development), MySQL (Production)
-   Roles:
    -   Admin
    -   Security
    -   Tenant

## Mandatory Development Rules

-   NEVER rewrite the architecture.
-   NEVER replace existing authentication.
-   NEVER introduce Redux or another state library.
-   Reuse:
    -   CRUDModel
    -   ResourceController
    -   api.ts
    -   Zustand
    -   DataTable
    -   Card
    -   Dialog
    -   SearchInput
    -   StatusBadge
    -   AuditService
    -   RoleMiddleware
-   Every new feature must follow: Migration → Model → Controller →
    Route → api.ts → Zustand → Page → Sidebar → Dashboard → Testing.
-   Use soft delete, audit logging, validation, indexes and existing API
    response envelope.

# 2. Current Progress

## Completed (Batch 1)

1.  Complaint Management
2.  Notification Center
3.  Maintenance Request Module
4.  Remove Mock Data
5.  Secure Visitor OTP
6.  Vendor Marketplace Backend
7.  Vendor Marketplace UI
8.  Vendor Reviews & Booking

## Completed (Batch 2)

9.  Rental Marketplace
10. Rental Approval Workflow
11. Local Business Advertisement Module
12. Announcement Management
13. Emergency Contacts
14. Daily Workers

Treat prompts 1--14 as completed. Continue only from Prompt 15.

# 3. Remaining Roadmap

## Batch 3

### Prompt 15 -- Secretary Portal

Reason: Apartment secretaries need operational access without full admin
privileges. Implement a Secretary Dashboard using the existing Admin
role with configurable permissions. Include: - Visitors - Complaints -
Maintenance - Announcements - Rentals - Vendor Requests - Reports -
Dashboard widgets - Notifications - Audit Logs - Responsive UI

### Prompt 16 -- WhatsApp Integration (Free)

Reason: Many residents prefer WhatsApp instead of installing an app. Do
NOT use the official WhatsApp Business API. Implement share links for: -
Visitor Invite - Complaint Update - Maintenance Reminder - Rental
Listing - Vendor Recommendation - Announcement - Invoice Reminder -
Emergency Contact Provide Share, Copy Link, Copy Message and QR options.

### Prompt 17 -- Smart QR Visitor System

Reason: Faster and safer visitor management. Extend QR support with: -
Guest Pass - Delivery Pass - Worker Pass - Temporary Pass - Recurring
Pass - Expiry - Validation - PDF Download - WhatsApp Share - Email
Share - Dashboard statistics

### Prompt 18 -- Community Analytics

Reason: Management needs insights instead of raw data. Create analytics
for: - Occupancy - Complaints - Maintenance - Vendors - Rentals -
Visitors - Revenue - Charts - PDF Export - Excel Export Replace
remaining mock charts.

### Prompt 19 -- Community Events

Reason: Manage apartment events digitally. Create: - community_events -
event_registrations Features: - Calendar - Registration - Capacity -
Notifications - WhatsApp Share - Dashboard

### Prompt 20 -- Resident Service Hub

Reason: Give tenants one place for all services. Create a unified portal
containing: Complaints, Maintenance, Visitor Pass, Vendors, Rentals,
Announcements, Emergency Contacts, Invoices, Payments, Downloads, Recent
Activity and Quick Actions.

# Batch 4

### Prompt 21 -- CCTV Integration Foundation

Reason: Prepare for future smart surveillance. Do NOT integrate
proprietary software. Create: - camera_devices - camera_events -
camera_snapshots Implement: Camera CRUD, Health, Status, Timeline,
Snapshots, Motion Events, Vehicle Events, Unknown Person Events,
Dashboard, Future-ready RTSP/IP architecture. Keep AI detection as
future work.

### Prompt 22 -- Premium Membership & Revenue System

Reason: Prepare future monetization. Create: - subscription_plans -
subscriptions - premium_features Plans: Free, Premium, Enterprise.
Include Featured Vendors, Featured Rentals, Premium Ads, Analytics
Access, Subscriber Dashboard. Architecture only. No payment integration.

### Prompt 23 -- Advertisement Billing & Analytics

Reason: Monetize local business advertisements. Implement: Ad Packages,
Package Duration, Clicks, Views, CTR, Impressions, Featured Ads, Revenue
Analytics, Renewal Reminder, Reports, Notifications, Audit Logs.

### Prompt 24 -- Razorpay Production Integration

Reason: Enable online maintenance payments. Integrate Razorpay using
existing invoice/payment architecture. Implement: Create Order, Verify
Payment, History, Invoice Download, Webhook-ready flow, Failed Payment,
Retry, Refund Placeholder, Email Receipt, Dashboard, Test & Production
modes. Never hardcode secrets.

### Prompt 25 -- Performance Optimization

Reason: Improve scalability before production. Optimize: Indexes,
Queries, Pagination, Caching, Lazy Loading, Code Splitting, Image
Optimization, Bundle Size, Zustand performance, Skeletons, Error
Boundaries. Generate optimization report. Do not change functionality.

### Prompt 26 -- Security Hardening

Reason: Prepare for production deployment. Audit and improve:
Validation, SQL Injection, XSS, CSRF, Rate Limiting, Authentication,
Authorization, Permissions, File Upload Validation, Password Policy,
HTTPS, Session Security, Environment Variables. Generate Security
Report.

### Prompt 27 -- Documentation & Testing

Reason: Simplify maintenance and deployment. Update: README, API Docs,
Database Docs, Deployment Guide, Environment Variables, Developer Guide,
Architecture Diagram. Generate: Unit Tests, Integration Tests, API
Tests, Role Tests, Performance Tests. Ensure builds pass and fix compile
errors.

### Prompt 28 -- Final Production Release

Reason: Deliver a production-ready application. Verify: Authentication,
Admin, Security, Tenant, Visitors, Vehicles, Complaints, Maintenance,
Vendor Marketplace, Rental Marketplace, Business Ads, Announcements,
Emergency Contacts, Daily Workers, Notifications, Payments, Reports, QR,
WhatsApp Sharing, Secretary Dashboard, Analytics. Check: Broken Links,
Unused Files, Dead Code, Duplicate Components, Console Errors,
TypeScript Errors, Build Warnings, Migrations, API Consistency,
Responsive Design, Dark Mode, Accessibility. Generate
FINAL_RELEASE_REPORT.md including: Completed Features, Known
Limitations, Future Roadmap, Deployment Checklist, Version and Release
Notes. Ensure backend/frontend build successfully with no failing tests.

# 4. Recommended Execution Order

Execute sequentially: 15 → 16 → 17 → 18 → 19 → 20 → 21 → 24 → 25 → 26 →
27 → 28

Defer until commercialization: 22 → Premium Membership 23 →
Advertisement Billing

# Final Instruction

Continue from Prompt 15 only. Do not revisit completed prompts unless
fixing integration bugs. Extend the existing OfficeGate architecture and
keep the application production-ready.
