import React, { useState, useEffect } from 'react';
import Login from './components/Login';
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
import { db, storage } from './firebase';
import { doc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { ref, getDownloadURL } from 'firebase/storage';

const App: React.FC = () => {
  // Inicializa o estado buscando do LocalStorage para persistir sessão no F5
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    try {
      const savedUser = localStorage.getItem('medferpa_user');
      return savedUser ? JSON.parse(savedUser) : null;
    } catch (error) {
      console.error("Erro ao recuperar sessão:", error);
      return null;
    }
  });

  const [currentView, setCurrentView] = useState<ViewState>('classes');
  
  // State for Deep Linking (Passing data between views)
  const [viewParams, setViewParams] = useState<{
    targetSubjectId?: string;
    targetDate?: Date;
  }>({});

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Check URL for admin access on load
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('view') === 'admin') {
      setCurrentView('admin');
    }
  }, []);

  // Efeito para carregar o Favicon do Firebase Storage
  useEffect(() => {
    const setFavicon = async () => {
      try {
        const url = await getDownloadURL(ref(storage, 'assets/fav-icon.png'));
        let link = document.querySelector("link[rel~='icon']") as HTMLLinkElement;
        if (!link) {
          link = document.createElement('link');
          link.rel = 'icon';
          document.getElementsByTagName('head')[0].appendChild(link);
        }
        link.href = url;
      } catch (error) {
        console.error("Erro ao carregar favicon do Storage:", error);
      }
    };
    setFavicon();
  }, []);

  // --- LOGICA DE AUTO-CORREÇÃO DE XP ---
  // Recalcula o XP total baseado nas aulas e exercícios reais para garantir consistência
  useEffect(() => {
    const syncXP = async () => {
      if (!currentUser) return;

      let calculatedXP = 0;

      // 1. XP de Aulas (10 XP por aula)
      if (currentUser.completedLessons && Array.isArray(currentUser.completedLessons)) {
        calculatedXP += currentUser.completedLessons.length * 10;
      }

      // 2. XP de Exercícios (Score / 10)
      if (currentUser.exerciseProgress) {
        Object.values(currentUser.exerciseProgress).forEach((item) => {
          const progress = item as LevelProgress;
          // Considera apenas scores positivos
          if (progress.score > 0) {
            calculatedXP += Math.round(progress.score / 10);
          }
        });
      }

      // Se houver discrepância entre o cálculo real e o valor salvo, atualiza
      if (currentUser.totalXP !== calculatedXP) {
        console.log(`Corrigindo XP: Anterior ${currentUser.totalXP} -> Novo ${calculatedXP}`);
        
        const updatedUser = { ...currentUser, totalXP: calculatedXP };
        setCurrentUser(updatedUser);
        localStorage.setItem('medferpa_user', JSON.stringify(updatedUser));

        try {
          const userRef = doc(db, "users", currentUser.ra);
          await updateDoc(userRef, { totalXP: calculatedXP });
        } catch (error) {
          console.error("Erro ao sincronizar XP:", error);
        }
      }
    };

    syncXP();
    // Executa apenas quando completedLessons length muda ou referência do exerciseProgress muda
    // Removido JSON.stringify para evitar erro de referência circular e melhorar performance
  }, [currentUser?.completedLessons?.length, currentUser?.exerciseProgress, currentUser?.ra]);


  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('medferpa_user', JSON.stringify(currentUser));
    }
  }, [currentUser]);

  const handleLogin = (user: User) => {
    localStorage.setItem('medferpa_user', JSON.stringify(user));
    setCurrentUser(user);
    setCurrentView('classes');
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

    // Atualiza estado local
    const newTotalXP = (currentUser.totalXP || 0) + amount;
    // Evita XP negativo
    const finalXP = newTotalXP < 0 ? 0 : newTotalXP;
    
    const updatedUser = { ...currentUser, totalXP: finalXP };
    setCurrentUser(updatedUser);
    localStorage.setItem('medferpa_user', JSON.stringify(updatedUser));

    // Atualiza Firestore
    try {
      const userRef = doc(db, "users", currentUser.ra);
      await updateDoc(userRef, { totalXP: finalXP });
    } catch (error) {
      console.error("Erro ao atualizar XP no banco:", error);
    }
  };

  const handleUpdateProgress = async (lessonId: string) => {
    if (!currentUser) return;
    const isCompleted = currentUser.completedLessons.includes(lessonId);
    let newCompletedList: string[];
    // A lógica de XP aqui é apenas visual imediata, o useEffect de syncXP garantirá a consistência matemática depois
    let xpChange = 0;

    if (isCompleted) {
      // Removendo aula
      newCompletedList = currentUser.completedLessons.filter(id => id !== lessonId);
      xpChange = -10; 
    } else {
      // Concluindo aula
      newCompletedList = [...currentUser.completedLessons, lessonId];
      xpChange = 10; 
    }

    // Atualiza Lista Local e XP Local
    const currentXP = currentUser.totalXP || 0;
    const newTotalXP = Math.max(0, currentXP + xpChange);

    const updatedUser = { 
        ...currentUser, 
        completedLessons: newCompletedList,
        totalXP: newTotalXP
    };
    
    setCurrentUser(updatedUser);

    try {
      const userRef = doc(db, "users", currentUser.ra);
      if (isCompleted) {
        await updateDoc(userRef, { 
            completedLessons: arrayRemove(lessonId),
            totalXP: newTotalXP
        });
      } else {
        await updateDoc(userRef, { 
            completedLessons: arrayUnion(lessonId),
            totalXP: newTotalXP
        });
      }
    } catch (error) {
      console.error("Erro ao salvar progresso:", error);
    }
  };

  const handleUpdateName = async (newName: string) => {
    if (!currentUser) return;
    const updatedUser = { ...currentUser, name: newName };
    setCurrentUser(updatedUser);
    try {
      const userRef = doc(db, "users", currentUser.ra);
      await updateDoc(userRef, { name: newName });
    } catch (error) {
       console.error("Erro ao salvar nome:", error);
    }
  };

  // Nova função para atualizar usuário completo (usado no ExerciseView)
  const handleUpdateUser = (updatedUser: User) => {
      setCurrentUser(updatedUser);
      // Persiste no LocalStorage imediatamente
      localStorage.setItem('medferpa_user', JSON.stringify(updatedUser));
  };

  const navigateToClasses = (subjectId?: string) => {
      setViewParams({ targetSubjectId: subjectId });
      setCurrentView('classes');
  };

  const navigateToSchedule = (date?: Date) => {
      setViewParams({ targetDate: date });
      setCurrentView('schedule');
  };

  const handleToggleRankVisibility = async () => {
    if (!currentUser) return;
    
    // Default to true if undefined, so toggle makes it false. 
    // If it is false, toggle makes it true.
    const currentVisibility = currentUser.isRankVisible !== false; 
    const newVisibility = !currentVisibility;

    const updatedUser = { ...currentUser, isRankVisible: newVisibility };
    setCurrentUser(updatedUser);
    localStorage.setItem('medferpa_user', JSON.stringify(updatedUser));

    try {
      const userRef = doc(db, "users", currentUser.ra);
      await updateDoc(userRef, { isRankVisible: newVisibility });
    } catch (error) {
      console.error("Erro ao atualizar visibilidade no rank:", error);
      // Revert on error? For now, just log.
    }
  };

  const renderContent = () => {
    // Admin bypasses login check
    if (currentView === 'admin') {
      return <AdminDashboard onExit={() => {
        window.history.pushState({}, '', window.location.pathname); // Clear URL param
        setCurrentView(currentUser ? 'classes' : 'login');
      }} />;
    }

    if (!currentUser) return <Login onLogin={handleLogin} />;

    switch (currentView) {
      case 'classes':
        return (
          <ClassList 
            currentUser={currentUser} 
            onUpdateProgress={handleUpdateProgress} 
            initialSubjectId={viewParams.targetSubjectId}
            onNavigateToSchedule={navigateToSchedule}
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
        return <ProfileView user={currentUser} onUpdateName={handleUpdateName} />;
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
    <div className="flex min-h-screen bg-gray-50">
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
          />
        </>
      )}
      
      {/* Ajusta a margem e padding baseado na presença da Sidebar */}
      <main className={`flex-1 min-h-screen transition-all duration-300 w-full ${showSidebar ? 'pt-16 lg:pt-0 lg:ml-64 lg:w-auto' : ''} overflow-x-hidden relative`}>
        {renderContent()}
      </main>
    </div>
  );
};

export default App;