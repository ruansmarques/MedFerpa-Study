import React from 'react';
import { User } from '../types';
import { LESSONS } from '../constants';

interface ProfileProps {
  user: User;
}

const ProfileView: React.FC<ProfileProps> = ({ user }) => {
  const totalLessons = LESSONS.length;
  const completedCount = user.completedLessons.length;
  const percentage = Math.round((completedCount / totalLessons) * 100);

  return (
    <div className="p-10 max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold text-slate-800 mb-8">Meu Perfil</h2>
      
      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8 text-center">
        <div className={`w-24 h-24 mx-auto rounded-full flex items-center justify-center text-white font-bold text-4xl mb-6 ${user.avatarColor} shadow-lg ring-4 ring-offset-4 ring-gray-50`}>
          {user.name.charAt(0)}
        </div>
        
        <h3 className="text-2xl font-bold text-slate-900 mb-1">{user.name}</h3>
        <p className="text-gray-400 font-mono tracking-wider mb-8">{user.ra}</p>

        <div className="bg-slate-50 rounded-2xl p-6 text-left">
          <div className="flex justify-between items-end mb-2">
            <span className="text-sm font-semibold text-gray-600">Progresso Geral</span>
            <span className="text-2xl font-bold text-blue-600">{percentage}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
            <div 
              className="bg-blue-600 h-3 rounded-full transition-all duration-1000 ease-out"
              style={{ width: `${percentage}%` }}
            ></div>
          </div>
          <div className="mt-4 flex justify-between text-xs text-gray-500">
             <span>{completedCount} aulas concluídas</span>
             <span>Total: {totalLessons} aulas</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileView;