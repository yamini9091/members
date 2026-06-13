import React, { createContext, useState, useEffect, useCallback } from 'react';
import authService from '../services/authService';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Initialize auth state on mount
  useEffect(() => {
    const initializeAuth = async () => {
      const token = authService.getAuthToken();
      if (token) {
        const userData = await authService.getCurrentUser();
        if (userData) {
          setUser(userData);
          setIsAuthenticated(true);
        } else {
          authService.logout();
        }
      }
      setLoading(false);
    };

    initializeAuth();
  }, []);

  const login = useCallback(async (email, password) => {
    const result = await authService.login(email, password);
    if (result.success) {
      setUser(result.user);
      setIsAuthenticated(true);
    }
    return result;
  }, []);

  const logout = useCallback(() => {
    authService.logout();
    setUser(null);
    setIsAuthenticated(false);
  }, []);

  const register = useCallback(async (name, email, password, passwordConfirm) => {
    return await authService.register(name, email, password, passwordConfirm);
  }, []);

  const verifyEmail = useCallback(async (token) => {
    return await authService.verifyEmail(token);
  }, []);

  const forgotPassword = useCallback(async (email) => {
    return await authService.forgotPassword(email);
  }, []);

  const resetPassword = useCallback(async (token, password, passwordConfirm) => {
    return await authService.resetPassword(token, password, passwordConfirm);
  }, []);

  const value = {
    user,
    loading,
    isAuthenticated,
    login,
    logout,
    register,
    verifyEmail,
    forgotPassword,
    resetPassword,
    accessToken: authService.getAuthToken()
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = React.useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
