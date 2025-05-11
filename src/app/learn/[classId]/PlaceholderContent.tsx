"use client";

import React from 'react';

interface PlaceholderContentProps {
  title: string;
  subtitle?: string;
  color?: string;
}

export default function PlaceholderContent({ 
  title, 
  subtitle = "Placeholder content", 
  color = "bg-gray-50" 
}: PlaceholderContentProps) {
  return (
    <div className={`w-full h-full p-4 ${color}`}>
      <div className="border border-dashed border-gray-200 rounded-md p-4 h-full flex flex-col items-center justify-center bg-white/50 backdrop-filter backdrop-blur-sm">
        <h3 className="text-sm font-medium text-gray-700">{title}</h3>
        <p className="text-xs text-gray-500 mt-1">{subtitle}</p>
        
        <div className="mt-6 w-full max-w-xs">
          {/* Placeholder UI elements */}
          <div className="h-3 bg-gray-200 rounded-full w-full mb-2 animate-pulse"></div>
          <div className="h-3 bg-gray-200 rounded-full w-5/6 mb-2 animate-pulse"></div>
          <div className="h-3 bg-gray-200 rounded-full w-4/6 animate-pulse"></div>
          
          <div className="mt-8 flex justify-center">
            <div className="w-10 h-10 bg-gray-200 rounded-full animate-pulse"></div>
          </div>
        </div>
      </div>
    </div>
  );
} 