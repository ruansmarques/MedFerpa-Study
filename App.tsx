import React, { useState } from 'react';
import Login from './components/Login';
import Sidebar from './components/Sidebar';
import ClassList from './components/ClassList';
import ExerciseView from './components/ExerciseView';
import RankView from './components/RankView';
import ProfileView from './components/ProfileView';
import LibraryView from './components/LibraryView';
import { User, ViewState } from './types';
import { IconMenu } from './components/Icons';
import { db } from './firebase';
import { doc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentView, setCurrentView] = useState<ViewState>('classes');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Handle Login
  const handleLogin = (user: User) => {
    setCurrentUser(user);
    setCurrentView('classes');
  };

  // Handle Logout
  const handleLogout = () => {
    setCurrentUser(null);
    setCurrentView('login');
    setIsMobileMenuOpen(false);
  };

  // Handle Lesson Completion Logic (Firestore)
  const handleUpdateProgress = async (lessonId: string) => {
    if (!currentUser) return;

    const isCompleted = currentUser.completedLessons.includes(lessonId);
    
    // 1. Optimistic UI Update (Update local state immediately)
    let newCompletedList: string[];
    if (isCompleted) {
      newCompletedList = currentUser.completedLessons.filter(id => id !== lessonId);
    } else {
      newCompletedList = [...currentUser.completedLessons, lessonId];
    }
    const updatedUser = { ...currentUser, completedLessons: newCompletedList };
    setCurrentUser(updatedUser);

    // 2. Firestore Update
    try {
      const userRef = doc(db, "users", currentUser.ra);
      
      if (isCompleted) {
        await updateDoc(userRef, {
          completedLessons: arrayRemove(lessonId)
        });
      } else {
        await updateDoc(userRef, {
          completedLessons: arrayUnion(lessonId)
        });
      }
    } catch (error) {
      console.error("Erro ao salvar progresso:", error);
    }
  };

  // Handle Name Update (Firestore)
  const handleUpdateName = async (newName: string) => {
    if (!currentUser) return;

    // 1. Optimistic UI
    const updatedUser = { ...currentUser, name: newName };
    setCurrentUser(updatedUser);

    // 2. Firestore Update
    try {
      const userRef = doc(db, "users", currentUser.ra);
      await updateDoc(userRef, {
        name: newName
      });
    } catch (error) {
       console.error("Erro ao salvar nome:", error);
    }
  };

  // View Router
  const renderContent = () => {
    switch (currentView) {
      case 'classes':
        return currentUser ? (
          <ClassList 
            currentUser={currentUser} 
            onUpdateProgress={handleUpdateProgress} 
          />
        ) : null;
      case 'exercises':
        return <ExerciseView />;
      case 'library':
        return <LibraryView />;
      case 'rank':
        return <RankView />;
      case 'profile':
        return currentUser ? <ProfileView user={currentUser} onUpdateName={handleUpdateName} /> : null;
      default:
        return <div>Página não encontrada</div>;
    }
  };

  if (!currentUser) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      
      {/* Mobile/Tablet Header */}
      <div className="lg:hidden fixed top-0 left-0 w-full bg-white z-30 shadow-sm px-4 py-3 flex items-center justify-between">
         <div className="flex items-center gap-3">
            <button 
              onClick={() => setIsMobileMenuOpen(true)}
              className="text-slate-800 p-1"
            >
              <IconMenu className="w-7 h-7" />
            </button>
            <h1 className="text-xl font-black text-slate-900 tracking-tight">MEDFERPA</h1>
         </div>
      </div>

      <Sidebar 
        currentView={currentView} 
        onChangeView={setCurrentView} 
        onLogout={handleLogout}
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
      />
      
      {/* Main Content Area */}
      <main className="flex-1 min-h-screen transition-all duration-300 pt-16 lg:pt-0 lg:ml-64 w-full lg:w-auto overflow-x-hidden relative">
        {renderContent()}
      </main>
    </div>
  );
};

export default App;