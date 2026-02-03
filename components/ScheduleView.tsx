import React, { useState, useEffect } from 'react';
import { SUBJECTS } from '../constants';
import { db } from '../firebase';
import { collection, query, getDocs } from 'firebase/firestore';
import { Lesson } from '../types';

interface ScheduleEvent {
  dayOfWeek: number; // 1 = Monday, 5 = Friday
  startTime: string;
  endTime: string;
  subjectId: string;
}

// 5th Period Schedule Template (Horários Fixos)
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
    if (initialDate && initialDate >= SEMESTER_START && initialDate <= SEMESTER_END) {
        return initialDate;
    }
    const today = new Date();
    if (today < SEMESTER_START || today > EXAM_END) {
        return SEMESTER_START;
    }
    return today;
  });

  const [dbLessons, setDbLessons] = useState<Lesson[]>([]);

  // Buscar aulas do banco para popular o cronograma dinamicamente
  useEffect(() => {
    const fetchLessons = async () => {
      try {
        const q = query(collection(db, "lessons"));
        const snapshot = await getDocs(q);
        const fetched: Lesson[] = [];
        snapshot.forEach((doc) => {
          const d = doc.data();
          fetched.push({
            id: doc.id,
            subjectId: d.subjectId,
            title: d.title,
            date: d.date, // Formato YYYY-MM-DD vindo do Admin
            youtubeIds: d.youtubeIds || [],
            duration: d.duration
          });
        });
        setDbLessons(fetched);
      } catch (err) {
        console.error("Erro ao carregar aulas para o cronograma:", err);
      }
    };
    fetchLessons();
  }, []);

  // Helpers
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

  const formatDayNumber = (date: Date) => date.getDate().toString();
  const formatMonthNumber = (date: Date) => (date.getMonth() + 1).toString().padStart(2, '0');

  // Formata data JS para YYYY-MM-DD (para comparar com o banco)
  const formatDateToISO = (date: Date) => {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
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

  const getSubject = (id: string) => SUBJECTS.find(s => s.id === id);

  // Colors for subjects
  const getSubjectColor = (id: string) => {
    switch (id) {
        case 'pna': return 'bg-orange-500';
        case 'semio-sist': return 'bg-blue-600';
        case 'anat-patol': return 'bg-rose-600';
        case 'farma-med': return 'bg-emerald-700'; // Cor alterada para verde mais escuro
        case 'mbe': return 'bg-yellow-600';
        default: return 'bg-slate-500';
    }
  };

  // Função para formatar o título (quebra de linha após :)
  const formatSubjectTitle = (title: string) => {
    if (title.includes(':')) {
        const parts = title.split(':');
        return (
            <>
                {parts[0]}:<br/>
                <span className="font-normal opacity-90">{parts[1].trim()}</span>
            </>
        );
    }
    return title;
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
             onClick={() => setCurrentDate(new Date())} 
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
                const isWithinSemester = day >= SEMESTER_START && day <= SEMESTER_END;
                const isExamWeek = day >= EXAM_START && day <= EXAM_END;
                const currentDayOfWeek = dayIndex + 1;
                const daysEvents = SCHEDULE_TEMPLATE.filter(e => e.dayOfWeek === currentDayOfWeek);
                const isoDate = formatDateToISO(day); // Data da coluna atual em string

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

                                // LÓGICA DINÂMICA:
                                // Procura no banco se tem alguma aula com o subjectId deste evento E com a data deste dia
                                const foundLesson = dbLessons.find(l => 
                                    l.subjectId === event.subjectId && l.date === isoDate
                                );

                                return (
                                    <button
                                        key={idx}
                                        onClick={() => onNavigateToClass(subject.id)}
                                        className={`w-full text-center rounded-xl shadow-sm hover:shadow-md hover:scale-[1.02] transition-all group flex flex-col h-48 overflow-hidden ${getSubjectColor(event.subjectId)}`}
                                    >
                                        <div className="text-white w-full h-full flex flex-col">
                                            {/* Top Half: Subject Name & Time */}
                                            <div className="flex-1 flex flex-col items-center justify-center p-2 gap-1">
                                                <div className="text-[11px] lg:text-xs font-bold leading-tight tracking-wide opacity-100">
                                                    {/* Aplica formatação de quebra de linha se necessário */}
                                                    {formatSubjectTitle(subject.title)}
                                                </div>
                                                <p className="text-xs font-normal opacity-80 mt-1">
                                                    {event.startTime} – {event.endTime}
                                                </p>
                                            </div>

                                            {/* Divider Line */}
                                            <div className="w-10/12 mx-auto border-t border-white/20"></div>

                                            {/* Bottom Half: Lesson Title (Dynamic from DB) */}
                                            <div className="flex-1 flex items-center justify-center p-2 bg-black/10">
                                                <p className="text-[11px] lg:text-xs leading-snug font-medium text-white/90 line-clamp-3">
                                                    {foundLesson ? foundLesson.title : "Conteúdo a definir"}
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