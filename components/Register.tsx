import React, { useState } from 'react';
import { db } from '../firebase';
import { doc, setDoc, getDoc } from 'firebase/firestore';

const Register: React.FC = () => {
  const [name, setName] = useState('');
  const [ra, setRa] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'error' | 'success', text: string } | null>(null);

  const formatRA = (value: string) => {
    const digits = value.replace(/\D/g, '');
    const truncated = digits.slice(0, 9);
    if (truncated.length > 8) {
      return `${truncated.slice(0, 8)}-${truncated.slice(8)}`;
    }
    return truncated;
  };

  const handleRaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setRa(formatRA(e.target.value));
    setMessage(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (ra.length !== 10) {
      setMessage({ type: 'error', text: 'O RA deve ter exatamente 9 dígitos (ex: 00000000-0).' });
      return;
    }
    if (!name.trim()) {
      setMessage({ type: 'error', text: 'Por favor, informe o nome.' });
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      // Check if user already exists
      const userRef = doc(db, 'users', ra);
      const userSnap = await getDoc(userRef);

      if (userSnap.exists()) {
        setMessage({ type: 'error', text: `Já existe um usuário cadastrado com o RA ${ra}.` });
        setLoading(false);
        return;
      }

      await setDoc(userRef, {
        name: name.trim(),
        ra: ra,
        totalXP: 0,
        completedLessons: [],
        listProgress: {},
        exerciseProgress: {}
      });

      setMessage({ type: 'success', text: 'Usuário cadastrado com sucesso!' });
      setName('');
      setRa('');
    } catch (error: any) {
      console.error(error);
      setMessage({ type: 'error', text: 'Erro ao cadastrar usuário. Tente novamente mais tarde.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[100dvh] flex items-center justify-center bg-gray-50 p-4">
      <div className="bg-white p-6 lg:p-10 rounded-2xl shadow-xl w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-black text-slate-900 tracking-tight mb-2">MEDFERPA</h1>
          <p className="text-gray-500">Cadastro de novo aluno.</p>
        </div>

        <form onSubmit={handleSubmit} className="text-left w-full space-y-6">
          <div>
            <label htmlFor="name" className="block text-sm font-semibold text-gray-700 mb-2">
              Nome Completo
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => { setName(e.target.value); setMessage(null); }}
              disabled={loading}
              placeholder="Ex: João da Silva"
              className="w-full text-lg px-4 py-3 border border-gray-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-100 focus:outline-none transition-all text-slate-800"
            />
          </div>

          <div>
            <label htmlFor="ra" className="block text-sm font-semibold text-gray-700 mb-2">
              Registro Acadêmico (RA)
            </label>
            <input
              id="ra"
              type="text"
              inputMode="numeric"
              value={ra}
              onChange={handleRaChange}
              disabled={loading}
              placeholder="00000000-0"
              className="w-full text-lg px-4 py-3 border border-gray-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-100 focus:outline-none transition-all placeholder-gray-300 font-mono tracking-wider text-slate-800"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-slate-900 text-white font-bold rounded-2xl hover:bg-blue-600 transition shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Cadastrando...' : 'Cadastrar Usuário'}
          </button>

          {message && (
            <div className={`mt-4 p-4 rounded-xl text-sm font-medium border ${message.type === 'error' ? 'bg-red-50 text-red-600 border-red-100' : 'bg-green-50 text-green-600 border-green-100'}`}>
              {message.text}
            </div>
          )}
        </form>

        <div className="mt-8 text-center">
           <button onClick={() => window.location.href = '/'} className="text-sm text-gray-500 underline hover:text-gray-900 transition-colors">
              Fazer login
           </button>
        </div>
      </div>
    </div>
  );
};

export default Register;
