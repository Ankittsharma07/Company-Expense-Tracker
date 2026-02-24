# SaaS Expense Tracker
Production-grade, multi-tenant expense management with approvals, multi-currency, and audit-ready notifications.

This app solves the pain of managing employee expenses across teams and countries by providing structured approvals, reliable FX conversions, and a complete audit trail.
It is built for finance teams, company admins, managers (optional), and employees in growing SaaS organizations.

# Table of Contents
1. Project Overview
1. Features
1. Architecture Overview
1. Data Model
1. Authentication
1. Currency System
1. Notifications
1. API Documentation
1. Frontend Pages Overview
1. How to Run Locally
1. Deployment
1. Testing
1. Notes and Best Practices
1. License

# Project Overview
This repository contains a production-ready SaaS Expense Tracker with:
- Frontend: React + Vite
- Backend: Node.js + Express
- Database: PostgreSQL + Prisma
- Authentication: Email/Password + Google OAuth
- Notifications: In-app + Email via Nodemailer (Gmail SMTP)
- Exchange Rates: ExchangeRate-API
- File Storage: Cloudinary
- Multi-currency support with stored historical FX snapshots
- Multi-tenant company support
- Role-based access control: Admin, Manager (optional), Employee

# Features
- Expense CRUD with receipt uploads
- Multi-level approvals (Manager -> Admin), with Manager optional
- Multi-currency with FX snapshots stored per expense
- Real historical FX conversion using stored rates
- Google login with account linking
- Notifications (email + in-app) + audit logs
- Team management and role updates
- Avatar uploads
- Company settings and subscription controls

# Architecture Overview
**High-level system diagram**
```
┌───────────────┐      HTTPS      ┌─────────────────────┐
│   Frontend    │  ────────────▶ │   Node/Express API  │
│  React (Vite) │                 │  Auth + Business    │
└───────────────┘                 │  Logic + Prisma     │
        ▲                         └──────────┬──────────┘
        │                                    │
        │                                    │
        │                                    ▼
        │                         ┌─────────────────────┐
        │                         │     PostgreSQL      │
        │                         │  Multi-tenant data  │
        │                         └─────────────────────┘
        │
        ├── Google OAuth (verify token)
        ├── ExchangeRate-API (FX snapshots)
        ├── Cloudinary (receipts + avatars)
        └── Gmail SMTP (Nodemailer)
```

**Role flow**
- Employee submits expense (status: `PENDING_MANAGER`)
- Manager approves/rejects
- If approved, expense goes to Admin (`PENDING_ADMIN`)
- Admin approves/rejects to final state
- If a company has zero Managers, expenses skip to `PENDING_ADMIN` automatically

**Currency model and storage rules**
- Each company has a base currency (`Company.baseCurrency`)
- Each expense stores original amount + currency and a stored FX snapshot
- Conversions use the stored snapshot, keeping historical accuracy
- Expense entry currencies are currently limited to `USD` and `INR` by validation

**Notification model**
- In-app notifications stored in `Notification`
- Email notifications sent via Nodemailer
- Audit logs recorded in `NotificationAuditLog` for both channels
- User preferences control email and in-app delivery

**OAuth flow**
- Frontend obtains Google token (ID token or access token)
- Backend verifies token or calls Google UserInfo
- If user exists, account is linked (`LOCAL_GOOGLE`)
- If user is new, a company is created and user becomes Admin

**Database schema relationships (high level)**
```
Company ──┬── Users ──┬── Expenses ──┬── Approvals
          │          └── Notifications
          │          └── NotificationAuditLogs
          └── PasswordResetAuditLogs
```

# Data Model
Prisma schema excerpts (see `expense-tracker-backend/prisma/schema.prisma`):

```prisma
enum Role { ADMIN MANAGER EMPLOYEE }
enum ExpenseStatus { PENDING_MANAGER PENDING_ADMIN APPROVED REJECTED }
enum ApprovalLevel { MANAGER ADMIN }
enum NotificationChannel { EMAIL IN_APP }

model Company {
  id           String   @id @default(cuid())
  name         String
  plan         Plan     @default(FREE)
  baseCurrency String   @default("INR")
  users        User[]
  expenses     Expense[]
}

model User {
  id         String @id @default(cuid())
  companyId  String
  role       Role   @default(EMPLOYEE)
  email      String @unique
  authProvider AuthProvider @default(LOCAL)
  emailNotificationsEnabled Boolean @default(true)
  inAppNotificationsEnabled Boolean @default(true)
  preferredCurrency String?
  avatarUrl  String?
}

model Expense {
  id               String @id @default(cuid())
  companyId        String
  userId           String
  amount           Decimal
  currency         String
  originalAmount   Decimal
  originalCurrency String
  exchangeRate     Decimal
  baseAmount       Decimal
  baseCurrency     String
  exchangeRateBase String?
  exchangeRates    Json?
  status           ExpenseStatus @default(PENDING_MANAGER)
}
```

**Table explanations**
- `User`: Auth, profile, role, notification preferences, currency preference, avatars.
- `Company`: Multi-tenant boundary, base currency, plan.
- `Expense`: Original amount/currency, base currency conversions, stored FX snapshot, receipt metadata, status.
- `Approval`: Audit trail for manager/admin decisions.
- `Notification`: In-app notifications for each user.
- `NotificationAuditLog`: Email/In-app delivery log with channel and status.
- `PasswordResetToken`: Secure reset tokens for password reset.
- `PasswordResetAuditLog`: Admin-driven reset audit trail.

# Authentication
**Email/Password**
- `POST /api/auth/signup` creates company + Admin
- `POST /api/auth/login` returns JWT

**Google OAuth**
- `POST /api/auth/google` accepts token (ID token or access token)
- Backend verifies token or fetches UserInfo
- Existing LOCAL user with same email becomes `LOCAL_GOOGLE`

**JWT details**
- Signed with `JWT_SECRET`
- Expiration controlled by `JWT_EXPIRES_IN` (default `7d`)
- No refresh tokens in the current implementation

**Forgot/reset password**
- `POST /api/auth/forgot-password` sends reset link
- `POST /api/auth/reset-password` updates password using token

**Admin reset password**
- `POST /api/admin/users/:userId/reset-password`
- Records audit log in `PasswordResetAuditLog`

# Currency System
- One base currency per company (`Company.baseCurrency`)
- Each expense stores original amount + currency and a stored FX snapshot (`exchangeRates`)
- `baseAmount` is stored at create time using ExchangeRate-API
- Display conversions use stored snapshot to ensure historical consistency
- ExchangeRate-API is used at expense creation or via backfill script

**Example conversion logic**
```ts
const exchangeRate = getConversionRate({
  fromCurrency: originalCurrency,
  toCurrency: companyBaseCurrency,
  exchangeRateBase,
  exchangeRates,
});

const baseAmount = Number(originalAmount) * exchangeRate;
```

# Notifications
**In-app vs Email**
- In-app: stored in `Notification`
- Email: sent via Nodemailer

**Triggers**
- Expense submitted: notifies Managers and Admins
- Manager approve/reject: notifies Employee
- Admin final approve/reject: notifies Employee (and Manager if applicable)

**Admin notification rules**
- Manager notifications go only to users with role `MANAGER`
- Admin notifications go only to users with role `ADMIN`
- If no managers exist, expenses skip directly to Admin approval

**Audit log**
- Every notification attempt creates an audit log with channel, status, and optional reason

**Notification preferences**
- `PATCH /api/users/me/notification-preferences` controls email and in-app delivery

# API Documentation
Base URL: `http://localhost:4000` (backend)  
Auth: `Authorization: Bearer <JWT>`

## Health
**`GET /health`**
- Auth: No
- Request: None
- Response: `{ "status": "ok" }`
- Errors: 500

## Auth
**`POST /api/auth/signup`**
- Auth: No
- Request:
```json
{ "companyName": "Acme", "name": "Admin", "email": "admin@acme.com", "password": "Secret123" }
```
- Response: `{ token, user, company }`
- Errors: 400 validation, 400 email exists

**`POST /api/auth/login`**
- Auth: No
- Request:
```json
{ "email": "admin@acme.com", "password": "Secret123" }
```
- Response: `{ token, user, company }`
- Errors: 400 validation, 401 invalid credentials

**`POST /api/auth/google`**
- Auth: No
- Request:
```json
{ "token": "<google_id_or_access_token>" }
```
- Response: `{ token, user, company }`
- Errors: 400 validation, 401 invalid token

**`POST /api/auth/forgot-password`**
- Auth: No
- Request:
```json
{ "email": "user@acme.com" }
```
- Response: `{ "message": "If that email exists, a reset link has been sent." }`
- Errors: 400 validation

**`POST /api/auth/reset-password`**
- Auth: No
- Request:
```json
{ "token": "<reset_token>", "password": "NewPassword1" }
```
- Response: `{ "message": "Password has been reset successfully." }`
- Errors: 400 validation, 400 invalid/expired token

## Company
**`GET /api/company/me`**
- Auth: Yes
- Request: None
- Response: Company object
- Errors: 404 not found

**`PATCH /api/company/plan`**
- Auth: Admin only
- Request:
```json
{ "plan": "FREE" }
```
- Response: Updated company
- Errors: 400 validation

**`PATCH /api/company/currency`**
- Auth: Admin only
- Request:
```json
{ "baseCurrency": "USD" }
```
- Response: Updated company
- Errors: 400 validation

**`GET /api/company/currencies`**
- Auth: Yes
- Request: None
- Response: Array of supported currencies
- Errors: 500

**`GET /api/company/rate?from=USD&to=INR`**
- Auth: Yes
- Request: Query params `from`, `to`
- Response:
```json
{ "from": "USD", "to": "INR", "rate": 82.3, "provider": "ExchangeRate-API", "timestamp": "2026-02-10T..." }
```
- Errors: 400 validation

## Users
**`GET /api/users/me`**
- Auth: Yes
- Request: None
- Response: User object
- Errors: 404

**`POST /api/users/me/avatar`**
- Auth: Yes
- Request: `multipart/form-data` with `avatar` file (JPEG/PNG/WEBP, max 2MB)
- Response: Updated user
- Errors: 400 upload errors

**`PATCH /api/users/me/notification-preferences`**
- Auth: Yes
- Request:
```json
{ "emailNotificationsEnabled": true, "inAppNotificationsEnabled": true }
```
- Response: Updated user
- Errors: 400 validation

**`PATCH /api/users/me/currency`**
- Auth: Yes
- Request:
```json
{ "preferredCurrency": "USD" }
```
- Response: Updated user
- Errors: 400 validation

**`GET /api/users`**
- Auth: Admin only
- Request: None
- Response: Array of users
- Errors: 401/403

**`POST /api/users`**
- Auth: Admin only
- Request:
```json
{ "name": "Bob", "email": "bob@acme.com", "password": "Secret123", "role": "MANAGER" }
```
- Response: Created user
- Errors: 400 validation, 403 plan limit

**`PATCH /api/users/:id/role`**
- Auth: Admin only
- Request:
```json
{ "role": "EMPLOYEE" }
```
- Response: Updated user
- Errors: 400 validation

**`PATCH /api/users/:id`**
- Auth: Admin only
- Request:
```json
{ "name": "New Name", "email": "new@acme.com" }
```
- Response: Updated user
- Errors: 400 validation

## Expenses
**`POST /api/expenses`**
- Auth: Yes
- Request: JSON or `multipart/form-data` with optional `receipt` file (JPEG/PNG/PDF, max 5MB)
```json
{ "description": "Taxi", "category": "Travel", "amount": 25, "currency": "USD", "expenseDate": "2026-02-10T10:00:00Z" }
```
- Response: Expense object
- Errors: 400 validation, 403 receipt upload by non-employee, 500 Cloudinary upload failure

**`GET /api/expenses`**
- Auth: Yes
- Request: Query params `status`, `category`, `userId`, `from`, `to`
- Response: Array of expenses
- Errors: 401/403

**`GET /api/expenses/:id`**
- Auth: Yes
- Request: None
- Response: Expense with user and approvals
- Errors: 404

**`PATCH /api/expenses/:id`**
- Auth: Yes
- Request: JSON or `multipart/form-data` with optional `receipt` file
```json
{ "description": "Updated", "removeReceipt": true }
```
- Response: Updated expense
- Errors: 400 validation, 403 non-owner, 500 Cloudinary upload failure

**`DELETE /api/expenses/:id`**
- Auth: Yes (owner only)
- Request: None
- Response: `{ "id": "<expenseId>" }`
- Errors: 403 non-owner, 404 not found

## Approvals
**`GET /api/approvals/pending`**
- Auth: Yes
- Request: None
- Response: Role-scoped pending expenses
- Errors: 401/403

**`GET /api/approvals/counts`**
- Auth: Yes
- Request: None
- Response: `{ "pending": 0 }`
- Errors: 401/403

**`POST /api/approvals/:expenseId/manager`**
- Auth: Manager only
- Request:
```json
{ "decision": "approve", "comment": "Looks good" }
```
- Response: Updated expense
- Errors: 400 invalid status

**`POST /api/approvals/:expenseId/admin`**
- Auth: Admin only
- Request:
```json
{ "decision": "reject", "comment": "Missing receipt" }
```
- Response: Updated expense
- Errors: 400 invalid status

## Analytics
**`GET /api/analytics/monthly?year=2026&displayCurrency=USD`**
- Auth: Yes
- Request: Query params `year`, `displayCurrency`
- Response: Monthly totals
- Errors: 400 validation

**`GET /api/analytics/categories?from=2026-01-01&to=2026-02-01&displayCurrency=USD`**
- Auth: Yes
- Request: Query params `from`, `to`, `displayCurrency`
- Response: Category totals
- Errors: 400 validation

## Reports
**`GET /api/reports/export/excel?startDate=2026-01-01&endDate=2026-02-01&displayCurrency=USD`**
- Auth: Yes
- Response: Excel file (binary)
- Errors: 400 invalid date, 500 export error

**`GET /api/reports/export/pdf?startDate=2026-01-01&endDate=2026-02-01&displayCurrency=USD`**
- Auth: Yes
- Response: PDF file (binary)
- Errors: 400 invalid date, 500 export error

## Notifications
**`GET /api/notifications`**
- Auth: Yes
- Request: Optional `limit` query param
- Response: Array of notifications
- Errors: 400 validation

**`GET /api/notifications/unread-count`**
- Auth: Yes
- Response: `{ "unread": 3 }`
- Errors: 500

**`PATCH /api/notifications/:id/read`**
- Auth: Yes
- Response: Updated notification
- Errors: 404

**`GET /api/notifications/audit`**
- Auth: Admin only
- Request: Optional `limit` query param
- Response: Notification audit logs (latest)
- Errors: 400 validation

**`GET /api/notification-audit`**
- Auth: Yes
- Request: Optional query params `page`, `limit`, `userId`, `channel`, `status`
- Response: `{ logs, pagination }`
- Errors: 500

## Subscription
**`GET /api/subscription`**
- Auth: Admin only
- Response: Subscription details (plan + limits)
- Errors: 401/403

**`POST /api/subscription/upgrade`**
- Auth: Admin only
- Response: Updated subscription
- Errors: 401/403

## Admin
**`POST /api/admin/users/:userId/reset-password`**
- Auth: Admin only
- Response: `{ "message": "Password reset email sent." }`
- Errors: 400 user not found

# Frontend Pages Overview
- Dashboard (role-specific)
- Expense listing and filters
- Expense creation with receipt upload
- Approvals (Manager/Admin)
- Team management (Admin)
- Settings (company and user preferences)
- Notification UI + unread count
- Reports and analytics
- Subscription management
- Auth pages (Login, Signup, Forgot/Reset)

# How to Run Locally
## Prerequisites
- Node.js 18+ (recommended)
- PostgreSQL 14+
- Cloudinary account
- ExchangeRate-API key
- Google OAuth credentials

## Environment Variables
Frontend `.env` (root):
```
VITE_API_URL=http://localhost:4000
VITE_GOOGLE_CLIENT_ID=your_google_client_id
```

Backend `.env` (`expense-tracker-backend/.env`):
```
PORT=4000
DATABASE_URL=postgresql://user:password@localhost:5432/expense_tracker
DIRECT_URL=postgresql://user:password@localhost:5432/expense_tracker
JWT_SECRET=supersecret
JWT_EXPIRES_IN=7d
BCRYPT_SALT_ROUNDS=10
FREE_PLAN_EMPLOYEE_LIMIT=5
FRONTEND_URL=http://localhost:5173

CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...

SMTP_HOST=smtp.gmail.com
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER=your_gmail_user
SMTP_PASS=your_gmail_app_password
EMAIL_FROM=Expense Tracker <no-reply@expense-tracker.com>

EXCHANGERATE_API_KEY=...
EXCHANGERATE_API_BASE_URL=https://v6.exchangerate-api.com/v6

GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
```

## Database migration
```
cd expense-tracker-backend
npm install
npm run prisma:generate
npm run prisma:migrate
```

## Running backend
```
cd expense-tracker-backend
npm run dev
```

## Running frontend
```
npm install
npm run dev
```

## Seeding data
No seed script is included yet. You can create initial users via `POST /api/auth/signup` and `POST /api/users`.

# Deployment
Example production checklist:
1. Build frontend and serve via CDN or static hosting (Netlify/Vercel/S3)
1. Deploy backend to a Node runtime (Render, AWS ECS, Fly.io, etc.)
1. Provision PostgreSQL (managed service recommended)
1. Set backend env vars (Cloudinary, SMTP/Gmail API, ExchangeRate-API, JWT)
1. Set frontend env vars (API base URL, Google client ID)
1. Ensure `FRONTEND_URL` matches your frontend domain
1. Run Prisma migrations in production

# Testing
Testing scaffolding is not included yet.
- Unit tests: add Jest/Vitest for services and utils
- Integration tests: supertest for API routes
- End-to-end tests: Playwright/Cypress for UI flows

# Notes and Best Practices
- Enforce least-privilege: Admin-only routes are protected by `requireRole("ADMIN")`.
- Validate currency logic carefully. Each expense stores an FX snapshot for consistent historical reporting.
- Keep `EXCHANGERATE_API_KEY` and email credentials in secure secret stores.
- Use Cloudinary signed uploads for large-scale production workloads.
- Indexes are defined in Prisma for multi-tenant query performance.
- Consider adding refresh tokens and rotation for longer-lived sessions.

# License
UNLICENSED (replace with your preferred license).
