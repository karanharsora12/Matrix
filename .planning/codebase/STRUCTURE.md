# Codebase Structure

**Analysis Date:** 2026-10-16

## Directory Layout

```text
matrix-monorepo/
├── .agent/                             # GSD agent configuration, workflows, and skills
├── .agents/                            # Workspace customization and rules
├── .planning/                          # Planning and codebase intelligence artifacts
│   └── codebase/                       # Generated codebase map documents
├── matrix-backend/                     # Express REST API backend workspace
│   ├── drizzle/                        # Drizzle ORM generated SQL migrations and snapshots
│   ├── src/
│   │   ├── constants/                  # Backend constants, enums, menu identifiers
│   │   ├── controllers/                # HTTP route controllers
│   │   ├── db/                         # Database connection, schema, seed, and geo import
│   │   │   └── geo-data/               # Static geographic source datasets (JSON)
│   │   ├── middleware/                 # Express authentication and audit middlewares
│   │   ├── models/                     # Domain models placeholder
│   │   ├── routes/                     # Express API endpoint definitions
│   │   ├── services/                   # Business logic, calculations, and db operations
│   │   ├── types/                      # TypeScript declarations (e.g., jsreport)
│   │   ├── utils/                      # Helper utilities (e.g., pagination)
│   │   └── index.ts                    # Backend server entry point
│   ├── drizzle.config.ts               # Drizzle Kit migration configuration
│   ├── package.json                    # Backend dependencies and scripts
│   └── tsconfig.json                   # Backend TypeScript compiler options
├── matrix-frontend/                    # Vite + React single-page frontend workspace
│   ├── src/
│   │   ├── api/                        # Axios clients, endpoints, and TanStack Query hooks
│   │   ├── assets/                     # Static images, logos, and icons
│   │   ├── components/                 # Reusable UI components
│   │   │   ├── common/                 # Shared ERP components (DataGrid, AccountHelp, etc.)
│   │   │   └── ui/                     # Primitives (buttons, dialogs, inputs, popovers)
│   │   ├── config/                     # Routing, route paths, and API endpoints constants
│   │   ├── constants/                  # Frontend enums, transaction types, menu names
│   │   ├── hooks/                      # Custom React hooks
│   │   ├── layouts/                    # Main shell layout (ERPLaoyut, Sidebar, Header)
│   │   ├── lib/                        # Shared utilities and defaults
│   │   ├── pages/                      # Application route views grouped by domain
│   │   │   ├── admin-setup/            # Menu permissions and user setup
│   │   │   ├── master/                 # Master data views (accounts, inventory, geo)
│   │   │   └── transaction/            # Transaction views (payments, receipt, repairing)
│   │   ├── store/                      # Redux Toolkit store and slices (auth, inventory)
│   │   ├── styles/                     # Supplementary CSS styling
│   │   ├── utils/                      # Formatting, date, and math utilities
│   │   ├── App.tsx                     # Root App component and master data prefetching
│   │   ├── index.css                   # Tailwind CSS v4 root stylesheet
│   │   └── main.tsx                    # React DOM entry point
│   ├── .oxlintrc.json                  # Oxlint linter rules
│   ├── index.html                      # HTML5 template
│   ├── package.json                    # Frontend dependencies and scripts
│   ├── tsconfig.json                   # Project references tsconfig
│   ├── tsconfig.app.json               # Application TypeScript compiler config
│   ├── tsconfig.node.json              # Vite/Node TypeScript compiler config
│   └── vite.config.ts                  # Vite bundler and Tailwind plugin configuration
├── package.json                        # Root monorepo workspace configuration
├── package-lock.json                   # Root package lockfile
└── .gitignore                          # Git ignore rules
```

## Directory Purposes

**`matrix-backend/src/routes/`:**
- Purpose: Defines Express router endpoints and maps HTTP methods to controller actions
- Contains: `account.routes.ts`, `auth.ts`, `daybook.routes.ts`, `geo.routes.ts`, `inventory.ts`, `menus.ts`, `orders.routes.ts`, `payment.routes.ts`
- Key files: `matrix-backend/src/routes/orders.routes.ts`, `matrix-backend/src/routes/payment.routes.ts`

**`matrix-backend/src/controllers/`:**
- Purpose: Extracts request bodies, headers, and query parameters; invokes services; handles HTTP status responses
- Contains: `account.controller.ts`, `auth.ts`, `daybook.controller.ts`, `geo.controller.ts`, `inventory.controller.ts`, `menu.controller.ts`, `orders.controller.ts`, `payment.controller.ts`

**`matrix-backend/src/services/`:**
- Purpose: Implements business domain rules, calculates totals/taxes, generates voucher numbers, handles cross-service sync and database transactions
- Contains: `orders.service.ts`, `payment-sync.service.ts`, `daybook.service.ts`, `payment.service.ts`, `account.service.ts`, `geo.service.ts`, `inventory.service.ts`, `menu.service.ts`

**`matrix-backend/src/db/`:**
- Purpose: PostgreSQL connection, Drizzle schema, seeding, and migration scripts
- Contains: `schema.ts`, `index.ts`, `seed.ts`, `geo-import.ts`, `pincode-import.ts`
- Key file: `matrix-backend/src/db/schema.ts`

**`matrix-frontend/src/pages/`:**
- Purpose: Top-level route views corresponding to specific ERP transactions, masters, and admin configurations
- Contains:
  - `master/` (Accounts, Item Groups, Items, Item Codes, Daybooks, Countries, States, Cities, Areas, Pincodes)
  - `transaction/` (Bank Payments, Cash Payments, Bank Receipts, Cash Receipts, Repairing Receipts)
  - `admin-setup/` (Menu Setup, permissions)
  - `Dashboard.tsx`, `Login.tsx`, `NotFound.tsx`

**`matrix-frontend/src/components/common/`:**
- Purpose: Reusable, complex ERP widgets used across multiple forms and listing screens
- Contains: `DataGrid.tsx`, `AccountHelp.tsx`, `AddressHelp.tsx`, `PopupTable.tsx`, `FormHeader.tsx`, `FormFooter.tsx`, `NumericalCell.tsx`, `QuickAccountCreateDialog.tsx`, `AlertModal.tsx`

**`matrix-frontend/src/api/`:**
- Purpose: Strongly typed API caller modules and TanStack Query query/mutation hooks
- Contains: `client.ts`, `accounts.ts`, `auth.ts`, `daybooks.ts`, `inventory.ts`, `orders.ts`, `payments.ts`, `report.ts`

**`matrix-frontend/src/store/`:**
- Purpose: Redux Toolkit state slices for authentication and preloaded inventory master data
- Contains: `index.ts`, `authSlice.ts`, `inventorySlice.ts`

## Key File Locations

**Entry Points:**
- `package.json`: Monorepo script coordinator (`npm run dev`)
- `matrix-backend/src/index.ts`: Backend Express HTTP server
- `matrix-frontend/src/main.tsx`: Frontend React root rendering
- `matrix-frontend/src/App.tsx`: App wrapper and router injection

**Configuration:**
- `matrix-backend/drizzle.config.ts`: Drizzle ORM schema path and dialect options
- `matrix-backend/tsconfig.json`: Backend TypeScript compiler settings
- `matrix-frontend/vite.config.ts`: Vite plugins and `@/` path alias mapping
- `matrix-frontend/tsconfig.app.json`: Frontend TypeScript compiler settings
- `matrix-frontend/.oxlintrc.json`: Oxlint linting rules
- `matrix-frontend/src/config/router.tsx`: Client-side route declarations
- `matrix-frontend/src/config/webRoutes.ts`: Route path string constants
- `matrix-frontend/src/config/apiEndpoints.ts`: API endpoint constants

**Core Logic:**
- `matrix-backend/src/db/schema.ts`: Database tables and relations
- `matrix-backend/src/services/orders.service.ts`: Order and repairing receipt processing
- `matrix-backend/src/services/payment-sync.service.ts`: Cross-transaction voucher synchronization
- `matrix-backend/src/services/daybook.service.ts`: Voucher number sequencing
- `matrix-frontend/src/pages/transaction/repairing/repairing-receipt/RepairingReceipt.tsx`: Repairing receipt form orchestrator
- `matrix-frontend/src/pages/transaction/payments/CashVoucherForm.tsx`: Cash and bank voucher form

**Testing:**
- Currently not implemented. (No test suites present in `src/` directories).

## Naming Conventions

**Files:**
- React components / Views: PascalCase (e.g., `RepairingReceipt.tsx`, `AccountForm.tsx`, `DataGrid.tsx`)
- Backend services & controllers: kebab-case with descriptive suffix (e.g., `orders.service.ts`, `orders.controller.ts`, `orders.routes.ts`)
- TypeScript declaration files: `[module].d.ts` (e.g., `jsreport.d.ts`)
- Utility files: kebab-case or camelCase (e.g., `date.ts`, `pagination.ts`, `utils.ts`)

**Directories:**
- Frontend pages and features: kebab-case (e.g., `city-area-setup`, `repairing-receipt`, `other-master`)
- Backend modules: kebab-case or pluralized single-word (e.g., `controllers`, `services`, `middleware`, `routes`)

## Where to Add New Code

**New Business Transaction or Entity:**
- Database schema: Add new `pgTable` definitions in `matrix-backend/src/db/schema.ts`
- Migrations: Run `npm run db:push --workspace=matrix-backend` or generate migration via `npm run db:generate --workspace=matrix-backend`
- Backend service: Create `matrix-backend/src/services/<entity>.service.ts`
- Backend controller: Create `matrix-backend/src/controllers/<entity>.controller.ts`
- Backend route: Create `matrix-backend/src/routes/<entity>.routes.ts` and mount in `matrix-backend/src/index.ts`
- Frontend API client: Create `matrix-frontend/src/api/<entity>.ts` with TanStack Query hooks
- Frontend UI View: Create page in `matrix-frontend/src/pages/transaction/<entity>/` or `matrix-frontend/src/pages/master/<entity>/`
- Frontend Route: Register route path in `matrix-frontend/src/config/webRoutes.ts` and route definition in `matrix-frontend/src/config/router.tsx`

**New Shared UI Component:**
- Create in `matrix-frontend/src/components/common/<ComponentName>.tsx` or `matrix-frontend/src/components/ui/<component-name>.tsx`
- Export from component file and import via `@/components/common/<ComponentName>`

**Utilities:**
- Shared frontend helpers: Add to `matrix-frontend/src/utils/` or `matrix-frontend/src/lib/`
- Shared backend helpers: Add to `matrix-backend/src/utils/`

## Special Directories

**`matrix-backend/drizzle/`:**
- Purpose: Stores autogenerated Drizzle SQL migration files and schema snapshots
- Generated: Yes
- Committed: Yes

**`matrix-backend/src/db/geo-data/`:**
- Purpose: Static raw geographic data for countries, states, cities, and pincodes
- Generated: No (seeded datasets)
- Committed: Yes

**`matrix-backend/scratch/`:**
- Purpose: Temporary development scripts or scratch queries
- Generated: No
- Committed: Avoid committing scratch test files

---

*Structure analysis: 2026-10-16*
