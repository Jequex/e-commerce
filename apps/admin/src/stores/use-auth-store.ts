import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface Admin {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  role: string;
  lastLoginAt: string | null;
}

interface AuthState {
  token: string | null;
  sessionId: string | null;
  admin: Admin | null;
  isAuthenticated: boolean;
  isHydrated: boolean;
  setAuth: (token: string, sessionId: string, admin: Admin) => void;
  clearAuth: () => void;
  setHydrated: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      sessionId: null,
      admin: null,
      isAuthenticated: false,
      isHydrated: false,
      setAuth: (token, sessionId, admin) =>
        set({
          token,
          sessionId,
          admin,
          isAuthenticated: true,
        }),
      clearAuth: () =>
        set({
          token: null,
          sessionId: null,
          admin: null,
          isAuthenticated: false,
        }),
      setHydrated: () => set({ isHydrated: true }),
    }),
    {
      name: 'admin-auth-storage',
      onRehydrateStorage: () => (state) => {
        state?.setHydrated();
      },
    }
  )
);
