import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  FileDown, 
  Clock, 
  Sun, 
  Moon, 
  LayoutDashboard, 
  CalendarDays, 
  History,
  Send
} from 'lucide-react';
import { DIAS_SEMANA_COMPLETOS } from '../utils/textUtils';

interface HeaderProps {
  onGeneratePDF: () => void;
  pdfDisabled: boolean;
  totalDaysUsed?: number;
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
  activeTab: 'cronograma' | 'dashboard';
  onTabChange: (tab: 'cronograma' | 'dashboard') => void;
  onOpenHistory: () => void;
  onOpenShare?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onGeneratePDF,
  pdfDisabled,
  totalDaysUsed,
  isDarkMode,
  onToggleDarkMode,
  activeTab,
  onTabChange,
  onOpenHistory,
  onOpenShare
}) => {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const dayName = DIAS_SEMANA_COMPLETOS[now.getDay()];
  const dateStr = `${dayName}, ${String(now.getDate()).padStart(2, '0')}/${String(now.getMonth() + 1).padStart(2, '0')}/${now.getFullYear()}`;
  const timeStr = now.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

  return (
    <header className="min-h-20 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between px-6 md:px-8 py-3 shrink-0 sticky top-0 z-40 transition-colors">
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-indigo-600 dark:bg-indigo-500 rounded-md flex items-center justify-center text-white font-bold text-lg font-display shadow-xs">
            U
          </div>
          <div>
            <h1 className="font-display text-base md:text-lg font-bold text-slate-900 dark:text-white leading-tight flex items-center gap-2">
              UNEFCO <span className="text-xs bg-indigo-50 dark:bg-indigo-950/80 border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 font-bold px-2 py-0.5 rounded-sm tracking-normal">La Paz</span>
            </h1>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-semibold tracking-wider">
              Programación Académica
            </p>
          </div>
        </div>

        {/* View Switcher Tabs */}
        <nav className="hidden md:flex items-center gap-2 ml-4">
          <button
            onClick={() => onTabChange('cronograma')}
            className={`px-3 py-1.5 text-xs font-bold uppercase tracking-wider rounded-md flex items-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'cronograma'
                ? 'bg-indigo-50 dark:bg-indigo-950/70 text-indigo-600 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 shadow-2xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <CalendarDays className="w-3.5 h-3.5" />
            <span>Cronograma</span>
          </button>
          <button
            onClick={() => onTabChange('dashboard')}
            className={`px-3 py-1.5 text-xs font-bold uppercase tracking-wider rounded-md flex items-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'dashboard'
                ? 'bg-indigo-50 dark:bg-indigo-950/70 text-indigo-600 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 shadow-2xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <LayoutDashboard className="w-3.5 h-3.5" />
            <span>Dashboard Metrics</span>
          </button>
        </nav>
      </div>

      <div className="flex flex-wrap items-center gap-3 md:gap-4 mt-2 sm:mt-0">
        {/* Mobile View Switcher */}
        <div className="flex xl:hidden items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-2xs border border-slate-200 dark:border-slate-700">
          <button
            onClick={() => onTabChange('cronograma')}
            className={`p-1.5 text-xs font-bold rounded-2xs transition-colors cursor-pointer ${
              activeTab === 'cronograma' ? 'bg-white dark:bg-slate-900 text-indigo-600' : 'text-slate-500'
            }`}
            title="Vista Cronograma"
          >
            <CalendarDays className="w-4 h-4" />
          </button>
          <button
            onClick={() => onTabChange('dashboard')}
            className={`p-1.5 text-xs font-bold rounded-2xs transition-colors cursor-pointer ${
              activeTab === 'dashboard' ? 'bg-white dark:bg-slate-900 text-indigo-600' : 'text-slate-500'
            }`}
            title="Dashboard de Seguimiento"
          >
            <LayoutDashboard className="w-4 h-4" />
          </button>
        </div>

        {/* Live Clock & Date */}
        <div className="hidden lg:flex items-center gap-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3 py-1.5 rounded-sm text-xs font-semibold text-slate-700 dark:text-slate-300">
          <div className="flex items-center gap-1.5 text-indigo-600 dark:text-indigo-400">
            <Calendar className="w-3.5 h-3.5" />
            <span>{dateStr}</span>
          </div>
          <div className="h-3 w-px bg-slate-300 dark:bg-slate-600" />
          <div className="flex items-center gap-1.5 font-mono text-slate-600 dark:text-slate-400">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            <span>{timeStr}</span>
          </div>
        </div>

        {totalDaysUsed !== undefined && totalDaysUsed > 0 && (
          <div className="hidden xl:flex flex-col items-end px-3 py-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-sm">
            <span className="text-[9px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider">Margen Contrato</span>
            <span className="text-xs font-bold text-indigo-700 dark:text-indigo-400">{totalDaysUsed} / 100 DÍAS</span>
          </div>
        )}

        {/* Historial Button */}
        <button
          type="button"
          onClick={onOpenHistory}
          className="p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-sm transition-colors cursor-pointer flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider"
          title="Ver Historial de Cronogramas"
        >
          <History className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
          <span className="hidden sm:inline">Historial</span>
        </button>

        {/* Dark Mode Toggle */}
        <button
          type="button"
          onClick={onToggleDarkMode}
          className="p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-sm transition-colors cursor-pointer"
          title={isDarkMode ? "Cambiar a Modo Claro" : "Cambiar a Modo Nocturno"}
        >
          {isDarkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-600" />}
        </button>

        {/* Notificar / Compartir Button */}
        {onOpenShare && (
          <button
            onClick={onOpenShare}
            disabled={pdfDisabled}
            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-bold uppercase tracking-wider transition-colors flex items-center gap-1.5 rounded-sm cursor-pointer shadow-2xs"
            title="Notificar por WhatsApp / Email o Exportar a Google Calendar"
          >
            <Send className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Notificar</span>
          </button>
        )}

        {/* PDF Download Button */}
        <button
          onClick={onGeneratePDF}
          disabled={pdfDisabled}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-600 dark:hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-bold uppercase tracking-widest transition-colors flex items-center gap-2 rounded-sm cursor-pointer shadow-2xs"
        >
          <FileDown className="w-4 h-4 text-emerald-300" />
          <span>Exportar PDF</span>
        </button>
      </div>
    </header>
  );
};


