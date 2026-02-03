import React, { useEffect, useState } from 'react';
import { db } from '../firebase';
import { collection, getDocs, getCountFromServer } from 'firebase/firestore';
import { User } from '../types';

interface RankedUser extends User {
  percentage: number;
}

const RankView: React.FC = () => {
  const [rankedUsers, setRankedUsers] = useState<RankedUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // 1. Busca total de aulas reais no banco para o cálculo de porcentagem
        const coll = collection(db, "lessons");
        const snapshot = await getCountFromServer(coll);
        const totalLessons = snapshot.data().count || 1; // Evita divisão por zero

        // 2. Busca usuários
        const querySnapshot = await getDocs(collection(db, "users"));
        const usersList: User[] = [];
        querySnapshot.forEach((doc) => {
          usersList.push(doc.data() as User);
        });

        // 3. Calcula ranking
        const ranked = usersList
          .map(user => ({
            ...user,
            percentage: Math.round((user.completedLessons.length / totalLessons) * 100)
          }))
          .sort((a, b) => b.percentage - a.percentage);

        setRankedUsers(ranked);
      } catch (error) {
        console.error("Erro ao buscar ranking:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="p-10 text-center text-gray-400">
        <p>Carregando ranking em tempo real...</p>
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-10 max-w-3xl mx-auto">
      <div className="text-center mb-6 lg:mb-10">
        <h2 className="text-2xl lg:text-3xl font-black text-slate-800 mb-2">Ranking Geral</h2>
        <p className="text-gray-500">Veja quem está liderando os estudos nesta semana.</p>
      </div>

      <div className="bg-white rounded-3xl shadow-lg border border-gray-100 overflow-hidden">
        <div className="grid grid-cols-12 gap-2 lg:gap-4 p-4 bg-gray-50 border-b border-gray-100 text-xs font-bold text-gray-400 uppercase tracking-wider">
          <div className="col-span-2 text-center">Posição</div>
          <div className="col-span-7 pl-2">Aluno</div>
          <div className="col-span-3 text-right">Progresso</div>
        </div>

        <div className="divide-y divide-gray-100">
          {rankedUsers.length > 0 ? rankedUsers.map((user, index) => {
            let rankBadge = null;
            if (index === 0) rankBadge = "🥇";
            else if (index === 1) rankBadge = "🥈";
            else if (index === 2) rankBadge = "🥉";
            else rankBadge = `#${index + 1}`;

            return (
              <div key={user.ra} className="grid grid-cols-12 gap-2 lg:gap-4 p-4 lg:p-5 items-center hover:bg-slate-50 transition-colors">
                <div className="col-span-2 text-center text-lg lg:text-xl font-bold text-slate-700">
                  {rankBadge}
                </div>
                <div className="col-span-7 flex items-center gap-2 lg:gap-4 pl-2">
                  <div className={`w-8 h-8 lg:w-10 lg:h-10 rounded-full flex items-center justify-center text-white font-bold text-xs lg:text-sm flex-shrink-0 ${user.avatarColor}`}>
                    {user.name.charAt(0)}
                  </div>
                  <div className="overflow-hidden">
                    <h3 className="font-bold text-slate-800 truncate text-sm lg:text-base">{user.name}</h3>
                    <p className="text-xs text-gray-400 truncate hidden lg:block">RA: {user.ra}</p>
                  </div>
                </div>
                <div className="col-span-3 text-right">
                   <span className="inline-block bg-blue-100 text-blue-700 font-bold px-2 py-1 lg:px-3 rounded-full text-xs lg:text-sm">
                     {user.percentage}%
                   </span>
                </div>
              </div>
            );
          }) : (
            <div className="p-8 text-center text-gray-400">
              Nenhum aluno encontrado no banco de dados.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RankView;