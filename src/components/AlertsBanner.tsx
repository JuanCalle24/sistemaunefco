import React, { useState } from 'react';
import { CourseAlert } from '../utils/alertUtils';
import { AlertTriangle, Bell, ChevronDown, ChevronUp, CheckCircle, ShieldAlert, Filter } from 'lucide-react';

interface AlertsBannerProps {
  alerts: CourseAlert[];
  onSelectAlertFilter?: () => void;
  onSelectCourse?: (cursoId: string) => void;
  totalEnCursoCount: number;
  totalProximosCount: number;
}

export const AlertsBanner: React.FC<AlertsBannerProps> = ({
  alerts,
  onSelectAlertFilter,
  totalEnCursoCount,
  totalProximosCount,
}) => {
  const [isExpanded, setIsExpanded] = useState(true);

  const criticalCount = alerts.filter(a => a.severity === 'critical').length;
  const warningCount = alerts.filter(a => a.severity === 'warning').length;

  if (alerts.length === 0) {
    return (
      <div className="bg-emerald-50/80 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/80 rounded-lg p-4 flex items-center justify-between shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 rounded-lg shrink-0">
            <CheckCircle className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-emerald-900 dark:text-emerald-200 uppercase tracking-wider font-mono">
              Semaforización al día: Sin alertas críticas
            </h4>
            <p className="text-xs text-emerald-700 dark:text-emerald-400 font-medium">
              Todos los módulos e informes están correctamente agendados. ({totalEnCursoCount} en curso, {totalProximosCount} próximos)
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-200/60 dark:bg-emerald-900/80 text-emerald-800 dark:text-emerald-200 uppercase tracking-wider">
            🟢 Estado Normal
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className={`rounded-xl border transition-all duration-200 shadow-xs ${
      criticalCount > 0 
        ? 'bg-rose-50/90 dark:bg-rose-950/50 border-rose-200 dark:border-rose-900/80' 
        : 'bg-amber-50/90 dark:bg-amber-950/50 border-amber-200 dark:border-amber-900/80'
    }`}>
      {/* Banner Header */}
      <div className="p-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-[240px]">
          <div className={`p-2.5 rounded-xl shrink-0 ${
            criticalCount > 0 
              ? 'bg-rose-600 text-white shadow-md animate-pulse' 
              : 'bg-amber-500 text-white shadow-md'
          }`}>
            {criticalCount > 0 ? <ShieldAlert className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className={`text-xs font-bold uppercase tracking-wider font-mono ${
                criticalCount > 0 ? 'text-rose-950 dark:text-rose-100' : 'text-amber-950 dark:text-amber-100'
              }`}>
                {criticalCount > 0 ? 'Alertas y Fechas Críticas Detectadas' : 'Atención Requerida en Cronograma'}
              </h3>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase font-mono ${
                criticalCount > 0 ? 'bg-rose-600 text-white' : 'bg-amber-500 text-white'
              }`}>
                {alerts.length} {alerts.length === 1 ? 'Alerta' : 'Alertas'}
              </span>
            </div>
            <p className={`text-xs font-semibold mt-0.5 ${
              criticalCount > 0 ? 'text-rose-800 dark:text-rose-300' : 'text-amber-800 dark:text-amber-300'
            }`}>
              {criticalCount > 0 
                ? `Hay ${criticalCount} entregas o inicios inminentes en los próximos 3 días.` 
                : `Hay ${warningCount} eventos próximos que requieren atención durante la semana.`}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {onSelectAlertFilter && (
            <button
              type="button"
              onClick={onSelectAlertFilter}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs ${
                criticalCount > 0
                  ? 'bg-rose-600 hover:bg-rose-700 text-white'
                  : 'bg-amber-600 hover:bg-amber-700 text-white'
              }`}
            >
              <Filter className="w-3.5 h-3.5" />
              <span>Filtrar Alertas</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer"
            title={isExpanded ? "Ocultar detalle" : "Mostrar detalle"}
          >
            {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Expanded Alert List */}
      {isExpanded && (
        <div className="px-4 pb-4 border-t border-black/5 dark:border-white/5 pt-3 space-y-2">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
            {alerts.map((alert) => (
              <div
                key={alert.id}
                className={`p-3 rounded-lg border text-xs flex items-start justify-between gap-3 transition-colors ${
                  alert.severity === 'critical'
                    ? 'bg-white dark:bg-slate-900 border-rose-300 dark:border-rose-800/80 text-rose-950 dark:text-rose-100 shadow-2xs'
                    : 'bg-white dark:bg-slate-900 border-amber-300 dark:border-amber-800/80 text-amber-950 dark:text-amber-100 shadow-2xs'
                }`}
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full shrink-0 ${
                      alert.severity === 'critical' ? 'bg-rose-600 animate-ping' : 'bg-amber-500'
                    }`} />
                    <span className="font-bold uppercase text-[10px] tracking-wider font-mono">
                      {alert.title}
                    </span>
                  </div>
                  <p className="text-slate-700 dark:text-slate-300 font-medium leading-relaxed">
                    {alert.message}
                  </p>
                  <div className="flex items-center gap-2 text-[10px] text-slate-500 dark:text-slate-400 pt-1">
                    <span className="font-semibold">Módulo: {alert.curso.cicloId}</span>
                    <span>•</span>
                    <span className="font-semibold">Lugar: {alert.curso.lugar}</span>
                  </div>
                </div>

                <span className={`px-2.5 py-1 rounded-md text-[10px] font-extrabold font-mono shrink-0 ${
                  alert.severity === 'critical'
                    ? 'bg-rose-100 dark:bg-rose-950/80 text-rose-800 dark:text-rose-200 border border-rose-300 dark:border-rose-800'
                    : 'bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-200 border border-amber-300 dark:border-amber-800'
                }`}>
                  {alert.badgeLabel}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
