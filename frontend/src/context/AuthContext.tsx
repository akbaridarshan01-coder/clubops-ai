import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types/index.js';
import { api } from '../services/api.js';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, pass: string) => Promise<void>;
  verifyOtpAndLogin: (identifier: string, code: string, type: 'EMAIL_VERIFY' | 'MOBILE_VERIFY' | 'LOGIN') => Promise<void>;
  register: (data: any) => Promise<any>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('clubops_token'));
  const [isLoading, setIsLoading] = useState(true);

  const refreshUser = async () => {
    try {
      if (token) {
        const profile: any = await api.getMe();
        setUser(profile);
      }
    } catch {
      logout();
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      refreshUser();
    } else {
      setIsLoading(false);
    }
  }, [token]);

  const login = async (email: string, pass: string) => {
    const res: any = await api.login({ email, password: pass });
    localStorage.setItem('clubops_token', res.accessToken);
    setToken(res.accessToken);
    setUser(res.user);
  };

  const verifyOtpAndLogin = async (identifier: string, code: string, type: 'EMAIL_VERIFY' | 'MOBILE_VERIFY' | 'LOGIN') => {
    const res: any = await api.verifyOtp({ identifier, code, type });
    localStorage.setItem('clubops_token', res.accessToken);
    setToken(res.accessToken);
    setUser(res.user);
  };

  const register = async (data: any) => {
    return await api.register(data);
  };

  const logout = () => {
    localStorage.removeItem('clubops_token');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        login,
        verifyOtpAndLogin,
        register,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
