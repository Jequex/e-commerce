import React, { createContext, useContext, useState } from 'react';
import { AUTH_API_URL } from '../config/api';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    acceptedLegal: boolean;
    termsVersion?: string;
    privacyVersion?: string;
  }) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);

  const login = async (email: string, password: string) => {
    const res = await fetch(`${AUTH_API_URL}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Login failed');
    }

    setToken(data.token);
    setUser(data.user);
  };

  const register = async (data: {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    acceptedLegal: boolean;
    termsVersion?: string;
    privacyVersion?: string;
  }) => {
    if (!data.acceptedLegal) {
      throw new Error('You must accept the Terms and Privacy Policy to register.');
    }

    const payload = {
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      password: data.password,
      role: 'customer',
      acceptedTerms: true,
      acceptedPrivacyPolicy: true,
      acceptedCancellationRefund: true,
      termsVersion: data.termsVersion || '1.0',
      privacyVersion: data.privacyVersion || '1.0',
      cancellationRefundVersion: '1.0',
    };

    const res = await fetch(`${AUTH_API_URL}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const result = await res.json();
    if (!res.ok) {
      throw new Error(result.error || 'Registration failed');
    }

    // Auto-login after registration
    await login(data.email, data.password);
  };

  const logout = () => {
    setUser(null);
    setToken(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

