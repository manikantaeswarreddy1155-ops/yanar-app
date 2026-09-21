import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types';
import { StorageService } from '../services/storageService';
import { ApiClient } from '../services/apiClient';
import { DEMO_USERS } from '../services/mockData';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  demoUsers: User[];
  login: (identifier: string, password?: string) => Promise<{ success: boolean; error?: string }>;
  signup: (userData: { username: string; name: string; email: string; password: string }) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  switchUser: (user: User) => void;
  loginAsDemo: (demoUser: User) => void;
  updateUser: (updates: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [demoUsers, setDemoUsers] = useState<User[]>(DEMO_USERS);

  useEffect(() => {
    // Clear any stale legacy demo user from older deployments
    try {
      localStorage.removeItem('yanar_user');
    } catch {}

    // Check if an active registered session exists
    const saved = StorageService.getCurrentUser();
    if (saved && saved.id && saved.id !== 'usr_me' && saved.username !== 'alexrivers') {
      setUser(saved);
      setIsAuthenticated(true);
    } else {
      setUser(null);
      setIsAuthenticated(false);
      StorageService.setCurrentUser(null);
    }
    setIsLoading(false);

    // Fetch available demo accounts for the optional explorer drawer
    ApiClient.getDemoUsers().then((users) => {
      if (users && users.length > 0) {
        setDemoUsers(users);
      }
    });
  }, []);

  const login = async (identifier: string, password?: string): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true);
    try {
      const res = await ApiClient.login({ identifier, password });
      if (res.success && res.user) {
        setUser(res.user);
        setIsAuthenticated(true);
        StorageService.setCurrentUser(res.user);
        return { success: true };
      }
      return { success: false, error: res.error || 'Invalid credentials' };
    } finally {
      setIsLoading(false);
    }
  };

  const signup = async (userData: { username: string; name: string; email: string; password: string }): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true);
    try {
      const res = await ApiClient.signup(userData);
      if (res.success && res.user) {
        setUser(res.user);
        setIsAuthenticated(true);
        StorageService.setCurrentUser(res.user);
        return { success: true };
      }
      return { success: false, error: res.error || 'Registration failed' };
    } finally {
      setIsLoading(false);
    }
  };

  const loginAsDemo = (demoUser: User) => {
    setUser(demoUser);
    setIsAuthenticated(true);
    StorageService.setCurrentUser(demoUser);
  };

  const logout = () => {
    setUser(null);
    setIsAuthenticated(false);
    StorageService.setCurrentUser(null);
  };

  const switchUser = (newUser: User) => {
    setUser(newUser);
    setIsAuthenticated(true);
    StorageService.setCurrentUser(newUser);
  };

  const updateUser = (updates: Partial<User>) => {
    const updated = StorageService.updateCurrentUser(updates);
    if (updated) {
      setUser(updated);
      ApiClient.updateProfile({ id: updated.id, ...updates });
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        isLoading,
        demoUsers,
        login,
        signup,
        logout,
        switchUser,
        loginAsDemo,
        updateUser,
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
