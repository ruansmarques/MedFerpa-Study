
import React, { useState, useEffect } from 'react';
import { Subject, Lesson, User } from '../types';
import { SUBJECTS } from '../constants';
import { IconChevronDown, IconPlay, IconPresentation, IconBook, IconCheck, IconCheckFilled, IconVideoOff, IconCalendar } from './Icons';
import { db, storage } from '../firebase';
import { ref, getDownloadURL } from 'firebase/storage';
import { collection, query, getDocs } from 'firebase/firestore';

interface ClassListProps {
  currentUser: User;
  onUpdateProgress: (lessonId: string) => void;
  initialSubjectId?: string;
  onNavigateToSchedule?: (date?: Date) => void;
}

const ClassList: React.FC<ClassListProps> = ({ currentUser, onUpdateProgress, initialSubjectId, onNavigateToSchedule }) => {
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState<number>(5); 
  
  const [selectedCategory, setSelectedCategory] = useState<string>('Patologia Geral');

  // AGORA BUSCAMOS APENAS DO BANCO, SEM MERGE COM ARQUIVO ESTÁTICO
  const [dbLessons, setDbLessons] = useState<Lesson[]>([]);
  const [isLoadingLessons, setIsLoadingLessons] = useState(false);

  useEffect(() => {
    const fetchLessons = async () => {
      setIsLoadingLessons(true);
      try {
        const q = query(collection(db, "lessons"));
        const querySnapshot = await getDocs(q);
        const fetchedLessons: Lesson[] = [];
        
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          fetchedLessons.push({
            id: doc.id,
            subjectId: data.subjectId,
            title: data.title,
            youtubeIds: data.youtubeIds || [],
            duration: data.duration || '',
            category: data.category,
            slideUrl: data.slideUrl,
            summaryUrl: data.summaryUrl,
            date: data.date
          });
        });

        setDbLessons(fetchedLessons);
      } catch (error) {
        console.error("Erro ao buscar aulas do banco:", error);
      } finally {
        setIsLoadingLessons(false);
      }
    };

    fetchLessons();
  }, []);

  useEffect(() => {
    if (initialSubjectId) {
      const subject = SUBJECTS.find(s => s.id === initialSubjectId);
      if (subject) {
        setSelectedSubject(subject);
        setSelectedPeriod(subject.period);
        if (subject.id === 'proc-patol') {
            setSelectedCategory('Patologia Geral');
        }
      }
    }
  }, [initialSubjectId]);

  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  const allPeriods = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
  const mobilePeriods = [1, 2, 3, 4, 5, 6, 7, 8];
  
  const specialSubjectId = 'proc-patol'; 
  const categories = ['Patologia Geral', 'Parasitologia', 'Imunologia', 'Microbiologia'];

  useEffect(() => {
    if (selectedSubject?.id === specialSubjectId) {
      setSelectedCategory('Patologia Geral');
    }
  }, [selectedSubject]);

  const getVisiblePeriods = (current: number) => {
    const count = mobilePeriods.length;
    const currentIndex = mobilePeriods.indexOf(current);
    const offsets = [-2, -1, 0, 1, 2];
    
    return offsets.map(offset => {
      let idx = (currentIndex + offset) % count;
      if (idx < 0) idx += count;
      return mobilePeriods[idx];
    });
  };

  const visiblePeriods = getVisiblePeriods(selectedPeriod);
  const minSwipeDistance = 50;

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe) {
      const currentIndex = mobilePeriods.indexOf(selectedPeriod);
      const nextIndex = (currentIndex + 1) % mobilePeriods.length;
      setSelectedPeriod(mobilePeriods[nextIndex]);
    }
    
    if (isRightSwipe) {
      const currentIndex = mobilePeriods.indexOf(selectedPeriod);
      let prevIndex = (currentIndex - 1) % mobilePeriods.length;
      if (prevIndex < 0) prevIndex += mobilePeriods.length;
      setSelectedPeriod(mobilePeriods[prevIndex]);
    }
  };

  // --- CÁLCULO DE PROGRESSO DO PERÍODO ---
  const calculatePeriodProgress = () => {
    // 1. Identificar todas as disciplinas do período selecionado
    const subjectsInPeriod = SUBJECTS.filter(s => s.period === selectedPeriod).map(s => s.id);
    
    // 2. Filtrar todas as aulas (dbLessons) que pertencem a essas disciplinas
    const lessonsInPeriod = dbLessons.filter(l => subjectsInPeriod.includes(l.subjectId));
    const totalLessonsCount = lessonsInPeriod.length;

    // 3. Contar quantas dessas aulas o usuário completou
    const completedCount = lessonsInPeriod.filter(l => currentUser.completedLessons.includes(l.id)).length;

    // 4. Calcular porcentagem
    const percentage = totalLessonsCount > 0 ? Math.round((completedCount / totalLessonsCount) * 100) : 0;

    return { completedCount, totalLessonsCount, percentage };
  };

  const { completedCount, totalLessonsCount, percentage } = calculatePeriodProgress();


  if (!selectedSubject) {
    const filteredSubjects = SUBJECTS.filter(s => s.period === selectedPeriod);

    return (
      <div className="p-4 lg:p-10 max-w-6xl mx-auto">
        
        {/* PROGRESS BAR HEADER (DESKTOP) */}
        <div className="flex flex-col-reverse lg:flex-row lg:items-center justify-between mb-8 lg:mb-12 gap-6">
            
            {/* SELETOR DE PERÍODO */}
            <div className="flex-1">
                {/* Mobile Carousel */}
                <div className="lg:hidden mb-4 relative">
                    <div 
                        className="flex items-center justify-between px-2 py-4 select-none touch-pan-y"
                        onTouchStart={onTouchStart}
                        onTouchMove={onTouchMove}
                        onTouchEnd={onTouchEnd}
                    >
                        <div className="text-gray-300 font-bold text-xs select-none">...</div>
                        {visiblePeriods.map((p, index) => {
                        const isCenter = index === 2;
                        const isFarEdge = index === 0 || index === 4;
                        return (
                            <button
                            key={`mobile-period-${p}`}
                            onClick={() => setSelectedPeriod(p)}
                            className={`
                                rounded-full flex items-center justify-center font-bold transition-all duration-300
                                ${isCenter 
                                ? 'w-14 h-14 bg-slate-800 text-white shadow-xl scale-110 z-10 text-xl' 
                                : 'w-10 h-10 bg-white text-gray-400 border border-gray-100'
                                }
                                ${!isCenter && !isFarEdge ? 'scale-90 opacity-80' : ''}
                                ${isFarEdge ? 'scale-75 opacity-40' : ''}
                            `}
                            >
                            {p}º
                            </button>
                        );
                        })}
                        <div className="text-gray-300 font-bold text-xs select-none">...</div>
                    </div>
                    <p className="text-center text-xs text-gray-400 mt-[-5px] font-medium">
                        Deslize para ver mais
                    </p>
                </div>

                {/* Desktop Selector */}
                <div className="hidden lg:flex items-center gap-3 flex-wrap">
                    {allPeriods.slice(0, 8).map((p) => (
                        <button
                        key={p}
                        onClick={() => setSelectedPeriod(p)}
                        className={`w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold transition-all ${
                            selectedPeriod === p
                            ? 'bg-slate-800 text-white shadow-lg scale-110'
                            : 'bg-white text-gray-400 border-2 border-gray-200 hover:border-slate-800 hover:text-slate-800'
                        }`}
                        >
                        {p}º
                        </button>
                    ))}
                </div>
            </div>

            {/* BARRA DE PROGRESSO ESPECÍFICA DO PERÍODO */}
            <div className="w-full lg:w-64 bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
                <div className="flex justify-between items-end mb-2">
                    <div>
                        <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block">Progresso do {selectedPeriod}º Período</span>
                        <span className="text-xs text-gray-500 font-medium">
                            {completedCount} de {totalLessonsCount} aulas
                        </span>
                    </div>
                    <span className="text-2xl font-black text-blue-600">{percentage}%</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                    <div 
                        className="bg-blue-600 h-2 rounded-full transition-all duration-1000 ease-out"
                        style={{ width: `${percentage}%` }}
                    ></div>
                </div>
            </div>
        </div>

        <h2 className="text-xl lg:text-2xl font-bold text-slate-800 mb-6 lg:mb-8 text-center lg:text-left">
          Disciplinas do {selectedPeriod}º Período
        </h2>
        
        {filteredSubjects.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredSubjects.map((subject) => (
              <button
                key={subject.id}
                onClick={() => setSelectedSubject(subject)}
                className="bg-white p-6 rounded-2xl shadow-sm hover:shadow-md border border-gray-100 text-left transition-all hover:-translate-y-1 group h-full flex flex-col"
              >
                <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center text-2xl mb-4 group-hover:bg-blue-100 transition-colors">
                  {subject.icon}
                </div>
                <h3 className="text-lg font-bold text-slate-800 mb-2">{subject.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed flex-1">{subject.description}</p>
              </button>
            ))}
          </div>
        ) : (
          <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-gray-300">
             <p className="text-gray-400 font-medium">Nenhuma disciplina cadastrada para este período no momento.</p>
          </div>
        )}
      </div>
    );
  }

  // AQUI FILTRAMOS AS AULAS DO BANCO (DBLESSONS)
  let subjectLessons = dbLessons.filter(l => l.subjectId === selectedSubject.id);

  if (selectedSubject.id === specialSubjectId) {
    subjectLessons = subjectLessons.filter(l => l.category === selectedCategory);
  }

  // --- ORDENAÇÃO ALFABÉTICA ---
  // Garante que as aulas apareçam em ordem alfabética pelo Título
  subjectLessons.sort((a, b) => a.title.localeCompare(b.title));

  return (
    <div className="p-4 lg:p-10 max-w-5xl mx-auto">
      <div className="mb-6 lg:mb-8 flex flex-col lg:flex-row lg:items-center gap-2 lg:gap-4">
        <button 
          onClick={() => setSelectedSubject(null)}
          className="text-sm font-semibold text-gray-400 hover:text-blue-600 transition-colors self-start"
        >
          ← Voltar
        </button>
        <h2 className="text-xl lg:text-2xl font-bold text-slate-800 flex items-center gap-2">
          <span>{selectedSubject.icon}</span>
          {selectedSubject.title}
        </h2>
      </div>

      {selectedSubject.id === specialSubjectId && (
        <div className="flex flex-wrap items-center justify-center gap-2 lg:gap-3 mb-8 lg:mb-10 bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
          {categories.map((cat) => (
             <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 rounded-full text-xs lg:text-sm font-bold transition-all ${
                selectedCategory === cat
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-gray-50 text-gray-500 hover:bg-blue-50 hover:text-blue-600'
              }`}
             >
               {cat}
             </button>
          ))}
        </div>
      )}

      <div className="space-y-4 pb-10">
        {isLoadingLessons ? (
           <div className="p-12 text-center text-gray-400">Carregando aulas do servidor...</div>
        ) : subjectLessons.length > 0 ? (
          subjectLessons.map((lesson) => (
            <LessonRow 
              key={lesson.id} 
              lesson={lesson} 
              subjectFolderName={selectedSubject.folderName}
              isCompleted={currentUser.completedLessons.includes(lesson.id)}
              onToggleComplete={() => onUpdateProgress(lesson.id)}
              onNavigateToSchedule={onNavigateToSchedule}
            />
          ))
        ) : (
          <div className="p-12 text-center text-gray-400 bg-white rounded-2xl border border-gray-100 border-dashed">
            <p className="text-lg mb-2">📭</p>
            <p>Nenhuma aula encontrada no banco de dados para {selectedSubject.id === specialSubjectId ? selectedCategory : 'esta disciplina'}.</p>
          </div>
        )}
      </div>
    </div>
  );
};

const YouTubePlayer: React.FC<{ videoId: string; title: string; index: number }> = ({ videoId, title, index }) => {
  const [isPlaying, setIsPlaying] = useState(false);

  if (isPlaying) {
    return (
      <div className="aspect-video w-full rounded-xl overflow-hidden shadow-sm bg-black relative">
        <iframe 
          width="100%" 
          height="100%" 
          src={`https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&modestbranding=1&rel=0`}
          title={`${title} - Part ${index + 1}`}
          frameBorder="0" 
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" 
          referrerPolicy="no-referrer"
          allowFullScreen
          className="absolute inset-0 w-full h-full"
        ></iframe>
      </div>
    );
  }

  return (
    <div 
      className="aspect-video w-full rounded-xl overflow-hidden shadow-sm bg-slate-900 relative group cursor-pointer"
      onClick={() => setIsPlaying(true)}
    >
      <img 
        src={`https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`} 
        alt={`Thumbnail ${title}`}
        className="w-full h-full object-cover opacity-90 group-hover:opacity-75 transition-all duration-300"
        onError={(e) => {
          (e.target as HTMLImageElement).src = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
        }}
      />
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-16 h-16 lg:w-20 lg:h-20 bg-blue-600 rounded-full flex items-center justify-center text-white shadow-xl group-hover:scale-110 transition-transform duration-300 ring-4 ring-blue-600/30">
          <IconPlay className="w-8 h-8 lg:w-10 lg:h-10 ml-1" />
        </div>
      </div>
    </div>
  );
};

const LessonRow: React.FC<{ 
  lesson: Lesson; 
  subjectFolderName?: string;
  isCompleted: boolean;
  onToggleComplete: () => void;
  onNavigateToSchedule?: (date?: Date) => void;
}> = ({ lesson, subjectFolderName, isCompleted, onToggleComplete, onNavigateToSchedule }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoadingFile, setIsLoadingFile] = useState(false);
  
  const hasVideos = lesson.youtubeIds && lesson.youtubeIds.length > 0 && lesson.youtubeIds[0] !== '';

  const openPdf = async (type: 'slide' | 'resumo') => {
    setIsLoadingFile(true);
    
    if (type === 'slide' && lesson.slideUrl) {
       window.open(lesson.slideUrl, '_blank');
       setIsLoadingFile(false);
       return;
    }
    if (type === 'resumo' && lesson.summaryUrl) {
       window.open(lesson.summaryUrl, '_blank');
       setIsLoadingFile(false);
       return;
    }

    // Fallback para estrutura antiga de arquivos locais (apenas para compatibilidade se algo não tiver URL)
    const basePath = 'materials';
    const subjectPath = subjectFolderName || 'default';
    const categoryPath = lesson.category 
      ? lesson.category.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, '-') 
      : '';
    const typeFolder = type === 'slide' ? 'slides' : 'resumos';
    const fileName = `${lesson.title}.pdf`;

    const parts = [basePath, subjectPath];
    if (categoryPath) parts.push(categoryPath);
    parts.push(typeFolder);
    parts.push(fileName);
    
    const storagePath = parts.join('/');
    
    try {
      const fileRef = ref(storage, storagePath);
      const url = await getDownloadURL(fileRef);
      window.open(url, '_blank');
    } catch (error) {
      console.error("Erro ao buscar arquivo:", error);
      alert(`Arquivo não encontrado ou URL inválida.`);
    } finally {
      setIsLoadingFile(false);
    }
  };

  // Função helper para exibir a data corretamente sem conversão de fuso horário
  const formatDisplayDate = (dateString: string) => {
    if (!dateString) return '';
    // Recebe "YYYY-MM-DD" e retorna "DD/MM/YYYY" tratando apenas como string
    const [year, month, day] = dateString.split('-');
    return `${day}/${month}/${year}`;
  };

  return (
    <div className={`rounded-xl border transition-all duration-300 overflow-hidden ${isOpen ? 'bg-white border-blue-200 shadow-md' : 'bg-slate-100 border-transparent hover:bg-white hover:shadow-sm'}`}>
      <div className="flex flex-row items-center justify-between p-3 lg:p-4 px-4 lg:px-6 gap-2 lg:gap-4">
        <div 
          className="flex items-center gap-2 lg:gap-4 flex-1 cursor-pointer select-none min-w-0"
          onClick={() => setIsOpen(!isOpen)}
        >
          <div className={`transition-transform duration-300 text-slate-400 flex-shrink-0 ${isOpen ? 'rotate-180 text-blue-600' : ''}`}>
            <IconChevronDown className="w-5 h-5 lg:w-6 lg:h-6" />
          </div>
          <div className="flex flex-col pr-2 min-w-0">
            <span className={`font-semibold text-sm lg:text-lg leading-tight ${isOpen ? 'text-blue-700' : 'text-slate-700'}`}>
              {lesson.title}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1 lg:gap-2 flex-shrink-0">
          <ActionButton icon={IconPlay} onClick={() => setIsOpen(!isOpen)} tooltip="Assistir Aula" />
          <ActionButton icon={IconPresentation} onClick={() => openPdf('slide')} tooltip="Baixar Slides" disabled={isLoadingFile} />
          <ActionButton icon={IconBook} onClick={() => openPdf('resumo')} tooltip="Baixar Resumo" disabled={isLoadingFile} />
          <div className="h-6 w-px bg-gray-300 mx-1 hidden lg:block"></div>
          <button 
            onClick={(e) => {
              e.stopPropagation();
              onToggleComplete();
            }}
            className={`p-1.5 lg:p-2 rounded-lg transition-all ${
              isCompleted 
                ? 'text-emerald-500 bg-emerald-50 hover:bg-emerald-100' 
                : 'text-gray-400 hover:text-emerald-500 hover:bg-gray-200'
            }`}
          >
            {isCompleted ? <IconCheckFilled className="w-6 h-6 lg:w-7 lg:h-7" /> : <IconCheck className="w-6 h-6 lg:w-7 lg:h-7" />}
          </button>
        </div>
      </div>

      {isOpen && (
        <div className="p-4 lg:p-6 pt-0 border-t border-blue-50 bg-blue-50/30">
          <div className="flex flex-col gap-6 mt-4">
            {hasVideos ? (
              lesson.youtubeIds.map((videoId, index) => (
                <div key={videoId} className="w-full">
                  {lesson.youtubeIds.length > 1 && (
                    <div className="mb-2 flex items-center gap-2">
                      <span className="bg-blue-600 text-white text-xs font-bold px-2 py-1 rounded">
                        PARTE {index + 1}
                      </span>
                    </div>
                  )}
                  <YouTubePlayer videoId={videoId} title={lesson.title} index={index} />
                </div>
              ))
            ) : (
              <div className="w-full aspect-video rounded-xl border-2 border-dashed border-blue-300 bg-white flex flex-col items-center justify-center p-8 text-center select-none opacity-80 hover:opacity-100 transition-opacity">
                  <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mb-4">
                    <IconVideoOff className="w-8 h-8 text-blue-400" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-600 mb-1">Vídeo não disponível</h3>
                  <p className="text-slate-400 text-sm max-w-md">
                    Esta aula não possui gravação. Por favor, utilize os slides e resumos disponíveis acima para seus estudos.
                  </p>
              </div>
            )}
          </div>
          
          <div className="mt-4 flex flex-col lg:flex-row justify-between items-center text-xs lg:text-sm text-gray-500 gap-2 border-t border-gray-200 pt-3">
             <div className="flex gap-4">
                {/* Correção aqui: usando formatação direta da string */}
                {lesson.date && <span>Data: {formatDisplayDate(lesson.date)}</span>}
             </div>
             {onNavigateToSchedule && (
                <button 
                  onClick={() => onNavigateToSchedule()} 
                  className="flex items-center gap-1.5 text-blue-600 hover:text-blue-800 font-semibold bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition-colors"
                >
                    <IconCalendar className="w-4 h-4" />
                    Ver no Cronograma
                </button>
             )}
          </div>
        </div>
      )}
    </div>
  );
};

const ActionButton: React.FC<{ icon: any; onClick: () => void; tooltip: string; disabled?: boolean }> = ({ icon: Icon, onClick, tooltip, disabled }) => (
  <button 
    onClick={(e) => {
      e.stopPropagation();
      if (!disabled) onClick();
    }}
    disabled={disabled}
    className={`p-1.5 lg:p-2 rounded-lg transition-colors ${
      disabled 
      ? 'text-gray-300 cursor-wait' 
      : 'text-slate-500 hover:text-blue-600 hover:bg-blue-50'
    }`}
    title={tooltip}
  >
    <Icon className="w-6 h-6 lg:w-7 lg:h-7" />
  </button>
);

export default ClassList;
