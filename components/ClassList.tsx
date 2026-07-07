import React, { useState, useEffect } from 'react';
import { Subject, Lesson, User } from '../types';
import { SUBJECTS } from '../constants';
import { IconChevronDown, IconPlay, IconPresentation, IconBook, IconCheck, IconCheckFilled, IconVideoOff, IconCalendar } from './Icons';
import { supabase } from '../supabase';

interface ClassListProps {
  currentUser: User;
  onUpdateProgress: (lessonId: string) => void;
  initialSubjectId?: string;
  initialCategory?: string;
  onNavigateToSchedule?: (date?: Date) => void;
  onNavigateToExercises?: (subjectId?: string) => void;
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
    className={`p-1 sm:p-2 rounded-lg transition-all ${isAvailable ? 'text-gray-400 hover:text-blue-600 hover:bg-blue-50' : 'text-gray-200 cursor-not-allowed'}`}
    title={tooltip}
    disabled={!isAvailable}
  >
    <Icon className="w-4 h-4 sm:w-6 sm:h-6" />
  </button>
);

const ClassList: React.FC<ClassListProps> = ({ currentUser, onUpdateProgress, initialSubjectId, initialCategory, onNavigateToSchedule, onNavigateToExercises }) => {
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('medferpa_selected_period');
      return saved ? parseInt(saved, 10) : 5;
    } catch {
      return 5;
    }
  });

  useEffect(() => {
    localStorage.setItem('medferpa_selected_period', selectedPeriod.toString());
  }, [selectedPeriod]);
  const [dbLessons, setDbLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('Patologia Geral');

  useEffect(() => {
    const fetchLessons = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase.from('lessons').select('*');
        if (error) {
            throw error;
        }
        
        const lessons = (data || []).map((d: any) => ({ ...d } as Lesson));
        
        console.log("Fetched lessons:", lessons.length);
        if (lessons.length > 0) { console.log(lessons[0]); }
        setDbLessons(lessons);
      } catch (err: any) {
        console.error("Error fetching lessons: ", err);
        alert("Error fetching database: " + err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchLessons();
  }, []);

  useEffect(() => {
    if (initialCategory && selectedSubject?.id === initialSubjectId) {
        setSelectedCategory(initialCategory);
    } else if (selectedSubject?.id === 'proc-patol') {
      setSelectedCategory('Patologia Geral');
    } else if (selectedSubject?.id === 'anat-patol') {
      setSelectedCategory('Geral');
    }
  }, [selectedSubject, initialCategory, initialSubjectId]);

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
  ).sort((a, b) => {
    return String(a.title || '').localeCompare(String(b.title || ''));
  });

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

      <div className="space-y-8 pb-24">
        {loading ? (
          <div className="p-10 text-center text-gray-400">Carregando aulas...</div>
        ) : displayLessons.length > 0 ? (
          <>
            {displayLessons.filter(l => l.examPeriod === 'N1' || !l.examPeriod).length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center gap-4 mb-6">
                  <div className="h-px bg-gray-200 flex-1"></div>
                  <h3 className="text-sm font-black text-gray-400 uppercase tracking-widest bg-gray-50 px-4 py-1 rounded-full border border-gray-100">N1 (1º Bimestre)</h3>
                  <div className="h-px bg-gray-200 flex-1"></div>
                </div>
                {displayLessons.filter(l => l.examPeriod === 'N1' || !l.examPeriod).map(l => (
                  <LessonRow key={l.id} lesson={l} isCompleted={currentUser.completedLessons.includes(l.id)} onToggleComplete={() => onUpdateProgress(l.id)} onNavigateToSchedule={onNavigateToSchedule} onNavigateToExercises={onNavigateToExercises} />
                ))}
              </div>
            )}

            {displayLessons.filter(l => l.examPeriod === 'N2').length > 0 && (
              <div className="space-y-4 mt-8">
                <div className="flex items-center gap-4 mb-6">
                  <div className="h-px bg-gray-200 flex-1"></div>
                  <h3 className="text-sm font-black text-gray-400 uppercase tracking-widest bg-gray-50 px-4 py-1 rounded-full border border-gray-100">N2 (2º Bimestre)</h3>
                  <div className="h-px bg-gray-200 flex-1"></div>
                </div>
                {displayLessons.filter(l => l.examPeriod === 'N2').map(l => (
                  <LessonRow key={l.id} lesson={l} isCompleted={currentUser.completedLessons.includes(l.id)} onToggleComplete={() => onUpdateProgress(l.id)} onNavigateToSchedule={onNavigateToSchedule} onNavigateToExercises={onNavigateToExercises} />
                ))}
              </div>
            )}

            {displayLessons.filter(l => l.examPeriod === 'Práticas').length > 0 && (
              <div className="space-y-4 mt-8">
                <div className="flex items-center gap-4 mb-6">
                  <div className="h-px bg-gray-200 flex-1"></div>
                  <h3 className="text-sm font-black text-gray-400 uppercase tracking-widest bg-gray-50 px-4 py-1 rounded-full border border-gray-100">Aulas Práticas</h3>
                  <div className="h-px bg-gray-200 flex-1"></div>
                </div>
                {displayLessons.filter(l => l.examPeriod === 'Práticas').map(l => (
                  <LessonRow key={l.id} lesson={l} isCompleted={currentUser.completedLessons.includes(l.id)} onToggleComplete={() => onUpdateProgress(l.id)} onNavigateToSchedule={onNavigateToSchedule} onNavigateToExercises={onNavigateToExercises} />
                ))}
              </div>
            )}
          </>
        ) : (
          <div className="p-10 text-center text-gray-400 border-2 border-dashed rounded-3xl">Nenhuma aula cadastrada nesta categoria.</div>
        )}
      </div>
    </div>
  );
};

const getSubjectColor = (subjectId: string): string => {
  switch (subjectId) {
    // 5º Período
    case 'semio-sist': return '#2563eb'; // blue-600
    case 'pna': return '#4338ca'; // indigo-700
    case 'anat-patol': return '#e11d48'; // rose-600
    case 'farma-med': return '#047857'; // emerald-700
    case 'mbe': return '#ca8a04'; // yellow-600

    // 6º Período
    case 'p6-bioetica': return '#4f46e5'; // indigo-600
    case 'p6-cardiopulmonar': return '#059669'; // emerald-600
    case 'p6-neuroendo': return '#9333ea'; // purple-600
    case 'p6-pratica-adulto-1': return '#db2777'; // pink-600
    case 'p6-psiquiatria-1': return '#d97706'; // amber-500
    case 'p6-linhas-cuidado': return '#3b82f6'; // blue-500
    case 'p6-tecnica-cirurgica': return '#ea580c'; // orange-600
    case 'p6-gestao-saude': return '#0d9488'; // teal-600
    default: return '#2563eb'; // default blue-600
  }
};

const LessonRow: React.FC<{ 
  lesson: Lesson; 
  isCompleted: boolean; 
  onToggleComplete: () => void; 
  onNavigateToSchedule?: (date?: Date) => void; 
  onNavigateToExercises?: (subjectId?: string) => void;
}> = ({ lesson, isCompleted, onToggleComplete, onNavigateToSchedule, onNavigateToExercises }) => {
  const [isOpen, setIsOpen] = useState(false);

  const openMaterial = (url: string | undefined) => {
    if (!url) return;
    window.open(url, '_blank');
  };

  const subjectColor = getSubjectColor(lesson.subjectId);

  return (
    <div className={`rounded-3xl border transition-all duration-300 ${isOpen ? 'bg-white border-blue-100 shadow-md ring-4 ring-blue-50/50' : 'bg-white border-gray-100 hover:border-gray-200 shadow-sm'}`}>
      <div className="flex items-center justify-between p-3 sm:p-4 lg:p-5 cursor-pointer select-none gap-1 sm:gap-2" onClick={() => setIsOpen(!isOpen)}>
        <div className="flex items-center gap-0 sm:gap-4 flex-1 min-w-0 pr-1 sm:pr-2">
          <div className={`hidden sm:flex p-1.5 sm:p-2 flex-shrink-0 rounded-xl transition-colors ${isOpen ? 'bg-blue-50 text-blue-600' : 'text-gray-300'}`}>
            <IconChevronDown className={`w-3 h-3 sm:w-4 sm:h-4 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
          </div>
          <span className={`font-bold text-[11px] sm:text-sm lg:text-lg truncate transition-colors ${isOpen ? 'text-blue-700' : 'text-slate-700'}`} title={lesson.title}>{lesson.title}</span>
        </div>
        <div className="flex items-center gap-0 sm:gap-1 lg:gap-3 flex-shrink-0">
           <ActionButton icon={IconPlay} onClick={() => setIsOpen(!isOpen)} tooltip="Assistir Aula" />
           <ActionButton icon={IconPresentation} onClick={() => openMaterial(lesson.slideUrl)} tooltip="Abrir Slides" isAvailable={!!lesson.slideUrl} />
           <ActionButton icon={IconBook} onClick={() => openMaterial(lesson.summaryUrl)} tooltip="Abrir Resumo" isAvailable={!!lesson.summaryUrl} />
           
           {/* Divisória Vertical (Imagem 2) */}
           <div className="h-4 sm:h-8 w-px bg-gray-100 mx-1 sm:mx-2"></div>

           <button 
             onClick={(e) => { e.stopPropagation(); onToggleComplete(); }} 
             className={`p-1 sm:p-2 flex-shrink-0 rounded-xl transition-all ${isCompleted ? 'text-emerald-500 bg-emerald-50/50' : 'text-gray-200 hover:text-emerald-400 hover:bg-emerald-50/30'}`}
             title={isCompleted ? "Concluída" : "Marcar como Concluída"}
           >
             {isCompleted ? <IconCheckFilled className="w-5 h-5 sm:w-8 sm:h-8" /> : <IconCheck className="w-5 h-5 sm:w-8 sm:h-8" />}
           </button>
        </div>
      </div>
      {isOpen && (
        <div className="p-4 lg:p-8 bg-blue-50/5 border-t border-blue-50/50 animate-fade-in">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8 items-start">
            
            {/* Coluna Esquerda: Slot de Vídeo-aula (reduzido em 50%) */}
            <div className="w-full">
              {Array.isArray(lesson.youtubeIds) && lesson.youtubeIds.length > 0 ? (
                <div className="space-y-4">
                  {lesson.youtubeIds.map(id => (
                    <div key={id} className="aspect-video w-full rounded-2xl overflow-hidden shadow-lg bg-black border-4 border-white">
                      <iframe width="100%" height="100%" src={`https://www.youtube-nocookie.com/embed/${id}?modestbranding=1&rel=0&hd=1`} frameBorder="0" allowFullScreen></iframe>
                    </div>
                  ))}
                </div>
              ) : (
                /* Placeholder de Vídeo Restaurado */
                <div className="aspect-video w-full rounded-2xl border-2 border-dashed border-blue-100 flex flex-col items-center justify-center bg-white text-center p-6">
                  <div className="w-12 h-12 bg-blue-50/50 rounded-full flex items-center justify-center mb-4 ring-4 ring-blue-50/30">
                    <IconVideoOff className="w-6 h-6 text-blue-200" />
                  </div>
                  <h3 className="text-sm font-bold text-slate-700 mb-1">Vídeo não disponível</h3>
                  <p className="text-xs text-gray-400 max-w-xs leading-relaxed">
                    Esta aula não possui gravação. Por favor, utilize os slides e resumos disponíveis ao lado para seus estudos.
                  </p>
                </div>
              )}
            </div>

            {/* Coluna Direita: 3 Botões de Ação com efeito hover animado */}
            <div className="flex flex-col gap-4 w-full">
              {/* Botão 1: Baixar Slide */}
              <button 
                onClick={() => openMaterial(lesson.slideUrl)} 
                disabled={!lesson.slideUrl}
                className="blob-btn" 
                style={{ '--blob-color': '#ea580c' } as React.CSSProperties}
              >
                <span className="relative z-10 flex items-center justify-center gap-2 py-3 px-4 text-xs font-bold uppercase tracking-wider transition-colors duration-300">
                  <IconPresentation className="w-4 h-4" />
                  {lesson.slideUrl ? 'Baixar Slide' : 'Slide Indisponível'}
                </span>
                <span className="blob-btn__inner">
                  <span className="blob-btn__blobs">
                    <span className="blob-btn__blob"></span>
                    <span className="blob-btn__blob"></span>
                    <span className="blob-btn__blob"></span>
                    <span className="blob-btn__blob"></span>
                  </span>
                </span>
              </button>

              {/* Botão 2: Baixar Resumo */}
              <button 
                onClick={() => openMaterial(lesson.summaryUrl)} 
                disabled={!lesson.summaryUrl}
                className="blob-btn" 
                style={{ '--blob-color': '#2563eb' } as React.CSSProperties}
              >
                <span className="relative z-10 flex items-center justify-center gap-2 py-3 px-4 text-xs font-bold uppercase tracking-wider transition-colors duration-300">
                  <IconBook className="w-4 h-4" />
                  {lesson.summaryUrl ? 'Baixar Resumo' : 'Resumo Indisponível'}
                </span>
                <span className="blob-btn__inner">
                  <span className="blob-btn__blobs">
                    <span className="blob-btn__blob"></span>
                    <span className="blob-btn__blob"></span>
                    <span className="blob-btn__blob"></span>
                    <span className="blob-btn__blob"></span>
                  </span>
                </span>
              </button>

              {/* Botão 3: Resolver Questões */}
              <button 
                onClick={() => {
                  if (onNavigateToExercises) {
                    onNavigateToExercises(lesson.subjectId);
                  }
                }}
                className="blob-btn" 
                style={{ '--blob-color': '#7c3aed' } as React.CSSProperties}
              >
                <span className="relative z-10 flex items-center justify-center gap-2 py-3 px-4 text-xs font-bold uppercase tracking-wider transition-colors duration-300">
                  <IconPlay className="w-4 h-4 rotate-0" />
                  Resolver Questões
                </span>
                <span className="blob-btn__inner">
                  <span className="blob-btn__blobs">
                    <span className="blob-btn__blob"></span>
                    <span className="blob-btn__blob"></span>
                    <span className="blob-btn__blob"></span>
                    <span className="blob-btn__blob"></span>
                  </span>
                </span>
              </button>
            </div>

          </div>
          
          <div className="mt-8 pt-6 border-t border-gray-100 flex flex-col sm:flex-row justify-between items-center gap-4">
             <div className="flex items-center gap-2 text-sm text-gray-400 font-bold">
               <span className="w-2 h-2 rounded-full bg-blue-400"></span>
               Data da Aula: {typeof lesson.date === 'string' ? lesson.date.split('-').reverse().join('/') : '00/00/0000'}
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