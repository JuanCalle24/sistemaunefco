import React, { useState, useEffect } from 'react';
import { UserProfile } from '../types';
import { 
  authenticateUser, 
  seedDefaultTeamToFirestore 
} from '../utils/authService';
import { 
  Lock, 
  User, 
  Eye, 
  EyeOff, 
  AlertCircle, 
  UserCheck
} from 'lucide-react';

interface LoginScreenProps {
  onLoginSuccess: (user: UserProfile) => void;
  isDarkMode: boolean;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLoginSuccess, isDarkMode }) => {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);

  useEffect(() => {
    seedDefaultTeamToFirestore();
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setInfoMessage(null);

    if (!identifier || !password) {
      setError('Por favor ingrese su usuario y su contraseña asignada.');
      return;
    }

    setLoading(true);
    try {
      const userProfile = await authenticateUser(identifier, password);
      setInfoMessage(`¡Bienvenido/a, ${userProfile.displayName}!`);
      setTimeout(() => {
        onLoginSuccess(userProfile);
      }, 300);
    } catch (err: any) {
      setError(err.message || 'Error al validar credenciales.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`min-h-screen flex flex-col items-center justify-center p-4 transition-colors ${
      isDarkMode ? 'dark bg-[#1e1f21] text-zinc-100' : 'bg-[#f8f9fa] text-zinc-900'
    }`}>
      <div className="w-full max-w-md bg-white dark:bg-[#252628] border border-zinc-200 dark:border-[#333438] rounded-lg shadow-xs overflow-hidden">
        
        {/* Header Title */}
        <div className="p-6 pb-2 text-left">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-bold text-zinc-500 dark:text-zinc-400 tracking-wider uppercase">
              UNEFCO La Paz
            </span>
            <span className="text-[10px] bg-zinc-100 dark:bg-[#2d2e32] text-zinc-600 dark:text-zinc-300 px-2 py-0.5 rounded border border-zinc-200 dark:border-[#3a3b40] font-medium">
              Gestión Académica
            </span>
          </div>
          <h1 className="text-xl font-semibold text-zinc-900 dark:text-white tracking-tight">
            Iniciar Sesión
          </h1>
        </div>

        <div className="p-6 pt-3">
          {error && (
            <div className="mb-4 p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 rounded text-xs text-red-700 dark:text-red-300 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {infoMessage && (
            <div className="mb-4 p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/50 rounded text-xs text-emerald-700 dark:text-emerald-300 flex items-start gap-2">
              <UserCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span>{infoMessage}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            
            {/* Minimalist Input Grid matching user reference image */}
            <div className="border border-zinc-300 dark:border-[#3e3f44] rounded overflow-hidden divide-y divide-zinc-300 dark:divide-[#3e3f44]">
              {/* Username row */}
              <div className="flex items-center bg-white dark:bg-[#1e1f21]">
                <div className="w-12 h-11 bg-zinc-100 dark:bg-[#2d2e32] border-r border-zinc-300 dark:border-[#3e3f44] flex items-center justify-center shrink-0">
                  <User className="w-4 h-4 text-zinc-600 dark:text-zinc-300" />
                </div>
                <input
                  type="text"
                  required
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="Nombre de usuario"
                  className="w-full px-3 py-2.5 bg-transparent text-sm text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none"
                />
              </div>

              {/* Password row */}
              <div className="flex items-center bg-white dark:bg-[#1e1f21] relative">
                <div className="w-12 h-11 bg-zinc-100 dark:bg-[#2d2e32] border-r border-zinc-300 dark:border-[#3e3f44] flex items-center justify-center shrink-0">
                  <Lock className="w-4 h-4 text-zinc-600 dark:text-zinc-300" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Contraseña"
                  className="w-full pl-3 pr-10 py-2.5 bg-transparent text-sm text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 p-1 cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Asana Royal Blue Acceder Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#4573d2] hover:bg-[#3866c6] text-white font-medium text-sm py-2 px-4 rounded transition-colors cursor-pointer disabled:opacity-60"
            >
              {loading ? 'Validando...' : 'Acceder'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};


