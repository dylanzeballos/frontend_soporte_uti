/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { ReactNode } from 'react';
import { toast } from 'sonner';
import type { User } from '@/features/users/schemas';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

interface AuthContextValue extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
const AUTH_USER_KEY = 'authUser';

type ApiUser = Partial<User> & {
  role?: User['role'] | { name?: string | null } | null;
  firstName?: string | null;
  lastName?: string | null;
};

function normalizeUser(apiUser: ApiUser): User {
  const roleValue = apiUser.role as User['role'] | { name?: string | null } | null | undefined;
  const roleFromObject =
    typeof roleValue === 'object' && roleValue !== null
      ? roleValue.name
      : roleValue;

  const normalizedRole: User['role'] =
    roleFromObject === 'admin' || roleFromObject === 'agent' || roleFromObject === 'user'
      ? roleFromObject
      : 'user';

  const fallbackName = [apiUser.firstName, apiUser.lastName].filter(Boolean).join(' ').trim();

  return {
    id: Number(apiUser.id ?? 0),
    email: String(apiUser.email ?? ''),
    name: String(apiUser.name ?? fallbackName ?? 'Usuario'),
    role: normalizedRole,
    isActive: Boolean(apiUser.isActive ?? true),
    createdAt: apiUser.createdAt ? String(apiUser.createdAt) : undefined,
    updatedAt: apiUser.updatedAt ? String(apiUser.updatedAt) : undefined,
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: (() => {
      try {
        const stored = localStorage.getItem(AUTH_USER_KEY);
        if (!stored) return null;
        return normalizeUser(JSON.parse(stored) as ApiUser);
      } catch {
        return null;
      }
    })(),
    isAuthenticated: Boolean(localStorage.getItem('accessToken')),
    isLoading: true,
  });

  const refreshProfile = useCallback(async () => {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      setState({ user: null, isAuthenticated: false, isLoading: false });
      return;
    }

    try {
      const response = await fetch(`${API_URL}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const rawUser = (await response.json()) as ApiUser;
        const user = normalizeUser(rawUser);
        localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
        setState({ user, isAuthenticated: true, isLoading: false });
      } else {
        localStorage.removeItem('accessToken');
        localStorage.removeItem(AUTH_USER_KEY);
        setState({ user: null, isAuthenticated: false, isLoading: false });
      }
    } catch {
      localStorage.removeItem('accessToken');
      localStorage.removeItem(AUTH_USER_KEY);
      setState({ user: null, isAuthenticated: false, isLoading: false });
    }
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const res = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
      credentials: 'include',
    });

    if (!res.ok) {
      const error = await res.json().catch(() => ({ message: 'Credenciales inválidas' }));
      toast.error(error.message || 'Error de autenticación');
      throw new Error(error.message || 'Invalid credentials');
    }

    const data = await res.json();
    localStorage.setItem('accessToken', data.accessToken);

    const profileRes = await fetch(`${API_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${data.accessToken}` },
    });

    if (profileRes.ok) {
      const rawUser = (await profileRes.json()) as ApiUser;
      const user = normalizeUser(rawUser);
      localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
      setState({ user, isAuthenticated: true, isLoading: false });
      toast.success(`Bienvenido, ${user.name || user.email}`);
    } else {
      localStorage.removeItem(AUTH_USER_KEY);
      setState({ user: null, isAuthenticated: false, isLoading: false });
    }
  }, []);

  const logout = useCallback(async () => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      try {
        await fetch(`${API_URL}/auth/logout`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
          credentials: 'include',
        });
      } catch {
        // Ignore
      }
    }
    localStorage.removeItem('accessToken');
    localStorage.removeItem(AUTH_USER_KEY);
    setState({ user: null, isAuthenticated: false, isLoading: false });
    toast.info('Sesión cerrada');
  }, []);

  useEffect(() => {
    // refreshProfile calls setState inside async fetch callbacks, not synchronously
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void refreshProfile();
  }, [refreshProfile]);

  return (
    <AuthContext.Provider value={{ ...state, login, logout, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
