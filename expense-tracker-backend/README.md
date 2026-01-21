# Expense Tracker Backend

Production-ready backend for a multi-tenant Company Expense Tracker SaaS.

## Tech Stack
- Node.js + Express
- PostgreSQL + Prisma
- JWT Auth
- bcrypt password hashing

## Setup (Local)
1. `cd expense-tracker-backend`
2. `cp .env.example .env` and fill values
3. `npm install`
4. `npx prisma generate`
5. `npx prisma migrate dev --name init`
6. `npm run dev`

The API runs at `http://localhost:4000` by default.

## Environment Variables
See `.env.example` for all required variables.

## Core Endpoints
### Auth
- `POST /api/auth/signup` (company + admin)
- `POST /api/auth/login`

### Company
- `GET /api/company/me`
- `PATCH /api/company/plan`

### Users (Admin)
- `GET /api/users`
- `POST /api/users`
- `PATCH /api/users/:id/role`

### Expenses
- `POST /api/expenses`
- `GET /api/expenses`
- `GET /api/expenses/:id`
- `PATCH /api/expenses/:id`
- `DELETE /api/expenses/:id`

### Approvals
- `POST /api/approvals/:expenseId/manager`
- `POST /api/approvals/:expenseId/admin`

### Analytics
- `GET /api/analytics/monthly?year=2024`
- `GET /api/analytics/categories?from=2024-01-01&to=2024-12-31`

### Subscription
- `GET /api/subscription`
- `POST /api/subscription/upgrade`

## Notes
- All data is tenant-isolated via `companyId`.
- Use the JWT access token in `Authorization: Bearer <token>`.
- FREE plan limits employees based on `FREE_PLAN_EMPLOYEE_LIMIT`.

## Deployment
This backend is ready for Render/Fly.io/Railway:
- Set environment variables
- Run `npm install`, `npx prisma generate`, and `npm start`
