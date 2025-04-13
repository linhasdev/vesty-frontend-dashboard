import { useState, useEffect, useCallback } from 'react';
import supabase from '../supabase/supabase';
import { useAuth } from './useAuth';

export interface StudySession {
  id: string;
  name: string;
  color: string;
  date: string;
}

// Map subject names to colors
export const subjectColorMap: Record<string, string> = {
  'Matemática': '#4C51BF', // Indigo
  'Língua Portuguesa': '#38A169', // Green
  'Biologia': '#805AD5', // Purple
  'Química': '#DD6B20', // Orange
  'Física': '#3182CE', // Blue
  'História': '#E53E3E', // Red
  'Geografia': '#319795', // Teal
  // Default color for any other subject
  'default': '#718096' // Gray
};

// Add a session cache to avoid unnecessary refetching
let sessionCache: { 
  userId: string | null, 
  data: StudySession[], 
  timestamp: number 
} = { 
  userId: null, 
  data: [], 
  timestamp: 0 
};

// Cache expiration time (10 minutes)
const CACHE_EXPIRATION = 10 * 60 * 1000;

export function useStudySessions() {
  const [sessions, setSessions] = useState<StudySession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const fetchStudySessions = useCallback(async () => {
    // Fast return if no user
    if (!user) {
      setSessions([]);
      setLoading(false);
      return;
    }

    // Check if we have a valid cache
    const now = Date.now();
    if (
      sessionCache.userId === user.id && 
      sessionCache.data.length > 0 && 
      now - sessionCache.timestamp < CACHE_EXPIRATION
    ) {
      setSessions(sessionCache.data);
      setLoading(false);
      return;
    }
    
    try {
      // No cache, need to fetch from Supabase
      setLoading(true);
      
      // First, get scheduled classes for the current user
      const { data: scheduledClasses, error: scheduledError } = await supabase
        .from('scheduled_classes')
        .select('id')
        .eq('user', user.id);

      if (scheduledError) throw scheduledError;
      
      if (!scheduledClasses || scheduledClasses.length === 0) {
        setSessions([]);
        setLoading(false);
        return;
      }

      // Get all scheduled_id values
      const scheduledIds = scheduledClasses.map(sc => sc.id);
      
      // Pre-filter only for recent/upcoming sessions (last 30 days and next 90 days)
      const today = new Date();
      const thirtyDaysAgo = new Date(today);
      thirtyDaysAgo.setDate(today.getDate() - 30);
      const ninetyDaysLater = new Date(today);
      ninetyDaysLater.setDate(today.getDate() + 365); // Changed from 90 to 365 days to show the whole year
      
      // Then get subject calendar entries for these scheduled classes with date filter
      const { data: calendarData, error: calendarError } = await supabase
        .from('subject_calendar')
        .select('*')
        .in('scheduled_id', scheduledIds);
        // Removed date filter restrictions to get all dates
        //.gte('date_calendar', thirtyDaysAgo.toISOString().split('T')[0])
        //.lte('date_calendar', ninetyDaysLater.toISOString().split('T')[0]);
        
      if (calendarError) throw calendarError;
      
      // Log the date range for debugging
      console.log(`Fetching sessions from ${thirtyDaysAgo.toISOString().split('T')[0]} to ${ninetyDaysLater.toISOString().split('T')[0]}`);
      console.log(`Found ${calendarData.length} total sessions`);

      // Transform the data to match the Subject interface (avoid unnecessary operations)
      const formattedSessions = calendarData.map(entry => {
        // Debug log for date understanding
        if (entry.date_calendar) {
          const date = new Date(entry.date_calendar);
          const month = date.getMonth() + 1; // 0-indexed to 1-indexed
          const year = date.getFullYear();
          console.log(`Session: ${entry.subject}, Date: ${entry.date_calendar}, Month: ${month}, Year: ${year}`);
        }
        
        return {
          id: entry.id.toString(),
          name: entry.subject,
          // Get color based on subject name or use default
          color: subjectColorMap[entry.subject] || subjectColorMap.default,
          date: entry.date_calendar
        };
      });

      // Update the cache
      sessionCache = {
        userId: user.id,
        data: formattedSessions,
        timestamp: now
      };

      setSessions(formattedSessions);
    } catch (err) {
      console.error('Error fetching study sessions:', err);
      setError('Failed to fetch study sessions');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchStudySessions();
  }, [fetchStudySessions]);

  return { sessions, loading, error, refetch: fetchStudySessions };
} 