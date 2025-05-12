import { useState, useEffect, useRef } from 'react';
import supabase from '@/lib/supabase/supabase';

// Define types for our events and payloads
export type EventType = 'quiz' | 'info';

export interface ClassEventGroup {
  id: number;
  class_id: string;
  timestamp_ms: number; // Despite the name, this is actually in seconds
  event_type: EventType;
  variants?: ClassEventVariant[];
}

export interface ClassEventVariant {
  group_id: number;
  variant_index: number;
  weight: number;
  payload: QuizPayload | InfoPayload;
}

export interface QuizPayload {
  question: string;
  alternatives: string[];
  correctIndex?: number;
  answer?: number;
}

export interface InfoPayload {
  title: string;
  description: string;
  imageUrl?: string;
}

export interface ActiveEvent {
  eventGroup: ClassEventGroup;
  variant: ClassEventVariant;
}

/**
 * Hook to handle video events based on timestamps
 * @param classId The ID of the current class
 * @param videoRef Reference to the video element
 */
export function useVideoEvents(classId: string, videoElement: HTMLVideoElement | null) {
  const [eventGroups, setEventGroups] = useState<ClassEventGroup[]>([]);
  const [activeEvent, setActiveEvent] = useState<ActiveEvent | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const lastCheckedTime = useRef<number>(-1);

  // Fetch event groups for this class
  useEffect(() => {
    async function fetchEventGroups() {
      try {
        setLoading(true);
        
        // Fetch event groups for this class
        const { data: eventGroups, error: eventGroupsError } = await supabase
          .from('class_event_groups')
          .select('*')
          .eq('class_id', classId)
          .order('timestamp_ms', { ascending: true });
        
        if (eventGroupsError) {
          throw new Error(`Error fetching event groups: ${eventGroupsError.message}`);
        }
        
        if (!eventGroups || eventGroups.length === 0) {
          setEventGroups([]);
          setLoading(false);
          return;
        }
        
        // Get all group IDs
        const groupIds = eventGroups.map(group => group.id);
        
        // Fetch variants for all groups
        const { data: variants, error: variantsError } = await supabase
          .from('class_event_variants')
          .select('*')
          .in('group_id', groupIds);
        
        if (variantsError) {
          throw new Error(`Error fetching event variants: ${variantsError.message}`);
        }
        
        // Associate variants with their groups
        const groupsWithVariants = eventGroups.map(group => ({
          ...group,
          variants: variants?.filter(variant => variant.group_id === group.id) || []
        }));
        
        console.log('Loaded video events:', groupsWithVariants);
        console.log('Event payloads:', groupsWithVariants.map(group => 
          group.variants?.map((variant: any) => variant.payload)
        ));
        
        setEventGroups(groupsWithVariants);
        
      } catch (err: any) {
        console.error('Error fetching video events:', err);
        setError(err.message || 'Failed to load video events');
      } finally {
        setLoading(false);
      }
    }
    
    if (classId) {
      fetchEventGroups();
    }
  }, [classId]);
  
  // Check video timestamp and trigger events
  useEffect(() => {
    if (!videoElement || eventGroups.length === 0) return;
    
    const checkTimestamp = () => {
      if (!videoElement) return;
      
      // Get current video time in seconds
      const currentTimeSec = Math.floor(videoElement.currentTime);
      
      // Only process if time has changed significantly
      if (Math.abs(currentTimeSec - lastCheckedTime.current) < 1) {
        return;
      }
      
      lastCheckedTime.current = currentTimeSec;
      
      console.log('Current video time (sec):', currentTimeSec);
      console.log('Available events at (sec):', eventGroups.map(g => g.timestamp_ms));
      
      // Find event groups that should be active at the current timestamp
      // We look for events that are +/- 5 seconds from the current time
      const matchingEvents = eventGroups.filter(
        group => Math.abs(group.timestamp_ms - currentTimeSec) < 5
      );
      
      if (matchingEvents.length > 0) {
        // Get the first matching event
        const eventGroup = matchingEvents[0];
        console.log('Found matching event at timestamp:', currentTimeSec, eventGroup);
        
        // Select a variant based on weight
        // For now, just select the first one or one with the highest weight
        let selectedVariant = eventGroup.variants?.[0];
        
        if (eventGroup.variants && eventGroup.variants.length > 1) {
          // Sort by weight (highest first) and take the first one
          selectedVariant = [...eventGroup.variants]
            .sort((a, b) => b.weight - a.weight)[0];
        }
        
        if (selectedVariant) {
          console.log('Selected variant:', selectedVariant);
          setActiveEvent({
            eventGroup,
            variant: selectedVariant
          });
        }
      }
    };
    
    // Set up interval to check timestamp regularly
    const intervalId = setInterval(checkTimestamp, 1000);
    
    // Also add timeupdate event listener for more precise checks
    videoElement.addEventListener('timeupdate', checkTimestamp);
    
    return () => {
      clearInterval(intervalId);
      videoElement?.removeEventListener('timeupdate', checkTimestamp);
    };
  }, [videoElement, eventGroups]);
  
  // Function to clear the active event
  const clearActiveEvent = () => {
    setActiveEvent(null);
  };
  
  return {
    eventGroups,
    activeEvent,
    loading,
    error,
    clearActiveEvent
  };
} 