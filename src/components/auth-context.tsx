import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { toast } from 'sonner';
import { normalizeAppRoleName, type User } from '@/features/users/schemas';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

interface AuthContextValue extends AuthState {
  login: (email: string, password: string) => Promise<User>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
const ACCESS_TOKEN_KEY = 'accessToken';
const REFRESH_TOKEN_KEY = 'refreshToken';
const AUTH_USER_KEY = 'authUser';

let inFlightProfileRequest: {
  token: string;
  promise: Promise<User | null>;
} | null = null;

type ApiUser = Partial<User> & {
  role?: User['role'] | { name?: string | null } | null;
  firstName?: string | null;
  lastName?: string | null;
};

type AuthResponse = {
  accessToken?: string;
  refreshToken?: string;
};

function normalizeRoleName(role: string | null | undefined) {
  return normalizeAppRoleName(role);
}

function normalizeUser(apiUser: ApiUser): User {
  const roleValue = apiUser.role as User['role'] | { name?: string | null } | null | undefined;
  const roleFromObject =
    typeof roleValue === 'object' && roleValue !== null ? roleValue.name : roleValue;

  const normalizedRole = normalizeRoleName(roleFromObject);

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

function clearStoredSession() {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  localStorage.removeItem(AUTH_USER_KEY);
}

function resetProfileRequestCache() {
  inFlightProfileRequest = null;
}

async function fetchAuthenticatedUser(token: string): Promise<User | null> {
  if (inFlightProfileRequest?.token === token) {
    return inFlightProfileRequest.promise;
  }

  const promise = (async () => {
    const response = await fetch(`${API_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok) {
      return null;
    }

    const rawUser = (await response.json()) as ApiUser;
    return normalizeUser(rawUser);
  })();

  inFlightProfileRequest = {
    token,
    promise,
  };

  try {
    return await promise;
  } finally {
    if (inFlightProfileRequest?.promise === promise) {
      resetProfileRequestCache();
    }
  }
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
    isAuthenticated: Boolean(localStorage.getItem(ACCESS_TOKEN_KEY)),
    isLoading: true,
  });

  const refreshProfile = useCallback(async () => {
    const token = localStorage.getItem(ACCESS_TOKEN_KEY);
    if (!token) {
      resetProfileRequestCache();
      setState({ user: null, isAuthenticated: false, isLoading: false });
      return;
    }

    try {
      const user = await fetchAuthenticatedUser(token);

      if (user) {
        localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
        setState({ user, isAuthenticated: true, isLoading: false });
      } else {
        clearStoredSession();
        resetProfileRequestCache();
        setState({ user: null, isAuthenticated: false, isLoading: false });
      }
    } catch {
      clearStoredSession();
      resetProfileRequestCache();
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
      const error = await res.json().catch(() => ({ message: 'Credenciales invalidas' }));
      toast.error(error.message || 'Error de autenticacion');
      throw new Error(error.message || 'Invalid credentials');
    }

    const data = (await res.json()) as AuthResponse;
    if (!data.accessToken || !data.refreshToken) {
      clearStoredSession();
      toast.error('Respuesta de autenticacion incompleta');
      throw new Error('Authentication response is incomplete');
    }

    localStorage.setItem(ACCESS_TOKEN_KEY, data.accessToken);
    localStorage.setItem(REFRESH_TOKEN_KEY, data.refreshToken);

    const user = await fetchAuthenticatedUser(data.accessToken);

    if (user) {
      localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
      setState({ user, isAuthenticated: true, isLoading: false });
      toast.success(`Bienvenido, ${user.name || user.email}`);
      return user;
    }

    clearStoredSession();
    resetProfileRequestCache();
    setState({ user: null, isAuthenticated: false, isLoading: false });
    throw new Error('No se pudo cargar el perfil del usuario');
  }, []);

  const logout = useCallback(async () => {
    const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
    if (refreshToken) {
      try {
        await fetch(`${API_URL}/auth/logout`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${refreshToken}` },
          credentials: 'include',
        });
      } catch {
        // Ignore network errors and still clear local session.
      }
    }

    clearStoredSession();
    resetProfileRequestCache();
    setState({ user: null, isAuthenticated: false, isLoading: false });
    toast.info('Sesion cerrada');
  }, []);

  useEffect(() => {
    refreshProfile();
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
