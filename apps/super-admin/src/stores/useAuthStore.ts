import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface SuperAdminUser {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  role: string;
}

interface AuthState {
  token: string | null;
  user: SuperAdminUser | null;
  isAuthenticated: boolean;
  setAuth: (token: string, user: SuperAdminUser) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      isAuthenticated: false,
      setAuth: (token, user) => set({ token, user, isAuthenticated: true }),
      logout: () => set({ token: null, user: null, isAuthenticated: false }),
    }),
    {
      name: 'super-admin-auth',
    }
  )
);

