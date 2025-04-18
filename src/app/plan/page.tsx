"use client";

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import ViewPill from '../../components/plan/ViewPill';
import YourClassesView from '../../components/plan/YourClassesView';
import CalendarView from '../../components/plan/CalendarView';
import SubjectsView from '../../components/plan/SubjectsView';
import ProgressView from '../../components/plan/ProgressView';

// Mock data for Subjects view (keep this for now)
const subjectsData = [
  {
    id: "math-101",
    name: "Mathematics",
    color: "#F87171",
    progress: 65,
    nextClass: "Apr 15, 09:00",
    totalClasses: 30,
    completedClasses: 20
  },
  {
    id: "phys-101",
    name: "Physics",
    color: "#60A5FA",
    progress: 45,
    nextClass: "Apr 18, 13:00",
    totalClasses: 25,
    completedClasses: 11
  },
  {
    id: "chem-101",
    name: "Chemistry",
    color: "#34D399",
    progress: 78,
    nextClass: "Apr 14, 11:00",
    totalClasses: 28,
    completedClasses: 22
  },
  {
    id: "bio-101",
    name: "Biology",
    color: "#A78BFA",
    progress: 32,
    nextClass: "Apr 17, 10:00",
    totalClasses: 24,
    completedClasses: 8
  },
  {
    id: "hist-101",
    name: "History",
    color: "#FBBF24",
    progress: 90,
    nextClass: "Apr 19, 14:00",
    totalClasses: 20,
    completedClasses: 18
  },
  {
    id: "eng-101",
    name: "English",
    color: "#EC4899",
    progress: 55,
    nextClass: "Apr 16, 13:00",
    totalClasses: 22,
    completedClasses: 12
  }
];

export default function PlanPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const views = ["Your Classes", "Calendar", "Subjects", "Progress"];
  const [currentView, setCurrentView] = useState(views[0]);
  const [isMobile, setIsMobile] = useState(false);
  const [initialLoad, setInitialLoad] = useState(true);

  // Check if we're on mobile when component mounts and on window resize
  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    // Initial check
    checkIfMobile();
    
    // Add event listener for window resize
    window.addEventListener('resize', checkIfMobile);
    
    // Cleanup
    return () => {
      window.removeEventListener('resize', checkIfMobile);
    };
  }, []);

  // Handle URL parameters for initial view
  useEffect(() => {
    const viewParam = searchParams.get('view');
    if (viewParam) {
      // Convert view parameter to match our view names (capitalize first letter)
      const formattedView = viewParam.charAt(0).toUpperCase() + viewParam.slice(1);
      
      // Find matching view
      const matchedView = views.find(v => v.toLowerCase().includes(formattedView.toLowerCase()));
      
      if (matchedView) {
        setCurrentView(matchedView);
      }
    }
    
    // Mark initial load as complete
    setInitialLoad(false);
  }, [searchParams, views]);

  // Handler for view changes
  const handleViewChange = (newView: string) => {
    setCurrentView(newView);
    
    // Update URL with the new view (use lowercase for URL parameter)
    const newViewParam = newView.toLowerCase();
    
    // Only update URL after initial load to prevent interference with direct navigation
    if (!initialLoad) {
      // Create a new URLSearchParams object
      const params = new URLSearchParams(searchParams.toString());
      
      // Set the view parameter
      params.set('view', newViewParam);
      
      // Update the URL without full page refresh
      router.push(`${pathname}?${params.toString()}`);
    }
  };

  return (
    <div className="w-full min-h-[90vh] flex flex-col px-2 sm:px-4">
      <ViewPill
        currentView={currentView}
        views={views}
        onChangeView={handleViewChange}
      />
      
      <div className="flex-1 relative">
        <AnimatePresence mode="wait" initial={false}>
          {currentView === "Your Classes" && (
            <motion.div
              key="your-classes"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="absolute inset-0"
            >
              <YourClassesView />
            </motion.div>
          )}
          
          {currentView === "Calendar" && (
            <motion.div
              key="calendar"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="absolute inset-0"
            >
              <CalendarView />
            </motion.div>
          )}
          
          {currentView === "Subjects" && (
            <motion.div
              key="subjects"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="absolute inset-0"
            >
              <SubjectsView subjects={subjectsData} />
            </motion.div>
          )}
          
          {currentView === "Progress" && (
            <motion.div
              key="progress"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="absolute inset-0"
            >
              <ProgressView />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
} 