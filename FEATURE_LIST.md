# OfficeGate — Complete Feature List
**Prepared by:** Kynetropo  
**Project:** Apartment Management System  
**Date:** July 2026  
**Platform:** apartments-demo.kynetropo.com

---

## 1. Authentication & User Management

- 4-tier login system: Super Admin, Admin (Secretary), Security, Tenant
- JWT authentication with refresh tokens
- OTP-based phone login for tenants/security
- Forgot password flow
- Session management (auto-logout, token refresh)
- Password change from within the app
- User suspend / unsuspend (admin can disable any account without deleting)
- Role-based access control — each role sees only its modules
- Super Admin can create organisations with secretary credentials in one flow
- Admin can create tenant and security accounts

---

## 2. Super Admin Portal (Platform Management)

- Organisation creation — includes secretary credentials, feature selection, billing plan in one form
- Multi-organisation overview (users, revenue, subscriptions per org)
- Feature toggle per organisation (enable/disable any module per apartment)
- Subscription plan management (Free / Premium / Enterprise)
- Subscriber dashboard with MRR
- Business Ads management and billing
- Ad performance analytics (impressions, clicks, CTR)
- AMC (Annual Maintenance Contract) management

---

## 3. Visitor Management

- Visitor entry registration with full form (name, phone, gender, block, floor, flat, company, whom to meet, purpose, vehicle)
- Fullscreen webcam photo capture on entry
- OTP-verified visitor entry via QR gate kiosk
- QR gate scan pages for visitor entry and exit — full form with camera
- Visitor checkout with exit time logging
- Active visitor list (currently inside)
- Full visitor history and search
- Visitor Management dashboard (admin)
- Tenant visitor approval (tick/approve button from tenant dashboard)

---

## 4. Smart QR Visitor Pass System

- 6 pass types: Temporary, One Day, Recurring, Delivery, Worker, Guest
- QR code generation per pass
- Expiry time and max-use limits
- Scan history per pass (entry/exit)
- Auto-expire passes
- PDF pass download and print
- WhatsApp share of pass link
- Security can scan and verify passes at gate
- Dashboard: today's passes, active, expired, used

---

## 5. Vehicle Management

- Vehicle entry registration (number, type, model, owner name, phone, block, floor, parking user type)
- Fullscreen webcam photo capture on vehicle entry
- QR gate scan pages for vehicle entry and exit — full form with camera
- Vehicle checkout with exit time
- Active vehicle list
- Vehicle history

---

## 6. Security Login (Dedicated)

- Dedicated sidebar and full module access for security role
- Visitor entry and checkout
- Vehicle entry and checkout
- Visitor pass scanning and verification at gate
- Daily workers management
- Emergency contacts (view)
- Security notifications
- Business ads (view)

---

## 7. Complaint Management

- Tenant raises complaints (category, priority, subject, description, photo attachment)
- Works without office linked to account
- Admin views all complaints, assigns vendor, updates status
- Status flow: Open → Assigned → In Progress → Resolved → Closed
- Tenant sees real-time status updates from admin
- WhatsApp share of complaint update

---

## 8. Maintenance Request Management

- Tenant submits maintenance requests (type, description, photo attachment)
- Admin assigns to vendor/staff, updates status
- Tenant tracks request status in real time
- WhatsApp maintenance reminder sharing

---

## 9. Vendor Management & Marketplace

- Vendor registration and CRUD (admin)
- Vendor categories and services
- Vendor photo gallery
- Admin can set/update vendor star rating
- Tenant browses vendor marketplace
- Tenant books a vendor service
- Tenant writes review and rating
- Tenant can recommend/submit a new vendor
- Top-rated and most-booked vendor lists
- Review moderation (admin)

---

## 10. Staff & Payroll

- Staff registration with role, department, contact, base salary
- Monthly attendance marking (Present / Absent / Half-day)
- Attendance persists between sessions (fetched from backend on load)
- Payroll generation with month/year filtering
- Payroll + Attendance combined view tab
- Payroll runs history
- Attendance summary per month per staff member

---

## 11. Inventory & Asset Tracking

- Inventory items (category, quantity, unit cost, vendor, location)
- Inventory movement tracking
- Asset registration with unique auto-generated asset tag
- Asset checkout/checkin per staff member
- Asset condition tracking (New / Good / Fair / Damaged / Retired)
- Periodic asset audit logs
- Asset summary dashboard

---

## 12. Financial Tracking & Payments

- Invoice creation and management
- Payment recording (cash, bank transfer, cheque)
- Razorpay online payment integration (order creation, signature verification, webhook handler)
- Failed payment retry
- Refund placeholder
- Financial summary (invoiced, paid, pending, overdue)
- Monthly revenue chart
- Invoice download
- WhatsApp invoice reminder

---

## 13. Office Expenses

- Expense logging by category
- Expense reports and summaries

---

## 14. Accounts & Compliance

- GST tracking
- Audit log
- Compliance reports

---

## 15. Announcements

- Admin creates and publishes announcements
- Tenant receives announcements in sidebar with unread badge
- Tenant dashboard shows glowing auto-rotating announcement banner
- WhatsApp share of announcements

---

## 16. Community Events

- Admin creates events (title, date, time, location, organiser, capacity)
- Tenant registers and cancels registration
- Upcoming and past events views
- Tenant dashboard glowing banner shows upcoming events
- WhatsApp share of events

---

## 17. Emergency Contacts

- Admin manages emergency contacts (name, role, phone)
- Tenant can view all emergency contacts
- Security can view emergency contacts
- WhatsApp share of contact

---

## 18. Daily Workers

- Worker registration with auto-generated QR code
- Attendance marking (entry/exit time)
- Worker visit logs
- Today's summary dashboard
- Security can manage daily workers

---

## 19. Rental Marketplace

- Tenant creates rental listings (flat/room/office)
- Admin approves/rejects/features listings
- Tenant browses available listings
- Favourites
- Featured listings

---

## 20. Local Business Advertisements

- Super Admin creates and manages business ads
- Visible to admin, security, and tenant roles
- Click tracking, impressions, CTR analytics
- Ad packages and billing
- Renewal reminders
- Revenue analytics

---

## 21. Community Analytics Dashboard

- Occupancy analytics
- Visitor trends (daily, weekly, monthly)
- Complaint analytics (by status, priority, trend)
- Maintenance analytics
- Vendor ratings and bookings
- Revenue analytics
- Daily worker attendance rate
- Chart.js visualisations
- Export to CSV / PDF print

---

## 22. Reports

- Visitor reports
- Vehicle reports
- Staff attendance reports
- Complaint reports
- Maintenance reports
- CSV export for every report type
- Print / PDF export

---

## 23. Document Management

- Upload documents (PDF, images) per office/unit
- Expiry date tracking
- Proper PDF/image download (not JSON)
- Document categories

---

## 24. Medical Reports

- Upload medical reports for staff/residents
- Download uploaded reports

---

## 25. Name Transfer

- Ownership/tenancy name transfer requests
- Linked with office/unit management

---

## 26. CCTV Management Foundation

- Camera device registration (name, location, zone, IP/RTSP URL)
- Camera health monitoring (Online/Offline/Maintenance/Fault)
- Heartbeat ping
- Manual and automatic event logging
- Snapshot records
- Camera event timeline
- Dashboard (total cameras, unacknowledged events)
- Architecture ready for RTSP/AI integration

---

## 27. IoT Monitoring

- IoT device registration and management
- Device event ingestion
- Real-time status dashboard
- Home Assistant integration ready

---

## 28. Home Automation

- Hub management
- Device control per unit
- Tenant "My Home" page for personal device control

---

## 29. WhatsApp Integration (Free — Built-in)

- wa.me share links embedded across all modules (no paid API)
- Pre-filled message templates:
  - Visitor invite
  - Complaint update
  - Maintenance reminder
  - Vendor recommendation
  - Announcement
  - Emergency contact
  - Invoice reminder
- Copy message / Copy link / QR code options per share

---

## 30. Secretary Portal

- Admin sub-role with configurable module permissions
- Secretary dashboard with KPI widgets
- Module-level access control (can_view / can_edit per module)
- Secretary account created automatically during organisation provisioning

---

## 31. Resident Service Hub (Tenant)

- Unified single-page portal for all tenant services
- Live search — filters and hides non-matching services
- Pinned services (saved locally per user)
- Recent activity feed (complaints, maintenance, announcements)
- Quick action chips
- Glowing announcement/event banner at top

---

## 32. Utility Management

- Utility task scheduling (Lift, Sump, Electrical, etc.)
- Task completion tracking
- Overdue alerts

---

## 33. Settings & Customisation

- UI customiser (column visibility and reordering per page)
- UI settings stored per user

---

## Technical Stack

| Layer | Technology |
|-------|-----------|
| Backend | PHP 8.2, Custom REST API |
| Database | SQLite (dev) / MySQL (production) |
| Authentication | JWT + Refresh Tokens + OTP |
| Frontend | React 18 + TypeScript + Vite |
| Styling | TailwindCSS + shadcn/ui |
| State | Zustand |
| Charts | Chart.js |
| Payments | Razorpay |
| Deployment | Hostinger (LiteSpeed) |

---

*33 active modules | 70+ screens | 160+ API endpoints | 30+ database tables*
