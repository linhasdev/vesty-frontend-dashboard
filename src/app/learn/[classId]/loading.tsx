export default function Loading() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-6">
      <div className="w-full max-w-5xl mx-auto flex flex-col items-center">
        {/* Skeleton for back button */}
        <div className="w-20 h-8 bg-gray-200 rounded-md animate-pulse mb-4 self-start"></div>
        
        {/* Skeleton for title */}
        <div className="w-full flex flex-col gap-2 mb-6">
          <div className="h-10 bg-gray-200 rounded-md animate-pulse w-3/4"></div>
          <div className="h-4 bg-gray-200 rounded-md animate-pulse w-1/4"></div>
        </div>
        
        {/* Skeleton for video player */}
        <div className="w-full aspect-video bg-gray-200 rounded-lg animate-pulse mb-6"></div>
        
        {/* Skeleton for details */}
        <div className="w-full p-6 bg-white rounded-lg shadow-md">
          <div className="h-6 bg-gray-200 rounded-md animate-pulse w-40 mb-4"></div>
          <div className="space-y-2">
            <div className="h-4 bg-gray-200 rounded-md animate-pulse w-full"></div>
            <div className="h-4 bg-gray-200 rounded-md animate-pulse w-5/6"></div>
            <div className="h-4 bg-gray-200 rounded-md animate-pulse w-4/6"></div>
          </div>
        </div>
      </div>
    </div>
  );
} 