import { lazy, Suspense } from "react";
import { createBrowserRouter, Navigate } from "react-router-dom";
import { CustomerLayout } from "@/components/layout/CustomerLayout";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { ProtectedRoute } from "@/components/shared/ProtectedRoute";
import { ErrorBoundary } from "@/components/shared/ErrorBoundary";
import { PageSkeleton } from "@/components/shared/PageSkeleton";

// Lazy-loaded pages
const LoginPage = lazy(() => import("@/pages/auth/LoginPage"));
const RegisterPage = lazy(() => import("@/pages/auth/RegisterPage"));
const ProductListPage = lazy(() => import("@/pages/customer/ProductListPage"));
const ProductDetailPage = lazy(() => import("@/pages/customer/ProductDetailPage"));
const DashboardPage = lazy(() => import("@/pages/admin/DashboardPage"));
const AdminProductListPage = lazy(
  () => import("@/pages/admin/products/AdminProductListPage")
);
const ProductFormPage = lazy(() => import("@/pages/admin/products/ProductFormPage"));
const CategoryPage = lazy(() => import("@/pages/admin/categories/CategoryPage"));

const withSuspense = (element: React.ReactNode) => (
  <ErrorBoundary>
    <Suspense fallback={<PageSkeleton />}>{element}</Suspense>
  </ErrorBoundary>
);

export const router = createBrowserRouter([
  {
    path: "/",
    element: <CustomerLayout />,
    children: [
      { index: true, element: withSuspense(<ProductListPage />) },
      { path: "products/:id", element: withSuspense(<ProductDetailPage />) },
      {
        path: "auth",
        children: [
          { path: "login", element: withSuspense(<LoginPage />) },
          { path: "register", element: withSuspense(<RegisterPage />) },
        ],
      },
    ],
  },
  {
    path: "/admin",
    element: (
      <ProtectedRoute requiredRole="Admin">
        <AdminLayout />
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: withSuspense(<DashboardPage />) },
      { path: "products", element: withSuspense(<AdminProductListPage />) },
      { path: "products/new", element: withSuspense(<ProductFormPage />) },
      { path: "products/:id/edit", element: withSuspense(<ProductFormPage />) },
      { path: "categories", element: withSuspense(<CategoryPage />) },
    ],
  },
  {
    path: "*",
    element: <Navigate to="/" replace />,
  },
]);
