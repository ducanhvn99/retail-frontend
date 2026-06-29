import { Link, Outlet, useNavigate } from "react-router-dom";
import { ShoppingBag, LogIn, LogOut, LayoutDashboard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/stores/authStore";

export function CustomerLayout() {
  const { isAuthenticated, isAdmin, user, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/auth/login");
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur">
        <div className="container flex h-16 items-center justify-between">
          <Link to="/" className="flex items-center gap-2 font-bold text-lg">
            <ShoppingBag className="h-5 w-5 text-primary" />
            RetailStore
          </Link>

          <nav className="flex items-center gap-2">
            {isAuthenticated() ? (
              <>
                <span className="hidden text-sm text-muted-foreground sm:block">
                  {user?.email}
                </span>
                {isAdmin() && (
                  <Button variant="outline" size="sm" asChild>
                    <Link to="/admin">
                      <LayoutDashboard className="mr-1 h-4 w-4" />
                      Admin
                    </Link>
                  </Button>
                )}
                <Button variant="ghost" size="sm" onClick={handleLogout}>
                  <LogOut className="mr-1 h-4 w-4" />
                  Logout
                </Button>
              </>
            ) : (
              <Button size="sm" asChild>
                <Link to="/auth/login">
                  <LogIn className="mr-1 h-4 w-4" />
                  Sign in
                </Link>
              </Button>
            )}
          </nav>
        </div>
      </header>

      <main className="container py-8">
        <Outlet />
      </main>

      <footer className="border-t py-6 text-center text-sm text-muted-foreground">
        © {new Date().getFullYear()} RetailStore. All rights reserved.
      </footer>
    </div>
  );
}
