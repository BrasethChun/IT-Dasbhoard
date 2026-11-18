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
          // Silently slide the 30-day JWT expiry forward
          try {
            const refreshed = await apiClient.fetch('/auth/refresh', { method: 'POST' });
            if (refreshed?.token) {
              apiClient.setToken(refreshed.token);
            }
            if (refreshed?.user) {
              setUser(refreshed.user);
            }
          } catch {
            // Non-fatal: keep existing valid session
          }
        } else {
          apiClient.clearToken();
          setUserState(null);
        }
      } catch (err: any) {
        // Only terminate session when server explicitly rejects credentials (401/403).
        // Transient 502/503/network errors during GoDaddy Passenger wake-up restore cached session.
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

    // Also silently slide token when user returns to an open browser tab after hours/days
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && apiClient.getToken()) {
        apiClient.fetch('/auth/refresh', { method: 'POST' })
          .then((refreshed) => {
            if (refreshed?.token) apiClient.setToken(refreshed.token);
            if (refreshed?.user) setUser(refreshed.user);
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