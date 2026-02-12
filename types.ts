export interface User {
  ra: string;
  name: string;
  completedLessons: string[]; // Array of Lesson IDs
  avatarColor: string;
  totalXP: number; // Sistema de Gamificação (Novo)
  // Novo campo para gamificação de trilhas
  exerciseProgress?: Record<string, LevelProgress>; // Key: "{subjectId}_level_{levelNumber}"
}

export interface LevelProgress {
  score: number;      // 0-100
  stars: number;      // 0-3
  unlocked: boolean;
  completedAt: string;
}

export interface Subject {
  id: string;
  title: string;
  icon: string;
  description: string;
  period: number;
  folderName?: string; // Directory name in public/materials
}

export interface Lesson {
  id: string;
  subjectId: string;
  title: string;
  youtubeIds: string[]; // Array of YouTube IDs. Empty array means no video available.
  duration: string;
  category?: string; // For subjects with sub-modules (e.g. Processos Patológicos)
  // New fields for dynamic content
  slideUrl?: string;
  summaryUrl?: string;
  date?: string; // ISO Date string
  
  // Novos campos para Avisos/Cancelamentos
  type?: 'class' | 'notice'; 
  description?: string; // Mensagem explicativa do aviso
  
  // Novo campo para identificação de slots no cronograma
  targetSlots?: string[]; // Array de strings: ['1', '2', '3']
}

export interface Exercise {
  id: string;
  subjectId: string;
  lessonId: string;
  question: string;
  options: string[];
  correctOptionIndex: number;
}

export interface Book {
  id: string;
  title: string;
  author: string;
  edition: string;
  category: string;
  fileName: string;
  color: string;
}

export type ViewState = 'login' | 'classes' | 'schedule' | 'exercises' | 'library' | 'rank' | 'profile' | 'admin';