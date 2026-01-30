import React, { useState } from 'react';
import Login from './components/Login';
import Sidebar from './components/Sidebar';
import ClassList from './components/ClassList';
import ExerciseView from './components/ExerciseView';
import RankView from './components/RankView';
import ProfileView from './components/ProfileView';
import LibraryView from './components/LibraryView';
import { User, ViewState } from './types';
import { MOCK_USERS } from './constants'; // Import kept only for seeding
import { IconMenu } from './components/Icons';
import { db } from './firebase';
import { doc, updateDoc, arrayUnion, arrayRemove, setDoc, collection, query, where, getDocs } from 'firebase/firestore';

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

  // --- DATABASE SEEDING (USE ONCE THEN DELETE) ---
  const seedDatabase = async () => {
    if(!confirm("Isso vai sobrescrever os dados no banco com os dados de teste. Continuar?")) return;
    try {
      for (const user of MOCK_USERS) {
        // We use RA as the document ID for simplicity and guaranteed uniqueness logic here
        // First find the doc ID if it exists, or create a new one. 
        // Ideally, we can just use the RA as the key if we wanted, but let's query to be safe or just setDoc with a custom ID.
        // Let's use setDoc with the RA as the ID to make updates easier.
        await setDoc(doc(db, "users", user.ra), user);
      }
      alert("Banco de dados populado com sucesso!");
    } catch (e) {
      console.error("Erro ao popular banco:", e);
      alert("Erro ao popular banco (veja console)");
    }
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
      // Since we are using RA as document ID (from the seeding logic suggestion), we can reference it directly.
      // However, Login.tsx fetched by query. To be perfectly safe, let's find the doc reference again or assume ID=RA.
      // Let's Assume ID = RA for simplicity in this implementation.
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
      // Optionally revert state here if it fails
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
        {/* Temporary Seed Button - Remove in production */}
        {/* <button 
           onClick={seedDatabase}
           className="absolute top-2 right-2 bg-red-500 text-white text-xs px-2 py-1 rounded z-50 opacity-50 hover:opacity-100"
        >
          Migrar Dados Mock para DB
        </button> */}
        
        {renderContent()}
      </main>
    </div>
  );
};

export default App;