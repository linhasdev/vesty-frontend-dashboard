"use client";

interface Subject {
  id: string;
  name: string;
  color: string;
  progress: number;
  nextClass: string;
  totalClasses: number;
  completedClasses: number;
}

interface SubjectsViewProps {
  subjects: Subject[];
}

export default function SubjectsView({ subjects }: SubjectsViewProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 px-4 pb-10 max-w-6xl mx-auto mt-6">
      {subjects.map((subject) => (
        <div 
          key={subject.id}
          className="bg-[#f0f0f0] rounded-xl p-6 hover:shadow-md transition-shadow cursor-pointer"
        >
          <div className="flex items-center mb-4">
            <div
              className="w-10 h-10 rounded-full mr-3 flex items-center justify-center text-white font-bold text-lg"
              style={{ backgroundColor: subject.color }}
            >
              {subject.name.charAt(0)}
            </div>
            <h3 className="text-xl font-medium">{subject.name}</h3>
          </div>
          
          <div className="mb-4">
            <div className="flex justify-between text-sm mb-1">
              <span>Progress</span>
              <span>{subject.progress}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="h-2 rounded-full" 
                style={{ 
                  width: `${subject.progress}%`,
                  backgroundColor: subject.color
                }}
              ></div>
            </div>
          </div>
          
          <div className="text-sm text-gray-600">
            <div className="flex justify-between mb-1">
              <span>Next class:</span>
              <span>{subject.nextClass}</span>
            </div>
            <div className="flex justify-between">
              <span>Classes:</span>
              <span>{subject.completedClasses} of {subject.totalClasses}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
} 