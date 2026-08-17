import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { UserProfile } from '../types';
import { authenticateUser } from '../utils/authService';
import { 
  Lock, 
  User, 
  Eye, 
  EyeOff, 
  AlertCircle, 
  UserCheck,
  Sun,
  Moon,
  Calendar,
  Clock,
  ArrowRight,
  Loader2,
  ShieldCheck,
  GraduationCap
} from 'lucide-react';
import { DIAS_SEMANA_COMPLETOS } from '../utils/textUtils';

interface LoginScreenProps {
  onLoginSuccess: (user: UserProfile) => void;
  isDarkMode: boolean;
  onToggleDarkMode?: () => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ 
  onLoginSuccess, 
  isDarkMode,
  onToggleDarkMode 
}) => {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const dayName = DIAS_SEMANA_COMPLETOS[now.getDay()];
  const dateStr = `${dayName}, ${String(now.getDate()).padStart(2, '0')}/${String(now.getMonth() + 1).padStart(2, '0')}/${now.getFullYear()}`;
  const timeStr = now.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setInfoMessage(null);

    if (!identifier.trim() || !password) {
      setError('Por favor ingrese su usuario y contraseña.');
      return;
    }

    setLoading(true);
    try {
      const userProfile = await authenticateUser(identifier, password);
      setInfoMessage(`¡Bienvenido/a, ${userProfile.displayName}!`);
      setTimeout(() => {
        onLoginSuccess(userProfile);
      }, 350);
    } catch (err: any) {
      setError(err.message || 'Error al iniciar sesión.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`min-h-screen flex flex-col font-sans antialiased relative overflow-hidden transition-colors ${
      isDarkMode ? 'dark bg-[#0a1210] text-zinc-100' : 'bg-[#062c21] text-zinc-900'
    }`}>
      {/* Top Navigation Bar - Exact replica of the system Header */}
      <header className="h-12 bg-white/95 dark:bg-[#1e1f21]/95 backdrop-blur-md border-b border-zinc-200 dark:border-[#2e2f33] flex items-center justify-between px-4 shrink-0 sticky top-0 z-40 transition-colors shadow-xs">
        {/* Brand & Subtitle */}
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 bg-emerald-600 text-white rounded font-bold text-xs flex items-center justify-center shrink-0 shadow-xs">
            U
          </div>
          <div className="flex items-center gap-2">
            <h1 className="text-xs font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5 uppercase tracking-wide">
              UNEFCO <span className="text-emerald-600 dark:text-emerald-400 font-extrabold">| La Paz</span>
            </h1>
            <span className="hidden sm:inline-block text-[11px] font-medium text-zinc-500 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded border border-zinc-200 dark:border-zinc-700">
              SISTEMA INTERNO DE GESTIÓN ACADÉMICA
            </span>
          </div>
        </div>

        {/* Right Tools */}
        <div className="flex items-center gap-2">
          {/* Live Clock */}
          <div className="hidden md:flex items-center gap-2 px-2.5 py-1 rounded text-xs text-zinc-500 dark:text-zinc-400 border border-transparent">
            <Calendar className="w-3.5 h-3.5 text-zinc-400" />
            <span className="font-numeric">{dateStr}</span>
            <span className="text-zinc-300 dark:text-zinc-700">•</span>
            <Clock className="w-3.5 h-3.5 text-zinc-400" />
            <span className="font-numeric text-zinc-600 dark:text-zinc-300">{timeStr}</span>
          </div>

          {/* Dark Mode Toggle */}
          {onToggleDarkMode && (
            <button
              onClick={onToggleDarkMode}
              type="button"
              className="p-1.5 rounded text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
              title={isDarkMode ? 'Modo Claro' : 'Modo Oscuro'}
            >
              {isDarkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-zinc-600" />}
            </button>
          )}
        </div>
      </header>

      {/* Institutional Background with Subtle Academic Geometry & Emerald Gradient */}
      <div className="absolute inset-0 top-12 pointer-events-none overflow-hidden select-none">
        {/* Deep emerald linear and radial gradients */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#064e3b] via-[#022c22] to-[#011a14] dark:from-[#05291f] dark:via-[#091512] dark:to-[#020705] opacity-95" />
        
        {/* Soft Ambient Radial Glows */}
        <div className="absolute -top-32 -left-32 w-[550px] h-[550px] bg-emerald-500/15 rounded-full blur-3xl" />
        <div className="absolute top-1/3 -right-28 w-[500px] h-[500px] bg-teal-400/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-36 left-1/4 w-[600px] h-[600px] bg-emerald-600/10 rounded-full blur-3xl" />

        {/* Subtle Academic Mathematical/Isometric Grid Pattern */}
        <svg 
          className="absolute inset-0 w-full h-full opacity-[0.06] text-white" 
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <pattern id="academic-grid" width="48" height="48" patternUnits="userSpaceOnUse">
              <path d="M 48 0 L 0 0 0 48" fill="none" stroke="currentColor" strokeWidth="1" />
              <circle cx="24" cy="24" r="1.2" fill="currentColor" opacity="0.6" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#academic-grid)" />
        </svg>

        {/* Delicate Institutional Geometric Circles Accent */}
        <div className="absolute -top-24 right-10 w-96 h-96 border border-emerald-500/15 rounded-full" />
        <div className="absolute -top-12 right-24 w-72 h-72 border border-emerald-400/10 rounded-full" />
        <div className="absolute bottom-8 left-12 w-80 h-80 border border-emerald-500/10 rounded-full" />
      </div>

      {/* Main Login Card Centered Container */}
      <div className="flex-1 flex flex-col items-center justify-center p-4 sm:p-6 relative z-10">
        <motion.div 
          initial={{ opacity: 0, y: 12, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
          className="w-full max-w-md bg-white dark:bg-[#202124] border border-zinc-200/80 dark:border-[#383a3f] rounded-2xl shadow-2xl shadow-emerald-950/60 dark:shadow-black/80 overflow-hidden backdrop-blur-xs"
        >
          {/* Card Banner Header */}
          <div className="p-6 pb-4 border-b border-zinc-100 dark:border-[#2e2f33] bg-zinc-50/70 dark:bg-[#25262a]">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-emerald-100 dark:bg-emerald-950/70 rounded-lg text-emerald-700 dark:text-emerald-400 shadow-xs">
                  <GraduationCap className="w-4 h-4" />
                </div>
                <span className="text-[11px] font-semibold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider">
                  Sistema Interno UNEFCO La Paz
                </span>
              </div>
              <span className="text-[10px] font-mono bg-white dark:bg-zinc-800 text-emerald-800 dark:text-emerald-300 px-2 py-0.5 rounded border border-emerald-200/60 dark:border-emerald-800/60 font-semibold">
                Gestión 2026
              </span>
            </div>
            
            <h2 className="text-lg font-bold text-zinc-900 dark:text-white tracking-tight">
              Iniciar Sesión
            </h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
              Acceso exclusivo para técnicos autorizados de UNEFCO La Paz
            </p>
          </div>

          {/* Form Content */}
          <div className="p-6 space-y-4">
            {error && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 rounded-lg text-xs text-red-700 dark:text-red-300 flex items-start gap-2.5"
              >
                <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                <span className="leading-relaxed">{error}</span>
              </motion.div>
            )}

            {infoMessage && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/50 rounded-lg text-xs text-emerald-700 dark:text-emerald-300 flex items-start gap-2.5"
              >
                <UserCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span className="leading-relaxed">{infoMessage}</span>
              </motion.div>
            )}

            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-3">
                {/* Usuario */}
                <div>
                  <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
                    Usuario
                  </label>
                  <div className="flex items-center rounded-lg border border-zinc-300 dark:border-[#3e3f44] bg-white dark:bg-[#1a1b1d] overflow-hidden focus-within:ring-2 focus-within:ring-emerald-500/20 focus-within:border-emerald-600 dark:focus-within:border-emerald-500 transition-all">
                    <div className="w-10 h-10 bg-zinc-50 dark:bg-[#25262a] border-r border-zinc-200 dark:border-[#3e3f44] flex items-center justify-center shrink-0 text-zinc-500 dark:text-zinc-400">
                      <User className="w-4 h-4" />
                    </div>
                    <input
                      type="text"
                      required
                      autoFocus
                      value={identifier}
                      onChange={(e) => setIdentifier(e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-transparent text-zinc-900 dark:text-zinc-100 focus:outline-none"
                    />
                  </div>
                </div>

                {/* Contraseña */}
                <div>
                  <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
                    Contraseña
                  </label>
                  <div className="flex items-center rounded-lg border border-zinc-300 dark:border-[#3e3f44] bg-white dark:bg-[#1a1b1d] overflow-hidden focus-within:ring-2 focus-within:ring-emerald-500/20 focus-within:border-emerald-600 dark:focus-within:border-emerald-500 transition-all relative">
                    <div className="w-10 h-10 bg-zinc-50 dark:bg-[#25262a] border-r border-zinc-200 dark:border-[#3e3f44] flex items-center justify-center shrink-0 text-zinc-500 dark:text-zinc-400">
                      <Lock className="w-4 h-4" />
                    </div>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-3 pr-10 py-2 text-xs bg-transparent text-zinc-900 dark:text-zinc-100 focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-2.5 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 p-1 rounded-md transition-colors cursor-pointer"
                      title={showPassword ? 'Ocultar contraseña' : 'Ver contraseña'}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Botón Ingresar */}
              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-medium text-xs py-2.5 px-4 rounded-lg shadow-md shadow-emerald-700/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Verificando credenciales...</span>
                  </>
                ) : (
                  <>
                    <span>Ingresar al Sistema</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Footer Card */}
          <div className="px-6 py-3 bg-zinc-50/70 dark:bg-[#25262a] border-t border-zinc-100 dark:border-[#2e2f33] flex items-center justify-between text-[11px] text-zinc-500 dark:text-zinc-400">
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              Acceso Seguro
            </span>
            <span>UNEFCO La Paz</span>
          </div>
        </motion.div>

        {/* Institutional Bottom Legend */}
        <p className="text-[11px] text-emerald-100/70 dark:text-emerald-200/50 mt-6 text-center font-medium drop-shadow-xs">
          Ministerio de Educación • Unidad Especializada de Formación Continua (UNEFCO)
        </p>
      </div>
    </div>
  );
};
