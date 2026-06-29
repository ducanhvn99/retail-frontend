# Retail Frontend — Implementation Report

## Overview

This document describes the implementation approach for the retail frontend, a single-page application built to integrate with the `retail-endpoint` REST API. The app serves two audiences: **customers** browsing and filtering products, and **administrators** managing the full product catalogue.

---

## Technology Stack

### Core

| Layer | Choice | Version |
|---|---|---|
| Framework | React | 18.3.1 |
| Language | TypeScript | 5.7.2 |
| Build tool | Vite | 6.0.5 |
| Routing | React Router | 6.28.0 |

### State Management

| Concern | Library | Version | Rationale |
|---|---|---|---|
| Server state (API data) | TanStack Query (React Query) | 5.62.8 | Handles caching, deduplication, background refetch, and loading/error states out of the box. Cache TTLs (products: 120 s, categories: 300 s) are aligned with the API's own server-side cache to avoid redundant network requests. |
| Client state (auth) | Zustand | 5.0.2 | Lightweight, persisted to `localStorage` via the built-in `persist` middleware. Chosen over Redux for its minimal boilerplate and direct TypeScript ergonomics. |

### API & Data Handling

| Library | Version | Role |
|---|---|---|
| Axios | 1.7.9 | HTTP client. A single shared instance (`src/api/client.ts`) attaches the JWT Bearer token via a request interceptor and normalises all API error responses (RFC 7807 Problem Details) into a typed `ApiError` class via a response interceptor. |
| Zod | 3.24.1 | Schema-based validation. All form schemas in `src/lib/schemas.ts` mirror the API's server-side validation rules exactly (SKU format, password constraints, price > 0, etc.), catching invalid input before a network call is made. |
| React Hook Form | 7.54.2 | Form state and submission. Integrates with Zod via `@hookform/resolvers`. API field-level errors from the server are mapped into form fields using `setError()`, so users see inline messages next to the relevant input. |

### UI

| Library | Version | Role |
|---|---|---|
| Tailwind CSS | 3.4.17 | Utility-first styling. All layout, spacing, and responsive behaviour is expressed in class names — no separate CSS files per component. |
| shadcn/ui (Radix UI primitives) | — | Accessible, unstyled Radix UI components (Dialog, Select, Tabs, DropdownMenu, etc.) composed with Tailwind. Components live in `src/components/ui/` as plain `.tsx` files — no runtime dependency on a shadcn package. |
| Lucide React | 0.468.0 | Icon set. |
| Sonner | 1.7.1 | Toast notifications for action feedback (success/error). |

---

## Architecture & Approach

### Project Structure

```
src/
├── api/          # One file per API resource (auth, products, categories, variants, images, inventory)
├── components/
│   ├── ui/       # shadcn/ui primitives
│   ├── layout/   # CustomerLayout, AdminLayout
│   └── shared/   # ProtectedRoute, ErrorBoundary, PageSkeleton, ApiErrorAlert
├── hooks/        # React Query wrappers (useProducts, useCategories, useVariants, useInventory)
├── pages/
│   ├── auth/
│   ├── customer/ # ProductListPage, ProductDetailPage
│   └── admin/    # DashboardPage, AdminProductListPage, ProductFormPage, CategoryPage
├── router/       # Route definitions with lazy loading and role guards
├── stores/       # Zustand auth store
├── types/        # TypeScript interfaces mirroring all API DTOs
└── lib/          # utils (cn, formatPrice, formatDate), Zod schemas
```

### Authentication & Routing

JWT tokens are stored in `localStorage` via Zustand's persist middleware and attached to every API request by an Axios interceptor. A `ProtectedRoute` component checks token presence and expiry (`expiresAt` from the auth response) on every protected page render, redirecting to `/auth/login` if invalid. A global 401 interceptor in Axios also catches server-side rejection and triggers logout.

Admin routes (`/admin/*`) require the `Admin` role; any non-admin authenticated user is redirected to `/`.

### Performance

- **Code splitting**: every page component is `React.lazy()`-loaded, producing 18+ separate JS chunks at build time. The initial bundle only loads what is needed for the current route.
- **Suspense boundaries**: each lazy route is wrapped in `<Suspense fallback={<PageSkeleton />}>` and an `ErrorBoundary`, giving graceful loading and error states at every route.
- **React Query caching**: data is served from cache on repeat visits within the TTL window, reducing redundant API calls and preventing layout jank on navigation.
- **No over-fetching**: variants and inventory are only fetched on the product edit page, not in list views.
- **Lazy image loading**: product images use `loading="lazy"` with a fallback `onError` handler for broken URLs.

---

## Limitations

### 1. No File Uploads for Images
The API accepts only image URLs (`AddImageRequest.url`) — it does not support binary file uploads. The image management UI therefore uses a URL text input rather than a file picker. Users must host images externally and paste the URL.

### 2. No Authentication Token Refresh
The JWT expires after 60 minutes with no refresh token mechanism in the API. After expiry the user must log in again. This is a backend constraint, but the frontend could mitigate it by warning the user before expiry.

### 3. No Shopping Cart or Checkout
The API has no order or cart endpoints. The storefront is read-only — customers can browse and explore products but cannot complete a purchase.

### 4. In-memory Search Only
Product search (`GET /api/products?search=`) delegates to the API's basic text search. There is no client-side instant search, autocomplete, or full-text indexing. Search fires on form submit, not on keystroke.

### 5. Single Currency
All prices are displayed in USD. The API carries no currency field, so multi-currency support would require a backend change.

### 6. No Audit Trail or User Management
There is no UI for viewing who made changes, when, or for managing user accounts after registration. Admins cannot reset passwords or deactivate users.

### 7. No Unit / Integration Tests
The current codebase has no automated tests. Correctness is verified manually against a running backend.

---

## Proposed Future Improvements

### Short-term

| Improvement | Benefit |
|---|---|
| Add a session expiry warning modal (fires ~5 min before `expiresAt`) | Prevents silent logouts mid-task |
| Debounced live search in the product list | Better UX; reduces user friction vs. form-submit search |
| Optimistic UI updates on status changes and inventory adjustments | Instant feedback without waiting for API round-trip |
| Add Vitest + React Testing Library unit tests for hooks and form validation | Catches regressions in business logic |

### Medium-term

| Improvement | Benefit |
|---|---|
| Image upload support (e.g., upload to S3/Cloudinary, then save URL) | Removes the friction of manually hosting images |
| Infinite scroll or virtual list for large product catalogues | Avoids pagination overhead and renders only visible rows |
| Dashboard analytics (sales trends, low-stock alerts, top products) | Gives admins actionable insight without leaving the app |
| Role-based feature flags (e.g., read-only Staff role) | Supports more granular access control |

### Long-term

| Improvement | Benefit |
|---|---|
| Shopping cart + checkout flow (requires API additions) | Completes the customer journey end-to-end |
| Multi-language (i18n) support | Widens the potential user base |
| Distributed caching (Redis) on the backend + SSE/WebSocket for live inventory | Real-time stock updates in the storefront without polling |
| Server-Side Rendering (Next.js or Remix) | Improves SEO for public product pages and reduces time-to-first-paint |

---

## Running the Project

**Requirements:** Node.js 18+, the `retail-endpoint` backend running locally.

```bash
# 1. Clone and install
git clone https://github.com/ducanhvn99/retail-frontend
cd retail-frontend
npm install

# 2. Configure API URL (default: http://localhost:5000)
cp .env.example .env

# 3. Start development server
npm run dev          # → http://localhost:5173

# 4. Production build
npm run build
```
