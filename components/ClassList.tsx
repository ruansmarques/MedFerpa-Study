import React, { useState, useEffect } from 'react';
import { Subject, Lesson, User } from '../types';
import { SUBJECTS, LESSONS } from '../constants';
import { IconChevronDown, IconPlay, IconPresentation, IconBook, IconCheck, IconCheckFilled, IconVideoOff } from './Icons';
import { storage } from '../firebase';
import { ref, getDownloadURL } from 'firebase/storage';

interface ClassListProps {
  currentUser: User;
  onUpdateProgress: (lessonId: string) => void;
}

const ClassList: React.FC<ClassListProps> = ({ currentUser, onUpdateProgress }) => {
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState<number>(5); // Default to 5th period
  
  // State for sub-modules (e.g. for Processos Patológicos)
  const [selectedCategory, setSelectedCategory] = useState<string>('Patologia Geral');

  // Touch handling state
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  const allPeriods = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
  // Limit to 8 for the loop logic as per request context "5 of 8"
  const mobilePeriods = [1, 2, 3, 4, 5, 6, 7, 8];
  
  const specialSubjectId = 'proc-patol'; // ID for Processos Patológicos
  const categories = ['Patologia Geral', 'Parasitologia', 'Imunologia', 'Microbiologia'];

  // Reset category when subject changes
  useEffect(() => {
    if (selectedSubject?.id === specialSubjectId) {
      setSelectedCategory('Patologia Geral');
    }
  }, [selectedSubject]);

  // --- Mobile Carousel Logic ---
  // Calculates the 5 visible items based on the selected one to create an infinite loop
  const getVisiblePeriods = (current: number) => {
    const count = mobilePeriods.length;
    const currentIndex = mobilePeriods.indexOf(current);
    
    // We need: current-2, current-1, current, current+1, current+2
    const offsets = [-2, -1, 0, 1, 2];
    
    return offsets.map(offset => {
      // Modulo logic to handle wrapping (e.g., index -1 becomes 7)
      let idx = (currentIndex + offset) % count;
      if (idx < 0) idx += count;
      return mobilePeriods[idx];
    });
  };

  const visiblePeriods = getVisiblePeriods(selectedPeriod);

  // Swipe Handlers
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
      // Next period
      const currentIndex = mobilePeriods.indexOf(selectedPeriod);
      const nextIndex = (currentIndex + 1) % mobilePeriods.length;
      setSelectedPeriod(mobilePeriods[nextIndex]);
    }
    
    if (isRightSwipe) {
      // Prev period
      const currentIndex = mobilePeriods.indexOf(selectedPeriod);
      let prevIndex = (currentIndex - 1) % mobilePeriods.length;
      if (prevIndex < 0) prevIndex += mobilePeriods.length;
      setSelectedPeriod(mobilePeriods[prevIndex]);
    }
  };

  // If no subject selected, show cards
  if (!selectedSubject) {
    const filteredSubjects = SUBJECTS.filter(s => s.period === selectedPeriod);

    return (
      <div className="p-4 lg:p-10 max-w-6xl mx-auto">
        
        {/* --- MOBILE PERIOD SELECTOR (Looping Carousel) --- */}
        <div className="lg:hidden mb-8 relative">
          <div 
            className="flex items-center justify-between px-2 py-4 select-none touch-pan-y"
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={onTouchEnd}
          >
            {/* Left fade hint */}
            <div className="text-gray-300 font-bold text-xs select-none">...</div>

            {visiblePeriods.map((p, index) => {
              // Index 2 is always the center (selected) one in our array of 5
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

            {/* Right fade hint */}
            <div className="text-gray-300 font-bold text-xs select-none">...</div>
          </div>
          
          <p className="text-center text-xs text-gray-400 mt-[-5px] font-medium">
            Deslize para ver mais
          </p>
        </div>

        {/* --- DESKTOP PERIOD SELECTOR (Standard Grid/Flex) --- */}
        <div className="hidden lg:flex items-center justify-center gap-4 mb-12 flex-wrap">
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

  // Filter lessons for selected subject
  let subjectLessons = LESSONS.filter(l => l.subjectId === selectedSubject.id);

  // If it's the special subject (Processos Patológicos), filter by category
  if (selectedSubject.id === specialSubjectId) {
    subjectLessons = subjectLessons.filter(l => l.category === selectedCategory);
  }

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

      {/* Sub-module Selector for Processos Patológicos */}
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
        {subjectLessons.length > 0 ? (
          subjectLessons.map((lesson) => (
            <LessonRow 
              key={lesson.id} 
              lesson={lesson} 
              subjectFolderName={selectedSubject.folderName}
              isCompleted={currentUser.completedLessons.includes(lesson.id)}
              onToggleComplete={() => onUpdateProgress(lesson.id)}
            />
          ))
        ) : (
          <div className="p-12 text-center text-gray-400 bg-white rounded-2xl border border-gray-100 border-dashed">
            <p className="text-lg mb-2">📭</p>
            <p>Nenhuma aula disponível para {selectedSubject.id === specialSubjectId ? selectedCategory : 'esta disciplina'}.</p>
          </div>
        )}
      </div>
    </div>
  );
};

// --- Custom Player Component with SrcDoc to fix Error 153 ---
const YouTubePlayer: React.FC<{ videoId: string; title: string; index: number }> = ({ videoId, title, index }) => {
  const [isPlaying, setIsPlaying] = useState(false);

  if (isPlaying) {
    const embedUrl = `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0&modestbranding=1`;
    
    // Create a sandboxed HTML document for the iframe
    // This removes the referrer by loading the player inside a "blank" document
    const srcDocHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          * { padding: 0; margin: 0; overflow: hidden; }
          body, html { width: 100%; height: 100%; background: #000; }
          iframe { width: 100%; height: 100%; border: 0; }
        </style>
      </head>
      <body>
        <iframe 
          src="${embedUrl}" 
          width="100%" 
          height="100%" 
          frameborder="0" 
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
          allowfullscreen
        ></iframe>
      </body>
      </html>
    `;

    return (
      <div className="aspect-video w-full rounded-xl overflow-hidden shadow-sm bg-black relative">
        <iframe 
          width="100%" 
          height="100%" 
          title={`${title} - Part ${index + 1}`}
          srcDoc={srcDocHtml}
          frameBorder="0" 
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
      {/* Thumbnail Layer */}
      <img 
        src={`https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`} 
        alt={`Thumbnail ${title}`}
        className="w-full h-full object-cover opacity-90 group-hover:opacity-75 transition-all duration-300"
        onError={(e) => {
          // Fallback to hqdefault if maxres doesn't exist
          (e.target as HTMLImageElement).src = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
        }}
      />
      
      {/* Play Button Overlay */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-16 h-16 lg:w-20 lg:h-20 bg-blue-600 rounded-full flex items-center justify-center text-white shadow-xl group-hover:scale-110 transition-transform duration-300 ring-4 ring-blue-600/30">
          <IconPlay className="w-8 h-8 lg:w-10 lg:h-10 ml-1" />
        </div>
      </div>

      {/* Label Overlay */}
      <div className="absolute bottom-4 left-4 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-lg text-white text-xs font-medium border border-white/10">
        Clique para assistir
      </div>
    </div>
  );
};

const LessonRow: React.FC<{ 
  lesson: Lesson; 
  subjectFolderName?: string;
  isCompleted: boolean;
  onToggleComplete: () => void;
}> = ({ lesson, subjectFolderName, isCompleted, onToggleComplete }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoadingFile, setIsLoadingFile] = useState(false);
  
  // Check if lesson has valid video IDs
  const hasVideos = lesson.youtubeIds && lesson.youtubeIds.length > 0 && lesson.youtubeIds[0] !== '';

  const openPdf = async (type: 'slide' | 'resumo') => {
    setIsLoadingFile(true);
    
    const basePath = 'materials';
    const subjectPath = subjectFolderName || 'default';
    
    // Normalize category
    const categoryPath = lesson.category 
      ? lesson.category.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, '-') 
      : '';
    
    const typeFolder = type === 'slide' ? 'slides' : 'resumos';
    const fileName = `${lesson.title}.pdf`;

    // Construct Path
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
      alert(`Arquivo não encontrado no servidor.\nCaminho procurado: ${storagePath}\n\nVerifique se o arquivo foi enviado para o Storage e se a pasta é 'slides' ou 'resumos' (minúsculo).`);
    } finally {
      setIsLoadingFile(false);
    }
  };

  return (
    <div className={`rounded-xl border transition-all duration-300 overflow-hidden ${isOpen ? 'bg-white border-blue-200 shadow-md' : 'bg-slate-100 border-transparent hover:bg-white hover:shadow-sm'}`}>
      
      {/* Header Row - Updated to be Flex Row on ALL screens (centralized) */}
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
          {/* 1st Icon: Play - Toggles Video */}
          <ActionButton icon={IconPlay} onClick={() => setIsOpen(!isOpen)} tooltip="Assistir Aula" />
          
          {/* 2nd Icon: Presentation - Opens Slide PDF */}
          <ActionButton 
            icon={IconPresentation} 
            onClick={() => openPdf('slide')} 
            tooltip={isLoadingFile ? "Buscando..." : "Baixar Slides"} 
            disabled={isLoadingFile}
          />
          
          {/* 3rd Icon: Book - Opens Summary PDF */}
          <ActionButton 
            icon={IconBook} 
            onClick={() => openPdf('resumo')} 
            tooltip={isLoadingFile ? "Buscando..." : "Baixar Resumo"} 
            disabled={isLoadingFile}
          />
          
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
            title={isCompleted ? "Concluída" : "Marcar como concluída"}
          >
            {isCompleted ? <IconCheckFilled className="w-6 h-6 lg:w-7 lg:h-7" /> : <IconCheck className="w-6 h-6 lg:w-7 lg:h-7" />}
          </button>
        </div>
      </div>

      {/* Accordion Content (Videos) */}
      {isOpen && (
        <div className="p-4 lg:p-6 pt-0 border-t border-blue-50 bg-blue-50/30">
          <div className="flex flex-col gap-6 mt-4">
            {hasVideos ? (
              lesson.youtubeIds.map((videoId, index) => (
                <div key={videoId} className="w-full">
                  {/* Show Part Label if more than 1 video */}
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
              // Clean Placeholder Design
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

          <div className="mt-4 flex flex-col lg:flex-row justify-between text-xs lg:text-sm text-gray-500 gap-2 border-t border-gray-200 pt-3">
             <span>Duração total: {lesson.duration}</span>
             <span>ID: {lesson.id}</span>
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