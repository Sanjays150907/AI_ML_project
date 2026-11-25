import React, { createContext, useContext, useState, useEffect } from 'react';
import { api, type User } from '../services/api';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<User>;
  register: (email: string, password: string, fullName?: string) => Promise<User>;
  logout: () => Promise<void>;
  updateProfile: (data: { full_name?: string; password?: string }) => Promise<void>;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('access_token');
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        const currentUser = await api.getMe();
        setUser(currentUser);
      } catch {
        localStorage.removeItem('access_token');
        localStorage.removeItem('current_user');
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    initAuth();

    const handleExpired = () => {
      setUser(null);
    };
    window.addEventListener('auth-expired', handleExpired);
    return () => window.removeEventListener('auth-expired', handleExpired);
  }, []);

  const login = async (email: string, password: string): Promise<User> => {
    const res = await api.login({ email, password });
    setUser(res.user);
    return res.user;
  };

  const register = async (email: string, password: string, fullName?: string): Promise<User> => {
    const newUser = await api.register({ email, password, full_name: fullName });
    return newUser;
  };

  const logout = async () => {
    await api.logout();
    setUser(null);
  };

  const updateProfile = async (data: { full_name?: string; password?: string }) => {
    const updated = await api.updateProfile(data);
    setUser(updated);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        register,
        logout,
        updateProfile,
        isAdmin: user?.role === 'admin',
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
