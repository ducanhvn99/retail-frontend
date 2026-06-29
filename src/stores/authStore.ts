import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { UserRole } from "@/types/api";

interface AuthUser {
  email: string;
  role: UserRole;
  expiresAt: string;
}

interface AuthState {
  token: string | null;
  user: AuthUser | null;
  login: (token: string, user: AuthUser) => void;
  logout: () => void;
  isAuthenticated: () => boolean;
  isAdmin: () => boolean;
  isExpired: () => boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      token: null,
      user: null,
      login: (token, user) => set({ token, user }),
      logout: () => set({ token: null, user: null }),
      isAuthenticated: () => {
        const { token } = get();
        if (!token) return false;
        return !get().isExpired();
      },
      isAdmin: () => get().user?.role === "Admin",
      isExpired: () => {
        const { user } = get();
        if (!user) return true;
        return new Date(user.expiresAt) <= new Date();
      },
    }),
    { name: "auth-storage" }
  )
);
