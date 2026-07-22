
import React, { useState, useEffect } from 'react';
import { SUBJECTS } from '../constants';
import { supabase } from '../supabase';
import { Lesson } from '../types';
import { IconChevronDown, IconVideoOff } from './Icons';

interface ScheduleEvent {
  dayOfWeek: number; // 1 = Monday, 5 = Friday
  startTime: string;
  endTime: string;
  subjectId: string;
  slot: string; // "1", "2" or "3"
  defaultTitle?: string;
}

const SCHEDULE_TEMPLATE_5: ScheduleEvent[] = [
  // Segunda
  { dayOfWeek: 1, startTime: "07:00", endTime: "08:40", subjectId: 'pna', slot: "1" },
  { dayOfWeek: 1, startTime: "08:50", endTime: "10:30", subjectId: 'semio-sist', slot: "2" },
  { dayOfWeek: 1, startTime: "10:50", endTime: "12:30", subjectId: 'semio-sist', slot: "3" },
  // Terça
  { dayOfWeek: 2, startTime: "07:00", endTime: "08:40", subjectId: 'anat-patol', slot: "1" },
  { dayOfWeek: 2, startTime: "08:50", endTime: "10:30", subjectId: 'anat-patol', slot: "2" },
  { dayOfWeek: 2, startTime: "10:50", endTime: "12:30", subjectId: 'farma-med', slot: "3" },
  // Quarta
  { dayOfWeek: 3, startTime: "07:00", endTime: "08:40", subjectId: 'mbe', slot: "1" },
  { dayOfWeek: 3, startTime: "08:50", endTime: "10:30", subjectId: 'semio-sist', slot: "2" },
  { dayOfWeek: 3, startTime: "10:50", endTime: "12:30", subjectId: 'semio-sist', slot: "3" },
  // Quinta
  { dayOfWeek: 4, startTime: "07:00", endTime: "08:40", subjectId: 'anat-patol', slot: "1" },
  { dayOfWeek: 4, startTime: "08:50", endTime: "10:30", subjectId: 'anat-patol', slot: "2" },
  { dayOfWeek: 4, startTime: "10:50", endTime: "12:30", subjectId: 'farma-med', slot: "3" },
  // Sexta
  { dayOfWeek: 5, startTime: "07:00", endTime: "08:40", subjectId: 'pna', slot: "1" },
  { dayOfWeek: 5, startTime: "08:50", endTime: "10:30", subjectId: 'semio-sist', slot: "2" },
  { dayOfWeek: 5, startTime: "10:50", endTime: "12:30", subjectId: 'semio-sist', slot: "3" },
];

const SCHEDULE_TEMPLATE_6: ScheduleEvent[] = [
  // Segunda
  { dayOfWeek: 1, startTime: "07:00", endTime: "08:40", subjectId: 'p6-pratica-adulto-1', slot: "1" },
  { dayOfWeek: 1, startTime: "08:50", endTime: "10:30", subjectId: 'p6-cardiopulmonar', slot: "2" },
  { dayOfWeek: 1, startTime: "10:50", endTime: "12:30", subjectId: 'p6-bioetica', slot: "3" },
  // Terça
  { dayOfWeek: 2, startTime: "07:00", endTime: "08:40", subjectId: 'p6-tecnica-cirurgica', slot: "1" },
  { dayOfWeek: 2, startTime: "08:50", endTime: "10:30", subjectId: 'p6-tecnica-cirurgica', slot: "2" },
  { dayOfWeek: 2, startTime: "10:50", endTime: "12:30", subjectId: 'p6-neuroendo', slot: "3" },
  // Quarta
  { dayOfWeek: 3, startTime: "07:00", endTime: "08:40", subjectId: 'p6-gestao-saude', slot: "1" },
  { dayOfWeek: 3, startTime: "08:50", endTime: "10:30", subjectId: 'p6-cardiopulmonar', slot: "2" },
  { dayOfWeek: 3, startTime: "10:50", endTime: "12:30", subjectId: 'p6-neuroendo', slot: "3" },
  // Quinta
  { dayOfWeek: 4, startTime: "07:00", endTime: "08:40", subjectId: 'p6-psiquiatria-1', slot: "1" },
  { dayOfWeek: 4, startTime: "08:50", endTime: "10:30", subjectId: 'p6-psiquiatria-1', slot: "2" },
  { dayOfWeek: 4, startTime: "10:50", endTime: "12:30", subjectId: 'p6-neuroendo', slot: "3" },
  // Sexta
  { dayOfWeek: 5, startTime: "07:00", endTime: "08:40", subjectId: 'p6-pratica-adulto-1', slot: "1" },
  { dayOfWeek: 5, startTime: "08:50", endTime: "10:30", subjectId: 'p6-cardiopulmonar', slot: "2" },
  { dayOfWeek: 5, startTime: "10:50", endTime: "12:30", subjectId: 'p6-linhas-cuidado', slot: "3" },
];

interface ScheduleViewProps {
  onNavigateToClass: (subjectId: string, category?: string) => void;
  initialDate?: Date;
}

export const ScheduleView: React.FC<ScheduleViewProps> = ({ onNavigateToClass, initialDate }) => {
  const SEMESTER_START = new Date(2026, 1, 9); // Feb 9, 2026
  const SEMESTER_END = new Date(2026, 11, 4, 23, 59, 59); // Dec 4, 2026

  const getPeriodForDate = (date: Date) => {
    // 5th period is Feb 9, 2026 to June 12, 2026
    const p5Start = new Date(2026, 1, 9);
    const p5End = new Date(2026, 5, 12, 23, 59, 59);
    if (date >= p5Start && date <= p5End) return 5;
    
    // 6th period is Aug 3, 2026 to Dec 4, 2026
    const p6Start = new Date(2026, 7, 3);
    const p6End = new Date(2026, 11, 4, 23, 59, 59);
    if (date >= p6Start && date <= p6End) return 6;

    return 0; // Vacation or outside
  };

  const getWeekLabel = (weekStart: Date) => {
    const diffTime = weekStart.getTime() - SEMESTER_START.getTime();
    const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
    const weekNum = Math.floor(diffDays / 7) + 1;

    if (weekNum >= 1 && weekNum <= 18) {
      return `Semana ${weekNum}`;
    } else if (weekNum >= 19 && weekNum <= 25) {
      return `Férias de Inverno`;
    } else if (weekNum >= 26 && weekNum <= 43) {
      return `Semana ${weekNum - 25}`;
    }
    return `Semana ${weekNum}`;
  };

  const [currentDate, setCurrentDate] = useState<Date>(() => {
    if (initialDate && initialDate >= SEMESTER_START && initialDate <= SEMESTER_END) {
        return initialDate;
    }
    const today = new Date();
    if (today < SEMESTER_START || today > SEMESTER_END) return SEMESTER_START;
    return today;
  });

  const [dbLessons, setDbLessons] = useState<Lesson[]>([]);

  useEffect(() => {
    const fetchLessons = async () => {
      try {
        const { data: snapshot, error } = await supabase.from('lessons').select('*');
        if (error) {
           throw error;
        }

        const fetched: Lesson[] = [];
        (snapshot || []).forEach((d: any) => {
          fetched.push({
            id: d.id,
            subjectId: d.subjectId,
            title: d.title,
            date: d.date,
            youtubeIds: d.youtubeIds || [],
            duration: d.duration,
            type: d.type || 'class',
            description: d.description || '',
            targetSlots: d.targetSlots || [],
            // Fix: Adding missing period property to satisfy Lesson interface requirements
            period: d.period || 6,
            category: (d.category || d.Category || '').trim()
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
    d.setHours(0, 0, 0, 0);
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
        case 'p6-bioetica': return 'bg-indigo-600';
        case 'p6-cardiopulmonar': return 'bg-emerald-600';
        case 'p6-neuroendo': return 'bg-purple-600';
        case 'p6-pratica-adulto-1': return 'bg-pink-600';
        case 'p6-psiquiatria-1': return 'bg-amber-500';
        case 'p6-linhas-cuidado': return 'bg-blue-500';
        case 'p6-tecnica-cirurgica': return 'bg-orange-600';
        case 'p6-gestao-saude': return 'bg-teal-600';
        default: return 'bg-slate-500';
    }
  };

  // Define full-day events (holidays, exams, etc.)
  const FULL_DAY_EVENTS: Record<string, { title: string; description: string }> = {
    // 5º Período
    '2026-04-03': { title: 'Dia não letivo', description: 'Sexta-feira Santa' },
    '2026-04-14': { title: 'Período de aplicação de provas', description: 'Provas da N1' },
    '2026-04-15': { title: 'Período de aplicação de provas', description: 'Provas da N1' },
    '2026-04-16': { title: 'Período de aplicação de provas', description: 'Provas da N1' },
    '2026-04-17': { title: 'Período de aplicação de provas', description: 'Provas da N1' },
    '2026-04-22': { title: 'Período de aplicação de provas', description: 'Provas da N1' },
    '2026-04-23': { title: 'Período de aplicação de provas', description: 'Provas da N1' },
    '2026-04-24': { title: 'Período de aplicação de provas', description: 'Provas da N1' },
    '2026-05-01': { title: 'Dia não letivo', description: 'Dia do Trabalhador' },
    '2026-05-22': { title: 'Dia não letivo', description: 'Aniversário de Fernandópolis' },
    '2026-06-04': { title: 'Dia não letivo', description: 'Corpus Christi' },
    '2026-06-05': { title: 'Dia não letivo', description: 'Prolongamento de Feriado' },

    // 6º Período
    '2026-11-30': { title: 'Aplicação de Provas', description: 'Semana de Provas' },
    '2026-12-01': { title: 'Aplicação de Provas', description: 'Semana de Provas' },
    '2026-12-02': { title: 'Aplicação de Provas', description: 'Semana de Provas' },
    '2026-12-03': { title: 'Aplicação de Provas', description: 'Semana de Provas' },
    '2026-12-04': { title: 'Aplicação de Provas', description: 'Semana de Provas' },
  };

  const N2_EXAM_SCHEDULE: Record<string, ScheduleEvent[]> = {
    // 5º Período N2 Exams
    '2026-06-08': [{ dayOfWeek: 1, startTime: "15:40", endTime: "17:00", subjectId: 'anat-patol', slot: "1", defaultTitle: 'Avaliação N2' }],
    '2026-06-09': [{ dayOfWeek: 2, startTime: "14:00", endTime: "15:20", subjectId: 'farma-med', slot: "1", defaultTitle: 'Avaliação N2' }],
    '2026-06-10': [{ dayOfWeek: 3, startTime: "11:30", endTime: "13:00", subjectId: 'semio-sist', slot: "1", defaultTitle: 'Avaliação N2' }],
    '2026-06-11': [{ dayOfWeek: 4, startTime: "10:30", endTime: "11:30", subjectId: 'pna', slot: "1", defaultTitle: 'Avaliação N2' }],
    '2026-06-12': [{ dayOfWeek: 5, startTime: "13:00", endTime: "14:00", subjectId: 'mbe', slot: "1", defaultTitle: 'Avaliação N2' }]
  };

  const segments: any[] = [];
  let currentSegment: any = null;

  weekDays.forEach((day, dayIndex) => {
    const isoDate = formatDateToISO(day);
    
    // Check for Winter Vacation (June 15 to July 31, 2026)
    const vacationStart = new Date(2026, 5, 15);
    const vacationEnd = new Date(2026, 6, 31, 23, 59, 59);
    const isVacation = day >= vacationStart && day <= vacationEnd;
    
    let fullDayEvent = FULL_DAY_EVENTS[isoDate];
    if (isVacation) {
      fullDayEvent = { title: 'Férias de Inverno', description: 'Período de recesso acadêmico' };
    }

    const isWithinSemester = day >= SEMESTER_START && day <= SEMESTER_END;
    const isBlankDay = false;

    if (!isWithinSemester || isBlankDay || !fullDayEvent) {
      if (currentSegment) {
        segments.push(currentSegment);
        currentSegment = null;
      }
      segments.push({ type: 'normal', day, dayIndex, isWithinSemester, isBlankDay, isoDate });
    } else {
      if (currentSegment && currentSegment.event.title === fullDayEvent.title && currentSegment.event.description === fullDayEvent.description) {
        currentSegment.span += 1;
      } else {
        if (currentSegment) {
          segments.push(currentSegment);
        }
        currentSegment = { type: 'fullDay', event: fullDayEvent, span: 1, dayIndex };
      }
    }
  });
  if (currentSegment) {
    segments.push(currentSegment);
  }

  const activePeriod = getPeriodForDate(currentWeekStart);

  return (
    <div className="p-4 lg:p-8 max-w-7xl mx-auto h-full flex flex-col">
      <div className="flex flex-col sm:flex-row justify-between items-center mb-4 sm:mb-6 bg-white p-3 sm:p-4 rounded-xl shadow-sm border border-gray-100 gap-3">
        <h2 className="text-base sm:text-lg md:text-xl lg:text-2xl font-bold text-slate-800 flex items-center justify-center gap-2 w-full sm:w-auto">
          Cronograma - Turma TXXX
        </h2>
        <div className="flex items-center justify-center gap-1.5 sm:gap-2 w-full sm:w-auto">
           {activePeriod > 0 && (
             <span className="text-xs sm:text-sm text-slate-600 font-normal mr-1">
               ({activePeriod}º Período)
             </span>
           )}
           <button onClick={() => setCurrentDate(addWeeks(currentWeekStart, -1))} disabled={currentWeekStart <= getWeekStart(SEMESTER_START)} className="p-1.5 sm:p-2 rounded-lg hover:bg-gray-100 disabled:opacity-30 border border-gray-100 flex-shrink-0"><IconChevronDown className="w-4 h-4 sm:w-5 sm:h-5 rotate-90" /></button>
           <div className="px-2 sm:px-4 font-medium text-slate-700 min-w-[80px] sm:w-36 text-center text-xs sm:text-sm whitespace-nowrap">{getWeekLabel(currentWeekStart)}</div>
           <button onClick={() => setCurrentDate(addWeeks(currentWeekStart, 1))} disabled={currentWeekStart >= getWeekStart(SEMESTER_END)} className="p-1.5 sm:p-2 rounded-lg hover:bg-gray-100 disabled:opacity-30 border border-gray-100 flex-shrink-0"><IconChevronDown className="w-4 h-4 sm:w-5 sm:h-5 -rotate-90" /></button>
           <button onClick={() => setCurrentDate(new Date())} className="ml-2 px-3 py-1.5 sm:px-3 sm:py-1.5 bg-white border border-gray-200 rounded-lg text-xs sm:text-sm font-medium text-slate-700 hover:bg-gray-50 flex-shrink-0">Hoje</button>
        </div>
      </div>

      <div className="flex-1 bg-white rounded-xl shadow-sm border border-gray-200 overflow-x-auto custom-scrollbar flex flex-col">
        <div className="min-w-[650px] sm:min-w-0 flex-1 flex flex-col">
          <div className="grid grid-cols-5 border-b border-gray-200 divide-x divide-gray-200">
              {weekDays.map((day, index) => (
                  <div key={index} className="p-2 sm:p-4 text-center">
                      <div className="text-[10px] sm:text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">{day.toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', '')}</div>
                      <div className="flex items-end justify-center leading-none">
                          <span className={`text-2xl sm:text-3xl font-light ${day.toDateString() === new Date().toDateString() ? 'text-blue-600' : 'text-slate-800'}`}>{day.getDate()}</span>
                          <span className="text-xs sm:text-sm font-bold text-gray-400 mb-0.5 sm:mb-1 ml-0.5">/{(day.getMonth() + 1).toString().padStart(2, '0')}</span>
                      </div>
                  </div>
              ))}
          </div>

          <div className="flex-1 w-full grid grid-cols-5 divide-x divide-gray-200 bg-gray-50/50 min-h-[500px]">
              {segments.map((segment, idx) => {
                  const colSpanClass = {
                      1: 'col-span-1',
                      2: 'col-span-2',
                      3: 'col-span-3',
                      4: 'col-span-4',
                      5: 'col-span-5',
                  }[segment.span as 1|2|3|4|5] || 'col-span-1';

                  if (segment.type === 'fullDay') {
                      return (
                          <div key={`full-${idx}`} className={`w-full p-1 sm:p-2 ${colSpanClass}`}>
                              <div className="w-full rounded-xl h-full min-h-[400px] bg-white border-2 border-dashed border-blue-200 flex flex-col items-center justify-center p-4 sm:p-6 text-center shadow-sm">
                                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-50 rounded-full flex items-center justify-center mb-3 sm:mb-4">
                                      <IconVideoOff className="w-5 h-5 sm:w-6 sm:h-6 text-blue-300" />
                                  </div>
                                  <h3 className="text-base sm:text-lg font-bold text-slate-700 mb-1 sm:mb-2">{segment.event.title}</h3>
                                  <p className="text-xs sm:text-sm text-gray-500">{segment.event.description}</p>
                              </div>
                          </div>
                      );
                  }

                  // Normal day
                  const { dayIndex, isWithinSemester, isBlankDay, isoDate, day } = segment;
                  const currentPeriod = getPeriodForDate(day);
                  let events: ScheduleEvent[] = [];
                  if (currentPeriod === 5) {
                    events = SCHEDULE_TEMPLATE_5.filter(e => e.dayOfWeek === dayIndex + 1);
                  } else if (currentPeriod === 6) {
                    events = SCHEDULE_TEMPLATE_6.filter(e => e.dayOfWeek === dayIndex + 1);
                  }
                  let minRows = 3;

                  if (N2_EXAM_SCHEDULE[isoDate]) {
                    events = N2_EXAM_SCHEDULE[isoDate];
                    minRows = events.length;
                  }

                  return (
                      <div 
                          key={`normal-${idx}`} 
                          className="w-full p-1 sm:p-2 grid gap-1 sm:gap-2 col-span-1 h-full min-h-[400px]"
                          style={{ gridTemplateRows: `repeat(${Math.max(minRows, events.length)}, minmax(0, 1fr))` }}
                      >
                          {isWithinSemester ? (
                              isBlankDay ? (
                                  <div className="w-full h-full rounded-xl bg-gray-50/50 border-2 border-dashed border-gray-200 flex items-center justify-center opacity-60" style={{ gridRow: `span ${Math.max(3, events.length)}` }}>
                                      <span className="text-gray-400 text-xs sm:text-sm font-medium">Sem atividades</span>
                                  </div>
                              ) : events.map((event, eventIdx) => {
                                  const subject = getSubject(event.subjectId);
                                  const foundLesson = dbLessons.find(l => 
                                      l.subjectId === event.subjectId && 
                                      l.date === isoDate && 
                                      l.targetSlots?.includes(event.slot)
                                  );

                                  if (foundLesson && foundLesson.type === 'notice') {
                                      return (
                                          <div key={eventIdx} className="w-full h-full text-center rounded-xl bg-white border-2 border-dashed border-blue-200 flex flex-col items-center justify-center p-2 sm:p-4 gap-1 sm:gap-2 shadow-sm animate-fade-in">
                                              <IconVideoOff className="w-6 h-6 sm:w-8 sm:h-8 text-blue-300 opacity-50" />
                                              <p className="text-[10px] sm:text-sm font-bold text-slate-500 leading-tight">{foundLesson.title}</p>
                                              {foundLesson.description && <p className="text-[9px] sm:text-[11px] text-gray-400 leading-snug">{foundLesson.description}</p>}
                                          </div>
                                      );
                                  }

                                  return (
                                      <button
                                          key={eventIdx}
                                          onClick={() => onNavigateToClass(subject?.id || '', foundLesson?.category)}
                                          className={`w-full h-full text-center rounded-xl shadow-sm hover:shadow-md hover:scale-[1.02] transition-all flex flex-col overflow-hidden animate-fade-in ${getSubjectColor(event.subjectId)}`}
                                      >
                                          <div className="text-white w-full h-full flex flex-col">
                                              <div className="flex-1 flex flex-col items-center justify-center p-1 sm:p-2 gap-0.5 sm:gap-1">
                                                  <div className="text-[9px] sm:text-xs font-bold leading-tight uppercase tracking-wider line-clamp-3 sm:line-clamp-none">{subject?.title}</div>
                                                  <p className="text-[9px] sm:text-[11px] font-bold opacity-90 mt-1 sm:mt-0">{event.startTime} – {event.endTime}</p>
                                              </div>
                                              <div className="w-10/12 mx-auto border-t border-white/20"></div>
                                              <div className="flex-1 flex items-center justify-center p-1 sm:p-2 bg-black/10">
                                                  <p className="text-[9px] sm:text-xs leading-snug font-medium text-white/90 line-clamp-3">
                                                      {foundLesson ? foundLesson.title : (event.defaultTitle || "Conteúdo a definir")}
                                                  </p>
                                              </div>
                                          </div>
                                      </button>
                                  );
                              })
                          ) : (
                              <div className="h-full flex items-center justify-center opacity-30 text-xs">-</div>
                          )}
                      </div>
                  );
              })}
          </div>
        </div>
      </div>
    </div>
  );
};
