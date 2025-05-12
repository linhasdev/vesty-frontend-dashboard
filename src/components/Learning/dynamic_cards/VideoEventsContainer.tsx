"use client";

import React, { useEffect, useRef } from 'react';
import { useVideoEvents, QuizPayload, InfoPayload } from '@/app/lib/hooks/useVideoEvents';
import QuizCard from './QuizCard';
import InfoCard from './InfoCard';

interface VideoEventsContainerProps {
  classId: string;
  videoElement: HTMLVideoElement | null;
}

export default function VideoEventsContainer({ classId, videoElement }: VideoEventsContainerProps) {
  const { activeEvent, loading, error, clearActiveEvent } = useVideoEvents(classId, videoElement);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Add debug logging
  useEffect(() => {
    console.log('VideoEventsContainer props:', { classId, videoElement: !!videoElement });
  }, [classId, videoElement]);
  
  useEffect(() => {
    console.log('VideoEventsContainer state:', { 
      activeEvent: activeEvent ? {
        type: activeEvent.eventGroup.event_type,
        timestamp: activeEvent.eventGroup.timestamp_ms,
        payload: activeEvent.variant.payload
      } : null,
      loading,
      error
    });
  }, [activeEvent, loading, error]);
  
  // Scroll into view when an event becomes active
  useEffect(() => {
    if (activeEvent && containerRef.current) {
      containerRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [activeEvent]);
  
  if (loading) {
    return (
      <div className="my-4 w-full flex justify-center overflow-hidden">
        <div className="flex items-center justify-center h-12">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-500"></div>
          <span className="ml-2 text-gray-600">Loading video events...</span>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="my-4 w-full overflow-hidden">
        <div className="p-4 bg-red-50 rounded-lg border border-red-200">
          <div className="flex items-start">
            <svg className="h-5 w-5 text-red-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
            <div className="ml-3 overflow-hidden">
              <h3 className="text-sm font-medium text-red-800">Error loading video events</h3>
              <p className="text-sm text-red-700 mt-1 truncate">{error}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  // Always render a container even when no active event
  return (
    <div 
      ref={containerRef}
      className="my-4 w-full transition-all duration-300 ease-in-out overflow-hidden"
      data-testid="video-events-container"
    >
      {!activeEvent && (
        <div className="h-8 flex items-center justify-center">
          <span className="text-xs text-gray-400">
            {videoElement ? "Watching for interactive content..." : "No video available for timeline events"}
          </span>
        </div>
      )}
      
      {activeEvent && activeEvent.eventGroup.event_type === 'quiz' && (
        <div className="flex justify-center overflow-hidden">
          <div className="w-full">
            <QuizCard 
              key={`quiz-${activeEvent.eventGroup.id}-${activeEvent.variant.variant_index}`}
              quiz={activeEvent.variant.payload as QuizPayload} 
              onClose={clearActiveEvent} 
            />
          </div>
        </div>
      )}
      
      {activeEvent && activeEvent.eventGroup.event_type === 'info' && (
        <div className="flex justify-center overflow-hidden">
          <div className="w-full">
            <InfoCard 
              key={`info-${activeEvent.eventGroup.id}-${activeEvent.variant.variant_index}`}
              info={activeEvent.variant.payload as InfoPayload} 
              onClose={clearActiveEvent} 
            />
          </div>
        </div>
      )}
    </div>
  );
} 