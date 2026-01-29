import React from 'react';
import { MOCK_USERS, LESSONS } from '../constants';

const RankView: React.FC = () => {
  const totalLessons = LESSONS.length;

  const rankedUsers = [...MOCK_USERS]
    .map(user => ({
      ...user,
      percentage: Math.round((user.completedLessons.length / totalLessons) * 100)
    }))
    .sort((a, b) => b.percentage - a.percentage);

  return (
    <div className="p-10 max-w-3xl mx-auto">
      <div className="text-center mb-10">
        <h2 className="text-3xl font-black text-slate-800 mb-2">Ranking Geral</h2>
        <p className="text-gray-500">Veja quem está liderando os estudos nesta semana.</p>
      </div>

      <div className="bg-white rounded-3xl shadow-lg border border-gray-100 overflow-hidden">
        <div className="grid grid-cols-12 gap-4 p-4 bg-gray-50 border-b border-gray-100 text-xs font-bold text-gray-400 uppercase tracking-wider">
          <div className="col-span-2 text-center">Posição</div>
          <div className="col-span-7">Aluno</div>
          <div className="col-span-3 text-right">Progresso</div>
        </div>

        <div className="divide-y divide-gray-100">
          {rankedUsers.map((user, index) => {
            let rankBadge = null;
            if (index === 0) rankBadge = "🥇";
            else if (index === 1) rankBadge = "🥈";
            else if (index === 2) rankBadge = "🥉";
            else rankBadge = `#${index + 1}`;

            return (
              <div key={user.ra} className="grid grid-cols-12 gap-4 p-5 items-center hover:bg-slate-50 transition-colors">
                <div className="col-span-2 text-center text-xl font-bold text-slate-700">
                  {rankBadge}
                </div>
                <div className="col-span-7 flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm ${user.avatarColor}`}>
                    {user.name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800">{user.name}</h3>
                    <p className="text-xs text-gray-400">RA: {user.ra}</p>
                  </div>
                </div>
                <div className="col-span-3 text-right">
                   <span className="inline-block bg-blue-100 text-blue-700 font-bold px-3 py-1 rounded-full text-sm">
                     {user.percentage}%
                   </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default RankView;