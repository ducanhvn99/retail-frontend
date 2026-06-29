import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Package,
  Tag,
  ShoppingBag,
  LogOut,
  Menu,
  X,
} from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/stores/authStore";
import { Separator } from "@/components/ui/separator";

const navItems = [
  { to: "/admin", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/admin/products", label: "Products", icon: Package, end: false },
  { to: "/admin/categories", label: "Categories", icon: Tag, end: false },
];

function NavItem({ to, label, icon: Icon, end }: (typeof navItems)[number]) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        cn(
          "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
          isActive
            ? "bg-primary text-primary-foreground"
            : "text-muted-foreground hover:bg-muted hover:text-foreground"
        )
      }
    >
      <Icon className="h-4 w-4 shrink-0" />
      {label}
    </NavLink>
  );
}

export function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/auth/login");
  };

  return (
    <div className="flex min-h-screen bg-muted/30">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-60 flex-col border-r bg-background transition-transform lg:static lg:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex h-16 items-center gap-2 border-b px-4 font-bold">
          <ShoppingBag className="h-5 w-5 text-primary" />
          <span>RetailStore</span>
          <Button
            variant="ghost"
            size="icon"
            className="ml-auto lg:hidden"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <nav className="flex-1 space-y-1 p-3">
          {navItems.map((item) => (
            <NavItem key={item.to} {...item} />
          ))}
        </nav>

        <Separator />
        <div className="p-3">
          <p className="truncate px-3 py-1 text-xs text-muted-foreground">{user?.email}</p>
          <Button variant="ghost" size="sm" className="w-full justify-start" onClick={handleLogout}>
            <LogOut className="mr-2 h-4 w-4" />
            Logout
          </Button>
          <Button variant="ghost" size="sm" className="w-full justify-start" asChild>
            <Link to="/">
              <ShoppingBag className="mr-2 h-4 w-4" />
              Storefront
            </Link>
          </Button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="flex h-16 items-center border-b bg-background px-4 lg:hidden">
          <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(true)}>
            <Menu className="h-5 w-5" />
          </Button>
          <span className="ml-3 font-semibold">Admin</span>
        </header>

        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
