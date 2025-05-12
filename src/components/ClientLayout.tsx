"use client";

import { ReactNode, useState, useEffect } from 'react';
import { AppSidebar } from "./AppSidebar";
import { AuthProvider } from "../lib/contexts/AuthContext";
import ProtectedRoute from "./ProtectedRoute";
import { usePathname } from 'next/navigation';
import { PanelLeft } from 'lucide-react';

interface ClientLayoutProps {
  children: ReactNode;
}

export default function ClientLayout({ children }: ClientLayoutProps) {
  const pathname = usePathname();
  const isAuthPage = pathname === '/login' || pathname === '/signup';
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkIfMobile = () => {
      const isMobileView = window.innerWidth < 768;
      setIsMobile(isMobileView);
      
      // Auto-collapse sidebar on mobile
      if (isMobileView) {
        setSidebarOpen(false);
      } else {
        // On desktop, default to expanded
        setSidebarOpen(true);
      }
    };
    
    // Check initially
    checkIfMobile();
    
    // Setup listener for window resize
    window.addEventListener('resize', checkIfMobile);
    
    // Setup listener for custom toggleSidebar event
    const handleToggleSidebar = (event: any) => {
      const { isOpen } = event.detail;
      setSidebarOpen(isOpen);
    };
    
    window.addEventListener('toggleSidebar', handleToggleSidebar);
    
    // Cleanup
    return () => {
      window.removeEventListener('resize', checkIfMobile);
      window.removeEventListener('toggleSidebar', handleToggleSidebar);
    };
  }, []);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <AuthProvider>
      <ProtectedRoute>
        {isAuthPage ? (
          <>{children}</>
        ) : (
          <div className="flex h-screen overflow-hidden">
            {/* Mobile overlay */}
            {isMobile && sidebarOpen && (
              <div 
                className="fixed inset-0 bg-black/50 z-30"
                onClick={() => setSidebarOpen(false)}
              />
            )}
            
            {/* Sidebar with animation */}
            <div 
              className={`fixed md:relative left-0 top-0 z-40 h-screen sidebar-transition ${
                sidebarOpen ? 'w-[240px]' : 'w-0'
              }`}
            >
              <div className={`h-full w-[240px] border-r bg-background sidebar-transition ${
                sidebarOpen ? 'translate-x-0' : '-translate-x-full'
              }`}>
                <AppSidebar />
              </div>
            </div>
            
            {/* Main content */}
            <div className="flex-1 flex flex-col h-screen relative">
              {/* Floating toggle button removed */}
              
              <main className="flex-1 overflow-hidden">
                {children}
              </main>
            </div>
          </div>
        )}
      </ProtectedRoute>
    </AuthProvider>
  );
} 