import React, { createContext, useContext, useState, useEffect } from 'react';
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
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initSession = async () => {
      const token = apiClient.getToken();
      if (token) {
        try {
          const data = await apiClient.fetch('/auth/me');
          if (data && data.user) {
            setUser(data.user);
          } else {
            apiClient.clearToken();
            setUser(null);
          }
        } catch {
          // Token is expired, invalid, or session obsolete; clear local session cleanly
          apiClient.clearToken();
          setUser(null);
        }
      }
      setLoading(false);
    };

    initSession();
  }, []);

  const logout = () => {
    apiClient.clearToken();
    setUser(null);
  };

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