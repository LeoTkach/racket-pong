import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { apiClient } from '../api/client';

interface User {
  id: number;
  username: string;
  full_name: string;
  email: string;
  country: string;
  avatar_url?: string;
  rating: number;
  rank: number;
  ranking: number;
  games_played: number;
  wins: number;
  losses: number;
  win_rate: number;
  join_date: string;
  bio?: string;
  playing_style?: string;
  favorite_shot?: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (userData: any) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if user is already logged in
    const userId = localStorage.getItem('userId');
    if (userId) {
      // Try to fetch user data
      apiClient.getCurrentUser()
        .then((userData) => {
          setUser(userData);
        })
        .catch((error) => {
          // If fetch fails (backend unavailable or network error), 
          // keep user data in localStorage but don't set user state
          // This allows the app to continue working even if backend is temporarily unavailable
          console.warn('Failed to fetch user data on mount (backend may be unavailable):', error);
          // Only clear storage if it's an authentication error, not a network error
          if (error.message && error.message.includes('Not authenticated')) {
            localStorage.removeItem('userId');
          }
        })
        .finally(() => {
          setIsLoading(false);
        });
    } else {
      setIsLoading(false);
    }
  }, []);

  const login = async (email: string, password: string) => {
    const response = await apiClient.login(email, password);
    setUser(response.user);
    localStorage.setItem('userId', response.user.id.toString());
  };

  const signup = async (userData: any) => {
    const response = await apiClient.signup(userData);
    setUser(response.user);
    localStorage.setItem('userId', response.user.id.toString());
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('userId');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        login,
        signup,
        logout,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}


