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
  onUpdateMatrixRow: (id: string, field: keyof MatrixRowItem, value: any) => void;
  
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

  // Compute active phase for the entered CI
  const cleanCi = (ci || '').trim();
  
  const activeRecordsForCi = history.filter(h => {
    if (h.estado === 'ANULADO') return false;
    const itemCi = (h.ci || '').trim();
    return itemCi === cleanCi && Boolean(cleanCi);
  });

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-300">
      {/* Title & Description Banner */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold shadow-xs">
            <Sliders className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider font-display">
              Configuración de Programación Académica 2026
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              Ingrese los datos requeridos para calcular el cronograma secuencial sin superposiciones.
            </p>
          </div>
        </div>
      </div>

      {/* Main Grid Layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Section 1: Personal Asignado */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider font-display">
              <User className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <span>Personal Asignado</span>
            </div>
            {cleanCi && (
              <span className="text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 px-2 py-0.5 rounded-lg border border-emerald-200 dark:border-emerald-800 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                <span>CI Registrada</span>
              </span>
            )}
          </div>

          {/* Facilitador */}
          <div>
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
              Docente / Facilitador <span className="text-red-500">*</span>
            </label>
            <div className="flex gap-2">
              <select
                value={currentGrado}
                onChange={handleGradoSelectChange}
                className="w-24 shrink-0 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-2 py-2 text-xs font-bold text-indigo-700 dark:text-indigo-300 focus:outline-none focus:border-indigo-600 dark:focus:border-indigo-500 cursor-pointer"
              >
                {GRADOS_ACADEMICOS.map(g => (
                  <option key={g} value={g} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">{g}</option>
                ))}
                <option value="" className="bg-white dark:bg-slate-900 text-slate-500">(Sin Grado)</option>
              </select>
              <input
                type="text"
                placeholder="Nombre Completo..."
                value={currentNombre}
                onChange={handleNombreInputChange}
                className="flex-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-slate-100 font-semibold focus:outline-none focus:border-indigo-600 dark:focus:border-indigo-500"
              />
            </div>

            {/* Quick list */}
            {savedDocentes.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1">
                {savedDocentes.slice(0, 4).map((doc, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => onChangeFacilitador(doc)}
                    className="text-[10px] bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950 text-slate-600 dark:text-slate-300 px-2 py-1 rounded-lg font-bold uppercase transition-colors cursor-pointer truncate max-w-[130px]"
                  >
                    {doc}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Cédula de Identidad (CI) */}
          <div>
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
              Cédula de Identidad (CI) <span className="text-red-500">*</span>
            </label>
            <div className="relative flex items-center">
              <CreditCard className="w-4 h-4 absolute left-3 text-slate-400 pointer-events-none" />
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                required
                placeholder="Ej: 6849201"
                value={ci}
                onChange={(e) => onChangeCi(e.target.value.replace(/[^0-9]/g, ''))}
                className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono font-bold text-slate-900 dark:text-slate-100 focus:outline-none focus:border-indigo-600"
              />
            </div>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1.5 leading-tight">
              * Obligatorio. Ingrese exclusivamente dígitos numéricos (sin letras, guiones ni extensión departamental).
            </p>

            {/* Active Phase Progress Display for CI */}
            {cleanCi && (
              <div className="mt-2 p-2.5 bg-indigo-50/60 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800/60 rounded-xl flex items-center justify-between text-[11px]">
                <span className="font-semibold text-indigo-950 dark:text-indigo-200 flex items-center gap-1.5">
                  <Workflow className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                  <span>Historial para CI <strong>{cleanCi}</strong>:</span>
                </span>
                <span className="font-bold text-indigo-700 dark:text-indigo-300 bg-white dark:bg-slate-900 px-2 py-0.5 rounded-md border border-indigo-200 dark:border-indigo-800">
                  {activeRecordsForCi.length} Cronograma(s) Activo(s)
                </span>
              </div>
            )}
          </div>

          {/* Técnico */}
          <div>
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
              Técnico de Seguimiento
            </label>
            <div className="relative flex items-center">
              <input
                type="text"
                readOnly
                value={currentUser?.displayName || tecnico || 'Sin Asignar'}
                className="w-full bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl pl-3 pr-10 py-2 text-xs text-slate-800 dark:text-slate-100 font-bold select-none cursor-default"
              />
              <div className="absolute right-3 text-emerald-600 dark:text-emerald-400 flex items-center gap-1 text-[10px] font-bold" title="Usuario Autenticado">
                <ShieldCheck className="w-4 h-4" />
              </div>
            </div>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1.5 font-medium flex items-center gap-1">
              <Lock className="w-3 h-3 text-slate-400 shrink-0" />
              <span>Asignado automáticamente al usuario en sesión.</span>
            </p>
          </div>
        </div>

        {/* Section 2: Fecha de Inicio & Modo */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-4">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider border-b border-slate-100 dark:border-slate-800 pb-3 font-display">
            <Calendar className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <span>Fecha de Contrato & Modo</span>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
              Modo de Cálculo
            </label>
            <div className="bg-slate-100 dark:bg-slate-800 p-1 rounded-xl flex gap-1">
              <button
                type="button"
                onClick={() => onToggleModo('automatico')}
                className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  modo === 'automatico'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
                }`}
              >
                <Zap className="w-3.5 h-3.5 text-emerald-300" />
                <span>Automático</span>
              </button>
              <button
                type="button"
                onClick={() => onToggleModo('manual')}
                className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  modo === 'manual'
                    ? 'bg-amber-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
                }`}
              >
                <Edit3 className="w-3.5 h-3.5 text-amber-200" />
                <span>Manual</span>
              </button>
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
              Inicio de Contrato
            </label>
            <DatePickerPopup
              selectedDate={selectedDate}
              onSelectDate={onSelectDate}
              feriadosCustom={feriadosCustom}
            />
            <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1.5 font-medium">
              Límite estricto: 100 días calendario sin colisiones con feriados.
            </p>
          </div>
        </div>
      </div>

      {/* Section 3: Ciclos Formativos Matrix */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider font-display">
            <BookOpen className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <span>Ciclos Formativos Seleccionados ({totalCiclosCount}/5)</span>
          </div>
          <span className="text-xs font-bold bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 px-2.5 py-1 rounded-lg border border-indigo-200 dark:border-indigo-800">
            MÁXIMO 5 CICLOS
          </span>
        </div>

        <div className="space-y-3">
          {matrixRows.map((row, rowIdx) => {
            const selectedCicloObj = OFERTA_FORMATIVA_UNEFCO_2026[row.cicloIndex];

            return (
              <div
                key={row.id}
                className={`border rounded-xl p-4 space-y-3 transition-colors ${
                  row.isExceptional 
                    ? 'bg-amber-50/40 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800/60'
                    : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
                      Asignación #{rowIdx + 1}
                    </span>
                    {row.isExceptional && (
                      <span className="text-[9px] bg-amber-100 dark:bg-amber-900/80 text-amber-800 dark:text-amber-200 font-extrabold px-2 py-0.5 rounded-md border border-amber-300 dark:border-amber-700 uppercase flex items-center gap-1">
                        <Sparkles className="w-3 h-3 text-amber-600" />
                        Curso Excepcional / Carga Parcial
                      </span>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => onRemoveMatrixRow(row.id)}
                    className="text-slate-400 hover:text-red-600 dark:hover:text-red-400 p-1 transition-colors cursor-pointer"
                    title="Eliminar asignación"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="md:col-span-2">
                    <label className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase block mb-1">
                      Ciclo de Oferta Formativa UNEFCO 2026
                    </label>
                    <select
                      value={row.cicloIndex}
                      onChange={e => {
                        const idx = parseInt(e.target.value, 10);
                        onUpdateMatrixRow(row.id, 'cicloIndex', idx);
                        // Reset course index if cycle changes
                        onUpdateMatrixRow(row.id, 'selectedCursoIndex', null);
                      }}
                      className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 dark:text-slate-100 focus:outline-none focus:border-indigo-600 cursor-pointer"
                    >
                      {OFERTA_FORMATIVA_UNEFCO_2026.map((c, idx) => (
                        <option key={c.id} value={idx}>
                          {c.id} | {c.cat === 'TACFI' ? '30d Est.' : '15d Prof.'} - {c.nombre}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase block mb-1">
                      Lugar / Sede
                    </label>
                    <input
                      type="text"
                      value={row.lugar}
                      onChange={e => onUpdateMatrixRow(row.id, 'lugar', e.target.value.toUpperCase())}
                      className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-mono font-bold text-slate-900 dark:text-slate-100 uppercase focus:outline-none focus:border-indigo-600"
                    />
                  </div>
                </div>

                {/* Optional Exceptional Course Selector */}
                <div className="pt-2 border-t border-slate-200/60 dark:border-slate-700/60 flex flex-wrap items-center justify-between gap-3">
                  <label className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300 font-semibold cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={Boolean(row.isExceptional)}
                      onChange={e => {
                        const checked = e.target.checked;
                        onUpdateMatrixRow(row.id, 'isExceptional', checked);
                        if (!checked) {
                          onUpdateMatrixRow(row.id, 'selectedCursoIndex', null);
                        } else {
                          onUpdateMatrixRow(row.id, 'selectedCursoIndex', 0);
                        }
                      }}
                      className="rounded text-indigo-600 focus:ring-indigo-500 h-4 w-4 cursor-pointer"
                    />
                    <span>Asignar solo 1 curso individual (Caso Excepcional / Adicional)</span>
                  </label>

                  {row.isExceptional && selectedCicloObj && (
                    <div className="w-full sm:w-auto flex items-center gap-2">
                      <label className="text-[10px] text-amber-700 dark:text-amber-300 font-bold uppercase">
                        Módulo Específico:
                      </label>
                      <select
                        value={row.selectedCursoIndex ?? 0}
                        onChange={e => onUpdateMatrixRow(row.id, 'selectedCursoIndex', parseInt(e.target.value, 10))}
                        className="bg-white dark:bg-slate-900 border border-amber-300 dark:border-amber-700 rounded-xl px-2.5 py-1.5 text-xs font-bold text-amber-900 dark:text-amber-100 focus:outline-none focus:ring-2 focus:ring-amber-500 cursor-pointer"
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
              className="w-full py-3 border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-indigo-500 hover:bg-indigo-50/50 dark:hover:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 text-xs font-bold uppercase tracking-wider rounded-xl flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Añadir Asignación de Ciclo Formativo</span>
            </button>
          )}
        </div>
      </div>

      {/* Error & Warnings display */}
      {errorMessage && (
        <div className="bg-red-50 dark:bg-red-950/50 border-l-4 border-red-600 text-red-800 dark:text-red-300 p-4 rounded-r-xl text-xs space-y-1">
          <div className="flex items-center gap-2 font-bold uppercase tracking-wider text-xs">
            <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
            <span>Restricción Detectada</span>
          </div>
          <p className="leading-relaxed">{errorMessage}</p>
        </div>
      )}

      {/* Main Generate Action Button */}
      <div className="flex items-center justify-between gap-4 pt-2">
        {onClearAll && (
          <button
            type="button"
            onClick={onClearAll}
            className="bg-slate-100 dark:bg-slate-800 hover:bg-red-50 dark:hover:bg-red-950/40 text-slate-700 dark:text-slate-300 hover:text-red-600 border border-slate-200 dark:border-slate-700 px-5 py-3 rounded-xl font-bold text-xs uppercase tracking-wider transition-colors flex items-center gap-2 cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Reiniciar Campos</span>
          </button>
        )}

        <button
          type="button"
          onClick={onGenerar}
          disabled={!isValid || isGenerating}
          className="flex-1 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold text-sm uppercase tracking-wider py-3.5 px-6 rounded-xl shadow-lg transition-all flex items-center justify-center gap-2.5 cursor-pointer"
        >
          {isGenerating ? (
            <span>Calculando Itinerario...</span>
          ) : (
            <>
              <CalendarCheck className="w-5 h-5 text-indigo-200" />
              <span>Generar Cronograma de Ejecución</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
