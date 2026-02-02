import React, { useState, useEffect } from 'react';
import { SUBJECTS, LESSONS } from '../constants';
import { Subject } from '../types';

interface ScheduleEvent {
  dayOfWeek: number; // 1 = Monday, 5 = Friday
  startTime: string;
  endTime: string;
  subjectId: string;
}

// 5th Period Schedule Template
const SCHEDULE_TEMPLATE: ScheduleEvent[] = [
  // Monday
  { dayOfWeek: 1, startTime: "07:00", endTime: "08:40", subjectId: 'pna' },
  { dayOfWeek: 1, startTime: "08:50", endTime: "10:30", subjectId: 'semio-sist' },
  { dayOfWeek: 1, startTime: "10:50", endTime: "12:30", subjectId: 'semio-sist' },

  // Tuesday
  { dayOfWeek: 2, startTime: "07:00", endTime: "08:40", subjectId: 'anat-patol' },
  { dayOfWeek: 2, startTime: "08:50", endTime: "10:30", subjectId: 'anat-patol' },
  { dayOfWeek: 2, startTime: "10:50", endTime: "12:30", subjectId: 'farma-med' },

  // Wednesday
  { dayOfWeek: 3, startTime: "07:00", endTime: "08:40", subjectId: 'mbe' },
  { dayOfWeek: 3, startTime: "08:50", endTime: "10:30", subjectId: 'semio-sist' },
  { dayOfWeek: 3, startTime: "10:50", endTime: "12:30", subjectId: 'semio-sist' },

  // Thursday
  { dayOfWeek: 4, startTime: "07:00", endTime: "08:40", subjectId: 'anat-patol' },
  { dayOfWeek: 4, startTime: "08:50", endTime: "10:30", subjectId: 'anat-patol' },
  { dayOfWeek: 4, startTime: "10:50", endTime: "12:30", subjectId: 'farma-med' },

  // Friday
  { dayOfWeek: 5, startTime: "07:00", endTime: "08:40", subjectId: 'pna' },
  { dayOfWeek: 5, startTime: "08:50", endTime: "10:30", subjectId: 'semio-sist' },
  { dayOfWeek: 5, startTime: "10:50", endTime: "12:30", subjectId: 'semio-sist' },
];

interface ScheduleViewProps {
  onNavigateToClass: (subjectId: string) => void;
  initialDate?: Date;
}

const ScheduleView: React.FC<ScheduleViewProps> = ({ onNavigateToClass, initialDate }) => {
  // Start and End of the Semester
  const SEMESTER_START = new Date(2026, 1, 9); // Feb 9, 2026 (Month is 0-indexed)
  const SEMESTER_END = new Date(2026, 3, 10); // Apr 10, 2026

  // Exam Week (No Classes)
  const EXAM_START = new Date(2026, 3, 14); // Apr 14, 2026
  const EXAM_END = new Date(2026, 3, 17);   // Apr 17, 2026

  const [currentDate, setCurrentDate] = useState<Date>(() => {
    // If initialDate is passed and valid within range, use it
    if (initialDate && initialDate >= SEMESTER_START && initialDate <= SEMESTER_END) {
        return initialDate;
    }
    
    // Default: Check if today is within range, otherwise start at beginning
    const today = new Date();
    // For demo purposes, if today is way off, we default to the start of the semester
    if (today < SEMESTER_START || today > EXAM_END) {
        return SEMESTER_START;
    }
    return today;
  });

  // Helpers
  const getWeekStart = (date: Date) => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
    return new Date(d.setDate(diff));
  };

  const addWeeks = (date: Date, weeks: number) => {
    const d = new Date(date);
    d.setDate(d.getDate() + weeks * 7);
    return d;
  };

  const formatDayNumber = (date: Date) => {
      return date.getDate().toString();
  };
  
  const formatMonthNumber = (date: Date) => {
      return (date.getMonth() + 1).toString().padStart(2, '0');
  };

  const currentWeekStart = getWeekStart(currentDate);

  // Navigation Handlers
  const handlePrevWeek = () => {
    const newDate = addWeeks(currentWeekStart, -1);
    if (newDate >= getWeekStart(SEMESTER_START)) {
      setCurrentDate(newDate);
    }
  };

  const handleNextWeek = () => {
    const newDate = addWeeks(currentWeekStart, 1);
    if (newDate <= getWeekStart(SEMESTER_END)) {
      setCurrentDate(newDate);
    }
  };

  // Generate Week Days (Mon-Fri)
  const weekDays = [];
  for (let i = 0; i < 5; i++) {
    const d = new Date(currentWeekStart);
    d.setDate(d.getDate() + i);
    weekDays.push(d);
  }

  // Get Subject Details
  const getSubject = (id: string) => SUBJECTS.find(s => s.id === id);

  // Helper to find specific lesson content based on week index
  const getLessonContent = (subjectId: string, weekIndex: number) => {
    // Filter lessons for this subject
    const subjectLessons = LESSONS.filter(l => l.subjectId === subjectId);
    
    // Simple logic: mapping the week index to the lesson array index
    // Week 0 -> Lesson 0, Week 1 -> Lesson 1, etc.
    if (weekIndex >= 0 && weekIndex < subjectLessons.length) {
        return subjectLessons[weekIndex].title;
    }
    
    return "Conteúdo a definir";
  };

  // Colors for subjects (hardcoded based on visual reference or assigned)
  const getSubjectColor = (id: string) => {
    switch (id) {
        case 'pna': return 'bg-orange-500';
        case 'semio-sist': return 'bg-blue-600';
        case 'anat-patol': return 'bg-rose-600';
        case 'farma-med': return 'bg-teal-600';
        case 'mbe': return 'bg-yellow-600';
        default: return 'bg-slate-500';
    }
  };

  return (
    <div className="p-4 lg:p-8 max-w-7xl mx-auto h-full flex flex-col">
      {/* Header Controls */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-6 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
        <h2 className="text-2xl font-bold text-slate-800 mb-4 md:mb-0">
          Cronograma 5° Período <span className="text-sm font-normal text-gray-500 bg-gray-100 px-2 py-1 rounded ml-2">Semana {Math.ceil((((currentWeekStart.getTime() - SEMESTER_START.getTime()) / 86400000) + SEMESTER_START.getDay() + 1) / 7)}</span>
        </h2>
        
        <div className="flex items-center gap-2">
           <button 
             onClick={handlePrevWeek}
             disabled={currentWeekStart <= getWeekStart(SEMESTER_START)}
             className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed"
           >
             <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
           </button>
           <div className="px-4 font-medium text-slate-700 w-32 text-center">
             {currentWeekStart.toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' })}
           </div>
           <button 
             onClick={handleNextWeek}
             disabled={currentWeekStart >= getWeekStart(SEMESTER_END)}
             className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed"
           >
             <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
           </button>
           
           <div className="h-6 w-px bg-gray-200 mx-2"></div>

           <button 
             onClick={() => setCurrentDate(new Date())} // Uses real system date
             className="px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-sm font-medium text-slate-700 hover:bg-gray-50"
           >
             Hoje
           </button>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="flex-1 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col">
        
        {/* Days Header */}
        <div className="grid grid-cols-5 border-b border-gray-200 divide-x divide-gray-200">
            {weekDays.map((day, index) => (
                <div key={index} className="p-4 text-center">
                    <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">
                        {day.toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', '')}
                    </div>
                    <div className="flex items-end justify-center leading-none">
                        <span className={`text-3xl font-light ${day.toDateString() === new Date().toDateString() ? 'text-blue-600' : 'text-slate-800'}`}>
                            {formatDayNumber(day)}
                        </span>
                        <span className="text-sm font-bold text-gray-400 mb-1 ml-0.5">
                            /{formatMonthNumber(day)}
                        </span>
                    </div>
                </div>
            ))}
        </div>

        {/* Schedule Grid */}
        <div className="flex-1 grid grid-cols-5 divide-x divide-gray-200 bg-gray-50/50 min-h-[500px]">
            {weekDays.map((day, dayIndex) => {
                // Check if this specific day is within the active semester range
                const isWithinSemester = day >= SEMESTER_START && day <= SEMESTER_END;
                // Check for Exam Week
                const isExamWeek = day >= EXAM_START && day <= EXAM_END;

                // Calculate which week of the semester this is (0-indexed)
                const weekIndex = Math.floor((day.getTime() - SEMESTER_START.getTime()) / (1000 * 60 * 60 * 24 * 7));

                // Day of week (1-5)
                const currentDayOfWeek = dayIndex + 1;
                
                // Get events for this day of week
                const daysEvents = SCHEDULE_TEMPLATE.filter(e => e.dayOfWeek === currentDayOfWeek);

                return (
                    <div key={dayIndex} className="relative p-2 space-y-2">
                        {isExamWeek ? (
                             <div className="h-full flex flex-col items-center justify-center text-center opacity-50 p-4">
                                <span className="text-4xl mb-2">📝</span>
                                <p className="font-bold text-slate-500">Semana de Provas</p>
                                <p className="text-xs text-gray-400">Não haverá aula</p>
                             </div>
                        ) : !isWithinSemester ? (
                             <div className="h-full flex items-center justify-center opacity-30">
                                <p className="text-sm font-medium">-</p>
                             </div>
                        ) : (
                            daysEvents.map((event, idx) => {
                                const subject = getSubject(event.subjectId);
                                if (!subject) return null;

                                const lessonTitle = getLessonContent(event.subjectId, weekIndex);

                                return (
                                    <button
                                        key={idx}
                                        onClick={() => onNavigateToClass(subject.id)}
                                        className={`w-full text-center rounded-xl shadow-sm hover:shadow-md hover:scale-[1.02] transition-all group flex flex-col h-48 overflow-hidden ${getSubjectColor(event.subjectId)}`}
                                    >
                                        <div className="text-white w-full h-full flex flex-col">
                                            {/* Top Half: Subject Name & Time */}
                                            <div className="flex-1 flex flex-col items-center justify-center p-1 gap-0.5">
                                                <p className="text-[10px] lg:text-xs font-bold leading-tight uppercase tracking-wide opacity-95">
                                                    {subject.title}
                                                </p>
                                                <p className="text-base lg:text-lg font-black tracking-wider">
                                                    {event.startTime} – {event.endTime}
                                                </p>
                                            </div>

                                            {/* Divider Line */}
                                            <div className="w-10/12 mx-auto border-t border-white/30"></div>

                                            {/* Bottom Half: Lesson Title */}
                                            <div className="flex-1 flex items-center justify-center p-2">
                                                <p className="text-[11px] lg:text-xs leading-snug font-medium text-white/90">
                                                    {lessonTitle}
                                                </p>
                                            </div>
                                        </div>
                                    </button>
                                );
                            })
                        )}
                    </div>
                );
            })}
        </div>
      </div>
    </div>
  );
};

export default ScheduleView;