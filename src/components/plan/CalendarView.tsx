"use client";

import { useState, useEffect } from 'react';
import SubjectPill from './SubjectPill';
import { motion, AnimatePresence } from 'framer-motion';
import { useStudySessions, StudySession } from '../../lib/hooks/useStudySessions';

interface CalendarDay {
  date: Date;
  isCurrentMonth: boolean;
  isToday: boolean;
  subjects: StudySession[];
}

export default function CalendarView() {
  const { sessions, loading, error } = useStudySessions();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [calendarDays, setCalendarDays] = useState<CalendarDay[]>([]);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  
  // Get current month and year
  const currentMonth = currentDate.toLocaleString('default', { month: 'long' });
  const currentYear = currentDate.getFullYear();
  
  // Handle navigation between months
  const handlePreviousMonth = () => {
    setCurrentDate(prevDate => {
      const newDate = new Date(prevDate);
      newDate.setMonth(newDate.getMonth() - 1);
      return newDate;
    });
  };
  
  const handleNextMonth = () => {
    setCurrentDate(prevDate => {
      const newDate = new Date(prevDate);
      newDate.setMonth(newDate.getMonth() + 1);
      return newDate;
    });
  };
  
  const handleGoToToday = () => {
    setCurrentDate(new Date());
  };

  // Initialize calendar and handle loading state
  useEffect(() => {
    // Set initial loading to false after a short delay
    // This prevents the loading state from flickering if data loads quickly
    const timer = setTimeout(() => {
      setIsInitialLoading(false);
    }, 300);
    
    return () => clearTimeout(timer);
  }, []);

  // Generate calendar days for the current month
  useEffect(() => {
    // Get the first day of the month
    const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    
    // Get the last day of the month
    const lastDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
    
    // Get the day of the week of the first day (0 = Sunday, 6 = Saturday)
    const firstDayOfWeek = firstDayOfMonth.getDay();
    
    // Calculate days from previous month to show
    const daysFromPrevMonth = firstDayOfWeek;
    
    // Calculate total number of rows needed
    const totalDays = daysFromPrevMonth + lastDayOfMonth.getDate();
    const rowsNeeded = Math.ceil(totalDays / 7);
    
    // Calculate total days to show (35 for 5 rows or 42 for 6 rows)
    const totalDaysToShow = rowsNeeded * 7;
    
    // Initialize array for all calendar days
    const days: CalendarDay[] = [];
    
    // Today's date for comparison
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Add days from previous month
    const prevMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 0);
    const prevMonthLastDay = prevMonth.getDate();
    
    for (let i = prevMonthLastDay - daysFromPrevMonth + 1; i <= prevMonthLastDay; i++) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, i);
      days.push({
        date,
        isCurrentMonth: false,
        isToday: date.getTime() === today.getTime(),
        subjects: filterSubjectsForDate(sessions, date)
      });
    }
    
    // Add days from current month
    for (let i = 1; i <= lastDayOfMonth.getDate(); i++) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), i);
      days.push({
        date,
        isCurrentMonth: true,
        isToday: date.getTime() === today.getTime(),
        subjects: filterSubjectsForDate(sessions, date)
      });
    }
    
    // Add days from next month to complete the grid
    const remainingDays = totalDaysToShow - days.length;
    for (let i = 1; i <= remainingDays; i++) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, i);
      days.push({
        date,
        isCurrentMonth: false,
        isToday: date.getTime() === today.getTime(),
        subjects: filterSubjectsForDate(sessions, date)
      });
    }
    
    setCalendarDays(days);
  }, [currentDate, sessions]);

  // Helper function to filter subjects for a specific date
  const filterSubjectsForDate = (allSubjects: StudySession[], date: Date) => {
    const dateString = date.toISOString().split('T')[0]; // YYYY-MM-DD format
    
    // First filter subjects for this date
    const subjectsForDate = allSubjects.filter(subject => {
      const subjectDate = new Date(subject.date).toISOString().split('T')[0];
      return subjectDate === dateString;
    });
    
    // Group subjects by name to avoid duplicates
    const groupedSubjects = subjectsForDate.reduce<Record<string, StudySession>>((acc, subject) => {
      // If this subject name hasn't been seen yet, add it
      if (!acc[subject.name]) {
        acc[subject.name] = subject;
      }
      return acc;
    }, {});
    
    // Convert grouped subjects back to array
    return Object.values(groupedSubjects);
  };

  // Determine how many pills to show based on number of subjects
  const getVisiblePillCount = (totalSubjects: number) => {
    if (totalSubjects <= 1) return totalSubjects;
    if (totalSubjects <= 4) return totalSubjects;
    return 4; // Maximum 4 pills to maintain clean layout
  };

  // Days of the week headers
  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="w-full mt-2">
      <div className="max-w-6xl mx-auto relative px-2">
        {/* Month heading with lateral arrows */}
        <div className="flex items-center mb-3 sm:mb-6 justify-between">
          <div className="flex items-center">
            <div className="flex">
              <button 
                onClick={handlePreviousMonth}
                className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors"
                aria-label="Previous month"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              
              <button 
                onClick={handleNextMonth}
                className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors ml-1"
                aria-label="Next month"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
            
            <div className="ml-3">
              <AnimatePresence mode="wait">
                <motion.h2
                  key={`${currentMonth}-${currentYear}`}
                  className="text-base font-medium"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.25 }}
                >
                  {currentMonth} {currentYear}
                </motion.h2>
              </AnimatePresence>
            </div>
          </div>
          
          <button 
            onClick={handleGoToToday}
            className="text-xs px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded-full transition-colors text-gray-700"
          >
            Today
          </button>
        </div>
        
        {/* Display loading state with smooth animation */}
        <AnimatePresence mode="wait">
          {loading && isInitialLoading ? (
            <motion.div 
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.7 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              {/* Calendar skeleton loader - more subtle design */}
              <div className="grid grid-cols-7 gap-0.5 sm:gap-1 mb-10">
                {/* Week day headers skeleton */}
                {weekDays.map((day) => (
                  <div key={day} className="text-center text-xs font-medium text-gray-300 py-1">
                    {day}
                  </div>
                ))}
                
                {/* Calendar days skeleton - render fewer items for performance */}
                {Array.from({ length: 28 }).map((_, i) => (
                  <div 
                    key={`skeleton-${i}`}
                    className="rounded-lg p-1.5 bg-gray-50 h-12 sm:h-16 md:h-28 flex flex-col opacity-50"
                  >
                    <div className="flex justify-end mb-1">
                      <div className="w-5 h-4 rounded-sm bg-gray-200"></div>
                    </div>
                    <div className="flex-1 flex flex-col">
                      <div className="w-1/3 h-3 mt-1 bg-gray-100 rounded"></div>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          ) : error ? (
            <motion.div 
              key="error"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="flex flex-col items-center justify-center p-10"
            >
              <div className="text-red-500">{error}</div>
            </motion.div>
          ) : (
            <motion.div
              key="calendar"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              {/* Week day headers */}
              <div className="grid grid-cols-7 gap-0.5 sm:gap-1 mb-3 sm:mb-10">
                {weekDays.map((day) => (
                  <div key={day} className="text-center text-[10px] sm:text-xs font-medium text-gray-500 py-0.5 sm:py-1">
                    {day.substring(0, 1)}
                    <span className="hidden sm:inline">{day.substring(1)}</span>
                  </div>
                ))}
                
                {/* Calendar days */}
                {calendarDays.map((day) => {
                  const hasSubjects = day.subjects.length > 0;
                  const visibleCount = getVisiblePillCount(day.subjects.length);
                  const hasMoreIndicator = day.subjects.length > visibleCount;
                  
                  return (
                    <div 
                      key={day.date.toISOString()}
                      className={`
                        rounded-lg p-0.5 sm:p-1 md:p-1.5
                        ${day.isCurrentMonth ? 'bg-[#f0f0f0]' : 'bg-[#f8f8f8] opacity-30'}
                        ${day.isToday ? 'ring-1 sm:ring-2 ring-accent-green' : ''}
                        ${hasSubjects && day.isCurrentMonth ? 'border-l-2 sm:border-l-3 border-accent-green' : ''}
                        flex flex-col h-12 sm:h-16 md:h-28
                      `}
                    >
                      <div className="flex justify-between items-start mb-0.5">
                        <div className="flex-1 flex flex-wrap gap-0.5 sm:gap-1 pr-1 max-w-[70%]">
                          {day.subjects.length > 0 && day.isCurrentMonth && (
                            <SubjectPill 
                              key={`${day.date.toISOString()}-subject-0`}
                              name={day.subjects[0].name} 
                              color={day.subjects[0].color} 
                              size={typeof window !== 'undefined' && window.innerWidth < 640 ? 'micro' : 'tiny'} 
                            />
                          )}
                        </div>
                        <span className={`text-[10px] sm:text-xs ${day.isCurrentMonth ? 'font-light' : 'text-gray-400 font-light'} ${day.isToday ? 'font-medium text-accent-green' : ''}`}>
                          {day.date.getDate()}
                        </span>
                      </div>
                      
                      {day.isToday && (
                        <div className="text-[8px] sm:text-[9px] font-medium text-accent-green bg-accent-green/10 px-1 py-0.5 rounded self-start mt-0.5 mb-1 hidden sm:block">Today</div>
                      )}
                      
                      <div className="flex-1 flex flex-col justify-start overflow-hidden">
                        {day.isCurrentMonth && (
                          <>
                            <div className="flex flex-wrap gap-1 hidden sm:flex">
                              {day.subjects.slice(1, visibleCount).map((subject, i) => (
                                <SubjectPill 
                                  key={`${day.date.toISOString()}-subject-${i+1}`}
                                  name={subject.name} 
                                  color={subject.color} 
                                  size="tiny" 
                                />
                              ))}
                            </div>
                            {hasMoreIndicator && (
                              <div className="text-[10px] text-gray-500 mt-0.5 hidden sm:block">+{day.subjects.length - visibleCount}</div>
                            )}
                            {/* Mobile indicator for multiple subjects */}
                            {hasSubjects && day.subjects.length > 1 && (
                              <div className="text-[8px] sm:text-[10px] text-gray-500 mt-0.5 sm:hidden">+{day.subjects.length - 1}</div>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
              
              {/* Mobile Month Swipe Instructions */}
              <div className="flex justify-center mt-2 mb-4 sm:hidden">
                <p className="text-xs text-gray-500 italic">Swipe left/right to change months</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
} 