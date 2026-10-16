# External Integrations

**Analysis Date:** 2026-10-16

## APIs & External Services

**Internal Client-Server API:**
- Matrix REST API (`matrix-backend`)
  - Consumer: `matrix-frontend` via Axios HTTP client (`matrix-frontend/src/api/client.ts`)
  - Base URL: `http://localhost:5000/api`
  - Authentication: Bearer JWT passed via `Authorization` header (`localStorage.getItem("matrix_token")`)
  - Endpoints:
    - `/api/auth` - Login and user profile verification
    - `/api/menus` - Role-based menu hierarchy and permission flags
    - `/api/inventory` - Item groups, items, item codes, attributes, metals
    - `/api/accounts` - Customer, vendor, and general ledger accounts
    - `/api/daybooks` - Daybook master records, groups, and voucher auto-numbering
    - `/api/payments` - Bank and cash payment/receipt vouchers
    - `/api/orders` - Repairing receipts, customer orders, and transaction line items
    - `/api/geo` - Countries, states, cities, areas, and pincodes lookup

**Third-Party Services:**
- None detected. No external SaaS APIs (Stripe, Twilio, SendGrid, AWS, Firebase, or external ERP connectors) are integrated.

## Data Storage

**Databases:**
- PostgreSQL (relational database engine)
  - Connection: `DATABASE_URL` environment variable loaded in `matrix-backend/src/db/index.ts`
  - Client / ORM: `pg` (node-postgres Pool) + `drizzle-orm` (0.45.2)
  - Migrations: `drizzle-kit` (`drizzle-kit push`, `drizzle-kit generate`) configured via `matrix-backend/drizzle.config.ts`
  - Schema definition: `matrix-backend/src/db/schema.ts`
  - Key Tables: `users`, `menus`, `metals`, `rate_types`, `item_groups`, `common_lists`, `attributes`, `items`, `item_codes`, `account_types`, `account_groups`, `accounts`, `daybook_groups`, `daybooks`, `payments`, `payment_details`, `orders`, `order_items`, `countries`, `states`, `cities`, `areas`, `pincodes`

**File Storage:**
- Local filesystem only (`matrix-backend/src/db/geo-data/` stores static geographic reference JSON files for initial seeding)
- No cloud object storage (S3, GCS, Azure Blob) is currently integrated

**Caching:**
- Client-side: In-memory query caching via `@tanstack/react-query` (`QueryClient` in `matrix-frontend/src/main.tsx`)
- Server-side: None. Every API request queries PostgreSQL directly via Drizzle ORM

## Authentication & Identity

**Auth Provider:**
- Custom JWT-based Authentication
  - Implementation: `jsonwebtoken` (9.0.3) in `matrix-backend/src/controllers/auth.ts` and `matrix-backend/src/middleware/auth.middleware.ts`
  - Password Hashing: `bcryptjs` (3.0.3) with 10 salt rounds
  - Secret: `process.env.JWT_SECRET` (fallback: `"matrix-super-secret-key-2026"`)
  - Client Token Storage: `localStorage.getItem("matrix_token")`
  - Audit Trail Hook: `authUserMiddleware` automatically stamps `addBy` (on POST) and `editBy` (on PUT/PATCH) based on `req.user.id`
  - Development Fallback: In non-production environments (`process.env.NODE_ENV !== "production"`), requests without tokens default to `req.user = { id: 1, email: "admin@company.com", name: "Admin User" }`

## Monitoring & Observability

**Error Tracking:**
- None detected (no Sentry, Datadog, or Rollbar)
- Errors logged to standard output via `console.error`

**Logs:**
- Console logging: Basic `console.log` and `console.error` in Express request handlers and server startup (`matrix-backend/src/index.ts`)

## CI/CD & Deployment

**Hosting:**
- Local execution configured via npm scripts (`npm run dev`)
- Git repository hosted on GitHub: `https://github.com/karanharsora12/Matrix.git`

**CI Pipeline:**
- No automated GitHub Actions, GitLab CI, or CircleCI configuration files found in repository root

## Environment Configuration

**Required Environment Variables (`matrix-backend/.env`):**
- `DATABASE_URL` - PostgreSQL connection URI (e.g., `postgresql://user:password@localhost:5432/matrix_db`)
- `PORT` - HTTP listening port for Express backend (default: 5000)
- `JWT_SECRET` - Secret key used for signing and verifying JSON Web Tokens
- `NODE_ENV` - Environment identifier (`development`, `production`, `test`)

**Secrets Location:**
- Stored in local untracked `.env` file within `matrix-backend/.env`
- Excluded from git via `.gitignore`

## Webhooks & Callbacks

**Incoming:**
- None

**Outgoing:**
- None

---

*Integration audit: 2026-10-16*
