import React, { useState, useEffect, useMemo, useRef } from 'react';
import { SUBJECTS, EXERCISES } from '../constants';
import { User, Exercise, QuestionList, ExerciseSession } from '../types';
import { 
  BookOpen, Brain, Target, CheckCircle, XCircle, Loader2, Filter, 
  ChevronLeft, ChevronRight, FileText, History, Trash2, Play, Award, Clock, Sparkles, AlertCircle 
} from 'lucide-react';
import { supabase } from '../supabase';

export const normalizeQuestion = (q: any): Exercise => {
  let explanation = q.explanation || '';
  let difficulty = q.difficulty || 'Médio';
  let area = q.area || '';
  let banca = q.banca || '';
  let ano = q.ano || '';

  if (q.explanation && q.explanation.startsWith('{"tags":')) {
    try {
      const parsed = JSON.parse(q.explanation);
      if (parsed.tags) {
        difficulty = parsed.tags.difficulty || difficulty;
        area = parsed.tags.area || area;
        banca = parsed.tags.banca || banca;
        ano = parsed.tags.ano || q.ano || '';
        explanation = parsed.explanation || '';
      }
    } catch (e) {
      // Keep original
    }
  }

  return {
    ...q,
    explanation,
    difficulty: difficulty as 'Fácil' | 'Médio' | 'Difícil',
    area,
    banca,
    ano
  };
};

interface ExerciseViewProps {
  currentUser: User;
  onUpdateUser: (user: User) => void;
  onExit: () => void;
  onAddXP: (amount: number) => void; 
  initialSubjectId?: string;
}

const MultiSelect = ({ options, selected, onChange, placeholder }: { options: string[], selected: string[], onChange: (val: string[]) => void, placeholder: string }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleOption = (option: string) => {
    if (selected.includes(option)) {
      onChange(selected.filter(o => o !== option));
    } else {
      onChange([...selected, option]);
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <div 
        className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg cursor-pointer flex justify-between items-center text-sm"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className="truncate text-gray-700">
          {selected.length === 0 ? placeholder : selected.join(', ')}
        </span>
        <span className="text-gray-400 text-xs">▼</span>
      </div>
      {isOpen && (
        <div className="absolute z-20 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
          {options.map(option => (
            <label key={option} className="flex items-center px-4 py-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-0">
              <input 
                type="checkbox" 
                className="mr-3 h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                checked={selected.includes(option)}
                onChange={() => toggleOption(option)}
              />
              <span className="text-sm text-gray-700">{option}</span>
            </label>
          ))}
        </div>
      )}
    </div>
  );
};

const ExerciseView: React.FC<ExerciseViewProps> = ({ currentUser, onUpdateUser, onExit, onAddXP, initialSubjectId }) => {
  // Navigation tabs
  const [activeTab, setActiveTab] = useState<'internas' | 'enamed'>('internas');
  const [activeSubTab, setActiveSubTab] = useState<'config' | 'history'>('config');

  // Filter states
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>(initialSubjectId || '');
  const [selectedPeriod, setSelectedPeriod] = useState<number | null>(() => {
    if (initialSubjectId) {
      const subj = SUBJECTS.find(s => s.id === initialSubjectId);
      return subj ? subj.period : null;
    }
    return null;
  });
  const [selectedBancas, setSelectedBancas] = useState<string[]>([]);
  const [selectedAreas, setSelectedAreas] = useState<string[]>([]);
  const [selectedEnamedSubjects, setSelectedEnamedSubjects] = useState<string[]>([]);
  const [selectedLessonId, setSelectedLessonId] = useState<string>('');
  const [subjectLessons, setSubjectLessons] = useState<any[]>([]);
  const [allLessons, setAllLessons] = useState<any[]>([]);
  const [difficulty, setDifficulty] = useState<string[]>(['Fácil', 'Médio', 'Difícil']);

  // Database references
  const [allQuestionsLoaded, setAllQuestionsLoaded] = useState<Exercise[]>([]);
  const [isLoadingDb, setIsLoadingDb] = useState(false);
  const [availableLists, setAvailableLists] = useState<QuestionList[]>([]);

  // Resolution lifecycle
  const [resolutionStarted, setResolutionStarted] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [showConfirmFinish, setShowConfirmFinish] = useState(false);
  const [showTags, setShowTags] = useState(false);

  // Active Session states
  const [activeSession, setActiveSession] = useState<ExerciseSession | null>(null);
  const [showSessionConfigModal, setShowSessionConfigModal] = useState(false);
  
  // Custom Session parameters
  const [sessionTitle, setSessionTitle] = useState('');
  const [quantity, setQuantity] = useState<number>(10);
  const [isSimuladoMode, setIsSimuladoMode] = useState(false);
  const [isTempoActive, setIsTempoActive] = useState(false);
  const [tempoSeconds, setTempoSeconds] = useState(90);
  const [isPorFiltroActive, setIsPorFiltroActive] = useState(false);
  const [subjectQuantities, setSubjectQuantities] = useState<Record<string, number>>({});

  // Countdown timer per question
  const [timeLeft, setTimeLeft] = useState<number>(0);

  // Sync session list from User model
  const sessionHistory = useMemo<ExerciseSession[]>(() => {
    try {
      const historyStr = currentUser.exerciseProgress?._session_history;
      return historyStr ? JSON.parse(historyStr) : [];
    } catch {
      return [];
    }
  }, [currentUser.exerciseProgress?._session_history]);

  // Save session list helper
  const saveSessionsToUser = async (updatedSessions: ExerciseSession[]) => {
    const updatedUser: User = {
      ...currentUser,
      exerciseProgress: {
        ...(currentUser.exerciseProgress || {}),
        _session_history: JSON.stringify(updatedSessions)
      }
    };
    onUpdateUser(updatedUser);
  };

  // 1. Fetch reference lists and lessons on mount
  useEffect(() => {
    const fetchAllLessons = async () => {
      try {
        const { data, error } = await supabase.from('lessons').select('id, title, subjectId');
        if (!error && data) {
          setAllLessons(data);
        }
      } catch (err) {
        console.error("Error loading lessons reference:", err);
      }
    };
    fetchAllLessons();
  }, []);

  // 2. Fetch all questions from database to filter in real-time on the client
  useEffect(() => {
    const fetchAllQuestions = async () => {
      setIsLoadingDb(true);
      try {
        const { data, error } = await supabase.from('questions').select('*');
        if (!error && data) {
          const normalized = data.map(normalizeQuestion);
          setAllQuestionsLoaded(normalized);
        }
      } catch (err) {
        console.error("Erro ao carregar banco de questões:", err);
      } finally {
        setIsLoadingDb(false);
      }
    };
    fetchAllQuestions();
  }, []);

  // 3. Load lessons and ready-made lists for selected subject
  useEffect(() => {
    const fetchLessonsAndLists = async () => {
      if (selectedSubjectId) {
        try {
          const { data: snapLessons, error: lessonsError } = await supabase
            .from('lessons')
            .select('*')
            .eq('subjectId', selectedSubjectId);
          if (!lessonsError && snapLessons) {
            setSubjectLessons(snapLessons);
          }

          const { data: snapLists, error: listsError } = await supabase
            .from('question_lists')
            .select('*')
            .eq('subjectId', selectedSubjectId);
          if (!listsError && snapLists) {
            setAvailableLists(snapLists);
          }
        } catch (error) {
          console.error("Erro ao buscar dados do assunto:", error);
        }
      } else {
        setSubjectLessons([]);
        setAvailableLists([]);
      }
      setSelectedLessonId('');
    };
    fetchLessonsAndLists();
  }, [selectedSubjectId]);

  // Reset tags visible state when active question changes
  useEffect(() => {
    setShowTags(false);
  }, [currentQuestionIndex]);

  // Toggle difficulty values array
  const toggleDifficulty = (level: string) => {
    setDifficulty(prev => {
      if (prev.includes(level)) {
        if (prev.length === 1) return prev; // prevent unselecting all
        return prev.filter(d => d !== level);
      } else {
        return [...prev, level];
      }
    });
  };

  // 4. Pure Compute: Compute matched questions from database/fallbacks in Real-time
  const filteredQuestions = useMemo<Exercise[]>(() => {
    let source = allQuestionsLoaded.length > 0 ? allQuestionsLoaded : EXERCISES.map(normalizeQuestion);
    
    if (activeTab === 'internas') {
      // Period filter
      if (selectedPeriod) {
        const subjectsInPeriod = SUBJECTS.filter(s => s.period === selectedPeriod).map(s => s.id);
        source = source.filter(q => q.subjectId && subjectsInPeriod.includes(q.subjectId));
      }
      // Subject filter
      if (selectedSubjectId) {
        source = source.filter(q => q.subjectId === selectedSubjectId);
      }
      // Lesson filter
      if (selectedLessonId) {
        source = source.filter(q => q.lessonId === selectedLessonId);
      }
    } else {
      // ENAMED
      if (selectedPeriod) {
        const subjectsInPeriod = SUBJECTS.filter(s => s.period === selectedPeriod).map(s => s.id);
        source = source.filter(q => q.subjectId && subjectsInPeriod.includes(q.subjectId));
      }
      if (selectedEnamedSubjects.length > 0) {
        const subjectIds = SUBJECTS.filter(s => selectedEnamedSubjects.includes(s.title)).map(s => s.id);
        source = source.filter(q => q.subjectId && subjectIds.includes(q.subjectId));
      }
      if (selectedBancas.length > 0) {
        source = source.filter(q => q.banca && selectedBancas.includes(q.banca));
      }
      if (selectedAreas.length > 0) {
        source = source.filter(q => q.area && selectedAreas.includes(q.area));
      }
    }

    // Difficulty filter (applies to both)
    source = source.filter(q => difficulty.includes(q.difficulty || 'Médio'));

    return source;
  }, [allQuestionsLoaded, activeTab, selectedPeriod, selectedSubjectId, selectedLessonId, selectedEnamedSubjects, selectedBancas, selectedAreas, difficulty]);

  // Adjust selected quantity to be capped by total matched available in real-time
  useEffect(() => {
    if (filteredQuestions.length > 0 && quantity > filteredQuestions.length) {
      setQuantity(filteredQuestions.length);
    }
  }, [filteredQuestions.length, quantity]);

  // Subjects present in currently filtered questions (used for "Por Filtro" slider distribution)
  const subjectsInFiltered = useMemo(() => {
    const ids = Array.from(new Set(filteredQuestions.map(q => q.subjectId).filter(Boolean)));
    return SUBJECTS.filter(s => ids.includes(s.id));
  }, [filteredQuestions]);

  // Initialize and distribute quantities smart/even when "Por filtro" is activated
  useEffect(() => {
    if (isPorFiltroActive && subjectsInFiltered.length > 0) {
      const initial: Record<string, number> = {};
      subjectsInFiltered.forEach(sub => {
        const available = filteredQuestions.filter(q => q.subjectId === sub.id).length;
        // Divide total quantity among matching subjects evenly, capped at available
        const share = Math.min(available, Math.max(1, Math.floor(quantity / subjectsInFiltered.length)));
        initial[sub.id] = share;
      });
      setSubjectQuantities(initial);
    }
  }, [isPorFiltroActive, subjectsInFiltered, filteredQuestions]);

  // Active filters tags with quick clear
  const activeFiltersTags = useMemo(() => {
    const tags = [];
    if (selectedPeriod) {
      tags.push({ id: 'period', label: `${selectedPeriod}º Período`, onClear: () => setSelectedPeriod(null) });
    }
    if (selectedSubjectId) {
      const subj = SUBJECTS.find(s => s.id === selectedSubjectId);
      tags.push({ id: 'subject', label: subj ? subj.title : selectedSubjectId, onClear: () => setSelectedSubjectId('') });
    }
    if (selectedLessonId) {
      const les = allLessons.find(l => l.id === selectedLessonId);
      tags.push({ id: 'lesson', label: les ? les.title : 'Aula específica', onClear: () => setSelectedLessonId('') });
    }
    selectedEnamedSubjects.forEach(s => {
      tags.push({ id: `enamedSubj-${s}`, label: s, onClear: () => setSelectedEnamedSubjects(prev => prev.filter(item => item !== s)) });
    });
    selectedBancas.forEach(b => {
      tags.push({ id: `banca-${b}`, label: b, onClear: () => setSelectedBancas(prev => prev.filter(item => item !== b)) });
    });
    selectedAreas.forEach(a => {
      tags.push({ id: `area-${a}`, label: a, onClear: () => setSelectedAreas(prev => prev.filter(item => item !== a)) });
    });
    if (difficulty.length < 3) {
      difficulty.forEach(d => {
        tags.push({ id: `diff-${d}`, label: d, onClear: () => toggleDifficulty(d) });
      });
    }
    return tags;
  }, [selectedPeriod, selectedSubjectId, selectedLessonId, selectedEnamedSubjects, selectedBancas, selectedAreas, difficulty, allLessons]);

  const handleClearAllFilters = () => {
    setSelectedPeriod(null);
    setSelectedSubjectId('');
    setSelectedLessonId('');
    setSelectedEnamedSubjects([]);
    setSelectedBancas([]);
    setSelectedAreas([]);
    setDifficulty(['Fácil', 'Médio', 'Difícil']);
  };

  // Click on "Resolver questões" action -> open Study Session setup config modal
  const handleOpenResolutionSetup = () => {
    if (filteredQuestions.length === 0) return;
    setSessionTitle(`Sessão #${sessionHistory.length + 1}`);
    setShowSessionConfigModal(true);
  };

  // Click "Iniciar" in the modal -> Create Session, save to history, and start resolution
  const handleStartStudySession = () => {
    let finalQuestions: Exercise[] = [];

    if (isPorFiltroActive) {
      // Gather specified counts per subject
      Object.entries(subjectQuantities).forEach(([subId, qty]) => {
        if (qty <= 0) return;
        const matchingSubjectQuestions = filteredQuestions.filter(q => q.subjectId === subId);
        const shuffled = [...matchingSubjectQuestions].sort(() => 0.5 - Math.random());
        finalQuestions.push(...shuffled.slice(0, qty));
      });
      // Shuffle combined list
      finalQuestions = finalQuestions.sort(() => 0.5 - Math.random());
    } else {
      // Shuffled sample of general filtered list
      const shuffled = [...filteredQuestions].sort(() => 0.5 - Math.random());
      finalQuestions = shuffled.slice(0, quantity);
    }

    if (finalQuestions.length === 0) {
      alert("Selecione pelo menos 1 questão.");
      return;
    }

    const newSession: ExerciseSession = {
      id: 'sess_' + Date.now(),
      title: sessionTitle || `Sessão #${sessionHistory.length + 1}`,
      createdAt: new Date().toISOString(),
      filters: {
        activeTab,
        period: selectedPeriod,
        subjectId: selectedSubjectId,
        lessonId: selectedLessonId,
        bancas: selectedBancas,
        areas: selectedAreas,
        enamedSubjects: selectedEnamedSubjects,
        difficulty
      },
      questions: finalQuestions,
      answers: {},
      isCompleted: false,
      mode: isPorFiltroActive ? 'filtro' : (isSimuladoMode ? 'simulado' : 'normal'),
      timePerQuestion: isTempoActive ? tempoSeconds : 0,
      timeRemaining: isTempoActive ? tempoSeconds : 0,
      lastActiveIndex: 0
    };

    // Save and load active
    const updatedHistory = [newSession, ...sessionHistory];
    saveSessionsToUser(updatedHistory);

    setActiveSession(newSession);
    setResolutionStarted(true);
    setCurrentQuestionIndex(0);
    setShowSessionConfigModal(false);
  };

  // Launch pre-made list using session format to archive list history & progress in real-time
  const startListResolution = (list: QuestionList) => {
    const listSession: ExerciseSession = {
      id: 'list_' + list.id + '_' + Date.now(),
      title: `Lista: ${list.title}`,
      createdAt: new Date().toISOString(),
      filters: {
        activeTab: 'internas',
        period: list.period,
        subjectId: list.subjectId,
        lessonId: '',
        bancas: [],
        areas: [],
        enamedSubjects: [],
        difficulty: ['Fácil', 'Médio', 'Difícil']
      },
      questions: list.questions,
      answers: {},
      isCompleted: false,
      mode: 'normal'
    };

    const updatedHistory = [listSession, ...sessionHistory];
    saveSessionsToUser(updatedHistory);

    setActiveSession(listSession);
    setResolutionStarted(true);
    setCurrentQuestionIndex(0);
  };

  // Retrieve finished session or uncompleted session
  const handleResumeSession = (session: ExerciseSession) => {
    setActiveSession(session);
    setResolutionStarted(true);
    setCurrentQuestionIndex(session.lastActiveIndex || 0);
  };

  const handleDeleteSession = (sessionId: string) => {
    if (window.confirm("Deseja mesmo excluir esta sessão de seu histórico?")) {
      const updated = sessionHistory.filter(s => s.id !== sessionId);
      saveSessionsToUser(updated);
    }
  };

  // Updates current active session in state & database
  const updateActiveSessionInHistory = (updated: ExerciseSession) => {
    setActiveSession(updated);
    const updatedHistory = sessionHistory.map(s => s.id === updated.id ? updated : s);
    saveSessionsToUser(updatedHistory);
  };

  // Answer options during session
  const handleOptionSelectInSession = (questionId: string, optionIndex: number) => {
    if (!activeSession || activeSession.isCompleted) return;
    
    const updatedAnswers = { ...activeSession.answers, [questionId]: optionIndex };
    const updatedSession: ExerciseSession = {
      ...activeSession,
      answers: updatedAnswers,
      lastActiveIndex: currentQuestionIndex
    };
    updateActiveSessionInHistory(updatedSession);
  };

  // Countdown timers per question
  useEffect(() => {
    if (!activeSession || activeSession.isCompleted || !activeSession.timePerQuestion || !resolutionStarted) return;
    
    // Reset timer to original duration upon changing questions
    setTimeLeft(activeSession.timePerQuestion);
  }, [currentQuestionIndex, activeSession?.id, activeSession?.isCompleted, resolutionStarted]);

  useEffect(() => {
    if (!activeSession || activeSession.isCompleted || !activeSession.timePerQuestion || !resolutionStarted || timeLeft <= 0) return;

    const interval = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          // Time expired! Navigate to next question automatically
          if (currentQuestionIndex < activeSession.questions.length - 1) {
            setCurrentQuestionIndex(idx => idx + 1);
          } else {
            // Last question, submit entire session
            handleFinishSession();
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [timeLeft, activeSession?.id, activeSession?.isCompleted, resolutionStarted]);

  // Finalize Resolution session
  const handleFinishSession = () => {
    if (!activeSession) return;
    
    setShowConfirmFinish(false);

    // Calc metrics
    let correct = 0;
    activeSession.questions.forEach(q => {
      if (activeSession.answers[q.id] === q.correctOptionIndex) {
        correct++;
      }
    });

    // Gamification XP
    let diffMultiplier = 2;
    const difficulties = activeSession.questions.map(q => q.difficulty || 'Médio');
    if (difficulties.includes('Difícil')) diffMultiplier = 3;
    else if (difficulties.every(d => d === 'Fácil')) diffMultiplier = 1;

    const xpEarned = correct * 10 * diffMultiplier;

    const completed: ExerciseSession = {
      ...activeSession,
      isCompleted: true,
      correctCount: correct,
      xpEarned,
      lastActiveIndex: currentQuestionIndex
    };

    if (xpEarned > 0) {
      onAddXP(xpEarned);
    }

    updateActiveSessionInHistory(completed);
  };

  // Back from active session back to study panel view
  const handleExitSession = () => {
    setActiveSession(null);
    setResolutionStarted(false);
  };

  // ---------------- RENDERING RESOLUTION MODE ----------------
  if (resolutionStarted && activeSession) {
    const currentQuestion = activeSession.questions[currentQuestionIndex];
    const isCompleted = activeSession.isCompleted;
    const isSimulado = activeSession.mode === 'simulado';
    const isSelectedFinishedAndAnswred = activeSession.answers[currentQuestion.id] !== undefined;
    
    // In normal study mode, check immediately. In Simulado, show results only after final submission.
    const showAnswersNow = isCompleted || !isSimulado;
    
    const correctAnswersCount = activeSession.questions.filter(q => activeSession.answers[q.id] === q.correctOptionIndex).length;
    const pctCorrect = activeSession.questions.length > 0 ? Math.round((correctAnswersCount / activeSession.questions.length) * 100) : 0;

    return (
      <div className="min-h-[100dvh] bg-slate-50 flex flex-col font-sans">
        {/* Navigation / Session Header */}
        <div className="bg-white border-b border-gray-200 p-4 sticky top-0 z-10 shadow-xs flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button 
              onClick={handleExitSession} 
              className="text-slate-500 hover:text-slate-800 transition-colors p-1.5 rounded-lg hover:bg-slate-50"
              title="Sair da Sessão"
            >
              <ChevronLeft size={22} />
            </button>
            <div>
              <h2 className="text-md font-black text-slate-800 truncate max-w-[200px] sm:max-w-md">{activeSession.title}</h2>
              <p className="text-xs text-slate-400 font-medium">
                {isSimulado ? 'Modo Simulado • ' : 'Modo Prática • '} {activeSession.questions.length} questões
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Countdown timer */}
            {activeSession.timePerQuestion > 0 && !isCompleted && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 border border-rose-100 rounded-xl text-rose-600 font-extrabold text-sm shadow-xs animate-pulse">
                <Clock size={16} />
                <span>
                  {Math.floor(timeLeft / 60).toString().padStart(2, '0')}:
                  {(timeLeft % 60).toString().padStart(2, '0')}
                </span>
              </div>
            )}

            {!isCompleted && (
              <button
                onClick={() => {
                  const answered = Object.keys(activeSession.answers).length;
                  if (answered < activeSession.questions.length) {
                    setShowConfirmFinish(true);
                  } else {
                    handleFinishSession();
                  }
                }}
                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-extrabold rounded-xl text-sm transition-all shadow-xs"
              >
                Finalizar
              </button>
            )}
          </div>
        </div>

        {/* Finish Warning modal */}
        {showConfirmFinish && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
            <div className="bg-white p-6 rounded-3xl shadow-2xl border border-slate-100 max-w-sm text-center space-y-4 animate-scaleUp">
              <div className="w-12 h-12 bg-amber-50 rounded-full flex items-center justify-center text-amber-500 mx-auto">
                <AlertCircle size={24} />
              </div>
              <h3 className="text-lg font-black text-slate-800">Finalizar Sessão?</h3>
              <p className="text-sm text-slate-500 leading-relaxed">
                Você respondeu {Object.keys(activeSession.answers).length} de {activeSession.questions.length} questões. Deseja finalizar mesmo assim?
              </p>
              <div className="flex gap-3 justify-center pt-2">
                <button 
                  onClick={() => setShowConfirmFinish(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition"
                >
                  Continuar respondendo
                </button>
                <button 
                  onClick={handleFinishSession}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs transition"
                >
                  Sim, finalizar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Content columns */}
        <div className="flex-1 max-w-5xl mx-auto w-full p-4 md:p-8 flex flex-col md:flex-row gap-8">
          {/* Main Question Display column */}
          <div className="flex-1">
            <div className="bg-white rounded-3xl shadow-sm border border-slate-200/60 overflow-hidden">
              <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                <div>
                  <span className="font-extrabold text-slate-400 text-xs uppercase tracking-wider block mb-0.5">Questão {currentQuestionIndex + 1} de {activeSession.questions.length}</span>
                  {(currentQuestion.banca || currentQuestion.ano) && (
                    <span className="text-xs font-bold text-slate-600 flex items-center gap-1.5">
                      <span className="bg-slate-200 px-2.5 py-0.5 rounded text-slate-700 font-extrabold uppercase text-[10px]">
                        {currentQuestion.banca || 'Outros'}
                      </span>
                      {currentQuestion.ano && (
                        <span className="text-slate-400 text-[11px] font-bold">• {currentQuestion.ano}</span>
                      )}
                    </span>
                  )}
                </div>
                
                <div className="flex items-center gap-2.5 shrink-0 self-end sm:self-auto">
                  {showAnswersNow && activeSession.answers[currentQuestion.id] !== undefined && (
                    <span className={`font-bold px-3 py-1 rounded-full text-xs ${
                      activeSession.answers[currentQuestion.id] === currentQuestion.correctOptionIndex 
                        ? 'bg-green-100 text-green-700 border border-green-200' 
                        : 'bg-red-100 text-red-700 border border-red-200'
                    }`}>
                      {activeSession.answers[currentQuestion.id] === currentQuestion.correctOptionIndex ? 'Correta' : 'Incorreta'}
                    </span>
                  )}
                  <button 
                    onClick={() => setShowTags(prev => !prev)}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-600 rounded-xl transition shadow-xs"
                  >
                    <span>{showTags ? 'Ocultar Detalhes' : 'Detalhes'}</span>
                    <svg className={`w-3 h-3 text-blue-600 transition-transform ${showTags ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                </div>
              </div>

              <div className="p-6 md:p-8 space-y-6">
                {/* 5 MedEvo Inspired Tags Panel */}
                {showTags && (
                  <div className="space-y-2 bg-slate-50/50 p-4 rounded-2xl border border-slate-150 animate-fadeIn">
                    {/* Linha 1: Banca da prova, Ano, Grande área e Nível da questão */}
                    <div className="flex flex-wrap gap-2 items-center">
                      <span className="text-[10px] md:text-[11px] font-extrabold uppercase px-2.5 py-1 rounded-lg bg-blue-900 border border-blue-950 text-blue-50 shadow-xs">
                        {currentQuestion.banca || 'Origem Geral'}
                      </span>
                      {currentQuestion.ano && (
                        <span className="text-[10px] md:text-[11px] font-extrabold uppercase px-2.5 py-1 rounded-lg border border-slate-200 bg-slate-100 text-slate-600 shadow-xs">
                          {currentQuestion.ano}
                        </span>
                      )}
                      <span className="text-[10px] md:text-[11px] font-extrabold uppercase px-2.5 py-1 rounded-lg border border-blue-250 bg-blue-50 text-blue-600 shadow-xs">
                        {currentQuestion.area || 'Ciências Biológicas'}
                      </span>
                      <span className={`text-[10px] md:text-[11px] font-extrabold uppercase px-2.5 py-1 rounded-lg border shadow-xs inline-flex items-center gap-1.5 ${
                        (currentQuestion.difficulty || 'Médio') === 'Fácil' 
                          ? 'bg-emerald-50 border-emerald-200 text-emerald-700' 
                          : (currentQuestion.difficulty || 'Médio') === 'Médio'
                            ? 'bg-amber-50 border-amber-200 text-amber-700'
                            : 'bg-rose-50 border-rose-200 text-rose-700'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                          (currentQuestion.difficulty || 'Médio') === 'Fácil' ? 'bg-emerald-500' : 
                          (currentQuestion.difficulty || 'Médio') === 'Médio' ? 'bg-amber-500' : 'bg-rose-500'
                        }`} />
                        {currentQuestion.difficulty || 'Médio'}
                      </span>
                    </div>

                    {/* Linha 2: Contexto Acadêmico (Laranjas + Amarelos) */}
                    <div className="flex flex-wrap gap-2 items-center">
                      <span className="text-[10px] md:text-[11px] font-extrabold uppercase px-2.5 py-1 rounded-lg border border-orange-200 bg-orange-50 text-orange-700 shadow-xs">
                        {SUBJECTS.find(s => s.id === currentQuestion.subjectId)?.title || currentQuestion.subjectId || 'Disciplina'}
                      </span>
                      <span className="text-[10px] md:text-[11px] font-extrabold uppercase px-2.5 py-1 rounded-lg border border-yellow-200 bg-yellow-50 text-yellow-700 shadow-xs">
                        {allLessons.find(l => l.id === currentQuestion.lessonId)?.title || 'Aula Geral'}
                      </span>
                    </div>
                  </div>
                )}

                <h4 className="text-lg font-semibold text-slate-850 leading-relaxed">
                  {currentQuestion.question}
                </h4>

                {/* Question alternatives options list */}
                <div className="space-y-3.5">
                  {currentQuestion.options.map((opt, optIndex) => {
                    const isSelected = activeSession.answers[currentQuestion.id] === optIndex;
                    const isCorrect = optIndex === currentQuestion.correctOptionIndex;
                    
                    let optionClass = "border-slate-200 hover:border-blue-200 hover:bg-blue-50/20 text-slate-700";
                    
                    if (showAnswersNow) {
                      if (isCorrect) {
                        optionClass = "border-green-500 bg-green-50 text-green-800 font-bold shadow-xs";
                      } else if (isSelected && !isCorrect) {
                        optionClass = "border-red-500 bg-red-50 text-red-800";
                      } else {
                        optionClass = "border-slate-150 text-slate-400 opacity-60";
                      }
                    } else if (isSelected) {
                      optionClass = "border-blue-600 bg-blue-50/50 text-blue-800 font-bold ring-2 ring-blue-600 ring-offset-1";
                    }

                    return (
                      <button
                        key={optIndex}
                        onClick={() => handleOptionSelectInSession(currentQuestion.id, optIndex)}
                        disabled={isCompleted}
                        className={`w-full text-left p-4 rounded-2xl border transition-all flex items-center justify-between group ${optionClass}`}
                      >
                        <span className="flex-1 text-sm leading-relaxed">{opt}</span>
                        {showAnswersNow && isCorrect && <CheckCircle className="text-green-500 w-5 h-5 flex-shrink-0 ml-3" />}
                        {showAnswersNow && isSelected && !isCorrect && <XCircle className="text-red-500 w-5 h-5 flex-shrink-0 ml-3" />}
                      </button>
                    );
                  })}
                </div>

                {/* Resolution Explanation Panel */}
                {showAnswersNow && (isSelectedFinishedAndAnswred || isCompleted) && currentQuestion.explanation && (
                  <div className="p-5 bg-blue-50 rounded-2xl border border-blue-100 animate-fadeIn mt-6">
                    <h5 className="font-extrabold text-blue-800 mb-2 flex items-center gap-2 text-sm uppercase tracking-wider">
                      <BookOpen size={16} />
                      Resolução comentada
                    </h5>
                    <p className="text-blue-900 text-sm leading-relaxed whitespace-pre-line">
                      {currentQuestion.explanation}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Back / Next actions bar */}
            <div className="flex justify-between mt-6">
              <button 
                onClick={() => setCurrentQuestionIndex(prev => Math.max(0, prev - 1))}
                disabled={currentQuestionIndex === 0}
                className="px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 disabled:opacity-50 flex items-center gap-2 font-bold text-xs transition shadow-xs"
              >
                <ChevronLeft size={16} /> Anterior
              </button>
              <button 
                onClick={() => setCurrentQuestionIndex(prev => Math.min(activeSession.questions.length - 1, prev + 1))}
                disabled={currentQuestionIndex === activeSession.questions.length - 1}
                className="px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 disabled:opacity-50 flex items-center gap-2 font-bold text-xs transition shadow-xs"
              >
                Próxima <ChevronRight size={16} />
              </button>
            </div>
          </div>

          {/* Grid Panel navigation column */}
          <div className="w-full md:w-64 shrink-0">
            <div className="bg-white rounded-3xl shadow-sm border border-slate-200/60 p-5 sticky top-24 space-y-6">
              <h3 className="font-black text-slate-800 text-sm uppercase tracking-wider">Navegação</h3>
              <div className="grid grid-cols-5 gap-2">
                {activeSession.questions.map((q, idx) => {
                  const isAnswered = activeSession.answers[q.id] !== undefined;
                  const isCurrent = currentQuestionIndex === idx;
                  let itemClass = "bg-slate-50 border-slate-150 text-slate-600 hover:bg-slate-100";
                  
                  if (showAnswersNow) {
                    const matchesGabarito = activeSession.answers[q.id] === q.correctOptionIndex;
                    itemClass = matchesGabarito 
                      ? "bg-green-50 border-green-200 text-green-700 font-bold" 
                      : (isAnswered ? "bg-red-50 border-red-200 text-red-700 font-bold" : "bg-slate-50 border-slate-150 text-slate-300");
                  } else if (isCurrent) {
                    itemClass = "bg-blue-600 border-blue-600 text-white font-extrabold shadow-sm";
                  } else if (isAnswered) {
                    itemClass = "bg-blue-55 border-blue-200 text-blue-700 font-bold";
                  }

                  return (
                    <button
                      key={q.id}
                      onClick={() => setCurrentQuestionIndex(idx)}
                      className={`w-10 h-10 rounded-xl border flex items-center justify-center text-xs transition-colors ${itemClass}`}
                    >
                      {idx + 1}
                    </button>
                  );
                })}
              </div>
              
              {/* Score Display */}
              {isCompleted && (
                <div className="pt-5 border-t border-slate-100 text-center space-y-3">
                  <div className="text-3xl font-black text-blue-600 tracking-tight">
                    {pctCorrect}%
                  </div>
                  <div className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">Acertos da Sessão</div>
                  <p className="text-xs text-slate-500 leading-relaxed font-medium">
                    Você acertou {correctAnswersCount} de {activeSession.questions.length} questões.
                  </p>
                  {activeSession.xpEarned && activeSession.xpEarned > 0 ? (
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 border border-emerald-100 rounded-xl text-emerald-700 text-xs font-bold shadow-xs">
                      <Award size={14} />
                      <span>+{activeSession.xpEarned} XP Conquistados!</span>
                    </div>
                  ) : null}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ---------------- RENDERING SEARCH / FILTERS MODE ----------------
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 p-4 sticky top-0 z-10 shadow-xs flex items-center gap-4">
        <button 
          onClick={onExit}
          className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-500 hover:text-slate-850"
          title="Voltar ao início"
        >
          <ChevronLeft size={24} />
        </button>
        <div>
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <BookOpen size={24} className="text-blue-600" />
            Banco de Questões
          </h2>
          <p className="text-xs text-slate-500">Crie sessões personalizadas de Resolução de questões</p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto w-full p-4 md:p-8 flex-1 flex flex-col items-center space-y-8">
        
        {/* Core Sub Tabs: Setup Study vs Session History */}
        <div className="flex bg-slate-100 p-1.5 rounded-2xl border border-slate-200 max-w-md w-full shadow-xs">
          <button
            onClick={() => setActiveSubTab('config')}
            className={`flex-1 py-2.5 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-2 ${activeSubTab === 'config' ? 'bg-white text-slate-800 shadow-xs border border-slate-200/40' : 'text-slate-500 hover:text-slate-800'}`}
          >
            <Filter size={14} />
            Criador de sessão
          </button>
          <button
            onClick={() => setActiveSubTab('history')}
            className={`flex-1 py-2.5 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-2 relative ${activeSubTab === 'history' ? 'bg-white text-slate-800 shadow-xs border border-slate-200/40' : 'text-slate-500 hover:text-slate-800'}`}
          >
            <History size={14} />
            Arquivo de sessões
            {sessionHistory.some(s => !s.isCompleted) && (
              <span className="absolute top-2.5 right-2 w-2 h-2 bg-blue-600 rounded-full animate-ping" />
            )}
            {sessionHistory.some(s => !s.isCompleted) && (
              <span className="absolute top-2.5 right-2 w-2 h-2 bg-blue-500 rounded-full" />
            )}
          </button>
        </div>

        {activeSubTab === 'config' ? (
          <>
            {/* MedEvo inspired Header & Live Counter Bar */}
            <div className="w-full bg-white rounded-3xl border border-slate-250/70 p-6 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-6 animate-fadeIn">
              <div className="space-y-1.5 flex-1 text-left">
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-extrabold bg-blue-50 text-blue-700 border border-blue-100 uppercase tracking-wider">
                  <Sparkles size={11} className="text-blue-500" />
                  Prática Diária
                </span>
                <h3 className="text-xl font-black text-slate-800">Filtre questões para estudar</h3>
                <p className="text-sm text-slate-500 leading-relaxed max-w-xl">
                  Escolha o período acadêmico, as disciplinas desejadas e o nível das questões que deseja resolver na sua sessão estudos em resolução de questões
                </p>
                {activeFiltersTags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-3 items-center">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mr-1">Filtros ativos:</span>
                    {activeFiltersTags.map(tag => (
                      <span key={tag.id} className="inline-flex items-center gap-0.5 px-2 py-0.5 text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg border border-slate-200 shadow-xs transition">
                        {tag.label}
                        <button onClick={tag.onClear} className="text-slate-400 hover:text-slate-700 font-bold ml-1 px-1 focus:outline-none">&times;</button>
                      </span>
                    ))}
                    <button 
                      onClick={handleClearAllFilters}
                      className="text-xs font-bold text-blue-600 hover:text-blue-800 hover:underline px-1 py-0.5 ml-2 transition"
                    >
                      Limpar todos
                    </button>
                  </div>
                )}
              </div>
              
              <div className="bg-slate-50 border border-slate-150 p-5 rounded-2xl text-center flex flex-col items-center justify-center min-w-[170px] self-stretch md:self-auto shadow-sm">
                <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block mb-1">Questões filtradas</span>
                <span className="text-4xl font-black text-slate-800 tracking-tight">
                  {filteredQuestions.length}
                </span>
                <span className={`text-xs font-bold flex items-center gap-1.5 mt-2.5 ${filteredQuestions.length > 0 ? 'text-emerald-600' : 'text-amber-600'}`}>
                  <span className={`w-2 h-2 rounded-full ${filteredQuestions.length > 0 ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
                  {filteredQuestions.length > 0 ? 'Pronto para resolver!' : 'Ajuste os filtros'}
                </span>
              </div>
            </div>

            {/* Main Tabs (Internas / ENAMED) */}
            <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200 shadow-xs w-fit mx-auto">
              <button
                onClick={() => setActiveTab('internas')}
                className={`px-6 py-2 rounded-lg font-bold text-xs transition-all border ${
                  activeTab === 'internas' 
                    ? 'bg-[#eefcf4] text-[#0f8a4f] border-[#d3f4e2] shadow-xs' 
                    : 'text-gray-500 hover:text-gray-800 border-transparent'
                }`}
              >
                Modo CURSO
              </button>
              <button
                onClick={() => setActiveTab('enamed')}
                className={`px-6 py-2 rounded-lg font-bold text-xs transition-all border ${
                  activeTab === 'enamed' 
                    ? 'bg-[#eefcf4] text-[#0f8a4f] border-[#d3f4e2] shadow-xs' 
                    : 'text-gray-500 hover:text-gray-800 border-transparent'
                }`}
              >
                Modo ENAMED
              </button>
            </div>

            {/* Filters Input Panel Box */}
            <div className="relative bg-white rounded-3xl border border-slate-200 shadow-sm p-6 w-full flex flex-col md:flex-row gap-6 md:gap-8 overflow-hidden text-left">
              {activeTab === 'enamed' && (
                <div className="absolute inset-0 z-10 bg-white/60 backdrop-blur-[2px] flex items-center justify-center">
                  <div className="bg-white px-6 py-4 rounded-xl shadow-lg border border-blue-100 flex flex-col items-center gap-2">
                    <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mb-1">
                      <BookOpen size={20} />
                    </div>
                    <h3 className="font-bold text-slate-800 text-sm">Em Desenvolvimento</h3>
                    <p className="text-xs text-slate-400 text-center max-w-xs">
                      O banco de questões do ENAMED estará disponível em breve.
                    </p>
                  </div>
                </div>
              )}

              {/* Column 1 */}
              <div className="flex-1 space-y-6">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2.5">
                    {activeTab === 'internas' ? 'SELECIONAR PERÍODO:' : 'RELACIONAR COM O PERÍODO:'}
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {[1, 2, 3, 4, 5, 6, 7, 8].map(p => (
                      <button 
                        key={p} 
                        onClick={() => setSelectedPeriod(selectedPeriod === p ? null : p)}
                        className={`py-2 rounded-xl text-sm font-bold transition-colors ${selectedPeriod === p ? 'bg-blue-100 text-blue-700 border border-blue-200' : 'bg-gray-50 text-slate-650 border border-gray-250/70 hover:bg-slate-100'}`}
                      >
                        {p}º
                      </button>
                    ))}
                  </div>
                </div>

                {activeTab === 'internas' && (
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2.5">DISCIPLINAS DISPONÍVEIS NO CURSO:</label>
                    <select 
                      value={selectedSubjectId}
                      onChange={(e) => setSelectedSubjectId(e.target.value)}
                      className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm font-semibold text-slate-700 cursor-pointer"
                    >
                      <option value="">Todas as disciplinas...</option>
                      {SUBJECTS.filter(s => !selectedPeriod || s.period === selectedPeriod).map(s => (
                        <option key={s.id} value={s.id}>{s.period}º P - {s.title}</option>
                      ))}
                    </select>
                  </div>
                )}

                {activeTab === 'enamed' && (
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2.5">Relacionar com Disciplinas do curso:</label>
                    <MultiSelect 
                      options={SUBJECTS.filter(s => !selectedPeriod || s.period === selectedPeriod).map(s => s.title)}
                      selected={selectedEnamedSubjects}
                      onChange={setSelectedEnamedSubjects}
                      placeholder="Selecione as Disciplinas..."
                    />
                  </div>
                )}
              </div>

              {/* Column 2 (ENAMED only) */}
              {activeTab === 'enamed' && (
                <div className="flex-1 space-y-6 md:border-l md:border-gray-150 md:pl-8">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2.5">Banca Aplicadora:</label>
                    <MultiSelect 
                      options={['ENAMED', 'ABEM', 'TP Caipira']}
                      selected={selectedBancas}
                      onChange={setSelectedBancas}
                      placeholder="Selecione as Bancas..."
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2.5">Área de Estudo:</label>
                    <MultiSelect 
                      options={['Clínica Médica', 'Pediatria', 'Medicina Preventiva e Social', 'Cirurgia', 'Ginecologia / Obstetrícia', 'Ciências Básicas', 'Saúde Coletiva']}
                      selected={selectedAreas}
                      onChange={setSelectedAreas}
                      placeholder="Selecione as Áreas..."
                    />
                  </div>
                </div>
              )}

              {/* Column 3: Difficulty block & Lessons Select */}
              <div className="flex-1 space-y-6 md:border-l md:border-gray-150 md:pl-8">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2.5">NÍVEL DAS QUESTÕES:</label>
                  <div className="grid grid-cols-3 gap-2">
                    {['Fácil', 'Médio', 'Difícil'].map(level => {
                      const isSelected = difficulty.includes(level);
                      return (
                        <button
                          key={level}
                          onClick={() => toggleDifficulty(level)}
                          className={`w-full py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 justify-center border ${
                            isSelected 
                              ? (level === 'Fácil' ? 'bg-green-50 text-green-700 border-green-200' : level === 'Médio' ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-red-50 text-red-700 border-red-200')
                              : 'bg-gray-50 text-slate-600 border-gray-250/70 hover:bg-slate-100'
                          }`}
                        >
                          <span className={`w-2 h-2 rounded-full ${
                            level === 'Fácil' ? 'bg-emerald-500' : level === 'Médio' ? 'bg-amber-500' : 'bg-rose-500'
                          }`} />
                          {level}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {activeTab === 'internas' && (
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2.5">AULAS DAS DISCIPLINAS SELECIONADAS:</label>
                    <select 
                      value={selectedLessonId}
                      onChange={(e) => setSelectedLessonId(e.target.value)}
                      disabled={!selectedSubjectId || subjectLessons.length === 0}
                      className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm font-semibold text-slate-700 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      {!selectedSubjectId ? (
                        <option value="">Todas as aulas...</option>
                      ) : subjectLessons.length === 0 ? (
                        <option value="">Sem aulas registradas...</option>
                      ) : (
                        <>
                          <option value="">Todas as aulas...</option>
                          {subjectLessons.map(l => (
                            <option key={l.id} value={l.id}>{l.title}</option>
                          ))}
                        </>
                      )}
                    </select>
                  </div>
                )}
              </div>
            </div>

            {/* Main Action Action Button */}
            <div className="w-full max-w-sm mx-auto pt-4 flex flex-col items-center">
              <button
                onClick={handleOpenResolutionSetup}
                disabled={filteredQuestions.length === 0 || isLoadingDb || activeTab === 'enamed'}
                className="w-full py-4 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 disabled:cursor-not-allowed text-white font-extrabold rounded-2xl transition-all flex items-center justify-center gap-2 shadow-sm text-sm"
              >
                {isLoadingDb ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Sincronizando...
                  </>
                ) : (
                  'Resolver questões'
                )}
              </button>
              {filteredQuestions.length === 0 && !isLoadingDb && (
                <p className="text-rose-500 font-bold text-[11px] mt-2 flex items-center gap-1 bg-rose-50 px-2 py-1 rounded-lg border border-rose-100">
                  <AlertCircle size={12} />
                  Sem questões disponíveis para os filtros ativos.
                </p>
              )}
            </div>

            {/* Listas Prontas */}
            {activeTab === 'internas' && availableLists.length > 0 && !isLoadingDb && (
              <div className="w-full space-y-4 pt-4 text-left">
                <h4 className="text-xs font-extrabold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <FileText size={14} className="text-slate-400" />
                  Listas prontas disponíveis para estudo
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full">
                  {availableLists.map(list => {
                    const answered = currentUser.listProgress?.[list.id] || 0;
                    const total = list.questions?.length || 0;
                    const pct = total > 0 ? Math.round((answered/total)*100) : 0;
                    return (
                      <div 
                        key={list.id} 
                        onClick={() => startListResolution(list)} 
                        className="bg-white p-5 rounded-3xl shadow-xs border border-slate-200/50 cursor-pointer hover:shadow-md transition-all hover:border-blue-200 group flex flex-col text-left"
                      >
                        <div className="w-10 h-10 bg-purple-50 text-purple-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                          <FileText size={20} />
                        </div>
                        <h3 className="font-extrabold text-slate-800 text-md mb-1 leading-snug truncate">{list.title}</h3>
                        {list.description && <p className="text-slate-400 text-xs mb-4 line-clamp-2 leading-relaxed">{list.description}</p>}
                        <div className="flex-1" />
                        <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[10px] font-extrabold text-slate-400">
                          <span>{answered} DE {total} QUESTÕES RESPONDIDAS</span>
                          <span className="text-blue-600">{pct}%</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </>
        ) : (
          /* Sub-tab: Session history list view */
          <div className="w-full text-left space-y-6 animate-fadeIn">
            <div className="space-y-1">
              <h3 className="text-lg font-black text-slate-800">Seu Histórico de Sessões</h3>
              <p className="text-xs text-slate-500">Acompanhe seu desempenho em simulados e continue de onde parou.</p>
            </div>

            <div className="space-y-4">
              {sessionHistory.length > 0 ? (
                sessionHistory.map(session => {
                  const totalCount = session.questions.length;
                  const answeredCount = Object.keys(session.answers).length;
                  const progressPct = totalCount > 0 ? Math.round((answeredCount / totalCount) * 100) : 0;
                  const dateFormatted = new Date(session.createdAt).toLocaleDateString('pt-BR', {
                    day: '2-digit',
                    month: 'short',
                    hour: '2-digit',
                    minute: '2-digit'
                  });

                  return (
                    <div 
                      key={session.id}
                      className={`bg-white p-5 rounded-3xl border shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all ${
                        session.isCompleted ? 'border-slate-200/50 hover:border-slate-300' : 'border-blue-200 bg-blue-50/10 hover:bg-blue-50/20'
                      }`}
                    >
                      {/* Left: Metadata */}
                      <div className="space-y-2 flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold border ${
                            session.isCompleted 
                              ? 'bg-slate-50 text-slate-500 border-slate-200' 
                              : 'bg-blue-50 text-blue-700 border-blue-100 animate-pulse'
                          }`}>
                            {session.isCompleted ? 'Concluída' : 'Não finalizada'}
                          </span>
                          <span className="text-[10px] text-slate-400 font-bold">{dateFormatted}</span>
                        </div>

                        <h4 className="text-md font-black text-slate-800 truncate" title={session.title}>
                          {session.title}
                        </h4>

                        <div className="flex items-center gap-1.5 text-xs text-slate-400 font-semibold flex-wrap">
                          <span>{session.questions.length} questões</span>
                          <span>•</span>
                          <span className="capitalize">{session.mode === 'simulado' ? 'Modo Simulado' : session.mode === 'filtro' ? 'Por disciplina' : 'Modo Prática'}</span>
                          {session.timePerQuestion && session.timePerQuestion > 0 ? (
                            <>
                              <span>•</span>
                              <span>Tempo: {session.timePerQuestion}s por q</span>
                            </>
                          ) : null}
                        </div>
                      </div>

                      {/* Center: Progress / Performance Indicator */}
                      <div className="w-full md:w-56 space-y-1.5">
                        {session.isCompleted ? (
                          <div className="space-y-1">
                            <div className="flex justify-between items-end text-xs font-bold text-slate-500">
                              <span>Acertos: {session.correctCount} / {totalCount}</span>
                              <span className="text-blue-600">
                                {totalCount > 0 ? Math.round((session.correctCount! / totalCount) * 100) : 0}%
                              </span>
                            </div>
                            <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden border border-slate-200/40">
                              <div 
                                className="bg-emerald-500 h-full rounded-full" 
                                style={{ width: `${totalCount > 0 ? (session.correctCount! / totalCount) * 100 : 0}%` }}
                              />
                            </div>
                            {session.xpEarned && session.xpEarned > 0 ? (
                              <span className="text-[10px] font-extrabold text-emerald-600 flex items-center gap-1 uppercase">
                                <Award size={12} />
                                +{session.xpEarned} XP conquistados
                              </span>
                            ) : null}
                          </div>
                        ) : (
                          <div className="space-y-1">
                            <div className="flex justify-between items-end text-xs font-bold text-slate-500">
                              <span>Respondidas: {answeredCount} / {totalCount}</span>
                              <span className="text-blue-600">{progressPct}%</span>
                            </div>
                            <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden border border-slate-200/40">
                              <div 
                                className="bg-blue-600 h-full rounded-full" 
                                style={{ width: `${progressPct}%` }}
                              />
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Right: Actions */}
                      <div className="flex items-center gap-2 shrink-0 justify-end md:justify-start">
                        {session.isCompleted ? (
                          <button
                            onClick={() => handleResumeSession(session)}
                            className="px-4 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-bold rounded-xl text-xs transition flex items-center gap-1.5 shadow-xs"
                          >
                            <BookOpen size={14} />
                            Rever Resolução
                          </button>
                        ) : (
                          <button
                            onClick={() => handleResumeSession(session)}
                            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs transition flex items-center gap-1.5 shadow-xs animate-pulse"
                          >
                            <Play size={14} />
                            Retomar Sessão
                          </button>
                        )}
                        <button
                          onClick={() => handleDeleteSession(session.id)}
                          className="p-2 border border-transparent hover:border-rose-100 text-slate-400 hover:text-rose-500 hover:bg-rose-50/50 rounded-xl transition"
                          title="Excluir do histórico"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="flex flex-col items-center justify-center p-12 bg-white rounded-3xl border border-slate-200/50 text-center space-y-4 max-w-sm mx-auto">
                  <div className="w-14 h-14 bg-slate-50 rounded-full flex items-center justify-center text-slate-300">
                    <History size={24} />
                  </div>
                  <h4 className="font-extrabold text-slate-700">Histórico limpo</h4>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Você ainda não executou nenhuma sessão personalizada de estudo ou simulado. Seus progressos aparecerão aqui.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

      </div>

      {/* Slide Setup config Modal container markup injection */}
      {showSessionConfigModal && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full border border-slate-200 shadow-2xl p-6 md:p-8 space-y-6 animate-fadeIn max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <h3 className="text-xl font-black text-slate-800 flex items-center gap-2 text-left">
                  <Sparkles size={20} className="text-blue-500" />
                  Configurar Sessão de Estudo
                </h3>
                <p className="text-sm text-slate-500 text-left">
                  Defina as regras e a quantidade de questões antes de começar.
                </p>
              </div>
              <button 
                onClick={() => setShowSessionConfigModal(false)}
                className="p-1.5 hover:bg-slate-100 rounded-xl transition text-slate-400 hover:text-slate-700"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Título da Sessão */}
            <div className="space-y-2 text-left">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Título Personalizado</label>
              <input 
                type="text"
                value={sessionTitle}
                onChange={(e) => setSessionTitle(e.target.value)}
                placeholder={`Ex: Sessão #${sessionHistory.length + 1}`}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-bold text-slate-700 text-sm"
              />
            </div>

            {/* Modo por Filtro (Por Disciplina) */}
            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-150 space-y-3 text-left">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-slate-700">Por filtro (Disciplinas individuais)</h4>
                  <p className="text-xs text-slate-400">Defina quantidades específicas para cada disciplina.</p>
                </div>
                <button 
                  type="button"
                  onClick={() => setIsPorFiltroActive(!isPorFiltroActive)}
                  className={`w-12 h-6 rounded-full transition-colors flex items-center p-1 ${isPorFiltroActive ? 'bg-blue-600' : 'bg-slate-300'}`}
                >
                  <span className={`w-4 h-4 rounded-full bg-white transition-transform ${isPorFiltroActive ? 'translate-x-6' : 'translate-x-0'}`} />
                </button>
              </div>

              {isPorFiltroActive && (
                <div className="space-y-3 pt-3 border-t border-slate-200/50 max-h-48 overflow-y-auto pr-1">
                  {subjectsInFiltered.map(sub => {
                    const available = filteredQuestions.filter(q => q.subjectId === sub.id).length;
                    const chosen = subjectQuantities[sub.id] || 0;
                    return (
                      <div key={sub.id} className="flex items-center justify-between gap-4 text-xs">
                        <span className="font-semibold text-slate-700 truncate max-w-[200px]" title={sub.title}>
                          {sub.title}
                        </span>
                        <div className="flex items-center gap-2 shrink-0">
                          <button 
                            type="button"
                            onClick={() => setSubjectQuantities(prev => ({ ...prev, [sub.id]: Math.max(0, (prev[sub.id] || 0) - 1) }))}
                            className="w-7 h-7 bg-white border border-slate-200 rounded-lg font-bold text-slate-600 hover:bg-slate-100 flex items-center justify-center transition"
                          >
                            -
                          </button>
                          <span className="font-extrabold text-slate-800 text-center w-10">
                            {chosen} <span className="text-[9px] text-slate-400 block font-normal">max: {available}</span>
                          </span>
                          <button 
                            type="button"
                            onClick={() => setSubjectQuantities(prev => ({ ...prev, [sub.id]: Math.min(available, (prev[sub.id] || 0) + 1) }))}
                            className="w-7 h-7 bg-white border border-slate-200 rounded-lg font-bold text-slate-600 hover:bg-slate-100 flex items-center justify-center transition"
                          >
                            +
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Slider de Quantidade (only if not "Por filtro") */}
            {!isPorFiltroActive && (
              <div className="space-y-4 text-left">
                <div className="flex justify-between items-end">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Quantidade Total</span>
                  <span className="text-xl font-black text-blue-600 bg-blue-50 border border-blue-150 px-3 py-1 rounded-xl">
                    {quantity} <span className="text-xs text-slate-400 font-normal">/ {filteredQuestions.length}</span>
                  </span>
                </div>

                <input 
                  type="range"
                  min={1}
                  max={filteredQuestions.length}
                  value={quantity}
                  onChange={(e) => setQuantity(Number(e.target.value))}
                  className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-blue-600"
                />

                {/* Quick Preset Buttons */}
                <div className="flex gap-2">
                  {[5, 10, 15, 20, 30, filteredQuestions.length].map((val, idx) => {
                    if (val > filteredQuestions.length && idx !== 5) return null;
                    const isMax = idx === 5 || val === filteredQuestions.length;
                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setQuantity(val)}
                        className={`flex-1 py-1.5 text-xs font-bold rounded-lg border transition ${
                          quantity === val 
                            ? 'bg-blue-600 border-blue-600 text-white shadow-xs' 
                            : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-600'
                        }`}
                      >
                        {isMax ? 'Máx' : val}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Modo Simulado */}
            <div className="flex items-center justify-between bg-slate-50 p-4 rounded-2xl border border-slate-150 text-left">
              <div className="space-y-0.5">
                <h4 className="text-sm font-bold text-slate-700">Modo Simulado</h4>
                <p className="text-xs text-slate-400">Gabarito e explicações apenas ao finalizar.</p>
              </div>
              <button 
                type="button"
                onClick={() => setIsSimuladoMode(!isSimuladoMode)}
                className={`w-12 h-6 rounded-full transition-colors flex items-center p-1 ${isSimuladoMode ? 'bg-blue-600' : 'bg-slate-300'}`}
              >
                <span className={`w-4 h-4 rounded-full bg-white transition-transform ${isSimuladoMode ? 'translate-x-6' : 'translate-x-0'}`} />
              </button>
            </div>

            {/* Tempo por questão */}
            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-150 space-y-4 text-left">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <h4 className="text-sm font-bold text-slate-700">Tempo por questão</h4>
                  <p className="text-xs text-slate-400">Cronômetro regressivo para cada pergunta.</p>
                </div>
                <button 
                  type="button"
                  onClick={() => setIsTempoActive(!isTempoActive)}
                  className={`w-12 h-6 rounded-full transition-colors flex items-center p-1 ${isTempoActive ? 'bg-blue-600' : 'bg-slate-300'}`}
                >
                  <span className={`w-4 h-4 rounded-full bg-white transition-transform ${isTempoActive ? 'translate-x-6' : 'translate-x-0'}`} />
                </button>
              </div>

              {isTempoActive && (
                <div className="space-y-2 pt-2 border-t border-slate-200/50 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <span className="text-xs font-bold text-slate-500 uppercase">Segundos por questão:</span>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {[45, 60, 90, 120, 180].map(sec => (
                      <button
                        key={sec}
                        type="button"
                        onClick={() => setTempoSeconds(sec)}
                        className={`px-2.5 py-1.5 text-xs font-bold rounded-lg border transition ${
                          tempoSeconds === sec 
                            ? 'bg-blue-600 border-blue-600 text-white' 
                            : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        {sec}s
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Iniciar Button */}
            <button
              onClick={handleStartStudySession}
              disabled={isPorFiltroActive && Object.values(subjectQuantities).reduce((a, b) => a + b, 0) === 0}
              className="w-full py-4 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 disabled:text-slate-400 text-white font-bold rounded-2xl transition-all shadow-md text-sm flex items-center justify-center gap-2"
            >
              <Play size={16} />
              Começar Sessão
            </button>
          </div>
        </div>
      )}

    </div>
  );
};

export default ExerciseView;
