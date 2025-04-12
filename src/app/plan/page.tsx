"use client";

import { useState } from 'react';
import ViewPill from '../../components/plan/ViewPill';
import YourClassesView from '../../components/plan/YourClassesView';
import CalendarView from '../../components/plan/CalendarView';
import SubjectsView from '../../components/plan/SubjectsView';
import ProgressView from '../../components/plan/ProgressView';

// Mock data for Your Classes view
const classDaysData = [
  {
    date: "Apr 11, 2025",
    dayName: "Thursday",
    displayName: "Yesterday",
    subjects: [
      { 
        name: "Mathematics", 
        color: "#F87171", 
        timeRanges: ["09:00 - 10:30", "14:00 - 15:30"] 
      },
      { 
        name: "Physics", 
        color: "#60A5FA", 
        timeRanges: ["13:00 - 14:30"] 
      }
    ]
  },
  {
    date: "Apr 12, 2025",
    dayName: "Friday",
    displayName: "Today",
    subjects: [
      { 
        name: "Mathematics", 
        color: "#F87171", 
        timeRanges: ["09:00 - 10:30"] 
      },
      { 
        name: "Chemistry", 
        color: "#34D399", 
        timeRanges: ["11:00 - 12:30", "16:30 - 18:00"] 
      },
      { 
        name: "History", 
        color: "#FBBF24", 
        timeRanges: ["14:00 - 15:30"] 
      },
      { 
        name: "English Literature", 
        color: "#EC4899", 
        timeRanges: ["16:00 - 17:30"] 
      },
      { 
        name: "Computer Science", 
        color: "#8B5CF6", 
        timeRanges: ["18:00 - 19:30", "19:45 - 21:15"] 
      },
      { 
        name: "Art & Design", 
        color: "#F59E0B", 
        timeRanges: ["19:45 - 20:45"] 
      },
      { 
        name: "Physical Education", 
        color: "#10B981", 
        timeRanges: ["21:00 - 22:00"] 
      }
    ]
  },
  {
    date: "Apr 13, 2025",
    dayName: "Saturday",
    displayName: "Tomorrow",
    subjects: []
  },
  {
    date: "Apr 14, 2025",
    dayName: "Sunday",
    displayName: "Apr 14",
    subjects: []
  },
  {
    date: "Apr 15, 2025",
    dayName: "Monday",
    displayName: "Apr 15",
    subjects: [
      { 
        name: "Biology", 
        color: "#A78BFA", 
        timeRanges: ["10:00 - 11:30", "15:00 - 16:30"] 
      },
      { 
        name: "English", 
        color: "#EC4899", 
        timeRanges: ["13:00 - 14:30"] 
      },
      { 
        name: "Geography", 
        color: "#6366F1", 
        timeRanges: ["15:00 - 16:30"] 
      },
      { 
        name: "Foreign Languages", 
        color: "#F472B6", 
        timeRanges: ["17:00 - 18:30"] 
      }
    ]
  }
];

// Mock data for Calendar view
const calendarData = [
  {
    month: "April",
    year: 2025,
    days: Array(35).fill(null).map((_, index) => {
      // First day of April 2025 is Tuesday (index 2)
      const dayNumber = index - 1; // 0-indexed, starting from March 31
      const isCurrentMonth = dayNumber >= 0 && dayNumber < 30;
      const date = isCurrentMonth ? dayNumber + 1 : (dayNumber < 0 ? 31 + dayNumber : dayNumber - 29);
      
      // Generate random subjects for some days
      const subjects = [];
      if (isCurrentMonth) {
        // Special case for April 12 (today)
        if (date === 12) {
          subjects.push(
            { name: "Mathematics", color: "#F87171" },
            { name: "Chemistry", color: "#34D399" },
            { name: "History", color: "#FBBF24" },
            { name: "English", color: "#EC4899" }
          );
        } 
        // Random subjects for other days
        else if (Math.random() > 0.6) {
          const numSubjects = Math.floor(Math.random() * 3) + 1;
          const subjectOptions = [
            { name: "Math", color: "#F87171" },
            { name: "Physics", color: "#60A5FA" },
            { name: "Chemistry", color: "#34D399" },
            { name: "Biology", color: "#A78BFA" },
            { name: "History", color: "#FBBF24" },
            { name: "English", color: "#EC4899" }
          ];
          
          for (let i = 0; i < numSubjects; i++) {
            const randomIndex = Math.floor(Math.random() * subjectOptions.length);
            subjects.push(subjectOptions[randomIndex]);
          }
        }
      }
      
      return {
        date,
        isCurrentMonth,
        subjects
      };
    })
  },
  {
    month: "May",
    year: 2025,
    days: Array(35).fill(null).map((_, index) => {
      // First day of May 2025 is Thursday (index 4)
      const dayNumber = index - 3; // 0-indexed, starting from April 28
      const isCurrentMonth = dayNumber >= 0 && dayNumber < 31;
      const date = isCurrentMonth ? dayNumber + 1 : (dayNumber < 0 ? 30 + dayNumber : dayNumber - 30);
      
      // Generate random subjects for some days
      const subjects = [];
      if (isCurrentMonth && Math.random() > 0.6) {
        const numSubjects = Math.floor(Math.random() * 3) + 1;
        const subjectOptions = [
          { name: "Math", color: "#F87171" },
          { name: "Physics", color: "#60A5FA" },
          { name: "Chemistry", color: "#34D399" },
          { name: "Biology", color: "#A78BFA" },
          { name: "History", color: "#FBBF24" },
          { name: "English", color: "#EC4899" }
        ];
        
        for (let i = 0; i < numSubjects; i++) {
          const randomIndex = Math.floor(Math.random() * subjectOptions.length);
          subjects.push(subjectOptions[randomIndex]);
        }
      }
      
      return {
        date,
        isCurrentMonth,
        subjects
      };
    })
  }
];

// Mock data for Subjects view
const subjectsData = [
  {
    id: "math-101",
    name: "Mathematics",
    color: "#F87171",
    progress: 65,
    nextClass: "Apr 15, 09:00",
    totalClasses: 30,
    completedClasses: 20
  },
  {
    id: "phys-101",
    name: "Physics",
    color: "#60A5FA",
    progress: 45,
    nextClass: "Apr 18, 13:00",
    totalClasses: 25,
    completedClasses: 11
  },
  {
    id: "chem-101",
    name: "Chemistry",
    color: "#34D399",
    progress: 78,
    nextClass: "Apr 14, 11:00",
    totalClasses: 28,
    completedClasses: 22
  },
  {
    id: "bio-101",
    name: "Biology",
    color: "#A78BFA",
    progress: 32,
    nextClass: "Apr 17, 10:00",
    totalClasses: 24,
    completedClasses: 8
  },
  {
    id: "hist-101",
    name: "History",
    color: "#FBBF24",
    progress: 90,
    nextClass: "Apr 19, 14:00",
    totalClasses: 20,
    completedClasses: 18
  },
  {
    id: "eng-101",
    name: "English",
    color: "#EC4899",
    progress: 55,
    nextClass: "Apr 16, 13:00",
    totalClasses: 22,
    completedClasses: 12
  }
];

export default function PlanPage() {
  const views = ["Your Classes", "Calendar", "Subjects", "Progress"];
  const [currentView, setCurrentView] = useState(views[0]);

  return (
    <div className="w-full min-h-[90vh] flex flex-col">
      <ViewPill
        currentView={currentView}
        views={views}
        onChangeView={setCurrentView}
      />
      
      <div className="flex-1">
        {currentView === "Your Classes" && (
          <YourClassesView data={classDaysData} />
        )}
        
        {currentView === "Calendar" && (
          <CalendarView data={calendarData} />
        )}
        
        {currentView === "Subjects" && (
          <SubjectsView subjects={subjectsData} />
        )}
        
        {currentView === "Progress" && (
          <ProgressView />
        )}
      </div>
    </div>
  );
} 