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
  const [demoUsers, setDemoUsers] = useState<User[]>(
    DEMO_USERS.filter((u) => u.username !== 'alexrivers' && u.id !== 'usr_me' && u.id !== 'usr_alex')
  );

  useEffect(() => {
    // 1. Purge all legacy storage keys and any cached demo/Alex Rivers profiles
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const legacyKeys = [
          'yanar_user',
          'user',
          'currentUser',
          'yanar_current_user',
          'demo_user',
          'yanar_demo_user',
          'yanar_auth_user',
        ];
        legacyKeys.forEach((k) => localStorage.removeItem(k));

        // Scan all storage keys and purge any key that contains Alex Rivers or demo identifiers
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key) {
            const val = localStorage.getItem(key);
            if (
              val &&
              (val.includes('alexrivers') ||
                val.includes('usr_me') ||
                val.includes('usr_alex') ||
                val.includes('Alex Rivers'))
            ) {
              localStorage.removeItem(key);
            }
          }
        }
      }
    } catch {}

    // 2. Validate saved session - strictly require a valid registered non-demo account
    const saved = StorageService.getCurrentUser();
    if (
      saved &&
      saved.id &&
      saved.id !== 'usr_me' &&
      saved.id !== 'usr_alex' &&
      saved.username !== 'alexrivers' &&
      saved.name !== 'Alex Rivers'
    ) {
      setUser(saved);
      setIsAuthenticated(true);
    } else {
      setUser(null);
      setIsAuthenticated(false);
      StorageService.setCurrentUser(null);
    }
    setIsLoading(false);

    // 3. Fetch available demo accounts for the optional explorer drawer, filtering out Alex Rivers
    ApiClient.getDemoUsers().then((users) => {
      if (users && users.length > 0) {
        const filtered = users.filter(
          (u) => u.id !== 'usr_me' && u.id !== 'usr_alex' && u.username !== 'alexrivers'
        );
        if (filtered.length > 0) {
          setDemoUsers(filtered);
        }
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
