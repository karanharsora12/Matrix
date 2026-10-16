# Coding Conventions

**Analysis Date:** 2026-10-16

## Naming Patterns

**Files:**
- React Components & Views: PascalCase (e.g., `RepairingReceipt.tsx`, `ReceiptCollectionSummary.tsx`, `DataGrid.tsx`)
- Backend Services & Controllers: kebab-case with descriptive suffix (e.g., `orders.service.ts`, `orders.controller.ts`, `payment-sync.service.ts`)
- Route definitions: kebab-case with `.routes.ts` or simple name (e.g., `orders.routes.ts`, `auth.ts`, `daybook.routes.ts`)
- Database schemas & scripts: kebab-case or single-word (e.g., `schema.ts`, `geo-import.ts`, `pincode-import.ts`)
- TypeScript types: `types.ts` within the feature folder or dedicated declarations `[name].d.ts`

**Functions:**
- camelCase for functions and methods across both workspaces (e.g., `getOrders`, `createPayment`, `syncRepairingReceiptPayments`, `generateVoucherNo`)
- React component render functions: PascalCase (e.g., `RepairingReceipt`, `Header`, `ERPLaoyut`)
- React custom hooks: prefixed with `use` (e.g., `useOrder`, `useCreateOrder`, `useDaybooks`, `useRepairingReceiptColumns`)

**Variables & Constants:**
- Variables and object properties: camelCase (e.g., `voucherNo`, `daybookId`, `grandTotal`, `isEditing`)
- Global constants and enums: UPPER_SNAKE_CASE (e.g., `WEB_ROUTES`, `API_ENDPOINTS`, `TRANSACTION_TYPE_CONFIG`)
- Database column names in PostgreSQL: snake_case (e.g., `voucher_no`, `daybook_id`, `add_by`, `edit_by`, `created_at`)

**Types & Interfaces:**
- PascalCase for all types, interfaces, and enum declarations (e.g., `RepairLine`, `RepairingReceiptFormData`, `RepairingReceiptTotals`, `AuthUser`)
- Prop interfaces: PascalCase with `Props` suffix (e.g., `ReceiptCollectionSummaryProps`, `FormFooterProps`, `DataGridProps`)

## Code Style

**Formatting:**
- 2-space indentation
- Semicolons used consistently across backend and frontend
- Trailing commas in multi-line objects, arrays, and parameter lists
- Single quotes preferred in frontend imports and strings where configured; double quotes standard in backend and JSON configs

**Linting:**
- Frontend: Oxlint (`oxlint`) configured via `matrix-frontend/.oxlintrc.json`:
  ```json
  {
    "plugins": ["react", "typescript", "oxc"],
    "rules": {
      "react/rules-of-hooks": "error",
      "react/only-export-components": ["warn", { "allowConstantExport": true }]
    }
  }
  ```
- Backend: TypeScript compiler strict checking enabled in `matrix-backend/tsconfig.json` (`"strict": true`, `"noUncheckedIndexedAccess": true`, `"exactOptionalPropertyTypes": true`).

## Import Organization

**Order:**
1. React core, built-in libraries, and node runtime imports
2. External third-party packages (`ag-grid-community`, `lucide-react`, `drizzle-orm`, `@tanstack/react-query`)
3. Internal path alias imports (`@/api/*`, `@/components/*`, `@/constants/*`, `@/lib/*`, `@/utils/*`)
4. Relative sibling/subcomponent imports (`./components/*`, `./types`, `./useRepairingReceiptColumns`)
5. Type-only imports explicit via `import type { ... }`

**Path Aliases:**
- `matrix-frontend/vite.config.ts` defines `@/` mapping to `./src/`:
  ```typescript
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  }
  ```
- Backend uses relative imports (e.g., `../db`, `../middleware/auth.middleware`, `./daybook.service`).

## Error Handling

**Backend Strategy:**
- Wrap controller actions in `try...catch` blocks.
- Return structured error JSON responses with appropriate HTTP status codes:
  ```typescript
  try {
    const result = await ordersService.createOrder(req.body);
    res.status(201).json({ success: true, data: result });
  } catch (error: any) {
    console.error("Error creating order:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Failed to create order",
    });
  }
  ```
- Business logic exceptions in services throw descriptive `Error` instances which controllers intercept.

**Frontend Strategy:**
- In forms and mutators, capture errors in component state (`const [error, setError] = useState("")`) or display alert dialogs via `confirmAlert()` / `AlertModal`.
- TanStack Query hooks expose `error` and `isError` flags for declarative UI fallbacks.

## Logging

**Framework:** Standard Node.js / browser `console` (`console.log`, `console.error`, `console.warn`).
**Patterns:**
- Log error messages alongside relevant entity IDs or request parameters during failed operations:
  ```typescript
  console.error(`[OrdersService] Failed to sync payment for order ${id}:`, error);
  ```
- Avoid committing raw credential logging or noisy debug logs.

## Comments

**When to Comment:**
- Document complex business logic, calculation formulas (e.g. tax, round off, net weight deductions), or cross-table synchronizations.
- Document reasons behind specific architectural decisions or non-obvious workarounds.
- Preserve existing comments and docstrings.

**JSDoc/TSDoc:**
- Used on exported service classes and methods to clarify arguments and side effects (e.g., `OrdersService.getOrders`, `paymentSyncService.syncRepairingReceiptPayments`).

## Function Design

**Size:**
- Aim for cohesive, focused functions.
- Calculation routines should be isolated as pure utility functions (e.g., `n()`, `toISODate()`, `formatNumericalValue()`).

**Parameters:**
- Use destructuring and options objects for methods taking 3 or more parameters (e.g., `getOrders(options?: { page?: number; search?: string; ... })`).

**Return Values:**
- Service methods return domain objects, numbers, or records directly.
- Controllers wrap payloads in standard envelope: `{ success: true, data: ... }` or `{ success: false, error: ... }`.

## Module Design

**Exports:**
- Named exports preferred for utilities, types, services, and hooks.
- Default exports used for top-level React page components mapped into routes (`export default RepairingReceipt;`).

**Barrel Files:**
- Used selectively (e.g., `matrix-frontend/src/store/index.ts` re-exports store and slice actions).

---

*Convention analysis: 2026-10-16*
