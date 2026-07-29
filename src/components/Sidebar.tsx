import React from 'react';
import { 
  User, 
  UserCheck, 
  Network, 
  Plus, 
  Trash2, 
  Calendar, 
  Workflow, 
  Edit3, 
  Settings2, 
  AlertTriangle,
  Zap,
  CalendarDays,
  RotateCcw
} from 'lucide-react';
import { OFERTA_FORMATIVA_UNEFCO_2026 } from '../data/ofertaFormativa';
import { DatePickerPopup } from './DatePickerPopup';
import { Modalidad } from '../types';
import { capitalizeName } from '../utils/textUtils';

interface MatrixRowItem {
  id: string;
  cicloIndex: number;
  cant: number;
  lugar: string;
  modalidad: Modalidad;
}

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
  warnings = []
}) => {
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
    <aside className="w-full lg:w-80 bg-slate-50 dark:bg-slate-950 border-r border-slate-200 dark:border-slate-800 flex flex-col h-full overflow-y-auto shrink-0 transition-colors">
      {/* Sidebar Header */}
      <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-indigo-600 rounded flex items-center justify-center text-white">
              <Settings2 className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-[11px] font-bold text-slate-900 dark:text-slate-100 uppercase tracking-widest">
                Parámetros de Fase
              </h2>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold">Gestión Académica</p>
            </div>
          </div>
          <button
            onClick={onOpenAdminModal}
            title="Gestión de Personal y Feriados"
            className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 uppercase tracking-wider hover:bg-indigo-50 dark:hover:bg-indigo-950/60 px-2 py-1 rounded-sm transition-colors cursor-pointer"
          >
            Config
          </button>
        </div>

        {/* Phase Limit Card from Stitch Design */}
        <div className="bg-indigo-50/70 dark:bg-slate-800/80 p-3 rounded-md mt-3 border border-indigo-100 dark:border-slate-700/80 border-dashed">
          <div className="flex justify-between items-center mb-1">
            <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Límite Fase</span>
            <span className="font-mono text-xs font-bold text-indigo-700 dark:text-indigo-300">100 Días</span>
          </div>
          <div className="w-full bg-slate-200 dark:bg-slate-900 rounded-full h-1.5 overflow-hidden">
            <div className="bg-indigo-600 dark:bg-indigo-400 h-full rounded-full transition-all duration-300" style={{ width: totalCiclosCount > 0 ? `${Math.min(totalCiclosCount * 20, 100)}%` : '20%' }}></div>
          </div>
          <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-2 flex items-center gap-1 font-medium">
            <Workflow className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
            <span>Marco de Trazabilidad UNEFCO</span>
          </p>
        </div>
      </div>

      <div className="p-5 space-y-6 flex-1">
        {/* Mode Selector Toggle */}
        <div className="space-y-1.5">
          <label className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-widest block">
            Modo de Programación
          </label>
          <div className="bg-slate-200 dark:bg-slate-800 p-1 rounded-sm flex gap-1">
            <button
              type="button"
              onClick={() => onToggleModo('automatico')}
              className={`flex-1 py-1.5 px-2 rounded-sm text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                modo === 'automatico'
                  ? 'bg-white dark:bg-slate-900 text-indigo-700 dark:text-indigo-400 border-l-2 border-indigo-600 dark:border-indigo-500 shadow-2xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <Zap className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
              <span>Auto</span>
            </button>
            <button
              type="button"
              onClick={() => onToggleModo('manual')}
              className={`flex-1 py-1.5 px-2 rounded-sm text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                modo === 'manual'
                  ? 'bg-white dark:bg-slate-900 text-indigo-700 dark:text-indigo-400 border-l-2 border-indigo-600 dark:border-indigo-500 shadow-2xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <Edit3 className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
              <span>Manual</span>
            </button>
          </div>
        </div>

        {/* Section 1: Personal (Docente & Coordinador/Técnico) */}
        <div className="space-y-3 bg-white dark:bg-slate-900 p-4 border border-slate-200 dark:border-slate-800 shadow-2xs">
          <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest border-b border-slate-100 dark:border-slate-800 pb-2">
            <User className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
            <span>Personal Asignado</span>
          </div>

          {/* Docente / Facilitador */}
          <div>
            <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">
              Docente / Facilitador <span className="text-red-500">*</span>
            </label>
            <div className="flex gap-1.5 w-full">
              <select
                value={currentGrado}
                onChange={handleGradoSelectChange}
                className="w-20 shrink-0 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:border-indigo-600 dark:focus:border-indigo-500 rounded-sm px-1.5 py-1.5 text-xs font-bold text-indigo-700 dark:text-indigo-300 focus:outline-none transition-colors cursor-pointer"
                title="Grado Académico"
              >
                {GRADOS_ACADEMICOS.map((g) => (
                  <option key={g} value={g} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">
                    {g}
                  </option>
                ))}
                <option value="" className="bg-white dark:bg-slate-900 text-slate-500 dark:text-slate-400">
                  (Sin)
                </option>
              </select>
              <input
                type="text"
                placeholder="Ej: Juan Carlos Calle"
                value={currentNombre}
                onChange={handleNombreInputChange}
                className="flex-1 min-w-0 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:border-indigo-600 dark:focus:border-indigo-500 focus:bg-white dark:focus:bg-slate-900 rounded-sm px-2.5 py-1.5 text-xs text-slate-900 dark:text-slate-100 font-semibold focus:outline-none transition-colors"
              />
            </div>
            {/* Quick select from saved docentes */}
            {savedDocentes.length > 0 && (
              <div className="mt-1.5 flex flex-wrap gap-1">
                {savedDocentes.slice(0, 4).map((doc, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => onChangeFacilitador(doc)}
                    className="text-[10px] bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950 hover:text-indigo-700 dark:hover:text-indigo-300 text-slate-600 dark:text-slate-300 px-2 py-0.5 rounded-2xs font-bold uppercase transition-colors cursor-pointer truncate max-w-[110px]"
                    title={doc}
                  >
                    {doc}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Técnico de Seguimiento / Coordinadores */}
          <div>
            <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">
              Técnico de Seguimiento
            </label>
            <select
              value={tecnico}
              onChange={e => onChangeTecnico(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:border-indigo-600 dark:focus:border-indigo-500 rounded-sm px-2.5 py-1.5 text-xs text-slate-900 dark:text-slate-100 font-semibold focus:outline-none transition-colors cursor-pointer"
            >
              {savedCoordinadores.map((coord, idx) => (
                <option key={idx} value={coord} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">
                  {coord}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Section 2: Matrix of Assignments (Slots) */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-widest">
              Ciclos Formativos ({totalCiclosCount}/5)
            </span>
            <span className="text-[10px] font-bold text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/80 border border-indigo-200 dark:border-indigo-800 px-2 py-0.5 rounded-2xs">
              MÁX 5
            </span>
          </div>

          {/* Matrix Rows */}
          <div className="space-y-2.5">
            {matrixRows.map((row, rowIdx) => {
              return (
                <div
                  key={row.id}
                  className="bg-white dark:bg-slate-900 border-l-4 border-l-indigo-600 dark:border-l-indigo-500 border-y border-r border-slate-200 dark:border-slate-800 p-3 space-y-2 shadow-2xs"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] font-bold text-indigo-700 dark:text-indigo-400 uppercase tracking-wider">
                      Asignación #{rowIdx + 1}
                    </span>
                    <button
                      type="button"
                      onClick={() => onRemoveMatrixRow(row.id)}
                      className="text-slate-400 hover:text-red-600 dark:hover:text-red-400 p-1 transition-colors cursor-pointer"
                      title="Eliminar asignación"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Cycle Select */}
                  <select
                    value={row.cicloIndex}
                    onChange={e => {
                      const idx = parseInt(e.target.value, 10);
                      onUpdateMatrixRow(row.id, 'cicloIndex', idx);
                      const newOferta = OFERTA_FORMATIVA_UNEFCO_2026[idx];
                      if (row.lugar === 'SEDE CENTRAL - LA PAZ' || row.lugar === 'SEDE VIACHA' || row.lugar === 'Sede Central - La Paz' || row.lugar === 'Sede Viacha' || !row.lugar) {
                        const sug = newOferta.cat === 'TACFI' ? 'SEDE CENTRAL - LA PAZ' : 'SEDE VIACHA';
                        onUpdateMatrixRow(row.id, 'lugar', sug);
                      }
                    }}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-sm px-2 py-1.5 text-xs text-slate-900 dark:text-slate-100 font-semibold focus:outline-none focus:border-indigo-600 dark:focus:border-indigo-500 cursor-pointer"
                  >
                    {OFERTA_FORMATIVA_UNEFCO_2026.map((c, idx) => (
                      <option key={c.id} value={idx} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">
                        {c.id} | {c.cat === 'TACFI' ? '30d Est.' : '15d Prof.'} - {c.nombre}
                      </option>
                    ))}
                  </select>

                  {/* Location & Modality */}
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <label className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase block mb-0.5">
                        Lugar
                      </label>
                      <input
                        type="text"
                        placeholder="EJ: SEDE LA PAZ"
                        value={row.lugar}
                        onChange={e => onUpdateMatrixRow(row.id, 'lugar', e.target.value.toUpperCase())}
                        className="w-full uppercase bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-sm px-2 py-1 text-xs text-slate-900 dark:text-slate-100 font-medium focus:outline-none focus:border-indigo-600 dark:focus:border-indigo-500 font-mono"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase block mb-0.5">
                        Modalidad
                      </label>
                      <select
                        value={row.modalidad}
                        onChange={e =>
                          onUpdateMatrixRow(row.id, 'modalidad', e.target.value as Modalidad)
                        }
                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-sm px-2 py-1 text-xs text-slate-900 dark:text-slate-100 font-semibold focus:outline-none focus:border-indigo-600 dark:focus:border-indigo-500 cursor-pointer"
                      >
                        <option value="Presencial" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">Presencial</option>
                        <option value="Semipresencial" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">Semipresencial</option>
                        <option value="Virtual" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">Virtual</option>
                      </select>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Add Row Button */}
          {totalCiclosCount < 5 && (
            <button
              type="button"
              onClick={onAddMatrixRow}
              className="w-full py-2 border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-indigo-500 hover:bg-indigo-50/50 dark:hover:bg-indigo-950/40 text-indigo-700 dark:text-indigo-400 text-xs font-bold uppercase tracking-wider rounded-sm flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Añadir Ciclo Formativo</span>
            </button>
          )}
        </div>

        {/* Section 3: Contract Start Date */}
        <div className="bg-white dark:bg-slate-900 p-4 border border-slate-200 dark:border-slate-800 shadow-2xs space-y-2">
          <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest pb-1 border-b border-slate-100 dark:border-slate-800">
            <Calendar className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
            <span>Inicio de Contrato</span>
          </div>

          <DatePickerPopup
            selectedDate={selectedDate}
            onSelectDate={onSelectDate}
            feriadosCustom={feriadosCustom}
          />
          <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">
            Ventana máxima fija: 100 días calendario.
          </p>
        </div>

        {/* Error / Warning Alert */}
        {errorMessage && (
          <div className="bg-red-50 dark:bg-red-950/50 border-l-4 border-red-600 text-red-800 dark:text-red-300 p-3 text-xs space-y-1">
            <div className="flex items-center gap-1.5 font-bold uppercase text-[10px] tracking-wider">
              <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
              <span>Restricción Detectada</span>
            </div>
            <p className="text-[11px] leading-relaxed">{errorMessage}</p>
          </div>
        )}

        {warnings.length > 0 && (
          <div className="bg-amber-50 dark:bg-amber-950/50 border-l-4 border-amber-500 text-amber-900 dark:text-amber-200 p-3 text-xs space-y-1">
            <div className="flex items-center gap-1.5 font-bold uppercase text-[10px] tracking-wider">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>Observaciones Modo Manual</span>
            </div>
            <ul className="list-disc list-inside text-[10px] space-y-0.5">
              {warnings.map((w, idx) => (
                <li key={idx}>{w}</li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Sidebar Footer */}
      <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 mt-auto space-y-2">
        <button
          type="button"
          onClick={onGenerar}
          disabled={!isValid || isGenerating}
          className="w-full bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-600 dark:hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold text-xs uppercase tracking-widest py-3 px-4 rounded-sm transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-xs"
        >
          {isGenerating ? (
            <span>Calculando...</span>
          ) : (
            <>
              <CalendarDays className="w-4 h-4 text-emerald-400" />
              <span>Generar Cronograma</span>
            </>
          )}
        </button>

        {onClearAll && (
          <button
            type="button"
            onClick={onClearAll}
            title="Limpiar campos y reiniciar programación"
            className="w-full bg-slate-100 dark:bg-slate-800 hover:bg-red-50 dark:hover:bg-red-950/40 text-slate-700 dark:text-slate-300 hover:text-red-600 dark:hover:text-red-400 border border-slate-200 dark:border-slate-700 hover:border-red-300 dark:hover:border-red-800 font-bold text-xs uppercase tracking-wider py-2 px-3 rounded-sm transition-colors flex items-center justify-center gap-2 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Limpiar / Reiniciar</span>
          </button>
        )}
      </div>
    </aside>
  );
};

