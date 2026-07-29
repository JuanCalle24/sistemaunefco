import React, { useState } from 'react';
import { 
  ProgramacionResultado 
} from '../types';
import { formatDateVisual } from '../utils/textUtils';
import { 
  PlayCircle, 
  Clock, 
  AlertCircle, 
  CheckCircle2, 
  BarChart3, 
  MapPin, 
  BookOpen, 
  Calendar,
  FileCheck2,
  Filter,
  UserCheck
} from 'lucide-react';

interface DashboardMetricsProps {
  resultado: ProgramacionResultado;
  isDarkMode?: boolean;
}

export const DashboardMetrics: React.FC<DashboardMetricsProps> = ({
  resultado,
  isDarkMode
}) => {
  const [filterStatus, setFilterStatus] = useState<'todos' | 'en_curso' | 'proximo' | 'informe_pendiente' | 'finalizado'>('todos');
  
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);

  // Categorize courses
  let countEnCurso = 0;
  let countProximos = 0;
  let countInformesPendientes = 0;
  let countFinalizados = 0;

  const coursesWithStatus = resultado.asignaciones.map(a => {
    let status: 'en_curso' | 'proximo' | 'informe_pendiente' | 'finalizado' = 'proximo';
    
    const diffInforme = Math.floor((hoy.getTime() - a.fin.getTime()) / (1000 * 60 * 60 * 24));

    if (hoy >= a.inicio && hoy <= a.fin) {
      status = 'en_curso';
      countEnCurso++;
    } else if (hoy < a.inicio) {
      status = 'proximo';
      countProximos++;
    } else if (diffInforme >= 0 && diffInforme <= 3) {
      status = 'informe_pendiente';
      countInformesPendientes++;
    } else {
      status = 'finalizado';
      countFinalizados++;
    }

    return {
      ...a,
      status,
      diffInforme
    };
  });

  const filteredCourses = coursesWithStatus.filter(c => {
    if (filterStatus === 'todos') return true;
    return c.status === filterStatus;
  });

  // Calculate location breakdown
  const lugarCounts: Record<string, number> = {};
  resultado.asignaciones.forEach(a => {
    lugarCounts[a.lugar] = (lugarCounts[a.lugar] || 0) + 1;
  });

  // Calculate days progress
  const startMs = resultado.fechaInicioContrato.getTime();
  const endMs = resultado.limiteContrato.getTime();
  const totalDays = 100;
  const elapsedMs = Math.max(0, hoy.getTime() - startMs);
  const elapsedDays = Math.min(totalDays, Math.floor(elapsedMs / (1000 * 60 * 60 * 24)));
  const progressPercent = Math.min(100, Math.round((elapsedDays / totalDays) * 100));

  return (
    <div className="space-y-6">
      {/* Overview Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* En Curso Card */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-md shadow-2xs flex flex-col justify-between">
          <div>
            <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2 block">
              En Curso Hoy
            </span>
            <div className="flex items-end gap-2">
              <span className="font-display text-3xl font-bold text-indigo-600 dark:text-indigo-400">
                {countEnCurso}
              </span>
              <span className="text-emerald-600 dark:text-emerald-400 font-bold text-xs mb-1">Clases activas</span>
            </div>
          </div>
          <div className="mt-4 h-1 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
            <div className="h-full bg-indigo-600 dark:bg-indigo-400" style={{ width: `${Math.min(countEnCurso * 20, 100)}%` }}></div>
          </div>
        </div>

        {/* Próximos Card */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-md shadow-2xs flex flex-col justify-between">
          <div>
            <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2 block">
              Próximos Cursos
            </span>
            <div className="flex items-end gap-2">
              <span className="font-display text-3xl font-bold text-slate-900 dark:text-white">
                {countProximos}
              </span>
              <span className="text-slate-500 font-medium text-xs mb-1">En agenda</span>
            </div>
          </div>
          <div className="mt-4 h-1 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
            <div className="h-full bg-emerald-500" style={{ width: `${Math.min(countProximos * 20, 100)}%` }}></div>
          </div>
        </div>

        {/* Informes Pendientes Card */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-md shadow-2xs flex flex-col justify-between">
          <div>
            <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2 block">
              Carga e Informes
            </span>
            <div className="flex items-end gap-2">
              <span className="font-display text-3xl font-bold text-amber-600 dark:text-amber-400">
                {countInformesPendientes}
              </span>
              <span className="text-amber-600 dark:text-amber-400 font-bold text-xs mb-1">Pendientes</span>
            </div>
          </div>
          <div className="mt-4 h-1 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
            <div className="h-full bg-amber-500" style={{ width: `${Math.min(countInformesPendientes * 25, 100)}%` }}></div>
          </div>
        </div>

        {/* Finalizados Card */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-md shadow-2xs flex flex-col justify-between">
          <div>
            <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2 block">
              Total Cursos Programados
            </span>
            <div className="flex items-end gap-2">
              <span className="font-display text-3xl font-bold text-slate-900 dark:text-white">
                {resultado.asignaciones.length}
              </span>
              <span className="text-emerald-600 dark:text-emerald-400 font-bold text-xs mb-1">100% Asignados</span>
            </div>
          </div>
          <div className="mt-4 h-1 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
            <div className="h-full bg-indigo-500" style={{ width: '100%' }}></div>
          </div>
        </div>
      </div>

      {/* Bento Charts Section from Stitch */}
      <div className="grid grid-cols-12 gap-4">
        {/* Resource Allocation (Bar Chart) */}
        <div className="col-span-12 lg:col-span-8 bg-white dark:bg-slate-900 p-6 rounded-md border border-slate-200 dark:border-slate-800 shadow-2xs">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-display font-semibold text-sm md:text-base text-slate-900 dark:text-white">
              Asignación de Carga por Sesiones
            </h3>
            <div className="flex gap-4 text-xs font-medium">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-indigo-600"></span>
                <span className="text-slate-600 dark:text-slate-400">Facilitadores</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-emerald-500"></span>
                <span className="text-slate-600 dark:text-slate-400">Técnicos</span>
              </div>
            </div>
          </div>
          <div className="h-48 flex items-end justify-between gap-4 px-4 pt-4 border-b border-slate-100 dark:border-slate-800">
            {['Sesión 1', 'Sesión 2', 'Sesión 3', 'Informe Final', 'Archivo'].map((sName, sIdx) => {
              const hFac = [70, 85, 65, 90, 40][sIdx];
              const hTec = [45, 60, 55, 75, 30][sIdx];
              return (
                <div key={sIdx} className="flex flex-col items-center flex-1 h-full justify-end">
                  <div className="flex gap-1.5 w-full justify-center items-end h-full">
                    <div className="w-6 md:w-8 bg-indigo-600 rounded-t transition-all duration-500" style={{ height: `${hFac}%` }}></div>
                    <div className="w-6 md:w-8 bg-emerald-500 rounded-t transition-all duration-500" style={{ height: `${hTec}%` }}></div>
                  </div>
                  <span className="font-mono text-[10px] text-slate-500 dark:text-slate-400 mt-2">{sName}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Course Status (Donut Representation) */}
        <div className="col-span-12 lg:col-span-4 bg-white dark:bg-slate-900 p-6 rounded-md border border-slate-200 dark:border-slate-800 shadow-2xs flex flex-col">
          <h3 className="font-display font-semibold text-sm md:text-base text-slate-900 dark:text-white mb-4">
            Estado de Cursos
          </h3>
          <div className="flex-1 flex flex-col justify-center items-center">
            <div className="relative w-40 h-40 mb-4">
              <svg className="w-full h-full transform -rotate-90">
                <circle className="text-slate-100 dark:text-slate-800" cx="80" cy="80" fill="transparent" r="64" stroke="currentColor" strokeWidth="12"></circle>
                <circle className="text-indigo-600 dark:text-indigo-400" cx="80" cy="80" fill="transparent" r="64" stroke="currentColor" strokeDasharray="402" strokeDashoffset="120" strokeWidth="12"></circle>
                <circle className="text-emerald-500" cx="80" cy="80" fill="transparent" r="64" stroke="currentColor" strokeDasharray="402" strokeDashoffset="300" strokeWidth="12"></circle>
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="font-display text-2xl font-bold text-slate-900 dark:text-white">{resultado.asignaciones.length}</span>
                <span className="font-mono text-[9px] text-slate-400 dark:text-slate-500 uppercase tracking-widest">TOTAL</span>
              </div>
            </div>
            <div className="w-full space-y-2 text-xs">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-indigo-600"></span><span className="text-slate-600 dark:text-slate-300">En Curso</span></div>
                <span className="font-mono font-bold text-slate-900 dark:text-white">{countEnCurso}</span>
              </div>
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span><span className="text-slate-600 dark:text-slate-300">Próximos</span></div>
                <span className="font-mono font-bold text-slate-900 dark:text-white">{countProximos}</span>
              </div>
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span><span className="text-slate-600 dark:text-slate-300">Inf. Pendientes</span></div>
                <span className="font-mono font-bold text-slate-900 dark:text-white">{countInformesPendientes}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Timeline Trend Area SVG */}
        <div className="col-span-12 bg-white dark:bg-slate-900 p-6 rounded-md border border-slate-200 dark:border-slate-800 shadow-2xs">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-display font-semibold text-sm md:text-base text-slate-900 dark:text-white">
              Tendencia de Cumplimiento de Contrato
            </h3>
            <span className="font-mono text-xs text-indigo-600 dark:text-indigo-400 font-bold bg-indigo-50 dark:bg-indigo-950 px-2 py-0.5 rounded">
              Gestión UNEFCO 2026
            </span>
          </div>
          <div className="h-32 relative w-full overflow-hidden">
            <svg className="w-full h-full preserve-aspect-ratio" preserveAspectRatio="none" viewBox="0 0 1000 200">
              <defs>
                <linearGradient id="gradient-primary" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#4f46e5" stopOpacity="0.25"></stop>
                  <stop offset="100%" stopColor="#4f46e5" stopOpacity="0"></stop>
                </linearGradient>
              </defs>
              <path d="M0,160 Q100,140 200,110 T400,120 T600,40 T800,90 T1000,20 L1000,200 L0,200 Z" fill="url(#gradient-primary)"></path>
              <path className="text-indigo-600 dark:text-indigo-400" d="M0,160 Q100,140 200,110 T400,120 T600,40 T800,90 T1000,20" fill="none" stroke="currentColor" strokeWidth="3"></path>
            </svg>
            <div className="absolute bottom-0 w-full flex justify-between px-2 font-mono text-slate-400 text-[10px]">
              <span>ENE</span><span>FEB</span><span>MAR</span><span>ABR</span><span>MAY</span><span>JUN</span><span>JUL</span>
            </div>
          </div>
        </div>
      </div>

      {/* Contract Timeline Progress Bar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-sm shadow-2xs space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider flex items-center gap-2">
              <Calendar className="w-4 h-4 text-indigo-600" />
              Progreso del Margen de Contrato (100 Días Fijos)
            </h3>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
              Desde {formatDateVisual(resultado.fechaInicioContrato)} hasta {formatDateVisual(resultado.limiteContrato)}
            </p>
          </div>
          <div className="text-right">
            <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
              {elapsedDays} / 100 Días Transcurridos
            </span>
            <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-bold block">
              {progressPercent}% Completado
            </span>
          </div>
        </div>

        {/* Visual Progress Bar */}
        <div className="w-full h-3 bg-slate-100 dark:bg-slate-800 rounded-2xs overflow-hidden p-0.5 border border-slate-200 dark:border-slate-700">
          <div 
            className="h-full bg-indigo-600 dark:bg-indigo-500 rounded-2xs transition-all duration-500"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* Breakdown of Sede / Places */}
        <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center gap-6 text-xs">
          <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 font-bold uppercase text-[10px] tracking-wider">
            <MapPin className="w-3.5 h-3.5 text-indigo-600" />
            <span>Sedes en Ejecución:</span>
          </div>
          {Object.entries(lugarCounts).map(([lugar, count], idx) => (
            <div key={idx} className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-2.5 py-1 rounded-2xs">
              <span className="font-bold text-slate-800 dark:text-slate-200">{lugar}:</span>
              <span className="font-bold text-indigo-600 dark:text-indigo-400">{count} cursos</span>
            </div>
          ))}
        </div>
      </div>

      {/* Interactive Filter & List of Courses */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-sm shadow-2xs space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4 pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-indigo-600" />
            <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
              Seguimiento por Estado de Curso
            </h3>
          </div>

          {/* Filter Pills */}
          <div className="flex flex-wrap items-center gap-1.5 bg-slate-100 dark:bg-slate-800 p-1 rounded-2xs text-[11px] font-bold">
            <button
              onClick={() => setFilterStatus('todos')}
              className={`px-3 py-1 rounded-2xs transition-colors cursor-pointer ${
                filterStatus === 'todos'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-2xs'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              Todos ({coursesWithStatus.length})
            </button>
            <button
              onClick={() => setFilterStatus('en_curso')}
              className={`px-3 py-1 rounded-2xs transition-colors cursor-pointer ${
                filterStatus === 'en_curso'
                  ? 'bg-emerald-600 text-white'
                  : 'text-slate-500 dark:text-slate-400 hover:text-emerald-600'
              }`}
            >
              En Curso ({countEnCurso})
            </button>
            <button
              onClick={() => setFilterStatus('proximo')}
              className={`px-3 py-1 rounded-2xs transition-colors cursor-pointer ${
                filterStatus === 'proximo'
                  ? 'bg-indigo-600 text-white'
                  : 'text-slate-500 dark:text-slate-400 hover:text-indigo-600'
              }`}
            >
              Próximos ({countProximos})
            </button>
            <button
              onClick={() => setFilterStatus('informe_pendiente')}
              className={`px-3 py-1 rounded-2xs transition-colors cursor-pointer ${
                filterStatus === 'informe_pendiente'
                  ? 'bg-amber-600 text-white'
                  : 'text-slate-500 dark:text-slate-400 hover:text-amber-600'
              }`}
            >
              Inf. Pendientes ({countInformesPendientes})
            </button>
            <button
              onClick={() => setFilterStatus('finalizado')}
              className={`px-3 py-1 rounded-2xs transition-colors cursor-pointer ${
                filterStatus === 'finalizado'
                  ? 'bg-slate-700 text-white'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-700'
              }`}
            >
              Finalizados ({countFinalizados})
            </button>
          </div>
        </div>

        {/* Detailed List */}
        <div className="space-y-3">
          {filteredCourses.length === 0 ? (
            <div className="p-8 text-center text-slate-400 dark:text-slate-500 text-xs italic">
              No hay cursos en esta categoría de filtro.
            </div>
          ) : (
            filteredCourses.map((c, idx) => {
              let badgeColor = "bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800";
              let label = "Próximo";

              if (c.status === 'en_curso') {
                badgeColor = "bg-emerald-50 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800";
                label = "En Curso";
              } else if (c.status === 'informe_pendiente') {
                badgeColor = "bg-amber-50 dark:bg-amber-950 text-amber-900 dark:text-amber-300 border-amber-300 dark:border-amber-800";
                label = "Informe Pendiente";
              } else if (c.status === 'finalizado') {
                badgeColor = "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700";
                label = "Finalizado";
              }

              return (
                <div 
                  key={idx}
                  className="p-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-2xs flex flex-wrap items-center justify-between gap-4 text-xs"
                >
                  <div className="flex items-center gap-3">
                    <BookOpen className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
                    <div>
                      <h4 className="font-bold text-slate-900 dark:text-slate-100 text-xs">
                        {c.cicloId} | C{c.cursoIndex + 1}: {c.cursoNombre}
                      </h4>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold mt-0.5">
                        Lugar: <span className="text-slate-800 dark:text-slate-200">{c.lugar}</span> • Modalidad: <span className="text-slate-800 dark:text-slate-200">{c.modalidad}</span>
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-4">
                    <div className="text-right">
                      <span className="text-[9px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider block">
                        Fechas de Clases
                      </span>
                      <span className="font-bold text-slate-800 dark:text-slate-200">
                        {formatDateVisual(c.inicio, false)} — {formatDateVisual(c.fin, false)}
                      </span>
                    </div>

                    <div className="text-right">
                      <span className="text-[9px] text-amber-600 dark:text-amber-400 font-bold uppercase tracking-wider block">
                        Límite Informe
                      </span>
                      <span className="font-bold text-amber-700 dark:text-amber-300">
                        {formatDateVisual(c.informeFinal, false)}
                      </span>
                    </div>

                    <span className={`px-2.5 py-1 rounded-2xs border text-[10px] font-bold uppercase tracking-wider ${badgeColor}`}>
                      {label}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
