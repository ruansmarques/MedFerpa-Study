import React from 'react';
import { IconHome, IconExercise, IconRank, IconUser, IconLogout } from './Icons';
import { ViewState } from '../types';

interface SidebarProps {
  currentView: ViewState;
  onChangeView: (view: ViewState) => void;
  onLogout: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ currentView, onChangeView, onLogout }) => {
  const NavItem = ({ view, icon: Icon, label }: { view: ViewState; icon: any; label: string }) => {
    const isActive = currentView === view;
    return (
      <button
        onClick={() => onChangeView(view)}
        className={`w-full flex items-center gap-4 px-6 py-4 transition-colors ${
          isActive 
            ? 'text-blue-600 bg-blue-50 border-r-4 border-blue-600' 
            : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
        }`}
      >
        <Icon className={`w-6 h-6 ${isActive ? 'stroke-2' : ''}`} />
        <span className={`font-medium ${isActive ? 'font-bold' : ''}`}>{label}</span>
      </button>
    );
  };

  return (
    <aside className="fixed left-0 top-0 h-full w-64 bg-white border-r border-gray-100 flex flex-col z-10 shadow-sm">
      <div className="p-8 pb-4">
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">MEDFERPA</h1>
      </div>

      <nav className="flex-1 mt-6 space-y-1">
        <NavItem view="classes" icon={IconHome} label="Aulas" />
        <NavItem view="exercises" icon={IconExercise} label="Exercícios" />
        <NavItem view="rank" icon={IconRank} label="Rank" />
        <NavItem view="profile" icon={IconUser} label="Perfil" />
      </nav>

      <div className="p-6 border-t border-gray-100">
        <button
          onClick={onLogout}
          className="flex items-center gap-3 text-red-500 hover:text-red-700 transition-colors px-2 py-2 w-full rounded-lg hover:bg-red-50"
        >
          <IconLogout className="w-5 h-5" />
          <span className="font-medium">Sair da conta</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;