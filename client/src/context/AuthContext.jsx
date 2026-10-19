import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../services/authService';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('stayeasy_token') || null);
  const [loading, setLoading] = useState(true);

  // Initialize and verify authentication state on mount
  useEffect(() => {
    const initializeAuth = async () => {
      const storedToken = localStorage.getItem('stayeasy_token');

      if (!storedToken) {
        setLoading(false);
        return;
      }

      try {
        const response = await authService.getMe();
        if (response.success && response.data?.user) {
          setUser(response.data.user);
          setToken(storedToken);
        } else {
          localStorage.removeItem('stayeasy_token');
          setUser(null);
          setToken(null);
        }
      } catch (error) {
        console.warn('[Auth] Session validation failed:', error.message);
        localStorage.removeItem('stayeasy_token');
        setUser(null);
        setToken(null);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, []);

  /**
   * Log in user
   */
  const login = async (email, password) => {
    setLoading(true);
    try {
      const res = await authService.login({ email, password });
      if (res.success && res.data) {
        const { token: newToken, user: userData } = res.data;
        localStorage.setItem('stayeasy_token', newToken);
        setToken(newToken);
        setUser(userData);
        return { success: true, user: userData };
      }
      throw new Error(res.message || 'Login failed');
    } catch (error) {
      throw error;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Register a new user or owner
   */
  const register = async (formData) => {
    setLoading(true);
    try {
      const res = await authService.register(formData);
      if (res.success && res.data) {
        const { token: newToken, user: userData } = res.data;
        localStorage.setItem('stayeasy_token', newToken);
        setToken(newToken);
        setUser(userData);
        return { success: true, user: userData };
      }
      throw new Error(res.message || 'Registration failed');
    } catch (error) {
      throw error;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Log out user
   */
  const logout = async () => {
    try {
      await authService.logout().catch(() => {});
    } finally {
      localStorage.removeItem('stayeasy_token');
      setUser(null);
      setToken(null);
    }
  };

  /**
   * Update local user state
   */
  const updateUser = (updatedFields) => {
    setUser((prev) => (prev ? { ...prev, ...updatedFields } : null));
  };

  /**
   * Re-fetch latest user profile from server
   */
  const refreshUser = async () => {
    try {
      const res = await authService.getMe();
      if (res.success && res.data?.user) {
        setUser(res.data.user);
      }
    } catch (error) {
      console.warn('[Auth] Failed to refresh profile:', error.message);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user && !!token,
        role: user?.role || 'GUEST',
        loading,
        login,
        register,
        logout,
        updateUser,
        refreshUser,
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

export default AuthContext;
