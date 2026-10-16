<!-- refreshed: 2026-10-16 -->
# Architecture

**Analysis Date:** 2026-10-16

## System Overview

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│                       Frontend Client (React 19 + Vite 8)                   │
├──────────────────────┬──────────────────────┬───────────────────────────────┤
│    Pages & Views     │   Reusable UI & Grid │    State & Network Client     │
│  `matrix-frontend/   │  `matrix-frontend/   │  `matrix-frontend/            │
│   src/pages/*`       │   src/components/*`  │   src/api/*`, `src/store/*`   │
└──────────┬───────────┴──────────┬───────────┴───────────────┬───────────────┘
           │                      │                           │
           │ Axios HTTP (JSON)    │ Bearer JWT                │ TanStack Query
           ▼                      ▼                           ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                      Express 5 REST API Gateway Layer                       │
│  `matrix-backend/src/index.ts`, `matrix-backend/src/middleware/*`           │
├─────────────────────────────────────────────────────────────────────────────┤
│                      Controllers & Route Dispatchers                        │
│  `matrix-backend/src/routes/*`, `matrix-backend/src/controllers/*`          │
├─────────────────────────────────────────────────────────────────────────────┤
│                      Business Logic & Synchronizers                         │
│  `matrix-backend/src/services/*` (OrdersService, PaymentSyncService, etc.)  │
└─────────────────────────────────────┬───────────────────────────────────────┘
                                      │
                                      │ Drizzle ORM SQL Queries / Transactions
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                    PostgreSQL Relational Database                           │
│  `matrix-backend/src/db/schema.ts`, `matrix-backend/src/db/index.ts`        │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Component Responsibilities

| Component | Responsibility | File |
|-----------|----------------|------|
| Root Entry | Coordinates frontend and backend concurrent processes | `package.json` |
| Express Server | Configures CORS, JSON body parser, auth middleware, and API router mounts | `matrix-backend/src/index.ts` |
| Auth Middleware | Decodes JWT, attaches `req.user`, sets dev fallback user, and auto-injects audit fields (`addBy`, `editBy`) | `matrix-backend/src/middleware/auth.middleware.ts` |
| Database Engine | Configures `pg.Pool` connection and initializes Drizzle ORM instance | `matrix-backend/src/db/index.ts` |
| Relational Schema | Defines PostgreSQL tables, columns, relations, defaults, and foreign keys | `matrix-backend/src/db/schema.ts` |
| Orders Service | Handles order and repairing receipt lifecycle, voucher number sequence, line item calculations, and triggers payment sync | `matrix-backend/src/services/orders.service.ts` |
| Payment Sync Service | Synchronizes double-entry cash and bank payment vouchers linked to repairing receipts and invoices | `matrix-backend/src/services/payment-sync.service.ts` |
| Daybook Service | Generates sequential voucher numbers with prefix tracking and date checks | `matrix-backend/src/services/daybook.service.ts` |
| Geo Service | Hierarchical geographic search and CRUD for Countries, States, Cities, Areas, and Pincodes | `matrix-backend/src/services/geo.service.ts` |
| Frontend Router | Configures React Router DOM browser routes with `PublicRoute` and `ProtectedRoute` guards | `matrix-frontend/src/config/router.tsx` |
| ERP Layout Shell | Renders application layout with collapsible sidebar, header, shortcuts, and outlet view | `matrix-frontend/src/layouts/ERPLaoyut.tsx` |
| API Client | Configures Axios instance, sets API baseURL, and attaches auth token interceptor | `matrix-frontend/src/api/client.ts` |
| Data Grid Component | Wraps AG Grid with enterprise styling, keyboard navigation, sorting, and cell editors | `matrix-frontend/src/components/common/DataGrid.tsx` |
| Repairing Receipt View | Manages repairing receipt form state, repair item lines, weight calculations, payment details, and voucher mutations | `matrix-frontend/src/pages/transaction/repairing/repairing-receipt/RepairingReceipt.tsx` |
| Cash Voucher Form | Manages Cash and Bank Payment/Receipt vouchers with debit/credit account lines | `matrix-frontend/src/pages/transaction/payments/CashVoucherForm.tsx` |

## Pattern Overview

**Overall:** Layered Monorepo Architecture (Controller-Service-Data Access pattern in backend; Component-Query-Store pattern in frontend).

**Key Characteristics:**
- **Centralized Monorepo**: Frontend and backend are maintained side-by-side with root-level scripts for simultaneous development.
- **Strict Layering in Backend**: HTTP routing (`routes/`) -> Request parameter parsing & response serialization (`controllers/`) -> Domain logic & database transactions (`services/`) -> Drizzle ORM tables (`db/schema.ts`).
- **Two-Way Payment Synchronization**: Transactions that generate receipt payments (such as Repairing Receipts) automatically spawn or update linked cash/bank vouchers in the `payments` table via `paymentSyncService`.
- **Hybrid Frontend State Management**: TanStack Query handles server data fetching, mutations, and cache invalidation, while Redux Toolkit manages global in-memory session and inventory master caches.

## Layers

**Presentation Layer (`matrix-frontend/src/pages/*`, `matrix-frontend/src/components/*`):**
- Purpose: Render accessible interactive UI, dense accounting data grids, modal dialogs, and forms
- Contains: React components, AG Grid custom cell renderers/editors, Radix primitives, Lucide icons
- Depends on: `matrix-frontend/src/api/*`, `matrix-frontend/src/store/*`, `matrix-frontend/src/hooks/*`
- Used by: End users in web browser

**API Client Layer (`matrix-frontend/src/api/*`):**
- Purpose: Strongly typed API request functions and TanStack Query query/mutation hooks
- Contains: Axios request wrappers (`useOrder`, `useCreateOrder`, `usePayments`, `useAccounts`)
- Depends on: `matrix-frontend/src/api/client.ts`
- Used by: Pages and dialog components

**Server Entry & Middleware Layer (`matrix-backend/src/index.ts`, `matrix-backend/src/middleware/*`):**
- Purpose: HTTP request lifecycle, security policies, token decoding, and audit stamping
- Contains: `authUserMiddleware`, `requireAuth`, CORS, JSON body parser
- Depends on: `jsonwebtoken`, `express`
- Used by: Express routing pipeline

**Controller Layer (`matrix-backend/src/controllers/*`):**
- Purpose: HTTP endpoint handlers, request body/param extraction, status code handling, and error response formatting
- Contains: Controller functions and classes (`OrdersController`, `PaymentController`, `GeoController`, `AccountController`)
- Depends on: Service layer
- Used by: Route files (`matrix-backend/src/routes/*`)

**Service Layer (`matrix-backend/src/services/*`):**
- Purpose: Business rules, calculation logic, transaction orchestration, voucher sequencing, and cross-domain synchronization
- Contains: `OrdersService`, `PaymentSyncService`, `DaybookService`, `PaymentService`, `AccountService`, `GeoService`
- Depends on: Drizzle ORM database instance and schema tables
- Used by: Controllers

**Persistence Layer (`matrix-backend/src/db/*`):**
- Purpose: PostgreSQL connection management, table schemas, relationships, migrations, and seed scripts
- Contains: `schema.ts`, `index.ts`, `seed.ts`, `geo-import.ts`, `pincode-import.ts`
- Depends on: `drizzle-orm`, `pg`
- Used by: Services

## Data Flow

### Primary Request Path (e.g. Creating a Repairing Receipt)

1. **User Submission**: User submits form in `RepairingReceipt.tsx` (`matrix-frontend/src/pages/transaction/repairing/repairing-receipt/RepairingReceipt.tsx:320`)
2. **Mutation Hook**: Invokes `useCreateOrder()` mutation (`matrix-frontend/src/api/orders.ts:80`)
3. **HTTP Dispatch**: Axios sends `POST http://localhost:5000/api/orders` with Bearer JWT (`matrix-frontend/src/api/client.ts:14`)
4. **Auth & Audit Interception**: `authUserMiddleware` validates JWT, verifies user, and auto-populates `req.body.addBy` (`matrix-backend/src/middleware/auth.middleware.ts:58`)
5. **Route Routing**: Express matches `/api/orders` POST to `ordersController.createOrder` (`matrix-backend/src/routes/orders.routes.ts:10`)
6. **Controller Dispatch**: Controller delegates payload to `ordersService.createOrder` (`matrix-backend/src/controllers/orders.controller.ts:42`)
7. **Database Transaction**:
   - `ordersService` enters `db.transaction()` (`matrix-backend/src/services/orders.service.ts:309`)
   - Validates or generates sequential `voucherNo` via `daybookService`
   - Inserts row into `orders` table
   - Inserts line items into `orderItems` table
   - Calls `paymentSyncService.syncRepairingReceiptPayments()` to create/update linked cash/bank vouchers in `payments` table
8. **Transaction Commit & Invalidation**: Transaction commits; server returns `{ success: true, data: order }`. TanStack Query invalidates `['orders']` and `['payments']` queries, updating UI grids.

### State Management:
- **Server Cache**: `@tanstack/react-query` stores remote records keyed by query keys (e.g. `['order', id]`, `['accounts']`, `['daybooks']`).
- **Client Cache**: Redux Toolkit manages `auth` (current user, token, active permissions) and `inventory` (cached item groups, rate types, metals for instantaneous dropdown population).

## Key Abstractions

**Daybook Voucher Sequence:**
- Purpose: Guarantees gapless sequential voucher numbering per daybook and financial period
- Implementation: `matrix-backend/src/services/daybook.service.ts` (`generateVoucherNo`)
- Pattern: Query last `voucherNo` where prefix matches, parse integer suffix, and increment atomically or check uniqueness

**Cross-Transaction Payment Synchronization:**
- Purpose: Keeps separate accounting entries (receipts/invoices vs. bank/cash vouchers) in strict double-entry synchronization
- Implementation: `matrix-backend/src/services/payment-sync.service.ts`
- Pattern: Transaction-scoped synchronization hook invoked inside caller's `db.transaction(async (tx) => { ... })`

**Encrypted URL State Token:**
- Purpose: Safely encode parameters (e.g., entity IDs, read-only flags) in browser URL navigation paths without exposing raw query parameters
- Implementation: `matrix-frontend/src/lib/utils.ts` (`encodeURL`, `decodeURL`)
- Pattern: Base64 serialization/deserialization helper for URL segments (`/transaction/repairing/receipt/edit/:token`)

## Entry Points

**Backend Server:**
- Location: `matrix-backend/src/index.ts`
- Triggers: `npm run dev:backend` or `npm start`
- Responsibilities: Initializes Express, registers global middlewares, attaches `/api/*` routes, listens on `PORT`

**Frontend Web Application:**
- Location: `matrix-frontend/src/main.tsx`
- Triggers: `npm run dev:frontend` or production bundle loaded by browser
- Responsibilities: Mounts React root, initializes `QueryClientProvider`, Redux `Provider`, and mounts `App.tsx` with `RouterProvider`

**Monorepo Concurrent Runner:**
- Location: `package.json`
- Triggers: `npm run dev`
- Responsibilities: Uses `concurrently` to spawn both backend (`tsx watch src/index.ts`) and frontend (`vite`) in parallel

## Architectural Constraints

- **Single Database Context**: All business domains (Inventory, Accounts, Orders, Payments, Geo) reside in the same PostgreSQL schema managed via `schema.ts`.
- **Audit Columns Required**: Tables tracking user modifications must maintain `add_by`, `edit_by`, `created_at`, and `updated_at` foreign keys referencing `users.id`.
- **Monorepo Separation**: Backend and frontend do not currently share a common package for shared types; domain interfaces are duplicated or typed independently in each workspace.
- **Client-Side API Endpoint**: Frontend currently connects directly to `localhost:5000` via hardcoded string rather than dynamic environment variables.

## Anti-Patterns

### Hardcoded Development Auth Bypass
**What happens:** When `NODE_ENV !== "production"` and no token is supplied, `authUserMiddleware` silently injects `req.user = { id: 1, email: "admin@company.com" }` (`matrix-backend/src/middleware/auth.middleware.ts:51`).
**Why it's wrong:** It masks missing auth tokens during development and risks catastrophic privilege bypass if deployed without setting `NODE_ENV=production`.
**Do this instead:** Require explicit authentication via `/api/auth/login` or test tokens even in local development; fail closed with 401.

### Monolithic UI Component Files
**What happens:** Single files like `CashVoucherForm.tsx` contain over 830 lines spanning grid configurations, calculations, modal dialogs, and form bindings.
**Why it's wrong:** High cognitive load, fragile state interactions, and difficult unit testing.
**Do this instead:** Break down forms into dedicated components, custom calculation hooks, and column definition helpers (as demonstrated in `RepairingReceipt.tsx` and its `components/` subfolder).

## Error Handling

**Strategy:** Express controller try/catch wrappers returning consistent HTTP error payloads.

**Patterns:**
- Standardized API responses: Success returns `{ success: true, data: ... }`; error returns `{ success: false, error: string }`.
- Frontend API boundary: Axios response interceptor and TanStack Query `onError` or toast notifications.

## Cross-Cutting Concerns

**Logging:** Standard `console.log` and `console.error` in backend services and controllers.
**Validation:** Ad-hoc manual type checking and SQL null constraints in Drizzle schema; no universal runtime validation schema (e.g. Zod) at the API boundary.
**Authentication:** JWT Bearer tokens verified on protected API routes via `authUserMiddleware` and `requireAuth`.

---

*Architecture analysis: 2026-10-16*
