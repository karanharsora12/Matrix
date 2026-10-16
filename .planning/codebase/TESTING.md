# Testing Patterns

**Analysis Date:** 2026-10-16

## Test Framework

**Runner:**
- **Currently Not Configured**: Neither `matrix-backend` nor `matrix-frontend` has an active test framework installed or configured.
- Backend `package.json` contains:
  ```json
  "test": "echo \"Error: no test specified\" && exit 1"
  ```
- Frontend `package.json` contains no test runner command (only `dev`, `build`, `lint`, `preview`).

**Recommended Frameworks:**
- Frontend: `vitest` + `@testing-library/react` + `jsdom` (matches Vite 8 + React 19 toolchain)
- Backend: `vitest` or `jest` + `supertest` (for Express HTTP endpoint testing)

**Run Commands:**
```bash
# Current status:
npm test --workspace=matrix-backend    # Returns: Error: no test specified (exit code 1)
```

## Test File Organization

**Location:**
- When implemented, tests should be co-located next to target code or stored in dedicated `__tests__/` directories:
  - Frontend component tests: `src/pages/**/__tests__/*.test.tsx` or `*.test.tsx` next to components
  - Backend service tests: `src/services/__tests__/*.test.ts`
  - Backend integration tests: `src/routes/__tests__/*.test.ts`

**Naming Convention:**
- Unit/Component tests: `*.test.ts` / `*.test.tsx`
- Integration / E2E tests: `*.spec.ts` / `*.spec.tsx`

**Structure:**
```text
matrix-backend/
└── src/
    └── services/
        ├── orders.service.ts
        └── __tests__/
            └── orders.service.test.ts

matrix-frontend/
└── src/
    └── pages/
        └── transaction/
            └── repairing/
                └── repairing-receipt/
                    ├── RepairingReceipt.tsx
                    └── __tests__/
                        └── RepairingReceipt.test.tsx
```

## Test Structure

**Suite Organization (Standard Pattern to Follow):**
```typescript
import { describe, it, expect, beforeEach, vi } from "vitest";

describe("OrdersService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("createOrder", () => {
    it("should compute subtotal and grandTotal correctly from line items", async () => {
      // Setup test payload
      // Execute service method
      // Assert result
    });
  });
});
```

**Patterns:**
- **Setup:** Isolate database operations using transactions with rollback or mock db client.
- **Teardown:** Clear mock calls and restore system clock if dates are mocked.
- **Assertion:** Strict assertions on calculation outcomes (tax amounts, balances, discount reductions).

## Mocking

**Framework:** `vi` (Vitest mock system) or `jest`

**What to Mock:**
- External network requests (`axios` in frontend tests)
- Database connections when testing pure business logic calculations
- Browser APIs (`localStorage`, `window.matchMedia`, `ResizeObserver`) in frontend tests

**What NOT to Mock:**
- Mathematical computation helpers (e.g. `n()`, `formatNumericalValue()`, tax calculations)
- State reducers and pure utility functions
- Drizzle schema types and object contracts

## Fixtures and Factories

**Test Data Patterns:**
- Create lightweight factory helpers for standard ERP records (e.g., `createMockOrder()`, `createMockPayment()`, `createMockAccount()`).
- Sample factory pattern:
```typescript
export const createMockRepairLine = (overrides = {}) => ({
  id: 1,
  itemId: 10,
  grossWt: 12.5,
  netWt: 11.8,
  pcs: 1,
  rate: 5500,
  amount: 64900,
  labourAmount: 500,
  ...overrides,
});
```

**Location:**
- Shared test factories should be located in `src/test/factories/` or `src/test/fixtures/`.

## Coverage

**Requirements:**
- Currently: 0% enforced coverage.
- Target recommendation: Enforce minimum 80% coverage on financial calculation services (`orders.service.ts`, `payment-sync.service.ts`, `daybook.service.ts`).

## Test Types

**Unit Tests:**
- Needed for:
  - Form calculation logic (`taxableTotal`, `labourTotal`, `grandTotal`, `received`, `balance`)
  - Voucher sequence generation (`generateVoucherNo`)
  - Audit field injection in `authUserMiddleware`

**Integration Tests:**
- Needed for:
  - Express API routes (`/api/orders`, `/api/payments`, `/api/accounts`) with test PostgreSQL instance
  - Double-entry payment synchronization across `orders` and `payments` tables

**E2E Tests:**
- Framework: Playwright recommended
- Needed for:
  - Core transaction flows: Creating a repairing receipt -> Viewing it in list -> Auto-generating payment voucher

---

*Testing analysis: 2026-10-16*
