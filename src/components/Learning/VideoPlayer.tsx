"use client";

import React from 'react';

interface VideoPlayerProps {
  embedUrl: string;
}

export default function VideoPlayer({ embedUrl }: VideoPlayerProps) {
  if (!embedUrl) {
    return (
      <div className="w-full h-0 pb-[56.25%] relative bg-gray-900 flex items-center justify-center">
        <div className="absolute inset-0 flex items-center justify-center text-white">
          <p className="text-lg">No video available</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-0 pb-[56.25%] relative">
      <iframe
        src={embedUrl}
        className="absolute inset-0 w-full h-full"
        frameBorder="0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        title="Video Player"
      ></iframe>
    </div>
  );
} 