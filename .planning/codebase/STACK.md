# Technology Stack

**Analysis Date:** 2026-10-16

## Languages

**Primary:**
- TypeScript 7.0.2 - Backend services, controllers, Drizzle ORM schemas, routes (`matrix-backend/src/**/*.ts`)
- TypeScript 6.0.2 - Frontend React application, components, hooks, API client (`matrix-frontend/src/**/*.tsx`, `matrix-frontend/src/**/*.ts`)

**Secondary:**
- JavaScript (ES Modules) - Root configuration, database utility scripts (`create-db.js`, `export-data.js`, `import-data.js`)
- HTML5 / CSS3 - Web frontend shell (`matrix-frontend/index.html`) and Tailwind CSS 4 styling (`matrix-frontend/src/index.css`)

## Runtime

**Environment:**
- Node.js (Targeting `@types/node` v26.4.0 in backend, `@types/node` v24.13.3 in frontend)
- Node ESM (`"type": "module"` declared in both `matrix-backend/package.json` and `matrix-frontend/package.json`)

**Package Manager:**
- npm (Workspaces enabled at root `package.json`)
- Monorepo structure: `matrix-backend` and `matrix-frontend`
- Lockfile: `package-lock.json` present and committed

## Frameworks

**Core:**
- Express 5.2.1 (`matrix-backend`) - REST API server handling authentication, accounts, daybooks, geo, inventory, orders, and payments
- React 19.2.8 + React DOM 19.2.8 (`matrix-frontend`) - Component-based user interface for Matrix ERP
- React Router DOM 7.18.3 (`matrix-frontend`) - Client-side browser routing (`matrix-frontend/src/config/router.tsx`)

**State Management & Data Fetching:**
- `@tanstack/react-query` 5.102.8 (`matrix-frontend`) - Server-state caching, querying, and mutations
- `@reduxjs/toolkit` 2.12.0 & `react-redux` 9.3.0 (`matrix-frontend`) - Client-side global state for auth (`authSlice.ts`) and inventory master data cache (`inventorySlice.ts`)

**UI & Data Grid:**
- Tailwind CSS 4.3.3 (`matrix-frontend`) - Utility-first styling with `@tailwindcss/vite` 4.3.3
- Radix UI Primitives (`@radix-ui/react-*`) - Unstyled accessible UI components (Dialog, Dropdown Menu, Select, Popover, Tooltip, Avatar, Collapsible)
- `ag-grid-community` 36.1.0 & `ag-grid-react` 36.1.0 (`matrix-frontend`) - Enterprise-grade tabular grids for transactions, master listings, and inline line-item editors
- `lucide-react` 1.38.0 (`matrix-frontend`) - Icon library

**ORM & Database Client:**
- Drizzle ORM 0.45.2 & Drizzle Kit 0.31.10 (`matrix-backend`) - Type-safe SQL schema definition, queries, migrations, and transactions (`matrix-backend/src/db/schema.ts`)
- `pg` 8.23.0 & `@types/pg` 8.23.1 (`matrix-backend`) - PostgreSQL client driver with connection pooling (`matrix-backend/src/db/index.ts`)

**Reporting & Document Generation:**
- `@jsreport/jsreport-core` 4.11.2, `@jsreport/jsreport-handlebars` 4.1.1, `@jsreport/jsreport-chrome-pdf` 4.4.1 (`matrix-backend`) - Server-side PDF document rendering
- `jspdf` 4.2.1 & `jspdf-autotable` 5.0.8 (`matrix-frontend`) - Client-side PDF export
- `xlsx` 0.18.5 (`matrix-frontend`) - Client-side Excel export

**Testing:**
- Not configured. No test runners (Jest, Vitest, Playwright, or Mocha) are installed. Backend `package.json` contains stub `"test": "echo \"Error: no test specified\" && exit 1"`.

**Build/Dev:**
- Vite 8.2.2 (`matrix-frontend`) - Frontend development server and bundle builder with `@vitejs/plugin-react` 6.1.0
- TSX 4.23.13 (`matrix-backend`) - TypeScript Node runtime watcher for local development (`tsx watch src/index.ts`)
- Oxlint 1.79.0 (`matrix-frontend`) - High-performance JavaScript/TypeScript linter (`matrix-frontend/.oxlintrc.json`)
- Concurrently 10.0.6 (Root) - Runs backend and frontend development servers in parallel (`npm run dev`)

## Key Dependencies

**Critical:**
- `drizzle-orm` (0.45.2) - Powers all database interactions, relations, and transactional integrity
- `express` (5.2.1) - Core HTTP server routing and middleware pipeline
- `@tanstack/react-query` (5.102.8) - Orchestrates asynchronous API mutations, caching, and cache invalidation across ERP forms and lists
- `ag-grid-react` (36.1.0) - High-performance grid rendering for high-volume accounting vouchers and order line items
- `jsonwebtoken` (9.0.3) & `bcryptjs` (3.0.3) - Authentication token generation, password hashing, and request authorization

**Infrastructure & Utilities:**
- `dotenv` (17.4.2) - Environment variable loading
- `cors` (2.8.6) - Cross-Origin Resource Sharing handling
- `date-fns` (4.4.0) & `react-day-picker` (10.0.1) - Date calculations and calendar UI controls
- `clsx` (2.1.1) & `tailwind-merge` (3.6.0) - Conditional CSS class combining utility

## Configuration

**Environment:**
- Backend reads `.env` via `dotenv.config()` for `DATABASE_URL`, `PORT` (default 5000), `JWT_SECRET`
- Frontend currently relies on hardcoded API URL `http://localhost:5000/api` in `src/api/client.ts`

**Build:**
- Root: `package.json` workspaces `["matrix-backend", "matrix-frontend"]`
- Backend: `matrix-backend/tsconfig.json`, `matrix-backend/drizzle.config.ts`
- Frontend: `matrix-frontend/tsconfig.json`, `matrix-frontend/tsconfig.app.json`, `matrix-frontend/tsconfig.node.json`, `matrix-frontend/vite.config.ts`, `matrix-frontend/.oxlintrc.json`

## Platform Requirements

**Development:**
- Node.js >= 20.0.0
- PostgreSQL database instance
- npm 9+ or 10+ with workspace support

**Production:**
- Node.js runtime for `matrix-backend` (compiled to `dist/index.js` or executed via Node ESM)
- Static file hosting (e.g., Nginx, S3/CloudFront, Vercel) for `matrix-frontend/dist`
- PostgreSQL 14+ database instance

---

*Stack analysis: 2026-10-16*
