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
  Lock
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

export type MainViewOption = 'programar' | 'eventos' | 'dashboard' | 'historial';

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
  onUpdateMatrixRow: (id: string, field: keyof MatrixRowItem, value: any) => void;
  
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
    if (trimmed.startsWith(degree + ' ')) {
      return {
        grado: degree,
        nombre: trimmed.slice(degree.length + 1)
      };
    }
    if (trimmed === degree) {
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
      {/* SIE UNEFCO STYLE LEFT NAVIGATION MENU                          */}
      {/* ------------------------------------------------------------- */}
      <div 
        className={`bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 border-r border-slate-200 dark:border-slate-800 flex flex-col h-full transition-all duration-300 z-40 select-none shadow-xs ${
          isCollapsed ? 'w-16' : 'w-72 md:w-80'
        }`}
      >
        {/* Header User Profile Card (SIE Style) */}
        <div className="p-3.5 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex items-center justify-between">
          {!isCollapsed ? (
            <div className="flex items-center gap-2.5 overflow-hidden">
              <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-bold text-sm shrink-0 shadow-xs">
                {currentUser?.displayName ? currentUser.displayName.charAt(0).toUpperCase() : 'U'}
              </div>
              <div className="min-w-0">
                <div className="text-[10px] uppercase font-bold text-indigo-600 dark:text-indigo-400 tracking-wider truncate flex items-center gap-1">
                  <span>Sede La Paz</span>
                  {isAdmin ? (
                    <span className="text-[9px] bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800 px-1 rounded font-black">
                      ADMIN
                    </span>
                  ) : (
                    <span className="text-[9px] bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 px-1 rounded font-black">
                      TÉCNICO
                    </span>
                  )}
                </div>
                <div className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                  {currentUser?.displayName || 'Usuario UNEFCO'}
                </div>
              </div>
            </div>
          ) : (
            <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-bold text-sm mx-auto shadow-xs">
              {currentUser?.displayName ? currentUser.displayName.charAt(0).toUpperCase() : 'U'}
            </div>
          )}

          {!isCollapsed && (
            <button
              onClick={toggleCollapse}
              className="p-1.5 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
              title="Colapsar Menú"
            >
              <PanelLeftClose className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Scrollable Navigation Area */}
        <div className="flex-1 overflow-y-auto px-2 py-3 space-y-1">
          {/* Collapsed Rail Icons View */}
          {isCollapsed ? (
            <div className="flex flex-col items-center gap-2.5">
              <button
                onClick={toggleCollapse}
                className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-indigo-600 text-indigo-600 dark:text-indigo-400 hover:text-white dark:hover:text-white flex items-center justify-center transition-colors mb-2 cursor-pointer shadow-2xs"
                title="Expandir Menú de Opciones"
              >
                <PanelLeftOpen className="w-5 h-5" />
              </button>

              <button
                onClick={() => {
                  onSelectView('programar');
                  setIsCollapsed(false);
                }}
                className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all cursor-pointer relative ${
                  selectedView === 'programar'
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20'
                    : 'bg-slate-100 dark:bg-slate-800/70 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
                }`}
                title="Parámetros de Programación"
              >
                <CalendarDays className="w-5 h-5" />
                {totalCiclosCount > 0 && (
                  <span className="absolute -top-1 -right-1 text-[9px] font-black bg-indigo-500 text-white w-4 h-4 rounded-full flex items-center justify-center border border-white dark:border-slate-900">
                    {totalCiclosCount}
                  </span>
                )}
              </button>

              <button
                onClick={() => {
                  onSelectView('eventos');
                }}
                className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all cursor-pointer relative ${
                  selectedView === 'eventos'
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20'
                    : 'bg-slate-100 dark:bg-slate-800/70 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
                }`}
                title="Eventos / Cursos Programados"
              >
                <BookOpen className="w-5 h-5" />
                {hasResult && (
                  <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 rounded-full border border-white dark:border-slate-900" />
                )}
              </button>

              <button
                onClick={() => onSelectView('dashboard')}
                className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all cursor-pointer ${
                  selectedView === 'dashboard'
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20'
                    : 'bg-slate-100 dark:bg-slate-800/70 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
                }`}
                title="Dashboard de Métricas"
              >
                <LayoutDashboard className="w-5 h-5" />
              </button>

              {onOpenHistory && (
                <button
                  onClick={onOpenHistory}
                  className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800/70 text-slate-600 dark:text-slate-400 hover:bg-indigo-100 dark:hover:bg-indigo-950 hover:text-indigo-600 dark:hover:text-indigo-300 flex items-center justify-center transition-all cursor-pointer"
                  title="Historial de Cronogramas"
                >
                  <History className="w-5 h-5" />
                </button>
              )}

              {onOpenShare && (
                <button
                  onClick={onOpenShare}
                  disabled={pdfDisabled}
                  className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800/70 text-emerald-600 dark:text-emerald-400 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-emerald-100 dark:hover:bg-emerald-950 hover:text-emerald-700 dark:hover:text-emerald-300 flex items-center justify-center transition-all cursor-pointer"
                  title="Notificar por WhatsApp / Email"
                >
                  <Send className="w-5 h-5" />
                </button>
              )}

              {onGeneratePDF && (
                <button
                  onClick={onGeneratePDF}
                  disabled={pdfDisabled}
                  className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800/70 text-indigo-600 dark:text-indigo-400 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-indigo-100 dark:hover:bg-indigo-950 hover:text-indigo-700 dark:hover:text-indigo-300 flex items-center justify-center transition-all cursor-pointer"
                  title="Exportar PDF"
                >
                  <FileDown className="w-5 h-5" />
                </button>
              )}

              {/* ADMIN ONLY CONFIG BUTTONS IN RAIL */}
              {isAdmin && onOpenUserManagement && (
                <button
                  onClick={onOpenUserManagement}
                  className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-950/80 text-purple-700 dark:text-purple-300 hover:bg-purple-200 dark:hover:bg-purple-900 border border-purple-300 dark:border-purple-800/50 flex items-center justify-center transition-all cursor-pointer"
                  title="Gestión de Técnicos (Solo Admin)"
                >
                  <Users className="w-5 h-5" />
                </button>
              )}

              {isAdmin && (
                <button
                  onClick={onOpenAdminModal}
                  className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-950/80 text-purple-700 dark:text-purple-300 hover:bg-purple-200 dark:hover:bg-purple-900 border border-purple-300 dark:border-purple-800/50 flex items-center justify-center transition-all cursor-pointer"
                  title="Configuración de Feriados y Oferta (Solo Admin)"
                >
                  <Settings2 className="w-5 h-5" />
                </button>
              )}
            </div>
          ) : (
            /* Expanded SIE UNEFCO Style Navigation Menu */
            <>
              <div className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest px-3 pt-2 pb-1">
                Menú de Opciones
              </div>

              {/* ACCORDION 1: PROGRAMACIÓN */}
              <div className="rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/50">
                <button
                  onClick={() => setOpenProgramacion(!openProgramacion)}
                  className="w-full px-3 py-2.5 flex items-center justify-between text-xs font-bold text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <CalendarDays className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                    <span>Programación</span>
                  </div>
                  {openProgramacion ? (
                    <ChevronDown className="w-4 h-4 text-slate-400" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                  )}
                </button>

                <AnimatePresence initial={false}>
                  {openProgramacion && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="bg-white dark:bg-slate-950/60 border-t border-slate-200 dark:border-slate-800/60 divide-y divide-slate-100 dark:divide-slate-800/40"
                    >
                      {/* Sub-item: Parámetros de Programación */}
                      <button
                        onClick={() => onSelectView('programar')}
                        className={`w-full px-4 py-2 text-left text-xs font-medium flex items-center justify-between transition-colors cursor-pointer ${
                          selectedView === 'programar'
                            ? 'bg-indigo-50 dark:bg-indigo-600/30 text-indigo-700 dark:text-indigo-300 border-l-2 border-indigo-600 dark:border-indigo-500 font-bold'
                            : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/40'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <Sliders className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                          <span>Generar Cronograma</span>
                        </div>
                        {totalCiclosCount > 0 && (
                          <span className="text-[10px] font-bold bg-indigo-100 dark:bg-indigo-500/30 text-indigo-700 dark:text-indigo-300 px-1.5 py-0.2 rounded border border-indigo-200 dark:border-indigo-500/40">
                            {totalCiclosCount} Ciclos
                          </span>
                        )}
                      </button>

                      {/* Sub-item: Eventos / Cursos Programados */}
                      <button
                        onClick={() => onSelectView('eventos')}
                        className={`w-full px-4 py-2 text-left text-xs font-medium flex items-center justify-between transition-colors cursor-pointer ${
                          selectedView === 'eventos'
                            ? 'bg-indigo-50 dark:bg-indigo-600/30 text-indigo-700 dark:text-indigo-300 border-l-2 border-indigo-600 dark:border-indigo-500 font-bold'
                            : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/40'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <BookOpen className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                          <span>Cursos Programados</span>
                        </div>
                        {hasResult && (
                          <span className="text-[9px] font-bold bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 px-1.5 py-0.2 rounded border border-emerald-200 dark:border-emerald-500/30 uppercase">
                            Activo
                          </span>
                        )}
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* MENU ITEM 2: DASHBOARD & METRICS */}
              <button
                onClick={() => onSelectView('dashboard')}
                className={`w-full px-3 py-2.5 rounded-xl text-xs font-bold flex items-center justify-between transition-colors cursor-pointer ${
                  selectedView === 'dashboard'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/80 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <LayoutDashboard className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  <span>Dashboard & Métricas</span>
                </div>
              </button>

              {/* MENU ITEM 3: HISTORIAL DE CRONOGRAMAS */}
              {onOpenHistory && (
                <button
                  onClick={onOpenHistory}
                  className="w-full px-3 py-2.5 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/80 hover:text-slate-900 dark:hover:text-white flex items-center justify-between transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-2.5">
                    <History className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                    <span>Historial de Cronogramas</span>
                  </div>
                </button>
              )}

              {/* MENU ITEM 4: NOTIFICAR / COMPARTIR */}
              {onOpenShare && (
                <button
                  onClick={onOpenShare}
                  disabled={pdfDisabled}
                  className="w-full px-3 py-2.5 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/80 hover:text-slate-900 dark:hover:text-white disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-between transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-2.5">
                    <Send className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    <span>Notificar & Compartir</span>
                  </div>
                </button>
              )}

              {/* MENU ITEM 5: EXPORTAR INFORME PDF */}
              {onGeneratePDF && (
                <button
                  onClick={onGeneratePDF}
                  disabled={pdfDisabled}
                  className="w-full px-3 py-2.5 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/80 hover:text-slate-900 dark:hover:text-white disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-between transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-2.5">
                    <FileDown className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                    <span>Exportar Informe PDF</span>
                  </div>
                </button>
              )}

              <div className="pt-3 pb-1 border-t border-slate-200 dark:border-slate-800/80 my-2">
                <div className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest px-3 mb-1">
                  Administración de Sistema
                </div>

                {/* MENU ITEM 6: GESTIÓN DE TÉCNICOS (ADMIN ONLY) */}
                {isAdmin ? (
                  onOpenUserManagement && (
                    <button
                      onClick={onOpenUserManagement}
                      className="w-full px-3 py-2.5 rounded-xl text-xs font-bold text-purple-800 dark:text-purple-300 bg-purple-50 dark:bg-purple-950/40 hover:bg-purple-100 dark:hover:bg-purple-900/60 border border-purple-200 dark:border-purple-800/40 flex items-center justify-between transition-colors cursor-pointer my-1"
                    >
                      <div className="flex items-center gap-2.5">
                        <Users className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                        <span>Gestión de Técnicos</span>
                      </div>
                      <ShieldCheck className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                    </button>
                  )
                ) : (
                  <div className="px-3 py-2 text-[11px] text-slate-400 dark:text-slate-500 flex items-center gap-2 font-medium">
                    <Lock className="w-3.5 h-3.5 text-slate-400 dark:text-slate-600 shrink-0" />
                    <span>Técnicos (Acceso Limitado)</span>
                  </div>
                )}

                {/* MENU ITEM 7: CONFIGURACIÓN FERIADOS Y OFERTA (ADMIN ONLY) */}
                {isAdmin ? (
                  <button
                    onClick={onOpenAdminModal}
                    className="w-full px-3 py-2.5 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/80 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-slate-800 flex items-center justify-between transition-colors cursor-pointer my-1"
                  >
                    <div className="flex items-center gap-2.5">
                      <Settings2 className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                      <span>Feriados & Oferta Académica</span>
                    </div>
                    <span className="text-[9px] font-bold bg-purple-100 dark:bg-purple-900/80 text-purple-800 dark:text-purple-300 px-1.5 py-0.2 rounded uppercase">
                      Admin
                    </span>
                  </button>
                ) : (
                  <div className="px-3 py-2 text-[11px] text-slate-400 dark:text-slate-500 flex items-center gap-2 font-medium" title="Solo disponible para Administradores">
                    <Lock className="w-3.5 h-3.5 text-slate-400 dark:text-slate-600 shrink-0" />
                    <span>Config. Feriados (Solo Admin)</span>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </aside>
  );
};
