"use client";

import { useState, useRef } from 'react';
import { motion } from 'framer-motion';

export default function AnimatedSearch() {
  const [isExpanded, setIsExpanded] = useState(false);
  const [searchText, setSearchText] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const handleToggle = () => {
    setIsExpanded(!isExpanded);
    if (!isExpanded && inputRef.current) {
      // Focus on next render cycle
      setTimeout(() => inputRef.current?.focus(), 10);
    }
  };

  return (
    <div className="relative flex justify-center w-full max-w-md mx-auto">
      <motion.div 
        className="relative w-full flex items-center"
        animate={{ width: isExpanded ? '100%' : '40px' }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
      >
        {isExpanded ? (
          <div className="relative w-full">
            <input
              ref={inputRef}
              type="text"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              placeholder="Search"
              className="w-full h-10 pl-10 pr-4 text-sm rounded-md bg-[#dddddd] border-none focus:outline-none"
            />
            <div 
              className="absolute inset-y-0 left-0 flex items-center pl-3 cursor-pointer"
              onClick={handleToggle}
            >
              <svg className="w-4 h-4 text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>
        ) : (
          <button
            onClick={handleToggle}
            className="flex items-center justify-center w-10 h-10 rounded-md bg-[#dddddd]"
          >
            <svg className="w-5 h-5 text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </button>
        )}
      </motion.div>
    </div>
  );
} 