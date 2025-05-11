import { useState, useEffect, useCallback } from 'react';
import supabase from '../supabase/supabase';
import { useAuth } from './useAuth';
import { subjectColorMap } from './useStudySessions';

export interface ClassInfo {
  id: string;
  name: string;
  order: number;
  link: string;
  duration: number;
  subSubjectName: string;
  subSubjectId: number;
}

export interface ClassSchedule {
  id: string;
  name: string;
  color: string;
  date: string;
  timeRanges: string[];
  classes: ClassInfo[];  // Add classes array
}

export interface ClassDay {
  date: string;
  dayName: string;
  displayName: string;
  subjects: ClassSchedule[];
  actualDate: string; // ISO date string for easy comparison
}

// Cache structure to store data by date ranges
let dateRangeCache: { 
  userId: string | null, 
  data: Record<string, ClassDay>, // Keyed by ISO date
  startDate: string | null,
  endDate: string | null,
  timestamp: number 
} = { 
  userId: null, 
  data: {}, 
  startDate: null,
  endDate: null,
  timestamp: 0 
};

// Cache expiration time (10 minutes)
const CACHE_EXPIRATION = 10 * 60 * 1000;

// Format date for display
const formatDateString = (date: Date): string => {
  // Create a date that preserves the day regardless of timezone
  // By using UTC date functions with local values
  const year = date.getFullYear();
  const month = date.getMonth();
  const day = date.getDate();
  
  // Create a string directly instead of using Date methods that might shift due to timezone
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${monthNames[month]} ${day}, ${year}`;
};

// Get day name from date
const getDayName = (date: Date): string => {
  // Create a date that preserves the day regardless of timezone
  const year = date.getFullYear();
  const month = date.getMonth();
  const day = date.getDate();
  
  // Create a new date in local timezone to get the day name
  const localDate = new Date(year, month, day, 12, 0, 0);
  return localDate.toLocaleDateString('default', { weekday: 'long' });
};

// Helper function to normalize date to local midnight in YYYY-MM-DD format
// This avoids any timezone conversions that might shift the date
const normalizeDate = (date: Date): string => {
  // Use direct date components instead of UTC methods to avoid timezone shifts
  const year = date.getFullYear();
  const month = date.getMonth() + 1; // JavaScript months are 0-indexed
  const day = date.getDate();
  
  // Format as YYYY-MM-DD
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
};

// Helper function to get today's date at local midnight
const getToday = (): Date => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
};

// Get display name based on relative day
const getDisplayName = (date: Date, today: Date): string => {
  // Use date components directly to avoid timezone shifts
  const dateYear = date.getFullYear();
  const dateMonth = date.getMonth();
  const dateDay = date.getDate();
  
  const todayYear = today.getFullYear();
  const todayMonth = today.getMonth();
  const todayDay = today.getDate();
  
  // Create local timezone dates for comparison
  const localDate = new Date(dateYear, dateMonth, dateDay, 12, 0, 0);
  const localToday = new Date(todayYear, todayMonth, todayDay, 12, 0, 0);
  
  // Simple date difference calculation by components
  const isToday = dateYear === todayYear && dateMonth === todayMonth && dateDay === todayDay;
  
  // Calculate yesterday/tomorrow by simply checking if it&apos;s one day difference
  const isYesterday = 
    (dateYear === todayYear && dateMonth === todayMonth && dateDay === todayDay - 1) ||
    (dateDay === new Date(todayYear, todayMonth, 0).getDate() && dateMonth === todayMonth - 1);
    
  const isTomorrow = 
    (dateYear === todayYear && dateMonth === todayMonth && dateDay === todayDay + 1) ||
    (dateDay === 1 && dateMonth === todayMonth + 1);
  
  if (isToday) return 'Today';
  if (isYesterday) return 'Yesterday';
  if (isTomorrow) return 'Tomorrow';
  
  // Use our custom formatter to avoid timezone issues
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${monthNames[dateMonth]} ${dateDay}`;
};

// Format time range
const formatTimeRange = (startTime: string, finishTime: string): string => {
  // Assuming times are in format like "09:00:00" from database
  const start = startTime.substring(0, 5); // Get "09:00"
  const finish = finishTime.substring(0, 5); // Get "10:30"
  return `${start} - ${finish}`;
};

// Helper function to normalize DB date to match our format
// This is critical for date alignment
const normalizeDBDate = (dateStr: string): string => {
  console.log(`Normalizing date: "${dateStr}"`);

  // If empty or null, return current date
  if (!dateStr) {
    console.error("Empty date string received");
    const today = new Date();
    return normalizeDate(today);
  }

  // If the date is already in YYYY-MM-DD format, return it
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    console.log(`Date already in YYYY-MM-DD format: ${dateStr}`);
    return dateStr;
  }
  
  // Try DD-MM-YYYY format (most likely format from DB)
  if (/^\d{1,2}-\d{1,2}-\d{4}$/.test(dateStr)) {
    try {
      const parts = dateStr.split('-');
      const day = String(parseInt(parts[0], 10)).padStart(2, '0');
      const month = String(parseInt(parts[1], 10)).padStart(2, '0');
      const year = parts[2];
      
      // Directly create the date string without using Date object
      const normalizedDate = `${year}-${month}-${day}`;
      console.log(`Normalized from DD-MM-YYYY format: ${dateStr} -> ${normalizedDate}`);
      return normalizedDate;
    } catch (e) {
      console.error(`Error parsing DD-MM-YYYY format: ${dateStr}`, e);
    }
  }
  
  // As a last resort, use the JavaScript Date object
  try {
    console.log(`Trying to parse "${dateStr}" with Date object`);
    
    // Use a safe approach to create a date - directly specify components
    let year, month, day;
    
    if (dateStr.includes('/')) {
      // Handle slash format (MM/DD/YYYY or DD/MM/YYYY)
      const parts = dateStr.split('/');
      if (parts.length === 3) {
        // Assume DD/MM/YYYY format - most common outside US
        day = parseInt(parts[0], 10);
        month = parseInt(parts[1], 10);
        year = parseInt(parts[2], 10);
        
        // Check if it&apos;s more likely MM/DD/YYYY
        if (parseInt(parts[0], 10) > 12 && parseInt(parts[1], 10) <= 12) {
          // Switch day and month if day value is > 12
          day = parseInt(parts[1], 10);
          month = parseInt(parts[0], 10);
        }
      }
    } else {
      // For any other format, create a date object and extract components
      const tempDate = new Date(dateStr);
      if (isNaN(tempDate.getTime())) {
        console.error(`Invalid date: "${dateStr}" could not be parsed`);
        return dateStr; // Return original as fallback
      }
      
      // Extract date components from local date (not UTC)
      year = tempDate.getFullYear();
      month = tempDate.getMonth() + 1; // JavaScript months are 0-indexed
      day = tempDate.getDate();
    }
    
    // Directly format the date as YYYY-MM-DD
    const normalizedDate = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    console.log(`Normalized with date components: ${dateStr} -> ${normalizedDate}`);
    return normalizedDate;
  } catch (e) {
    console.error(`Failed to normalize DB date: "${dateStr}"`, e);
    return dateStr; // Return original as fallback
  }
};

// Inside fetchClassSchedule function, add this logging helper
const DEBUG = true;

// Add this helper function at the beginning of fetchClassSchedule
const logDebug = (message: string, data?: any) => {
  if (DEBUG) {
    if (data) {
      console.log(`[DEBUG] ${message}`, data);
    } else {
      console.log(`[DEBUG] ${message}`);
    }
  }
};

// Create a function to ensure subjects are assigned to the correct day
const createAndAssignSubjects = (dateStr: string, entries: any[], sessionClassesMap: Record<string, any[]>) => {
  const subjects: ClassSchedule[] = [];
  
  // Skip if no entries
  if (!entries || entries.length === 0) {
    return subjects;
  }
  
  // Group entries by subject name
  const subjectEntryMap: Record<string, any[]> = {};
  
  // Verify all entries belong to this date
  const invalidEntries = entries.filter(entry => entry.normalizedDate !== dateStr);
  if (invalidEntries.length > 0) {
    console.error(`WARNING: Found ${invalidEntries.length} entries with incorrect dates for day ${dateStr}`, invalidEntries);
  }
  
  // Only use entries with matching dates
  const validEntries = entries.filter(entry => entry.normalizedDate === dateStr);
  console.log(`Using ${validEntries.length} valid entries for day ${dateStr}`);
  
  for (const entry of validEntries) {
    if (!subjectEntryMap[entry.subject]) {
      subjectEntryMap[entry.subject] = [];
    }
    subjectEntryMap[entry.subject].push(entry);
  }
  
  // Create ClassSchedule objects for each subject
  for (const subjectName in subjectEntryMap) {
    const subjectEntries = subjectEntryMap[subjectName];
    const timeRanges = subjectEntries.map(entry => entry.timeRange);
    const classes: ClassInfo[] = [];
    
    // Process classes for this subject
    for (const entry of subjectEntries) {
      const sessionClasses = sessionClassesMap[entry.id] || [];
      console.log(`Subject ${subjectName}, session ${entry.id}: found ${sessionClasses.length} class(es) for date ${dateStr}`);
      
      // Process class details
      for (const sessionClass of sessionClasses) {
        try {
          // Check if class_idd is undefined and provide a fallback
          const classId = sessionClass.class_idd || `unknown-${Math.random().toString(36).substring(2, 9)}`;
          
          // Extract class name explicitly checking all possible field names
          const details = sessionClass.details || {};
          const className = 
            details['class_name'] || 
            details.class_name || 
            details.className || 
            details.name || 
            `Class ${classId}`;
            
          const classOrder = 
            details['class_order'] || 
            details.class_order || 
            details.classOrder || 
            details.order || 
            1;
            
          const subSubjectName = 
            details['sub-subject_name'] || 
            details['sub-subject_name'] || 
            details['sub-subject-name'] || 
            details.sub_subject_name || 
            details.subSubjectName || 
            details.subjectName || 
            'Unknown';
          
          const subSubjectId = 
            details['sub-subject_id'] || 
            details['sub-subject_id'] || 
            details['sub-subject-id'] || 
            details.sub_subject_id || 
            details.subSubjectId || 
            details.subjectId || 
            0;
          
          // Always add class info, using explicit field mapping
          const classInfo: ClassInfo = {
            id: String(classId), // Convert safely to string
            name: className,
            order: classOrder,
            link: details.link || '',
            duration: details.duration || 3600,
            subSubjectName: subSubjectName,
            subSubjectId: subSubjectId
          };
          
          console.log('Created ClassInfo:', classInfo);
          classes.push(classInfo);
        } catch (err) {
          console.error(`Error processing class for subject ${subjectName}:`, err);
          // Add a placeholder class instead of failing
          classes.push({
            id: `error-${Math.random().toString(36).substring(2, 9)}`,
            name: `Class (Error processing)`,
            order: 1,
            link: '',
            duration: 3600,
            subSubjectName: 'Error',
            subSubjectId: 0
          });
        }
      }
    }
    
    console.log(`Subject ${subjectName} on ${dateStr}: adding ${classes.length} classes`);
    
    // Sort classes by sub-subject id and then by class order
    classes.sort((a, b) => {
      if (a.subSubjectId !== b.subSubjectId) {
        return a.subSubjectId - b.subSubjectId;
      }
      return a.order - b.order;
    });
    
    // IMPORTANT: Use the dateStr from the day, not from the entries
    subjects.push({
      id: subjectEntries[0].id.toString(),
      name: subjectName,
      color: subjectColorMap[subjectName] || subjectColorMap.default,
      date: dateStr, // Ensure this matches the day's date
      timeRanges,
      classes
    });
  }
  
  return subjects;
};

export function useClassSchedule() {
  const [classDays, setClassDays] = useState<ClassDay[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentDate, setCurrentDate] = useState(getToday());
  const [classesDatasetEmpty, setClassesDatasetEmpty] = useState(false); // Add state to track if classes_dataset is empty
  const { user } = useAuth();

  // On first load, check database schema to debug field names
  useEffect(() => {
    const checkSchema = async () => {
      if (!user) return;
      
      try {
        // Try to get the first row from classes_dataset to see the field structure
        const { data, error } = await supabase
          .from('classes_dataset')
          .select('*')
          .limit(1);
          
        if (error) {
          console.error('Error fetching schema:', error);
          return;
        }
        
        if (data && data.length > 0) {
          console.log('Classes_dataset schema:', Object.keys(data[0]));
          console.log('Sample record:', data[0]);
          setClassesDatasetEmpty(false);
        } else {
          console.log('No data in classes_dataset table');
          setClassesDatasetEmpty(true);
          setError('No class data available - classes_dataset table is empty');
        }
        
        // Also check the session_classes table
        const { data: sessionClassesData, error: sessionClassesError } = await supabase
          .from('session_classes')
          .select('*')
          .limit(5);
          
        if (sessionClassesError) {
          console.error('Error checking session_classes:', sessionClassesError);
        } else {
          console.log('Session_classes sample:', sessionClassesData);
        }
      } catch (err) {
        console.error('Failed to check schema:', err);
      }
    };
    
    checkSchema();
  }, [user]);

  // Navigate to specific date - useful for jumping to a date
  const navigateToDate = useCallback((date: Date) => {
    setCurrentDate(new Date(date));
    // Ensure hours are set to 0 to avoid timezone issues
    setCurrentDate(prevDate => {
      const newDate = new Date(prevDate);
      newDate.setHours(0, 0, 0, 0);
      return newDate;
    });
  }, []);

  // Navigate relative to current date (previous/next)
  const navigateRelative = useCallback((days: number) => {
    setCurrentDate(prevDate => {
      const newDate = new Date(prevDate);
      newDate.setDate(newDate.getDate() + days);
      newDate.setHours(0, 0, 0, 0); // Ensure hours are set to 0
      return newDate;
    });
  }, []);

  // Calculate dates needed for the view
  const getRequiredDateRange = useCallback((centerDate: Date, daysToShow = 365) => {
    const halfRange = Math.floor(daysToShow / 2);
    const startDate = new Date(centerDate);
    startDate.setDate(centerDate.getDate() - halfRange);
    
    const endDate = new Date(centerDate);
    endDate.setDate(centerDate.getDate() + halfRange);
    
    return {
      startDate: normalizeDate(startDate),
      endDate: normalizeDate(endDate)
    };
  }, []);

  // Main function to fetch class data
  const fetchClassSchedule = useCallback(async (centerDate: Date = currentDate) => {
    console.log('fetchClassSchedule called with date:', centerDate.toLocaleDateString());
    
    // Fast return if no user
    if (!user) {
      setClassDays([]);
      setLoading(false);
      return;
    }
    
    // If we already know the classes_dataset table is empty, generate mock data instead
    if (classesDatasetEmpty) {
      console.log('Using mock data because classes_dataset is empty');
      // Generate the date range
      const { startDate, endDate } = getRequiredDateRange(centerDate);
      const startDateObj = new Date(startDate);
      const endDateObj = new Date(endDate);
      const today = getToday();
      
      // Generate mock data for the date range
      const mockDays: ClassDay[] = [];
      
      for (let d = new Date(startDateObj); d <= endDateObj; d.setDate(d.getDate() + 1)) {
        const dateStr = normalizeDate(d);
        const formattedDate = formatDateString(d);
        const dayName = getDayName(d);
        const displayName = getDisplayName(d, today);
        
        // Create a mock day with some mock subjects on some days
        const shouldHaveClasses = Math.random() > 0.7; // 30% chance of having classes
        
        const subjects: ClassSchedule[] = shouldHaveClasses 
          ? [
              {
                id: `mock-${dateStr}-1`,
                name: 'Mathematics',
                color: subjectColorMap['Mathematics'] || '#4CAF50',
                date: dateStr,
                timeRanges: ['09:00 - 10:30'],
                classes: [
                  {
                    id: `class-mock-${Math.random().toString(36).substring(2, 9)}`,
                    name: 'Introduction to Algebra',
                    order: 1,
                    link: '',
                    duration: 5400, // 90 mins
                    subSubjectName: 'Algebra',
                    subSubjectId: 1
                  },
                  {
                    id: `class-mock-${Math.random().toString(36).substring(2, 9)}`,
                    name: 'Equations and Inequalities',
                    order: 2,
                    link: '',
                    duration: 5400, // 90 mins
                    subSubjectName: 'Algebra',
                    subSubjectId: 1
                  }
                ]
              }
            ]
          : [];
          
        mockDays.push({
          date: formattedDate,
          dayName,
          displayName,
          subjects,
          actualDate: dateStr
        });
      }
      
      setClassDays(mockDays);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      
      // Calculate date range needed
      const { startDate, endDate } = getRequiredDateRange(centerDate);
      
      // Check if we have a valid cache that covers our date range
      const now = Date.now();
      if (
        dateRangeCache.userId === user.id && 
        dateRangeCache.startDate && dateRangeCache.startDate <= startDate &&
        dateRangeCache.endDate && dateRangeCache.endDate >= endDate &&
        Object.keys(dateRangeCache.data).length > 0 && 
        now - dateRangeCache.timestamp < CACHE_EXPIRATION
      ) {
        // We have cached data covering this range - extract just the dates we need
        const today = getToday();
        
        const requiredDays: ClassDay[] = [];
        const startDateObj = new Date(startDate);
        const endDateObj = new Date(endDate);
        
        for (let d = new Date(startDateObj); d <= endDateObj; d.setDate(d.getDate() + 1)) {
          const dateStr = normalizeDate(d);
          if (dateRangeCache.data[dateStr]) {
            requiredDays.push(dateRangeCache.data[dateStr]);
          } else {
            // Create empty day if not in cache
            requiredDays.push({
              date: formatDateString(d),
              dayName: getDayName(d),
              displayName: getDisplayName(d, today),
              subjects: [],
              actualDate: dateStr
            });
          }
        }
        
        setClassDays(requiredDays);
        setLoading(false);
        return;
      }
      
      // Get scheduled classes for the current user
      const { data: scheduledClasses, error: scheduledError } = await supabase
        .from('scheduled_classes')
        .select('id')
        .eq('user', user.id);

      if (scheduledError) throw scheduledError;
      
      if (!scheduledClasses || scheduledClasses.length === 0) {
        setClassDays([]);
        setLoading(false);
        return;
      }

      // Get all scheduled_id values
      const scheduledIds = scheduledClasses.map(sc => sc.id);
      
      // Get subject calendar entries for these scheduled classes with date filter
      const { data: calendarData, error: calendarError } = await supabase
        .from('subject_calendar')
        .select('*')
        .in('scheduled_id', scheduledIds)
        .gte('date_calendar', startDate)
        .lte('date_calendar', endDate)
        .order('date_calendar', { ascending: true })
        .order('start_time', { ascending: true });
        
      if (calendarError) throw calendarError;

      // Group calendar entries by date to organize and display by day
      const groupedByDate: Record<string, {
        date: string;
        entries: any[];
      }> = {};
      
      // Create a direct date mapping for debugging
      const directDateMapping: Record<string, any[]> = {};
      
      // Process each calendar entry
      for (const entry of calendarData) {
        // Get the raw date from DB
        const rawDateStr = entry.date_calendar;
        logDebug(`Processing entry with date: ${rawDateStr}`, entry);
        
        // Normalize the date from DB format - THIS IS THE CRITICAL PART
        const dateStr = normalizeDBDate(rawDateStr);
        
        // Log the transformation for debugging
        logDebug(`Date transformation:`, {
          original: rawDateStr,
          normalized: dateStr,
          subject: entry.subject
        });
        
        // Store in direct mapping for debugging
        if (!directDateMapping[rawDateStr]) {
          directDateMapping[rawDateStr] = [];
        }
        directDateMapping[rawDateStr].push({...entry, normalizedDate: dateStr});
        
        // Format time range
        const timeRange = formatTimeRange(entry.start_time, entry.finish_time);
        
        // Initialize the date group if it doesn&apos;t exist
        if (!groupedByDate[dateStr]) {
          groupedByDate[dateStr] = { 
            date: dateStr,
            entries: []
          };
        }
        
        // Add to the entries array for this date
        groupedByDate[dateStr].entries.push({
          ...entry,
          timeRange,
          originalDate: rawDateStr,
          normalizedDate: dateStr,
          dateFormatTest: new Date(dateStr).toISOString() // For debugging date parsing
        });
      }
      
      // Log the direct mapping and grouped by date for comparison
      logDebug("Direct date mapping:", directDateMapping);
      logDebug("Grouped by date:", groupedByDate);
      
      // Fetch all session classes in bulk for efficiency
      const sessionIds = calendarData.map(entry => entry.id);
      
      // Only proceed with classes query if we have sessions
      let sessionClassesMap: Record<string, any[]> = {};
      
      if (sessionIds.length > 0) {
        const { data: sessionClasses, error: sessionClassesError } = await supabase
          .from('session_classes')
          .select('*')
          .in('session_id', sessionIds);
          
        if (sessionClassesError) throw sessionClassesError;
        
        console.log('Session classes data:', sessionClasses?.length || 0, 'items');
        
        // Create a map of session_id to classes for easy lookup
        sessionClassesMap = sessionClasses.reduce((map: Record<string, any[]>, item) => {
          if (!map[item.session_id]) {
            map[item.session_id] = [];
          }
          map[item.session_id].push(item);
          return map;
        }, {});
        
        // Batch fetch all class details - use class_idd instead of class_id
        const classIds = sessionClasses.map(sc => sc.class_idd);
        
        if (classIds.length > 0) {
          // Log the class IDs we're querying
          console.log('Fetching class details for IDs:', classIds);
          
          // Try getting all classes first to check if the table has data
          try {
            const { data: allClasses, error: allClassesError } = await supabase
              .from('classes_dataset')
              .select('*')
              .limit(5);
              
            if (allClassesError) {
              console.error('Error checking classes_dataset:', allClassesError);
            } else {
              console.log('Sample from classes_dataset table:', allClasses);
              if (allClasses.length === 0) {
                console.warn('WARNING: classes_dataset table appears to be empty!');
              }
            }
          } catch (e) {
            console.error('Error checking classes_dataset table:', e);
          }
          
          const { data: classesData, error: classesError } = await supabase
            .from('classes_dataset')
            .select('*')
            .in('class_id', classIds);
          
          if (classesError) {
            console.error('Error fetching class data:', classesError);
            throw classesError;
          }
          
          console.log('Classes dataset data:', classesData?.length || 0, 'items');
          // Log the first few class records to check what fields are available
          if (classesData && classesData.length > 0) {
            console.log('Sample class data:', classesData.slice(0, 2));
          }
          
          // Create a map of class_id to class details for easy lookup
          const classDetailsMap = classesData.reduce((map: Record<string, any>, item) => {
            map[item.class_id] = item;
            return map;
          }, {});
          
          // Associate class details with session classes
          for (const sessionId in sessionClassesMap) {
            sessionClassesMap[sessionId] = sessionClassesMap[sessionId].map(sc => {
              const details = classDetailsMap[sc.class_idd];
              // Log missing details for debugging
              if (!details) {
                console.error(`Missing class details for class_idd: ${sc.class_idd}`);
              }
              return {
                ...sc,
                details: details || {
                  // Provide default values if details are missing
                  class_id: sc.class_idd,
                  class_name: `Class ${sc.class_idd}`,
                  class_order: 1,
                  link: '',
                  duration: 3600, // 1 hour in seconds
                  sub_subject_name: 'Unknown',
                  sub_subject_id: 0
                }
              };
            });
          }
        }
      }
      
      // Create ClassDay objects for each date
      const days: ClassDay[] = [];
      const today = getToday();
      
      // Get a list of all dates in the range
      const dateRange: string[] = [];
      const startDateObj = new Date(startDate);
      const endDateObj = new Date(endDate);
      
      for (let d = new Date(startDateObj); d <= endDateObj; d.setDate(d.getDate() + 1)) {
        dateRange.push(normalizeDate(d));
      }
      
      logDebug("Date range for days:", dateRange);
      
      // Create ClassDay objects for each date in the range
      for (const dateStr of dateRange) {
        // Create a date that will preserve the intended day
        const dateParts = dateStr.split('-').map(part => parseInt(part, 10));
        const year = dateParts[0];
        const month = dateParts[1] - 1; // JavaScript months are 0-indexed
        const day = dateParts[2];
        
        // Create a date at noon in local timezone to avoid any day shifts
        const date = new Date(year, month, day, 12, 0, 0);
        
        console.log(`Creating day for '${dateStr}': year=${year}, month=${month+1}, day=${day}, date=${date.toISOString()}`);
        
        // Format for display using our corrected functions
        const formattedDate = formatDateString(date);
        const dayName = getDayName(date);
        const displayName = getDisplayName(date, today);
        
        // Log the date details to verify
        console.log(`Date details: dateStr=${dateStr}, formatted=${formattedDate}, display=${displayName}, day=${dayName}`);
        
        // Get entries for this specific date
        const entries = groupedByDate[dateStr]?.entries || [];
        
        // Create subjects ensuring they match this date
        const subjects = createAndAssignSubjects(dateStr, entries, sessionClassesMap);
        
        // Create the day with the subjects
        const dayData: ClassDay = {
          date: formattedDate,
          dayName,
          displayName,
          subjects,
          actualDate: dateStr
        };
        
        // Add to days array and update cache
        days.push(dayData);
        dateRangeCache.data[dateStr] = dayData;
      }

      // Update the cache with this data
      dateRangeCache = {
        userId: user.id,
        data: {...dateRangeCache.data}, // Just use the updated data that's already accumulated in dateRangeCache.data
        startDate: startDate < (dateRangeCache.startDate || startDate) ? startDate : dateRangeCache.startDate,
        endDate: endDate > (dateRangeCache.endDate || endDate) ? endDate : dateRangeCache.endDate,
        timestamp: now
      };

      setClassDays(days);

      // Check specifically for any date mismatches
      const mismatchedDays = days.filter(day => {
        return day.subjects.some(subject => subject.date !== day.actualDate);
      });

      if (mismatchedDays.length > 0) {
        console.error("FOUND DATE MISMATCHES:", mismatchedDays.map(day => ({
          day: day.displayName,
          actualDate: day.actualDate,
          subjects: day.subjects.map(s => ({
            name: s.name,
            subjectDate: s.date,
            match: day.actualDate === s.date
          }))
        })));
      } else {
        console.log("✅ No date mismatches found!");
      }
    } catch (err) {
      console.error('Error fetching class schedule:', err);
      setError('Failed to fetch class schedule');
    } finally {
      setLoading(false);
    }
  }, [user, currentDate, getRequiredDateRange, classesDatasetEmpty]);

  // Fetch data when current date changes
  useEffect(() => {
    fetchClassSchedule(currentDate);
  }, [fetchClassSchedule, currentDate]);

  return { 
    classDays, 
    loading, 
    error, 
    currentDate,
    navigateToDate, 
    navigateRelative,
    refetch: fetchClassSchedule 
  };
} 