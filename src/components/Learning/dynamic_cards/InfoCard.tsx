"use client";

import React, { useState } from 'react';
import Image from 'next/image';
import { InfoPayload } from '@/app/lib/hooks/useVideoEvents';

// Define new structure for info card payload
interface MediaContent {
  type: 'image' | 'video' | 'pdf';
  src: string;
  alt: string;
}

interface StructuredInfoPayload {
  title?: string | null;
  text?: string | null;
  media?: MediaContent | null;
}

interface InfoCardProps {
  info: InfoPayload | StructuredInfoPayload;
  onClose: () => void;
}

export default function InfoCard({ info, onClose }: InfoCardProps) {
  const [imageError, setImageError] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  
  // Handle both old and new payload formats
  const getTitle = () => {
    if ('title' in info && info.title) {
      return info.title;
    } else if ('description' in info && 'title' in info) {
      return info.title;
    }
    return null;
  };

  const getText = () => {
    if ('text' in info && info.text) {
      return info.text;
    } else if ('description' in info) {
      return info.description;
    }
    return null;
  };

  const getMedia = () => {
    if ('media' in info && info.media) {
      return info.media;
    } else if ('imageUrl' in info && info.imageUrl) {
      return {
        type: 'image' as const,
        src: info.imageUrl,
        alt: getTitle() || 'Information image'
      };
    }
    return null;
  };
  
  const handleClose = () => {
    setIsClosing(true);
    // Delay actual closing to allow animation to play
    setTimeout(() => {
      onClose();
    }, 300); // Reduced duration for just the fade out
  };

  const title = getTitle();
  const text = getText();
  const media = getMedia();
  
  // Check if we only have media (no title and no text)
  const isMediaOnly = !title && !text && media;

  // Check if URL is from Google Storage
  const isGoogleStorageUrl = (url: string) => {
    return url?.includes('storage.googleapis.com');
  };

  return (
    <>
      <style jsx>{`
        /* Card container animation */
        .card-container {
          position: relative;
          overflow: hidden;
          animation: fadeIn 0.8s ease forwards;
          transition: opacity 0.3s ease;
        }
        
        .card-closing {
          opacity: 0;
        }
        
        /* Card reveal animation */
        .card-container::after {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: linear-gradient(to right, transparent, white 50%);
          animation: revealCard 1.2s ease-out forwards;
          z-index: 5;
          pointer-events: none;
          border-radius: inherit;
        }
        
        /* Text container animation */
        .text-container {
          position: relative;
          overflow: hidden;
        }
        
        @keyframes fadeIn {
          0% { opacity: 0; }
          100% { opacity: 1; }
        }
        
        .fade-in-text {
          animation: fadeIn 1s ease forwards;
          animation-delay: 0.4s;
          opacity: 0;
        }
        
        /* Overlay that moves from left to right */
        .text-container::after {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: linear-gradient(to right, transparent, white 50%);
          animation: revealText 1.2s ease-out forwards;
          animation-delay: 0.4s;
          border-radius: inherit;
        }
        
        @keyframes revealText {
          0% {
            transform: translateX(0%);
          }
          100% {
            transform: translateX(100%);
          }
        }
        
        @keyframes revealCard {
          0% {
            transform: translateX(0%);
          }
          100% {
            transform: translateX(100%);
          }
        }
      `}</style>

      <div className={`card-container backdrop-blur-lg bg-white/70 rounded-xl shadow-lg overflow-hidden border border-white/30 max-w-full w-full ${isMediaOnly ? 'media-only-card' : ''} ${isClosing ? 'card-closing' : ''}`}>
        {/* Close button - glassmorphism style */}
        <div className="absolute top-3 right-3 z-10">
          <button 
            onClick={handleClose}
            className="backdrop-blur-md bg-white/40 rounded-full p-2 hover:bg-white/60 transition-all shadow-sm"
            aria-label="Close"
          >
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              width="16" 
              height="16" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="rgba(28, 28, 30, 0.8)" 
              strokeWidth="2" 
              strokeLinecap="round" 
              strokeLinejoin="round"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
        
        {/* Content - with conditional rendering based on available content */}
        <div className={`${isMediaOnly ? 'p-0' : 'px-8 pt-6 pb-8'}`}>
          {/* For cards with text and media - implement responsive layout */}
          {!isMediaOnly && title && text && media ? (
            <div className="flex flex-col lg:flex-row lg:gap-8">
              {/* Text content */}
              <div className="lg:flex-1">
                <h4 className="text-[30px] font-semibold text-[#1C1C1E] font-inter mb-1 fade-in-text leading-tight">{title}</h4>
                <div className="text-[#1C1C1E] mb-6 lg:mb-0 text-container">
                  <p className="text-[14px] font-normal font-inter whitespace-pre-line leading-relaxed fade-in-text">
                    {text}
                  </p>
                </div>
              </div>
              
              {/* Media content - on right for large screens */}
              <div className="mt-6 lg:mt-0 lg:flex-1 fade-in-text">
                {media.type === 'image' && (
                  <div className="relative w-full h-64 rounded-lg overflow-hidden shadow-md">
                    {isGoogleStorageUrl(media.src) || imageError ? (
                      <img 
                        src={media.src}
                        alt={media.alt}
                        className="object-cover w-full h-full rounded-lg"
                      />
                    ) : (
                      <Image 
                        src={media.src} 
                        alt={media.alt}
                        fill
                        className="object-cover rounded-lg"
                        onError={() => setImageError(true)}
                      />
                    )}
                  </div>
                )}
                
                {media.type === 'video' && (
                  <div className="relative w-full h-auto rounded-lg overflow-hidden shadow-md">
                    <video 
                      className="w-full rounded-lg"
                      src={media.src}
                      controls
                      aria-label={media.alt}
                      preload="metadata"
                    />
                  </div>
                )}
                
                {media.type === 'pdf' && (
                  <div className="flex flex-col items-center space-y-2">
                    <object 
                      data={media.src} 
                      type="application/pdf"
                      className="w-full h-64 rounded-lg border border-gray-200 shadow-md"
                    >
                      <div className="p-4 bg-gray-100 rounded-lg text-center">
                        <p>Unable to display PDF.</p>
                        <a 
                          href={media.src} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="mt-2 inline-block text-blue-600 hover:underline"
                        >
                          Download PDF
                        </a>
                      </div>
                    </object>
                    <a 
                      href={media.src} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 hover:underline"
                    >
                      Open PDF in new tab
                    </a>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <>
              {/* Title only if present - for media-only or text-only cards */}
              {title && (
                <h4 className="text-[30px] font-semibold text-[#1C1C1E] font-inter mb-1 fade-in-text leading-tight">{title}</h4>
              )}
              
              {/* Text only if present - for text-only cards */}
              {text && !media && (
                <div className="text-[#1C1C1E] mb-6 text-container">
                  <p className="text-[14px] font-normal font-inter whitespace-pre-line leading-relaxed fade-in-text">
                    {text}
                  </p>
                </div>
              )}
              
              {/* Media only if present - for media-only cards */}
              {media && !text && (
                <div className={`${!isMediaOnly ? 'mt-6' : ''} fade-in-text`}>
                  {media.type === 'image' && (
                    <div className={`relative ${isMediaOnly ? 'w-full h-80' : 'w-full h-64'} rounded-lg overflow-hidden ${!isMediaOnly ? 'shadow-md' : ''}`}>
                      {isGoogleStorageUrl(media.src) || imageError ? (
                        <img 
                          src={media.src}
                          alt={media.alt}
                          className="object-cover w-full h-full rounded-lg"
                        />
                      ) : (
                        <Image 
                          src={media.src} 
                          alt={media.alt}
                          fill
                          className="object-cover rounded-lg"
                          onError={() => setImageError(true)}
                        />
                      )}
                    </div>
                  )}
                  
                  {media.type === 'video' && (
                    <div className={`relative w-full h-auto rounded-lg overflow-hidden ${!isMediaOnly ? 'shadow-md' : ''}`}>
                      <video 
                        className="w-full rounded-lg"
                        src={media.src}
                        controls
                        aria-label={media.alt}
                        preload="metadata"
                      />
                    </div>
                  )}
                  
                  {media.type === 'pdf' && (
                    <div className="flex flex-col items-center space-y-2">
                      <object 
                        data={media.src} 
                        type="application/pdf"
                        className={`w-full ${isMediaOnly ? 'h-[600px]' : 'h-64'} rounded-lg border border-gray-200 ${!isMediaOnly ? 'shadow-md' : ''}`}
                      >
                        <div className="p-4 bg-gray-100 rounded-lg text-center">
                          <p>Unable to display PDF.</p>
                          <a 
                            href={media.src} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="mt-2 inline-block text-blue-600 hover:underline"
                          >
                            Download PDF
                          </a>
                        </div>
                      </object>
                      <a 
                        href={media.src} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-sm text-blue-600 hover:underline"
                      >
                        Open PDF in new tab
                      </a>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
} 