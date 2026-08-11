import React from 'react';
import { Search, Filter, X, ShieldAlert, PlayCircle, Clock, CheckCircle2, RotateCcw, UserCheck } from 'lucide-react';

export type StatusFilterType = 'todos' | 'alertas' | 'en_curso' | 'proximos' | 'finalizados';

interface ScheduleFilterBarProps {
  searchTerm: string;
  onSearchChange: (val: string) => void;
  statusFilter: StatusFilterType;
  onStatusFilterChange: (status: StatusFilterType) => void;
  selectedLugar?: string;
  onLugarChange?: (lugar: string) => void;
  selectedCat?: string;
  onCatChange?: (cat: string) => void;
  selectedTecnico?: string;
  onTecnicoChange?: (tec: string) => void;
  availableLugares?: string[];
  availableCats?: string[];
  availableTecnicos?: string[];
  counts: {
    todos: number;
    alertas: number;
    en_curso: number;
    proximos: number;
    finalizados: number;
  };
  totalCount: number;
  filteredCount: number;
  onResetFilters: () => void;
}

export const ScheduleFilterBar: React.FC<ScheduleFilterBarProps> = ({
  searchTerm,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  selectedTecnico = 'todos',
  onTecnicoChange,
  availableTecnicos = [],
  counts,
  totalCount,
  filteredCount,
  onResetFilters
}) => {
  const hasActiveFilters = searchTerm !== '' || statusFilter !== 'todos';

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-2xs space-y-3">
      {/* Top Bar: Search Input & Quick Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative flex-1 min-w-[260px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por curso, módulo, docente, sede..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-lg pl-9 pr-8 py-2 text-xs font-semibold text-slate-900 dark:text-slate-100 focus:outline-none focus:border-indigo-600 dark:focus:border-indigo-500 focus:bg-white dark:focus:bg-slate-900 transition-colors"
          />
          {searchTerm && (
            <button
              type="button"
              onClick={() => onSearchChange('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Dropdown Filters */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Reset Filters Button */}
          {hasActiveFilters && (
            <button
              type="button"
              onClick={onResetFilters}
              className="px-2.5 py-2 rounded-lg text-xs font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/50 flex items-center gap-1 transition-colors cursor-pointer"
              title="Limpiar Filtros"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Limpiar</span>
            </button>
          )}
        </div>
      </div>

      {/* Status Filter Tabs (Semaforización Quick Filter) */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-1.5 flex-wrap">
          {/* Todos */}
          <button
            type="button"
            onClick={() => onStatusFilterChange('todos')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              statusFilter === 'todos'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            <span>Todos</span>
            <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
              statusFilter === 'todos' ? 'bg-indigo-700 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200'
            }`}>
              {counts.todos}
            </span>
          </button>

          {/* Alertas / Urgentes */}
          <button
            type="button"
            onClick={() => onStatusFilterChange('alertas')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              statusFilter === 'alertas'
                ? 'bg-rose-600 text-white shadow-xs'
                : 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 hover:bg-rose-100 dark:hover:bg-rose-900/80 border border-rose-200 dark:border-rose-900/60'
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>Alertas</span>
            {counts.alertas > 0 && (
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                statusFilter === 'alertas' ? 'bg-rose-700 text-white' : 'bg-rose-200 dark:bg-rose-900 text-rose-800 dark:text-rose-100'
              }`}>
                {counts.alertas}
              </span>
            )}
          </button>

          {/* En Curso */}
          <button
            type="button"
            onClick={() => onStatusFilterChange('en_curso')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              statusFilter === 'en_curso'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            <PlayCircle className="w-3.5 h-3.5 text-emerald-500" />
            <span>En Curso</span>
            <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
              statusFilter === 'en_curso' ? 'bg-emerald-700 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200'
            }`}>
              {counts.en_curso}
            </span>
          </button>

          {/* Próximos */}
          <button
            type="button"
            onClick={() => onStatusFilterChange('proximos')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              statusFilter === 'proximos'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            <Clock className="w-3.5 h-3.5 text-indigo-400" />
            <span>Próximos</span>
            <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
              statusFilter === 'proximos' ? 'bg-indigo-700 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200'
            }`}>
              {counts.proximos}
            </span>
          </button>

          {/* Finalizados */}
          <button
            type="button"
            onClick={() => onStatusFilterChange('finalizados')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              statusFilter === 'finalizados'
                ? 'bg-slate-700 text-white shadow-xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5 text-slate-400" />
            <span>Finalizados</span>
            <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
              statusFilter === 'finalizados' ? 'bg-slate-800 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200'
            }`}>
              {counts.finalizados}
            </span>
          </button>
        </div>

        {/* Counter Info */}
        <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 font-mono">
          Mostrando <strong className="text-indigo-600 dark:text-indigo-400">{filteredCount}</strong> de {totalCount} asignaciones
        </div>
      </div>
    </div>
  );
};
