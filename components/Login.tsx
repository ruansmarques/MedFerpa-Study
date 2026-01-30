import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, query, where, getDocs, setDoc, doc } from 'firebase/firestore';
import { User } from '../types';
import { MOCK_USERS } from '../constants';

interface LoginProps {
  onLogin: (user: User) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [ra, setRa] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [seeding, setSeeding] = useState(false);

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

  const handleSeed = async () => {
    if(!confirm("Isso irá criar/resetar os usuários de teste no banco de dados. Confirmar?")) return;
    setSeeding(true);
    try {
      for (const user of MOCK_USERS) {
        // Create user document using RA as the ID
        await setDoc(doc(db, "users", user.ra), user);
      }
      alert("Sucesso! Usuários criados. Tente logar com 24151433-0");
      setError('');
    } catch (e) {
      console.error(e);
      alert("Erro ao criar usuários. Verifique se o firebase.ts está configurado corretamente.");
    } finally {
      setSeeding(false);
    }
  };

  useEffect(() => {
    const checkLogin = async () => {
      // Auto-login check when format is complete
      if (ra.length === 10) {
        setLoading(true);
        try {
          const usersRef = collection(db, "users");
          const q = query(usersRef, where("ra", "==", ra));
          const querySnapshot = await getDocs(q);

          if (!querySnapshot.empty) {
            // User found
            const userDoc = querySnapshot.docs[0];
            const userData = userDoc.data() as User;
            onLogin(userData);
          } else {
            setError('RA não encontrado no sistema.');
            setLoading(false);
          }
        } catch (err) {
          console.error(err);
          setError('Erro ao conectar ao servidor. Verifique o arquivo firebase.ts');
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

        <div className="mt-8 text-xs text-gray-400 border-t border-gray-100 pt-6">
          <p className="mb-4">Primeiro acesso ou banco vazio?</p>
          <button 
            onClick={handleSeed}
            disabled={seeding || loading}
            className="text-blue-600 hover:text-blue-800 font-semibold underline disabled:opacity-50"
          >
            {seeding ? "Criando..." : "Clique aqui para criar os usuários de teste"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Login;