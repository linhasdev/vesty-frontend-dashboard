"use client";

import { useState, useRef } from 'react';
import SubjectPill from './SubjectPill';
import { motion, AnimatePresence } from 'framer-motion';

interface ClassDay {
  date: string;
  dayName: string;
  displayName: string;
  subjects: {
    name: string;
    color: string;
    timeRanges: string[];  // Changed to array for multiple time ranges
  }[];
}

interface YourClassesViewProps {
  data: ClassDay[];
}

export default function YourClassesView({ data }: YourClassesViewProps) {
  const [currentIndex, setCurrentIndex] = useState(1); // Start with "Today"
  const [expandedCard, setExpandedCard] = useState<number | null>(null);
  const [animationDirection, setAnimationDirection] = useState(0); // -1 for left, 1 for right, 0 for initial
  const expandedCardRef = useRef<HTMLDivElement>(null);
  
  const visibleDays = [
    data[(currentIndex - 1 + data.length) % data.length], // Yesterday
    data[currentIndex], // Today
    data[(currentIndex + 1) % data.length], // Tomorrow
  ];
  
  const handlePrevious = () => {
    setAnimationDirection(-1);
    setExpandedCard(null);
    setCurrentIndex((prev) => (prev - 1 + data.length) % data.length);
  };
  
  const handleNext = () => {
    setAnimationDirection(1);
    setExpandedCard(null);
    setCurrentIndex((prev) => (prev + 1) % data.length);
  };

  const toggleCardExpansion = (index: number) => {
    setExpandedCard(expandedCard === index ? null : index);
  };

  // Calculate dynamic card height based on content
  const getCardHeight = (subjects: any[], isCenter: boolean) => {
    if (subjects.length === 0) return isCenter ? '400px' : '360px'; // Empty state
    if (subjects.length <= 2) return isCenter ? '460px' : '420px'; // Few subjects
    if (subjects.length <= 4) return isCenter ? '520px' : '480px'; // Medium subjects
    return isCenter ? '580px' : '540px'; // Many subjects
  };

  return (
    <div className="relative w-full pb-10 px-4 mt-6">
      <div className="flex justify-center items-center relative">
        <div className="max-w-6xl mx-auto w-full relative">
          {/* Day cards */}
          <AnimatePresence mode="wait" custom={animationDirection}>
            <div 
              key={currentIndex}
              className="flex justify-center items-stretch space-x-4 relative py-4"
            >
              {visibleDays.map((day, index) => {
                const isCenter = index === 1;
                const hasMultipleSubjects = day.subjects.length > 3;
                const isExpanded = expandedCard === index;
                const dynamicHeight = getCardHeight(day.subjects, isCenter);
                
                return (
                  <motion.div
                    key={`${day.displayName}-${index}`}
                    className={`relative rounded-xl p-6 ${isCenter ? 'bg-[#f0f0f0]' : 'bg-[#f8f8f8]'} 
                      ${isCenter && hasMultipleSubjects ? (isExpanded ? 'cursor-auto' : 'cursor-pointer') : 'cursor-pointer'} 
                      overflow-hidden`}
                    ref={isExpanded ? expandedCardRef : null}
                    onClick={() => {
                      if (isCenter && hasMultipleSubjects) {
                        toggleCardExpansion(index);
                      } else if (!isCenter) {
                        index === 0 ? handlePrevious() : handleNext();
                      }
                    }}
                    style={{
                      width: isCenter ? 'calc(100% - 24px)' : '340px',
                      minWidth: isCenter ? '480px' : '340px',
                      height: dynamicHeight,
                      opacity: isCenter ? 1 : 0.6,
                      zIndex: isCenter ? 10 : 1,
                    }}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{
                      opacity: 1,
                      scale: isCenter ? 1 : 0.85,
                      y: isCenter ? 0 : 10
                    }}
                    transition={{ 
                      duration: 0.6, 
                      ease: [0.25, 0.1, 0.25, 1],
                      delay: index * 0.1
                    }}
                  >
                    <h2 className="text-2xl font-medium mb-1">{day.displayName}</h2>
                    <p className="text-sm text-gray-500 mb-4">
                      {day.dayName}, {day.date}
                    </p>
                    
                    {day.subjects.length > 0 ? (
                      <div 
                        className={`mt-6 pb-20 ${
                          isExpanded ? 'overflow-y-auto scrollbar-hide pr-2' : 'overflow-hidden'
                        }`}
                        style={{ 
                          maxHeight: isExpanded ? '400px' : '300px',
                          maskImage: !isExpanded && hasMultipleSubjects && isCenter ? 'linear-gradient(to bottom, rgba(0,0,0,1) 90%, rgba(0,0,0,0))' : 'none',
                          WebkitMaskImage: !isExpanded && hasMultipleSubjects && isCenter ? 'linear-gradient(to bottom, rgba(0,0,0,1) 90%, rgba(0,0,0,0))' : 'none'
                        }}
                      >
                        {day.subjects.map((subject, i) => (
                          <div key={i} className="mb-6">
                            <SubjectPill name={subject.name} color={subject.color} size="normal" />
                            <div className="mt-2 space-y-1">
                              {subject.timeRanges.map((timeRange, timeIndex) => (
                                <div key={timeIndex} className="bg-gray-100 rounded px-3 py-1.5 block w-full">
                                  <p className="text-sm text-gray-500">{timeRange}</p>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="flex items-center justify-center h-64">
                        <p className="text-gray-400">No classes scheduled</p>
                      </div>
                    )}
                    
                    {hasMultipleSubjects && isCenter && !isExpanded && (
                      <div className="absolute bottom-10 left-0 right-0 flex justify-center">
                        <div className="flex flex-col items-center">
                          <div className="text-xs text-gray-500 mb-1">More subjects</div>
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400 animate-bounce" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </div>
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
      
      {/* CSS for hiding scrollbars */}
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