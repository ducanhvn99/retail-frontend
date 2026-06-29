import { Navigate, useLocation } from "react-router-dom";
import { useAuthStore } from "@/stores/authStore";
import type { UserRole } from "@/types/api";

interface Props {
  children: React.ReactNode;
  requiredRole?: UserRole;
}

export function ProtectedRoute({ children, requiredRole }: Props) {
  const { isAuthenticated, user, logout } = useAuthStore();
  const location = useLocation();

  if (!isAuthenticated()) {
    logout(); // clear stale state
    return <Navigate to="/auth/login" state={{ from: location }} replace />;
  }

  if (requiredRole && user?.role !== requiredRole) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
