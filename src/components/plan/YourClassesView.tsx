"use client";

import { useState, useRef, useEffect } from 'react';
import SubjectPill from './SubjectPill';
import { motion, AnimatePresence } from 'framer-motion';
import { useClassSchedule } from '../../lib/hooks/useClassSchedule';
import { CalendarClock, ArrowRight, ChevronDown, ChevronUp } from 'lucide-react';
import { MinusIcon, PlusIcon } from 'lucide-react';

export default function YourClassesView() {
  const { classDays, loading, error, currentDate, navigateRelative } = useClassSchedule();
  const [currentIndex, setCurrentIndex] = useState<number | null>(null); // Start with null instead of 15
  const [expandedCard, setExpandedCard] = useState<number | null>(null);
  const [animationDirection, setAnimationDirection] = useState(0); // -1 for left, 1 for right, 0 for initial
  const expandedCardRef = useRef<HTMLDivElement>(null);
  const [initialRenderComplete, setInitialRenderComplete] = useState(false);
  const [forceExitLoading, setForceExitLoading] = useState(false);
  
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
    setExpandedCard(null);
    setCurrentIndex(prev => prev !== null ? Math.max(0, prev - 1) : 0);
  };
  
  const handleNext = () => {
    // If we're near the end of our data, fetch more
    if (currentIndex !== null && currentIndex > classDays.length - 4) {
      navigateRelative(10); // Move 10 days forward
      return;
    }
    
    setAnimationDirection(1);
    setExpandedCard(null);
    setCurrentIndex(prev => prev !== null ? Math.min(classDays.length - 1, prev + 1) : 0);
  };
  
  // Jump to today
  const handleJumpToToday = () => {
    const todayIndex = classDays.findIndex(day => day.displayName === 'Today');
    if (todayIndex !== -1) {
      setAnimationDirection(currentIndex !== null && currentIndex > todayIndex ? -1 : 1);
      setExpandedCard(null);
      setCurrentIndex(todayIndex);
    } else {
      // If "Today" is not in the current range, reset to today
      navigateRelative(0);
    }
  };

  const toggleCardExpansion = (index: number) => {
    setExpandedCard(expandedCard === index ? null : index);
  };

  // Calculate dynamic card height based on content
  const getCardHeight = (subjects: any[], isCenter: boolean) => {
    // Count total classes across all subjects
    const totalClasses = subjects.reduce((count, subject) => 
      count + (subject.classes?.length || 0), 0);
    
    if (subjects.length === 0) return isCenter ? '400px' : '360px'; // Empty state
    if (subjects.length <= 2 && totalClasses <= 4) return isCenter ? '460px' : '420px'; // Few subjects with few classes
    if (subjects.length <= 4 && totalClasses <= 8) return isCenter ? '520px' : '480px'; // Medium subjects with medium classes
    return isCenter ? '600px' : '560px'; // Many subjects or many classes
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
      setExpandedCard(null);
      setCurrentIndex(nextClassIndex);
    }
  };

  return (
    <div className="relative w-full pb-10 px-2 sm:px-4 mt-2">
      <div className="flex justify-center items-center relative">
        <div className="max-w-6xl mx-auto w-full relative">
          {/* Day cards */}
          <AnimatePresence mode="wait" custom={animationDirection}>
            <div 
              key={`days-${currentIndex}`}
              className="flex justify-center items-stretch space-x-4 relative py-2 sm:py-4"
            >
              {visibleDays.map((day, index) => {
                const isCenter = index === 1;
                const hasMultipleSubjects = day.subjects.length > 3;
                const isExpanded = expandedCard === index;
                const dynamicHeight = getCardHeight(day.subjects, isCenter);
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
                      ${isCenter && hasMultipleSubjects ? (isExpanded ? 'cursor-auto' : 'cursor-pointer') : 'cursor-pointer'} 
                      overflow-hidden
                      ${isToday ? 'ring-2 ring-emerald-500' : ''}`}
                    ref={isExpanded ? expandedCardRef : null}
                    onClick={() => {
                      if (isCenter && hasMultipleSubjects) {
                        toggleCardExpansion(index);
                      } else if (!isCenter) {
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
                      height: isExpanded ? 'auto' : (
                        typeof window !== 'undefined' && window.innerWidth < 640 
                          ? (day.subjects.length === 0 ? '300px' : day.subjects.length <= 2 ? '350px' : '400px')
                          : dynamicHeight
                      ),
                      maxHeight: isExpanded ? '80vh' : undefined,
                      opacity: isCenter ? 1 : 0.6,
                      zIndex: isCenter ? 10 : 1,
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
                    <p className="text-xs sm:text-sm text-gray-500 mb-2 sm:mb-4">
                      {day.dayName}, {day.date}
                    </p>
                    
                    {day.subjects.length > 0 ? (
                      <div 
                        className={`mt-4 sm:mt-6 pb-16 sm:pb-20 ${
                          isExpanded ? 'overflow-y-auto scrollbar-hide pr-2' : 'overflow-y-auto scrollbar-hide pr-2'
                        }`}
                        style={{ 
                          maxHeight: isExpanded ? 
                            (typeof window !== 'undefined' && window.innerWidth < 768 ? 'calc(100vh - 200px)' : 'calc(100vh - 240px)') : 
                            (typeof window !== 'undefined' && window.innerWidth < 768 ? '250px' : '300px'),
                          maskImage: !isExpanded && hasMultipleSubjects && isCenter ? 'linear-gradient(to bottom, rgba(0,0,0,1) 90%, rgba(0,0,0,0))' : 'none',
                          WebkitMaskImage: !isExpanded && hasMultipleSubjects && isCenter ? 'linear-gradient(to bottom, rgba(0,0,0,1) 90%, rgba(0,0,0,0))' : 'none'
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
                              <div className="mt-1 sm:mt-2 space-y-1">
                                {/* Classes List - Group by sub-subject name */}
                                {subject.classes && subject.classes.length > 0 ? (
                                  <div className="mt-3 space-y-3">
                                    {/* Group classes by sub-subject name first */}
                                    {Object.entries(
                                      subject.classes.reduce((acc, cls) => {
                                        // Create group by subSubjectName
                                        if (!acc[cls.subSubjectName]) {
                                          acc[cls.subSubjectName] = [];
                                        }
                                        acc[cls.subSubjectName].push(cls);
                                        return acc;
                                      }, {} as Record<string, typeof subject.classes>)
                                    ).map(([subSubjectName, classes], ssIndex) => (
                                      <div 
                                        key={`subsubject-${ssIndex}`}
                                        className="bg-white/50 p-2 rounded-md"
                                      >
                                        <h4 className="text-xs font-medium text-gray-700 mb-2 pl-1 border-l-2 border-gray-300">
                                          {subSubjectName}
                                        </h4>
                                        <div className="space-y-2">
                                          {classes.map((cls, clsIndex) => (
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
                                                if (cls.link && cls.link.trim() !== '') {
                                                  window.open(cls.link, '_blank', 'noopener,noreferrer');
                                                }
                                              }}
                                              style={{ cursor: cls.link && cls.link.trim() !== '' ? 'pointer' : 'default' }}
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
                    
                    {/* Expand/collapse button for cards with multiple subjects */}
                    {hasMultipleSubjects && isCenter && (
                      <div className="absolute bottom-6 sm:bottom-10 left-0 right-0 flex justify-center">
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            setExpandedCard(isExpanded ? null : index);
                          }}
                          className="flex items-center gap-1.5 backdrop-blur-sm bg-white/80 px-3 py-1.5 rounded-full shadow-sm transition-all hover:shadow-md text-xs"
                        >
                          <span>{isExpanded ? "Collapse" : "Expand"}</span>
                          {isExpanded ? 
                            <ChevronUp className="h-3.5 w-3.5 text-gray-500" /> : 
                            <ChevronDown className="h-3.5 w-3.5 text-gray-500" />
                          }
                        </button>
                      </div>
                    )}
                    
                    {!isCenter && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/5 opacity-0 hover:opacity-100 transition-opacity">
                        <div className="bg-white/80 backdrop-blur-sm px-4 py-2 rounded-lg shadow-sm text-gray-700 font-medium">
                          {index === 0 ? 'Previous Day' : 'Next Day'}
                        </div>
                      </div>
                    )}

                    {day.subjects.length > 0 && isCenter && (
                      <button
                        className={`absolute transition-all duration-300 w-8 h-8 rounded-full text-white flex items-center justify-center z-20 ${
                          isExpanded ? 
                            'bottom-4 right-4 bg-rose-500 hover:bg-rose-600' : 
                            'top-4 right-4 bg-slate-600 hover:bg-slate-700'
                        }`}
                        onClick={(e) => {
                          e.stopPropagation();
                          setExpandedCard(isExpanded ? null : index);
                        }}
                      >
                        {isExpanded ? (
                          <MinusIcon className="w-5 h-5" />
                        ) : (
                          <PlusIcon className="w-5 h-5" />
                        )}
                      </button>
                    )}
                  </motion.div>
                );
              })}
            </div>
          </AnimatePresence>
          
          {/* Mobile navigation buttons */}
          <div className="md:hidden flex justify-between items-center mt-4 px-2">
            <button 
              onClick={handlePrevious}
              className="bg-gray-100 hover:bg-gray-200 rounded-full p-2 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            
            <button 
              onClick={handleJumpToToday}
              className="bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-medium py-1.5 px-3 rounded-full"
            >
              Today
            </button>
            
            <button 
              onClick={handleNext}
              className="bg-gray-100 hover:bg-gray-200 rounded-full p-2 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
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
      `}</style>
    </div>
  );
} 