import React from 'react';
import { SlotAsignacion, CursoProgramado } from '../types';
import { formatDateVisual } from '../utils/textUtils';
import { Hourglass } from 'lucide-react';

interface TimelineProps {
  slots: SlotAsignacion[];
  asignaciones: CursoProgramado[];
  fechaInicioContrato: Date;
  daysUsed: number;
}

const CAT_COLORS: Record<string, string> = {
  TACFI: '#4F46E5',
  SEP: '#2563EB',
  INICIAL: '#059669',
  PRIMARIA: '#0284C7',
  SECUNDARIA: '#7C3AED',
  ALTERNATIVA: '#DB2777',
  ESPECIAL: '#0D9488',
  TECNICO: '#E11D48'
};

export const Timeline: React.FC<TimelineProps> = ({
  slots,
  asignaciones,
  fechaInicioContrato,
  daysUsed
}) => {
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  const diaHoy = Math.floor((hoy.getTime() - fechaInicioContrato.getTime()) / (1000 * 60 * 60 * 24));

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-md p-5 shadow-2xs">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-5 pb-3 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h2 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider flex items-center gap-2 font-display">
            Línea de Tiempo Operativa (100 Días Fijos)
            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950/80 border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 font-mono">
              {slots.length} Asignaciones
            </span>
          </h2>
          <p className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-tight mt-0.5">
            Distribución secuencial escalonada en el margen de contrato UNEFCO
          </p>
        </div>

        {/* Days indicator */}
        <div className={`flex items-center gap-3 border px-3 py-1.5 rounded-md ${
          daysUsed > 100
            ? 'bg-red-50 dark:bg-red-950/60 border-red-300 dark:border-red-800 text-red-700 dark:text-red-300'
            : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700'
        }`}>
          <Hourglass className={`w-3.5 h-3.5 ${daysUsed > 100 ? 'text-red-600 dark:text-red-400 animate-pulse' : 'text-indigo-600 dark:text-indigo-400'}`} />
          <div className="text-[11px]">
            <span className={`font-bold uppercase tracking-wider ${daysUsed > 100 ? 'text-red-800 dark:text-red-200' : 'text-slate-500 dark:text-slate-400'}`}>Uso: </span>
            <span className={`font-mono font-bold ${daysUsed > 100 ? 'text-red-900 dark:text-red-100 font-extrabold' : 'text-slate-900 dark:text-slate-100'}`}>{daysUsed} / 100 Días</span>
          </div>
          {daysUsed > 100 && (
            <span className="text-[10px] font-extrabold uppercase bg-red-600 text-white px-2 py-0.5 rounded shadow-2xs font-mono">
              ¡EXCEDE 100 DÍAS!
            </span>
          )}
          <div className="w-20 bg-slate-200 dark:bg-slate-700 rounded-full h-2 overflow-hidden ml-1">
            <div
              className={`h-full transition-all ${
                daysUsed > 100 ? 'bg-red-600' : daysUsed > 90 ? 'bg-amber-500' : 'bg-indigo-600 dark:bg-indigo-400'
              }`}
              style={{ width: `${Math.min(daysUsed, 100)}%` }}
            />
          </div>
        </div>
      </div>

      {/* Gantt Container */}
      <div className="overflow-x-auto hide-scrollbar relative">
        <div className="min-w-[700px] space-y-3 py-1">
          {slots.map((slot) => {
            const catColor = CAT_COLORS[slot.cat] || '#4F46E5';
            const cursosCiclo = asignaciones
              .filter(a => a.slotId === slot.id)
              .sort((a, b) => a.cursoIndex - b.cursoIndex);

            let lastEndDay = 0;

            return (
              <div key={slot.id} className="flex items-center gap-3">
                <div className="w-24 shrink-0 text-right pr-2 text-[10px] font-bold font-mono uppercase tracking-wider truncate" style={{ color: catColor }}>
                  {slot.cicloId}
                </div>

                <div className="flex-1 h-8 bg-slate-100 dark:bg-slate-800/80 rounded relative flex overflow-hidden border border-slate-200 dark:border-slate-700 gantt-grid-light dark:gantt-grid-dark">
                  {/* Today Marker if within range */}
                  {diaHoy >= 0 && diaHoy <= 100 && (
                    <div
                      className="absolute top-0 bottom-0 w-0.5 bg-rose-600 z-10 pointer-events-none shadow-[0_0_8px_rgba(225,29,72,0.8)]"
                      style={{ left: `${(diaHoy / 100) * 100}%` }}
                      title="Día Actual"
                    >
                      <div className="w-2 h-2 rounded-full bg-rose-600 -ml-0.75 -mt-0.5" />
                    </div>
                  )}

                  {cursosCiclo.map(c => {
                    const startDay = Math.floor(
                      (c.inicio.getTime() - fechaInicioContrato.getTime()) / (1000 * 60 * 60 * 24)
                    );
                    const duration =
                      Math.floor((c.fin.getTime() - c.inicio.getTime()) / (1000 * 60 * 60 * 24)) + 1;

                    const gapDays = startDay - lastEndDay;
                    lastEndDay = startDay + duration;

                    return (
                      <React.Fragment key={c.cursoIndex}>
                        {gapDays > 0 && (
                          <div style={{ width: `${(gapDays / 100) * 100}%` }} />
                        )}
                        <div
                          className="group relative h-full flex items-center justify-center text-[10px] font-bold font-mono text-white transition-all hover:brightness-110 cursor-pointer rounded-xs"
                          style={{
                            width: `${(duration / 100) * 100}%`,
                            backgroundColor: catColor
                          }}
                        >
                          <span>C{c.cursoIndex + 1}</span>

                          {/* Tooltip */}
                          <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-150 absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 bg-slate-900 text-white text-[10px] rounded shadow-lg pointer-events-none whitespace-nowrap z-30 font-sans">
                            <p className="font-bold text-indigo-300 uppercase">
                              C{c.cursoIndex + 1}: {c.cursoNombre}
                            </p>
                            <p className="text-slate-200 font-mono">
                              {formatDateVisual(c.inicio, false)} — {formatDateVisual(c.fin, false)}
                            </p>
                          </div>
                        </div>
                      </React.Fragment>
                    );
                  })}
                </div>
              </div>
            );
          })}

          {/* Timeline Footer Day Ticks */}
          <div className="flex pt-2 border-t border-slate-100 dark:border-slate-800 text-[9px] font-mono text-slate-400 pl-27">
            <div className="flex-1 flex justify-between">
              <span>Día 1</span>
              <span>Día 20</span>
              <span>Día 40</span>
              <span>Día 60</span>
              <span>Día 80</span>
              <span className="font-bold text-indigo-600 dark:text-indigo-400">Día 100 (LÍMITE)</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

