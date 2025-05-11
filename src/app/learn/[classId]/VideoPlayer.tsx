"use client";

interface VideoPlayerProps {
  embedUrl: string;
}

export default function VideoPlayer({ embedUrl }: VideoPlayerProps) {
  return (
    <div className="w-full aspect-video bg-black rounded-md overflow-hidden shadow-md">
      {embedUrl ? (
        <iframe
          src={embedUrl}
          className="w-full h-full"
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        ></iframe>
      ) : (
        <div className="w-full h-full flex items-center justify-center bg-gray-800">
          <div className="text-center">
            <div className="flex justify-center mb-3">
              <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400">
                <path d="m21.5 2-19 19"/>
                <path d="M21.5 2 15 8.5"/>
                <path d="M15 8.5v-5h5"/>
                <path d="M2.5 22 9 15.5"/>
                <path d="M9 15.5v5H4"/>
              </svg>
            </div>
            <p className="text-gray-400">No video available for this class</p>
          </div>
        </div>
      )}
    </div>
  );
} 