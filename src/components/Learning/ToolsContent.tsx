"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useDesmos } from '../../app/lib/hooks/useDesmos';

interface Tool {
  id: string;
  name: string;
  icon: React.ReactNode;
  available: boolean;
}

interface ToolsContentProps {
  classId: string;
}

export default function ToolsContent({ classId }: ToolsContentProps) {
  const [activeToolId, setActiveToolId] = useState<string | null>(null);
  const { containerRef, initialize } = useDesmos();
  
  // Use useCallback to memoize the function that initializes the calculator
  const initializeCalculator = useCallback(() => {
    if (activeToolId === 'calculator') {
      initialize();
    }
  }, [activeToolId, initialize]);
  
  // Initialize calculator when the calculator tool is selected
  useEffect(() => {
    initializeCalculator();
  }, [initializeCalculator]);
  
  // Define the available tools
  const tools: Tool[] = [
    {
      id: 'calculator',
      name: 'Calculator',
      available: true,
      icon: (
        // eslint-disable-next-line @next/next/no-img-element
        <img 
          src="https://storage.googleapis.com/test2324234242/calculator.webp" 
          alt="Calculator icon"
          className="w-full h-full object-contain"
        />
      ),
    },
    {
      id: 'book',
      name: 'Book',
      available: true,
      icon: (
        // eslint-disable-next-line @next/next/no-img-element
        <img 
          src="https://storage.googleapis.com/test2324234242/tl.webp" 
          alt="Book icon"
          className="w-full h-full object-contain"
        />
      ),
    },
    {
      id: 'science',
      name: 'Science',
      available: true,
      icon: (
        // eslint-disable-next-line @next/next/no-img-element
        <img 
          src="https://storage.googleapis.com/test2324234242/atom.webp" 
          alt="Science icon"
          className="w-full h-full object-contain"
        />
      ),
    },
    {
      id: 'globe',
      name: 'Globe',
      available: false, // Example of an unavailable tool
      icon: (
        // eslint-disable-next-line @next/next/no-img-element
        <img 
          src="https://storage.googleapis.com/test2324234242/world.webp" 
          alt="Globe icon"
          className="w-full h-full object-contain"
        />
      ),
    },
    {
      id: 'broadcast',
      name: 'Broadcast',
      available: true,
      icon: (
        // eslint-disable-next-line @next/next/no-img-element
        <img 
          src="https://storage.googleapis.com/test2324234242/antena.webp" 
          alt="Broadcast icon"
          className="w-full h-full object-contain"
        />
      ),
    },
  ];
  
  // Handle tool selection
  const handleToolSelect = (toolId: string) => {
    if (tools.find(tool => tool.id === toolId)?.available) {
      setActiveToolId(toolId === activeToolId ? null : toolId);
    }
  };
  
  return (
    <div className="h-full bg-gray-50 flex flex-col">
      {/* Tool navigation pill */}
      <div className="px-4 pt-8 pb-2">
        <div className="bg-gray-200 rounded-full py-2 px-2 flex justify-evenly items-center max-w-xs mx-auto shadow-sm gap-1">
          {tools.map((tool) => (
            <button
              key={tool.id}
              onClick={() => handleToolSelect(tool.id)}
              className={`
                ${activeToolId === tool.id ? 'bg-white shadow-md' : ''}
                ${!tool.available ? 'opacity-40 cursor-not-allowed text-gray-400' : 'text-gray-600 hover:bg-white/50'}
                rounded-full p-1 transition-all duration-200 flex items-center justify-center w-8 h-8
              `}
              disabled={!tool.available}
              title={tool.name}
            >
              <div className="w-5 h-5">
                {tool.icon}
              </div>
            </button>
          ))}
        </div>
      </div>
      
      {/* Tool content area */}
      <div className="flex-1 overflow-auto">
        {activeToolId ? (
          <>
            {/* Desmos calculator - full height with no card */}
            {activeToolId === 'calculator' && (
              <div 
                ref={containerRef}
                className="w-full h-full min-h-[calc(100vh-140px)]"
              ></div>
            )}
            
            {/* Other tools */}
            {activeToolId !== 'calculator' && (
              <div className="h-full p-4">
                <h3 className="text-lg font-medium mb-4">{tools.find(t => t.id === activeToolId)?.name}</h3>
                
                {activeToolId === 'book' && (
                  <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <p className="text-gray-600">Book reference tool will be implemented here</p>
                  </div>
                )}
                
                {activeToolId === 'science' && (
                  <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <p className="text-gray-600">Science tool will be implemented here</p>
                  </div>
                )}
                
                {activeToolId === 'globe' && (
                  <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <p className="text-gray-600">Globe tool will be implemented here</p>
                  </div>
                )}
                
                {activeToolId === 'broadcast' && (
                  <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <p className="text-gray-600">Broadcast tool will be implemented here</p>
                  </div>
                )}
              </div>
            )}
          </>
        ) : (
          <div className="flex flex-col items-center justify-center h-full p-4">
            <h3 className="text-lg font-medium text-gray-500">Select a tool to get started</h3>
            <p className="text-sm text-gray-400 mt-2">Choose from the options above</p>
          </div>
        )}
      </div>
    </div>
  );
} 