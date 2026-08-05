import React from 'react';
import { SlotAsignacion, CursoProgramado } from '../types';
import { formatDateVisual, formatDateISO } from '../utils/textUtils';
import { getAlertSeverity } from '../utils/alertUtils';
import { DatePickerPopup } from './DatePickerPopup';
import { addDays } from '../utils/scheduler';
import { MapPin, BookOpen, Clock, AlertCircle, CheckCircle2, PlayCircle, Globe, Monitor, ShieldAlert } from 'lucide-react';

interface CicloCardProps {
  slot: SlotAsignacion;
  index: number;
  cursos: CursoProgramado[];
  modo: 'automatico' | 'manual';
  onManualDateChange?: (slotId: string, cursoIndex: number, dateStr: string) => void;
  manualDates?: Record<string, string>; // slotId-cursoIndex -> dateStr
}

const CAT_COLORS: Record<string, string> = {
  TACFI: '#4F46E5', // Indigo
  SEP: '#2563EB', // Blue
  INICIAL: '#059669', // Emerald
  PRIMARIA: '#0284C7', // Sky
  SECUNDARIA: '#7C3AED', // Violet
  ALTERNATIVA: '#DB2777', // Pink
  ESPECIAL: '#0D9488', // Teal
  TECNICO: '#E11D48' // Rose
};

export const CicloCard: React.FC<CicloCardProps> = ({
  slot,
  index,
  cursos,
  modo,
  onManualDateChange,
  manualDates = {}
}) => {
  const catColor = CAT_COLORS[slot.cat] || '#475569';
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);

  return (
    <div className="glass-card border border-white/60 dark:border-slate-800/80 rounded-2xl overflow-hidden shadow-xl">
      {/* Card Header */}
      <div className="px-5 py-4 border-b border-slate-200/60 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/90 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div
            className="w-2.5 h-8 rounded-full inline-block shrink-0 shadow-xs"
            style={{ backgroundColor: catColor }}
          />
          <div>
            <h3 className="text-xs font-black text-slate-900 dark:text-slate-100 uppercase tracking-wider flex items-center gap-2">
              <span className="font-numeric">{slot.cicloId}</span>
              <span className="text-[10px] font-extrabold font-numeric text-[#4648d4] dark:text-[#c0c1ff] bg-[#4648d4]/10 dark:bg-[#4648d4]/20 border border-[#4648d4]/30 px-2.5 py-0.5 rounded-full">
                Asignación #{index + 1}
              </span>
            </h3>
            <p className="text-xs text-slate-700 dark:text-slate-200 font-bold mt-0.5">
              {slot.cicloNombre}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs">
          <div className="flex items-center gap-1.5 bg-white/80 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 px-3 py-1.5 rounded-full font-bold text-slate-700 dark:text-slate-300 shadow-2xs">
            <MapPin className="w-3.5 h-3.5 text-[#4648d4] dark:text-[#c0c1ff]" />
            <span>{slot.lugar}</span>
          </div>

          <div className="flex items-center gap-1.5 bg-white/80 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 px-3 py-1.5 rounded-full font-bold text-slate-700 dark:text-slate-300 shadow-2xs">
            {slot.modalidad === 'Presencial' && <MapPin className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />}
            {slot.modalidad === 'Semipresencial' && <Monitor className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />}
            {slot.modalidad === 'Virtual' && <Globe className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />}
            <span>{slot.modalidad}</span>
          </div>

          <span
            className="px-3 py-1.5 rounded-full text-[10px] font-black font-numeric text-white uppercase tracking-wider shadow-sm"
            style={{ backgroundColor: catColor }}
          >
            {slot.cat === 'TACFI' ? '30 Días / Curso' : '15 Días / Curso'}
          </span>
        </div>
      </div>

      {/* Course List */}
      <div className="divide-y divide-slate-100 dark:divide-slate-800">
        {slot.cursos.map((cursoNombre, cIdx) => {
          const cursoProgramado = cursos.find(c => c.cursoIndex === cIdx);

          let badgeClass = "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700";
          let badgeText = "Programado";
          let badgeIcon = <Clock className="w-3 h-3" />;
          let countdownText = "";

          if (cursoProgramado) {
            const statusInfo = getAlertSeverity(cursoProgramado, hoy);
            badgeClass = statusInfo.badgeClass;
            badgeText = statusInfo.badgeText;
            countdownText = statusInfo.countdownText;

            if (statusInfo.severity === 'critical') {
              badgeIcon = <ShieldAlert className="w-3 h-3 text-rose-600 dark:text-rose-400" />;
            } else if (statusInfo.severity === 'warning') {
              badgeIcon = <AlertCircle className="w-3 h-3 text-amber-600 dark:text-amber-400" />;
            } else if (statusInfo.badgeText === 'En Curso') {
              badgeIcon = <PlayCircle className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />;
            } else if (statusInfo.severity === 'completed') {
              badgeIcon = <CheckCircle2 className="w-3 h-3 text-slate-500 dark:text-slate-400" />;
            } else {
              badgeIcon = <Clock className="w-3 h-3 text-indigo-600 dark:text-indigo-400" />;
            }
          }

          const manualKey = `${slot.id}-${cIdx}`;
          const currentManualVal = manualDates[manualKey] || '';

          // Determine minimum allowed date for manual picker (must be >= end of previous course)
          let minDateForCourse: Date | null = null;
          if (cIdx > 0) {
            const prevCourseProgramado = cursos.find(c => c.cursoIndex === cIdx - 1);
            if (prevCourseProgramado) {
              minDateForCourse = prevCourseProgramado.fin;
            } else {
              const prevKey = `${slot.id}-${cIdx - 1}`;
              const prevVal = manualDates[prevKey];
              if (prevVal) {
                const [py, pm, pd] = prevVal.split('-').map(Number);
                const prevStart = new Date(py, pm - 1, pd, 0, 0, 0, 0);
                minDateForCourse = addDays(prevStart, slot.duracionCurso - 1);
              }
            }
          }

          const selectedDateObj = currentManualVal ? new Date(currentManualVal + 'T00:00:00') : null;

          return (
            <div
              key={cIdx}
              className="p-3.5 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors flex flex-wrap items-center justify-between gap-4 text-xs"
            >
              {/* Course Title */}
              <div className="flex items-center gap-2.5 min-w-[220px] max-w-sm">
                <BookOpen className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
                <div>
                  <span className="font-bold text-slate-900 dark:text-slate-100 uppercase text-[11px] tracking-wider block">
                    Curso {cIdx + 1}
                  </span>
                  <span className="text-slate-700 dark:text-slate-300 font-semibold">{cursoNombre}</span>
                </div>
              </div>

              {/* Date Manual Picker or Automatic Display */}
              {modo === 'manual' ? (
                <div className="flex items-center gap-2 bg-amber-50/90 dark:bg-amber-950/40 p-2 rounded-lg border border-amber-200 dark:border-amber-800/80 min-w-[260px]">
                  <label className="text-[10px] font-bold text-amber-900 dark:text-amber-200 uppercase shrink-0">
                    Inicio C{cIdx + 1}:
                  </label>
                  <DatePickerPopup
                    selectedDate={selectedDateObj}
                    onSelectDate={(d) => {
                      if (onManualDateChange) {
                        onManualDateChange(slot.id, cIdx, formatDateISO(d));
                      }
                    }}
                    minDate={minDateForCourse}
                    title={`Inicio Curso ${cIdx + 1}`}
                    subtitle={minDateForCourse ? `Fecha Mínima: ${formatDateVisual(minDateForCourse, false)}` : "Selecciona fecha hábil (Lun-Sáb)"}
                    placeholder={`Fecha inicio C${cIdx + 1}...`}
                    buttonClassName="w-full bg-white dark:bg-slate-900 border border-amber-300 dark:border-amber-700 hover:border-indigo-600 dark:hover:border-indigo-500 rounded px-2.5 py-1 text-xs font-bold text-slate-900 dark:text-slate-100 cursor-pointer flex items-center justify-between shadow-2xs transition-colors group"
                  />
                </div>
              ) : null}

              {/* Calculated Dates with Stitch Session Grid */}
              {cursoProgramado ? (
                <div className="flex flex-wrap items-center gap-3 text-[11px]">
                  <div className="bg-slate-50 dark:bg-slate-800 p-2 rounded border border-slate-200 dark:border-slate-700/80 min-w-[100px]">
                    <span className="text-[9px] text-slate-400 dark:text-slate-500 block font-bold font-mono uppercase tracking-wider">SESIÓN 1 (Inicio)</span>
                    <span className="font-bold text-slate-900 dark:text-slate-100 font-mono">
                      {formatDateVisual(cursoProgramado.inicio, true)}
                    </span>
                  </div>
                  <div className="hidden sm:block bg-slate-50 dark:bg-slate-800 p-2 rounded border border-slate-200 dark:border-slate-700/80 min-w-[90px]">
                    <span className="text-[9px] text-slate-400 dark:text-slate-500 block font-bold font-mono uppercase tracking-wider">SESIÓN 2</span>
                    <span className="font-medium text-slate-700 dark:text-slate-300 font-mono">
                      {formatDateVisual(cursoProgramado.sesion2, false)}
                    </span>
                  </div>
                  <div className="hidden sm:block bg-slate-50 dark:bg-slate-800 p-2 rounded border border-slate-200 dark:border-slate-700/80 min-w-[90px]">
                    <span className="text-[9px] text-slate-400 dark:text-slate-500 block font-bold font-mono uppercase tracking-wider">SESIÓN 3</span>
                    <span className="font-medium text-slate-700 dark:text-slate-300 font-mono">
                      {formatDateVisual(cursoProgramado.sesion3, false)}
                    </span>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-800 p-2 rounded border border-slate-200 dark:border-slate-700/80 min-w-[100px]">
                    <span className="text-[9px] text-slate-400 dark:text-slate-500 block font-bold font-mono uppercase tracking-wider">Fin Clase</span>
                    <span className="font-bold text-slate-900 dark:text-slate-100 font-mono">
                      {formatDateVisual(cursoProgramado.fin, true)}
                    </span>
                  </div>
                  <div className="hidden md:block bg-amber-50/80 dark:bg-amber-950/40 p-2 rounded border border-amber-200 dark:border-amber-800/80 min-w-[110px]">
                    <span className="text-[9px] text-amber-700 dark:text-amber-400 block font-bold font-mono uppercase tracking-wider">Límite Informe</span>
                    <span className="font-bold text-amber-800 dark:text-amber-300 font-mono">
                      {formatDateVisual(cursoProgramado.informeFinal, false)}
                    </span>
                  </div>
                </div>
              ) : (
                <span className="text-slate-400 dark:text-slate-500 italic font-medium">Fecha pendiente</span>
              )}

              {/* Status Badge & Countdown */}
              <div className="flex flex-col items-end gap-1">
                <span
                  className={`px-2.5 py-1 rounded-2xs border text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 ${badgeClass}`}
                >
                  {badgeIcon}
                  <span>{badgeText}</span>
                </span>
                {countdownText && (
                  <span className="text-[10px] font-bold font-mono text-slate-500 dark:text-slate-400">
                    {countdownText}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

