"use client";

import React, { useState, useEffect } from 'react';
import ClientLayout from './ClientLayout';

interface HeaderWithPanelsProps {
  classData: any;
  embedUrl: string;
  classId: string;
}

export default function HeaderWithPanels({ classData, embedUrl, classId }: HeaderWithPanelsProps) {
  const [leftPanelVisible, setLeftPanelVisible] = useState(true);
  const [rightPanelVisible, setRightPanelVisible] = useState(false);
  const [centerPanelVisible, setCenterPanelVisible] = useState(true);
  const [classListVisible, setClassListVisible] = useState(false);
  
  // Toggle left panel and dispatch event
  const toggleLeftPanel = (isVisible: boolean) => {
    setLeftPanelVisible(isVisible);
    // Dispatch custom event to notify child components
    const event = new CustomEvent('panelChange', {
      detail: { panel: 'left', isVisible }
    });
    window.dispatchEvent(event);
  };
  
  // Toggle right panel and dispatch event
  const toggleRightPanel = (isVisible: boolean) => {
    setRightPanelVisible(isVisible);
    // Dispatch custom event to notify child components
    const event = new CustomEvent('panelChange', {
      detail: { panel: 'right', isVisible }
    });
    window.dispatchEvent(event);
  };
  
  // Toggle center panel and dispatch event
  const toggleCenterPanel = (isVisible: boolean) => {
    setCenterPanelVisible(isVisible);
    // Dispatch custom event to notify child components
    const event = new CustomEvent('panelChange', {
      detail: { panel: 'center', isVisible }
    });
    window.dispatchEvent(event);
  };
  
  // Toggle class list panel and dispatch event
  const toggleClassList = (isVisible: boolean) => {
    setClassListVisible(isVisible);
    // Dispatch custom event to notify child components
    const event = new CustomEvent('panelChange', {
      detail: { panel: 'classlist', isVisible }
    });
    window.dispatchEvent(event);
  };
  
  // Toggle class list visibility
  const handleTitleClick = () => {
    toggleClassList(!classListVisible);
  };
  
  const handlePanelStateChange = (
    leftVisible: boolean, 
    rightVisible: boolean, 
    centerVisible: boolean = centerPanelVisible,
    classListPanelVisible: boolean = classListVisible
  ) => {
    // Only update state if it changed
    if (leftVisible !== leftPanelVisible) {
      setLeftPanelVisible(leftVisible);
    }
    if (rightVisible !== rightPanelVisible) {
      setRightPanelVisible(rightVisible);
    }
    if (centerVisible !== centerPanelVisible) {
      setCenterPanelVisible(centerVisible);
    }
    if (classListPanelVisible !== classListVisible) {
      setClassListVisible(classListPanelVisible);
    }
  };
  
  return (
    <div className="flex flex-col min-h-screen">
      <div className="h-14 px-8 flex items-center justify-between bg-white shadow-[0_1px_3px_rgba(0,0,0,0.05)]">
        <div className="flex items-center ml-16">
          {/* Title as button - toggles class list panel */}
          <button 
            onClick={handleTitleClick}
            className="font-['Inter'] text-[18px] text-gray-700 font-medium hover:text-gray-900 transition-colors px-1.5 py-0.5 hover:bg-gray-50 rounded flex items-center gap-3"
          >
            {/* Play icon */}
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              width="22" 
              height="22" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2" 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              className="text-gray-700"
            >
              <circle cx="12" cy="12" r="10"/>
              <polygon points="10 8 16 12 10 16 10 8"/>
            </svg>
            
            <span>{classData.class_name || 'Untitled Class'}</span>
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              width="16" 
              height="16" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2" 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              className={`transition-transform ${classListVisible ? 'rotate-180' : ''}`}
            >
              <path d="m6 9 6 6 6-6"/>
            </svg>
          </button>
        </div>
        
        <div className="flex items-center gap-2">
          {/* Class list panel toggle button - only shown when classes panel is hidden */}
          {!classListVisible && (
            <button 
              onClick={() => toggleClassList(true)}
              className="text-gray-600 hover:text-gray-900 flex items-center gap-1.5 transition-colors text-sm p-1.5 rounded hover:bg-gray-50"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect width="18" height="18" x="3" y="3" rx="2" ry="2"/>
                <path d="M7 7h.01"/>
                <path d="M7 12h.01"/>
                <path d="M7 17h.01"/>
                <path d="M11 7h6"/>
                <path d="M11 12h6"/>
                <path d="M11 17h6"/>
              </svg>
              <span className="font-['Inter'] text-[14px]">Classes</span>
            </button>
          )}
          
          {/* Center panel toggle button - only shown when center panel is hidden */}
          {!centerPanelVisible && (
            <button 
              onClick={() => toggleCenterPanel(true)}
              className="text-gray-600 hover:text-gray-900 flex items-center gap-1.5 transition-colors text-sm p-1.5 rounded hover:bg-gray-50"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
              </svg>
              <span className="font-['Inter'] text-[14px]">Chat</span>
            </button>
          )}
          
          {/* Right panel toggle button (Tools) - only shown when right panel is hidden */}
          {!rightPanelVisible && (
            <button 
              onClick={() => toggleRightPanel(true)}
              className="text-gray-600 hover:text-gray-900 flex items-center gap-1.5 transition-colors text-sm p-1.5 rounded hover:bg-gray-50"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>
              </svg>
              <span className="font-['Inter'] text-[14px]">Tools</span>
            </button>
          )}
        </div>
      </div>
      
      <div className="flex-1 overflow-hidden">
        <ClientLayout 
          classData={classData} 
          embedUrl={embedUrl} 
          classId={classId}
          classListVisible={classListVisible}
          onPanelStateChange={handlePanelStateChange}
        />
      </div>
    </div>
  );
} 