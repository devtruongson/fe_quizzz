import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import type { User, AuthContextType } from '../types';
import { authAPI } from '../services/api';
import toast from 'react-hot-toast';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if user is stored in localStorage
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (error) {
        localStorage.removeItem('user');
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      const userData = await authAPI.login({ email, password });
      setUser(userData);
      localStorage.setItem('user', JSON.stringify(userData));
      toast.success('Đăng nhập thành công!');
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Đăng nhập thất bại');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      const userData = await authAPI.register({ email, password });
      setUser(userData);
      localStorage.setItem('user', JSON.stringify(userData));
      toast.success('Đăng ký thành công!');
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Đăng ký thất bại');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
    toast.success('Đăng xuất thành công!');
  };

  const value: AuthContextType = {
    user,
    login,
    register,
    logout,
    isLoading,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}; 