
import React, { useState } from 'react';
import { User } from '../types';
import { IconEdit, IconSave } from './Icons';

interface ProfileProps {
  user: User;
  onUpdateName: (newName: string) => void;
}

const ProfileView: React.FC<ProfileProps> = ({ user, onUpdateName }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [nameInput, setNameInput] = useState(user.name);

  const handleSave = () => {
    if (nameInput.trim() !== '') {
      onUpdateName(nameInput.trim());
    } else {
      setNameInput(user.name); 
    }
    setIsEditing(false);
  };

  // CÁLCULO DE NÍVEL E XP
  // Nível 1: 0-99 XP
  // Nível 2: 100-199 XP
  // Nível = Floor(XP / 100) + 1
  const currentXP = user.totalXP || 0;
  const currentLevel = Math.floor(currentXP / 100) + 1;
  const xpTowardsNextLevel = currentXP % 100;
  const xpNeededForNextLevel = 100;
  
  // Porcentagem da barra (0 a 100)
  const progressPercent = (xpTowardsNextLevel / xpNeededForNextLevel) * 100;

  return (
    <div className="p-4 lg:p-10 max-w-2xl mx-auto">
      <h2 className="text-xl lg:text-2xl font-bold text-slate-800 mb-6 lg:mb-8 text-center lg:text-left">Meu Perfil</h2>
      
      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 lg:p-8 text-center relative group">
        <div className={`w-20 h-20 lg:w-24 lg:h-24 mx-auto rounded-full flex items-center justify-center text-white font-bold text-3xl lg:text-4xl mb-6 ${user.avatarColor} shadow-lg ring-4 ring-offset-4 ring-gray-50`}>
          {nameInput.charAt(0)}
        </div>
        
        {isEditing ? (
          <div className="flex items-center justify-center gap-2 mb-1">
            <input 
              type="text" 
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              className="text-xl lg:text-2xl font-bold text-slate-900 border-b-2 border-blue-500 focus:outline-none text-center bg-transparent w-full max-w-xs"
              autoFocus
            />
            <button 
              onClick={handleSave}
              className="p-1.5 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition-colors"
            >
              <IconSave className="w-5 h-5" />
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-center gap-2 mb-1">
            <h3 className="text-xl lg:text-2xl font-bold text-slate-900 break-words">{user.name}</h3>
            <button 
              onClick={() => setIsEditing(true)}
              className="text-gray-300 hover:text-blue-500 transition-colors"
              title="Editar nome"
            >
              <IconEdit className="w-5 h-5" />
            </button>
          </div>
        )}

        <p className="text-gray-400 font-mono tracking-wider mb-8 text-sm lg:text-base">{user.ra}</p>

        {/* ÁREA DE XP E NÍVEL */}
        <div className="bg-slate-50 rounded-2xl p-4 lg:p-6 text-left border border-slate-100">
          <div className="flex justify-between items-end mb-3">
            <div>
                <span className="text-xs lg:text-sm font-bold text-slate-500 uppercase tracking-widest block mb-1">Experiência do Nível Atual</span>
                <span className="text-3xl font-black text-slate-800">Nível {currentLevel}</span>
            </div>
            <div className="text-right">
                <span className="text-sm font-bold text-blue-600 bg-blue-100 px-2 py-1 rounded-lg">
                   {xpTowardsNextLevel} / {xpNeededForNextLevel} XP
                </span>
            </div>
          </div>
          
          <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden shadow-inner">
            <div 
              className="bg-gradient-to-r from-blue-500 to-indigo-600 h-4 rounded-full transition-all duration-1000 ease-out shadow-[0_0_10px_rgba(59,130,246,0.5)]"
              style={{ width: `${progressPercent}%` }}
            ></div>
          </div>
          
          <div className="mt-4 flex justify-between items-center border-t border-gray-200 pt-3">
             <span className="text-xs text-gray-500 font-medium">Continue estudando para subir de nível!</span>
             <span className="text-xs font-bold text-slate-700 bg-white border border-gray-200 px-3 py-1 rounded-full shadow-sm">
                 XP Total: {currentXP}
             </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileView;
