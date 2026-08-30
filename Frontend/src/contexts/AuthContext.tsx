import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
} from 'react';
import { toast } from 'react-toastify';
import { apiClient, setAuthToken, setRefreshFailureCallback } from '../lib/apiClient';
import type { User } from '../types/user';
import type { Organization } from '../types/organization';

// ─────────────────────────────────────────────────────────
// Context Shape
// ─────────────────────────────────────────────────────────

interface AuthState {
  user: User | null;
  organization: Organization | null;
  isAuthenticated: boolean;
  isLoading: boolean; // true while silently restoring session on mount
}

interface AuthContextValue extends AuthState {
  login: (
    accessToken: string,
    refreshToken: string,
    user: User,
    organization: Organization
  ) => void;
  logout: () => Promise<void>;
}

// ─────────────────────────────────────────────────────────
// Context + Provider
// ─────────────────────────────────────────────────────────

const AuthContext = createContext<AuthContextValue | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [isLoading, setIsLoading] = useState(true); // starts true — we try to restore session

  const logoutRef = useRef<() => void>(() => {});

  // ── login: called after successful /auth/signup or /auth/login ──
  const login = useCallback(
    (
      accessToken: string,
      refreshToken: string,
      userData: User,
      orgData: Organization
    ) => {
      setAuthToken(accessToken);
      localStorage.setItem('nebula_refresh_token', refreshToken);
      setUser(userData);
      setOrganization(orgData);
    },
    []
  );

  // ── logout: clears all session state ──
  const logout = useCallback(async () => {
    try {
      await apiClient.post('/auth/logout');
    } catch {
      // Ignore network errors during logout — we clear state regardless
    }
    setAuthToken(null);
    localStorage.removeItem('nebula_refresh_token');
    setUser(null);
    setOrganization(null);
    toast.info('You have been signed out.', { toastId: 'logout' });
  }, []);

  // Keep the ref in sync so the refresh failure callback always has the latest logout
  logoutRef.current = logout;

  // ── Silent session restore on page load ──
  useEffect(() => {
    const restoreSession = async () => {
      const storedRefreshToken = localStorage.getItem('nebula_refresh_token');

      if (!storedRefreshToken) {
        setIsLoading(false);
        return;
      }

      try {
        const { data } = await apiClient.post('/auth/refresh', {
          refreshToken: storedRefreshToken,
        });

        setAuthToken(data.accessToken);
        localStorage.setItem('nebula_refresh_token', data.refreshToken);
        setUser(data.user);
        setOrganization(data.organization);
      } catch {
        // Refresh token is invalid or expired — clear storage silently
        localStorage.removeItem('nebula_refresh_token');
      } finally {
        setIsLoading(false);
      }
    };

    // Register the refresh failure callback so the interceptor can trigger logout
    setRefreshFailureCallback(() => {
      logoutRef.current();
      toast.error('Your session expired. Please sign in again.', {
        toastId: 'session-expired',
      });
    });

    restoreSession();
  }, []);

  const value: AuthContextValue = {
    user,
    organization,
    isAuthenticated: !!user,
    isLoading,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// ─────────────────────────────────────────────────────────
// Hook
// ─────────────────────────────────────────────────────────

export const useAuth = (): AuthContextValue => {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return ctx;
};
