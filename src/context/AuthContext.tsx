import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import * as api from '../lib/api';

export type Role = 'ADMIN' | 'MANAGER' | 'EMPLOYEE';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  companyId: string;
}

export interface Company {
  id: string;
  name: string;
  plan: string;
}

interface AuthContextType {
  user: User | null;
  company: Company | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (companyName: string, name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  error: string | null;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [company, setCompany] = useState<Company | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const clearError = () => setError(null);

  const logout = () => {
    api.clearAuthToken();
    setUser(null);
    setCompany(null);
    navigate('/login', { replace: true });
  };

  // Set up 401 handler
  useEffect(() => {
    api.setUnauthorizedHandler(() => {
      setUser(null);
      setCompany(null);
      setError('Session expired. Please login again.');
      navigate('/login', { replace: true });
    });
  }, [navigate]);

  // Load user on mount if token exists
  useEffect(() => {
    const loadUser = async () => {
      const token = api.getAuthToken();
      if (!token) {
        setIsLoading(false);
        return;
      }

      try {
        const userData = await api.fetchMe();
        setUser({
          id: userData.id,
          name: userData.name,
          email: userData.email,
          role: userData.role as Role,
          companyId: userData.companyId,
        });
        // Note: fetchMe doesn't return company info, so we'll set it from login/signup
        // or fetch it separately if needed
      } catch (err) {
        // Token is invalid or API is down, clear it and continue
        console.error('Failed to load user:', err);
        api.clearAuthToken();
        setUser(null);
        setCompany(null);
      } finally {
        setIsLoading(false);
      }
    };

    // Add a safety timeout to ensure loading state doesn't hang forever
    const timeoutId = setTimeout(() => {
      console.warn('Auth loading timeout - forcing completion');
      setIsLoading(false);
    }, 5000);

    loadUser().finally(() => {
      clearTimeout(timeoutId);
    });

    return () => clearTimeout(timeoutId);
  }, []);

  const login = async (email: string, password: string) => {
    try {
      setError(null);
      setIsLoading(true);
      const response = await api.login({ email, password });
      
      // Store token
      api.setAuthToken(response.token);
      
      // Set user and company
      setUser({
        id: response.user.id,
        name: response.user.name,
        email: response.user.email,
        role: response.user.role as Role,
        companyId: response.user.companyId,
      });
      setCompany(response.company);
      
      // Navigate to dashboard
      navigate('/dashboard', { replace: true });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Login failed';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const signup = async (companyName: string, name: string, email: string, password: string) => {
    try {
      setError(null);
      setIsLoading(true);
      const response = await api.signup({ companyName, name, email, password });
      
      // Store token
      api.setAuthToken(response.token);
      
      // Set user and company
      setUser({
        id: response.user.id,
        name: response.user.name,
        email: response.user.email,
        role: response.user.role as Role,
        companyId: response.user.companyId,
      });
      setCompany(response.company);
      
      // Navigate to dashboard
      navigate('/dashboard', { replace: true });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Signup failed';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const value = {
    user,
    company,
    isAuthenticated: !!user,
    isLoading,
    login,
    signup,
    logout,
    error,
    clearError,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

