import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types';
import { StorageService } from '../services/storageService';
import { DEMO_USERS, CURRENT_USER } from '../services/mockData';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  demoUsers: User[];
  login: (email: string, password: string) => Promise<boolean>;
  signup: (email: string, password: string, username: string, name: string) => Promise<boolean>;
  logout: () => void;
  switchUser: (user: User) => void;
  updateUser: (updates: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(true);

  useEffect(() => {
    // Load persisted user or default to CURRENT_USER
    const saved = StorageService.getCurrentUser();
    setUser(saved || CURRENT_USER);
  }, []);

  const login = async (email: string, _password: string): Promise<boolean> => {
    // Check if email matches any demo username or email
    const username = email.split('@')[0].toLowerCase();
    const matched = DEMO_USERS.find(u => u.username.toLowerCase() === username) || CURRENT_USER;
    
    setUser(matched);
    setIsAuthenticated(true);
    StorageService.updateCurrentUser(matched);
    return true;
  };

  const signup = async (_email: string, _password: string, username: string, name: string): Promise<boolean> => {
    const newUser: User = {
      id: `usr_${Date.now()}`,
      username: username.toLowerCase().replace(/\s+/g, '_'),
      name: name || username,
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=400&q=80',
      bio: 'New explorer on YANAR ✨',
      followersCount: 0,
      followingCount: 0,
      postsCount: 0,
    };
    setUser(newUser);
    setIsAuthenticated(true);
    StorageService.updateCurrentUser(newUser);
    return true;
  };

  const logout = () => {
    setUser(null);
    setIsAuthenticated(false);
  };

  const switchUser = (newUser: User) => {
    setUser(newUser);
    setIsAuthenticated(true);
    StorageService.updateCurrentUser(newUser);
  };

  const updateUser = (updates: Partial<User>) => {
    const updated = StorageService.updateCurrentUser(updates);
    setUser(updated);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        demoUsers: [CURRENT_USER, ...DEMO_USERS],
        login,
        signup,
        logout,
        switchUser,
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
