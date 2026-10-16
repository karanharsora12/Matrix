# Codebase Concerns

**Analysis Date:** 2026-10-16

## Tech Debt

**Monolithic Frontend Form Components:**
- Issue: Components like `CashVoucherForm.tsx` (over 830 lines, 29.7KB) handle multiple concerns simultaneously: grid rendering, dynamic row calculation, account search modals, balance computations, and CRUD operations.
- Files: `matrix-frontend/src/pages/transaction/payments/CashVoucherForm.tsx`
- Impact: Difficult to debug, refactor, or test in isolation; high chance of regressions when editing cash or bank voucher behaviors.
- Fix approach: Refactor `CashVoucherForm.tsx` into modular subcomponents (header card, details grid, summary footer, calculation hook) matching the pattern established in `RepairingReceipt.tsx`.

**Hardcoded Frontend API Base URL:**
- Issue: Axios client connects directly to `http://localhost:5000/api` hardcoded in source.
- Files: `matrix-frontend/src/api/client.ts:3-5`
- Impact: Prevents deploying frontend to staging or production environments without code modification.
- Fix approach: Replace string with `import.meta.env.VITE_API_URL || "http://localhost:5000/api"`.

**Typo in Core Layout Name:**
- Issue: The layout component is named `ERPLaoyut.tsx` (and component function `ERPLaoyut`) instead of `ERPLayout`.
- Files: `matrix-frontend/src/layouts/ERPLaoyut.tsx`, `matrix-frontend/src/config/router.tsx:14`
- Impact: Confusing naming convention across the codebase.
- Fix approach: Rename file to `ERPLayout.tsx` and update imports.

**Unused/Empty Models Directory:**
- Issue: `matrix-backend/src/models/` exists but is completely empty, as all database modeling is in `schema.ts`.
- Files: `matrix-backend/src/models/`
- Impact: Clutters project structure and confuses new contributors.
- Fix approach: Either remove directory or place domain entity models / DTOs inside.

## Known Bugs

**Unauthenticated User Auto-Elevation:**
- Symptoms: Any unauthenticated request sent in non-production environments is automatically granted user ID 1 permissions.
- Files: `matrix-backend/src/middleware/auth.middleware.ts:50-52`
- Trigger: Omitting or supplying an invalid `Authorization` header when `NODE_ENV` is not set to `production`.
- Workaround: Always enforce JWT validation unless explicitly running local integration tests with mocked context.

## Security Considerations

**Hardcoded Fallback JWT Secret:**
- Risk: Default JWT secret `"matrix-super-secret-key-2026"` is hardcoded in `auth.middleware.ts`. If `process.env.JWT_SECRET` is unset in production, tokens can be forged by any attacker.
- Files: `matrix-backend/src/middleware/auth.middleware.ts:4`
- Current mitigation: Relies on `.env` file setting `JWT_SECRET`.
- Recommendations: Throw a fatal startup error if `JWT_SECRET` is not provided in environment variables when starting the server.

**Absence of Server-Side Request Validation Schemas:**
- Risk: Express route handlers do not validate incoming JSON payloads using schemas (e.g. Zod or Yup). Malformed payloads, negative numbers, or invalid enum types can bypass client validation and corrupt database rows.
- Files: `matrix-backend/src/controllers/orders.controller.ts`, `matrix-backend/src/controllers/payment.controller.ts`
- Current mitigation: Relying on TypeScript types and SQL constraints.
- Recommendations: Implement Zod schema validation middleware for all POST/PUT endpoints.

## Performance Bottlenecks

**Large In-Memory Geographic Seeding / Imports:**
- Problem: `matrix-backend/src/db/geo-data/` contains massive JSON files (such as `cities_raw.json` exceeding several million lines) processed in memory during seed/import.
- Files: `matrix-backend/src/db/geo-import.ts`, `matrix-backend/src/db/geo-data/`
- Cause: Reading huge JSON datasets synchronously into memory.
- Improvement path: Stream JSON parsing using readline or node stream pipeline during database population.

**Unbounded Data Grid Queries:**
- Problem: Some listing views request all records or high limits without mandatory date range filtering.
- Files: `matrix-backend/src/services/orders.service.ts:46-48`, `matrix-backend/src/controllers/orders.controller.ts`
- Cause: `fetchAll=true` bypasses pagination limits.
- Improvement path: Enforce a maximum page limit (e.g., 500) and default date filter (e.g., current financial year or last 30 days) on high-volume accounting transaction queries.

## Fragile Areas

**Dual-Table Transaction Synchronization:**
- Files: `matrix-backend/src/services/payment-sync.service.ts`, `matrix-backend/src/services/orders.service.ts`
- Why fragile: Creating or editing a repairing receipt triggers creation/modification of corresponding payment vouchers in `payments`. If payment synchronization fails or deletes wrong linked records, accounting ledgers become mismatched.
- Safe modification: Any modification to `paymentSyncService` must be tested against all three states: receipt creation with cash/bank advance, receipt update changing amounts, and receipt deletion.
- Test coverage: Zero automated test coverage currently.

**Sequential Voucher Numbering:**
- Files: `matrix-backend/src/services/daybook.service.ts:generateVoucherNo`
- Why fragile: If multiple concurrent requests generate voucher numbers simultaneously under high load without a lock or database sequence, duplicate key constraint errors can occur on `voucher_no`.
- Safe modification: Use PostgreSQL sequences or atomic transaction locking (`SELECT ... FOR UPDATE`) on the daybook sequence.

## Scaling Limits

**Single Database Connection Pool:**
- Current capacity: Default `pg.Pool` settings with direct queries.
- Limit: Standard connection limits of single PostgreSQL instance.
- Scaling path: Configure connection pooling (e.g. PgBouncer), read replicas for reporting queries, and redis caching for master lists.

## Dependencies at Risk

**React 19 / TypeScript 7 / Vite 8 Bleeding Edge:**
- Risk: Using React 19.2.8 with TypeScript 7 and Tailwind v4. Some third-party UI libraries or AG Grid plugins may encounter peer dependency warnings during major upgrades.
- Impact: Occasional dependency resolution flags (`npm i --legacy-peer-deps`) may be required if older packages are added.
- Migration plan: Keep dependency lockfile checked and pinned.

## Missing Critical Features

**Audit Logging & User Management UI:**
- Problem: While `add_by` and `edit_by` columns exist in database tables, there is no admin interface to view user activity history, system audit logs, or manage user roles and permissions dynamically.
- Blocks: Enterprise auditing and compliance requirements for financial systems.

**Automated Test Suite:**
- Problem: Neither frontend nor backend has unit or integration tests.
- Blocks: Confident refactoring and CI/CD automation.

## Test Coverage Gaps

**Financial Calculation Routines:**
- What's not tested: Subtotal, discount calculations, labour amounts, tax deductions, round off, received payments, and balances.
- Files: `matrix-frontend/src/pages/transaction/repairing/repairing-receipt/RepairingReceipt.tsx`, `matrix-backend/src/services/orders.service.ts`
- Risk: Calculation errors or rounding discrepancies directly impacting accounting records.
- Priority: High

**Payment Synchronization & Deletion:**
- What's not tested: Deletion of repairing receipt cascading correctly to linked cash/bank payment vouchers without leaving orphaned ledger rows.
- Files: `matrix-backend/src/services/payment-sync.service.ts`
- Risk: Corrupted general ledger balances.
- Priority: High

**Authentication & Route Guards:**
- What's not tested: Protected route redirection, expired token handling, permission checks.
- Files: `matrix-frontend/src/components/common/ProtectedRoute.tsx`, `matrix-backend/src/middleware/auth.middleware.ts`
- Risk: Unauthorized access to ERP financial master records.
- Priority: High

---

*Concerns audit: 2026-10-16*
