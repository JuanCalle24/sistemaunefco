import React from 'react';
import { motion } from 'motion/react';
import { 
  User, 
  Plus, 
  Trash2, 
  Calendar, 
  Workflow, 
  Edit3, 
  Zap, 
  CalendarDays, 
  CalendarCheck, 
  RotateCcw,
  AlertTriangle,
  BookOpen,
  Sliders,
  Building2,
  CheckCircle2,
  ShieldCheck,
  Lock,
  CreditCard,
  FileCheck2,
  Sparkles,
  HelpCircle,
  Layers
} from 'lucide-react';
import { OFERTA_FORMATIVA_UNEFCO_2026 } from '../data/ofertaFormativa';
import { DatePickerPopup } from './DatePickerPopup';
import { Modalidad, UserProfile, ProgramacionResultado } from '../types';
import { capitalizeName } from '../utils/textUtils';
import { GRADOS_ACADEMICOS, parseDegreeAndName } from './Sidebar';

export interface MatrixRowItem {
  id: string;
  cicloIndex: number;
  cant: number;
  lugar: string;
  modalidad: Modalidad;
  isExceptional?: boolean;
  selectedCursoIndex?: number | null;
}

interface ProgramarViewProps {
  modo: 'automatico' | 'manual';
  onToggleModo: (modo: 'automatico' | 'manual') => void;
  
  facilitador: string;
  onChangeFacilitador: (v: string) => void;
  savedDocentes: string[];

  ci: string;
  onChangeCi: (v: string) => void;
  ciComplemento?: string;
  onChangeCiComplemento?: (v: string) => void;
  history?: ProgramacionResultado[];
  
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
  onClearAll?: () => void;
  errorMessage?: string | null;
  warnings?: string[];
  currentUser?: UserProfile | null;
}

export const ProgramarView: React.FC<ProgramarViewProps> = ({
  modo,
  onToggleModo,
  facilitador,
  onChangeFacilitador,
  savedDocentes,
  ci = '',
  onChangeCi,
  ciComplemento = '',
  onChangeCiComplemento,
  history = [],
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
  onClearAll,
  errorMessage,
  warnings = [],
  currentUser
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

  const cleanCi = (ci || '').trim();
  
  const activeRecordsForCi = history.filter(h => {
    if (h.estado === 'ANULADO') return false;
    const itemCi = (h.ci || '').trim();
    return itemCi === cleanCi && Boolean(cleanCi);
  });

  return (
    <div className="max-w-5xl mx-auto space-y-5 animate-in fade-in duration-200">
      {/* Title & Description Banner */}
      <div className="bg-white dark:bg-[#252628] p-5 rounded-lg border border-zinc-200 dark:border-[#333438]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded bg-zinc-100 dark:bg-[#2d2e32] text-zinc-700 dark:text-zinc-200 flex items-center justify-center font-bold shrink-0">
            <Sliders className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-zinc-900 dark:text-white tracking-tight">
              Configuración de Programación Académica 2026
            </h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
              Ingrese los datos del facilitador y ciclo para calcular el cronograma secuencial sin colisiones.
            </p>
          </div>
        </div>
      </div>

      {/* Main Grid Layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Section 1: Personal Asignado */}
        <div className="bg-white dark:bg-[#252628] p-5 rounded-lg border border-zinc-200 dark:border-[#333438] space-y-4">
          <div className="flex items-center justify-between border-b border-zinc-200 dark:border-[#333438] pb-3">
            <div className="flex items-center gap-2 text-xs font-semibold text-zinc-800 dark:text-zinc-200 uppercase tracking-wider">
              <User className="w-4 h-4 text-zinc-500" />
              <span>Personal Asignado</span>
            </div>
            {cleanCi && (
              <span className="text-[10px] bg-zinc-100 dark:bg-[#2d2e32] text-zinc-700 dark:text-zinc-300 px-2 py-0.5 rounded border border-zinc-200 dark:border-[#3a3b40] font-mono">
                CI Registrada
              </span>
            )}
          </div>

          {/* Facilitador */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300 block">
              Docente / Facilitador <span className="text-zinc-400">*</span>
            </label>
            <div className="flex gap-2">
              <select
                value={currentGrado}
                onChange={handleGradoSelectChange}
                className="w-24 shrink-0 bg-zinc-50 dark:bg-[#1e1f21] border border-zinc-300 dark:border-[#3e3f44] rounded px-2.5 py-2 text-xs font-semibold text-zinc-800 dark:text-zinc-200 focus:outline-none"
              >
                {GRADOS_ACADEMICOS.map(g => (
                  <option key={g} value={g}>{g}</option>
                ))}
                <option value="">(Sin Grado)</option>
              </select>
              <input
                type="text"
                placeholder="Nombre Completo..."
                value={currentNombre}
                onChange={handleNombreInputChange}
                className="flex-1 bg-zinc-50 dark:bg-[#1e1f21] border border-zinc-300 dark:border-[#3e3f44] rounded px-3 py-2 text-xs font-medium text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none"
              />
            </div>

            {/* Quick list */}
            {savedDocentes.length > 0 && (
              <div className="mt-1.5 flex flex-wrap gap-1">
                {savedDocentes.slice(0, 4).map((doc, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => onChangeFacilitador(doc)}
                    className="text-[10px] bg-zinc-100 dark:bg-[#2d2e32] text-zinc-600 dark:text-zinc-300 px-2 py-0.5 rounded hover:bg-zinc-200 dark:hover:bg-[#38393e] transition-colors cursor-pointer truncate max-w-[140px]"
                  >
                    {doc}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Cédula de Identidad (CI) */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300 block">
              Cédula de Identidad (CI) <span className="text-zinc-400">*</span>
            </label>
            <div className="relative flex items-center">
              <CreditCard className="w-4 h-4 absolute left-3 text-zinc-400 pointer-events-none" />
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                required
                placeholder="Ej: 6849201"
                value={ci}
                onChange={(e) => onChangeCi(e.target.value.replace(/[^0-9]/g, ''))}
                className="w-full pl-9 pr-3 py-2 bg-zinc-50 dark:bg-[#1e1f21] border border-zinc-300 dark:border-[#3e3f44] rounded text-xs font-mono font-medium text-zinc-900 dark:text-zinc-100 focus:outline-none"
              />
            </div>
            <p className="text-[10px] text-zinc-400 mt-1">
              * Exclusivamente dígitos numéricos.
            </p>

            {/* Active Phase Progress Display for CI */}
            {cleanCi && (
              <div className="mt-2 p-2.5 bg-zinc-50 dark:bg-[#1e1f21] border border-zinc-200 dark:border-[#333438] rounded flex items-center justify-between text-xs">
                <span className="text-zinc-600 dark:text-zinc-400 font-medium flex items-center gap-1.5">
                  <Workflow className="w-3.5 h-3.5 text-zinc-500" />
                  <span>Historial CI {cleanCi}:</span>
                </span>
                <span className="font-mono text-zinc-900 dark:text-zinc-100 font-semibold bg-zinc-200 dark:bg-[#2d2e32] px-2 py-0.5 rounded text-[11px]">
                  {activeRecordsForCi.length} Cronograma(s)
                </span>
              </div>
            )}
          </div>

          {/* Técnico */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300 block">
              Técnico de Seguimiento
            </label>
            <div className="relative flex items-center">
              <input
                type="text"
                readOnly
                value={currentUser?.displayName || tecnico || 'Sin Asignar'}
                className="w-full bg-zinc-100 dark:bg-[#1e1f21] border border-zinc-200 dark:border-[#333438] rounded pl-3 pr-8 py-2 text-xs font-medium text-zinc-700 dark:text-zinc-300 select-none cursor-default"
              />
              <div className="absolute right-2.5 text-zinc-400" title="Usuario Autenticado">
                <ShieldCheck className="w-4 h-4" />
              </div>
            </div>
          </div>
        </div>

        {/* Section 2: Fecha de Inicio & Modo */}
        <div className="bg-white dark:bg-[#252628] p-5 rounded-lg border border-zinc-200 dark:border-[#333438] space-y-4">
          <div className="flex items-center gap-2 text-xs font-semibold text-zinc-800 dark:text-zinc-200 uppercase tracking-wider border-b border-zinc-200 dark:border-[#333438] pb-3">
            <Calendar className="w-4 h-4 text-zinc-500" />
            <span>Fecha de Contrato & Modo</span>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300 block">
              Modo de Cálculo
            </label>
            <div className="bg-zinc-100 dark:bg-[#1e1f21] p-1 rounded flex gap-1 border border-zinc-200 dark:border-[#333438]">
              <button
                type="button"
                onClick={() => onToggleModo('automatico')}
                className={`flex-1 py-2 px-2 rounded text-xs font-medium flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                  modo === 'automatico'
                    ? 'bg-white dark:bg-[#2a2b2e] text-zinc-900 dark:text-white shadow-2xs border border-zinc-200 dark:border-[#38393e]'
                    : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100'
                }`}
              >
                <Zap className="w-3.5 h-3.5 text-zinc-500" />
                <span>Automático</span>
              </button>
              <button
                type="button"
                onClick={() => onToggleModo('manual')}
                className={`flex-1 py-2 px-2 rounded text-xs font-medium flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                  modo === 'manual'
                    ? 'bg-white dark:bg-[#2a2b2e] text-zinc-900 dark:text-white shadow-2xs border border-zinc-200 dark:border-[#38393e]'
                    : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100'
                }`}
              >
                <Edit3 className="w-3.5 h-3.5 text-zinc-500" />
                <span>Manual</span>
              </button>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300 block">
              Inicio de Contrato
            </label>
            <DatePickerPopup
              selectedDate={selectedDate}
              onSelectDate={onSelectDate}
              feriadosCustom={feriadosCustom}
            />
            <p className="text-[10px] text-zinc-400 mt-1">
              Límite estricto de 100 días calendario.
            </p>
          </div>
        </div>
      </div>

      {/* Section 3: Ciclos Formativos Matrix */}
      <div className="bg-white dark:bg-[#252628] p-5 rounded-lg border border-zinc-200 dark:border-[#333438] space-y-4">
        <div className="flex items-center justify-between border-b border-zinc-200 dark:border-[#333438] pb-3">
          <div className="flex items-center gap-2 text-xs font-semibold text-zinc-800 dark:text-zinc-200 uppercase tracking-wider">
            <BookOpen className="w-4 h-4 text-zinc-500" />
            <span>Ciclos Formativos ({totalCiclosCount}/5)</span>
          </div>
          <span className="text-[10px] bg-zinc-100 dark:bg-[#2d2e32] text-zinc-600 dark:text-zinc-300 px-2 py-0.5 rounded border border-zinc-200 dark:border-[#3a3b40] font-mono">
            MÁX. 5 CICLOS
          </span>
        </div>

        <div className="space-y-3">
          {matrixRows.map((row, rowIdx) => {
            const selectedCicloObj = OFERTA_FORMATIVA_UNEFCO_2026[row.cicloIndex];

            return (
              <div
                key={row.id}
                className="bg-zinc-50 dark:bg-[#1e1f21] border border-zinc-200 dark:border-[#333438] rounded p-3.5 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-zinc-800 dark:text-zinc-200 uppercase">
                    Asignación #{rowIdx + 1}
                  </span>
                  <button
                    type="button"
                    onClick={() => onRemoveMatrixRow(row.id)}
                    className="text-zinc-400 hover:text-red-500 p-1 transition-colors cursor-pointer"
                    title="Eliminar asignación"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="md:col-span-2 space-y-1">
                    <label className="text-[11px] text-zinc-500 dark:text-zinc-400 font-medium block">
                      Ciclo de Oferta Formativa UNEFCO 2026
                    </label>
                    <select
                      value={row.cicloIndex}
                      onChange={e => {
                        const idx = parseInt(e.target.value, 10);
                        onUpdateMatrixRow(row.id, {
                          cicloIndex: idx,
                          selectedCursoIndex: row.isExceptional ? 0 : null
                        });
                      }}
                      className="w-full bg-white dark:bg-[#252628] border border-zinc-300 dark:border-[#3e3f44] rounded px-3 py-2 text-xs font-medium text-zinc-900 dark:text-zinc-100 focus:outline-none cursor-pointer"
                    >
                      {OFERTA_FORMATIVA_UNEFCO_2026.map((c, idx) => (
                        <option key={c.id} value={idx}>
                          {c.id} | {c.cat === 'TACFI' ? '30d Est.' : '15d Prof.'} - {c.nombre}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] text-zinc-500 dark:text-zinc-400 font-medium block">
                      Lugar / Sede
                    </label>
                    <input
                      type="text"
                      value={row.lugar}
                      onChange={e => onUpdateMatrixRow(row.id, 'lugar', e.target.value.toUpperCase())}
                      className="w-full bg-white dark:bg-[#252628] border border-zinc-300 dark:border-[#3e3f44] rounded px-3 py-2 text-xs font-mono font-medium text-zinc-900 dark:text-zinc-100 uppercase focus:outline-none"
                    />
                  </div>
                </div>

                {/* Optional Exceptional Course Selector */}
                <div className="pt-2 border-t border-zinc-200 dark:border-[#2d2e32] flex flex-wrap items-center justify-between gap-2">
                  <label className="flex items-center gap-2 text-xs text-zinc-600 dark:text-zinc-400 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={Boolean(row.isExceptional)}
                      onChange={e => {
                        const checked = e.target.checked;
                        onUpdateMatrixRow(row.id, {
                          isExceptional: checked,
                          selectedCursoIndex: checked ? 0 : null
                        });
                      }}
                      className="rounded text-zinc-700 focus:ring-zinc-600 h-3.5 w-3.5 cursor-pointer"
                    />
                    <span>Asignar solo 1 curso individual (Caso Excepcional)</span>
                  </label>

                  {row.isExceptional && selectedCicloObj && (
                    <div className="flex items-center gap-2">
                      <select
                        value={row.selectedCursoIndex ?? 0}
                        onChange={e => onUpdateMatrixRow(row.id, 'selectedCursoIndex', parseInt(e.target.value, 10))}
                        className="bg-white dark:bg-[#252628] border border-zinc-300 dark:border-[#3e3f44] rounded px-2.5 py-1 text-xs font-medium text-zinc-800 dark:text-zinc-200 focus:outline-none"
                      >
                        {selectedCicloObj.cursos.map((cName, cIdx) => (
                          <option key={cIdx} value={cIdx}>
                            Curso #{cIdx + 1}: {cName}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {totalCiclosCount < 5 && (
            <button
              type="button"
              onClick={onAddMatrixRow}
              className="w-full py-2.5 border border-dashed border-zinc-300 dark:border-[#3e3f44] hover:bg-zinc-50 dark:hover:bg-[#2d2e32] text-zinc-700 dark:text-zinc-300 text-xs font-medium rounded flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Añadir Asignación de Ciclo</span>
            </button>
          )}
        </div>
      </div>

      {/* Error & Warnings display */}
      {errorMessage && (
        <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 text-red-700 dark:text-red-300 p-3 rounded text-xs">
          <div className="flex items-center gap-1.5 font-semibold mb-1">
            <AlertTriangle className="w-4 h-4 text-red-500 shrink-0" />
            <span>Restricción Detectada</span>
          </div>
          <p>{errorMessage}</p>
        </div>
      )}

      {/* Main Generate Action Button */}
      <div className="flex items-center justify-between gap-3 pt-2">
        {onClearAll && (
          <button
            type="button"
            onClick={onClearAll}
            className="bg-zinc-100 dark:bg-[#252628] hover:bg-zinc-200 dark:hover:bg-[#2d2e32] text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-[#333438] px-4 py-2.5 rounded font-medium text-xs transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reiniciar</span>
          </button>
        )}

        <button
          type="button"
          onClick={onGenerar}
          disabled={!isValid || isGenerating}
          className="flex-1 bg-[#4573d2] hover:bg-[#3866c6] disabled:opacity-50 text-white font-medium text-xs uppercase tracking-wider py-2.5 px-5 rounded transition-colors flex items-center justify-center gap-2 cursor-pointer"
        >
          {isGenerating ? (
            <span>Calculando...</span>
          ) : (
            <>
              <CalendarCheck className="w-4 h-4 text-white" />
              <span>Generar Cronograma de Ejecución</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
