import React, { useState, useEffect } from 'react';
import { UserProfile } from '../types';
import {
  authenticateUser,
  authenticateWithGoogle,
  checkGoogleSession
} from '../utils/authService';
import {
  Lock,
  Mail,
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
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);

  // Al cargar, revisa si venimos de una redirección de Google
  useEffect(() => {
    const checkSession = async () => {
      try {
        const userProfile = await checkGoogleSession();
        if (userProfile) {
          setInfoMessage(`¡Bienvenido/a, ${userProfile.displayName}!`);
          setTimeout(() => onLoginSuccess(userProfile), 300);
        }
      } catch (err: any) {
        setError(err.message || 'Error al validar la sesión de Google.');
      }
    };
    checkSession();
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setInfoMessage(null);

    if (!email || !password) {
      setError('Por favor ingrese su correo y contraseña.');
      return;
    }

    setLoading(true);
    try {
      const userProfile = await authenticateUser(email, password);
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

  const handleGoogleLogin = async () => {
    setError(null);
    setInfoMessage(null);
    setGoogleLoading(true);
    try {
      await authenticateWithGoogle();
      // La app redirige a Google; el resultado se procesa en useEffect al volver
    } catch (err: any) {
      setError(err.message || 'Error al iniciar sesión con Google.');
      setGoogleLoading(false);
    }
  };

  return (
    <div className={`min-h-screen flex flex-col items-center justify-center p-4 transition-colors ${
      isDarkMode ? 'dark bg-[#1e1f21] text-zinc-100' : 'bg-[#f8f9fa] text-zinc-900'
    }`}>
      <div className="w-full max-w-md bg-white dark:bg-[#252628] border border-zinc-200 dark:border-[#333438] rounded-lg shadow-xs overflow-hidden">

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
            <div className="border border-zinc-300 dark:border-[#3e3f44] rounded overflow-hidden divide-y divide-zinc-300 dark:divide-[#3e3f44]">
              <div className="flex items-center bg-white dark:bg-[#1e1f21]">
                <div className="w-12 h-11 bg-zinc-100 dark:bg-[#2d2e32] border-r border-zinc-300 dark:border-[#3e3f44] flex items-center justify-center shrink-0">
                  <Mail className="w-4 h-4 text-zinc-600 dark:text-zinc-300" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Correo electrónico"
                  className="w-full px-3 py-2.5 bg-transparent text-sm text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none"
                />
              </div>

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

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#4573d2] hover:bg-[#3866c6] text-white font-medium text-sm py-2 px-4 rounded transition-colors cursor-pointer disabled:opacity-60"
            >
              {loading ? 'Validando...' : 'Acceder'}
            </button>
          </form>

          <div className="flex items-center gap-3 my-4">
            <div className="flex-1 h-px bg-zinc-200 dark:bg-[#3e3f44]" />
            <span className="text-[11px] text-zinc-400 uppercase tracking-wider">o</span>
            <div className="flex-1 h-px bg-zinc-200 dark:bg-[#3e3f44]" />
          </div>

          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={googleLoading}
            className="w-full flex items-center justify-center gap-2 border border-zinc-300 dark:border-[#3e3f44] rounded py-2 px-4 text-sm font-medium text-zinc-700 dark:text-zinc-200 bg-white dark:bg-[#1e1f21] hover:bg-zinc-50 dark:hover:bg-[#2d2e32] transition-colors cursor-pointer disabled:opacity-60"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            <span>{googleLoading ? 'Conectando...' : 'Iniciar sesión con Google'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
