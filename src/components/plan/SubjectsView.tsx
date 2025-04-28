"use client";

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import supabase from '../../lib/supabase/supabase';
import { subjectColorMap } from '../../lib/hooks/useStudySessions';
import { ChevronDown, ChevronUp, ChevronLeft, ChevronRight, Clock, Calendar } from 'lucide-react';
import { useAuth } from '../../lib/hooks/useAuth';
import { motion, AnimatePresence } from 'framer-motion';

// Performance optimisations: memoize variants & static styles to avoid recreation on each render

// Removed runtime DOM mutations that forced reflow – handled via CSS instead
const GlobalStyle = () => null;

// Static grid style for the subject overview
const GRID_STYLE = {
  display: 'grid',
  gridTemplateColumns: 'repeat(2, 1fr)',
  gridTemplateAreas: `
    "mat port"
    "geo hist"
    "bio quim"
    "fis auto"
  `,
  gridGap: '1rem',
  paddingBottom: '4rem'
} as const;

interface Class {
  id: string;
  name: string;
  order: number;
  day?: string;
  time?: string;
  date?: string;
  startTime?: string;
  finishTime?: string;
  sessionId?: string;
}

interface SubSubject {
  id: string;
  name: string;
  classes: Class[];
}

interface Subject {
  id: string;
  name: string;
  color: string;
  progress: number;
  nextClass: string;
  totalClasses: number;
  completedClasses: number;
  subSubjects: SubSubject[];
  gridArea?: string; // Added for grid positioning
}

interface ProgressCircleProps {
  progress: number;
  size?: 'large' | 'small';
  color?: string;
}

export default function SubjectsView() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);
  const [rawSubjectNames, setRawSubjectNames] = useState<string[]>([]);
  const [expandedClasses, setExpandedClasses] = useState<Set<string>>(new Set());
  const [sidebarOffset, setSidebarOffset] = useState(0);
  const cardRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth(); // Get authenticated user

  // Track sidebar state for proper card positioning
  useEffect(() => {
    const checkSidebar = () => {
      // Find the sidebar element - looking for the element with width 240px
      const sidebarElement = document.querySelector('div[class*="w-[240px]"][class*="translate-x-0"]');
      // Set offset based on sidebar state
      setSidebarOffset(sidebarElement && window.innerWidth >= 768 ? 120 : 0); // Half of 240px
    };

    // Check initially and on resize
    checkSidebar();
    
    // Set up an interval to check for sidebar changes
    const intervalId = setInterval(checkSidebar, 100);
    window.addEventListener('resize', checkSidebar);
    
    // Listen for any class changes on body which might indicate sidebar state changes
    const observer = new MutationObserver(checkSidebar);
    observer.observe(document.body, { 
      attributes: true,
      subtree: true,
      attributeFilter: ['class']
    });
    
    return () => {
      clearInterval(intervalId);
      window.removeEventListener('resize', checkSidebar);
      observer.disconnect();
    };
  }, []);

  // Memoized toggle handler to prevent re-creation on every render
  const toggleClass = useCallback((classId: string) => {
    setExpandedClasses(prev => {
      const newSet = new Set(prev);
      if (newSet.has(classId)) {
        newSet.delete(classId);
      } else {
        newSet.add(classId);
      }
      return newSet;
    });
  }, []);

  // Define grid areas for subjects
  const subjectGridAreas: Record<string, string> = {
    'matematica': 'mat',      // Top left
    'matemática': 'mat',      // Alternative spelling
    'língua portuguesa': 'port', // Top right
    'lingua portuguesa': 'port', // Alternative spelling
    'geografia': 'geo',       // Second row left
    'história': 'hist',       // Second row right
    'historia': 'hist',       // Alternative spelling
    'biologia': 'bio',        // Third row left
    'química': 'quim',        // Third row right
    'quimica': 'quim',        // Alternative spelling
    'física': 'fis',          // Fourth row left
    'fisica': 'fis'           // Alternative spelling
  };

  useEffect(() => {
    fetchSubjectsData();
  }, []);

  const fetchSubjectsData = async () => {
    try {
      setLoading(true);

      // Check if user is authenticated
      if (!user) {
        setError('User not authenticated');
        setLoading(false);
        return;
      }

      console.log('Fetching data for user:', user.id);

      // Fetch data from classes_dataset
      const { data: classesData, error: classesError } = await supabase
        .from('classes_dataset')
        .select('*')
        .order('subject_name')
        .order('sub-subject_name')
        .order('class_order');

      if (classesError) {
        throw classesError;
      }

      if (!classesData || classesData.length === 0) {
        setError('No data found in classes_dataset table');
        setLoading(false);
        return;
      }

      // Fetch session_classes filtered by user_id
      const { data: sessionClassesData, error: sessionClassesError } = await supabase
        .from('session_classes')
        .select('*')
        .eq('user_id', user.id); // Filter by the current user's ID

      if (sessionClassesError) {
        console.error('Error fetching session_classes:', sessionClassesError);
        // Continue without session data rather than failing completely
      }

      // Fetch subject_calendar to get session details
      const { data: calendarData, error: calendarError } = await supabase
        .from('subject_calendar')
        .select('*');

      if (calendarError) {
        console.error('Error fetching subject_calendar:', calendarError);
        // Continue without calendar data rather than failing completely
      }

      // Create a map of class IDs to session details
      const classScheduleMap: Record<string, {
        sessionId: string;
        date: string;
        startTime: string;
        finishTime: string;
      }[]> = {};

      // Keep track of which class IDs belong to the current user
      const userClassIds = new Set<string>();

      // Process the relationship data if available
      if (sessionClassesData && calendarData) {
        // Log some debug info
        console.log(`Found ${sessionClassesData.length} session-class relations for user ${user.id} and ${calendarData.length} calendar entries`);
        
        sessionClassesData.forEach(relation => {
          const classId = relation.class_idd;
          const sessionId = relation.session_id;
          
          // Add this class ID to the user's set
          userClassIds.add(classId);
          
          // Find the corresponding calendar entry
          const calendarEntry = calendarData.find(entry => entry.id === sessionId);
          
          if (calendarEntry) {
            if (!classScheduleMap[classId]) {
              classScheduleMap[classId] = [];
            }
            
            // Format date from ISO to more readable format in Portuguese
            let formattedDate = calendarEntry.date_calendar;
            if (formattedDate && typeof formattedDate === 'string') {
              try {
                // Convert date string to Date object, ensuring it uses local time
                const dateObj = new Date(formattedDate + 'T12:00:00');
                
                // Map of weekday names in Portuguese
                const weekdays = {
                  'Sunday': 'Domingo',
                  'Monday': 'Segunda-feira',
                  'Tuesday': 'Terça-feira',
                  'Wednesday': 'Quarta-feira',
                  'Thursday': 'Quinta-feira',
                  'Friday': 'Sexta-feira',
                  'Saturday': 'Sábado'
                };
                
                // Map of month names in Portuguese
                const months = {
                  'January': 'Janeiro',
                  'February': 'Fevereiro',
                  'March': 'Março',
                  'April': 'Abril',
                  'May': 'Maio',
                  'June': 'Junho',
                  'July': 'Julho',
                  'August': 'Agosto',
                  'September': 'Setembro',
                  'October': 'Outubro',
                  'November': 'Novembro',
                  'December': 'Dezembro'
                };
                
                // Get English day and month first
                const engDay = dateObj.toLocaleDateString('en-US', { weekday: 'long' });
                const engMonth = dateObj.toLocaleDateString('en-US', { month: 'long' });
                
                // Replace with Portuguese weekday and month names
                const day = weekdays[engDay as keyof typeof weekdays];
                const month = months[engMonth as keyof typeof months];
                
                formattedDate = `${day}, ${dateObj.getDate()} de ${month} de ${dateObj.getFullYear()}`;
              } catch (e) {
                console.error('Error formatting date:', e);
              }
            }
            
            // Format times to ensure proper display in local timezone
            let formattedStartTime = calendarEntry.start_time || 'Horário não definido';
            let formattedFinishTime = calendarEntry.finish_time || 'Horário não definido';
            
            // Format time if it exists
            if (calendarEntry.start_time) {
              try {
                // Convert 24-hour format to Brazilian time format
                const timeParts = calendarEntry.start_time.split(':');
                const hours = parseInt(timeParts[0], 10);
                const minutes = timeParts[1];
                formattedStartTime = `${hours}:${minutes}`;
              } catch (e) {
                console.error('Error formatting start time:', e);
              }
            }
            
            if (calendarEntry.finish_time) {
              try {
                // Convert 24-hour format to Brazilian time format
                const timeParts = calendarEntry.finish_time.split(':');
                const hours = parseInt(timeParts[0], 10);
                const minutes = timeParts[1];
                formattedFinishTime = `${hours}:${minutes}`;
              } catch (e) {
                console.error('Error formatting finish time:', e);
              }
            }
            
            classScheduleMap[classId].push({
              sessionId,
              date: formattedDate || 'Data não definida',
              startTime: formattedStartTime,
              finishTime: formattedFinishTime
            });
          }
        });
        
        // Log for debugging
        console.log('Class schedule map created:', Object.keys(classScheduleMap).length, 'classes have schedules');
        console.log('User-specific classes:', userClassIds.size);
      }

      // Get all unique subject names from data for debugging
      const uniqueSubjectNames = Array.from(new Set(classesData.map(item => item.subject_name)));
      setRawSubjectNames(uniqueSubjectNames);
      console.log("Raw subject names from DB:", uniqueSubjectNames);

      // Group by subject_name
      const subjectGroups: Record<string, any[]> = {};
      
      classesData.forEach(item => {
        // Only include classes that belong to the user
        if (userClassIds.has(item.class_id) || userClassIds.size === 0) {
          const subjectName = item.subject_name;
          if (!subjectGroups[subjectName]) {
            subjectGroups[subjectName] = [];
          }
          subjectGroups[subjectName].push(item);
        }
      });

      // Transform the data
      let transformedSubjects: Subject[] = Object.keys(subjectGroups).map(subjectName => {
        const subjectItems = subjectGroups[subjectName];
        
        // Group by sub-subject_name
        const subSubjectGroups: Record<string, any[]> = {};
        
        subjectItems.forEach(item => {
          const subSubjectName = item['sub-subject_name'];
          if (!subSubjectGroups[subSubjectName]) {
            subSubjectGroups[subSubjectName] = [];
          }
          subSubjectGroups[subSubjectName].push(item);
        });
        
        // Create sub-subjects array
        const subSubjects: SubSubject[] = Object.keys(subSubjectGroups).map(subSubjectName => {
          const subSubjectItems = subSubjectGroups[subSubjectName];
          
          // Create classes array
          const classes: Class[] = subSubjectItems.map(item => {
            const classId = item.class_id;
            const scheduleInfo = classScheduleMap[classId] && classScheduleMap[classId][0]; // Get first schedule if multiple
            
            // Map for weekday names in Portuguese
            const ptWeekdays = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];
            
            // Generate random weekday in Portuguese if needed
            const randomWeekday = ptWeekdays[Math.floor(Math.random() * 5) + 1]; // Monday to Friday (indexes 1-5)
            
            // Generate random time in Brazilian format if needed
            const randomHour = Math.floor(Math.random() * 12 + 8);
            const randomMinute = Math.random() > 0.5 ? '00' : '30';
            const randomTime = `${randomHour}:${randomMinute}`;
            
            return {
              id: classId || `class-${Math.random().toString(36).substr(2, 9)}`,
              name: item.class_name || 'Aula Desconhecida',
              order: item.class_order || 1,
              // Use actual schedule data if available, otherwise use mock data
              day: scheduleInfo?.date || randomWeekday,
              time: scheduleInfo ? `${scheduleInfo.startTime} - ${scheduleInfo.finishTime}` : randomTime,
              date: scheduleInfo?.date,
              startTime: scheduleInfo?.startTime,
              finishTime: scheduleInfo?.finishTime,
              sessionId: scheduleInfo?.sessionId
            };
          });
          
          // Sort classes by order
          classes.sort((a, b) => a.order - b.order);
          
          return {
            id: subSubjectItems[0]['sub-subject_id'] || `sub-${Math.random().toString(36).substr(2, 9)}`,
            name: subSubjectName,
            classes
          };
        });
        
        // Sort sub-subjects by their ID (convert ID to number for proper sorting)
        subSubjects.sort((a, b) => {
          // Extract numeric portion if ID is in format like "sub-123"
          const getNumericId = (id: string) => {
            // If the ID is purely numeric, return it as a number
            if (/^\d+$/.test(id)) {
              return parseInt(id, 10);
            }
            
            // Otherwise, try to extract numeric part from ID strings like "sub-123"
            const match = id.match(/(\d+)/);
            return match ? parseInt(match[1], 10) : 0;
          };
          
          return getNumericId(a.id) - getNumericId(b.id);
        });
        
        // Calculate total and completed classes
        const totalClasses = subSubjects.reduce((sum, subSubject) => sum + subSubject.classes.length, 0);
        const completedClasses = Math.floor(totalClasses * 0.6); // Example calculation, replace with actual logic
        
        // Calculate progress
        const progress = totalClasses > 0 ? Math.round((completedClasses / totalClasses) * 100) : 0;
        
        // Get color from map or default
        const color = subjectColorMap[subjectName] || subjectColorMap.default;
        
        // Get the first class as the next class (example)
        let nextClass = 'Sem aulas programadas';
        if (subSubjects.length > 0 && subSubjects[0].classes.length > 0) {
          nextClass = `Amanhã, 09:00`;
        }
        
        // Assign grid area based on normalized subject name
        const normalizedName = subjectName.toLowerCase().trim();
        let gridArea = 'auto'; // Default

        // Try to find a match in our grid area map
        for (const [key, area] of Object.entries(subjectGridAreas)) {
          if (normalizedName.includes(key)) {
            gridArea = area;
            console.log(`Assigned ${subjectName} to area ${area} (matched with ${key})`);
            break;
          }
        }
        
        return {
          id: subjectItems[0].subject_id || `subject-${Math.random().toString(36).substr(2, 9)}`,
          name: subjectName,
          color,
          progress,
          nextClass,
          totalClasses,
          completedClasses,
          subSubjects,
          gridArea
        };
      });
      
      console.log("Subjects with grid areas:", transformedSubjects.map(s => `${s.name}: ${s.gridArea}`));
      setSubjects(transformedSubjects);
      setLoading(false);
    } catch (err: any) {
      console.error('Error fetching subjects data:', err.message);
      setError(`Failed to fetch subjects: ${err.message}`);
      setLoading(false);
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (cardRef.current && !cardRef.current.contains(event.target as Node)) {
        setSelectedSubject(null);
      }
    };

    if (selectedSubject) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [selectedSubject]);

  const selectedSubjectData = selectedSubject 
    ? subjects.find(s => s.id === selectedSubject)
    : null;

  const currentSubjectIndex = selectedSubject 
    ? subjects.findIndex(s => s.id === selectedSubject)
    : -1;

  const handlePrevSubject = () => {
    const prevIndex = (currentSubjectIndex - 1 + subjects.length) % subjects.length;
    setSelectedSubject(subjects[prevIndex].id);
  };

  const handleNextSubject = () => {
    const nextIndex = (currentSubjectIndex + 1) % subjects.length;
    setSelectedSubject(subjects[nextIndex].id);
  };

  const ProgressCircle = ({ progress, size = 'large', color = '#38BDF8' }: ProgressCircleProps) => {
    const sizes = {
      large: { width: 120, stroke: 12, radius: 50 },
      small: { width: 60, stroke: 8, radius: 24 }
    } as const;
    
    const { width, stroke, radius } = sizes[size];
    const center = width / 2;

  return (
      <div className={`relative ${size === 'large' ? 'w-[120px] h-[120px]' : 'w-[60px] h-[60px]'}`}>
        <svg className="w-full h-full transform -rotate-90">
          <circle
            className="text-gray-200"
            strokeWidth={stroke}
            stroke="currentColor"
            fill="transparent"
            r={radius}
            cx={center}
            cy={center}
          />
          <circle
            className="transition-all duration-300"
            strokeWidth={stroke}
            strokeLinecap="round"
            stroke={color}
            fill="transparent"
            r={radius}
            cx={center}
            cy={center}
            strokeDasharray={`${radius * 2 * Math.PI}`}
            strokeDashoffset={`${radius * 2 * Math.PI * (1 - progress / 100)}`}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={`font-medium ${size === 'large' ? 'text-2xl' : 'text-sm'} text-gray-700`}>
            {progress}%
          </span>
        </div>
      </div>
    );
  };

  const ClassProgressCircle = ({ color }: { color: string }) => (
    <div className="relative w-4 h-4 mr-3">
      <svg className="w-full h-full transform -rotate-90">
        <circle
          className="text-gray-200"
          strokeWidth={2}
          stroke="currentColor"
          fill="transparent"
          r={7}
          cx={8}
          cy={8}
        />
        <circle
          className="transition-all duration-300"
          strokeWidth={2}
          strokeLinecap="round"
          stroke={color}
          fill="transparent"
          r={7}
          cx={8}
          cy={8}
          strokeDasharray={`${7 * 2 * Math.PI}`}
          strokeDashoffset={`${7 * 2 * Math.PI * 0.7}`}
        />
      </svg>
    </div>
  );

  const SubjectNavigation = () => (
    <div className="bg-white/50 backdrop-blur-sm rounded-full p-1 flex items-center justify-center max-w-[280px] mx-auto mb-8 border border-white/10">
      <button
        onClick={handlePrevSubject}
        className="p-2 rounded-full text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
      >
        <ChevronLeft className="w-5 h-5" />
      </button>
      
      {selectedSubjectData && (
        <div className="flex-1 px-4 py-2 text-sm font-medium text-[var(--text-primary)] text-center">
          {selectedSubjectData.name}
        </div>
      )}
      
      <button
        onClick={handleNextSubject}
        className="p-2 rounded-full text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
      >
        <ChevronRight className="w-5 h-5" />
      </button>
    </div>
  );

  const SubjectCard = ({ subject }: { subject: Subject }) => (
    <div 
      key={subject.id}
      className="card hover:translate-y-[-3px] hover:shadow-lg transition-all duration-300 ease-in-out cursor-pointer
                will-change-transform will-change-opacity p-4 sm:p-6"
      onClick={() => setSelectedSubject(subject.id)}
      style={{ 
        willChange: 'opacity, transform', 
        backfaceVisibility: 'hidden'
      }}
    >
      <div className="flex items-center mb-3 sm:mb-4">
        <div
          className="w-8 h-8 sm:w-10 sm:h-10 rounded-full mr-3 flex items-center justify-center text-white font-bold text-base sm:text-lg"
          style={{ backgroundColor: subject.color }}
        >
          {subject.name.charAt(0)}
        </div>
        <h3 className="text-lg sm:text-xl font-medium truncate text-black">{subject.name}</h3>
      </div>
      
      <div className="mb-3 sm:mb-4">
        <div className="flex justify-between text-xs sm:text-sm mb-1 text-black">
          <span>Progress</span>
          <span>{subject.progress}%</span>
        </div>
        <div className="w-full bg-black/10 rounded-full h-1.5 sm:h-2">
          <div 
            className="h-1.5 sm:h-2 rounded-full" 
            style={{ 
              width: `${subject.progress}%`,
              backgroundColor: subject.color
            }}
          ></div>
        </div>
      </div>
      
      <div className="text-xs sm:text-sm text-black">
        <div className="flex justify-between mb-1">
          <span>Next class:</span>
          <span>{subject.nextClass}</span>
        </div>
        <div className="flex justify-between">
          <span>Classes:</span>
          <span>{subject.completedClasses} of {subject.totalClasses}</span>
        </div>
      </div>
    </div>
  );

  // Handle clicking outside the card
  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      setSelectedSubject(null);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-red-500">{error}</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-orange-500">Please login to view your classes</div>
      </div>
    );
  }

  // For debugging - show actual subject names from DB
  const DebugInfo = () => (
    <div className="fixed bottom-4 right-4 bg-white p-3 rounded-lg shadow-lg text-xs z-50">
      <div className="font-bold mb-1">Raw Subject Names:</div>
      <ul>
        {rawSubjectNames.map((name, i) => (
          <li key={i}>{name}</li>
        ))}
      </ul>
    </div>
  );

  return (
    <div className="w-full h-full overflow-y-auto hide-scrollbar">
      <GlobalStyle />
      
      <style jsx global>{`
        .card {
          backdrop-filter: blur(24px) saturate(180%);
          background: var(--surface-glass);
          border: 1px solid var(--surface-stroke);
          border-radius: 24px;
          box-shadow: 0 4px 16px rgba(0,0,0,0.08);
          position: relative;
        }
        
        .card::before {
          content: "";
          position: absolute;
          inset: 0;
          border-radius: inherit;
          box-shadow: inset 0 0 0 800px rgba(255,255,255,0.20);
          pointer-events: none;
        }

        /* Hide scrollbar but keep functionality */
        .hide-scrollbar {
          -ms-overflow-style: none;  /* IE and Edge */
          scrollbar-width: none;  /* Firefox */
        }
        
        .hide-scrollbar::-webkit-scrollbar {
          display: none;  /* Chrome, Safari and Opera */
        }
      `}</style>
      
      <div className="pb-40">
        {!selectedSubject ? (
          <div 
            className="px-4 sm:px-6 max-w-6xl mx-auto mt-4 pb-64"
          >
            {/* CSS Grid with named template areas */}
            <div 
              className="grid gap-6 sm:gap-8" 
              style={GRID_STYLE}
            >
              {subjects.map(subject => (
                <div key={subject.id} style={{ gridArea: subject.gridArea || 'auto' }} className="mb-4">
                  <SubjectCard subject={subject} />
                </div>
              ))}
            </div>
            
            {/* Additional spacer for better scrolling */}
            <div className="h-64"></div>
          </div>
        ) : (
          <>
            {/* Dark overlay */}
            <div 
              className="fixed inset-0 bg-black/40 backdrop-blur-[2px] z-10"
              onClick={handleOverlayClick}
            />
            
            {/* Card container - dynamically centered based on sidebar state */}
            <div 
              className="fixed inset-0 z-20 overflow-auto flex items-start justify-center py-8 px-4"
              onClick={handleOverlayClick}
              style={{
                transition: "padding-left 0.2s ease-in-out"
              }}
            >
              <div 
                className="w-full max-w-4xl"
                style={{ 
                  transform: `translateX(${sidebarOffset}px)`,
                  transition: "transform 0.2s ease-in-out"
                }}
              >
                {selectedSubjectData && (
                  <div 
                    ref={cardRef}
                    className="card w-full overflow-hidden mb-20"
                    style={{ 
                      background: 'rgba(255, 255, 255, 0.5)',
                      backdropFilter: 'blur(24px) saturate(180%)'
                    }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="p-8">
                      <SubjectNavigation />

                      <div className="mb-12">
                        <div className="flex items-center justify-between mb-12">
                          <div>
                            <h1 className="text-6xl text-[var(--text-primary)] font-medium mb-4">{selectedSubjectData.name}</h1>
                            <h2 className="text-xl text-[var(--text-secondary)]">Sua média:</h2>
                          </div>
                          <div className="flex flex-col items-end">
                            <ProgressCircle progress={selectedSubjectData.progress} color={selectedSubjectData.color} />
                            <div className="text-[var(--text-secondary)] mt-2">{selectedSubjectData.progress}% assistido</div>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-8">
                        {selectedSubjectData.subSubjects.map((subSubject) => (
                          <div 
                            key={subSubject.id}
                            className="bg-white/50 backdrop-blur-sm rounded-3xl p-8 border border-white/10 hover:bg-white/60 transition-all duration-300"
                          >
                            <div className="flex items-center justify-between mb-6">
                              <h3 className="text-3xl text-gray-800 font-medium">
                                {subSubject.name}
                              </h3>
                              <ProgressCircle 
                                progress={70} 
                                size="small"
                                color={selectedSubjectData.color}
                              />
                            </div>

                            <div className="space-y-3">
                              {subSubject.classes.map((class_) => (
                                <div 
                                  key={class_.id}
                                  className="overflow-hidden rounded-2xl"
                                >
                                  <div 
                                    className="flex items-center justify-between text-[var(--text-primary)] bg-white/60 backdrop-blur-sm p-4 hover:bg-white/80 transition-colors cursor-pointer border border-white/10 rounded-t-lg"
                                    onClick={() => toggleClass(class_.id)}
                                  >
                                    <div className="flex items-center">
                                      <ClassProgressCircle color={selectedSubjectData.color} />
                                      <span className="text-lg text-[var(--text-primary)]">{class_.name}</span>
                                    </div>
                                    {expandedClasses.has(class_.id) ? (
                                      <ChevronUp size={18} className="text-[var(--accent-blue)]" />
                                    ) : (
                                      <ChevronDown size={18} className="text-[var(--accent-blue)]" />
                                    )}
                                  </div>
                                  
                                  {expandedClasses.has(class_.id) && (
                                    <div
                                      className="bg-white/50 backdrop-blur-sm border-t border-white/10"
                                    >
                                      <div className="p-4 space-y-2">
                                        <div className="flex items-center text-[var(--text-secondary)]">
                                          <Calendar size={16} className="mr-2" />
                                          <span>{class_.date || class_.day || 'Schedule not set'}</span>
                                        </div>
                                        <div className="flex items-center text-[var(--text-secondary)]">
                                          <Clock size={16} className="mr-2" />
                                          <span>
                                            {class_.startTime && class_.finishTime 
                                              ? `${class_.startTime} - ${class_.finishTime}`
                                              : class_.time || 'Time not set'}
                                          </span>
                                        </div>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
} 