import React, { useEffect, useState } from 'react';
import { db } from '../firebase';
import { collection, query, orderBy, getDocs } from 'firebase/firestore';
import { User } from '../types';

interface RankedUser extends User {
  level: number;
}

interface RankViewProps {
  currentUser: User;
  onToggleVisibility: () => void;
}

const RankView: React.FC<RankViewProps> = ({ currentUser, onToggleVisibility }) => {
  const [rankedUsers, setRankedUsers] = useState<RankedUser[]>([]);
  const [loading, setLoading] = useState(true);

  const isVisible = currentUser.isRankVisible !== false;

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Ordena diretamente pelo XP Total no banco
        const q = query(collection(db, "users"), orderBy("totalXP", "desc"));
        const querySnapshot = await getDocs(q);
        
        const usersList: RankedUser[] = [];
        
        querySnapshot.forEach((doc) => {
          const data = doc.data() as User;
          
          // Filter out users who have opted out of the rank
          if (data.isRankVisible === false) return;

          const xp = data.totalXP || 0;
          
          usersList.push({
            ...data,
            totalXP: xp,
            level: Math.floor(xp / 100) + 1
          });
        });

        // Caso o banco não tenha índice criado, faz sort no client também para garantir
        usersList.sort((a, b) => b.totalXP - a.totalXP);

        setRankedUsers(usersList);
      } catch (error) {
        console.error("Erro ao buscar ranking:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [isVisible]); // Re-fetch when visibility changes to update the list immediately if the user toggles it

  if (loading) {
    return (
      <div className="p-10 text-center text-gray-400">
        <p>Carregando ranking em tempo real...</p>
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-10 max-w-4xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-center mb-6 lg:mb-10 gap-4">
        <div className="text-center md:text-left">
          <h2 className="text-2xl lg:text-3xl font-black text-slate-800 mb-2">Ranking Geral</h2>
          <p className="text-gray-500">Veja quem são os mestres do conhecimento.</p>
        </div>
        
        <button
          onClick={onToggleVisibility}
          className={`px-6 py-3 rounded-2xl font-bold text-sm transition-all shadow-sm flex items-center gap-2 ${
            isVisible 
              ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200 border border-emerald-200' 
              : 'bg-red-100 text-red-700 hover:bg-red-200 border border-red-200'
          }`}
        >
          <span className={`w-3 h-3 rounded-full ${isVisible ? 'bg-emerald-500' : 'bg-red-500'}`}></span>
          {isVisible ? 'Participando do Rank' : 'Não Participando'}
        </button>
      </div>

      <div className="bg-white rounded-3xl shadow-lg border border-gray-100 overflow-hidden">
        <div className="grid grid-cols-12 gap-2 lg:gap-4 p-4 bg-gray-50 border-b border-gray-100 text-xs font-bold text-gray-400 uppercase tracking-wider">
          <div className="col-span-2 text-center">Posição</div>
          <div className="col-span-8 pl-2">Aluno</div>
          <div className="col-span-2 text-center">Nível</div>
        </div>

        <div className="divide-y divide-gray-100">
          {rankedUsers.length > 0 ? rankedUsers.map((user, index) => {
            let rankBadge = null;
            let rankColor = "text-slate-700";
            
            if (index === 0) { rankBadge = "🥇"; rankColor = "text-yellow-500 scale-125"; }
            else if (index === 1) { rankBadge = "🥈"; rankColor = "text-gray-400 scale-110"; }
            else if (index === 2) { rankBadge = "🥉"; rankColor = "text-amber-700 scale-110"; }
            else rankBadge = `#${index + 1}`;

            const isCurrentUser = user.ra === currentUser.ra;

            return (
              <div key={user.ra} className={`grid grid-cols-12 gap-2 lg:gap-4 p-4 lg:p-5 items-center transition-colors ${isCurrentUser ? 'bg-blue-50/50 hover:bg-blue-50' : 'hover:bg-slate-50'}`}>
                <div className={`col-span-2 text-center text-lg lg:text-xl font-black ${rankColor} transition-transform`}>
                  {rankBadge}
                </div>
                
                <div className="col-span-8 flex items-center gap-2 lg:gap-4 pl-2">
                  <div className={`w-8 h-8 lg:w-10 lg:h-10 rounded-full flex items-center justify-center text-white font-bold text-xs lg:text-sm flex-shrink-0 ${user.avatarColor} ring-2 ring-white shadow-md`}>
                    {user.name.charAt(0)}
                  </div>
                  <div className="overflow-hidden">
                    <h3 className={`font-bold truncate text-sm lg:text-base ${isCurrentUser ? 'text-blue-700' : 'text-slate-800'}`}>
                      {user.name} {isCurrentUser && '(Você)'}
                    </h3>
                    {/* RA removed as requested */}
                  </div>
                </div>

                <div className="col-span-2 text-center">
                    <span className="inline-block bg-indigo-100 text-indigo-700 font-bold px-2 py-1 lg:px-3 rounded-lg text-xs lg:text-sm border border-indigo-200 shadow-sm">
                        Lvl {user.level}
                    </span>
                </div>
              </div>
            );
          }) : (
            <div className="p-8 text-center text-gray-400">
              Nenhum aluno participando do ranking no momento.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RankView;