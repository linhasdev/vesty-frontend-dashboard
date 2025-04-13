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
    
    // Setup listener
    window.addEventListener('resize', checkIfMobile);
    
    // Cleanup
    return () => {
      window.removeEventListener('resize', checkIfMobile);
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
            <div className="flex-1 flex flex-col h-screen">
              {/* Header with toggle button (no border) */}
              <header className="h-16 flex items-center px-4 bg-transparent">
                <button 
                  onClick={toggleSidebar}
                  className="h-8 w-8 p-1 rounded-md flex items-center justify-center hover:bg-accent transition-colors duration-200"
                  aria-label={sidebarOpen ? "Close sidebar" : "Open sidebar"}
                >
                  <PanelLeft 
                    size={20} 
                    className={`sidebar-transition ${sidebarOpen ? 'rotate-0' : 'rotate-180'}`} 
                  />
                  <span className="sr-only">Toggle Sidebar</span>
                </button>
              </header>
              
              <main className="flex-1 p-4 overflow-y-auto">
                {children}
              </main>
            </div>
          </div>
        )}
      </ProtectedRoute>
    </AuthProvider>
  );
} 