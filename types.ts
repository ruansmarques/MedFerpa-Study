export interface User {
  ra: string;
  name: string;
  completedLessons: string[]; // Array of Lesson IDs
  avatarColor: string;
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
  youtubeId: string;
  duration: string;
  category?: string; // For subjects with sub-modules (e.g. Processos Patológicos)
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

export type ViewState = 'login' | 'classes' | 'exercises' | 'library' | 'rank' | 'profile';