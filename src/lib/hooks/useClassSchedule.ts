import { useState, useEffect, useCallback } from 'react';
import supabase from '../supabase/supabase';
import { useAuth } from './useAuth';
import { subjectColorMap } from './useStudySessions';

export interface ClassSchedule {
  id: string;
  name: string;
  color: string;
  date: string;
  timeRanges: string[];
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
  return date.toLocaleDateString('default', { 
    month: 'short', 
    day: 'numeric', 
    year: 'numeric' 
  });
};

// Get day name from date
const getDayName = (date: Date): string => {
  return date.toLocaleDateString('default', { weekday: 'long' });
};

// Helper function to normalize date to local midnight
const normalizeDate = (date: Date): string => {
  // Use local midnight instead of UTC to avoid timezone issues
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Helper function to get today's date at local midnight
const getToday = (): Date => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
};

// Get display name based on relative day
const getDisplayName = (date: Date, today: Date): string => {
  // Use local dates for comparison to avoid timezone issues
  const dateLocal = new Date(date);
  dateLocal.setHours(0, 0, 0, 0);
  const todayLocal = new Date(today);
  todayLocal.setHours(0, 0, 0, 0);
  
  // Calculate difference in days
  const diffTime = dateLocal.getTime() - todayLocal.getTime();
  const diffInDays = Math.round(diffTime / (1000 * 3600 * 24));
  
  if (diffInDays === 0) return 'Today';
  if (diffInDays === -1) return 'Yesterday';
  if (diffInDays === 1) return 'Tomorrow';
  
  return date.toLocaleDateString('default', { month: 'short', day: 'numeric' });
};

// Format time range
const formatTimeRange = (startTime: string, finishTime: string): string => {
  // Assuming times are in format like "09:00:00" from database
  const start = startTime.substring(0, 5); // Get "09:00"
  const finish = finishTime.substring(0, 5); // Get "10:30"
  return `${start} - ${finish}`;
};

// Helper function to normalize DB date to match our format
const normalizeDBDate = (dateStr: string): string => {
  // If the date is already in YYYY-MM-DD format, return it
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    return dateStr;
  }
  
  // Otherwise, try to parse and normalize it
  try {
    const parts = dateStr.split('-');
    // Handle potential day/month/year format
    if (parts.length === 3) {
      const year = parts[2].length === 2 ? `20${parts[2]}` : parts[2];
      const month = parts[1].padStart(2, '0');
      const day = parts[0].padStart(2, '0');
      
      // This assumes the date is in DD-MM-YYYY format
      return `${year}-${month}-${day}`;
    }
    
    // If we can't parse it, fall back to using a Date object
    const date = new Date(dateStr);
    // Make sure to set hours to noon to avoid timezone issues
    date.setHours(12, 0, 0, 0);
    return normalizeDate(date);
  } catch (e) {
    console.error('Failed to normalize DB date:', dateStr);
    return dateStr; // Return original as fallback
  }
};

export function useClassSchedule() {
  const [classDays, setClassDays] = useState<ClassDay[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentDate, setCurrentDate] = useState(getToday());
  const { user } = useAuth();

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
  const getRequiredDateRange = useCallback((centerDate: Date, daysToShow = 31) => {
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
    // Fast return if no user
    if (!user) {
      setClassDays([]);
      setLoading(false);
      return;
    }

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
    
    try {
      setLoading(true);
      
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

      // Group sessions by date
      const sessionsByDate: Record<string, ClassSchedule[]> = {};
      
      // Process calendar data
      calendarData.forEach(entry => {
        // Make sure we're using a consistent date format for the database date
        const rawDateStr = entry.date_calendar;
        const dateStr = normalizeDBDate(rawDateStr);
        
        console.log('DB Date Transformation:', {
          original: rawDateStr,
          normalized: dateStr,
          subject: entry.subject
        });
        
        // Create entry if it doesn't exist
        if (!sessionsByDate[dateStr]) {
          sessionsByDate[dateStr] = [];
        }
        
        // Find if subject already exists for this date
        const existingSubject = sessionsByDate[dateStr].find(
          s => s.name === entry.subject
        );
        
        // Format time range
        const timeRange = formatTimeRange(entry.start_time, entry.finish_time);
        
        if (existingSubject) {
          // Add time range to existing subject
          existingSubject.timeRanges.push(timeRange);
        } else {
          // Create new subject entry
          sessionsByDate[dateStr].push({
            id: entry.id.toString(),
            name: entry.subject,
            color: subjectColorMap[entry.subject] || subjectColorMap.default,
            date: dateStr,
            timeRanges: [timeRange]
          });
        }
      });
      
      // Format dates for the UI and update cache
      const cachedData: Record<string, ClassDay> = {};
      const formattedDays: ClassDay[] = [];
      const today = getToday();
      
      // Create an array of all days in the range
      const startDateObj = new Date(startDate);
      const endDateObj = new Date(endDate);
      
      for (let d = new Date(startDateObj); d <= endDateObj; d.setDate(d.getDate() + 1)) {
        // Use our consistent date formatting
        const dateStr = normalizeDate(d);
        
        const formattedDate = formatDateString(d);
        const dayName = getDayName(d);
        const displayName = getDisplayName(d, today);
        
        // Check if we have data for this date - this is the key part
        const subjects = sessionsByDate[dateStr] || [];
        
        const dayData: ClassDay = {
          date: formattedDate,
          dayName,
          displayName,
          subjects,
          actualDate: dateStr
        };
        
        // Add to results array
        formattedDays.push(dayData);
        
        // Add to cache
        cachedData[dateStr] = dayData;
      }

      // Update the cache with this data
      dateRangeCache = {
        userId: user.id,
        data: {...dateRangeCache.data, ...cachedData}, // Merge with existing data
        startDate: startDate < (dateRangeCache.startDate || startDate) ? startDate : dateRangeCache.startDate,
        endDate: endDate > (dateRangeCache.endDate || endDate) ? endDate : dateRangeCache.endDate,
        timestamp: now
      };

      setClassDays(formattedDays);
    } catch (err) {
      console.error('Error fetching class schedule:', err);
      setError('Failed to fetch class schedule');
    } finally {
      setLoading(false);
    }
  }, [user, currentDate, getRequiredDateRange]);

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