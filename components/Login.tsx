import React, { useState, useEffect } from 'react';
import { MOCK_USERS } from '../constants';
import { User } from '../types';

interface LoginProps {
  onLogin: (user: User) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [ra, setRa] = useState('');
  const [error, setError] = useState('');

  const formatRA = (value: string) => {
    // Remove non-digits
    const digits = value.replace(/\D/g, '');
    
    // Limit to 9 digits (8 base + 1 verifier)
    const truncated = digits.slice(0, 9);
    
    // Insert hyphen before last digit if length > 8
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
    // Auto-login check when format is complete (8 digits + hyphen + 1 digit = 10 chars)
    if (ra.length === 10) {
      const user = MOCK_USERS.find(u => u.ra === ra);
      if (user) {
        onLogin(user);
      } else {
        setError('Esse RA não possui autorização');
      }
    }
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
            placeholder="00000000-0"
            className={`w-full text-lg px-4 py-3 border rounded-xl focus:ring-4 focus:outline-none transition-all placeholder-gray-300 font-mono tracking-wider ${
              error 
                ? 'border-red-300 focus:ring-red-100 text-red-600' 
                : 'border-gray-200 focus:border-blue-500 focus:ring-blue-100 text-slate-800'
            }`}
          />
          {error && (
            <p className="mt-2 text-sm text-red-500 font-medium animate-pulse">
              {error}
            </p>
          )}
        </div>

        <div className="mt-8 text-xs text-gray-400">
          <p>Digite apenas os números.</p>
          <p>Formato automático: 8 dígitos + digito verificador.</p>
        </div>
      </div>
    </div>
  );
};

export default Login;