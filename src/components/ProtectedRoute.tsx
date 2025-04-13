"use client";

import { ReactNode, useEffect, useState } from 'react';
import { useAuth } from '../lib/hooks/useAuth';
import { useRouter, usePathname } from 'next/navigation';

interface ProtectedRouteProps {
  children: ReactNode;
}

const publicPaths = ['/login', '/signup'];

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [isNavigating, setIsNavigating] = useState(false);
  const loading = authLoading || isNavigating;
  
  // Reset navigating state when pathname changes
  useEffect(() => {
    setIsNavigating(false);
  }, [pathname]);
  
  useEffect(() => {
    // Skip the check while still loading auth or already navigating
    if (authLoading || isNavigating) return;
    
    // If on a public path but authenticated, redirect to dashboard
    if (publicPaths.includes(pathname) && isAuthenticated) {
      setIsNavigating(true);
      router.push('/plan');
      return;
    }
    
    // If on a protected path but not authenticated, redirect to login
    if (!publicPaths.includes(pathname) && !isAuthenticated) {
      setIsNavigating(true);
      router.push('/login');
      return;
    }
  }, [isAuthenticated, authLoading, pathname, router, isNavigating]);

  // Show loading spinner while auth is loading or during navigation
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mb-4"></div>
          <p className="text-gray-500 text-sm">{authLoading ? 'Checking authentication...' : 'Redirecting...'}</p>
        </div>
      </div>
    );
  }

  // On public paths, or if authenticated on protected paths, render children
  return <>{children}</>;
} 