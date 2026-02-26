import React, { useState, useEffect } from 'react';
import { Subject, Lesson, User } from '../types';
import { SUBJECTS } from '../constants';
import { IconChevronDown, IconPlay, IconPresentation, IconBook, IconCheck, IconCheckFilled, IconVideoOff, IconCalendar } from './Icons';
import { db } from '../firebase';
import { collection, getDocs } from 'firebase/firestore';

interface ClassListProps {
  currentUser: User;
  onUpdateProgress: (lessonId: string) => void;
  initialSubjectId?: string;
  onNavigateToSchedule?: (date?: Date) => void;
}

interface ActionButtonProps {
  icon: React.FC<{ className?: string }>;
  onClick: () => void;
  tooltip: string;
  isAvailable?: boolean;
}

const ActionButton: React.FC<ActionButtonProps> = ({ icon: Icon, onClick, tooltip, isAvailable = true }) => (
  <button 
    onClick={(e) => { e.stopPropagation(); if (isAvailable) onClick(); }}
    className={`p-2 rounded-lg transition-all ${isAvailable ? 'text-gray-400 hover:text-blue-600 hover:bg-blue-50' : 'text-gray-200 cursor-not-allowed'}`}
    title={tooltip}
    disabled={!isAvailable}
  >
    <Icon className="w-6 h-6" />
  </button>
);

const ClassList: React.FC<ClassListProps> = ({ currentUser, onUpdateProgress, initialSubjectId, onNavigateToSchedule }) => {
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState<number>(5);
  const [dbLessons, setDbLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('Patologia Geral');

  useEffect(() => {
    const fetchLessons = async () => {
      setLoading(true);
      try {
        const snap = await getDocs(collection(db, "lessons"));
        const lessons: Lesson[] = [];
        snap.forEach(doc => {
          const d = doc.data();
          lessons.push({ id: doc.id, ...d } as Lesson);
        });
        setDbLessons(lessons);
      } finally {
        setLoading(false);
      }
    };
    fetchLessons();
  }, []);

  useEffect(() => {
    if (selectedSubject?.id === 'proc-patol') {
      setSelectedCategory('Patologia Geral');
    } else if (selectedSubject?.id === 'anat-patol') {
      setSelectedCategory('Geral');
    }
  }, [selectedSubject]);

  useEffect(() => {
    if (initialSubjectId) {
      const subj = SUBJECTS.find(s => s.id === initialSubjectId);
      if (subj) {
        setSelectedSubject(subj);
        setSelectedPeriod(subj.period);
      }
    }
  }, [initialSubjectId]);

  const getSubjectProgress = (subjectId: string) => {
    const lessons = dbLessons.filter(l => l.subjectId === subjectId && (l.type === 'class' || !l.type) && !l.isContinuation);
    const total = lessons.length;
    const completed = lessons.filter(l => currentUser.completedLessons.includes(l.id)).length;
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
    return { completed, total, percentage };
  };

  const calculatePeriodProgress = () => {
    const subjectsInPeriod = SUBJECTS.filter(s => s.period === selectedPeriod).map(s => s.id);
    const lessonsInPeriod = dbLessons.filter(l => subjectsInPeriod.includes(l.subjectId) && (l.type === 'class' || !l.type) && !l.isContinuation);
    const total = lessonsInPeriod.length;
    const completed = lessonsInPeriod.filter(l => currentUser.completedLessons.includes(l.id)).length;
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
    return { completed, total, percentage };
  };

  const { completed: periodCompleted, total: periodTotal, percentage: periodPercentage } = calculatePeriodProgress();

  const filteredLessons = dbLessons.filter(l => 
    l.subjectId === selectedSubject?.id && 
    (l.type === 'class' || !l.type) &&
    !l.isContinuation
  ).sort((a, b) => a.title.localeCompare(b.title));

  // Logic for Processos Patológicos categories
  const isCategorized = selectedSubject?.id === 'proc-patol' || selectedSubject?.id === 'anat-patol';
  
  let categories: string[] = [];
  if (selectedSubject?.id === 'proc-patol') {
    categories = ['Patologia Geral', 'Imunologia', 'Parasitologia', 'Microbiologia'];
  } else if (selectedSubject?.id === 'anat-patol') {
    categories = ['Geral', 'Parasitologia', 'Microbiologia'];
  }

  const displayLessons = isCategorized
    ? filteredLessons.filter(l => (l.category || (selectedSubject?.id === 'proc-patol' ? 'Patologia Geral' : 'Geral')) === selectedCategory)
    : filteredLessons;

  if (!selectedSubject) {
    const subjects = SUBJECTS.filter(s => s.period === selectedPeriod);
    return (
      <div className="p-4 lg:p-10 max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-6">
          <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
            {[1, 2, 3, 4, 5, 6, 7, 8].map(p => (
              <button key={p} onClick={() => setSelectedPeriod(p)} className={`w-12 h-12 rounded-full font-bold flex-shrink-0 transition-all ${selectedPeriod === p ? 'bg-slate-800 text-white shadow-lg' : 'bg-white text-gray-400 border border-gray-200 hover:border-slate-800'}`}>{p}º</button>
            ))}
          </div>

          {/* Barra de Progresso do Período (Imagem 3) */}
          <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm w-full md:w-80">
            <div className="flex justify-between items-center mb-2">
              <div className="space-y-0.5">
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">PROGRESSO DO {selectedPeriod}º PERÍODO</span>
                <span className="text-sm text-slate-500 font-bold">{periodCompleted} de {periodTotal} aulas</span>
              </div>
              <span className="text-4xl font-black text-blue-600 tracking-tighter">{periodPercentage}%</span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
              <div className="bg-blue-600 h-full rounded-full transition-all duration-1000 ease-out" style={{ width: `${periodPercentage}%` }}></div>
            </div>
          </div>
        </div>

        <h2 className="text-2xl font-bold text-slate-800 mb-6">Disciplinas do {selectedPeriod}º Período</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {subjects.map(s => {
              const { completed, total, percentage } = getSubjectProgress(s.id);
              return (
                <button key={s.id} onClick={() => setSelectedSubject(s)} className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 text-left hover:shadow-md transition-all group flex flex-col">
                  <div className="text-4xl mb-4 transition-transform group-hover:scale-110 duration-300">{s.icon}</div>
                  <h3 className="text-lg font-bold text-slate-800 mb-1 leading-tight">{s.title}</h3>
                  <p className="text-sm text-gray-500 line-clamp-2 mb-6 flex-1">{s.description}</p>
                  
                  {/* Progresso Individual da Disciplina */}
                  <div className="pt-4 border-t border-gray-50 mt-auto">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-[10px] font-bold text-gray-400 uppercase">{completed} de {total} concluídas</span>
                      <span className="text-xs font-black text-blue-600">{percentage}%</span>
                    </div>
                    <div className="w-full bg-gray-50 rounded-full h-1.5 overflow-hidden">
                      <div className="bg-blue-600/60 h-full rounded-full transition-all duration-500" style={{ width: `${percentage}%` }}></div>
                    </div>
                  </div>
                </button>
              );
            })}
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-10 max-w-5xl mx-auto">
      <div className="mb-8 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => setSelectedSubject(null)} className="text-gray-400 hover:text-blue-600 font-bold transition-colors">← Voltar</button>
          <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2"><span>{selectedSubject.icon}</span>{selectedSubject.title}</h2>
        </div>
        
        {/* Progresso Detalhado */}
        <div className="hidden md:flex items-center gap-4 bg-white px-4 py-2 rounded-2xl border border-gray-100 shadow-sm">
           <div className="text-right">
              <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">PROGRESSO DA DISCIPLINA</p>
              <p className="text-base font-black text-blue-600 leading-none">{getSubjectProgress(selectedSubject.id).percentage}%</p>
           </div>
           <div className="w-12 h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div className="bg-blue-600 h-full rounded-full" style={{ width: `${getSubjectProgress(selectedSubject.id).percentage}%` }}></div>
           </div>
        </div>
      </div>

      {isCategorized && (
        <div className="flex justify-center gap-2 mb-8 flex-wrap">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 rounded-full font-bold transition-all ${
                selectedCategory === cat 
                  ? 'bg-blue-600 text-white shadow-md' 
                  : 'bg-white text-gray-500 hover:bg-gray-50 border border-gray-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      )}

      <div className="space-y-4 pb-24">
        {loading ? <div className="p-10 text-center text-gray-400">Carregando aulas...</div> : displayLessons.length > 0 ? (
          displayLessons.map(l => (
            <LessonRow key={l.id} lesson={l} isCompleted={currentUser.completedLessons.includes(l.id)} onToggleComplete={() => onUpdateProgress(l.id)} onNavigateToSchedule={onNavigateToSchedule} />
          ))
        ) : <div className="p-10 text-center text-gray-400 border-2 border-dashed rounded-3xl">Nenhuma aula cadastrada nesta categoria.</div>}
      </div>
    </div>
  );
};

const LessonRow: React.FC<{ lesson: Lesson; isCompleted: boolean; onToggleComplete: () => void; onNavigateToSchedule?: (date?: Date) => void; }> = ({ lesson, isCompleted, onToggleComplete, onNavigateToSchedule }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoadingFile, setIsLoadingFile] = useState(false);

  const openMaterial = async (url?: string) => {
    if (!url) return;
    setIsLoadingFile(true);
    try { window.open(url, '_blank'); } finally { setIsLoadingFile(false); }
  };

  return (
    <div className={`rounded-3xl border transition-all duration-300 ${isOpen ? 'bg-white border-blue-100 shadow-md ring-4 ring-blue-50/50' : 'bg-white border-gray-100 hover:border-gray-200 shadow-sm'}`}>
      <div className="flex items-center justify-between p-4 lg:p-5 cursor-pointer select-none" onClick={() => setIsOpen(!isOpen)}>
        <div className="flex items-center gap-4">
          <div className={`p-2 rounded-xl transition-colors ${isOpen ? 'bg-blue-50 text-blue-600' : 'text-gray-300'}`}>
            <IconChevronDown className={`w-4 h-4 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
          </div>
          <span className={`font-bold text-sm lg:text-lg transition-colors ${isOpen ? 'text-blue-700' : 'text-slate-700'}`}>{lesson.title}</span>
        </div>
        <div className="flex items-center gap-1 lg:gap-3">
           <ActionButton icon={IconPlay} onClick={() => setIsOpen(!isOpen)} tooltip="Assistir Aula" />
           <ActionButton icon={IconPresentation} onClick={() => openMaterial(lesson.slideUrl)} tooltip="Slides" isAvailable={!!lesson.slideUrl} />
           <ActionButton icon={IconBook} onClick={() => openMaterial(lesson.summaryUrl)} tooltip="Resumo" isAvailable={!!lesson.summaryUrl} />
           
           {/* Divisória Vertical (Imagem 2) */}
           <div className="h-8 w-px bg-gray-100 mx-2"></div>

           <button 
             onClick={(e) => { e.stopPropagation(); onToggleComplete(); }} 
             className={`p-2 rounded-xl transition-all ${isCompleted ? 'text-emerald-500 bg-emerald-50/50' : 'text-gray-200 hover:text-emerald-400 hover:bg-emerald-50/30'}`}
             title={isCompleted ? "Concluída" : "Marcar como Concluída"}
           >
             {isCompleted ? <IconCheckFilled className="w-8 h-8" /> : <IconCheck className="w-8 h-8" />}
           </button>
        </div>
      </div>
      {isOpen && (
        <div className="p-4 lg:p-8 bg-blue-50/5 border-t border-blue-50/50 animate-fade-in">
          {lesson.youtubeIds?.length ? (
            <div className="space-y-6">
              {lesson.youtubeIds.map(id => (
                <div key={id} className="aspect-video w-full rounded-2xl overflow-hidden shadow-2xl bg-black border-4 border-white">
                  <iframe width="100%" height="100%" src={`https://www.youtube-nocookie.com/embed/${id}?modestbranding=1&rel=0&hd=1`} frameBorder="0" allowFullScreen></iframe>
                </div>
              ))}
            </div>
          ) : (
            /* Placeholder de Vídeo Restaurado (Imagem 2) */
            <div className="aspect-video w-full rounded-3xl border-2 border-dashed border-blue-100 flex flex-col items-center justify-center bg-white text-center p-8 lg:p-12">
              <div className="w-20 h-20 bg-blue-50/50 rounded-full flex items-center justify-center mb-6 ring-8 ring-blue-50/30">
                <IconVideoOff className="w-10 h-10 text-blue-200" />
              </div>
              <h3 className="text-xl font-black text-slate-700 mb-2">Vídeo não disponível</h3>
              <p className="text-base text-gray-400 max-w-md leading-relaxed">
                Esta aula não possui gravação. Por favor, utilize os slides e resumos disponíveis acima para seus estudos.
              </p>
            </div>
          )}
          
          <div className="mt-8 pt-6 border-t border-gray-100 flex flex-col sm:flex-row justify-between items-center gap-4">
             <div className="flex items-center gap-2 text-sm text-gray-400 font-bold">
               <span className="w-2 h-2 rounded-full bg-blue-400"></span>
               Data da Aula: {lesson.date?.split('-').reverse().join('/') || '00/00/0000'}
             </div>
             {onNavigateToSchedule && (
               <button 
                 onClick={() => onNavigateToSchedule(lesson.date ? new Date(lesson.date) : undefined)} 
                 className="flex items-center gap-3 text-blue-600 font-black bg-blue-50/80 px-5 py-3 rounded-2xl border border-blue-100 hover:bg-blue-100 transition-all shadow-sm active:scale-95"
               >
                 <IconCalendar className="w-5 h-5" />
                 Ver no Cronograma
               </button>
             )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ClassList;