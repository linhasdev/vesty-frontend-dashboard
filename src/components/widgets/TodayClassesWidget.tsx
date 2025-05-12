"use client";

import { useEffect, useState, useRef } from 'react';
import { useClassSchedule, ClassDay, ClassSchedule, ClassInfo } from '../../lib/hooks/useClassSchedule';
import { 
  CalendarClock, 
  Clock, 
  CheckCircle2, 
  ArrowRight, 
  ChevronDown, 
  BookOpen, 
  Link as LinkIcon, 
  BellOff, 
  Bell, 
  MessageSquare, 
  Phone 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function TodayClassesWidget() {
  const router = useRouter();
  const { classDays, loading } = useClassSchedule();
  const [todayData, setTodayData] = useState<ClassDay | null>(null);
  const [nextClassIndex, setNextClassIndex] = useState<number>(-1);
  const [expandedSubjects, setExpandedSubjects] = useState<number[]>([]);
  const [processedClasses, setProcessedClasses] = useState<Record<string, ClassInfo[]>>({});
  const [notificationStatus, setNotificationStatus] = useState<Record<string, string>>({});
  const [openNotificationMenu, setOpenNotificationMenu] = useState<number | null>(null);
  const [dropdownPosition, setDropdownPosition] = useState<{ top: number; right: number } | null>(null);
  const buttonRefs = useRef<(HTMLButtonElement | null)[]>([]);
  
  // Color mapping for subjects
  const subjectColors: Record<string, string> = {
    'Matemática': '#4C51BF',      // Indigo
    'Língua Portuguesa': '#38A169', // Green
    'Biologia': '#805AD5',        // Purple
    'Química': '#DD6B20',         // Orange
    'Física': '#3182CE',          // Blue
    'História': '#E53E3E',        // Red
    'Geografia': '#319795',       // Teal
    'default': '#718096'          // Gray (default)
  };
  
  // Function to get color for a subject
  const getSubjectColor = (subjectName: string): string => {
    // Check if the subject name exists in our mapping or contains a key as substring
    const exactMatch = subjectColors[subjectName];
    if (exactMatch) return exactMatch;
    
    // Check for partial matches (e.g. if subject name contains "Matemática")
    for (const [key, color] of Object.entries(subjectColors)) {
      if (key !== 'default' && subjectName.includes(key)) {
        return color;
      }
    }
    
    // Return default color if no match
    return subjectColors.default;
  };
  
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

  // Toggle notification menu
  const toggleNotificationMenu = (index: number, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    const button = buttonRefs.current[index];
    if (button) {
      const rect = button.getBoundingClientRect();
      setDropdownPosition({
        top: rect.bottom + 8,
        right: window.innerWidth - rect.right + rect.width / 2
      });
    }
    
    setOpenNotificationMenu(current => current === index ? null : index);
  };

  // Set notification type
  const setNotificationType = (subjectId: string, type: string, e: React.MouseEvent) => {
    e.preventDefault(); // Prevent link navigation
    e.stopPropagation(); // Stop event bubbling
    setNotificationStatus(prev => ({ ...prev, [subjectId]: type }));
    setOpenNotificationMenu(null);
  };
  
  // Click outside handler to close notification menu
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (openNotificationMenu !== null) {
        const target = event.target as HTMLElement;
        if (!target.closest('.notification-dropdown')) {
          setOpenNotificationMenu(null);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [openNotificationMenu]);
  
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
      
      // Set the next class to be the first subject (index 0)
      if (classDays[todayIndex].subjects && classDays[todayIndex].subjects.length > 0) {
        setNextClassIndex(0); // Set to first subject
        setExpandedSubjects([]); // Don't auto-expand any subject by default
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
    
    if (subjectIndex < nextClassIndex) {
      return 'Concluído'; // Classes in subjects before the next class are completed
    } else if (subjectIndex === nextClassIndex) {
      if (classIndex === 0) {
        return 'Em progresso'; // First class of the next subject is in progress
      } else {
        return 'Próximo'; // Other classes in the same subject are next
      }
    }
    
    return 'Não iniciado'; // Default to "Not started"
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
    hidden: { 
      opacity: 0,
      transition: {
        duration: 0.2
      }
    },
    visible: { 
      opacity: 1,
      transition: { 
        duration: 0.6,
        ease: "easeOut",
        when: "beforeChildren",
        delayChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { 
      opacity: 0,
      y: 10,
      transition: { duration: 0.1 }
    },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.5, ease: "easeOut" }
    }
  };

  const listVariants = {
    hidden: { 
      opacity: 0
    },
    visible: { 
      opacity: 1,
      transition: { 
        duration: 0.4,
        ease: "easeOut",
        staggerChildren: 0.08
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
          ease: [0.04, 0.62, 0.23, 0.98]
        },
        opacity: { duration: 0.3 }
      }
    },
    exit: {
      opacity: 0,
      height: 0,
      overflow: 'hidden',
      transition: { 
        height: { duration: 0.25, ease: "easeInOut" },
        opacity: { duration: 0.2 }
      }
    }
  };

  // Dropdown menu variants
  const dropdownVariants = {
    hidden: {
      opacity: 0,
      y: -5,
      scale: 0.95,
    },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        duration: 0.15,
        ease: "easeOut",
      }
    },
    exit: {
      opacity: 0,
      y: -5,
      scale: 0.95,
      transition: {
        duration: 0.1,
        ease: "easeIn",
      }
    }
  };

  return (
    <>
      <Link href="/plan" className="block h-full will-change-transform will-change-opacity">
        <motion.div 
          className="card h-full relative flex flex-col shadow-lg hover:shadow-xl hover:translate-y-[-5px] transition-all duration-300 ease-in-out opacity-0"
          initial="hidden"
          animate="visible"
          variants={containerVariants}
          style={{ 
            willChange: 'opacity, transform', 
            backfaceVisibility: 'hidden',
            backdropFilter: 'blur(24px)',
            WebkitBackdropFilter: 'blur(24px)'
          }}
        >
          {/* Content container */}
          <div className="relative h-full flex flex-col p-4 pl-6 z-20">
            {/* Top section with title and date */}
            <motion.div 
              className="flex justify-between items-start mb-3"
              variants={itemVariants}
              style={{ willChange: 'opacity, transform' }}
            >
              <div className="text-[var(--text-primary)]">
                <h2 className="text-3xl font-semibold mb-0.5">Suas Aulas</h2>
                <div className="flex items-center gap-2">
                  <p className="text-sm text-[var(--text-secondary)]">
                    {hasSubjects
                      ? `${todayData.dayName}, ${todayData.date}`
                      : "Veja seu cronograma"
                    }
                  </p>
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
                      stroke="rgba(16,185,129,0.2)" 
                      strokeWidth="6"
                    />
                    {/* Progress circle - now always at 0% */}
                    <circle 
                      cx="40" 
                      cy="40" 
                      r="36" 
                      fill="none" 
                      stroke="#10B981" 
                      strokeWidth="6" 
                      strokeDasharray={circumference}
                      strokeDashoffset={circumference} // Set to full circumference for 0%
                      strokeLinecap="round"
                      transform="rotate(-90 40 40)"
                    />
                  </svg>
                  {/* Percentage text */}
                  <div className="absolute inset-0 flex items-center justify-center text-[#10B981] font-medium text-sm">
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
                    style={{ willChange: 'opacity' }}
                  >
                    {todayData.subjects.map((subject: ClassSchedule, i: number) => {
                      const subjectDuration = getSubjectDuration(subject);
                      const hasSubSubjects = processedClasses[subject.id]?.length > 0;
                      const isExpanded = expandedSubjects.includes(i);
                      const notificationType = notificationStatus[subject.id] || 'none';
                      
                      return (
                        <motion.div 
                          key={i}
                          variants={itemVariants}
                          style={{ 
                            willChange: 'opacity, transform', 
                            backfaceVisibility: 'hidden',
                            backdropFilter: 'blur(12px)',
                            WebkitBackdropFilter: 'blur(12px)'
                          }}
                          className={`
                            border border-white/10
                            bg-white/50
                            rounded-lg
                            transition-all duration-300 ease-in-out
                            hover:bg-white/60 hover:translate-y-[-3px] hover:shadow-lg
                            cursor-pointer
                            overflow-hidden
                          `}
                          layout="position"
                        >
                          {/* Subject card content */}
                          <div 
                            className={`
                              flex items-center gap-3 px-4 py-2.5
                              ${hasSubSubjects ? 'cursor-pointer' : ''}
                              ${isExpanded ? 'rounded-t-lg' : 'rounded-lg'}
                              transition-all duration-200
                            `}
                            onClick={(e) => hasSubSubjects && toggleExpand(i, e)}
                          >
                            <div 
                              className={`min-w-5 min-h-5 rounded-full flex items-center justify-center`}
                              style={{ color: getSubjectColor(subject.name) }}
                            >
                              {i === 0 ? (
                                // Progress wheel for the first subject
                                <div className="relative w-4 h-4">
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
                                      stroke="#10B981"
                                      fill="transparent"
                                      r={7}
                                      cx={8}
                                      cy={8}
                                      strokeDasharray={`${7 * 2 * Math.PI}`}
                                      strokeDashoffset={`${7 * 2 * Math.PI * 0.7}`}
                                    />
                                  </svg>
                                </div>
                              ) : i === nextClassIndex ? (
                                <ArrowRight className="w-4 h-4 text-[var(--accent-blue)]" />
                              ) : (
                                <div className="w-2 h-2 rounded-full bg-[#10B981]"></div>
                              )}
                            </div>
                            
                            {/* Subject name */}
                            <div className="flex-1">
                              <p className="text-base font-medium truncate text-[var(--text-primary)]">
                                {subject.name}
                              </p>
                              {subjectDuration > 0 && (
                                <p className="text-xs text-[var(--text-primary)] opacity-70 flex items-center">
                                  <Clock className="w-3 h-3 inline mr-1" />
                                  {formatStudyTime(subjectDuration)}
                                </p>
                              )}
                            </div>
                            
                            {/* Bell icon and time */}
                            <div className="flex items-center gap-2">
                              {/* Bell */}
                              <div className="relative notification-dropdown">
                                <motion.button
                                  ref={(el: HTMLButtonElement | null) => {
                                    if (el) buttonRefs.current[i] = el;
                                  }}
                                  onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    toggleNotificationMenu(i, e);
                                  }}
                                  className="p-1 rounded-full hover:bg-black/5 transition-colors"
                                  whileHover={{ scale: 1.1 }}
                                  whileTap={{ scale: 0.95 }}
                                >
                                  {notificationType === 'none' ? (
                                    <BellOff size={20} className="text-gray-500" />
                                  ) : notificationType === 'app' ? (
                                    <Bell size={20} className="text-[#10B981]" />
                                  ) : notificationType === 'whatsapp' ? (
                                    <MessageSquare size={20} className="text-[#25D366]" />
                                  ) : (
                                    <Phone size={20} className="text-[var(--accent-blue)]" />
                                  )}
                                </motion.button>
                              </div>
                              
                              {/* Time and topics */}
                              <div>
                                <div className="text-sm font-medium text-[var(--text-primary)] text-right whitespace-nowrap">
                                  {getStartTime(subject)}
                                </div>
                                
                                {hasSubSubjects && (
                                  <div className="text-xs text-[var(--text-primary)] opacity-70 text-right whitespace-nowrap">
                                    {processedClasses[subject.id].length} {processedClasses[subject.id].length === 1 ? 'tópico' : 'tópicos'}
                                  </div>
                                )}
                              </div>
                              
                              {/* Expand button */}
                              {hasSubSubjects && (
                                <motion.button 
                                  onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    toggleExpand(i, e);
                                  }}
                                  className="p-1 rounded-full hover:bg-black/10"
                                  animate={{ rotate: isExpanded ? 180 : 0 }}
                                  transition={{ duration: 0.3, ease: "easeInOut" }}
                                >
                                  <ChevronDown size={16} className="text-[var(--accent-blue)]" />
                                </motion.button>
                              )}
                            </div>
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
                                className="bg-transparent backdrop-blur-sm"
                              >
                                <div className="px-2.5 pb-2.5">
                                  <div className="space-y-1.5 mt-1 pl-7 border-l border-white/10">
                                    {processedClasses[subject.id].map((cls, j) => {
                                      const status = getClassStatus(i, j);
                                      
                                      return (
                                        <div 
                                          key={cls.id || j}
                                          className="py-1 text-[var(--text-primary)] hover:bg-white/20 rounded transition-all duration-200 px-2 -ml-2"
                                          onClick={(e) => e.preventDefault()} // Prevent navigation on click
                                        >
                                          <div className="flex items-start justify-between">
                                            <div className="flex items-start gap-2 flex-1">
                                              <div className="w-1.5 h-1.5 rounded-full bg-[var(--text-secondary)] mt-1.5"></div>
                                              <div className="flex-1">
                                                <p className="text-sm">{cls.subSubjectName || cls.name}</p>
                                                
                                                {status && (
                                                  <span className={`
                                                    text-xs rounded-full px-1.5 py-0.5 mt-1 inline-block
                                                    ${status === 'Concluído' ? 'bg-[var(--accent-success)] bg-opacity-20 text-[var(--accent-success)] font-medium' :
                                                      status === 'Em progresso' ? 'bg-gray-200 bg-opacity-70 text-gray-600 font-medium' :
                                                      status === 'Próximo' ? 'bg-blue-100 text-blue-600 font-medium' :
                                                      'bg-gray-100 text-gray-500 font-medium'}
                                                  `}>
                                                    {status === '' ? 'Não iniciado' : status}
                                                  </span>
                                                )}
                                              </div>
                                            </div>
                                            
                                            {/* Always show the link icon whether cls.link exists or not */}
                                            <button 
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                e.preventDefault();
                                                if (cls.id) {
                                                  const targetPath = `/learn/${cls.id}`;
                                                  console.log(`Navigating to: ${targetPath}`);
                                                  router.push(targetPath);
                                                }
                                              }}
                                              className="p-2 rounded-full bg-white/15 border border-white/30 shadow-sm hover:shadow-md hover:bg-white/25 hover:scale-105 transition-all duration-200 cursor-pointer flex items-center justify-center"
                                            >
                                              <LinkIcon size={15} className="text-[var(--accent-blue)]" />
                                            </button>
                                          </div>
                                        </div>
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
                  <p className="text-xs text-[var(--text-secondary)]">Sem aulas hoje</p>
                </div>
              ) : (
                <div className="flex items-center justify-center h-full">
                  <p className="text-xs text-[var(--text-secondary)]">Carregando...</p>
                </div>
              )}
            </motion.div>
            
            {/* Bottom info section with total study time */}
            <motion.div 
              variants={itemVariants}
              className={`mt-2.5 bg-white/50 backdrop-blur-sm border-0 rounded-lg px-3.5 py-2.5 text-[var(--text-primary)] shadow-[0_2px_8px_rgba(0,0,0,0.05)] z-30 relative overflow-hidden ${
                hasSubjects && totalStudyTime > 0 ? 'block' : 'hidden'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs flex items-center text-[var(--text-primary)] opacity-80">
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

      {/* Dropdown Menu - Positioned in a portal */}
      <AnimatePresence>
        {openNotificationMenu !== null && dropdownPosition && (
          <div 
            className="fixed inset-0 z-[9999]" 
            onClick={() => {
              setOpenNotificationMenu(null);
              setDropdownPosition(null);
            }}
          >
            <motion.div
              className="fixed bg-white shadow-xl rounded-lg py-1 w-44 border border-gray-100"
              initial="hidden"
              animate="visible"
              exit="exit"
              variants={dropdownVariants}
              onClick={(e) => e.stopPropagation()}
              style={{
                top: `${dropdownPosition.top}px`,
                right: `${dropdownPosition.right}px`,
                zIndex: 9999,
                transformOrigin: 'top right',
                boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)'
              }}
            >
              <div className="py-1 px-2 text-xs font-medium text-gray-500 border-b border-gray-100">
                Notificações
              </div>
              
              <button
                className="flex items-center w-full px-3 py-1.5 text-xs hover:bg-gray-50 text-[var(--text-primary)] transition-colors whitespace-nowrap"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  const subject = todayData?.subjects[openNotificationMenu];
                  if (subject) {
                    setNotificationType(subject.id, 'app', e);
                    setOpenNotificationMenu(null);
                    setDropdownPosition(null);
                  }
                }}
              >
                <Bell size={12} className="mr-2 text-[#10B981] flex-shrink-0" />
                <span className="truncate">App</span>
              </button>
              
              <button
                className="flex items-center w-full px-3 py-1.5 text-xs hover:bg-gray-50 text-[var(--text-primary)] transition-colors whitespace-nowrap"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  const subject = todayData?.subjects[openNotificationMenu];
                  if (subject) {
                    setNotificationType(subject.id, 'whatsapp', e);
                    setOpenNotificationMenu(null);
                    setDropdownPosition(null);
                  }
                }}
              >
                <MessageSquare size={12} className="mr-2 text-[#25D366] flex-shrink-0" />
                <span className="truncate">WhatsApp</span>
              </button>
              
              <button
                className="flex items-center w-full px-3 py-1.5 text-xs hover:bg-gray-50 text-[var(--text-primary)] transition-colors whitespace-nowrap"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  const subject = todayData?.subjects[openNotificationMenu];
                  if (subject) {
                    setNotificationType(subject.id, 'call', e);
                    setOpenNotificationMenu(null);
                    setDropdownPosition(null);
                  }
                }}
              >
                <Phone size={12} className="mr-2 text-[var(--accent-blue)] flex-shrink-0" />
                <span className="truncate">Ligação</span>
              </button>

              <div className="border-t border-gray-100 my-0.5"></div>
              
              <button
                className="flex items-center w-full px-3 py-1.5 text-xs hover:bg-gray-50 text-gray-500 transition-colors whitespace-nowrap"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  const subject = todayData?.subjects[openNotificationMenu];
                  if (subject) {
                    setNotificationType(subject.id, 'none', e);
                    setOpenNotificationMenu(null);
                    setDropdownPosition(null);
                  }
                }}
              >
                <BellOff size={12} className="mr-2 flex-shrink-0" />
                <span className="truncate">Desativar</span>
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
} 