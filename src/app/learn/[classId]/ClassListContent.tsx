"use client";

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useClassSchedule, ClassInfo } from '@/lib/hooks/useClassSchedule';
import { subjectColorMap } from '@/lib/hooks/useStudySessions';

interface ClassListContentProps {
  currentClassId: string;
}

export default function ClassListContent({ currentClassId }: ClassListContentProps) {
  // Use the full date range (365 days instead of 31)
  const { classDays, loading, error, currentDate, navigateToDate, navigateRelative } = useClassSchedule();
  const [expandedDays, setExpandedDays] = useState<Record<string, boolean>>({});
  const [expandedSubjects, setExpandedSubjects] = useState<Record<string, boolean>>({});
  const [expandedSubSubjects, setExpandedSubSubjects] = useState<Record<string, boolean>>({});
  const [currentView, setCurrentView] = useState<'days' | 'subjects'>('days');
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  
  // Format date more consistently without relying on "Yesterday", "Today", etc.
  const formatDateDisplay = useCallback((day: any) => {
    // Create a date object from the actual date string
    const dateParts = day.actualDate.split('-').map(Number);
    const dateObj = new Date(dateParts[0], dateParts[1] - 1, dateParts[2]);
    
    // Format showing only day and month (without weekday)
    const dateOptions: Intl.DateTimeFormatOptions = { 
      day: 'numeric',
      month: 'short'
    };
    
    // Format it consistently
    return dateObj.toLocaleDateString('pt-BR', dateOptions);
  }, []);
  
  // Determine if a day is today for highlighting
  const isToday = useCallback((day: any) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    return day.actualDate === todayStr;
  }, []);
  
  // Sort all days chronologically
  const sortedDays = useMemo(() => {
    if (!classDays.length) return [];
    
    // Get today's date in YYYY-MM-DD format for comparison
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    
    // Use all days that have classes, no filtering by date range
    const daysWithClasses = classDays.filter(day => day.subjects.length > 0);
    
    // Sort all days chronologically by actualDate
    return daysWithClasses.sort((a, b) => a.actualDate.localeCompare(b.actualDate));
  }, [classDays]);
  
  // Define explicit subject ID mapping
  const subjectIdMap: { [key: string]: string } = {
    "Matematica": "1",
    "Lingua Portuguesa": "2",
    "Geografia": "3",
    "Historia": "4",
    "Fisica": "5",
    "Quimica": "6",
    "Biologia": "12"
  };
  
  // Get the current subject ID based on current class ID
  const getCurrentSubjectInfo = useCallback(() => {
    if (!currentClassId) return null;
    
    console.log(`Looking for subject info for class ID: ${currentClassId}`);
    
    // Directly find the class in class days
    for (const day of classDays) {
      for (const subject of day.subjects) {
        for (const classItem of subject.classes) {
          if (classItem.id === currentClassId) {
            console.log(`Found class in subject: ${subject.name} (ID: ${subject.id})`);
            
            // Double-check subject ID against our explicit mapping
            const mappedSubjectId = subject.name ? subjectIdMap[subject.name] : null;
            console.log(`Mapped subject ID: ${mappedSubjectId}, Original subject ID: ${subject.id}`);
            
            return {
              subjectId: subject.id,
              subjectName: subject.name,
              mappedSubjectId: mappedSubjectId, // Store mapped ID for verification
              subSubjectId: classItem.subSubjectId,
              subSubjectName: classItem.subSubjectName
            };
          }
        }
      }
    }
    
    console.log('Subject info not found for current class ID');
    return null;
  }, [currentClassId, classDays]);
  
  // Get current subject info
  const currentSubjectInfo = useMemo(() => {
    return getCurrentSubjectInfo();
  }, [getCurrentSubjectInfo]);
  
  // Log current subject info when it changes
  useEffect(() => {
    if (currentSubjectInfo) {
      console.log('Current subject info:', currentSubjectInfo);
    }
  }, [currentSubjectInfo]);
  
  // Helper to get class info and subject color
  const getClassInfo = (classId: string) => {
    for (const day of classDays) {
      for (const subject of day.subjects) {
        const foundClass = subject.classes.find(c => c.id === classId);
        if (foundClass) {
          return { 
            class: foundClass,
            color: subject.color,
            subject: subject.name
          };
        }
      }
    }
    return null;
  };
  
  // Check if a day contains the current class
  const isDayWithCurrentClass = (day: typeof classDays[0]) => {
    return day.subjects.some(subject => 
      subject.classes.some(c => c.id === currentClassId)
    );
  };
  
  // Initialize expanded days and handle scrolling
  useEffect(() => {
    if (!loading && sortedDays.length > 0) {
      // Initialize with today expanded
      const newExpandedDays: Record<string, boolean> = {};
      let dayToScrollTo: string | null = null;
      
      // Find today
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
      
      // Find today's entry
      const todayDay = sortedDays.find(day => day.actualDate === todayStr);
      
      if (todayDay) {
        // Always expand today's entry
        newExpandedDays[todayDay.actualDate] = true;
        dayToScrollTo = todayDay.actualDate;
      }
      
      // Also expand day with current class if different from today
      if (currentClassId) {
        for (const day of sortedDays) {
          if (isDayWithCurrentClass(day) && (!todayDay || day.actualDate !== todayStr)) {
            newExpandedDays[day.actualDate] = true;
            if (!dayToScrollTo) {
              dayToScrollTo = day.actualDate;
            }
          }
        }
      }
      
      // If no today or current class, expand the first day with classes
      if (Object.keys(newExpandedDays).length === 0 && sortedDays[0]) {
        newExpandedDays[sortedDays[0].actualDate] = true;
        dayToScrollTo = sortedDays[0].actualDate;
      }
      
      // Update expanded days state
      setExpandedDays(newExpandedDays);
      
      // Simple one-time scroll with a small delay
      const timer = setTimeout(() => {
        if (dayToScrollTo && scrollContainerRef.current) {
          const element = document.getElementById(`day-${dayToScrollTo}`);
          if (element) {
            // Increase offset to position the day higher in the viewport
            scrollContainerRef.current.scrollTop = element.offsetTop - 60;
          }
        }
      }, 100);
      
      return () => clearTimeout(timer);
    }
  }, [sortedDays, loading, currentClassId]);
  
  // Toggle between days and subjects views
  const toggleView = () => {
    setCurrentView(currentView === 'days' ? 'subjects' : 'days');
    
    // Reset scroll position when switching views
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = 0;
    }
  };
  
  // Toggle day expansion
  const toggleDay = (dayId: string) => {
    setExpandedDays(prev => {
      const newState = { ...prev };
      newState[dayId] = !prev[dayId];
      return newState;
    });
  };
  
  // Toggle subject expansion
  const toggleSubject = (subjectId: string) => {
    setExpandedSubjects(prev => {
      const newState = { ...prev };
      newState[subjectId] = !prev[subjectId];
      return newState;
    });
  };
  
  // Toggle sub-subject expansion
  const toggleSubSubject = (subSubjectKey: string) => {
    setExpandedSubSubjects(prev => {
      const newState = { ...prev };
      newState[subSubjectKey] = !prev[subSubjectKey];
      return newState;
    });
  };
  
  // Attempt to get a forced subject ID from URL if present (for debugging)
  const getForcedSubjectIdFromUrl = useCallback(() => {
    if (typeof window === 'undefined') return null;
    
    const urlParams = new URLSearchParams(window.location.search);
    const forcedSubjectId = urlParams.get('forceSubject');
    
    if (forcedSubjectId) {
      console.log(`Using forced subject ID from URL: ${forcedSubjectId}`);
      return forcedSubjectId;
    }
    return null;
  }, []);
  
  // Get the forced subject ID
  const forcedSubjectId = useMemo(() => getForcedSubjectIdFromUrl(), [getForcedSubjectIdFromUrl]);
  
  // Organize classes by subject and sub-subject, putting current subject first
  const subjectsData = useMemo(() => {
    if (!classDays.length) return [];
    
    console.log('Current subject info when organizing:', currentSubjectInfo);
    console.log('Forced subject ID:', forcedSubjectId);
    
    // If we have current subject info, try to pre-identify the current subject ID using our mapping
    let currentMappedSubjectId = null;
    if (currentSubjectInfo?.subjectName) {
      currentMappedSubjectId = subjectIdMap[currentSubjectInfo.subjectName];
      console.log(`Current subject name: ${currentSubjectInfo.subjectName}, Mapped ID: ${currentMappedSubjectId}`);
    }
    
    // Create a map for all subjects
    const subjectsMap: Record<string, {
      id: string;
      name: string;
      color: string;
      isCurrent: boolean;
      subSubjects: Record<string, {
        id: number;
        name: string;
        classes: ClassInfo[];
      }>;
    }> = {};
    
    // Go through all days and their subjects
    for (const day of classDays) {
      for (const subject of day.subjects) {
        // Create subject entry if it doesn't exist
        if (!subjectsMap[subject.name]) {
          let isCurrentSubject = false;
          
          // Check for forced subject ID first
          if (forcedSubjectId && String(subject.id) === forcedSubjectId) {
            isCurrentSubject = true;
            console.log(`Subject ${subject.name} (ID: ${subject.id}) FORCED as current`);
          } else if (currentSubjectInfo) {
            // Try multiple ways to determine if this is the current subject
            isCurrentSubject = 
              // 1. First check: Does subject name map to current mapped ID?
              (currentMappedSubjectId && String(subject.id) === currentMappedSubjectId) ||
              // 2. Compare subject ID directly
              String(currentSubjectInfo.subjectId) === String(subject.id) ||
              // 3. Compare with mapped ID (if available)
              (currentSubjectInfo.mappedSubjectId && 
               currentSubjectInfo.mappedSubjectId === String(subject.id)) ||
              // 4. Compare subject names as fallback
              currentSubjectInfo.subjectName === subject.name;
          }
          
          console.log(`Subject ${subject.name} (ID: ${subject.id}) - isCurrent: ${isCurrentSubject}`);
          
          subjectsMap[subject.name] = {
            id: subject.id,
            name: subject.name,
            color: subject.color,
            isCurrent: isCurrentSubject,
            subSubjects: {}
          };
        }
        
        // Add classes to appropriate sub-subjects
        for (const classItem of subject.classes) {
          const subSubjectId = classItem.subSubjectId;
          const subSubjectName = classItem.subSubjectName;
          
          // Create sub-subject entry if it doesn't exist
          if (!subjectsMap[subject.name].subSubjects[subSubjectName]) {
            subjectsMap[subject.name].subSubjects[subSubjectName] = {
              id: subSubjectId,
              name: subSubjectName,
              classes: []
            };
          }
          
          // Add class to sub-subject if not already added
          const existingClass = subjectsMap[subject.name].subSubjects[subSubjectName].classes.find(
            c => c.id === classItem.id
          );
          
          if (!existingClass) {
            subjectsMap[subject.name].subSubjects[subSubjectName].classes.push(classItem);
          }
        }
      }
    }
    
    // Convert the map to an array and sort
    const subjectsArray = Object.values(subjectsMap).map(subject => {
      // Convert sub-subjects map to array and sort
      const subSubjectsArray = Object.values(subject.subSubjects)
        .sort((a, b) => a.id - b.id);
      
      // Sort classes within each sub-subject
      subSubjectsArray.forEach(subSubject => {
        subSubject.classes.sort((a, b) => a.order - b.order);
      });
      
      // Return subject with sub-subjects as an array
      return {
        ...subject,
        subSubjects: subSubjectsArray
      };
    });
    
    // Custom sort function to put current subject first, then alphabetically
    return subjectsArray.sort((a, b) => {
      if (a.isCurrent && !b.isCurrent) return -1;
      if (!a.isCurrent && b.isCurrent) return 1;
      return a.name.localeCompare(b.name);
    });
  }, [classDays, currentSubjectInfo, forcedSubjectId]);
  
  // Initialize expansion state for subjects and sub-subjects
  useEffect(() => {
    if (subjectsData.length > 0 && currentView === 'subjects') {
      // Reset expansion states
      const newExpandedSubjects: Record<string, boolean> = {};
      const newExpandedSubSubjects: Record<string, boolean> = {};
      
      // Try to find the current subject by currentClassId
      const currentSubject = subjectsData.find(subject => subject.isCurrent);
      
      console.log('Current subject for expansion:', currentSubject?.name, currentSubject?.id);
      
      let foundCurrentClass = false;
      
      // If found, expand only the current subject and its relevant sub-subject
      if (currentSubject && currentSubjectInfo) {
        // Expand the current subject
        newExpandedSubjects[currentSubject.id] = true;
        
        // Find the sub-subject containing the current class
        currentSubject.subSubjects.forEach(subSubject => {
          // Check if this sub-subject contains the current class
          const hasCurrentClass = subSubject.classes.some(c => c.id === currentClassId);
          
          if (hasCurrentClass) {
            console.log(`Expanding sub-subject ${subSubject.name} in subject ${currentSubject.name}`);
            // Expand this sub-subject
            const subSubjectKey = `${currentSubject.id}-${subSubject.id}`;
            newExpandedSubSubjects[subSubjectKey] = true;
            foundCurrentClass = true;
          }
        });
      }
      
      // If no current subject found, expand the first subject
      if (!currentSubject && subjectsData[0]) {
        console.log(`No current subject found, expanding first subject: ${subjectsData[0].name}`);
        newExpandedSubjects[subjectsData[0].id] = true;
      }
      
      // Update the state
      setExpandedSubjects(newExpandedSubjects);
      setExpandedSubSubjects(newExpandedSubSubjects);
    }
  }, [subjectsData, currentView, currentClassId, currentSubjectInfo]);
  
  if (loading) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-50">
        <div className="animate-pulse">
          <div className="w-32 h-6 bg-gray-200 rounded mb-4 mx-auto"></div>
          <div className="w-48 h-4 bg-gray-200 rounded mb-2 mx-auto"></div>
          <div className="w-40 h-4 bg-gray-200 rounded mb-4 mx-auto"></div>
          <div className="w-20 h-8 bg-gray-200 rounded mx-auto"></div>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="h-full flex flex-col items-center justify-center bg-gray-50 p-4 text-center">
        <div className="text-red-500 mb-2">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mx-auto">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="8" x2="12" y2="12"></line>
            <line x1="12" y1="16" x2="12.01" y2="16"></line>
          </svg>
        </div>
        <h3 className="text-sm font-medium text-gray-800">Failed to load classes</h3>
        <p className="text-xs text-gray-500 mt-1">{error}</p>
      </div>
    );
  }
  
  // If no days with classes
  if (sortedDays.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center bg-gray-50 p-4 text-center">
        <div className="text-gray-400 mb-2">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mx-auto">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
            <line x1="16" y1="2" x2="16" y2="6"></line>
            <line x1="8" y1="2" x2="8" y2="6"></line>
            <line x1="3" y1="10" x2="21" y2="10"></line>
          </svg>
        </div>
        <h3 className="text-sm font-medium text-gray-800">No classes scheduled</h3>
        <p className="text-xs text-gray-500 mt-1">You don't have any upcoming classes</p>
      </div>
    );
  }
  
  // Function to get number of all days in classDays vs filtered in sortedDays
  const totalDaysCount = classDays.filter(day => day.subjects.length > 0).length;
  const displayedDaysCount = sortedDays.length;
  
  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* Header */}
      <div className="py-3 px-4 border-b border-gray-100 flex items-center justify-center">
        <div className="flex items-center">
          <button 
            onClick={toggleView}
            className="p-0.5 -mr-1 text-gray-500 hover:text-gray-700 rounded-full hover:bg-gray-200 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6"></polyline>
            </svg>
          </button>
          
          <h2 className="font-[&quot;Inter&quot;] text-[16px] font-normal text-gray-800 mx-1 px-1">
            {currentView === 'days' ? 'Suas Aulas' : 'Matérias'}
          </h2>
          
          <button 
            onClick={toggleView}
            className="p-0.5 -ml-1 text-gray-500 hover:text-gray-700 rounded-full hover:bg-gray-200 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 18 15 12 9 6"></polyline>
            </svg>
          </button>
        </div>
      </div>
      
      {/* Class list content */}
      <div 
        className="flex-1 overflow-auto thin-scrollbar" 
        ref={scrollContainerRef}
        style={{
          scrollbarWidth: 'thin' /* Firefox */
        }}
      >
        <style jsx>{`
          .thin-scrollbar::-webkit-scrollbar {
            width: 6px;
          }
          .thin-scrollbar::-webkit-scrollbar-track {
            background: transparent;
          }
          .thin-scrollbar::-webkit-scrollbar-thumb {
            background-color: rgba(0, 0, 0, 0.2);
            border-radius: 10px;
          }
        `}</style>
        
        {/* Days View */}
        {currentView === 'days' && (
          <>
            {sortedDays.map((day) => (
              <div key={day.actualDate} className="border-b border-gray-100" id={`day-${day.actualDate}`}>
                {/* Day header (clickable) */}
                <div 
                  className={`
                    py-3 pr-4 cursor-pointer transition-colors
                    ${isDayWithCurrentClass(day) 
                      ? 'bg-blue-50 border-l-4 border-green-500 pl-3' 
                      : 'hover:bg-gray-100 border-l-4 border-transparent pl-3'}
                    ${isToday(day) ? 'bg-blue-50/70' : ''}
                  `}
                  onClick={() => toggleDay(day.actualDate)}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className={`font-[&quot;Inter&quot;] text-[15px] font-medium ${isToday(day) ? 'text-blue-700' : 'text-gray-800'}`}>
                        {formatDateDisplay(day)}
                        {isToday(day) && (
                          <span className="ml-2 text-xs text-white bg-blue-500 px-2 py-0.5 rounded-full">
                            hoje
                          </span>
                        )}
                      </h3>
                      <p className={`text-[13px] ${isToday(day) ? 'text-blue-600' : 'text-gray-500'}`}>{day.date}</p>
                    </div>
                    <div className="flex items-center">
                      <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full mr-2">
                        {day.subjects.reduce((total, subject) => total + subject.classes.length, 0)}
                      </span>
                      <svg 
                        xmlns="http://www.w3.org/2000/svg" 
                        width="18" 
                        height="18" 
                        viewBox="0 0 24 24" 
                        fill="none" 
                        stroke="currentColor" 
                        strokeWidth="2" 
                        strokeLinecap="round" 
                        strokeLinejoin="round" 
                        className={`transition-transform ${expandedDays[day.actualDate] ? 'rotate-180' : ''}`}
                      >
                        <polyline points="6 9 12 15 18 9"></polyline>
                      </svg>
                    </div>
                  </div>
                </div>
                
                {/* Day content (expandable) */}
                {expandedDays[day.actualDate] && (
                  <div className="pl-4 pr-2 pb-2">
                    {/* Subjects within the day */}
                    {day.subjects.map((subject) => (
                      <div key={subject.id} className="mb-2">
                        <div className="flex items-center py-2">
                          <div 
                            className="w-3 h-3 rounded-full mr-2" 
                            style={{ backgroundColor: subject.color }}
                          ></div>
                          <h4 className="text-[14px] font-medium text-gray-700">{subject.name}</h4>
                          {subject.timeRanges.length > 0 && (
                            <span className="ml-2 text-xs text-gray-500">
                              {subject.timeRanges[0]}
                            </span>
                          )}
                        </div>
                        
                        {/* Classes within the subject */}
                        <div className="pl-5 space-y-1">
                          {subject.classes.map((classItem) => (
                            <div 
                              key={classItem.id}
                              className={`
                                px-3 py-2 rounded-md transition-colors
                                ${classItem.id === currentClassId ? 'bg-blue-100' : 'hover:bg-gray-100'}
                                flex items-center cursor-pointer
                              `}
                              onClick={() => {
                                // Navigate to class when clicked
                                if (classItem.link) {
                                  window.location.href = `/learn/${classItem.id}`;
                                }
                              }}
                            >
                              <div className="w-[4px] h-[28px] rounded-full mr-2" style={{ backgroundColor: subject.color }}></div>
                              <div>
                                <div className="text-[14px] text-gray-800">{classItem.name}</div>
                                <div className="text-[12px] text-gray-500">
                                  {classItem.subSubjectName} &middot; {Math.floor(classItem.duration / 60)} min
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </>
        )}
        
        {/* Subjects View */}
        {currentView === 'subjects' && (
          <>
            {subjectsData.map((subject) => (
              <div key={subject.id} className="border-b border-gray-100">
                {/* Subject header (clickable) */}
                <div 
                  className={`
                    py-3 pl-3 pr-4 cursor-pointer transition-colors 
                    ${subject.isCurrent ? 'bg-blue-50' : 'hover:bg-gray-100'} 
                    border-l-4
                  `}
                  style={{ borderColor: subject.color }}
                  onClick={() => toggleSubject(subject.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div 
                        className="w-3 h-3 rounded-full mr-2" 
                        style={{ backgroundColor: subject.color }}
                      ></div>
                      <h3 className={`font-[&quot;Inter&quot;] text-[15px] font-medium ${subject.isCurrent ? 'text-blue-700' : 'text-gray-800'}`}>
                        {subject.name}
                      </h3>
                    </div>
                    <div className="flex items-center">
                      <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full mr-2">
                        {subject.subSubjects.reduce(
                          (total, subSubject) => total + subSubject.classes.length, 0
                        )}
                      </span>
                      <svg 
                        xmlns="http://www.w3.org/2000/svg" 
                        width="18" 
                        height="18" 
                        viewBox="0 0 24 24" 
                        fill="none" 
                        stroke="currentColor" 
                        strokeWidth="2" 
                        strokeLinecap="round" 
                        strokeLinejoin="round" 
                        className={`transition-transform ${expandedSubjects[subject.id] ? 'rotate-180' : ''}`}
                      >
                        <polyline points="6 9 12 15 18 9"></polyline>
                      </svg>
                    </div>
                  </div>
                </div>
                
                {/* Subject content (expandable) */}
                {expandedSubjects[subject.id] && (
                  <div className="pl-4 pr-2 pb-2">
                    {/* SubSubjects within the subject */}
                    {subject.subSubjects.map((subSubject) => {
                      const subSubjectKey = `${subject.id}-${subSubject.id}`;
                      return (
                        <div key={subSubjectKey} className="mb-3">
                          {/* Sub-subject header (clickable) */}
                          <div 
                            className="flex items-center justify-between py-2 px-1 cursor-pointer hover:bg-gray-100/70 rounded-md"
                            onClick={() => toggleSubSubject(subSubjectKey)}
                          >
                            <h4 className="text-[14px] font-medium text-gray-700">
                              {subSubject.name}
                            </h4>
                            <div className="flex items-center">
                              <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full mr-2">
                                {subSubject.classes.length}
                              </span>
                              <svg 
                                xmlns="http://www.w3.org/2000/svg" 
                                width="16" 
                                height="16" 
                                viewBox="0 0 24 24" 
                                fill="none" 
                                stroke="currentColor" 
                                strokeWidth="2" 
                                strokeLinecap="round" 
                                strokeLinejoin="round" 
                                className={`transition-transform ${expandedSubSubjects[subSubjectKey] ? 'rotate-180' : ''}`}
                              >
                                <polyline points="6 9 12 15 18 9"></polyline>
                              </svg>
                            </div>
                          </div>
                          
                          {/* Classes within the sub-subject (expandable) */}
                          {expandedSubSubjects[subSubjectKey] && (
                            <div className="pl-5 space-y-1 mt-1">
                              {subSubject.classes.map((classItem: ClassInfo) => (
                                <div 
                                  key={classItem.id}
                                  className={`
                                    px-3 py-2 rounded-md transition-colors
                                    ${classItem.id === currentClassId ? 'bg-blue-100' : 'hover:bg-gray-100'}
                                    flex items-center cursor-pointer
                                  `}
                                  onClick={() => {
                                    // Navigate to class when clicked
                                    if (classItem.link) {
                                      window.location.href = `/learn/${classItem.id}`;
                                    }
                                  }}
                                >
                                  <div className="w-[4px] h-[28px] rounded-full mr-2" style={{ backgroundColor: subject.color }}></div>
                                  <div>
                                    <div className="text-[14px] text-gray-800">{classItem.name}</div>
                                    <div className="text-[12px] text-gray-500">
                                      {classItem.subSubjectName} &middot; {Math.floor(classItem.duration / 60)} min
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  );
} 