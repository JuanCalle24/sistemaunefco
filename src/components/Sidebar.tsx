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

              <button
                onClick={() => {
                  onSelectView('programar');
                  setIsCollapsed(false);
                }}
                className={`w-9 h-9 rounded flex items-center justify-center transition-colors cursor-pointer relative ${
                  selectedView === 'programar'
                    ? 'bg-zinc-200 dark:bg-[#2d2e32] text-zinc-900 dark:text-white font-bold'
                    : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-[#252628]'
                }`}
                title="Parámetros de Programación"
              >
                <CalendarDays className="w-4 h-4" />
                {totalCiclosCount > 0 && (
                  <span className="absolute -top-1 -right-1 text-[9px] font-mono bg-zinc-800 text-white dark:bg-zinc-200 dark:text-zinc-900 w-3.5 h-3.5 rounded-full flex items-center justify-center">
                    {totalCiclosCount}
                  </span>
                )}
              </button>

              <button
                onClick={() => onSelectView('eventos')}
                className={`w-9 h-9 rounded flex items-center justify-center transition-colors cursor-pointer relative ${
                  selectedView === 'eventos'
                    ? 'bg-zinc-200 dark:bg-[#2d2e32] text-zinc-900 dark:text-white'
                    : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-[#252628]'
                }`}
                title="Eventos Programados"
              >
                <BookOpen className="w-4 h-4" />
              </button>

              <button
                onClick={() => onSelectView('correlativos')}
                className={`w-9 h-9 rounded flex items-center justify-center transition-colors cursor-pointer ${
                  selectedView === 'correlativos'
                    ? 'bg-zinc-200 dark:bg-[#2d2e32] text-zinc-900 dark:text-white'
                    : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-[#252628]'
                }`}
                title="Correlativos"
              >
                <Stamp className="w-4 h-4" />
              </button>

              <button
                onClick={() => onSelectView('dashboard')}
                className={`w-9 h-9 rounded flex items-center justify-center transition-colors cursor-pointer ${
                  selectedView === 'dashboard'
                    ? 'bg-zinc-200 dark:bg-[#2d2e32] text-zinc-900 dark:text-white'
                    : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-[#252628]'
                }`}
                title="Dashboard"
              >
                <LayoutDashboard className="w-4 h-4" />
              </button>

              {onOpenHistory && (
                <button
                  onClick={onOpenHistory}
                  className="w-9 h-9 rounded text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-[#252628] flex items-center justify-center transition-colors cursor-pointer"
                  title="Historial"
                >
                  <History className="w-4 h-4" />
                </button>
              )}
            </div>
          ) : (
            /* Expanded Navigation */
            <>
              <div className="text-[10px] font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider px-2 pt-2 pb-1">
                Workspace
              </div>

              {/* Accordion Programación */}
              <div className="rounded border border-zinc-200 dark:border-[#2e2f33] overflow-hidden bg-zinc-50/50 dark:bg-[#252628]/50">
                <button
                  onClick={() => setOpenProgramacion(!openProgramacion)}
                  className="w-full px-3 py-2 flex items-center justify-between text-xs font-medium text-zinc-800 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-[#2d2e32] transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <CalendarDays className="w-4 h-4 text-zinc-500 dark:text-zinc-400" />
                    <span>Programación Académica</span>
                  </div>
                  {openProgramacion ? (
                    <ChevronDown className="w-3.5 h-3.5 text-zinc-400" />
                  ) : (
                    <ChevronRight className="w-3.5 h-3.5 text-zinc-400" />
                  )}
                </button>

                {openProgramacion && (
                  <div className="bg-white dark:bg-[#1e1f21] border-t border-zinc-200 dark:border-[#2e2f33] divide-y divide-zinc-100 dark:divide-[#2a2b2e]">
                    <button
                      onClick={() => onSelectView('programar')}
                      className={`w-full px-3.5 py-2 text-left text-xs font-medium flex items-center justify-between transition-colors cursor-pointer ${
                        selectedView === 'programar'
                          ? 'bg-zinc-100 dark:bg-[#2d2e32] text-zinc-900 dark:text-white border-l-2 border-zinc-700 dark:border-zinc-300 font-semibold'
                          : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-[#252628]'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <Sliders className="w-3.5 h-3.5" />
                        <span>Programar Calendario</span>
                      </div>
                      {totalCiclosCount > 0 && (
                        <span className="text-[10px] font-mono bg-zinc-200 dark:bg-[#333438] text-zinc-800 dark:text-zinc-200 px-1.5 py-0.2 rounded">
                          {totalCiclosCount}
                        </span>
                      )}
                    </button>

                    <button
                      onClick={() => onSelectView('eventos')}
                      className={`w-full px-3.5 py-2 text-left text-xs font-medium flex items-center justify-between transition-colors cursor-pointer ${
                        selectedView === 'eventos'
                          ? 'bg-zinc-100 dark:bg-[#2d2e32] text-zinc-900 dark:text-white border-l-2 border-zinc-700 dark:border-zinc-300 font-semibold'
                          : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-[#252628]'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <BookOpen className="w-3.5 h-3.5" />
                        <span>Cursos Programados</span>
                      </div>
                      {hasResult && (
                        <span className="text-[9px] uppercase bg-zinc-200 dark:bg-[#333438] text-zinc-700 dark:text-zinc-300 px-1.5 py-0.2 rounded font-mono">
                          Activo
                        </span>
                      )}
                    </button>
                  </div>
                )}
              </div>

              {/* Menu Items */}
              <button
                onClick={() => onSelectView('correlativos')}
                className={`w-full px-3 py-2 rounded text-xs font-medium flex items-center justify-between transition-colors cursor-pointer ${
                  selectedView === 'correlativos'
                    ? 'bg-zinc-100 dark:bg-[#2d2e32] text-zinc-900 dark:text-white font-semibold'
                    : 'text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-[#252628]'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Stamp className="w-4 h-4 text-zinc-500 dark:text-zinc-400" />
                  <span>Correlativos UNEFCO</span>
                </div>
              </button>

              <button
                onClick={() => onSelectView('dashboard')}
                className={`w-full px-3 py-2 rounded text-xs font-medium flex items-center justify-between transition-colors cursor-pointer ${
                  selectedView === 'dashboard'
                    ? 'bg-zinc-100 dark:bg-[#2d2e32] text-zinc-900 dark:text-white font-semibold'
                    : 'text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-[#252628]'
                }`}
              >
                <div className="flex items-center gap-2">
                  <LayoutDashboard className="w-4 h-4 text-zinc-500 dark:text-zinc-400" />
                  <span>Dashboard & Métricas</span>
                </div>
              </button>

              {onOpenHistory && (
                <button
                  onClick={onOpenHistory}
                  className="w-full px-3 py-2 rounded text-xs font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-[#252628] flex items-center gap-2 transition-colors cursor-pointer"
                >
                  <History className="w-4 h-4 text-zinc-500 dark:text-zinc-400" />
                  <span>Historial de Calendarios Académicos</span>
                </button>
              )}

              {onOpenShare && (
                <button
                  onClick={onOpenShare}
                  disabled={pdfDisabled}
                  className="w-full px-3 py-2 rounded text-xs font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-[#252628] disabled:opacity-30 flex items-center gap-2 transition-colors cursor-pointer"
                >
                  <Send className="w-4 h-4 text-zinc-500 dark:text-zinc-400" />
                  <span>Notificar & Compartir</span>
                </button>
              )}

              {onGeneratePDF && (
                <button
                  onClick={onGeneratePDF}
                  disabled={pdfDisabled}
                  className="w-full px-3 py-2 rounded text-xs font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-[#252628] disabled:opacity-30 flex items-center gap-2 transition-colors cursor-pointer"
                >
                  <FileDown className="w-4 h-4 text-zinc-500 dark:text-zinc-400" />
                  <span>Exportar PDF</span>
                </button>
              )}

              <div className="pt-2 border-t border-zinc-200 dark:border-[#2e2f33] mt-2">
                <div className="text-[10px] font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider px-2 mb-1">
                  Administración
                </div>

                {isAdmin ? (
                  onOpenUserManagement && (
                    <button
                      onClick={onOpenUserManagement}
                      className="w-full px-3 py-2 rounded text-xs font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-[#252628] flex items-center justify-between transition-colors cursor-pointer my-0.5"
                    >
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-zinc-500 dark:text-zinc-400" />
                        <span>Gestión de Técnicos</span>
                      </div>
                      <ShieldCheck className="w-3.5 h-3.5 text-zinc-400" />
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
                    className="w-full px-3 py-2 rounded text-xs font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-[#252628] flex items-center justify-between transition-colors cursor-pointer my-0.5"
                  >
                    <div className="flex items-center gap-2">
                      <Settings2 className="w-4 h-4 text-zinc-500 dark:text-zinc-400" />
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
