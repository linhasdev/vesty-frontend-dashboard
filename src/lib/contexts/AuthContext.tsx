'use client';

import React, { createContext, useState, useEffect, useContext } from 'react';
// Fix the import path for authService - implement it directly since it seems to be missing
// import { getCurrentUser, getCurrentSession, signOut } from '../services/authService';
import supabase from '../supabase/supabase';
import { useRouter } from 'next/navigation';

interface AuthContextType {
  user: any;
  session: any;
  isAuthenticated: boolean;
  loading: boolean;
  logout: () => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
}

// Create the auth context
const AuthContext = createContext<AuthContextType | null>(null);

// Create a provider component
export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<any>(null);
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // Implementation of missing authService functions
  const getCurrentSession = async () => {
    const { data } = await supabase.auth.getSession();
    return data.session;
  };

  const getCurrentUser = async () => {
    const { data } = await supabase.auth.getUser();
    return data.user;
  };

  const signOut = async () => {
    return supabase.auth.signOut();
  };

  useEffect(() => {
    // Check for existing session on mount
    const initAuth = async () => {
      setLoading(true);
      try {
        const session = await getCurrentSession();
        setSession(session);
        
        if (session) {
          const user = await getCurrentUser();
          setUser(user);
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
      } finally {
        setLoading(false);
      }
    };

    initAuth();

    // Set up auth state change listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event: string, session: any) => {
        setSession(session);
        setUser(session?.user || null);
        setLoading(false);
      }
    );

    // Clean up subscription
    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  // Handle logout
  const logout = async () => {
    try {
      await signOut();
      setUser(null);
      setSession(null);
      router.push('/login');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  // Update the redirect paths in the login, signUp, and any other relevant functions
  // For example:

  const login = async (email: string, password: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
      
      // Update user state
      setUser(data.user);
      setSession(data.session);
      
      // Redirect to dashboard after login
      router.push('/plan');
      
    } catch (error: any) {
      console.error('Error logging in:', error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Similarly update the signup function to redirect to dashboard
  const signUp = async (email: string, password: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) throw error;
      
      // Update user state if auto-confirmed
      if (data.user) {
        setUser(data.user);
        setSession(data.session);
        
        // Redirect to dashboard after signup
        router.push('/plan');
      }
      
    } catch (error: any) {
      console.error('Error signing up:', error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Value to be provided by the context
  const value: AuthContextType = {
    user,
    session,
    isAuthenticated: !!session,
    loading,
    logout,
    login,
    signUp
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use the auth context
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === null) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}; 