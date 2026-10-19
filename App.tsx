import React, { useState, useEffect, useCallback, useRef } from 'react';
import Login from './components/Login';
import Register from './components/Register';
import LandingPage from './components/LandingPage';
import Sidebar from './components/Sidebar';
import ClassList from './components/ClassList';
import ExerciseView from './components/ExerciseView';
import RankView from './components/RankView';
import ProfileView from './components/ProfileView';
import LibraryView from './components/LibraryView';
import { ScheduleView } from './components/ScheduleView';
import AdminDashboard from './components/AdminDashboard';
import { User, ViewState, LevelProgress } from './types';
import { IconMenu } from './components/Icons';
import { supabase } from './supabase';
import {
  SyncStatus,
  fetchServerUser,
  normalizeUserData,
  mergeSessionHistories,
  toggleLessonProgressSafely,
  saveUserToLocalAndBroadcast,
  calculateTotalXP
} from './services/syncService';

const App: React.FC = () => {
  // Inicializa o estado buscando do LocalStorage para persistir sessão no F5
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    try {
      const savedUserStr = localStorage.getItem('medferpa_user');
      if (savedUserStr) {
        const savedUser = JSON.parse(savedUserStr);
        if (savedUser && typeof savedUser === 'object') {
          return {
            ...savedUser,
            completedLessons: Array.isArray(savedUser.completedLessons) ? savedUser.completedLessons : [],
            totalXP: typeof savedUser.totalXP === 'number' ? savedUser.totalXP : parseInt(savedUser.totalXP as any) || 0,
            exerciseProgress: savedUser.exerciseProgress || {}
          };
        }
      }
      return null;
    } catch (error) {
      console.error("Erro ao recuperar sessão:", error);
      return null;
    }
  });

  // --- MULTI-DEVICE SYNC ENGINE ---
  const [syncStatus, setSyncStatus] = useState<SyncStatus>({
    state: 'idle',
    lastSyncedAt: null
  });

  // Ref to prevent duplicate concurrent syncs
  const isSyncingRef = useRef(false);

  // Centralized sync function that fetches authoritative data from Supabase and reconciles
  const syncWithCloud = useCallback(async (isBackground = false) => {
    if (!currentUser?.ra) return;
    if (isSyncingRef.current) return;

    if (!navigator.onLine) {
      setSyncStatus(prev => ({ ...prev, state: 'offline' }));
      return;
    }

    isSyncingRef.current = true;
    if (!isBackground) {
      setSyncStatus(prev => ({ ...prev, state: 'syncing' }));
    }

    try {
      const serverUser = await fetchServerUser(currentUser.ra);
      if (!serverUser) {
        setSyncStatus(prev => ({ ...prev, state: 'idle' }));
        isSyncingRef.current = false;
        return;
      }

      setCurrentUser(prevUser => {
        if (!prevUser) return serverUser;

        const serverLessons = serverUser.completedLessons || [];
        const prevLessons = prevUser.completedLessons || [];

        // Union of completed lessons ensures progress made on any device is preserved
        const mergedLessons = Array.from(new Set([...serverLessons, ...prevLessons]));

        // Deep merge of exercise session history
        const mergedExerciseProgress = mergeSessionHistories(
          prevUser.exerciseProgress,
          serverUser.exerciseProgress
        );

        // Merge list progress
        const mergedListProgress = {
          ...(serverUser.listProgress || {}),
          ...(prevUser.listProgress || {})
        };

        const resolvedXP = Math.max(
          serverUser.totalXP || 0,
          prevUser.totalXP || 0,
          mergedLessons.length * 10
        );

        const reconciled: User = {
          ...serverUser,
          completedLessons: mergedLessons,
          exerciseProgress: mergedExerciseProgress,
          listProgress: mergedListProgress,
          totalXP: resolvedXP,
          isRankVisible: serverUser.isRankVisible !== undefined ? serverUser.isRankVisible : prevUser.isRankVisible
        };

        // If local had unsaved lessons or progress, update server asynchronously
        const hasUnsyncedLocalLessons = mergedLessons.length > serverLessons.length;
        const hasUnsyncedXP = resolvedXP > (serverUser.totalXP || 0);

        if (hasUnsyncedLocalLessons || hasUnsyncedXP) {
          supabase
            .from('users')
            .update({
              completedLessons: mergedLessons,
              totalXP: resolvedXP,
              exerciseProgress: mergedExerciseProgress,
              listProgress: mergedListProgress
            })
            .eq('ra', reconciled.ra)
            .then(({ error }) => {
              if (error) console.error('[Sync] Erro ao sincronizar com servidor:', error);
            });
        }

        saveUserToLocalAndBroadcast(reconciled);
        return reconciled;
      });

      setSyncStatus({
        state: 'synced',
        lastSyncedAt: new Date()
      });
    } catch (err) {
      console.error('[Sync] Falha durante sincronização:', err);
      setSyncStatus(prev => ({ ...prev, state: 'error' }));
    } finally {
      isSyncingRef.current = false;
    }
  }, [currentUser?.ra]);

  // Initial fetch on mount to sync immediately if user was already in localStorage
  useEffect(() => {
    if (currentUser?.ra) {
      syncWithCloud(false);
    }
  }, []);

  // Multi-event lifecycle sync (focus, visibilitychange, online, periodic heartbeat, cross-tab BroadcastChannel)
  useEffect(() => {
    if (!currentUser?.ra) return;

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        syncWithCloud(true);
      }
    };

    const handleFocus = () => {
      syncWithCloud(true);
    };

    const handleOnline = () => {
      syncWithCloud(false);
    };

    const handleOffline = () => {
      setSyncStatus(prev => ({ ...prev, state: 'offline' }));
    };

    window.addEventListener('focus', handleFocus);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Heartbeat: sync every 12 seconds when active
    const interval = setInterval(() => {
      if (document.visibilityState === 'visible' && navigator.onLine) {
        syncWithCloud(true);
      }
    }, 12000);

    // Cross-tab broadcast listener (within the same machine/browser)
    let bc: BroadcastChannel | null = null;
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      try {
        bc = new BroadcastChannel('medferpa_sync_channel');
        bc.onmessage = (event) => {
          if (event.data?.type === 'USER_UPDATED' && event.data.user?.ra === currentUser.ra) {
            setCurrentUser(event.data.user);
            setSyncStatus({ state: 'synced', lastSyncedAt: new Date() });
          }
        };
      } catch (e) {
        console.warn('BroadcastChannel not supported', e);
      }
    }

    // Supabase Realtime channel as backup push
    const userChannel = supabase.channel(`user-sync-${currentUser.ra}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'users',
          filter: `ra=eq.${currentUser.ra}`
        },
        () => {
          syncWithCloud(true);
        }
      )
      .subscribe();

    return () => {
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      clearInterval(interval);
      if (bc) bc.close();
      supabase.removeChannel(userChannel);
    };
  }, [currentUser?.ra, syncWithCloud]);

  const [authMode, setAuthMode] = useState<'login' | 'register'>(() => {
    if (window.location.pathname === '/cadastrar') return 'register';
    return 'login';
  });

  const [currentView, setCurrentView] = useState<ViewState>(() => {
    if (window.location.pathname === '/admin' || new URLSearchParams(window.location.search).get('view') === 'admin') {
      return 'admin';
    }
    try {
      const savedView = sessionStorage.getItem('medferpa_view_state');
      return (savedView as ViewState) || 'classes';
    } catch {
      return 'classes';
    }
  });

  useEffect(() => {
    try {
      sessionStorage.setItem('medferpa_view_state', currentView);
    } catch (e) {
      console.error("Error saving view state", e);
    }
  }, [currentView]);
  
  // State for Deep Linking (Passing data between views)
  const [viewParams, setViewParams] = useState<{
    targetSubjectId?: string;
    targetLessonId?: string;
    targetDate?: Date;
    targetCategory?: string;
  }>(() => {
    try {
      const saved = sessionStorage.getItem('medferpa_view_params');
      const parsed = saved ? JSON.parse(saved) : {};
      if (parsed.targetDate) {
        parsed.targetDate = new Date(parsed.targetDate);
      }
      return parsed;
    } catch {
      return {};
    }
  });

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    try {
      sessionStorage.setItem('medferpa_view_state', currentView);
      // Removed JSON.stringify to prevent circular reference errors
      // sessionStorage.setItem('medferpa_view_params', JSON.stringify(viewParams));
    } catch (e) {
      console.error("Error saving view state", e);
    }
  }, [currentView, viewParams]);

  // Check URL for admin access on load
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('view') === 'admin' || window.location.pathname === '/admin') {
      setCurrentView('admin');
    }
  }, []);



  // --- LOGICA DE AUTO-CORREÇÃO DE XP COM PROTEÇÃO MULTI-DISPOSITIVOS ---
  useEffect(() => {
    const syncXP = async () => {
      if (!currentUser) return;

      const safeCalculatedXP = calculateTotalXP(currentUser);

      // Apenas atualiza se o cálculo for superior ou diferente de forma segura (evita zerar por estado local obsoleto)
      if (safeCalculatedXP > (currentUser.totalXP || 0)) {
        console.log(`[XP Sync] Sincronizando XP: ${currentUser.totalXP} -> ${safeCalculatedXP}`);
        const updatedUser = { ...currentUser, totalXP: safeCalculatedXP };
        setCurrentUser(updatedUser);
        saveUserToLocalAndBroadcast(updatedUser);

        try {
          await supabase.from("users").update({ totalXP: safeCalculatedXP }).eq('ra', currentUser.ra);
        } catch (error) {
          console.error("Erro ao sincronizar XP:", error);
        }
      }
    };

    syncXP();
  }, [currentUser?.completedLessons?.length, currentUser?.exerciseProgress, currentUser?.ra]);

  useEffect(() => {
    if (currentUser) {
      try {
        localStorage.setItem('medferpa_user', JSON.stringify(currentUser));
      } catch (e) {
        console.error("Erro ao salvar no localStorage", e);
      }
    }
  }, [currentUser]);

  const handleLogin = (user: User) => {
    const normalized = normalizeUserData(user);
    setCurrentUser(normalized);
    saveUserToLocalAndBroadcast(normalized);
    setCurrentView('classes');
    // Trigger immediate cloud sync
    setTimeout(() => syncWithCloud(false), 100);
  };

  const handleLogout = () => {
    localStorage.removeItem('medferpa_user');
    setCurrentUser(null);
    setCurrentView('login');
    setIsMobileMenuOpen(false);
  };

  // Função centralizada para adicionar XP
  const handleAddXP = async (amount: number) => {
    if (!currentUser) return;

    const newTotalXP = Math.max(0, (currentUser.totalXP || 0) + amount);
    const updatedUser = { ...currentUser, totalXP: newTotalXP };
    setCurrentUser(updatedUser);
    saveUserToLocalAndBroadcast(updatedUser);

    try {
      await supabase.from("users").update({ totalXP: newTotalXP }).eq('ra', currentUser.ra);
      setSyncStatus({ state: 'synced', lastSyncedAt: new Date() });
    } catch (error) {
      console.error("Erro ao atualizar XP no banco:", error);
      setSyncStatus(prev => ({ ...prev, state: 'error' }));
    }
  };

  // Atualização segura de progresso de aulas: atualização otimista local imediata + merge atômico na nuvem
  const handleUpdateProgress = async (lessonId: string) => {
    if (!currentUser) return;

    // 1. Atualização otimista imediata para feedback visual instantâneo (0ms)
    const isCompleted = currentUser.completedLessons.includes(lessonId);
    let optimisticLessons: string[];
    let xpChange = 0;

    if (isCompleted) {
      optimisticLessons = currentUser.completedLessons.filter(id => id !== lessonId);
      xpChange = -10;
    } else {
      optimisticLessons = Array.from(new Set([...currentUser.completedLessons, lessonId]));
      xpChange = 10;
    }

    const optimisticXP = Math.max(0, (currentUser.totalXP || 0) + xpChange);
    const optimisticUser: User = {
      ...currentUser,
      completedLessons: optimisticLessons,
      totalXP: optimisticXP
    };

    setCurrentUser(optimisticUser);
    saveUserToLocalAndBroadcast(optimisticUser);
    setSyncStatus({ state: 'syncing', lastSyncedAt: new Date() });

    // 2. Executa merge seguro buscando o estado mais recente do banco para não sobrescrever aulas de outros dispositivos
    try {
      const finalUser = await toggleLessonProgressSafely(currentUser, lessonId);
      setCurrentUser(finalUser);
      setSyncStatus({ state: 'synced', lastSyncedAt: new Date() });
    } catch (error) {
      console.error("Erro ao salvar progresso da aula:", error);
      setSyncStatus(prev => ({ ...prev, state: 'error' }));
    }
  };

  const handleUpdateName = async (newName: string) => {
    if (!currentUser) return;
    const updatedUser = { ...currentUser, name: newName };
    setCurrentUser(updatedUser);
    saveUserToLocalAndBroadcast(updatedUser);
    try {
      await supabase.from("users").update({ name: newName }).eq('ra', currentUser.ra);
      setSyncStatus({ state: 'synced', lastSyncedAt: new Date() });
    } catch (error) {
       console.error("Erro ao salvar nome:", error);
       setSyncStatus(prev => ({ ...prev, state: 'error' }));
    }
  };

  // Atualização segura de sessões e exercícios mantendo histórico mesclado de múltiplos dispositivos
  const handleUpdateUser = async (updatedUser: User) => {
    setCurrentUser(updatedUser);
    saveUserToLocalAndBroadcast(updatedUser);

    if (updatedUser && updatedUser.ra) {
      try {
        setSyncStatus({ state: 'syncing', lastSyncedAt: new Date() });
        // Busca estado do servidor para combinar históricos sem perda
        const serverUser = await fetchServerUser(updatedUser.ra);
        const mergedExercise = mergeSessionHistories(
          updatedUser.exerciseProgress,
          serverUser?.exerciseProgress
        );
        const mergedList = {
          ...(serverUser?.listProgress || {}),
          ...(updatedUser.listProgress || {})
        };

        await supabase.from("users").update({ 
          listProgress: mergedList,
          exerciseProgress: mergedExercise,
          totalXP: updatedUser.totalXP || 0
        }).eq('ra', updatedUser.ra);

        setSyncStatus({ state: 'synced', lastSyncedAt: new Date() });
      } catch (error) {
        console.error("Erro ao atualizar o usuário no banco:", error);
        setSyncStatus(prev => ({ ...prev, state: 'error' }));
      }
    }
  };

  const navigateToClasses = (subjectId?: string, category?: string) => {
      setViewParams({ targetSubjectId: subjectId, targetCategory: category });
      setCurrentView('classes');
  };

  const navigateToSchedule = (date?: Date) => {
      setViewParams({ targetDate: date });
      setCurrentView('schedule');
  };

  const navigateToExercises = (subjectId?: string, lessonId?: string) => {
      setViewParams({ targetSubjectId: subjectId, targetLessonId: lessonId });
      setCurrentView('exercises');
  };

  const handleToggleRankVisibility = async () => {
    if (!currentUser) return;
    
    // Default to true if undefined, so toggle makes it false. 
    // If it is false, toggle makes it true.
    const currentVisibility = currentUser.isRankVisible !== false; 
    const newVisibility = !currentVisibility;

    const updatedUser = { ...currentUser, isRankVisible: newVisibility };
    setCurrentUser(updatedUser);

    try {
      await supabase.from("users").update({ isRankVisible: newVisibility }).eq('ra', currentUser.ra);
    } catch (error) {
      console.error("Erro ao atualizar visibilidade no rank:", error);
      // Revert on error? For now, just log.
    }
  };

  const renderContent = () => {
    // Admin bypasses login check
    if (currentView === 'admin' || window.location.pathname === '/admin') {
      return <AdminDashboard onExit={() => {
        window.history.pushState({}, '', '/'); // Reset URL
        setCurrentView('classes');
      }} />;
    }

    if (!currentUser) {
      if (authMode === 'register' || window.location.pathname === '/cadastrar') {
        return (
          <Register 
            onAutoLogin={handleLogin} 
            onSwitchToLogin={() => {
              if (window.location.pathname === '/cadastrar') {
                window.history.pushState({}, '', '/');
              }
              setAuthMode('login');
            }}
          />
        );
      }

      return (
        <Login 
          onLogin={handleLogin} 
          onSwitchToRegister={() => setAuthMode('register')}
        />
      );
    }

    switch (currentView) {
      case 'classes':
        return (
          <ClassList 
            currentUser={currentUser} 
            onUpdateProgress={handleUpdateProgress} 
            initialSubjectId={viewParams.targetSubjectId}
            initialCategory={viewParams.targetCategory}
            onNavigateToSchedule={navigateToSchedule}
            onNavigateToExercises={navigateToExercises}
          />
        );
      case 'schedule':
        return (
          <ScheduleView 
            onNavigateToClass={navigateToClasses}
            initialDate={viewParams.targetDate}
          />
        );
      case 'exercises':
        // Passando handleAddXP para a gamificação
        return (
          <ExerciseView 
            currentUser={currentUser} 
            onUpdateUser={handleUpdateUser} 
            onExit={() => setCurrentView('classes')}
            onAddXP={handleAddXP}
            initialSubjectId={viewParams.targetSubjectId}
            initialLessonId={viewParams.targetLessonId}
          />
        );
      case 'library':
        return <LibraryView />;
      case 'rank':
        return (
          <RankView 
            currentUser={currentUser}
            onToggleVisibility={handleToggleRankVisibility}
          />
        );
      case 'profile':
        return (
          <ProfileView 
            user={currentUser} 
            onUpdateName={handleUpdateName} 
            syncStatus={syncStatus}
            onManualSync={() => syncWithCloud(false)}
          />
        );
      default:
        return <div>Página não encontrada</div>;
    }
  };

  // Lógica para exibir a Sidebar:
  // 1. Usuário deve estar logado (currentUser existe)
  // 2. Não pode estar na view de Admin
  // 3. Não pode estar na view de Exercícios (Game Mode Fullscreen)
  const showSidebar = currentUser && currentView !== 'admin' && currentView !== 'exercises';

  return (
    <div className="flex min-h-[100dvh] bg-gray-50">
      {/* Renderiza Sidebar apenas se as condições forem atendidas */}
      {showSidebar && (
        <>
          <div className="lg:hidden fixed top-0 left-0 w-full bg-white z-30 shadow-sm px-4 py-3 flex items-center justify-between">
             <div className="flex items-center gap-3">
                <button onClick={() => setIsMobileMenuOpen(true)} className="text-slate-800 p-1">
                  <IconMenu className="w-7 h-7" />
                </button>
                <h1 className="text-xl font-black text-slate-900 tracking-tight">MEDFERPA</h1>
             </div>
          </div>
          <Sidebar 
            currentView={currentView} 
            onChangeView={(view) => {
                setCurrentView(view);
                setViewParams({}); 
            }}
            onLogout={handleLogout}
            isOpen={isMobileMenuOpen}
            onClose={() => setIsMobileMenuOpen(false)}
            syncStatus={syncStatus}
            onManualSync={() => syncWithCloud(false)}
          />
        </>
      )}
      
      {/* Ajusta a margem e padding baseado na presença da Sidebar */}
      <main className={`flex-1 min-h-[100dvh] transition-all duration-300 w-full ${showSidebar ? 'pt-16 lg:pt-0 lg:ml-64 lg:w-auto' : ''} overflow-x-hidden relative`}>
        {renderContent()}
      </main>
    </div>
  );
};

export default App;