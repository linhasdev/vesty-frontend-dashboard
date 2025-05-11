"use client";

import React, { useState, useEffect } from 'react';
import ResizableLayout from './ResizableLayout';
import VideoPlayer from './VideoPlayer';
import PlaceholderContent from './PlaceholderContent';
import ClassListContent from './ClassListContent';
import ToolsContent from './ToolsContent';

interface ClientLayoutProps {
  classData: any;
  embedUrl: string;
  classId: string;
  classListVisible: boolean;
  onPanelStateChange?: (leftPanelVisible: boolean, rightPanelVisible: boolean, centerPanelVisible?: boolean, classListVisible?: boolean) => void;
}

export default function ClientLayout({ 
  classData, 
  embedUrl, 
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
    <div className="p-4 bg-gray-100 h-full">
      <div className="bg-black rounded-md overflow-hidden shadow-md">
        <VideoPlayer embedUrl={embedUrl} />
      </div>
      
      {classData.description && (
        <div className="mt-4 bg-white rounded-md p-4 shadow-sm border border-gray-100">
          <h3 className="text-xs font-medium text-gray-700 mb-2">Description</h3>
          <p className="text-sm text-gray-600">{classData.description}</p>
        </div>
      )}
      
      <div className="mt-4 bg-white/60 backdrop-blur-sm rounded-md p-4 shadow-sm border border-gray-100">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-medium text-gray-700">Class Information</h3>
          <span className="text-xs text-gray-500">ID: {classId}</span>
        </div>
        
        <div className="mt-3 space-y-2">
          <div className="flex items-center text-xs text-gray-600">
            <span className="w-20 text-gray-500">Subject:</span>
            <span>{classData.subject_name || 'Not specified'}</span>
          </div>
          
          <div className="flex items-center text-xs text-gray-600">
            <span className="w-20 text-gray-500">Duration:</span>
            <span>{classData.duration ? `${Math.ceil(classData.duration / 60)} min` : 'Not specified'}</span>
          </div>
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