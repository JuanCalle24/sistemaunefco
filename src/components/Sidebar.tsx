import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  User, 
  Plus, 
  Trash2, 
  Calendar, 
  Workflow, 
  Edit3, 
  Settings2, 
  AlertTriangle,
  Zap,
  CalendarDays,
  LayoutDashboard,
  History,
  Send,
  FileDown,
  Users,
  RotateCcw,
  PanelLeftClose,
  PanelLeftOpen,
  ChevronDown,
  ChevronRight,
  ChevronLeft,
  Sliders,
  Sparkles,
  BookOpen,
  ShieldCheck,
  CheckCircle2,
  Lock,
  Stamp
} from 'lucide-react';
import { OFERTA_FORMATIVA_UNEFCO_2026 } from '../data/ofertaFormativa';
import { DatePickerPopup } from './DatePickerPopup';
import { Modalidad, UserProfile } from '../types';
import { capitalizeName } from '../utils/textUtils';

interface MatrixRowItem {
  id: string;
  cicloIndex: number;
  cant: number;
  lugar: string;
  modalidad: Modalidad;
}

export type MainViewOption = 'programar' | 'eventos' | 'dashboard' | 'historial' | 'correlativos';

interface SidebarProps {
  modo: 'automatico' | 'manual';
  onToggleModo: (modo: 'automatico' | 'manual') => void;
  
  facilitador: string;
  onChangeFacilitador: (v: string) => void;
  savedDocentes: string[];
  
  tecnico: string;
  onChangeTecnico: (v: string) => void;
  savedCoordinadores: string[];
  
  matrixRows: MatrixRowItem[];
  onAddMatrixRow: () => void;
  onRemoveMatrixRow: (id: string) => void;
  onUpdateMatrixRow: (id: string, fieldOrUpdates: keyof MatrixRowItem | Partial<MatrixRowItem>, value?: any) => void;
  
  selectedDate: Date | null;
  onSelectDate: (d: Date) => void;
  feriadosCustom: string[];
  
  onGenerar: () => void;
  isGenerating: boolean;
  isValid: boolean;
  totalCiclosCount: number;
  
  onOpenAdminModal: () => void;
  onClearAll?: () => void;
  errorMessage?: string | null;
  warnings?: string[];

  // Dynamic View & Grouped Navigation
  selectedView: MainViewOption;
  onSelectView: (view: MainViewOption) => void;
  onOpenHistory?: () => void;
  onOpenShare?: () => void;
  onGeneratePDF?: () => void;
  pdfDisabled?: boolean;
  onOpenUserManagement?: () => void;
  currentUser?: UserProfile | null;
  activeRole?: 'admin' | 'tecnico';
  hasResult?: boolean;
}

export const GRADOS_ACADEMICOS = [
  'Lic.',
  'M.Sc.',
  'Ph.D.',
  'Ing.',
  'Prof.'
];

export function parseDegreeAndName(fullName: string) {
  if (!fullName) return { grado: 'Lic.', nombre: '' };
  const trimmed = fullName.trim();
  for (const degree of GRADOS_ACADEMICOS) {
    if (trimmed.toLowerCase().startsWith(degree.toLowerCase() + ' ')) {
      return {
        grado: degree,
        nombre: trimmed.slice(degree.length).trim()
      };
    }
    if (trimmed.toLowerCase() === degree.toLowerCase()) {
      return {
        grado: degree,
        nombre: ''
      };
    }
  }
  return { grado: '', nombre: trimmed };
}

export const Sidebar: React.FC<SidebarProps> = ({
  modo,
  onToggleModo,
  facilitador,
  onChangeFacilitador,
  savedDocentes,
  tecnico,
  onChangeTecnico,
  savedCoordinadores,
  matrixRows,
  onAddMatrixRow,
  onRemoveMatrixRow,
  onUpdateMatrixRow,
  selectedDate,
  onSelectDate,
  feriadosCustom,
  onGenerar,
  isGenerating,
  isValid,
  totalCiclosCount,
  onOpenAdminModal,
  onClearAll,
  errorMessage,
  warnings = [],
  selectedView,
  onSelectView,
  onOpenHistory,
  onOpenShare,
  onGeneratePDF,
  pdfDisabled = true,
  onOpenUserManagement,
  currentUser,
  activeRole = 'tecnico',
  hasResult = false
}) => {
  const isAdmin = activeRole === 'admin';

  // State for Accordion Menu sections
  const [openProgramacion, setOpenProgramacion] = useState(true);

  // Sidebar collapse/expand state
  const [isCollapsed, setIsCollapsed] = useState<boolean>(() => {
    const saved = localStorage.getItem('unefco_sidebar_collapsed');
    return saved !== null ? saved === 'true' : false;
  });

  const toggleCollapse = () => {
    setIsCollapsed(prev => {
      const next = !prev;
      localStorage.setItem('unefco_sidebar_collapsed', String(next));
      return next;
    });
  };

  const { grado: currentGrado, nombre: currentNombre } = parseDegreeAndName(facilitador);

  const handleGradoSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newGrado = e.target.value;
    const combined = newGrado ? `${newGrado} ${currentNombre}`.trim() : currentNombre;
    onChangeFacilitador(combined);
  };

  const handleNombreInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newNombre = capitalizeName(e.target.value);
    const combined = currentGrado ? `${currentGrado} ${newNombre}`.trimStart() : newNombre;
    onChangeFacilitador(combined);
  };

  return (
    <aside className="relative z-30 flex shrink-0 h-full">
      {/* ------------------------------------------------------------- */}
      {/* ENTERPRISE ACADEMIC WORKSPACE SIDEBAR (Monday.com / Canvas LMS) */}
      {/* ------------------------------------------------------------- */}
      <div 
        className={`bg-white dark:bg-[#1e1f21] text-zinc-800 dark:text-zinc-200 border-r border-zinc-200 dark:border-[#2e2f33] flex flex-col h-full transition-all duration-200 z-40 select-none ${
          isCollapsed ? 'w-14' : 'w-64 md:w-72'
        }`}
      >
        {/* Header User Profile Card */}
        <div className="p-3 border-b border-zinc-200 dark:border-[#2e2f33] bg-zinc-50/50 dark:bg-[#252628] flex items-center justify-between">
          {!isCollapsed ? (
            <div className="flex items-center gap-2.5 overflow-hidden">
              <div className="w-8 h-8 rounded bg-emerald-600 text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-xs">
                {currentUser?.displayName ? currentUser.displayName.charAt(0).toUpperCase() : 'U'}
              </div>
              <div className="min-w-0">
                <div className="text-[10px] text-emerald-700 dark:text-emerald-400 font-bold uppercase tracking-wider truncate flex items-center gap-1">
                  <span>UNEFCO La Paz</span>
                  {isAdmin && (
                    <span className="text-[9px] bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 px-1 py-0.2 rounded font-mono font-bold">
                      ADMIN
                    </span>
                  )}
                </div>
                <div className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 truncate">
                  {currentUser?.displayName || 'Usuario UNEFCO'}
                </div>
              </div>
            </div>
          ) : (
            <div className="w-8 h-8 rounded bg-emerald-600 text-white font-bold text-xs flex items-center justify-center mx-auto shadow-xs">
              {currentUser?.displayName ? currentUser.displayName.charAt(0).toUpperCase() : 'U'}
            </div>
          )}

          {!isCollapsed && (
            <button
              onClick={toggleCollapse}
              className="p-1 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-200/50 dark:hover:bg-[#333438] rounded transition-colors cursor-pointer"
              title="Colapsar Menú"
            >
              <PanelLeftClose className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Scrollable Navigation Area */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {/* Collapsed Rail Icons View */}
          {isCollapsed ? (
            <div className="flex flex-col items-center gap-2">
              <button
                onClick={toggleCollapse}
                className="w-9 h-9 rounded bg-zinc-100 dark:bg-[#252628] hover:bg-zinc-200 dark:hover:bg-[#2d2e32] text-zinc-700 dark:text-zinc-200 flex items-center justify-center transition-colors mb-1 cursor-pointer"
                title="Expandir Menú"
              >
                <PanelLeftOpen className="w-4 h-4" />
              </button>

              {/* Paso 1: Correlativos */}
              <button
                onClick={() => {
                  onSelectView('correlativos');
                  setIsCollapsed(false);
                }}
                className={`w-9 h-9 rounded flex items-center justify-center transition-colors cursor-pointer ${
                  selectedView === 'correlativos'
                    ? 'bg-emerald-600 text-white font-bold shadow-xs'
                    : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-[#252628]'
                }`}
                title="1. Correlativos UNEFCO"
              >
                <Stamp className="w-4 h-4" />
              </button>

              {/* Paso 2: Programar Calendario */}
              <button
                onClick={() => {
                  onSelectView('programar');
                  setIsCollapsed(false);
                }}
                className={`w-9 h-9 rounded flex items-center justify-center transition-colors cursor-pointer relative ${
                  selectedView === 'programar'
                    ? 'bg-emerald-600 text-white font-bold shadow-xs'
                    : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-[#252628]'
                }`}
                title="2. Programar Calendario"
              >
                <Sliders className="w-4 h-4" />
                {totalCiclosCount > 0 && (
                  <span className="absolute -top-1 -right-1 text-[9px] font-mono bg-emerald-700 text-white w-3.5 h-3.5 rounded-full flex items-center justify-center font-bold">
                    {totalCiclosCount}
                  </span>
                )}
              </button>

              {/* Paso 3: Ver Cursos Programados */}
              <button
                onClick={() => onSelectView('eventos')}
                className={`w-9 h-9 rounded flex items-center justify-center transition-colors cursor-pointer relative ${
                  selectedView === 'eventos'
                    ? 'bg-emerald-600 text-white font-bold shadow-xs'
                    : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-[#252628]'
                }`}
                title="3. Ver Cursos Programados"
              >
                <BookOpen className="w-4 h-4" />
              </button>

              {/* Paso 4: Dashboard & Métricas */}
              <button
                onClick={() => onSelectView('dashboard')}
                className={`w-9 h-9 rounded flex items-center justify-center transition-colors cursor-pointer ${
                  selectedView === 'dashboard'
                    ? 'bg-emerald-600 text-white font-bold shadow-xs'
                    : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-[#252628]'
                }`}
                title="4. Dashboard & Métricas"
              >
                <LayoutDashboard className="w-4 h-4" />
              </button>

              {/* Paso 5: Historial */}
              {onOpenHistory && (
                <button
                  onClick={onOpenHistory}
                  className="w-9 h-9 rounded text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-[#252628] flex items-center justify-center transition-colors cursor-pointer"
                  title="5. Historial de Calendarios Académicos"
                >
                  <History className="w-4 h-4" />
                </button>
              )}
            </div>
          ) : (
            /* Expanded Navigation organized by Sequential Workflow */
            <>
              <div className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider px-2.5 pt-3 pb-1.5 font-display">
                Flujo de Trabajo Académico
              </div>

              <div className="space-y-1">
                {/* Paso 1: Generar Correlativos */}
                <button
                  onClick={() => onSelectView('correlativos')}
                  className={`w-full px-3 py-2.5 rounded-lg text-sm font-medium flex items-center justify-between transition-all cursor-pointer ${
                    selectedView === 'correlativos'
                      ? 'bg-emerald-50 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-200 border-l-3 border-emerald-600 font-bold shadow-2xs'
                      : 'text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-[#252628]'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="w-5 h-5 rounded bg-emerald-100 dark:bg-emerald-900/80 text-emerald-800 dark:text-emerald-300 text-xs font-bold font-mono flex items-center justify-center shrink-0">
                      1
                    </span>
                    <Stamp className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    <span className="truncate">Generar Correlativos</span>
                  </div>
                </button>

                {/* Paso 2: Programar Calendario */}
                <button
                  onClick={() => onSelectView('programar')}
                  className={`w-full px-3 py-2.5 rounded-lg text-sm font-medium flex items-center justify-between transition-all cursor-pointer ${
                    selectedView === 'programar'
                      ? 'bg-emerald-50 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-200 border-l-3 border-emerald-600 font-bold shadow-2xs'
                      : 'text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-[#252628]'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="w-5 h-5 rounded bg-emerald-100 dark:bg-emerald-900/80 text-emerald-800 dark:text-emerald-300 text-xs font-bold font-mono flex items-center justify-center shrink-0">
                      2
                    </span>
                    <Sliders className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    <span className="truncate">Programar Calendario</span>
                  </div>
                  {totalCiclosCount > 0 && (
                    <span className="text-xs font-mono font-bold bg-emerald-200 dark:bg-emerald-900 text-emerald-900 dark:text-emerald-200 px-1.5 py-0.5 rounded">
                      {totalCiclosCount}
                    </span>
                  )}
                </button>

                {/* Paso 3: Ver Cursos Programados */}
                <button
                  onClick={() => onSelectView('eventos')}
                  className={`w-full px-3 py-2.5 rounded-lg text-sm font-medium flex items-center justify-between transition-all cursor-pointer ${
                    selectedView === 'eventos'
                      ? 'bg-emerald-50 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-200 border-l-3 border-emerald-600 font-bold shadow-2xs'
                      : 'text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-[#252628]'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="w-5 h-5 rounded bg-emerald-100 dark:bg-emerald-900/80 text-emerald-800 dark:text-emerald-300 text-xs font-bold font-mono flex items-center justify-center shrink-0">
                      3
                    </span>
                    <BookOpen className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    <span className="truncate">Ver Cursos Programados</span>
                  </div>
                  {hasResult && (
                    <span className="text-xs font-bold uppercase bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 px-1.5 py-0.5 rounded font-mono">
                      Activo
                    </span>
                  )}
                </button>

                {/* Paso 4: Dashboard & Métricas */}
                <button
                  onClick={() => onSelectView('dashboard')}
                  className={`w-full px-3 py-2.5 rounded-lg text-sm font-medium flex items-center justify-between transition-all cursor-pointer ${
                    selectedView === 'dashboard'
                      ? 'bg-emerald-50 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-200 border-l-3 border-emerald-600 font-bold shadow-2xs'
                      : 'text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-[#252628]'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="w-5 h-5 rounded bg-emerald-100 dark:bg-emerald-900/80 text-emerald-800 dark:text-emerald-300 text-xs font-bold font-mono flex items-center justify-center shrink-0">
                      4
                    </span>
                    <LayoutDashboard className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    <span className="truncate">Dashboard & Métricas</span>
                  </div>
                </button>

                {/* Paso 5: Historial de Calendarios Académicos */}
                {onOpenHistory && (
                  <button
                    onClick={onOpenHistory}
                    className="w-full px-3 py-2.5 rounded-lg text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-[#252628] flex items-center gap-2.5 transition-all cursor-pointer"
                  >
                    <span className="w-5 h-5 rounded bg-emerald-100 dark:bg-emerald-900/80 text-emerald-800 dark:text-emerald-300 text-xs font-bold font-mono flex items-center justify-center shrink-0">
                      5
                    </span>
                    <History className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    <span className="truncate">Historial de Calendarios</span>
                  </button>
                )}
              </div>

              {/* Herramientas de Exportación */}
              <div className="pt-3 border-t border-zinc-200 dark:border-[#2e2f33] mt-3">
                <div className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider px-2.5 pb-1.5 font-display">
                  Herramientas
                </div>

                {onOpenShare && (
                  <button
                    onClick={onOpenShare}
                    disabled={pdfDisabled}
                    className="w-full px-3 py-2 rounded-lg text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-[#252628] disabled:opacity-30 flex items-center gap-2.5 transition-colors cursor-pointer my-0.5"
                  >
                    <Send className="w-4 h-4 text-zinc-500 dark:text-zinc-400 shrink-0" />
                    <span>Notificar & Compartir</span>
                  </button>
                )}

                {onGeneratePDF && (
                  <button
                    onClick={onGeneratePDF}
                    disabled={pdfDisabled}
                    className="w-full px-3 py-2 rounded-lg text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-[#252628] disabled:opacity-30 flex items-center gap-2.5 transition-colors cursor-pointer my-0.5"
                  >
                    <FileDown className="w-4 h-4 text-zinc-500 dark:text-zinc-400 shrink-0" />
                    <span>Exportar PDF</span>
                  </button>
                )}
              </div>

              {/* Administración */}
              <div className="pt-3 border-t border-zinc-200 dark:border-[#2e2f33] mt-2">
                <div className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider px-2.5 pb-1.5 font-display">
                  Administración
                </div>

                {isAdmin ? (
                  onOpenUserManagement && (
                    <button
                      onClick={onOpenUserManagement}
                      className="w-full px-3 py-2 rounded-lg text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-[#252628] flex items-center justify-between transition-colors cursor-pointer my-0.5"
                    >
                      <div className="flex items-center gap-2.5">
                        <Users className="w-4 h-4 text-zinc-500 dark:text-zinc-400 shrink-0" />
                        <span>Gestión de Técnicos</span>
                      </div>
                      <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    </button>
                  )
                ) : (
                  <div className="px-3 py-1.5 text-xs text-zinc-400 flex items-center gap-2">
                    <Lock className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                    <span>Técnicos (Limitado)</span>
                  </div>
                )}

                {isAdmin && (
                  <button
                    onClick={onOpenAdminModal}
                    className="w-full px-3 py-2 rounded-lg text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-[#252628] flex items-center justify-between transition-colors cursor-pointer my-0.5"
                  >
                    <div className="flex items-center gap-2.5">
                      <Settings2 className="w-4 h-4 text-zinc-500 dark:text-zinc-400 shrink-0" />
                      <span>Feriados & Oferta</span>
                    </div>
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </aside>
  );
};
