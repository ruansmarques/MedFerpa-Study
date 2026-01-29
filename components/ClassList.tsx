import React, { useState, useEffect } from 'react';
import { Subject, Lesson, User } from '../types';
import { SUBJECTS, LESSONS } from '../constants';
import { IconChevronDown, IconPlay, IconPresentation, IconBook, IconCheck, IconCheckFilled } from './Icons';

interface ClassListProps {
  currentUser: User;
  onUpdateProgress: (lessonId: string) => void;
}

const ClassList: React.FC<ClassListProps> = ({ currentUser, onUpdateProgress }) => {
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState<number>(4); // Default to 4th period
  
  // State for sub-modules (e.g. for Processos Patológicos)
  const [selectedCategory, setSelectedCategory] = useState<string>('Patologia Geral');

  const periods = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
  const specialSubjectId = 'proc-patol'; // ID for Processos Patológicos
  const categories = ['Patologia Geral', 'Parasitologia', 'Imunologia', 'Microbiologia'];

  // Reset category when subject changes
  useEffect(() => {
    if (selectedSubject?.id === specialSubjectId) {
      setSelectedCategory('Patologia Geral');
    }
  }, [selectedSubject]);

  // If no subject selected, show cards
  if (!selectedSubject) {
    const filteredSubjects = SUBJECTS.filter(s => s.period === selectedPeriod);

    return (
      <div className="p-10 max-w-6xl mx-auto">
        {/* Period Selector Header */}
        <div className="flex items-center justify-center gap-4 mb-12">
          {periods.slice(0, 6).map((p) => (
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
          <span className="text-gray-300 font-bold">...</span>
        </div>

        <h2 className="text-2xl font-bold text-slate-800 mb-8">
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
    <div className="p-10 max-w-5xl mx-auto">
      <div className="mb-8 flex items-center gap-4">
        <button 
          onClick={() => setSelectedSubject(null)}
          className="text-sm font-semibold text-gray-400 hover:text-blue-600 transition-colors"
        >
          ← Voltar para {selectedPeriod}º Período
        </button>
        <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
          <span>{selectedSubject.icon}</span>
          {selectedSubject.title}
        </h2>
      </div>

      {/* Sub-module Selector for Processos Patológicos */}
      {selectedSubject.id === specialSubjectId && (
        <div className="flex flex-wrap items-center justify-center gap-3 mb-10 bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
          {categories.map((cat) => (
             <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-5 py-2 rounded-full text-sm font-bold transition-all ${
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

      <div className="space-y-4">
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

const LessonRow: React.FC<{ 
  lesson: Lesson; 
  subjectFolderName?: string;
  isCompleted: boolean;
  onToggleComplete: () => void;
}> = ({ lesson, subjectFolderName, isCompleted, onToggleComplete }) => {
  const [isOpen, setIsOpen] = useState(false);

  const openPdf = (type: 'slide' | 'resumo') => {
    // Logic matches the "Drive" structure requested
    // Root: /materials
    // Subject: [folderName from constants] (e.g., 'semiologia', 'processos-patologicos')
    // Category (optional): [category normalized] (e.g., 'Patologia Geral' -> 'patologia-geral')
    // Type Folder: 'Slides' or 'Resumos'
    // Filename: [Lesson Title].pdf (e.g., 'AULA 01 - Nome da Aula.pdf')
    
    const basePath = '/materials';
    const subjectPath = subjectFolderName || 'default';
    
    // Normalize category: 'Patologia Geral' -> 'patologia-geral'
    const categoryPath = lesson.category 
      ? lesson.category.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, '-') 
      : '';
    
    // Type folders are Capitalized to match screenshots
    const typeFolder = type === 'slide' ? 'Slides' : 'Resumos';
    
    // Filename matches the exact title in the app
    const fileName = `${lesson.title}.pdf`;

    // Construct URL parts
    const parts = [basePath, subjectPath];
    if (categoryPath) parts.push(categoryPath);
    parts.push(typeFolder);
    parts.push(fileName);
    
    const url = parts.join('/');
    
    window.open(url, '_blank');
  };

  return (
    <div className={`rounded-xl border transition-all duration-300 overflow-hidden ${isOpen ? 'bg-white border-blue-200 shadow-md' : 'bg-slate-100 border-transparent hover:bg-white hover:shadow-sm'}`}>
      
      {/* Header Row */}
      <div className="flex items-center justify-between p-4 px-6">
        <div 
          className="flex items-center gap-4 flex-1 cursor-pointer select-none"
          onClick={() => setIsOpen(!isOpen)}
        >
          <div className={`transition-transform duration-300 text-slate-400 ${isOpen ? 'rotate-180 text-blue-600' : ''}`}>
            <IconChevronDown className="w-6 h-6" />
          </div>
          <div className="flex flex-col">
            <span className={`font-semibold text-lg ${isOpen ? 'text-blue-700' : 'text-slate-700'}`}>
              {lesson.title}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* 1st Icon: Play - Toggles Video */}
          <ActionButton icon={IconPlay} onClick={() => setIsOpen(!isOpen)} tooltip="Assistir Aula" />
          
          {/* 2nd Icon: Presentation - Opens Slide PDF */}
          <ActionButton icon={IconPresentation} onClick={() => openPdf('slide')} tooltip="Baixar Slides" />
          
          {/* 3rd Icon: Book - Opens Summary PDF */}
          <ActionButton icon={IconBook} onClick={() => openPdf('resumo')} tooltip="Baixar Resumo" />
          
          <div className="h-6 w-px bg-gray-300 mx-1"></div>
          
          <button 
            onClick={(e) => {
              e.stopPropagation();
              onToggleComplete();
            }}
            className={`p-2 rounded-lg transition-all ${
              isCompleted 
                ? 'text-emerald-500 bg-emerald-50 hover:bg-emerald-100' 
                : 'text-gray-400 hover:text-emerald-500 hover:bg-gray-200'
            }`}
            title={isCompleted ? "Concluída" : "Marcar como concluída"}
          >
            {isCompleted ? <IconCheckFilled className="w-7 h-7" /> : <IconCheck className="w-7 h-7" />}
          </button>
        </div>
      </div>

      {/* Accordion Content */}
      {isOpen && (
        <div className="p-6 pt-0 border-t border-blue-50 bg-blue-50/30">
          <div className="mt-4 aspect-video w-full rounded-xl overflow-hidden shadow-sm bg-black">
            <iframe 
              width="100%" 
              height="100%" 
              src={`https://www.youtube.com/embed/${lesson.youtubeId}?autoplay=1`} 
              title={lesson.title} 
              frameBorder="0" 
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
              allowFullScreen
            ></iframe>
          </div>
          <div className="mt-4 flex justify-between text-sm text-gray-500">
             <span>Duração: {lesson.duration}</span>
             <span>ID: {lesson.id}</span>
          </div>
        </div>
      )}
    </div>
  );
};

const ActionButton: React.FC<{ icon: any; onClick: () => void; tooltip: string }> = ({ icon: Icon, onClick, tooltip }) => (
  <button 
    onClick={(e) => {
      e.stopPropagation();
      onClick();
    }}
    className="p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
    title={tooltip}
  >
    <Icon className="w-7 h-7" />
  </button>
);

export default ClassList;