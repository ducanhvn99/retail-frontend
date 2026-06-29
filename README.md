# retail-frontend — Product Catalogue UI

A React 18 single-page application for a fashion retail store. Integrates with the [`retail-endpoint`](https://github.com/ducanhvn99/retail-endpoint) API to provide a customer-facing storefront and a full admin dashboard for managing products, categories, variants, inventory, and images.

---

## Prerequisites

- [Node.js 18+](https://nodejs.org/)
- [`retail-endpoint`](https://github.com/ducanhvn99/retail-endpoint) API running locally (see its README)

---

## Quick Start

### 1. Clone and install

```bash
git clone https://github.com/ducanhvn99/retail-frontend
cd retail-frontend
npm install
```

### 2. Configure the API URL

```bash
cp .env.example .env
```

Edit `.env`:

```env
VITE_API_URL=http://localhost:5000
```

### 3. Run

```bash
npm run dev
```

App: `http://localhost:5173`

### 4. Production build

```bash
npm run build     # outputs to dist/
npm run preview   # serve the built output locally
```

---

## Environment Variables

| Variable | Description | Default |
|---|---|---|
| `VITE_API_URL` | Base URL of the `retail-endpoint` API | `http://localhost:5000` |

---

## Feature Overview

### Customer Storefront (`/`)

| Feature | Details |
|---|---|
| Product grid | Paginated 12-per-page grid with skeleton loading states |
| Search | Keyword search via API (`?search=`) submitted on form action |
| Filters | Category, price range (min/max), sort (newest, price, name) — all synced to URL search params |
| Product detail | Image gallery with thumbnails, color/size variant selector, attributes table, stock indicator |
| Empty states | Friendly message with a clear-filters action when no results are found |

### Admin Dashboard (`/admin`, Admin role required)

| Feature | Details |
|---|---|
| Dashboard | Summary cards (total products, categories) with quick-action shortcuts |
| Product list | Searchable, filterable table with status badges and inline status transitions (Draft → Active → Archived) |
| Product form | Tabbed form: **Details** (name, description, category, brand, price, dynamic attributes), **Variants**, **Images** |
| Variant management | Add/delete variants (SKU, color, size, price override, initial quantity); adjust stock by delta with optional reason |
| Image management | URL-based image panel (add with alt text and primary flag, delete with hover action) |
| Category tree | Recursive expand/collapse tree; create/edit/delete with parent selector and sort order; delete is blocked by the API when the category has children or linked products |

### Authentication

| Feature | Details |
|---|---|
| Register | Email + password (min 8 chars, one uppercase, one digit) + role selection (Admin / Customer) |
| Login | JWT stored via Zustand `persist` middleware in `localStorage` |
| Route guards | `ProtectedRoute` checks token presence and `expiresAt` on every render; 401 responses trigger automatic logout and redirect |
| Role guards | Admin routes reject Customer-role users with a redirect to `/` |

---

## Project Structure

```
src/
├── api/                  # One file per API resource
│   ├── client.ts         # Axios instance; request/response interceptors
│   ├── auth.ts
│   ├── products.ts
│   ├── categories.ts
│   ├── variants.ts
│   ├── images.ts
│   └── inventory.ts
├── components/
│   ├── ui/               # shadcn/ui primitives (Button, Input, Dialog, Select, …)
│   ├── layout/
│   │   ├── CustomerLayout.tsx
│   │   └── AdminLayout.tsx
│   └── shared/
│       ├── ProtectedRoute.tsx
│       ├── ErrorBoundary.tsx
│       ├── PageSkeleton.tsx
│       └── ApiErrorAlert.tsx
├── hooks/                # React Query wrappers
│   ├── useProducts.ts
│   ├── useCategories.ts
│   ├── useVariants.ts
│   └── useInventory.ts
├── pages/
│   ├── auth/             # LoginPage, RegisterPage
│   ├── customer/         # ProductListPage, ProductDetailPage
│   └── admin/            # DashboardPage, AdminProductListPage, ProductFormPage, CategoryPage
├── router/               # Route definitions with lazy loading and role guards
├── stores/
│   └── authStore.ts      # Zustand: token, user, login(), logout()
├── types/
│   └── api.ts            # TypeScript interfaces mirroring all API DTOs
└── lib/
    ├── utils.ts           # cn(), formatPrice(), formatDate()
    └── schemas.ts         # Zod schemas matching every API validation rule
```

---

## Technology Stack

| Concern | Choice | Version | Why |
|---|---|---|---|
| Framework | React | 18.3.1 | Component model, large ecosystem |
| Language | TypeScript | 5.7.2 | End-to-end type safety against API DTOs |
| Build tool | Vite | 6.0.5 | Sub-second HMR, native ESM, fast production builds |
| Routing | React Router | 6.28.0 | Nested layouts, loader-based route protection |
| Server state | TanStack Query | 5.62.8 | Caching, deduplication, background refetch; TTLs match the API's own cache (products: 120 s, categories: 300 s) |
| Client state | Zustand | 5.0.2 | Minimal boilerplate; `persist` middleware handles `localStorage` sync for auth |
| API client | Axios | 1.7.9 | Interceptors for JWT injection and RFC 7807 error normalisation |
| Form handling | React Hook Form | 7.54.2 | Uncontrolled inputs, seamless Zod integration |
| Validation | Zod | 3.24.1 | Schema mirrors server rules exactly; field errors map back into form state |
| UI components | shadcn/ui (Radix UI) | — | Accessible, headless primitives composed with Tailwind; no runtime dependency |
| Styling | Tailwind CSS | 3.4.17 | Utility-first; zero CSS files per component |
| Icons | Lucide React | 0.468.0 | Consistent icon set, tree-shakeable |
| Notifications | Sonner | 1.7.1 | Lightweight toasts with rich-color variants |

---

## API Integration

**Base URL** is read from `VITE_API_URL` at build time.

**Auth flow:** Register → Login → JWT stored in `localStorage` → Axios request interceptor attaches `Authorization: Bearer <token>` to every request → Axios response interceptor catches errors and throws a typed `ApiError` (status, title, field-level `errors` map from RFC 7807 body).

**Error handling:** `ApiErrorAlert` reads the `errors` map from the API's Problem Details response and renders field-level messages inline in forms via React Hook Form's `setError()`. Global errors appear as toast notifications.

**Caching strategy:**

| Resource | `staleTime` | Rationale |
|---|---|---|
| Products | 120 s | Matches API's in-process cache TTL |
| Categories | 300 s | Matches API's in-process cache TTL |
| Variants / Inventory | 0 (always fresh) | Mutated frequently; stale data is misleading |

---

## Limitations & Future Improvements

| Limitation | Proposed Fix |
|---|---|
| Images are URL-only (API constraint) | Upload to S3 / Cloudinary client-side, then save the resulting URL |
| No token refresh — 60-min hard expiry | Add a session-expiry warning modal; request refresh tokens from the API |
| No shopping cart or checkout | Requires order endpoints on the backend |
| Search fires on form submit only | Debounced live search with instant feedback |
| Single currency (USD) | Currency selector tied to a backend exchange-rate service |
| No automated tests | Add Vitest + React Testing Library for hooks and form validation |
| In-process API cache (backend) | Not a frontend fix, but Redis on the backend enables multi-instance scaling |
| No audit trail or user management UI | Requires audit log and user admin endpoints on the backend |
| Basic text search (`LIKE`) | Backend switch to PostgreSQL `tsvector` or Elasticsearch for relevance ranking |