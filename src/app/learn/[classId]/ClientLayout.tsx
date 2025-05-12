"use client";

import React, { useState, useEffect, useRef } from 'react';
import ResizableLayout from '../../../components/Learning/ResizableLayout';
import VideoPlayer from '../../../components/Learning/VideoPlayer';
import PlaceholderContent from '../../../components/Learning/PlaceholderContent';
import ClassListContent from '../../../components/Learning/ClassListContent';
import ToolsContent from '../../../components/Learning/ToolsContent';
import VideoEventsContainer from '../../../components/Learning/dynamic_cards/VideoEventsContainer';

interface VideoInfo {
  type: 'youtube' | 'vimeo' | 'google-storage' | 'direct';
  url: string;
}

interface ClientLayoutProps {
  classData: any;
  videoInfo: VideoInfo;
  classId: string;
  classListVisible: boolean;
  onPanelStateChange?: (leftPanelVisible: boolean, rightPanelVisible: boolean, centerPanelVisible?: boolean, classListVisible?: boolean) => void;
}

// Custom component to render different video player types
const CustomVideoPlayer: React.FC<{ videoInfo: VideoInfo, onVideoRef: (element: HTMLVideoElement | null) => void }> = ({ 
  videoInfo, 
  onVideoRef 
}) => {
  const [error, setError] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  
  // Log the video info to debug
  useEffect(() => {
    console.log('CustomVideoPlayer received video info:', videoInfo);
  }, [videoInfo]);

  // Pass video element ref to parent
  useEffect(() => {
    if (videoRef.current) {
      onVideoRef(videoRef.current);
    }
    
    return () => {
      onVideoRef(null);
    };
  }, [onVideoRef, videoRef]);

  if (!videoInfo.url) {
    return (
      <div className="w-full h-0 pb-[56.25%] relative bg-gray-900">
        <div className="absolute inset-0 flex items-center justify-center text-white">
          <p className="text-lg">No video available for this class</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full h-0 pb-[56.25%] relative bg-gray-900">
        <div className="absolute inset-0 flex flex-col items-center justify-center text-white p-4">
          <p className="text-lg mb-2">Error playing video</p>
          <p className="text-sm opacity-80 text-center">There was a problem loading the video. Please try again later.</p>
          <div className="mt-4">
            <button 
              onClick={() => setError(false)} 
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (videoInfo.type === 'youtube' || videoInfo.type === 'vimeo') {
    // For YouTube or Vimeo, use iframe embed
    // Note: iframe-based players cannot be directly tracked for timestamps
    // So we cannot use the videoRef with these
    return <VideoPlayer embedUrl={videoInfo.url} />;
  } else {
    // For Google Storage and direct URLs, use HTML5 video player
    return (
      <div className="w-full h-0 pb-[56.25%] relative bg-black">
        <video 
          ref={videoRef}
          controls 
          className="absolute inset-0 w-full h-full"
          preload="metadata"
          controlsList="nodownload"
          playsInline
          onError={() => setError(true)}
        >
          <source src={videoInfo.url} type="video/mp4" />
          <source src={videoInfo.url} type="video/webm" />
          <p className="text-white text-center absolute inset-0 flex items-center justify-center">
            Your browser does not support the video tag.
          </p>
        </video>
      </div>
    );
  }
};

export default function ClientLayout({ 
  classData, 
  videoInfo, 
  classId,
  classListVisible,
  onPanelStateChange 
}: ClientLayoutProps) {
  // Get panel visibility from parent component
  // Video panel (left) is always visible
  const [leftPanelVisible] = useState(true);
  const [rightPanelVisible, setRightPanelVisible] = useState(false);
  const [centerPanelVisible, setCenterPanelVisible] = useState(true);
  const [classListPanelVisible, setClassListPanelVisible] = useState(classListVisible);
  const [videoElement, setVideoElement] = useState<HTMLVideoElement | null>(null);
  
  // Handler for receiving video element reference
  const handleVideoRef = (element: HTMLVideoElement | null) => {
    setVideoElement(element);
  };
  
  // Update classListPanelVisible when prop changes
  useEffect(() => {
    setClassListPanelVisible(classListVisible);
  }, [classListVisible]);
  
  // Handle panel toggle events
  const handlePanelToggle = (panel: 'classlist' | 'left' | 'center' | 'right', isVisible: boolean) => {
    if (panel === 'classlist') {
      setClassListPanelVisible(isVisible);
    } else if (panel === 'left') {
      // Left panel (video) is always visible - cannot be toggled
      return;
    } else if (panel === 'right') {
      setRightPanelVisible(isVisible);
    } else if (panel === 'center') {
      setCenterPanelVisible(isVisible);
    }
    
    // Notify parent component of state change
    onPanelStateChange && onPanelStateChange(
      leftPanelVisible, // Left is always true
      panel === 'right' ? isVisible : rightPanelVisible,
      panel === 'center' ? isVisible : centerPanelVisible,
      panel === 'classlist' ? isVisible : classListPanelVisible
    );
  };

  // Listen for changes in HeaderWithPanels
  useEffect(() => {
    const handlePanelChange = (event: CustomEvent) => {
      const { panel, isVisible } = event.detail;
      if (panel === 'left') {
        // Left panel is always visible - ignore any attempts to close it
        return;
      } else if (panel === 'right') {
        setRightPanelVisible(isVisible);
      } else if (panel === 'center') {
        setCenterPanelVisible(isVisible);
      } else if (panel === 'classlist') {
        setClassListPanelVisible(isVisible);
      }
    };

    // Listen for custom event from HeaderWithPanels
    window.addEventListener('panelChange' as any, handlePanelChange);
    
    return () => {
      window.removeEventListener('panelChange' as any, handlePanelChange);
    };
  }, []);
  
  // Content for class list panel
  const classListContent = (
    <ClassListContent currentClassId={classId} />
  );
  
  // Content for left panel - Video player
  const leftContent = (
    <div className="p-6 pt-8 bg-gradient-to-b from-gray-100 to-gray-200 h-full overflow-hidden">
      <div className="flex flex-col items-center overflow-hidden">
        {/* Card container with glassmorphism effect */}
        <div className="w-full bg-white/60 backdrop-blur-lg rounded-xl overflow-hidden shadow-[0_2px_4px_rgba(0,0,0,0.05)] border border-white/20 mb-3" 
          style={{ maxWidth: "95%" }}>
          {/* Video player with minimal padding */}
          <div className="p-2">
            <div className="w-full bg-black rounded-md overflow-hidden shadow-sm">
              <CustomVideoPlayer videoInfo={videoInfo} onVideoRef={handleVideoRef} />
            </div>
          </div>
        </div>
        
        {/* Video Events Container - Shows quizzes and info cards based on timestamps */}
        <div className="w-full px-2 sm:px-4" style={{ maxWidth: "95%" }}>
          <VideoEventsContainer classId={classId} videoElement={videoElement} />
        </div>
      </div>
    </div>
  );
  
  // Content for center panel - Placeholder for now
  const centerContent = (
    <PlaceholderContent 
      title="Lesson Materials" 
      subtitle="This section will contain class materials and resources"
      color="bg-gray-50"
    />
  );
  
  // Content for right panel - Tools content
  const rightContent = (
    <ToolsContent classId={classId} />
  );
  
  return (
    <div className="w-full h-[calc(100vh-56px)]">
      <ResizableLayout
        classListContent={classListContent}
        leftContent={leftContent}
        centerContent={centerContent}
        rightContent={rightContent}
        defaultClassListWidth={20}
        defaultLeftWidth={45}
        defaultRightWidth={25}
        onPanelToggle={handlePanelToggle}
        initialClassListVisible={classListPanelVisible}
        initialLeftVisible={true} // Always true
        initialRightVisible={rightPanelVisible}
        initialCenterVisible={centerPanelVisible}
      />
    </div>
  );
} 