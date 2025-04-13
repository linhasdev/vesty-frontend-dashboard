"use client";

import { ReactNode } from 'react';
import Sidebar from "./Sidebar";
import { AuthProvider } from "../lib/contexts/AuthContext";
import ProtectedRoute from "./ProtectedRoute";
import { usePathname } from 'next/navigation';

interface ClientLayoutProps {
  children: ReactNode;
}

export default function ClientLayout({ children }: ClientLayoutProps) {
  const pathname = usePathname();
  const isAuthPage = pathname === '/login' || pathname === '/signup';

  return (
    <AuthProvider>
      <ProtectedRoute>
        {isAuthPage ? (
          <>{children}</>
        ) : (
          <div className="flex">
            <Sidebar />
            <main className="flex-1 md:ml-12 p-4 md:p-6 max-w-full md:max-w-[calc(100vw-3rem)] overflow-x-hidden">
              {children}
            </main>
          </div>
        )}
      </ProtectedRoute>
    </AuthProvider>
  );
} 