'use client';

import React, { createContext, useState, useEffect, useContext } from 'react';
import { getCurrentUser, getCurrentSession, signOut } from '../services/authService';
import supabase from '../lib/supabase';
import { useRouter } from 'next/navigation';

// Create the auth context
const AuthContext = createContext(null);

// Create a provider component
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

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
      async (event, session) => {
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
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  // Update the redirect paths in the login, signUp, and any other relevant functions
  // For example:

  const login = async (email, password) => {
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
      
      // Redirect to dashboard after login (Next.js will handle this)
      router.push('/app-dashboard');
      
    } catch (error) {
      console.error('Error logging in:', error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Similarly update the signup function to redirect to dashboard
  const signUp = async (email, password) => {
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
        
        // Redirect to dashboard after signup (Next.js will handle this)
        router.push('/app-dashboard');
      }
      
    } catch (error) {
      console.error('Error signing up:', error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Value to be provided by the context
  const value = {
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
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === null) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}; 