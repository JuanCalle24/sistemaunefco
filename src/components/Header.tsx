import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  Clock, 
  Sun, 
  Moon, 
  LogOut, 
  ShieldCheck, 
  UserCheck
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

  const canToggleRole = !currentUser || currentUser.role === 'admin';

  return (
    <header className="h-12 bg-white dark:bg-[#1e1f21] border-b border-zinc-200 dark:border-[#2e2f33] flex items-center justify-between px-4 shrink-0 sticky top-0 z-40 transition-colors">
      {/* Brand & Subtitle */}
      <div className="flex items-center gap-2.5">
        <div className="w-7 h-7 bg-emerald-600 text-white rounded font-bold text-xs flex items-center justify-center shrink-0 shadow-xs">
          U
        </div>
        <div className="flex items-center gap-2">
          <h1 className="text-xs font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5 uppercase tracking-wide">
            UNEFCO <span className="text-emerald-600 dark:text-emerald-400 font-extrabold">| La Paz</span>
          </h1>
          <span className="hidden md:inline-block text-[11px] font-medium text-zinc-500 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded border border-zinc-200 dark:border-zinc-700">
            SISTEMA DE GESTIÓN ACADÉMICA
          </span>
        </div>
      </div>

      {/* Right Tools */}
      <div className="flex items-center gap-2">
        {/* Active Role Switcher */}
        {canToggleRole && onToggleActiveRole && (
          <button
            onClick={onToggleActiveRole}
            type="button"
            className={`px-2.5 py-1 rounded border flex items-center gap-1.5 text-xs font-medium transition-colors cursor-pointer ${
              activeRole === 'admin'
                ? 'bg-zinc-100 dark:bg-[#2a2b2e] border-zinc-300 dark:border-[#3a3b40] text-zinc-800 dark:text-zinc-200'
                : 'bg-zinc-50 dark:bg-[#252628] border-zinc-200 dark:border-[#333438] text-zinc-700 dark:text-zinc-300'
            }`}
            title="Alternar Rol Activo"
          >
            {activeRole === 'admin' ? (
              <>
                <ShieldCheck className="w-3.5 h-3.5 text-zinc-600 dark:text-zinc-300" />
                <span className="hidden sm:inline">Modo Admin</span>
              </>
            ) : (
              <>
                <UserCheck className="w-3.5 h-3.5 text-zinc-600 dark:text-zinc-300" />
                <span className="hidden sm:inline">Modo Técnico</span>
              </>
            )}
          </button>
        )}

        {/* Live Clock */}
        <div className="hidden lg:flex items-center gap-2 px-2.5 py-1 rounded text-xs text-zinc-500 dark:text-zinc-400 border border-transparent">
          <Calendar className="w-3.5 h-3.5 text-zinc-400" />
          <span className="font-numeric">{dateStr}</span>
          <span className="text-zinc-300 dark:text-zinc-700">•</span>
          <Clock className="w-3.5 h-3.5 text-zinc-400" />
          <span className="font-numeric text-zinc-600 dark:text-zinc-300">{timeStr}</span>
        </div>

        {/* Dark Mode Toggle */}
        <button
          type="button"
          onClick={onToggleDarkMode}
          className="p-1.5 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-[#2d2e32] rounded border border-zinc-200 dark:border-[#333438] transition-colors cursor-pointer"
          title={isDarkMode ? "Modo Claro" : "Modo Oscuro"}
        >
          {isDarkMode ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
        </button>

        {/* Sign Out Button */}
        {onSignOut && (
          <button
            type="button"
            onClick={onSignOut}
            className="p-1.5 text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-[#2d2e32] rounded border border-zinc-200 dark:border-[#333438] transition-colors cursor-pointer flex items-center gap-1 text-xs"
            title="Cerrar Sesión"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Salir</span>
          </button>
        )}
      </div>
    </header>
  );
};




