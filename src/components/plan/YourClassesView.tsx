"use client";

import { useState, useRef, useEffect } from 'react';
import SubjectPill from './SubjectPill';
import { motion, AnimatePresence } from 'framer-motion';
import { useClassSchedule } from '../../lib/hooks/useClassSchedule';
import { CalendarClock, ArrowRight, ChevronDown, ChevronUp } from 'lucide-react';

export default function YourClassesView() {
  const { classDays, loading, error, currentDate, navigateRelative } = useClassSchedule();
  const [currentIndex, setCurrentIndex] = useState<number | null>(null); // Start with null instead of 15
  const [expandedCard, setExpandedCard] = useState<number | null>(null);
  const [animationDirection, setAnimationDirection] = useState(0); // -1 for left, 1 for right, 0 for initial
  const expandedCardRef = useRef<HTMLDivElement>(null);
  const [initialRenderComplete, setInitialRenderComplete] = useState(false);
  
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
  
  // Show loading state if data is loading or index not determined yet
  if (loading || currentIndex === null || !initialRenderComplete) {
    return (
      <div className="relative w-full pb-10 px-4 mt-2">
        <div className="flex justify-center items-center h-[480px]">
          {/* Blank loading state - no indicator */}
        </div>
      </div>
    );
  }
  
  // Show error state if there's an error
  if (error) {
    return (
      <div className="relative w-full pb-10 px-4 mt-2">
        <div className="flex justify-center items-center h-[480px]">
          <div className="text-red-500">{error}</div>
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
    if (subjects.length === 0) return isCenter ? '400px' : '360px'; // Empty state
    if (subjects.length <= 2) return isCenter ? '460px' : '420px'; // Few subjects
    if (subjects.length <= 4) return isCenter ? '520px' : '480px'; // Medium subjects
    return 'auto'; // Allow the card to expand based on content
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
                      height: typeof window !== 'undefined' && window.innerWidth < 640 
                        ? (day.subjects.length === 0 ? '300px' : day.subjects.length <= 2 ? '350px' : '400px')
                        : (isExpanded ? 'auto' : dynamicHeight),
                      maxHeight: isExpanded ? 'calc(100vh - 100px)' : undefined,
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
                                {subject.timeRanges.map((timeRange, timeIndex) => (
                                  <motion.div 
                                    key={timeIndex} 
                                    className="bg-gray-100 rounded px-2 sm:px-3 py-1 sm:py-1.5 block w-full"
                                    variants={{
                                      hidden: { opacity: 0, x: -5 },
                                      visible: { 
                                        opacity: 1, 
                                        x: 0,
                                        transition: {
                                          duration: 0.2,
                                          delay: 0.1 * timeIndex
                                        }
                                      }
                                    }}
                                  >
                                    <p className="text-xs sm:text-sm text-gray-500">{timeRange}</p>
                                  </motion.div>
                                ))}
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
                            e.stopPropagation(); // Prevent other click handlers
                            toggleCardExpansion(index);
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