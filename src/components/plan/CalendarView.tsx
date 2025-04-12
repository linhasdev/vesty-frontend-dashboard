"use client";

import { useState } from 'react';
import SubjectPill from './SubjectPill';
import { motion, AnimatePresence } from 'framer-motion';

interface CalendarDay {
  date: number;
  isCurrentMonth: boolean;
  subjects: {
    name: string;
    color: string;
  }[];
}

interface CalendarMonth {
  month: string;
  year: number;
  days: CalendarDay[];
}

interface CalendarViewProps {
  data: CalendarMonth[];
}

export default function CalendarView({ data }: CalendarViewProps) {
  const [currentMonthIndex, setCurrentMonthIndex] = useState(0);
  const currentMonth = data[currentMonthIndex];
  
  const handlePreviousMonth = () => {
    setCurrentMonthIndex((prev) => (prev - 1 + data.length) % data.length);
  };
  
  const handleNextMonth = () => {
    setCurrentMonthIndex((prev) => (prev + 1) % data.length);
  };

  // Days of the week headers
  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // Determine how many pills to show based on number of subjects
  const getVisiblePillCount = (totalSubjects: number) => {
    if (totalSubjects <= 1) return totalSubjects;
    if (totalSubjects <= 4) return totalSubjects;
    return 4; // Maximum 4 pills to maintain clean layout
  };

  return (
    <div className="w-full mt-6">
      <div className="max-w-6xl mx-auto relative px-2">
        {/* Month heading with lateral arrows - moved to left */}
        <div className="flex items-center mb-6 justify-start">
          <button 
            onClick={handlePreviousMonth}
            className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors mr-1"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          
          <AnimatePresence mode="wait">
            <motion.h2
              key={`${currentMonth.month}-${currentMonth.year}`}
              className="text-base font-medium"
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              transition={{ duration: 0.2 }}
            >
              {currentMonth.month} {currentMonth.year}
            </motion.h2>
          </AnimatePresence>
          
          <button 
            onClick={handleNextMonth}
            className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors ml-1"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
        
        {/* Calendar grid */}
        <div className="grid grid-cols-7 gap-1 mb-10">
          {/* Week day headers */}
          {weekDays.map((day) => (
            <div key={day} className="text-center text-xs font-medium text-gray-500 py-1">
              {day}
            </div>
          ))}
          
          {/* Calendar days */}
          <AnimatePresence>
            {currentMonth.days.map((day, index) => {
              const hasSubjects = day.subjects.length > 0;
              const visibleCount = getVisiblePillCount(day.subjects.length);
              const hasMoreIndicator = day.subjects.length > visibleCount;
              
              return (
                <motion.div 
                  key={`${currentMonth.month}-${index}`}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.2, delay: index * 0.005 }}
                  className={`
                    rounded-lg p-1.5
                    ${day.isCurrentMonth ? 'bg-[#f0f0f0]' : 'bg-[#f8f8f8] opacity-40'}
                    ${hasSubjects ? 'border-l-3 border-accent-green' : ''}
                    flex flex-col h-28
                  `}
                >
                  <div className="flex justify-between items-start mb-0.5">
                    <div className="flex-1 flex flex-wrap gap-1 pr-1 max-w-[70%]">
                      {day.subjects.length > 0 && (
                        <SubjectPill 
                          key={0} 
                          name={day.subjects[0].name} 
                          color={day.subjects[0].color} 
                          size="tiny" 
                        />
                      )}
                    </div>
                    <span className={`text-xs ${day.isCurrentMonth ? 'font-light' : 'text-gray-400 font-light'}`}>
                      {day.date}
                    </span>
                  </div>
                  
                  <div className="flex-1 flex flex-col justify-start overflow-hidden">
                    <div className="flex flex-wrap gap-1">
                      {day.subjects.slice(1, visibleCount).map((subject, i) => (
                        <SubjectPill 
                          key={i + 1} 
                          name={subject.name} 
                          color={subject.color} 
                          size="tiny" 
                        />
                      ))}
                    </div>
                    {hasMoreIndicator && (
                      <div className="text-[10px] text-gray-500 mt-0.5">+{day.subjects.length - visibleCount}</div>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
} 