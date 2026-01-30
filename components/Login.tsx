import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { User } from '../types';

interface LoginProps {
  onLogin: (user: User) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [ra, setRa] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const formatRA = (value: string) => {
    const digits = value.replace(/\D/g, '');
    const truncated = digits.slice(0, 9);
    if (truncated.length > 8) {
      return `${truncated.slice(0, 8)}-${truncated.slice(8)}`;
    }
    return truncated;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVal = formatRA(e.target.value);
    setRa(newVal);
    setError('');
  };

  useEffect(() => {
    const checkLogin = async () => {
      // Verifica login automaticamente quando o formato RA está completo (00000000-0)
      if (ra.length === 10) {
        setLoading(true);
        try {
          const usersRef = collection(db, "users");
          // Busca exata pelo RA (string)
          const q = query(usersRef, where("ra", "==", ra));
          const querySnapshot = await getDocs(q);

          if (!querySnapshot.empty) {
            // Usuário encontrado
            const userDoc = querySnapshot.docs[0];
            const data = userDoc.data();
            
            // Tratamento de segurança:
            // Garante que completedLessons seja um array mesmo se não existir no banco
            // Garante que avatarColor tenha uma cor padrão se estiver vazio
            const userData: User = {
              ra: data.ra,
              name: data.name,
              completedLessons: Array.isArray(data.completedLessons) ? data.completedLessons : [],
              avatarColor: data.avatarColor || 'bg-blue-600'
            };
            
            onLogin(userData);
          } else {
            setError('RA não encontrado no sistema.');
            setLoading(false);
          }
        } catch (err) {
          console.error(err);
          setError('Erro ao conectar ao servidor. Verifique sua conexão.');
          setLoading(false);
        }
      }
    };

    checkLogin();
  }, [ra, onLogin]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="bg-white p-6 lg:p-10 rounded-2xl shadow-xl w-full max-w-md text-center">
        <div className="mb-8">
          <h1 className="text-3xl font-black text-slate-900 tracking-tight mb-2">MEDFERPA</h1>
          <p className="text-gray-500">Acesse sua plataforma de ensino.</p>
        </div>

        <div className="text-left">
          <label htmlFor="ra" className="block text-sm font-semibold text-gray-700 mb-2">
            Registro Acadêmico (RA)
          </label>
          <input
            id="ra"
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            value={ra}
            onChange={handleChange}
            disabled={loading}
            placeholder="00000000-0"
            className={`w-full text-lg px-4 py-3 border rounded-xl focus:ring-4 focus:outline-none transition-all placeholder-gray-300 font-mono tracking-wider ${
              error 
                ? 'border-red-300 focus:ring-red-100 text-red-600' 
                : 'border-gray-200 focus:border-blue-500 focus:ring-blue-100 text-slate-800'
            } ${loading ? 'opacity-50 cursor-wait' : ''}`}
          />
          {loading && <p className="mt-2 text-sm text-blue-500 font-medium">Verificando...</p>}
          {error && (
            <p className="mt-2 text-sm text-red-500 font-medium animate-pulse">
              {error}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Login;