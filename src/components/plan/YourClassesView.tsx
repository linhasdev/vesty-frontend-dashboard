"use client";

import { useState, useRef, useEffect } from 'react';
import SubjectPill from './SubjectPill';
import { motion, AnimatePresence } from 'framer-motion';
import { useClassSchedule, ClassInfo } from '../../lib/hooks/useClassSchedule';
import { CalendarClock, ArrowRight } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function YourClassesView() {
  const { classDays, loading, error, currentDate, navigateRelative } = useClassSchedule();
  const [currentIndex, setCurrentIndex] = useState<number | null>(null); // Start with null instead of 15
  const [animationDirection, setAnimationDirection] = useState(0); // -1 for left, 1 for right, 0 for initial
  const [initialRenderComplete, setInitialRenderComplete] = useState(false);
  const [forceExitLoading, setForceExitLoading] = useState(false);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const router = useRouter();
  
  // Required minimum distance traveled to be considered swipe
  const minSwipeDistance = 50;
  
  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null); // Reset touchEnd
    setTouchStart(e.targetTouches[0].clientX);
  };
  
  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };
  
  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;
    
    if (isLeftSwipe) {
      handleNext(); // Swipe left means navigate to next day
    } else if (isRightSwipe) {
      handlePrevious(); // Swipe right means navigate to previous day
    }
    
    // Reset values
    setTouchStart(null);
    setTouchEnd(null);
  };
  
  // Force exit loading state after timeout
  useEffect(() => {
    const timer = setTimeout(() => {
      if (loading) {
        console.log('Force exiting loading state after timeout');
        setForceExitLoading(true);
      }
    }, 5000); // 5 seconds max loading time
    
    return () => clearTimeout(timer);
  }, [loading]);
  
  // Reset current index when classDays changes
  useEffect(() => {
    console.log('classDays useEffect triggered - length:', classDays?.length);
    
    // Safety timeout to prevent infinite loading
    const safetyTimer = setTimeout(() => {
      if (!initialRenderComplete) {
        console.log('Safety timeout triggered - forcing initialRenderComplete');
        setInitialRenderComplete(true);
        if (currentIndex === null && classDays && classDays.length > 0) {
          setCurrentIndex(Math.floor(classDays.length / 2));
        } else if (currentIndex === null) {
          setCurrentIndex(0);
        }
      }
    }, 3000);
    
    if (!classDays || classDays.length === 0) {
      console.log('No class days available');
      setInitialRenderComplete(true); // Set to true even with no data
      setCurrentIndex(0); // Default to 0 if no data
      clearTimeout(safetyTimer);
      return;
    }
    
    // Find today's index in the classDays array
    const todayIndex = classDays.findIndex(day => day.displayName === 'Today');
    
    console.log('Today index:', todayIndex, 'Today date:', new Date().toLocaleDateString());
    console.log('Class days:', classDays.map(day => ({
      displayName: day.displayName,
      date: day.date,
      actualDate: day.actualDate
    })));
    
    if (todayIndex !== -1) {
      console.log('Setting currentIndex to todayIndex:', todayIndex);
      setCurrentIndex(todayIndex);
    } else {
      // If "Today" not found, try to find the middle
      const middleIndex = Math.floor(classDays.length / 2);
      console.log('Today not found, setting to middle index:', middleIndex);
      setCurrentIndex(middleIndex);
    }

    // Set initial render complete after setting the index
    setInitialRenderComplete(true);
    clearTimeout(safetyTimer);
  }, [classDays]);
  
  // Add debugging for current state
  useEffect(() => {
    console.log('Current component state:', { 
      loading, 
      currentIndex, 
      initialRenderComplete,
      classDaysLength: classDays?.length || 0
    });
  }, [loading, currentIndex, initialRenderComplete, classDays]);
  
  // Add debugging useEffect after the classDays useEffect
  // Reset current index when classDays changes
  useEffect(() => {
    if (!classDays || classDays.length === 0) return;
    
    // Find today's index in the classDays array
    const todayIndex = classDays.findIndex(day => day.displayName === 'Today');
    
    console.log('Today index:', todayIndex, 'Today date:', new Date().toLocaleDateString());
    console.log('Class days:', classDays.map(day => ({
      displayName: day.displayName,
      date: day.date,
      actualDate: day.actualDate
    })));
    
    if (todayIndex !== -1) {
      setCurrentIndex(todayIndex);
    } else {
      // If "Today" not found, try to find the middle
      setCurrentIndex(Math.floor(classDays.length / 2));
    }

    // Set initial render complete after setting the index
    setInitialRenderComplete(true);
  }, [classDays]);

  // Add new debugging useEffect to validate subjects are on the correct days
  useEffect(() => {
    if (classDays && classDays.length > 0) {
      // Check each day and its subjects to validate date alignment
      let mismatchFound = false;
      
      classDays.forEach(day => {
        if (day.subjects && day.subjects.length > 0) {
          day.subjects.forEach(subject => {
            // Check if the subject date matches the day's actualDate
            const datesMatch = day.actualDate === subject.date;
            
            if (!datesMatch) {
              console.error(`DATE MISMATCH: Day ${day.displayName} (${day.actualDate}) has subject: ${subject.name} with date ${subject.date}`);
              mismatchFound = true;
            } else {
              console.log(`Day ${day.displayName} (${day.actualDate}) has correctly aligned subject: ${subject.name}`);
            }
          });
        }
      });
      
      if (!mismatchFound) {
        console.log('✅ All subject dates correctly aligned with their days');
      }
    }
  }, [classDays]);
  
  // Show loading state if data is loading or index not determined yet
  if (loading && !forceExitLoading || currentIndex === null || !initialRenderComplete) {
    console.log('Rendering loading state because:', { loading, forceExitLoading, currentIndex, initialRenderComplete });
    return (
      <div className="relative w-full pb-10 px-4 mt-2">
        <div className="flex justify-center items-center h-[480px]">
          <div className="text-gray-500">Loading class schedule...</div>
        </div>
      </div>
    );
  }
  
  // Show error state if there's an error
  if (error) {
    return (
      <div className="relative w-full pb-10 px-4 mt-2">
        <div className="flex flex-col justify-center items-center h-[480px]">
          <div className="text-red-500 mb-4">{error}</div>
          {error.includes('classes_dataset') && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 max-w-md text-sm text-gray-700">
              <p className="font-semibold mb-2">Database Issue Detected</p>
              <p className="mb-2">
                The classes_dataset table appears to be empty. This table is required to display class information.
              </p>
              <p>
                Please contact your administrator to ensure that the database has been properly set up with class data.
              </p>
            </div>
          )}
        </div>
      </div>
    );
  }
  
  // Return early if no data is available
  if (!classDays || classDays.length === 0) {
    return (
      <div className="relative w-full pb-10 px-4 mt-2">
        <div className="flex justify-center items-center h-[480px]">
          <div className="text-gray-500">No classes scheduled</div>
        </div>
      </div>
    );
  }
  
  // Get visible days - 3 consecutive days
  const visibleDays = currentIndex !== null ? [
    classDays[Math.max(0, Math.min(currentIndex - 1, classDays.length - 1))],
    classDays[Math.max(0, Math.min(currentIndex, classDays.length - 1))],
    classDays[Math.max(0, Math.min(currentIndex + 1, classDays.length - 1))],
  ] : [];
  
  // Debug visible days and their subjects
  console.log("Visible days for rendering:", visibleDays.map(day => ({
    displayName: day.displayName,
    actualDate: day.actualDate,
    subjectCount: day.subjects.length,
    subjects: day.subjects.map(subject => ({
      name: subject.name,
      date: subject.date,
      // Check if subject date matches day date
      dateMatch: subject.date === day.actualDate
    }))
  })));

  // Check for mismatches
  const mismatchedSubjects = visibleDays.flatMap(day => 
    day.subjects.filter(subject => subject.date !== day.actualDate)
      .map(subject => ({
        dayDisplayName: day.displayName,
        dayActualDate: day.actualDate,
        subjectName: subject.name,
        subjectDate: subject.date
      }))
  );

  if (mismatchedSubjects.length > 0) {
    console.error("⚠️ DATE MISMATCH IN VISIBLE DAYS:", mismatchedSubjects);
  } else {
    console.log("✅ All visible subjects correctly aligned with their days");
  }
  
  const handlePrevious = () => {
    // If we're near the start of our data, fetch more
    if (currentIndex !== null && currentIndex < 3) {
      navigateRelative(-10); // Move 10 days back
      return;
    }
    
    setAnimationDirection(-1);
    setCurrentIndex(prev => prev !== null ? Math.max(0, prev - 1) : 0);
  };
  
  const handleNext = () => {
    // If we're near the end of our data, fetch more
    if (currentIndex !== null && currentIndex > classDays.length - 4) {
      navigateRelative(10); // Move 10 days forward
      return;
    }
    
    setAnimationDirection(1);
    setCurrentIndex(prev => prev !== null ? Math.min(classDays.length - 1, prev + 1) : 0);
  };
  
  // Jump to today
  const handleJumpToToday = () => {
    const todayIndex = classDays.findIndex(day => day.displayName === 'Today');
    if (todayIndex !== -1) {
      setAnimationDirection(currentIndex !== null && currentIndex > todayIndex ? -1 : 1);
      setCurrentIndex(todayIndex);
    } else {
      // If "Today" is not in the current range, reset to today
      navigateRelative(0);
    }
  };

  // Add a new function to find the next day with classes
  const findNextDayWithClasses = () => {
    if (currentIndex === null) return null;
    
    // Start searching from the day after current
    for (let i = currentIndex + 1; i < classDays.length; i++) {
      if (classDays[i].subjects.length > 0) {
        return i;
      }
    }
    
    // If no day found after current, search from beginning
    for (let i = 0; i < currentIndex; i++) {
      if (classDays[i].subjects.length > 0) {
        return i;
      }
    }
    
    // No day with classes found
    return null;
  };

  // Add a function to handle navigation to the next class
  const handleGoToNextClass = () => {
    const nextClassIndex = findNextDayWithClasses();
    if (nextClassIndex !== null) {
      setAnimationDirection(1); // Always animate forward
      setCurrentIndex(nextClassIndex);
    }
  };

  return (
    <div className="relative w-full pb-2 sm:pb-10 px-2 sm:px-4 mt-2">
      <div className="flex justify-center items-center relative">
        <div className="max-w-6xl mx-auto w-full relative"
             onTouchStart={onTouchStart}
             onTouchMove={onTouchMove}
             onTouchEnd={onTouchEnd}>
          {/* Day cards */}
          <AnimatePresence mode="wait" custom={animationDirection}>
            <div 
              key={`days-${currentIndex}`}
              className="flex justify-center items-stretch space-x-4 relative py-2 sm:py-4"
            >
              {visibleDays.map((day, index) => {
                const isCenter = index === 1;
                const isToday = day.displayName === 'Today';
                
                // Debug the day data to ensure correct display
                console.log(`Rendering day card: ${day.displayName} (${day.actualDate})`, {
                  date: day.date,
                  dayName: day.dayName,
                  subjectsCount: day.subjects.length,
                  actualDate: day.actualDate
                });
                
                // Hide side cards on mobile devices
                if (!isCenter && typeof window !== 'undefined' && window.innerWidth < 768) {
                  return null;
                }
                
                return (
                  <motion.div
                    key={`${day.displayName}-${day.actualDate}-${index}`}
                    className={`relative rounded-xl p-3 sm:p-6 
                      ${isCenter ? 'bg-[#f0f0f0]' : 'bg-[#f8f8f8]'} 
                      ${!isCenter ? 'cursor-pointer' : ''} 
                      overflow-hidden
                      ${isToday ? 'ring-2 ring-emerald-500' : ''}`}
                    onClick={() => {
                      if (!isCenter) {
                        index === 0 ? handlePrevious() : handleNext();
                      }
                    }}
                    style={{
                      width: isCenter ? 
                        (typeof window !== 'undefined' && window.innerWidth < 640 ? '100%' : 'calc(100% - 24px)') : 
                        '340px',
                      minWidth: isCenter ? 
                        (typeof window !== 'undefined' && window.innerWidth < 640 ? '100%' : '480px') : 
                        '340px',
                      height: isCenter ? 
                        (typeof window !== 'undefined' && window.innerWidth < 640 ? '480px' : '650px') : 
                        (typeof window !== 'undefined' && window.innerWidth < 640 ? '450px' : '580px'),
                      maxHeight: isCenter ? 
                        (typeof window !== 'undefined' && window.innerWidth < 640 ? '480px' : '650px') : 
                        (typeof window !== 'undefined' && window.innerWidth < 640 ? '450px' : '580px'),
                      opacity: isCenter ? 1 : 0.6,
                      zIndex: isCenter ? 10 : 1,
                      display: 'flex',
                      flexDirection: 'column'
                    }}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{
                      opacity: 1,
                      scale: isCenter ? 1 : 0.85,
                      y: isCenter ? 0 : 10
                    }}
                    exit={{ 
                      opacity: 0,
                      y: 10,
                      transition: { duration: 0.2 }
                    }}
                    transition={{ 
                      duration: 0.5, 
                      ease: "easeOut",
                      delay: index * 0.08
                    }}
                  >
                    <div className="flex justify-between items-center">
                      <h2 className="text-xl sm:text-2xl font-medium mb-1">
                        {day.displayName}
                      </h2>
                    </div>
                    <p className="text-xs sm:text-sm text-gray-500 mb-1 sm:mb-2">
                      {day.dayName}, {day.date}
                    </p>
                    
                    {day.subjects.length > 0 ? (
                      <div 
                        className="mt-2 sm:mt-3 overflow-y-auto scrollbar-hide pr-2 flex-1"
                        style={{ 
                          height: '100%',
                          WebkitOverflowScrolling: 'touch',
                          overscrollBehavior: 'contain'
                        }}
                      >
                        <motion.div
                          initial="hidden"
                          animate="visible"
                          variants={{
                            hidden: { opacity: 0 },
                            visible: {
                              opacity: 1,
                              transition: {
                                staggerChildren: 0.1,
                                delayChildren: 0.2
                              }
                            }
                          }}
                          className="pb-4"
                      >
                        {day.subjects.map((subject, i) => (
                            <motion.div 
                              key={i} 
                              className="mb-4 sm:mb-6"
                              variants={{
                                hidden: { opacity: 0, y: 10 },
                                visible: { 
                                  opacity: 1, 
                                  y: 0,
                                  transition: {
                                    duration: 0.3,
                                    ease: "easeOut"
                                  }
                                }
                              }}
                            >
                              <SubjectPill 
                                name={subject.name} 
                                color={subject.color} 
                                size={typeof window !== 'undefined' && window.innerWidth < 640 ? 'small' : 'normal'} 
                              />
                              <div className="mt-0 sm:mt-1 space-y-1">
                                {/* Classes List - Group by sub-subject name */}
                                {subject.classes && subject.classes.length > 0 ? (
                                  <div className="mt-2 space-y-2">
                                    {/* Group classes by sub-subject name first */}
                                    {Object.entries(
                                      subject.classes.reduce((acc, cls) => {
                                        // Debug subjectId values to identify issues
                                        if (subject.name === 'História' || subject.name === 'Historia') {
                                          console.log(`História sub-subject: ${cls.subSubjectName}, id: ${cls.subSubjectId}, type: ${typeof cls.subSubjectId}`);
                                        }
                                        
                                        // Create group by subSubjectName
                                        if (!acc[cls.subSubjectName]) {
                                          acc[cls.subSubjectName] = {
                                            id: cls.subSubjectId, // Store the subSubjectId for sorting
                                            classes: []
                                          };
                                        } else if (acc[cls.subSubjectName].id === undefined && cls.subSubjectId !== undefined) {
                                          // Update ID if it was undefined before but is defined now
                                          acc[cls.subSubjectName].id = cls.subSubjectId;
                                        }
                                        acc[cls.subSubjectName].classes.push(cls);
                                        return acc;
                                      }, {} as Record<string, { id: number, classes: ClassInfo[] }>)
                                    )
                                    // Sort sub-subjects by their ID (lower number first)
                                    .sort((a, b) => {
                                      // Ensure the IDs are numbers before comparison
                                      const aId = typeof a[1].id === 'number' ? a[1].id : 
                                                 (a[1].id === undefined ? 9999 : parseInt(String(a[1].id)) || 9999);
                                      const bId = typeof b[1].id === 'number' ? b[1].id : 
                                                 (b[1].id === undefined ? 9999 : parseInt(String(b[1].id)) || 9999);
                                                 
                                      // Debug for História subject
                                      if ((a[0].includes('Histór') || b[0].includes('Histór')) && subject.name.includes('Histór')) {
                                        console.log(`Comparing: ${a[0]} (${aId}) vs ${b[0]} (${bId})`);
                                      }
                                      
                                      return aId - bId;
                                    })
                                    .map(([subSubjectName, { classes }], ssIndex) => (
                                      <div 
                                        key={`subsubject-${ssIndex}`}
                                        className="bg-white/50 p-2 rounded-md"
                                      >
                                        <h4 className="text-xs font-medium text-gray-700 mb-2 pl-1 border-l-2" 
                                            style={{ borderColor: subject.color }}>
                                          {subSubjectName}
                                        </h4>
                                        <div className="space-y-2">
                                          {/* Sort classes by order before rendering */}
                                          {[...classes].sort((a, b) => {
                                            // Ensure we're comparing numbers
                                            const aOrder = typeof a.order === 'number' ? a.order : parseInt(String(a.order)) || 0;
                                            const bOrder = typeof b.order === 'number' ? b.order : parseInt(String(b.order)) || 0;
                                            return aOrder - bOrder;
                                          }).map((cls, clsIndex) => (
                                            <motion.div
                                              key={`class-${cls.id}-${clsIndex}`}
                                              className="bg-white border border-gray-200 rounded-md px-3 py-2 hover:bg-gray-50 transition-colors"
                                              variants={{
                                                hidden: { opacity: 0, y: 5 },
                                                visible: { 
                                                  opacity: 1, 
                                                  y: 0,
                                                  transition: {
                                                    duration: 0.2,
                                                    delay: 0.05 * clsIndex
                                                  }
                                                }
                                              }}
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                // Navigate to the dynamic class page with the class ID
                                                router.push(`/learn/${cls.id}`);
                                              }}
                                              style={{ cursor: 'pointer' }}
                                            >
                                              <div className="flex items-center">
                                                <span className="text-xs sm:text-sm text-gray-500 min-w-5">{cls.order}.</span>
                                                <p className="text-xs text-gray-800 font-normal flex-1">
                                                  {cls.name || `Class ${cls.id}`}
                                                </p>
                                                <span className="text-xs sm:text-sm text-gray-500 ml-1.5">
                                                  {Math.floor(cls.duration / 60)}m
                                                </span>
                                                {cls.link && cls.link.trim() !== '' && (
                                                  <svg 
                                                    xmlns="http://www.w3.org/2000/svg" 
                                                    className="h-3.5 w-3.5 text-blue-500 ml-1.5"
                                                    fill="none" 
                                                    viewBox="0 0 24 24" 
                                                    stroke="currentColor"
                                                  >
                                                    <path 
                                                      strokeLinecap="round" 
                                                      strokeLinejoin="round" 
                                                      strokeWidth={2} 
                                                      d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" 
                                                    />
                                                  </svg>
                                                )}
                                </div>
                                            </motion.div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                                  <div className="mt-3 p-2 bg-gray-50 rounded">
                                    <p className="text-xs text-gray-500 italic">No class details available</p>
                                  </div>
                                )}
                              </div>
                            </motion.div>
                          ))}
                          
                          {/* Small end indicator */}
                          <div className="w-full flex justify-center mt-2 opacity-30">
                            <div className="h-px w-10 bg-gray-300"></div>
                          </div>
                        </motion.div>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center h-48 sm:h-64 gap-4">
                        <div className="flex items-center gap-3 p-3 sm:p-4 rounded-lg bg-gray-50 border border-gray-100">
                          <CalendarClock className="text-gray-400" size={18} />
                          <span className="text-gray-600 font-medium text-xs">No scheduled classes</span>
                        </div>
                        
                        {isCenter && findNextDayWithClasses() !== null && (
                          <button 
                            onClick={(e) => {
                              e.stopPropagation(); // Prevent card expansion trigger
                              handleGoToNextClass();
                            }}
                            className="inline-flex bg-gradient-to-r from-emerald-500 to-green-500 text-white font-medium py-2 sm:py-2.5 px-4 sm:px-5 rounded-full items-center justify-center gap-2 transition-all shadow-sm text-xs sm:text-sm hover:shadow-lg duration-300"
                          >
                            Go to next planned class
                            <ArrowRight size={14} className="sm:hidden" />
                            <ArrowRight size={16} className="hidden sm:inline" />
                          </button>
                        )}
                      </div>
                    )}
                    
                    {!isCenter && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/5 opacity-0 hover:opacity-100 transition-opacity">
                        <div className="bg-white/80 backdrop-blur-sm px-4 py-2 rounded-lg shadow-sm text-gray-700 font-medium">
                          {index === 0 ? 'Previous Day' : 'Next Day'}
                        </div>
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </div>
          </AnimatePresence>
        </div>
      </div>
      
      {/* CSS for hiding scrollbars and gradient border */}
      <style jsx global>{`
        .scrollbar-hide {
          -ms-overflow-style: none;  /* IE and Edge */
          scrollbar-width: none;  /* Firefox */
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none;  /* Chrome, Safari and Opera */
        }
        
        /* Fix for ensuring scrollable content is fully accessible */
        .overflow-y-auto {
          overscroll-behavior: contain;
          -webkit-overflow-scrolling: touch;
        }
        
        /* Ensure proper flex layout */
        .flex-1 {
          flex: 1 1 auto;
          min-height: 0; /* Important for nested flex scrolling */
        }
      `}</style>
    </div>
  );
} 