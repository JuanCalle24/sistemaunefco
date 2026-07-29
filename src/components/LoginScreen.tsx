import React, { useState, useEffect } from 'react';
import { UserProfile } from '../types';
import { 
  OFFICIAL_TEAM_PRESETS, 
  authenticateUser, 
  seedDefaultTeamToFirestore 
} from '../utils/authService';
import { 
  ShieldCheck, 
  Lock, 
  User, 
  Eye, 
  EyeOff, 
  AlertCircle, 
  UserCheck,
  Building2,
  KeyRound,
  LockKeyhole
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
    // Seed team in Firestore on load if available
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
      }, 400);
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
    setPassword(''); // Force user to enter their secret password
  };

  return (
    <div className={`min-h-screen flex items-center justify-center p-4 transition-colors ${
      isDarkMode ? 'bg-slate-950 text-slate-100' : 'bg-slate-100 text-slate-800'
    }`}>
      <div className="w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden">
        
        {/* Header Header */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-6 text-white text-center relative border-b border-indigo-900/50">
          <div className="w-16 h-16 bg-slate-900 border border-indigo-400/40 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-lg overflow-hidden p-1">
            <img 
              src="/src/assets/images/unefco_favicon_1785350470812.jpg" 
              alt="UNEFCO Logo" 
              referrerPolicy="no-referrer" 
              className="w-full h-full object-cover rounded-xl"
            />
          </div>
          <span className="text-[11px] font-bold tracking-widest text-indigo-300 uppercase block mb-1">
            UNEFCO LA PAZ
          </span>
          <h1 className="font-display text-xl sm:text-2xl font-black tracking-tight text-white">
            SISTEMA DE CRONOGRAMAS
          </h1>
          <p className="text-xs text-slate-300 mt-1 font-medium">
            Control de Acceso Seguro para Técnicos de Seguimiento
          </p>
        </div>

        <div className="p-6 sm:p-8">
          
          {error && (
            <div className="mb-5 p-3.5 bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800/80 rounded-xl flex items-start gap-2.5 text-xs text-red-700 dark:text-red-300 animate-fade-in">
              <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {infoMessage && (
            <div className="mb-5 p-3.5 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800/80 rounded-xl flex items-start gap-2.5 text-xs text-emerald-700 dark:text-emerald-300 animate-fade-in">
              <UserCheck className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
              <span>{infoMessage}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 uppercase tracking-wider">
                Usuario / Técnico
              </label>
              <div className="relative">
                <User className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  required
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="Escriba su Nombre Completo o seleccione abajo"
                  className="w-full pl-10 pr-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-medium"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 uppercase tracking-wider">
                Contraseña
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Ingrese su contraseña personal"
                  className="w-full pl-10 pr-10 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-medium"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1 font-medium">
                <LockKeyhole className="w-3 h-3 text-indigo-500 shrink-0" />
                <span>Requiere contraseña individual asignada para ingresar</span>
              </p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-600 dark:hover:bg-indigo-500 text-white font-bold text-xs uppercase tracking-wider py-3 px-4 rounded-lg transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md disabled:opacity-50 mt-2"
            >
              {loading ? (
                <span>Verificando credenciales...</span>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  <span>Ingresar al Sistema</span>
                </>
              )}
            </button>
          </form>

          {/* User selector list - autofills username only */}
          <div className="mt-6 pt-5 border-t border-slate-200 dark:border-slate-800">
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-2.5 text-center">
              Seleccionar Usuario Registrado
            </span>
            <div className="space-y-2">
              {OFFICIAL_TEAM_PRESETS.map((member) => (
                <button
                  key={member.uid}
                  type="button"
                  onClick={() => handleSelectUser(member)}
                  disabled={loading}
                  className={`w-full bg-slate-50 hover:bg-indigo-50/80 dark:bg-slate-800/80 dark:hover:bg-indigo-950/50 text-slate-800 dark:text-slate-200 border p-2.5 rounded-xl text-xs font-semibold flex items-center justify-between transition-all cursor-pointer group ${
                    identifier === member.displayName 
                      ? 'border-indigo-500 ring-1 ring-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/40' 
                      : 'border-slate-200 dark:border-slate-700/80 hover:border-indigo-300'
                  }`}
                >
                  <div className="flex items-center gap-2.5 text-left">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold ${
                      member.role === 'admin' 
                        ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/60 dark:text-purple-300' 
                        : 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/60 dark:text-indigo-300'
                    }`}>
                      {member.displayName.charAt(0)}
                    </div>
                    <div>
                      <div className="font-bold text-slate-900 dark:text-slate-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-300 transition-colors">
                        {member.displayName}
                      </div>
                      <div className="text-[10px] text-slate-500 dark:text-slate-400 font-normal">
                        {member.cargo}
                      </div>
                    </div>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                    member.role === 'admin'
                      ? 'bg-purple-100 dark:bg-purple-900/80 text-purple-800 dark:text-purple-200'
                      : 'bg-indigo-100 dark:bg-indigo-900/80 text-indigo-800 dark:text-indigo-200'
                  }`}>
                    {member.role === 'admin' ? 'ADMIN' : 'TÉCNICO'}
                  </span>
                </button>
              ))}
            </div>
          </div>

        </div>

        <div className="bg-slate-50 dark:bg-slate-950 p-3 text-center border-t border-slate-200 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400 font-medium">
          Unidad Especializada de Formación Continua — La Paz, Bolivia © 2026
        </div>
      </div>
    </div>
  );
};
