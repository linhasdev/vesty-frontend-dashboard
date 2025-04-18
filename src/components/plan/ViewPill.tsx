"use client";

import { motion, AnimatePresence } from 'framer-motion';

interface ViewPillProps {
  currentView: string;
  views: string[];
  onChangeView: (view: string) => void;
}

export default function ViewPill({ currentView, views, onChangeView }: ViewPillProps) {
  const currentIndex = views.indexOf(currentView);
  
  const handlePrevious = () => {
    const newIndex = (currentIndex - 1 + views.length) % views.length;
    onChangeView(views[newIndex]);
  };
  
  const handleNext = () => {
    const newIndex = (currentIndex + 1) % views.length;
    onChangeView(views[newIndex]);
  };
  
  return (
    <motion.div 
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="flex justify-center mb-4 mt-4 sm:mt-8"
    >
      <div className="flex items-center bg-[#f0f0f0] px-1 py-1 rounded-full w-[90%] max-w-xs sm:w-80">
        <button 
          onClick={handlePrevious}
          className="p-1.5 sm:p-2 text-gray-500 hover:text-gray-700"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 sm:h-5 sm:w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        
        <div className="relative flex-1 overflow-hidden h-7 sm:h-8">
          <AnimatePresence mode="wait">
            <motion.div 
              key={currentView}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="px-3 sm:px-6 py-1 text-center font-normal truncate absolute inset-0 flex items-center justify-center text-sm sm:text-base"
            >
              {currentView}
            </motion.div>
          </AnimatePresence>
        </div>
        
        <button 
          onClick={handleNext}
          className="p-1.5 sm:p-2 text-gray-500 hover:text-gray-700"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 sm:h-5 sm:w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </motion.div>
  );
} 