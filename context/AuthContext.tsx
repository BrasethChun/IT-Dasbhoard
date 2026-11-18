import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { User } from '../types';
import { apiClient } from '../src/apiClient';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  logout: () => void;
  setUser: (user: User | null) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const REFRESH_TIMESTAMP_KEY = 'auth_token_refreshed_at';
const REFRESH_INTERVAL_MS = 12 * 60 * 60 * 1000; // 12 hours

function shouldRefreshToken(): boolean {
  try {
    const raw = localStorage.getItem(REFRESH_TIMESTAMP_KEY);
    if (!raw) return true;
    const elapsed = Date.now() - Number(raw);
    return isNaN(elapsed) || elapsed >= REFRESH_INTERVAL_MS;
  } catch {
    return false;
  }
}

function markTokenRefreshed() {
  try {
    localStorage.setItem(REFRESH_TIMESTAMP_KEY, String(Date.now()));
  } catch {}
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUserState] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const setUser = useCallback((nextUser: User | null) => {
    setUserState(nextUser);
    apiClient.setCachedUser(nextUser);
  }, []);

  useEffect(() => {
    const verifyAndRefreshSession = async () => {
      const token = apiClient.getToken();
      if (!token) {
        apiClient.setCachedUser(null);
        setUserState(null);
        setLoading(false);
        return;
      }

      try {
        const data = await apiClient.fetch('/auth/me');
        if (data && data.user) {
          setUser(data.user);
          // Silently slide the 30-day JWT expiry forward at most once every 12 hours
          if (shouldRefreshToken()) {
            try {
              const refreshed = await apiClient.fetch('/auth/refresh', { method: 'POST' });
              if (refreshed?.token) {
                apiClient.setToken(refreshed.token);
              }
              if (refreshed?.user) {
                setUser(refreshed.user);
              }
              markTokenRefreshed();
            } catch {
              // Non-fatal: keep existing valid session
            }
          }
        } else {
          apiClient.clearToken();
          setUserState(null);
        }
      } catch (err: any) {
        // Only terminate session when server explicitly rejects credentials (401/403).
        // Transient 429/502/503/network errors restore cached session.
        if (err?.status === 401 || err?.status === 403) {
          apiClient.clearToken();
          setUserState(null);
        } else {
          const cached = apiClient.getCachedUser<User>();
          if (cached) {
            setUserState(cached);
          }
        }
      } finally {
        setLoading(false);
      }
    };

    verifyAndRefreshSession();

    // Also silently slide token when returning to an open tab if >=12h elapsed
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && apiClient.getToken() && shouldRefreshToken()) {
        apiClient.fetch('/auth/refresh', { method: 'POST' })
          .then((refreshed) => {
            if (refreshed?.token) apiClient.setToken(refreshed.token);
            if (refreshed?.user) setUser(refreshed.user);
            markTokenRefreshed();
          })
          .catch((err: any) => {
            if (err?.status === 401 || err?.status === 403) {
              apiClient.clearToken();
              setUserState(null);
            }
          });
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [setUser]);

  const logout = useCallback(() => {
    apiClient.clearToken();
    setUserState(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, logout, setUser }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};