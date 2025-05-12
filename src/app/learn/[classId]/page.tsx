import { notFound } from 'next/navigation';
import supabase from '@/lib/supabase/supabase';
import dynamic from 'next/dynamic';
import React from 'react';
import { unstable_noStore as noStore, revalidatePath } from 'next/cache';

// Create a HeaderWithPanels component as a separate file to avoid the "use client" directive issue
const HeaderWithPanels = dynamic(() => import('../../../components/Learning/HeaderWithPanels'), { ssr: false });

// Define VideoInfo type to match the one in HeaderWithPanels
interface VideoInfo {
  type: 'youtube' | 'vimeo' | 'google-storage' | 'direct';
  url: string;
}

interface ClassPageProps {
  params: {
    classId: string;
  };
}

interface DatabaseError {
  message: string;
  [key: string]: any;
}

// Function to fetch class data from Supabase
async function getClassData(classId: string) {
  // Disable caching for this data request
  noStore();
  
  try {
    console.log(`Fetching class data for classId: ${classId}`);
    
    // First, let's try to get the table structure to understand column names
    const { data: tableInfo, error: tableError } = await supabase
      .from('classes_dataset')
      .select('*')
      .limit(1);
      
    if (tableInfo && tableInfo.length > 0) {
      const columnNames = Object.keys(tableInfo[0]);
      console.log('Available columns:', columnNames);
      
      // Try different possible column names based on user specifications
      const possibleIdColumns = ['class_id', 'id', 'classId', 'classid', 'class_number'];
      
      // Find the first matching column name that exists in the table
      const idColumn = possibleIdColumns.find(col => columnNames.includes(col));
      
      if (idColumn) {
        console.log(`Found ID column: ${idColumn}, using it for query`);
        const { data, error } = await supabase
          .from('classes_dataset')
          .select('*')
          .eq(idColumn, classId)
          .single();
          
        if (error) {
          console.error(`Error querying with ${idColumn}:`, error);
          return { data: null, error: error as DatabaseError, columnNames };
        }
        
        return { data, error: null, columnNames };
      }
      
      // If we couldn't find a matching ID column, just return the column names for debugging
      return { 
        data: null, 
        error: { message: 'Could not find an appropriate ID column in the table' } as DatabaseError, 
        columnNames 
      };
    } else {
      console.log('Could not fetch table structure:', tableError);
      return { 
        data: null, 
        error: (tableError as DatabaseError) || { message: 'Failed to fetch table structure' } as DatabaseError, 
        columnNames: [] 
      };
    }
  } catch (err) {
    console.error('Exception when fetching class data:', err);
    return { 
      data: null, 
      error: (err as DatabaseError) || { message: 'Unknown error occurred' } as DatabaseError, 
      columnNames: [] 
    };
  }
}

// Function to determine the type of video URL and how to handle it
function getVideoInfo(url: string): VideoInfo {
  if (!url) return { type: 'direct', url: '' };
  
  // YouTube URL conversion
  if (url.includes('youtube.com/watch') || url.includes('youtu.be/')) {
    let videoId = '';
    
    if (url.includes('youtube.com/watch')) {
      const videoIdMatch = url.match(/[?&]v=([^&]+)/);
      videoId = videoIdMatch ? videoIdMatch[1] : '';
    } else if (url.includes('youtu.be/')) {
      videoId = url.split('youtu.be/')[1]?.split(/[?#]/)[0] || '';
    }
    
    if (videoId) {
      return { type: 'youtube', url: `https://www.youtube.com/embed/${videoId}` };
    }
  }
  
  // Vimeo URL conversion
  if (url.includes('vimeo.com/')) {
    const vimeoId = url.split('vimeo.com/')[1]?.split(/[?#]/)[0] || '';
    if (vimeoId) {
      return { type: 'vimeo', url: `https://player.vimeo.com/video/${vimeoId}` };
    }
  }
  
  // Google Storage API URL detection
  if (url.includes('storage.googleapis.com') || url.includes('storage.cloud.google.com')) {
    console.log('Detected Google Storage URL:', url);
    // Add cache busting parameter to avoid caching issues
    const cacheBuster = `?cb=${Date.now()}`;
    return { type: 'google-storage', url: `${url}${cacheBuster}` };
  }
  
  // Default to direct URL
  console.log('Using direct URL for video:', url);
  // Add cache busting parameter to avoid caching issues
  const cacheBuster = `?cb=${Date.now()}`;
  return { type: 'direct', url: `${url}${cacheBuster}` };
}

export default async function ClassPage({ params }: ClassPageProps) {
  const { classId } = params;

  if (!classId) {
    return notFound();
  }

  // Revalidate this page to ensure fresh data
  revalidatePath(`/learn/${classId}`);

  // Fetch class data from Supabase
  const { data: classData, error, columnNames = [] } = await getClassData(classId);

  if (!classData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-6">
        <div className="bg-white shadow-lg rounded-lg p-8 max-w-xl w-full">
          <h1 className="text-2xl font-bold text-center text-red-500">Class Not Found</h1>
          <p className="text-center mt-4">
            The class with ID {classId} could not be found or an error occurred while fetching the data.
          </p>
          
          {error && (
            <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-md">
              <h3 className="text-sm font-medium text-red-800">Database Error Details:</h3>
              <p className="text-xs text-red-700 mt-2">
                {error.message || 'Unknown error'}
              </p>
              
              {columnNames && columnNames.length > 0 && (
                <div className="mt-4">
                  <h4 className="text-sm font-medium text-gray-700">Available Columns:</h4>
                  <div className="mt-1 text-xs bg-gray-100 p-2 rounded">
                    {columnNames.join(', ')}
                  </div>
                  <p className="mt-2 text-xs text-gray-600 italic">
                    Try using one of these column names in your code for the ID filter.
                  </p>
                </div>
              )}
              
              <p className="mt-4 text-sm text-gray-700">
                <strong>Possible solutions:</strong>
              </p>
              <ul className="mt-2 text-xs text-gray-700 list-disc pl-4 space-y-1">
                <li>Check that the &apos;classes_dataset&apos; table exists in your database</li>
                <li>Make sure the table has a primary key column matching the URL parameter ({classId})</li>
                <li>Verify column names in your database match the ones used in the code</li>
              </ul>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Add a console log to check what data we're getting from the database
  console.log('Class data link:', classData.link);
  
  // Get video info based on the link type
  const videoInfo = classData.link ? getVideoInfo(classData.link) : { type: 'direct' as const, url: '' };
  
  // Log what we're passing to the component
  console.log('Video info being passed to components:', videoInfo);
  
  // We need to pass the data to a client component for the resizable layout
  return (
    <HeaderWithPanels 
      classData={classData} 
      videoInfo={videoInfo}
      classId={classId}
    />
  );
} 