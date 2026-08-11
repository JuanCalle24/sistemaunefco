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
  fechaInicioCurso1?: Date | null;
  onSelectFechaInicioCurso1?: (d: Date) => void;
  holguraDias?: number;
  onChangeHolguraDias?: (h: number) => void;
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
  fechaInicioCurso1,
  onSelectFechaInicioCurso1,
  holguraDias = 0,
  onChangeHolguraDias,
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
    const combined = newGrado ? `${newGrado} ${currentNombre}` : currentNombre;
    onChangeFacilitador(combined);
  };

  const handleNombreInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value.toUpperCase();
    const combined = currentGrado ? `${currentGrado} ${rawValue}` : rawValue;
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
        <div className="bg-white dark:bg-[#252628] p-5 rounded-xl border border-zinc-200 dark:border-[#333438] space-y-4 shadow-2xs">
          <div className="flex items-center justify-between border-b border-zinc-200 dark:border-[#333438] pb-3">
            <div className="flex items-center gap-2 text-xs font-bold text-zinc-800 dark:text-zinc-200 uppercase tracking-wider">
              <User className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>Personal Asignado</span>
            </div>
            {cleanCi && (
              <span className="text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-800 font-mono">
                CI Registrada
              </span>
            )}
          </div>

          {/* Facilitador */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300 block">
              Docente / Facilitador <span className="text-emerald-600 dark:text-emerald-400">*</span>
            </label>
            <div className="flex gap-2">
              <select
                value={currentGrado}
                onChange={handleGradoSelectChange}
                className="w-28 shrink-0 bg-zinc-50 dark:bg-[#1e1f21] border border-zinc-300 dark:border-[#3e3f44] hover:border-zinc-400 dark:hover:border-zinc-500 rounded-lg px-2.5 py-2.5 text-xs font-bold text-zinc-800 dark:text-zinc-200 focus:outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20 transition-all cursor-pointer"
              >
                {Array.from(new Set(GRADOS_ACADEMICOS.map(g => g.toUpperCase()))).map(g => (
                  <option key={g} value={g}>{g}</option>
                ))}
                <option value="">(SIN GRADO)</option>
              </select>
              <input
                type="text"
                autoComplete="off"
                placeholder="Nombre Completo..."
                value={currentNombre}
                onChange={handleNombreInputChange}
                className="flex-1 bg-zinc-50 dark:bg-[#1e1f21] border border-zinc-300 dark:border-[#3e3f44] hover:border-zinc-400 dark:hover:border-zinc-500 rounded-lg px-3.5 py-2.5 text-sm font-medium text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20 transition-all"
              />
            </div>
          </div>

          {/* Cédula de Identidad (CI) */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300 block">
              Cédula de Identidad (CI) <span className="text-emerald-600 dark:text-emerald-400">*</span>
            </label>
            <div className="relative flex items-center">
              <CreditCard className="w-4 h-4 absolute left-3.5 text-zinc-400 pointer-events-none" />
              <input
                type="text"
                autoComplete="off"
                inputMode="numeric"
                pattern="[0-9]*"
                required
                placeholder="Ingrese C.I. numérico..."
                value={ci}
                onChange={(e) => onChangeCi(e.target.value.replace(/[^0-9]/g, ''))}
                className="w-full pl-10 pr-3.5 py-2.5 bg-zinc-50 dark:bg-[#1e1f21] border border-zinc-300 dark:border-[#3e3f44] hover:border-zinc-400 dark:hover:border-zinc-500 rounded-lg text-sm font-mono font-medium text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20 transition-all"
              />
            </div>
            <p className="text-[10px] text-zinc-400 mt-1 font-medium">
              * Exclusivamente dígitos numéricos.
            </p>

            {/* Active Phase Progress Display for CI */}
            {cleanCi && (
              <div className="mt-2 p-2.5 bg-zinc-50 dark:bg-[#1e1f21] border border-zinc-200 dark:border-[#333438] rounded-lg flex items-center justify-between text-xs">
                <span className="text-zinc-600 dark:text-zinc-400 font-medium flex items-center gap-1.5">
                  <Workflow className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span>Historial CI {cleanCi}:</span>
                </span>
                <span className="font-mono text-emerald-900 dark:text-emerald-200 font-bold bg-emerald-100 dark:bg-emerald-950 px-2 py-0.5 rounded text-[11px]">
                  {activeRecordsForCi.length} Cronograma(s)
                </span>
              </div>
            )}
          </div>

          {/* Técnico */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300 block">
              Técnico de Seguimiento
            </label>
            <div className="relative flex items-center">
              <input
                type="text"
                readOnly
                value={currentUser?.displayName || tecnico || 'Sin Asignar'}
                className="w-full bg-zinc-100 dark:bg-[#1e1f21] border border-zinc-200 dark:border-[#333438] rounded-lg pl-3.5 pr-8 py-2.5 text-sm font-bold text-zinc-700 dark:text-zinc-300 select-none cursor-default uppercase"
              />
              <div className="absolute right-3 text-emerald-600 dark:text-emerald-400" title="Usuario Autenticado">
                <ShieldCheck className="w-4 h-4" />
              </div>
            </div>
          </div>
        </div>

        {/* Section 2: Fecha de Inicio & Modo */}
        <div className="bg-white dark:bg-[#252628] p-5 rounded-xl border border-zinc-200 dark:border-[#333438] space-y-4 shadow-2xs">
          <div className="flex items-center gap-2 text-xs font-bold text-zinc-800 dark:text-zinc-200 uppercase tracking-wider border-b border-zinc-200 dark:border-[#333438] pb-3">
            <Calendar className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>Fecha de Contrato & Modo</span>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300 block">
              Modo de Cálculo
            </label>
            <div className="bg-zinc-100 dark:bg-[#1e1f21] p-1 rounded-lg flex gap-1 border border-zinc-200 dark:border-[#333438]">
              <button
                type="button"
                onClick={() => onToggleModo('automatico')}
                className={`flex-1 py-2 px-2 rounded-md text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  modo === 'automatico'
                    ? 'bg-emerald-600 text-white shadow-2xs'
                    : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100'
                }`}
              >
                <Zap className="w-3.5 h-3.5" />
                <span>Automático</span>
              </button>
              <button
                type="button"
                onClick={() => onToggleModo('manual')}
                className={`flex-1 py-2 px-2 rounded-md text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  modo === 'manual'
                    ? 'bg-emerald-600 text-white shadow-2xs'
                    : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100'
                }`}
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Manual</span>
              </button>
            </div>
          </div>

          {/* Contract Start & Course 1 Start Dates */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300 block flex items-center gap-1.5">
                <CalendarDays className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>Inicio de Contrato</span>
              </label>
              <DatePickerPopup
                selectedDate={selectedDate}
                onSelectDate={onSelectDate}
                feriadosCustom={feriadosCustom}
                title="INICIO DE CONTRATO"
                subtitle="Define el margen límite de 100 días"
              />
              <p className="text-[10px] text-zinc-400 font-medium">
                Límite de 100 días calendario.
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-emerald-700 dark:text-emerald-400 block flex items-center gap-1.5">
                <CalendarCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>Inicio Curso 1 (Ciclo 1)</span>
              </label>
              <DatePickerPopup
                selectedDate={fechaInicioCurso1 || selectedDate}
                onSelectDate={(d) => onSelectFechaInicioCurso1 && onSelectFechaInicioCurso1(d)}
                feriadosCustom={feriadosCustom}
                minDate={selectedDate}
                title="INICIO CURSO 1 / CICLO 1"
                subtitle="Escalona el inicio de los siguientes cursos"
                buttonClassName="w-full bg-emerald-50/80 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800/80 hover:border-emerald-600 rounded-lg px-3.5 py-2.5 text-sm cursor-pointer flex items-center justify-between shadow-2xs transition-all group focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              />
              <p className="text-[10px] text-emerald-700 dark:text-emerald-400 font-bold">
                Define el arranque del Curso 1.
              </p>
            </div>
          </div>

          {/* Scheduling Density Regulator (Modo Automático) */}
          {modo === 'automatico' && (
            <div className="space-y-2 pt-2 border-t border-zinc-200 dark:border-[#333438]">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-zinc-800 dark:text-zinc-200 flex items-center gap-1.5 uppercase tracking-wider">
                  <Sliders className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span>Regulador de Holgura (Ritmo)</span>
                </label>
                <span className="text-xs font-mono font-bold text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-800">
                  {holguraDias === 0
                    ? 'Ajustado (0 días de descanso)'
                    : `+${holguraDias} día(s) de holgura entre cursos`}
                </span>
              </div>

              {/* Range Input Slider */}
              <input
                type="range"
                min={0}
                max={10}
                step={1}
                value={holguraDias}
                onChange={(e) => onChangeHolguraDias && onChangeHolguraDias(Number(e.target.value))}
                className="w-full h-1.5 bg-zinc-200 dark:bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-emerald-600"
              />

              {/* Stagger Presets Buttons */}
              <div className="flex gap-1.5 pt-1">
                <button
                  type="button"
                  onClick={() => onChangeHolguraDias && onChangeHolguraDias(0)}
                  className={`flex-1 py-1.5 px-2 rounded-md text-[11px] font-bold transition-all cursor-pointer ${
                    holguraDias === 0
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'bg-zinc-100 dark:bg-[#2d2e32] text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-[#38393e]'
                  }`}
                >
                  ⚡ Ajustado (5 Ciclos)
                </button>

                <button
                  type="button"
                  onClick={() => onChangeHolguraDias && onChangeHolguraDias(3)}
                  className={`flex-1 py-1.5 px-2 rounded-md text-[11px] font-bold transition-all cursor-pointer ${
                    holguraDias === 3
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'bg-zinc-100 dark:bg-[#2d2e32] text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-[#38393e]'
                  }`}
                >
                  ⚖️ Medio (3 Ciclos)
                </button>

                <button
                  type="button"
                  onClick={() => onChangeHolguraDias && onChangeHolguraDias(7)}
                  className={`flex-1 py-1.5 px-2 rounded-md text-[11px] font-bold transition-all cursor-pointer ${
                    holguraDias === 7
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'bg-zinc-100 dark:bg-[#2d2e32] text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-[#38393e]'
                  }`}
                >
                  ☕ Holgado (2 Ciclos)
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Section 3: Ciclos Formativos Matrix */}
      <div className="bg-white dark:bg-[#252628] p-5 rounded-xl border border-zinc-200 dark:border-[#333438] space-y-4 shadow-2xs">
        <div className="flex items-center justify-between border-b border-zinc-200 dark:border-[#333438] pb-3">
          <div className="flex items-center gap-2 text-xs font-bold text-zinc-800 dark:text-zinc-200 uppercase tracking-wider">
            <BookOpen className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>Ciclos Formativos ({totalCiclosCount}/5)</span>
          </div>
          <span className="text-[10px] bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-800 font-mono font-bold">
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
                    <label className="text-[11px] text-zinc-500 dark:text-zinc-400 font-bold block uppercase tracking-wider">
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
                      className="w-full bg-white dark:bg-[#252628] border border-zinc-300 dark:border-[#3e3f44] hover:border-zinc-400 rounded-lg px-3.5 py-2 text-xs font-bold text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20 transition-all cursor-pointer"
                    >
                      {OFERTA_FORMATIVA_UNEFCO_2026.map((c, idx) => (
                        <option key={c.id} value={idx}>
                          {c.id} | {c.cat === 'TACFI' ? '30d Est.' : '15d Prof.'} - {c.nombre}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] text-zinc-500 dark:text-zinc-400 font-bold block uppercase tracking-wider">
                      Lugar / Sede
                    </label>
                    <input
                      type="text"
                      value={row.lugar}
                      onChange={e => onUpdateMatrixRow(row.id, 'lugar', e.target.value.toUpperCase())}
                      className="w-full bg-white dark:bg-[#252628] border border-zinc-300 dark:border-[#3e3f44] hover:border-zinc-400 rounded-lg px-3.5 py-2 text-xs font-mono font-bold text-zinc-900 dark:text-zinc-100 uppercase focus:outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20 transition-all"
                    />
                  </div>
                </div>

                {/* Optional Exceptional Course Selector */}
                <div className="pt-2 border-t border-zinc-200 dark:border-[#2d2e32] flex flex-wrap items-center justify-between gap-2">
                  <label className="flex items-center gap-2 text-xs text-zinc-600 dark:text-zinc-400 cursor-pointer select-none font-medium">
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
                      className="rounded text-emerald-600 focus:ring-emerald-600 h-3.5 w-3.5 cursor-pointer accent-emerald-600"
                    />
                    <span>Asignar solo 1 curso individual (Caso Excepcional)</span>
                  </label>

                  {row.isExceptional && selectedCicloObj && (
                    <div className="flex items-center gap-2">
                      <select
                        value={row.selectedCursoIndex ?? 0}
                        onChange={e => onUpdateMatrixRow(row.id, 'selectedCursoIndex', parseInt(e.target.value, 10))}
                        className="bg-white dark:bg-[#252628] border border-zinc-300 dark:border-[#3e3f44] hover:border-emerald-500 rounded-lg px-2.5 py-1 text-xs font-bold text-zinc-800 dark:text-zinc-200 focus:outline-none focus:border-emerald-600"
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
              className="w-full py-2.5 border-2 border-dashed border-emerald-300 dark:border-emerald-800/80 hover:bg-emerald-50/50 dark:hover:bg-emerald-950/30 text-emerald-800 dark:text-emerald-300 text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>Añadir Asignación de Ciclo</span>
            </button>
          )}
        </div>
      </div>

      {/* Error & Warnings display */}
      {errorMessage && (
        <div className="bg-red-50 dark:bg-red-950/40 border-2 border-red-300 dark:border-red-800 text-red-800 dark:text-red-200 p-4 rounded-xl text-xs space-y-1 shadow-sm">
          <div className="flex items-center gap-2 font-bold uppercase tracking-wider text-red-700 dark:text-red-300">
            <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400 shrink-0" />
            <span>Restricción Crítica de Programación Detectada</span>
          </div>
          <p className="font-medium leading-relaxed pl-7">{errorMessage}</p>
        </div>
      )}

      {warnings && warnings.length > 0 && !errorMessage && (
        <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-200 p-3.5 rounded-xl text-xs space-y-1">
          <div className="flex items-center gap-2 font-bold uppercase tracking-wider text-amber-800 dark:text-amber-300">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>Advertencias de Configuración Manual ({warnings.length})</span>
          </div>
          <ul className="list-disc list-inside space-y-0.5 text-[11px] font-medium pl-2">
            {warnings.map((w, idx) => (
              <li key={idx}>{w}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Main Generate Action Button */}
      <div className="flex items-center justify-between gap-3 pt-2">
        {onClearAll && (
          <button
            type="button"
            onClick={onClearAll}
            className="bg-zinc-100 dark:bg-[#252628] hover:bg-zinc-200 dark:hover:bg-[#2d2e32] text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-[#333438] px-4 py-3 rounded-lg font-bold text-xs transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reiniciar</span>
          </button>
        )}

        <button
          type="button"
          onClick={onGenerar}
          disabled={!isValid || isGenerating}
          className="flex-1 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 disabled:opacity-50 text-white font-bold text-xs uppercase tracking-wider py-3.5 px-5 rounded-lg shadow-sm hover:shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
        >
          {isGenerating ? (
            <span>Procesando Guardado...</span>
          ) : modo === 'manual' ? (
            <>
              <CheckCircle2 className="w-4 h-4 text-white" />
              <span>Confirmar y Guardar Programación Manual</span>
            </>
          ) : (
            <>
              <CalendarCheck className="w-4 h-4 text-white" />
              <span>Generar y Guardar Cronograma de Ejecución</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
