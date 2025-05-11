"use client";

import React, { useState, useRef, useEffect } from 'react';

interface ResizableLayoutProps {
  classListContent: React.ReactNode;
  leftContent: React.ReactNode;
  centerContent: React.ReactNode;
  rightContent: React.ReactNode;
  defaultClassListWidth?: number;
  defaultLeftWidth?: number;
  defaultRightWidth?: number;
  initialClassListVisible?: boolean;
  initialLeftVisible?: boolean;
  initialRightVisible?: boolean;
  initialCenterVisible?: boolean;
  onPanelToggle?: (panel: 'classlist' | 'left' | 'center' | 'right', isVisible: boolean) => void;
}

export default function ResizableLayout({
  classListContent,
  leftContent,
  centerContent,
  rightContent,
  defaultClassListWidth = 20,
  defaultLeftWidth = 45,
  defaultRightWidth = 25,
  initialClassListVisible = false,
  initialLeftVisible = true,
  initialRightVisible = true,
  initialCenterVisible = true,
  onPanelToggle
}: ResizableLayoutProps) {
  // Store widths as percentages
  const [classListWidth, setClassListWidth] = useState(defaultClassListWidth);
  const [leftWidth, setLeftWidth] = useState(defaultLeftWidth);
  const [rightWidth, setRightWidth] = useState(defaultRightWidth);
  
  // Track which panels are visible
  const [classListVisible, setClassListVisible] = useState(initialClassListVisible);
  const [leftVisible, setLeftVisible] = useState(initialLeftVisible);
  const [rightVisible, setRightVisible] = useState(initialRightVisible);
  const [centerVisible, setCenterVisible] = useState(initialCenterVisible);
  
  // Store previous widths to restore when reopening
  const [prevClassListWidth, setPrevClassListWidth] = useState(defaultClassListWidth);
  const [prevLeftWidth, setPrevLeftWidth] = useState(defaultLeftWidth);
  const [prevRightWidth, setPrevRightWidth] = useState(defaultRightWidth);
  const [prevCenterWidth, setPrevCenterWidth] = useState(100 - defaultLeftWidth - defaultRightWidth);
  
  // Refs for resizing
  const containerRef = useRef<HTMLDivElement>(null);
  const classListResizeRef = useRef<HTMLDivElement>(null);
  const leftResizeRef = useRef<HTMLDivElement>(null);
  const rightResizeRef = useRef<HTMLDivElement>(null);
  
  // Track which divider is being dragged
  const [resizing, setResizing] = useState<'classlist' | 'left' | 'right' | null>(null);
  
  // Calculate center width based on visible panels
  const centerWidth = centerVisible 
    ? 100 - (classListVisible ? classListWidth : 0) - (leftVisible ? leftWidth : 0) - (rightVisible ? rightWidth : 0)
    : 0;
  
  // Update previous center width when it changes
  useEffect(() => {
    if (centerVisible && centerWidth > 0) {
      setPrevCenterWidth(centerWidth);
    }
  }, [centerWidth, centerVisible]);
  
  // Update visibility when props change
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (classListVisible !== initialClassListVisible) {
      setClassListVisible(initialClassListVisible);
      if (initialClassListVisible && !classListVisible) {
        setClassListWidth(prevClassListWidth);
      }
    }
    
    if (leftVisible !== initialLeftVisible) {
      setLeftVisible(initialLeftVisible);
      // If panel is being shown, restore previous width
      if (initialLeftVisible && !leftVisible) {
        setLeftWidth(prevLeftWidth);
      }
    }
    
    if (rightVisible !== initialRightVisible) {
      setRightVisible(initialRightVisible);
      // If panel is being shown, restore previous width
      if (initialRightVisible && !rightVisible) {
        setRightWidth(prevRightWidth);
      }
    }
    
    if (centerVisible !== initialCenterVisible) {
      setCenterVisible(initialCenterVisible);
      // When reopening center panel, redistribute space
      if (initialCenterVisible && !centerVisible) {
        // Restore panels to their previous proportions
        redistributePanelWidths();
      }
    }
  }, [
    initialClassListVisible, initialLeftVisible, initialRightVisible, initialCenterVisible, 
    classListVisible, leftVisible, rightVisible, centerVisible, 
    prevClassListWidth, prevLeftWidth, prevRightWidth
  ]);
  
  // Helper function to redistribute panel widths when center panel is reopened
  const redistributePanelWidths = () => {
    // Get the original proportions between panels
    const totalSidePanels = 
      (classListVisible ? prevClassListWidth : 0) + 
      (leftVisible ? prevLeftWidth : 0) + 
      (rightVisible ? prevRightWidth : 0);
    
    if (totalSidePanels === 0) return;
    
    // Target center width should be close to prevCenterWidth but adjusted for currently visible panels
    const targetCenterWidth = Math.min(prevCenterWidth, 60); // Limit max center width to 60%
    const remainingWidth = 100 - targetCenterWidth;
    
    // Count visible panels
    const visiblePanels = 
      (classListVisible ? 1 : 0) + 
      (leftVisible ? 1 : 0) + 
      (rightVisible ? 1 : 0);
      
    if (visiblePanels === 0) return;
    
    // Distribute remaining width proportionally among visible panels
    if (classListVisible) {
      setClassListWidth(remainingWidth * (prevClassListWidth / totalSidePanels));
    }
    
    if (leftVisible) {
      setLeftWidth(remainingWidth * (prevLeftWidth / totalSidePanels));
    }
    
    if (rightVisible) {
      setRightWidth(remainingWidth * (prevRightWidth / totalSidePanels));
    }
  };
  
  // If center is hidden, distribute its space proportionally to visible panels
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!centerVisible) {
      const visiblePanels = 
        (classListVisible ? 1 : 0) + 
        (leftVisible ? 1 : 0) + 
        (rightVisible ? 1 : 0);
        
      if (visiblePanels === 0) return;
      
      // Get total width of all visible panels
      const totalWidth = 
        (classListVisible ? classListWidth : 0) + 
        (leftVisible ? leftWidth : 0) + 
        (rightVisible ? rightWidth : 0);
        
      // Distribute 100% proportionally
      if (classListVisible) {
        setClassListWidth(100 * (classListWidth / totalWidth));
      }
      
      if (leftVisible) {
        setLeftWidth(100 * (leftWidth / totalWidth));
      }
      
      if (rightVisible) {
        setRightWidth(100 * (rightWidth / totalWidth));
      }
    }
  }, [centerVisible]);
  
  // Handle toggle panel visibility
  const togglePanel = (panel: 'classlist' | 'left' | 'center' | 'right') => {
    if (panel === 'classlist') {
      if (classListVisible) {
        setPrevClassListWidth(classListWidth);
        setClassListVisible(false);
      } else {
        setClassListVisible(true);
        setClassListWidth(prevClassListWidth);
        // Also redistribute other panels
        setTimeout(redistributePanelWidths, 0);
      }
      // Notify parent component
      onPanelToggle && onPanelToggle('classlist', !classListVisible);
    } else if (panel === 'left') {
      // Left panel (video player) can't be closed
      return;
    } else if (panel === 'right') {
      if (rightVisible) {
        setPrevRightWidth(rightWidth);
        setRightVisible(false);
      } else {
        setRightVisible(true);
        setRightWidth(prevRightWidth);
        // Also redistribute other panels
        setTimeout(redistributePanelWidths, 0);
      }
      // Notify parent component
      onPanelToggle && onPanelToggle('right', !rightVisible);
    } else if (panel === 'center') {
      if (centerVisible) {
        setPrevCenterWidth(centerWidth);
        setCenterVisible(false);
      } else {
        setCenterVisible(true);
        // Redistribute panel widths
        setTimeout(redistributePanelWidths, 0);
      }
      // Notify parent component
      onPanelToggle && onPanelToggle('center', !centerVisible);
    }
  };
  
  // Handle mouse down on resize dividers
  const handleMouseDown = (position: 'classlist' | 'left' | 'right') => (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    setResizing(position);
  };
  
  // Handle touch events for mobile
  const handleTouchStart = (position: 'classlist' | 'left' | 'right') => (e: React.TouchEvent) => {
    e.preventDefault();
    setResizing(position);
  };
  
  // Handle mouse move to resize columns
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent | TouchEvent) => {
      if (!resizing || !containerRef.current) return;
      
      const containerRect = containerRef.current.getBoundingClientRect();
      const containerWidth = containerRect.width;
      
      // Get mouse/touch position
      let clientX;
      if (e instanceof MouseEvent) {
        clientX = e.clientX;
      } else {
        clientX = e.touches[0].clientX;
      }
      
      const mouseX = clientX - containerRect.left;
      
      // Calculate percentage of total width
      const percentage = (mouseX / containerWidth) * 100;
      
      if (resizing === 'classlist') {
        // Ensure minimum widths (5% for all columns)
        const maxWidth = 100 - 15; // Reserve at least 5% for each of the other three panels
        const newClassListWidth = Math.max(5, Math.min(maxWidth, percentage));
        setClassListWidth(newClassListWidth);
      } else if (resizing === 'left') {
        // Adjust based on class list width if visible
        const offset = classListVisible ? classListWidth : 0;
        
        if (centerVisible) {
          // Normal behavior when center panel is visible
          const maxWidth = 100 - offset - 10; // Reserve at least 5% each for center and right
          const newLeftWidth = Math.max(5, Math.min(maxWidth, percentage - offset));
          setLeftWidth(newLeftWidth);
        } else if (rightVisible) {
          // When center is hidden but right is visible, left resizing directly affects right width
          const newLeftWidth = Math.max(5, Math.min(95 - offset, percentage - offset));
          setLeftWidth(newLeftWidth);
          // Update right width to fill remaining space
          setRightWidth(100 - newLeftWidth - offset);
        }
      } else if (resizing === 'right') {
        // For right divider, calculate from the right edge
        const rightEdgeX = containerWidth - mouseX;
        const rightPercentage = (rightEdgeX / containerWidth) * 100;
        
        const offset = classListVisible ? classListWidth : 0;
        
        if (centerVisible) {
          // Normal behavior when center is visible
          // Ensure minimum widths
          const newRightWidth = Math.max(5, Math.min(90 - (leftVisible ? leftWidth : 0) - offset, rightPercentage));
          setRightWidth(newRightWidth);
        } else if (leftVisible) {
          // When center is hidden but left is visible, right resizing directly affects left width
          const newRightWidth = Math.max(5, Math.min(95 - offset, rightPercentage));
          setRightWidth(newRightWidth);
          // Update left width to fill remaining space
          setLeftWidth(100 - newRightWidth - offset);
        }
      }
    };
    
    const handleMouseUp = () => {
      setResizing(null);
    };
    
    if (resizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.addEventListener('touchmove', handleMouseMove);
      document.addEventListener('touchend', handleMouseUp);
    }
    
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('touchmove', handleMouseMove);
      document.removeEventListener('touchend', handleMouseUp);
    };
  }, [resizing, classListWidth, leftWidth, rightWidth, classListVisible, leftVisible, rightVisible, centerVisible]);
  
  // If only the left panel is visible, give it 100% width
  useEffect(() => {
    if (leftVisible && !centerVisible && !rightVisible && !classListVisible) {
      setLeftWidth(100);
    }
  }, [leftVisible, centerVisible, rightVisible, classListVisible]);
  
  return (
    <div 
      ref={containerRef} 
      className="flex w-full h-full relative"
      style={{ cursor: resizing ? 'col-resize' : 'default' }}
    >
      {/* Class List panel */}
      {classListVisible && (
        <div 
          className="h-full overflow-auto relative"
          style={{ width: `${classListWidth}%` }}
        >
          <button 
            onClick={() => togglePanel('classlist')}
            className="absolute top-2 right-2 z-10 p-1.5 rounded-full bg-white/60 backdrop-blur-sm shadow-sm hover:bg-white/80 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-600">
              <path d="M18 6 6 18" />
              <path d="m6 6 12 12" />
            </svg>
          </button>
          {classListContent}
        </div>
      )}
      
      {/* Class List resize handle */}
      {classListVisible && (
        <div 
          ref={classListResizeRef}
          className={`
            w-3 h-full cursor-col-resize transition-colors duration-150 flex items-center justify-center z-10
            ${resizing === 'classlist' ? 'bg-blue-400' : 'hover:bg-blue-400/50 bg-gray-300/30'}
          `}
          onMouseDown={handleMouseDown('classlist')}
          onTouchStart={handleTouchStart('classlist')}
        >
          <div className="h-8 w-[3px] rounded-full bg-gray-400/60"></div>
        </div>
      )}
      
      {/* Left column */}
      {leftVisible && (
        <div 
          className="h-full overflow-auto relative"
          style={{ width: `${leftWidth}%` }}
        >
          {leftContent}
        </div>
      )}
      
      {/* Left resize handle - shown when center is visible */}
      {leftVisible && centerVisible && (
        <div 
          ref={leftResizeRef}
          className={`
            w-3 h-full cursor-col-resize transition-colors duration-150 flex items-center justify-center z-10
            ${resizing === 'left' ? 'bg-blue-400' : 'hover:bg-blue-400/50 bg-gray-300/30'}
          `}
          onMouseDown={handleMouseDown('left')}
          onTouchStart={handleTouchStart('left')}
        >
          <div className="h-8 w-[3px] rounded-full bg-gray-400/60"></div>
        </div>
      )}
      
      {/* Special resize handle for when left and right panels are visible but center is not */}
      {leftVisible && rightVisible && !centerVisible && (
        <div 
          ref={leftResizeRef}
          className={`
            w-3 h-full cursor-col-resize transition-colors duration-150 flex items-center justify-center z-10
            ${resizing === 'left' ? 'bg-blue-400' : 'hover:bg-blue-400/50 bg-gray-300/30'}
          `}
          onMouseDown={handleMouseDown('left')}
          onTouchStart={handleTouchStart('left')}
        >
          <div className="h-8 w-[3px] rounded-full bg-gray-400/60"></div>
        </div>
      )}
      
      {/* Center column */}
      {centerVisible && (
        <div 
          className="h-full overflow-auto relative"
          style={{ width: `${centerWidth}%` }}
        >
          <button 
            onClick={() => togglePanel('center')}
            className="absolute top-2 right-2 z-10 p-1.5 rounded-full bg-white/60 backdrop-blur-sm shadow-sm hover:bg-white/80 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-600">
              <path d="M18 6 6 18" />
              <path d="m6 6 12 12" />
            </svg>
          </button>
          {centerContent}
        </div>
      )}
      
      {/* Right resize handle */}
      {rightVisible && centerVisible && (
        <div 
          ref={rightResizeRef}
          className={`
            w-3 h-full cursor-col-resize transition-colors duration-150 flex items-center justify-center z-10
            ${resizing === 'right' ? 'bg-blue-400' : 'hover:bg-blue-400/50 bg-gray-300/30'}
          `}
          onMouseDown={handleMouseDown('right')}
          onTouchStart={handleTouchStart('right')}
        >
          <div className="h-8 w-[3px] rounded-full bg-gray-400/60"></div>
        </div>
      )}
      
      {/* Right column */}
      {rightVisible && (
        <div 
          className="h-full overflow-auto relative"
          style={{ width: `${rightWidth}%` }}
        >
          <button 
            onClick={() => togglePanel('right')}
            className="absolute top-2 left-2 z-10 p-1.5 rounded-full bg-white/60 backdrop-blur-sm shadow-sm hover:bg-white/80 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-600">
              <path d="M18 6 6 18" />
              <path d="m6 6 12 12" />
            </svg>
          </button>
          {rightContent}
        </div>
      )}
    </div>
  );
} 