
import React, { useState, useEffect } from 'react';
import { SUBJECTS } from '../constants';
import { db } from '../firebase';
import { collection, getDocs } from 'firebase/firestore';
import { Lesson } from '../types';
import { IconChevronDown, IconVideoOff } from './Icons';

interface ScheduleEvent {
  dayOfWeek: number; // 1 = Monday, 5 = Friday
  startTime: string;
  endTime: string;
  subjectId: string;
  slot: string; // "1", "2" or "3"
}

const SCHEDULE_TEMPLATE: ScheduleEvent[] = [
  { dayOfWeek: 1, startTime: "07:00", endTime: "08:40", subjectId: 'pna', slot: "1" },
  { dayOfWeek: 1, startTime: "08:50", endTime: "10:30", subjectId: 'semio-sist', slot: "2" },
  { dayOfWeek: 1, startTime: "10:50", endTime: "12:30", subjectId: 'semio-sist', slot: "3" },
  { dayOfWeek: 2, startTime: "07:00", endTime: "08:40", subjectId: 'anat-patol', slot: "1" },
  { dayOfWeek: 2, startTime: "08:50", endTime: "10:30", subjectId: 'anat-patol', slot: "2" },
  { dayOfWeek: 2, startTime: "10:50", endTime: "12:30", subjectId: 'farma-med', slot: "3" },
  { dayOfWeek: 3, startTime: "07:00", endTime: "08:40", subjectId: 'mbe', slot: "1" },
  { dayOfWeek: 3, startTime: "08:50", endTime: "10:30", subjectId: 'semio-sist', slot: "2" },
  { dayOfWeek: 3, startTime: "10:50", endTime: "12:30", subjectId: 'semio-sist', slot: "3" },
  { dayOfWeek: 4, startTime: "07:00", endTime: "08:40", subjectId: 'anat-patol', slot: "1" },
  { dayOfWeek: 4, startTime: "08:50", endTime: "10:30", subjectId: 'anat-patol', slot: "2" },
  { dayOfWeek: 4, startTime: "10:50", endTime: "12:30", subjectId: 'farma-med', slot: "3" },
  { dayOfWeek: 5, startTime: "07:00", endTime: "08:40", subjectId: 'pna', slot: "1" },
  { dayOfWeek: 5, startTime: "08:50", endTime: "10:30", subjectId: 'semio-sist', slot: "2" },
  { dayOfWeek: 5, startTime: "10:50", endTime: "12:30", subjectId: 'semio-sist', slot: "3" },
];

interface ScheduleViewProps {
  onNavigateToClass: (subjectId: string, category?: string) => void;
  initialDate?: Date;
}

export const ScheduleView: React.FC<ScheduleViewProps> = ({ onNavigateToClass, initialDate }) => {
  const SEMESTER_START = new Date(2026, 1, 9);
  const SEMESTER_END = new Date(2026, 3, 10);
  const EXAM_START = new Date(2026, 3, 14);
  const EXAM_END = new Date(2026, 3, 17);

  const [currentDate, setCurrentDate] = useState<Date>(() => {
    if (initialDate && initialDate >= SEMESTER_START && initialDate <= SEMESTER_END) {
        return initialDate;
    }
    const today = new Date();
    if (today < SEMESTER_START || today > EXAM_END) return SEMESTER_START;
    return today;
  });

  const [dbLessons, setDbLessons] = useState<Lesson[]>([]);

  useEffect(() => {
    const fetchLessons = async () => {
      try {
        const snapshot = await getDocs(collection(db, "lessons"));
        const fetched: Lesson[] = [];
        snapshot.forEach((doc) => {
          const d = doc.data();
          fetched.push({
            id: doc.id,
            subjectId: d.subjectId,
            title: d.title,
            date: d.date,
            youtubeIds: d.youtubeIds || [],
            duration: d.duration,
            type: d.type || 'class',
            description: d.description || '',
            targetSlots: d.targetSlots || [],
            // Fix: Adding missing period property to satisfy Lesson interface requirements
            period: d.period || 5,
            category: d.category
          });
        });
        setDbLessons(fetched);
      } catch (err) {
        console.error("Erro ao carregar cronograma:", err);
      }
    };
    fetchLessons();
  }, []);

  const formatDateToISO = (date: Date) => {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const getWeekStart = (date: Date) => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(d.setDate(diff));
  };

  const addWeeks = (date: Date, weeks: number) => {
    const d = new Date(date);
    d.setDate(d.getDate() + weeks * 7);
    return d;
  };

  const currentWeekStart = getWeekStart(currentDate);
  const weekDays = Array.from({ length: 5 }, (_, i) => {
    const d = new Date(currentWeekStart);
    d.setDate(d.getDate() + i);
    return d;
  });

  const getSubject = (id: string) => SUBJECTS.find(s => s.id === id);
  const getSubjectColor = (id: string) => {
    switch (id) {
        case 'pna': return 'bg-orange-500';
        case 'semio-sist': return 'bg-blue-600';
        case 'anat-patol': return 'bg-rose-600';
        case 'farma-med': return 'bg-emerald-700';
        case 'mbe': return 'bg-yellow-600';
        default: return 'bg-slate-500';
    }
  };

  return (
    <div className="p-4 lg:p-8 max-w-7xl mx-auto h-full flex flex-col">
      <div className="flex flex-col md:flex-row justify-between items-center mb-6 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
        <h2 className="text-xl sm:text-2xl font-bold text-slate-800 mb-4 md:mb-0">
          Cronograma 5° Período <span className="text-sm font-normal text-gray-500 bg-gray-100 px-2 py-1 rounded ml-2">Semana {Math.ceil((((currentWeekStart.getTime() - SEMESTER_START.getTime()) / 86400000) + SEMESTER_START.getDay() + 1) / 7)}</span>
        </h2>
        <div className="flex items-center gap-2">
           <button onClick={() => setCurrentDate(addWeeks(currentWeekStart, -1))} disabled={currentWeekStart <= getWeekStart(SEMESTER_START)} className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-30 border border-gray-100"><IconChevronDown className="w-5 h-5 rotate-90" /></button>
           <div className="px-4 font-medium text-slate-700 w-32 text-center text-sm">{currentWeekStart.toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' })}</div>
           <button onClick={() => setCurrentDate(addWeeks(currentWeekStart, 1))} disabled={currentWeekStart >= getWeekStart(SEMESTER_END)} className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-30 border border-gray-100"><IconChevronDown className="w-5 h-5 -rotate-90" /></button>
           <button onClick={() => setCurrentDate(new Date())} className="hidden sm:block ml-2 px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-sm font-medium text-slate-700 hover:bg-gray-50">Hoje</button>
        </div>
      </div>

      <div className="flex-1 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col">
        <div className="hidden sm:grid sm:grid-cols-5 border-b border-gray-200 divide-x divide-gray-200">
            {weekDays.map((day, index) => (
                <div key={index} className="p-4 text-center">
                    <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">{day.toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', '')}</div>
                    <div className="flex items-end justify-center leading-none">
                        <span className={`text-3xl font-light ${day.toDateString() === new Date().toDateString() ? 'text-blue-600' : 'text-slate-800'}`}>{day.getDate()}</span>
                        <span className="text-sm font-bold text-gray-400 mb-1 ml-0.5">/{(day.getMonth() + 1).toString().padStart(2, '0')}</span>
                    </div>
                </div>
            ))}
        </div>

        <div className="flex-1 w-full sm:grid sm:grid-cols-5 sm:divide-x sm:divide-gray-200 bg-gray-50/50 min-h-[500px]">
            {weekDays.map((day, dayIndex) => {
                const isWithinSemester = day >= SEMESTER_START && day <= SEMESTER_END;
                const events = SCHEDULE_TEMPLATE.filter(e => e.dayOfWeek === dayIndex + 1);
                const isoDate = formatDateToISO(day);

                return (
                    <div key={dayIndex} className="w-full p-2 space-y-2">
                        {isWithinSemester ? events.map((event, idx) => {
                            const subject = getSubject(event.subjectId);
                            const foundLesson = dbLessons.find(l => 
                                l.subjectId === event.subjectId && 
                                l.date === isoDate && 
                                l.targetSlots?.includes(event.slot)
                            );

                            if (foundLesson && foundLesson.type === 'notice') {
                                return (
                                    <div key={idx} className="w-full text-center rounded-xl h-48 bg-white border-2 border-dashed border-blue-200 flex flex-col items-center justify-center p-4 gap-2 shadow-sm animate-fade-in">
                                        <IconVideoOff className="w-8 h-8 text-blue-300 opacity-50" />
                                        <p className="text-sm font-bold text-slate-500 leading-tight">{foundLesson.title}</p>
                                        {foundLesson.description && <p className="text-[11px] text-gray-400 leading-snug">{foundLesson.description}</p>}
                                    </div>
                                );
                            }

                            return (
                                <button
                                    key={idx}
                                    onClick={() => onNavigateToClass(subject?.id || '', foundLesson?.category)}
                                    className={`w-full text-center rounded-xl shadow-sm hover:shadow-md hover:scale-[1.02] transition-all flex flex-col h-48 overflow-hidden animate-fade-in ${getSubjectColor(event.subjectId)}`}
                                >
                                    <div className="text-white w-full h-full flex flex-col">
                                        <div className="flex-1 flex flex-col items-center justify-center p-2 gap-1">
                                            <div className="text-[11px] sm:text-xs font-bold leading-tight uppercase tracking-wider">{subject?.title}</div>
                                            <p className="text-[11px] font-bold opacity-90">{event.startTime} – {event.endTime}</p>
                                        </div>
                                        <div className="w-10/12 mx-auto border-t border-white/20"></div>
                                        <div className="flex-1 flex items-center justify-center p-2 bg-black/10">
                                            <p className="text-[11px] sm:text-xs leading-snug font-medium text-white/90 line-clamp-3">
                                                {foundLesson ? foundLesson.title : "Conteúdo a definir"}
                                            </p>
                                        </div>
                                    </div>
                                </button>
                            );
                        }) : <div className="h-full flex items-center justify-center opacity-30 text-xs">-</div>}
                    </div>
                );
            })}
        </div>
      </div>
    </div>
  );
};
