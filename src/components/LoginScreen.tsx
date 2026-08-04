import React, { useState, useEffect } from 'react';
import { UserProfile } from '../types';
import { 
  OFFICIAL_TEAM_PRESETS, 
  authenticateUser, 
  seedDefaultTeamToFirestore 
} from '../utils/authService';
import { 
  Lock, 
  User, 
  Eye, 
  EyeOff, 
  AlertCircle, 
  UserCheck,
  Shield
} from 'lucide-react';

interface LoginScreenProps {
  onLoginSuccess: (user: UserProfile) => void;
  isDarkMode: boolean;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLoginSuccess, isDarkMode }) => {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberUser, setRememberUser] = useState(true);
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

  const handleSelectUser = (preset: UserProfile) => {
    setError(null);
    setInfoMessage(null);
    setIdentifier(preset.displayName);
    setPassword('');
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
            ¿Ya tienes una cuenta?
          </h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
            Ingresa con tus credenciales institucionales para acceder al cronograma.
          </p>
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

          {/* Quick Access Preset Chips */}
          <div className="mt-6 pt-4 border-t border-zinc-200 dark:border-[#333438]">
            <span className="text-[11px] text-zinc-500 dark:text-zinc-400 block mb-2.5 font-medium">
              Seleccionar usuario de prueba:
            </span>
            <div className="space-y-1.5">
              {OFFICIAL_TEAM_PRESETS.map((member) => (
                <button
                  key={member.uid}
                  type="button"
                  onClick={() => handleSelectUser(member)}
                  className={`w-full px-3 py-2 rounded text-xs font-medium flex items-center justify-between transition-colors border cursor-pointer ${
                    identifier === member.displayName 
                      ? 'bg-zinc-100 dark:bg-[#2d2e32] border-zinc-400 dark:border-zinc-500 text-zinc-900 dark:text-white' 
                      : 'bg-white dark:bg-[#1e1f21] border-zinc-200 dark:border-[#333438] text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-[#28292c]'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-zinc-200 dark:bg-zinc-700 text-[10px] font-bold flex items-center justify-center text-zinc-700 dark:text-zinc-200">
                      {member.displayName.charAt(0)}
                    </span>
                    <span>{member.displayName}</span>
                  </div>
                  <span className="text-[10px] uppercase text-zinc-400 font-mono">
                    {member.role}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Footer note matching image 1 */}
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-6 leading-relaxed text-left border-t border-zinc-100 dark:border-[#2d2e32] pt-4">
            Si olvidó su usuario y contraseña, comuníquese con el gestor académico de su curso.
          </p>
        </div>
      </div>
    </div>
  );
};


