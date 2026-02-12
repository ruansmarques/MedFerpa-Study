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

export const ScheduleView: React.FC<ScheduleViewProps> = ({ onNavigateToClass, initialDate }) => {
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

  // State for Mobile View (Day Index 0-4)
  const [mobileDayIndex, setMobileDayIndex] = useState(0);

  // Reset to Monday whenever the main week changes
  useEffect(() => {
    setMobileDayIndex(0);
  }, [currentDate]);

  const [dbLessons, setDbLessons] = useState<Lesson[]>([]);

  // Buscar aulas do banco para popular o cronograma dinamicamente
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
            date: d.date, // Formato YYYY-MM-DD vindo do Admin
            youtubeIds: d.youtubeIds || [],
            duration: d.duration,
            type: d.type || 'class',
            description: d.description || ''
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
  
  // Helper para nome do dia em português
  const getDayName = (date: Date) => {
      const days = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
      return days[date.getDay()];
  };

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

  // Mobile Day Navigation
  const handleMobilePrevDay = () => {
      if (mobileDayIndex > 0) setMobileDayIndex(mobileDayIndex - 1);
  };
  
  const handleMobileNextDay = () => {
      if (mobileDayIndex < 4) setMobileDayIndex(mobileDayIndex + 1);
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
        <h2 className="text-xl sm:text-2xl font-bold text-slate-800 mb-4 md:mb-0 text-center md:text-left">
          Cronograma 5° Período <span className="text-sm font-normal text-gray-500 bg-gray-100 px-2 py-1 rounded ml-2 whitespace-nowrap">Semana {Math.ceil((((currentWeekStart.getTime() - SEMESTER_START.getTime()) / 86400000) + SEMESTER_START.getDay() + 1) / 7)}</span>
        </h2>
        
        <div className="flex items-center gap-2">
           <button 
             onClick={handlePrevWeek}
             disabled={currentWeekStart <= getWeekStart(SEMESTER_START)}
             className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed border border-gray-100"
           >
             <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
           </button>
           <div className="px-4 font-medium text-slate-700 w-32 text-center text-sm lg:text-base">
             {currentWeekStart.toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' })}
           </div>
           <button 
             onClick={handleNextWeek}
             disabled={currentWeekStart >= getWeekStart(SEMESTER_END)}
             className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed border border-gray-100"
           >
             <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
           </button>
           
           <div className="h-6 w-px bg-gray-200 mx-2 hidden sm:block"></div>

           <button 
             onClick={() => setCurrentDate(new Date())} 
             className="hidden sm:block px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-sm font-medium text-slate-700 hover:bg-gray-50"
           >
             Hoje
           </button>
        </div>
      </div>

      {/* Mobile Day Navigation (Visible only on sm:hidden which is < 640px) */}
      <div className="sm:hidden flex items-center justify-between bg-blue-50 p-3 rounded-xl mb-4 border border-blue-100">
          <button 
             onClick={handleMobilePrevDay}
             disabled={mobileDayIndex === 0}
             className="p-2 text-blue-700 disabled:text-gray-300 transition-colors"
          >
             <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" /></svg>
          </button>
          
          <div className="text-center">
              <span className="block text-xs font-bold text-blue-400 uppercase tracking-widest">
                  Visualizando
              </span>
              <span className="text-lg font-black text-slate-800">
                  {getDayName(weekDays[mobileDayIndex])}
                  <span className="ml-2 text-slate-500 font-medium">
                      {weekDays[mobileDayIndex].toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                  </span>
              </span>
          </div>

          <button 
             onClick={handleMobileNextDay}
             disabled={mobileDayIndex === 4}
             className="p-2 text-blue-700 disabled:text-gray-300 transition-colors"
          >
             <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" /></svg>
          </button>
      </div>

      {/* Calendar Grid Container */}
      <div className="flex-1 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col">
        
        {/* Days Header */}
        {/* Mobile: Hidden. Desktop/Tablet (>=sm): Visible grid */}
        <div className="hidden sm:grid sm:grid-cols-5 border-b border-gray-200 divide-x divide-gray-200">
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
        {/* Mobile: Flex col (one at a time). Desktop/Tablet: Grid cols 5 */}
        <div className="flex-1 w-full sm:grid sm:grid-cols-5 sm:divide-x sm:divide-gray-200 bg-gray-50/50 min-h-[500px]">
            {weekDays.map((day, dayIndex) => {
                const isWithinSemester = day >= SEMESTER_START && day <= SEMESTER_END;
                const isExamWeek = day >= EXAM_START && day <= EXAM_END;
                const currentDayOfWeek = dayIndex + 1;
                const daysEvents = SCHEDULE_TEMPLATE.filter(e => e.dayOfWeek === currentDayOfWeek);
                const isoDate = formatDateToISO(day); // Data da coluna atual em string

                // Visibility Logic:
                // Desktop/Tablet (>=sm): Always block
                // Mobile (<sm): Block only if index matches state, else hidden
                const visibilityClass = (dayIndex === mobileDayIndex) ? 'block' : 'hidden sm:block';

                return (
                    <div key={dayIndex} className={`${visibilityClass} w-full relative p-2 space-y-2`}>
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
                                
                                // Se encontrou uma lição e ela é do tipo AVISO
                                if (foundLesson && foundLesson.type === 'notice') {
                                    return (
                                        <div key={idx} className="w-full text-center rounded-xl h-48 overflow-hidden bg-white border-2 border-dashed border-blue-200 flex flex-col items-center justify-center p-4 gap-2 shadow-sm">
                                            <div className="text-blue-300">
                                                <IconVideoOff className="w-8 h-8 opacity-50" />
                                            </div>
                                            <p className="text-sm font-bold text-slate-500 leading-tight">
                                                {foundLesson.title}
                                            </p>
                                            {foundLesson.description && (
                                                <p className="text-xs text-gray-400 leading-snug">
                                                    {foundLesson.description}
                                                </p>
                                            )}
                                        </div>
                                    )
                                }

                                return (
                                    <button
                                        key={idx}
                                        onClick={() => onNavigateToClass(subject.id)}
                                        className={`w-full text-center rounded-xl shadow-sm hover:shadow-md hover:scale-[1.02] transition-all group flex flex-col h-48 overflow-hidden ${getSubjectColor(event.subjectId)}`}
                                    >
                                        <div className="text-white w-full h-full flex flex-col">
                                            {/* Top Half: Subject Name & Time */}
                                            <div className="flex-1 flex flex-col items-center justify-center p-2 gap-1">
                                                <div className="text-[11px] sm:text-xs font-bold leading-tight tracking-wide opacity-100">
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
                                                <p className="text-[11px] sm:text-xs leading-snug font-medium text-white/90 line-clamp-3">
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
    );
  };