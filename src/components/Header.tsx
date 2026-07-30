import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Calendar, 
  Clock, 
  Sun, 
  Moon, 
  Users, 
  LogOut, 
  ShieldCheck, 
  UserCheck,
  Lock,
  User,
  Sparkles
} from 'lucide-react';
import { DIAS_SEMANA_COMPLETOS } from '../utils/textUtils';
import { UserProfile, UserRole } from '../types';

interface HeaderProps {
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
  currentUser?: UserProfile | null;
  activeRole?: UserRole;
  onToggleActiveRole?: () => void;
  onOpenUserManagement?: () => void;
  onSignOut?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  isDarkMode,
  onToggleDarkMode,
  currentUser,
  activeRole = 'tecnico',
  onToggleActiveRole,
  onOpenUserManagement,
  onSignOut
}) => {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const dayName = DIAS_SEMANA_COMPLETOS[now.getDay()];
  const dateStr = `${dayName}, ${String(now.getDate()).padStart(2, '0')}/${String(now.getMonth() + 1).padStart(2, '0')}/${now.getFullYear()}`;
  const timeStr = now.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

  const isAdminUser = currentUser?.role === 'admin';

  return (
    <header className="min-h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-6 py-3 shrink-0 sticky top-0 z-40 transition-colors shadow-2xs">
      {/* Brand & Subtitle */}
      <div className="flex items-center gap-3">
        <motion.div 
          whileHover={{ scale: 1.05, rotate: 3 }}
          className="w-9 h-9 bg-indigo-600 dark:bg-indigo-500 rounded-lg flex items-center justify-center text-white font-bold text-lg font-display shadow-xs cursor-pointer"
        >
          U
        </motion.div>
        <div>
          <h1 className="font-display text-base md:text-lg font-bold text-slate-900 dark:text-white leading-tight flex items-center gap-2">
            UNEFCO <span className="text-xs bg-indigo-50 dark:bg-indigo-950/80 border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 font-bold px-2 py-0.5 rounded-md tracking-normal">La Paz</span>
          </h1>
          <p className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-bold tracking-wider">
            Programación Académica
          </p>
        </div>
      </div>

      {/* Right Tools: Role Switcher, Date/Clock, Dark Mode Toggle, SignOut */}
      <div className="flex items-center gap-2 md:gap-3">
        {/* Active Role Switcher for Admin Users */}
        {isAdminUser && onToggleActiveRole && (
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={onToggleActiveRole}
            type="button"
            className={`px-3 py-1.5 rounded-xl border flex items-center gap-2 text-xs font-bold transition-all cursor-pointer shadow-2xs ${
              activeRole === 'admin'
                ? 'bg-purple-50 dark:bg-purple-950/60 border-purple-300 dark:border-purple-800 text-purple-700 dark:text-purple-300'
                : 'bg-indigo-50 dark:bg-indigo-950/60 border-indigo-300 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300'
            }`}
            title="Haz clic para alternar tu Rol Activo (Modo Admin / Modo Técnico)"
          >
            {activeRole === 'admin' ? (
              <>
                <ShieldCheck className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                <span className="hidden sm:inline uppercase text-[10px] tracking-wider">Rol: Admin</span>
                <span className="text-[9px] bg-purple-200 dark:bg-purple-900 text-purple-800 dark:text-purple-200 px-1.5 py-0.5 rounded-md">
                  Global
                </span>
              </>
            ) : (
              <>
                <Lock className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <span className="hidden sm:inline uppercase text-[10px] tracking-wider">Rol: Técnico</span>
                <span className="text-[9px] bg-indigo-200 dark:bg-indigo-900 text-indigo-800 dark:text-indigo-200 px-1.5 py-0.5 rounded-md">
                  Personal
                </span>
              </>
            )}
          </motion.button>
        )}

        {/* Live Clock & Date */}
        <div className="hidden lg:flex items-center gap-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3.5 py-1.5 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300">
          <div className="flex items-center gap-1.5 text-indigo-600 dark:text-indigo-400 font-bold">
            <Calendar className="w-3.5 h-3.5" />
            <span>{dateStr}</span>
          </div>
          <div className="h-3.5 w-px bg-slate-300 dark:bg-slate-700" />
          <div className="flex items-center gap-1.5 font-mono text-slate-600 dark:text-slate-400 font-bold">
            <Clock className="w-3.5 h-3.5 text-indigo-500 dark:text-indigo-400" />
            <span>{timeStr}</span>
          </div>
        </div>

        {/* Dark Mode Toggle */}
        <motion.button
          type="button"
          whileHover={{ scale: 1.1, rotate: 15 }}
          whileTap={{ scale: 0.9 }}
          onClick={onToggleDarkMode}
          className="p-2.5 text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-xl transition-colors cursor-pointer shadow-2xs"
          title={isDarkMode ? "Cambiar a Modo Claro" : "Cambiar a Modo Nocturno"}
        >
          <AnimatePresence mode="wait">
            {isDarkMode ? (
              <motion.div
                key="sun"
                initial={{ scale: 0, rotate: -90 }}
                animate={{ scale: 1, rotate: 0 }}
                exit={{ scale: 0, rotate: 90 }}
                transition={{ duration: 0.2 }}
              >
                <Sun className="w-4 h-4 text-amber-400" />
              </motion.div>
            ) : (
              <motion.div
                key="moon"
                initial={{ scale: 0, rotate: 90 }}
                animate={{ scale: 1, rotate: 0 }}
                exit={{ scale: 0, rotate: -90 }}
                transition={{ duration: 0.2 }}
              >
                <Moon className="w-4 h-4 text-indigo-600" />
              </motion.div>
            )}
          </AnimatePresence>
        </motion.button>

        {/* Sign Out Button */}
        {onSignOut && (
          <motion.button
            type="button"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onSignOut}
            className="p-2.5 text-slate-600 hover:text-red-600 dark:text-slate-400 dark:hover:text-red-400 bg-slate-50 dark:bg-slate-800 hover:bg-red-50 dark:hover:bg-red-950/50 border border-slate-200 dark:border-slate-700 rounded-xl transition-colors cursor-pointer flex items-center gap-1.5 text-xs font-bold"
            title="Cerrar Sesión"
          >
            <LogOut className="w-4 h-4 text-slate-500 hover:text-red-600" />
            <span className="hidden sm:inline">Salir</span>
          </motion.button>
        )}
      </div>
    </header>
  );
};



