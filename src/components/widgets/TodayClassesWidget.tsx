"use client";

import { useEffect, useState, useRef } from 'react';
import { useClassSchedule, ClassDay, ClassSchedule, ClassInfo } from '../../lib/hooks/useClassSchedule';
import { CalendarClock, Clock, CheckCircle2, ArrowRight, ChevronDown, ChevronUp, BookOpen, Link as LinkIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';

export default function TodayClassesWidget() {
  const { classDays, loading } = useClassSchedule();
  const [todayData, setTodayData] = useState<ClassDay | null>(null);
  const [nextClassIndex, setNextClassIndex] = useState<number>(-1);
  const [expandedSubjects, setExpandedSubjects] = useState<number[]>([]);
  const [processedClasses, setProcessedClasses] = useState<Record<string, ClassInfo[]>>({});
  
  // Toggle subject expansion
  const toggleExpand = (index: number, e: React.MouseEvent) => {
    e.preventDefault(); // Prevent link navigation
    e.stopPropagation(); // Stop event bubbling
    setExpandedSubjects(prev => 
      prev.includes(index) 
        ? prev.filter(i => i !== index) 
        : [...prev, index]
    );
  };
  
  useEffect(() => {
    if (!classDays || classDays.length === 0) return;
    
    // Find today's data
    const todayIndex = classDays.findIndex(day => day.displayName === 'Today');
    if (todayIndex !== -1) {
      setTodayData(classDays[todayIndex]);
      
      // Process classes to remove duplicates based on name (not ID)
      const classesMap: Record<string, ClassInfo[]> = {};
      
      classDays[todayIndex].subjects.forEach(subject => {
        if (subject.classes && subject.classes.length > 0) {
          // Use a Map to deduplicate classes by name since ID might not be unique across subjects
          const uniqueClasses = new Map<string, ClassInfo>();
          subject.classes.forEach(cls => {
            const key = cls.subSubjectName || cls.name;
            if (!uniqueClasses.has(key)) {
              uniqueClasses.set(key, cls);
            }
          });
          
          // Convert Map back to array and sort by order if available
          const uniqueClassesArray = Array.from(uniqueClasses.values());
          uniqueClassesArray.sort((a, b) => (a.order || 0) - (b.order || 0));
          
          classesMap[subject.id] = uniqueClassesArray;
        }
      });
      
      setProcessedClasses(classesMap);
      
      // Find next class based on current time
      if (classDays[todayIndex].subjects && classDays[todayIndex].subjects.length > 0) {
        const now = new Date();
        const currentHour = now.getHours();
        const currentMinute = now.getMinutes();
        
        // Find the next class that hasn't started yet
        const nextIdx = classDays[todayIndex].subjects.findIndex(subject => {
          // Check if timeRanges exist and are not empty
          if (!subject.timeRanges || subject.timeRanges.length === 0) return false;
          
          // Assume the first time range is the start time (format: "09:00 - 10:30")
          const startTimePart = subject.timeRanges[0].split(' - ')[0]; 
          const timeParts = startTimePart.split(':');
          let hour = parseInt(timeParts[0]);
          const minute = parseInt(timeParts[1]);
          
          // Return true if this class starts later than current time
          return (hour > currentHour) || (hour === currentHour && minute > currentMinute);
        });
        
        setNextClassIndex(nextIdx);
        
        // Automatically expand the next class
        if (nextIdx !== -1) {
          setExpandedSubjects([nextIdx]);
        }
      }
    }
  }, [classDays]);
  
  // Calculate overall progress - always return 0% for now
  const calculateProgress = () => {
    return 0; // Always return 0% instead of random mock data
  };
  
  // Calculate subject-specific duration
  const getSubjectDuration = (subject: ClassSchedule): number => {
    // If the subject has a timeRange, parse it to calculate duration
    if (subject.timeRanges && subject.timeRanges.length > 0) {
      // Format: "09:00 - 10:30"
      const timeRange = subject.timeRanges[0];
      const [startTime, endTime] = timeRange.split(' - ');
      
      if (startTime && endTime) {
        const startParts = startTime.split(':').map(Number);
        const endParts = endTime.split(':').map(Number);
        
        const startMinutes = startParts[0] * 60 + startParts[1];
        const endMinutes = endParts[0] * 60 + endParts[1];
        
        return endMinutes - startMinutes;
      }
    }
    
    // Fallback: If we have classes with durations, use those
    if (subject.classes && subject.classes.length > 0) {
      return subject.classes.reduce((total, cls) => total + (cls.duration || 0), 0);
    }
    
    return 0;
  };
  
  // Calculate total study time for today
  const calculateTotalStudyTime = () => {
    if (!todayData?.subjects || todayData.subjects.length === 0) return 0;
    
    // Sum up all durations from timeRanges (more accurate for today's schedule)
    return todayData.subjects.reduce((total, subject) => {
      return total + getSubjectDuration(subject);
    }, 0);
  };
  
  const formatStudyTime = (minutes: number) => {
    if (minutes <= 0) return '0m';
    
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins > 0 ? mins + 'm' : ''}` : `${mins}m`;
  };
  
  // Get the start time from timeRanges
  const getStartTime = (subject: ClassSchedule): string => {
    if (!subject.timeRanges || subject.timeRanges.length === 0) return '';
    return subject.timeRanges[0].split(' - ')[0];
  };
  
  // Get class completion status
  const getClassStatus = (subjectIndex: number, classIndex: number): string => {
    if (!todayData?.subjects) return '';
    
    // For demo purposes, determine status based on indices
    if (subjectIndex < nextClassIndex) {
      return 'Concluído'; // Completed
    } else if (subjectIndex === nextClassIndex) {
      if (classIndex === 0) {
        return 'Em progresso'; // In progress
      } else if (classIndex === 1) {
        return 'Próximo'; // Next
      }
    }
    
    return ''; // No status for future classes
  };
  
  // Check if class is "watched" (completed) based on progress percentage
  const isClassWatched = (index: number) => {
    // For demo: classes before the next class are considered watched
    if (nextClassIndex === -1) return false;
    return index < nextClassIndex;
  };
  
  const progress = calculateProgress();
  const circumference = 2 * Math.PI * 36; // 36 is the radius of our circle
  const strokeDashoffset = circumference * (1 - progress / 100);
  const totalStudyTime = calculateTotalStudyTime();
  
  // Check if we have subjects
  const hasSubjects = todayData?.subjects && todayData.subjects.length > 0;
  
  // Count total sub-subjects for today
  const totalSubSubjects = Object.values(processedClasses).reduce((total, classes) => {
    return total + classes.length;
  }, 0);
  
  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { 
        when: "beforeChildren",
        staggerChildren: 0.1,
        duration: 0.4
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.3, ease: "easeOut" }
    }
  };

  const listVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { 
        staggerChildren: 0.05,
        delayChildren: 0.2
      }
    }
  };

  // Smooth expansion animation variants
  const expandVariants = {
    collapsed: { 
      opacity: 0,
      height: 0,
      overflow: 'hidden'
    },
    expanded: { 
      opacity: 1,
      height: 'auto',
      overflow: 'hidden',
      transition: { 
        height: { 
          duration: 0.3,
          ease: [0.04, 0.62, 0.23, 0.98] // Custom easing for smooth animation
        },
        opacity: { duration: 0.25, delay: 0.05 }
      }
    },
    exit: {
      opacity: 0,
      height: 0,
      overflow: 'hidden',
      transition: { 
        height: { duration: 0.2, ease: "easeInOut" },
        opacity: { duration: 0.15 }
      }
    }
  };

  // Smooth item animation variants
  const itemExpandVariants = {
    collapsed: { 
      opacity: 0,
      y: -5
    },
    expanded: (i: number) => ({ 
      opacity: 1,
      y: 0,
      transition: {
        delay: i * 0.05,
        duration: 0.3,
        ease: "easeOut"
      }
    })
  };

  return (
    <Link href="/plan" className="block h-full">
      <motion.div 
        className="bg-gradient-to-br from-accent-green-light to-accent-green rounded-card overflow-hidden h-full relative flex flex-col"
        initial="hidden"
        animate="visible"
        variants={containerVariants}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/25 z-10"></div>
        
        {/* Content container */}
        <div className="relative h-full flex flex-col p-4 z-20">
          {/* Top section with title and date */}
          <motion.div 
            className="flex justify-between items-start mb-3"
            variants={itemVariants}
          >
            <div className="text-white">
              <h2 className="text-2xl font-semibold mb-1">Suas Aulas</h2>
              <div className="flex items-center gap-2">
                <p className="text-sm text-white/90">
                  {hasSubjects
                    ? `${todayData.dayName}, ${todayData.date}`
                    : "Veja seu cronograma"
                  }
                </p>
                <span className="bg-white/20 text-white text-xs px-2 py-0.5 rounded-full">hoje</span>
              </div>
            </div>
            
            {!loading && todayData && hasSubjects && (
              <div className="relative w-16 h-16">
                {/* Background circle */}
                <svg className="w-full h-full" viewBox="0 0 80 80">
                  <circle 
                    cx="40" 
                    cy="40" 
                    r="36" 
                    fill="none" 
                    stroke="rgba(255,255,255,0.2)" 
                    strokeWidth="6"
                  />
                  {/* Progress circle - now always at 0% */}
                  <circle 
                    cx="40" 
                    cy="40" 
                    r="36" 
                    fill="none" 
                    stroke="#fff" 
                    strokeWidth="6" 
                    strokeDasharray={circumference}
                    strokeDashoffset={circumference} // Set to full circumference for 0%
                    strokeLinecap="round"
                    transform="rotate(-90 40 40)"
                  />
                </svg>
                {/* Percentage text */}
                <div className="absolute inset-0 flex items-center justify-center text-white font-medium text-sm">
                  0%
                </div>
              </div>
            )}
          </motion.div>
          
          {/* Middle section with subjects list */}
          <motion.div 
            className="flex-1 relative"
            variants={itemVariants}
          >
            {!loading && hasSubjects ? (
              <div 
                className="absolute inset-0 pr-1 pb-2 overflow-y-auto"
                style={{ 
                  scrollbarWidth: 'none',
                  msOverflowStyle: 'none',
                  WebkitOverflowScrolling: 'touch'
                }}
              >
                <style jsx global>{`
                  .absolute::-webkit-scrollbar {
                    display: none;
                  }
                `}</style>
                <motion.div 
                  className="space-y-2.5"
                  variants={listVariants}
                >
                  {todayData.subjects.map((subject: ClassSchedule, i: number) => {
                    const subjectDuration = getSubjectDuration(subject);
                    const hasSubSubjects = processedClasses[subject.id]?.length > 0;
                    const isExpanded = expandedSubjects.includes(i);
                    
                    return (
                      <motion.div 
                        key={i}
                        variants={itemVariants}
                        className={`
                          bg-white/15 backdrop-blur-md 
                          border border-white/20
                          rounded-md shadow-sm hover:shadow-md
                          transition-all duration-200 ease-in-out
                          ${i === nextClassIndex ? 'border-l-2 border-white' : ''}
                        `}
                        layout
                      >
                        {/* Subject card content */}
                        <div 
                          onClick={(e) => hasSubSubjects && toggleExpand(i, e)}
                          className={`
                            flex items-center gap-2 px-2.5 py-2.5
                            ${hasSubSubjects ? 'cursor-pointer hover:bg-white/5' : ''}
                            ${isExpanded ? 'rounded-t-md' : 'rounded-md'}
                            transition-all duration-200
                          `}
                        >
                          <div 
                            className={`min-w-5 min-h-5 rounded-full flex items-center justify-center`}
                          >
                            {isClassWatched(i) ? (
                              <CheckCircle2 className="w-4 h-4 text-white" />
                            ) : i === nextClassIndex ? (
                              <ArrowRight className="w-4 h-4 text-white" />
                            ) : (
                              <div className="w-2 h-2 rounded-full bg-white"></div>
                            )}
                          </div>
                          
                          <div className="flex-1 text-white">
                            <div className="flex justify-between items-center">
                              <p className="text-sm font-medium truncate">
                                {subject.name}
                              </p>
                              <span className="text-xs font-medium opacity-90 whitespace-nowrap">
                                {getStartTime(subject)}
                              </span>
                            </div>
                            
                            <div className="flex justify-between items-center">
                              {subjectDuration > 0 && (
                                <p className="text-[10px] opacity-70 flex items-center">
                                  <Clock className="w-3 h-3 inline mr-1" />
                                  {formatStudyTime(subjectDuration)}
                                </p>
                              )}
                              
                              {hasSubSubjects && (
                                <span className="text-[10px] opacity-70 flex items-center">
                                  <BookOpen className="w-3 h-3 inline mr-1" />
                                  {processedClasses[subject.id].length} {processedClasses[subject.id].length === 1 ? 'tópico' : 'tópicos'}
                                </span>
                              )}
                            </div>
                          </div>
                          
                          {hasSubSubjects && (
                            <motion.button 
                              onClick={(e) => toggleExpand(i, e)} 
                              className="p-1 rounded-full hover:bg-white/10"
                              animate={{ rotate: isExpanded ? 180 : 0 }}
                              transition={{ duration: 0.3, ease: "easeInOut" }}
                            >
                              <ChevronDown size={16} className="text-white" />
                            </motion.button>
                          )}
                        </div>
                        
                        {/* Sub-subjects expandable section with improved animation */}
                        <AnimatePresence initial={false}>
                          {isExpanded && hasSubSubjects && (
                            <motion.div 
                              key={`expand-${i}`}
                              variants={expandVariants}
                              initial="collapsed"
                              animate="expanded"
                              exit="exit"
                              className="bg-white/5"
                            >
                              <div className="px-2.5 pb-2.5">
                                <div className="space-y-1.5 mt-1 pl-7 border-l border-white/10">
                                  {processedClasses[subject.id].map((cls, j) => {
                                    const status = getClassStatus(i, j);
                                    
                                    return (
                                      <motion.div 
                                        key={cls.id || j}
                                        custom={j}
                                        variants={itemExpandVariants}
                                        initial="collapsed"
                                        animate="expanded"
                                        className="py-1 text-white"
                                      >
                                        <div className="flex items-start justify-between">
                                          <div className="flex items-start gap-2 flex-1">
                                            <div className="w-1.5 h-1.5 rounded-full bg-white/50 mt-1.5"></div>
                                            <div className="flex-1">
                                              <p className="text-xs">{cls.subSubjectName || cls.name}</p>
                                              
                                              {status && (
                                                <span className={`
                                                  text-[10px] rounded-full px-1.5 py-0.5 mt-1 inline-block
                                                  ${status === 'Concluído' ? 'bg-white/10 text-white/60' :
                                                    status === 'Em progresso' ? 'bg-white/20 text-white' :
                                                    'bg-white/15 text-white/80'}
                                                `}>
                                                  {status}
                                                </span>
                                              )}
                                            </div>
                                          </div>
                                          
                                          {cls.link && (
                                            <a 
                                              href={cls.link} 
                                              target="_blank" 
                                              rel="noopener noreferrer" 
                                              onClick={(e) => e.stopPropagation()}
                                              className="p-1 rounded-full hover:bg-white/20 transition-colors"
                                            >
                                              <LinkIcon size={12} className="text-white" />
                                            </a>
                                          )}
                                        </div>
                                      </motion.div>
                                    );
                                  })}
                                </div>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </motion.div>
                    );
                  })}
                </motion.div>
              </div>
            ) : !loading ? (
              <div className="flex items-center justify-center h-full">
                <p className="text-xs text-white/80">Sem aulas hoje</p>
              </div>
            ) : (
              <div className="flex items-center justify-center h-full">
                <p className="text-xs text-white/80">Carregando...</p>
              </div>
            )}
          </motion.div>
          
          {/* Bottom info section with total study time */}
          <motion.div 
            variants={itemVariants}
            className={`mt-2.5 bg-white/15 backdrop-blur-md border border-white/20 rounded-md px-3.5 py-2.5 text-white shadow-sm z-30 ${
              hasSubjects && totalStudyTime > 0 ? 'block' : 'hidden'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs flex items-center">
                <CalendarClock className="w-3 h-3 mr-1" />
                Tempo total de estudo
              </span>
              <span className="text-xs font-medium">
                {formatStudyTime(totalStudyTime)}
              </span>
            </div>
          </motion.div>
        </div>
      </motion.div>
    </Link>
  );
} 