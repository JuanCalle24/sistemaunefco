import React, { useState, useMemo } from 'react';
import { 
  ProgramacionResultado, UserRole, UserProfile
} from '../types';
import { CorrelativoRecord } from '../services/correlativoService';
import { formatDateVisual } from '../utils/textUtils';
import { 
  CheckCircle2, 
  FileCheck2, 
  UserCheck, 
  ShieldCheck, 
  Calendar, 
  ArrowRight, 
  Search, 
  User, 
  AlertTriangle, 
  Check, 
  Info, 
  BookOpen,
  GraduationCap
} from 'lucide-react';

interface DashboardMetricsProps {
  resultado?: ProgramacionResultado | null;
  isDarkMode?: boolean;
  activeRole?: UserRole;
  currentUser?: UserProfile | null;
  history?: ProgramacionResultado[];
  correlativoRecords?: CorrelativoRecord[];
  onGoToProgramar?: (nombreFacilitador?: string, ciNum?: string) => void;
}

export const DashboardMetrics: React.FC<DashboardMetricsProps> = ({
  resultado,
  activeRole = 'tecnico',
  currentUser,
  history = [],
  correlativoRecords = [],
  onGoToProgramar
}) => {
  const [filterStatus, setFilterStatus] = useState<'todos' | 'en_curso' | 'proximo' | 'informe_pendiente' | 'finalizado'>('todos');
  
  // Search and Filter State for Trámites de Contratación Panel
  const [tramiteSearch, setTramiteSearch] = useState('');
  const [tramiteFilter, setTramiteFilter] = useState<'pendientes' | 'completados' | 'todos'>('pendientes');

  const isAdminMode = activeRole === 'admin';
  const totalGlobalRecords = history.length;
  const activeGlobalRecords = history.filter(h => h.estado !== 'ANULADO').length;
  const anuladosGlobalRecords = history.filter(h => h.estado === 'ANULADO').length;
  
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);

  // Group Correlativos by CI & evaluate Schedule Linkage
  const tramites = useMemo(() => {
    if (!correlativoRecords || correlativoRecords.length === 0) return [];

    type TramiteEntry = {
      ciCompleta: string;
      ciNum: string;
      ciComp: string;
      nombreFacilitador: string;
      cpRecord?: CorrelativoRecord;
      infRecord?: CorrelativoRecord;
      iniRecord?: CorrelativoRecord;
      lastDate: string;
      usuarioGenerador: string;
    };

    const ciMap = new Map<string, TramiteEntry>();

    correlativoRecords.forEach((r) => {
      if (r.estado === 'Anulado') return;

      const key = r.ciCompleta || r.ciNum;
      const existing: TramiteEntry = ciMap.get(key) || {
        ciCompleta: r.ciCompleta || r.ciNum,
        ciNum: r.ciNum,
        ciComp: r.ciComp || '',
        nombreFacilitador: r.nombreFacilitador,
        lastDate: r.fechaGeneracion,
        usuarioGenerador: r.usuarioGenerador
      };

      if (r.nombreFacilitador && (!existing.nombreFacilitador || existing.nombreFacilitador === 'Desconocido')) {
        existing.nombreFacilitador = r.nombreFacilitador;
      }

      if (r.tipo === 'cp') existing.cpRecord = r;
      if (r.tipo === 'inf') existing.infRecord = r;
      if (r.tipo === 'ini') existing.iniRecord = r;

      if (new Date(r.fechaGeneracion) > new Date(existing.lastDate)) {
        existing.lastDate = r.fechaGeneracion;
      }

      ciMap.set(key, existing);
    });

    const allSchedules = [...history];
    if (resultado && !allSchedules.some((s) => s.id === resultado.id)) {
      allSchedules.unshift(resultado);
    }

    return Array.from(ciMap.values()).map((item) => {
      const cleanCi = (item.ciNum || '').trim();
      const cleanName = (item.nombreFacilitador || '').toLowerCase().trim();

      const matchingSchedule = allSchedules.find((s) => {
        if (s.estado === 'ANULADO') return false;
        const schedCi = (s.ci || (s as any).ciDocente || '').trim();
        const schedName = (s.facilitador || (s as any).nombreDocente || '').toLowerCase().trim();

        if (schedCi && cleanCi && (schedCi === item.ciCompleta || schedCi.includes(cleanCi))) {
          return true;
        }
        if (schedName && cleanName && (schedName === cleanName || schedName.includes(cleanName) || cleanName.includes(schedName))) {
          return true;
        }
        return false;
      });

      const isCompletedPaso3 = !!item.iniRecord;
      const hasSchedule = !!matchingSchedule;

      return {
        ...item,
        isCompletedPaso3,
        hasSchedule,
        matchingSchedule
      };
    }).sort((a, b) => new Date(b.lastDate).getTime() - new Date(a.lastDate).getTime());
  }, [correlativoRecords, history, resultado]);

  const totalTramites = tramites.length;
  const tramitesPendientes = tramites.filter(t => !t.hasSchedule);
  const tramitesCompletados = tramites.filter(t => t.hasSchedule);

  const filteredTramites = tramites.filter(t => {
    if (tramiteFilter === 'pendientes' && t.hasSchedule) return false;
    if (tramiteFilter === 'completados' && !t.hasSchedule) return false;
    if (tramiteSearch.trim()) {
      const q = tramiteSearch.toLowerCase().trim();
      const matchName = (t.nombreFacilitador || '').toLowerCase().includes(q);
      const matchCi = (t.ciCompleta || '').toLowerCase().includes(q);
      const matchCp = t.cpRecord?.codigoCompleto.toLowerCase().includes(q);
      const matchInf = t.infRecord?.codigoCompleto.toLowerCase().includes(q);
      const matchIni = t.iniRecord?.codigoCompleto.toLowerCase().includes(q);
      return matchName || matchCi || matchCp || matchInf || matchIni;
    }
    return true;
  });

  // Calculate Lugar Counts dynamically for active schedule
  const lugarCounts = useMemo<Record<string, number>>(() => {
    if (!resultado || !resultado.asignaciones) return {};
    const counts: Record<string, number> = {};
    resultado.asignaciones.forEach(a => {
      const lugar = a.lugar || 'Sede Central';
      counts[lugar] = (counts[lugar] || 0) + 1;
    });
    return counts;
  }, [resultado]);

  // Categorize courses if active resultado exists
  let countEnCurso = 0;
  let countProximos = 0;
  let countInformesPendientes = 0;
  let countFinalizados = 0;

  const coursesWithStatus = resultado ? resultado.asignaciones.map(a => {
    let status: 'en_curso' | 'proximo' | 'informe_pendiente' | 'finalizado' = 'proximo';
    
    const finDate = new Date(a.fin);
    const inicioDate = new Date(a.inicio);
    const diffInforme = Math.floor((hoy.getTime() - finDate.getTime()) / (1000 * 60 * 60 * 24));

    if (hoy >= inicioDate && hoy <= finDate) {
      status = 'en_curso';
      countEnCurso++;
    } else if (hoy < inicioDate) {
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
      inicio: inicioDate,
      fin: finDate,
      informeFinal: new Date(a.informeFinal),
      status,
      diffInforme
    };
  }) : [];

  const filteredCourses = coursesWithStatus.filter(c => {
    if (filterStatus === 'todos') return true;
    return c.status === filterStatus;
  });

  const nombreFacilitadorActual = resultado ? (resultado.facilitador || (resultado as any).nombreDocente || 'Facilitador Formador') : '';

  return (
    <div className="space-y-5">
      {/* Active Mode Indicator Banner */}
      <div className="glass-card p-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 flex items-center justify-center shrink-0 border border-emerald-200 dark:border-emerald-800">
            <UserCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xs font-bold text-zinc-900 dark:text-zinc-100 uppercase tracking-wider font-display">
                Gestión Académica de Programaciones
              </h2>
              <span className="text-[10px] bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-800 font-mono font-bold">
                Mis Programaciones
              </span>
            </div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
              Supervisión y seguimiento de tus cronogramas y ciclos formativos activos.
            </p>
          </div>
        </div>
      </div>

      {/* Overview Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Trámites Pendientes Card */}
        <div className="glass-card glass-card-hover p-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider block">
                Trámites sin Calendario
              </span>
              {tramitesPendientes.length > 0 && (
                <span className="inline-block w-2 h-2 rounded-full bg-amber-500"></span>
              )}
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-zinc-900 dark:text-white font-mono">
                {tramitesPendientes.length}
              </span>
              <span className="text-[11px] text-amber-600 dark:text-amber-400 font-bold uppercase tracking-wider">
                Pendientes
              </span>
            </div>
          </div>
          <div className="mt-3 pt-2.5 border-t border-zinc-100 dark:border-[#333438] flex items-center justify-between text-xs text-zinc-500">
            <span>Facilitadores:</span>
            <span className="font-mono text-zinc-800 dark:text-zinc-200 font-bold">{totalTramites} Trámites</span>
          </div>
        </div>

        {/* En Curso Card */}
        <div className="glass-card glass-card-hover p-4 flex flex-col justify-between">
          <div>
            <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1.5 block">
              En Curso Hoy
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-zinc-900 dark:text-white font-mono">
                {countEnCurso}
              </span>
              <span className="text-xs text-zinc-500">Sesiones activas</span>
            </div>
          </div>
          <div className="mt-3 h-1 bg-zinc-100 dark:bg-[#1e1f21] rounded-full overflow-hidden">
            <div className="h-full bg-emerald-600" style={{ width: `${Math.min(countEnCurso * 20, 100)}%` }}></div>
          </div>
        </div>

        {/* Próximos Card */}
        <div className="glass-card glass-card-hover p-4 flex flex-col justify-between">
          <div>
            <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1.5 block">
              Próximos Módulos
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-zinc-900 dark:text-white font-mono">
                {countProximos}
              </span>
              <span className="text-xs text-zinc-500">En programación</span>
            </div>
          </div>
          <div className="mt-3 h-1 bg-zinc-100 dark:bg-[#1e1f21] rounded-full overflow-hidden">
            <div className="h-full bg-[#4573d2]" style={{ width: `${Math.min(countProximos * 20, 100)}%` }}></div>
          </div>
        </div>

        {/* Total Cronogramas Guardados Card */}
        <div className="glass-card glass-card-hover p-4 flex flex-col justify-between">
          <div>
            <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1.5 block">
              Calendarios Académicos
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-zinc-900 dark:text-white font-mono">
                {activeGlobalRecords}
              </span>
              <span className="text-xs text-emerald-600 dark:text-emerald-400 font-bold">Vigentes</span>
            </div>
          </div>
          <div className="mt-3 h-1 bg-zinc-100 dark:bg-[#1e1f21] rounded-full overflow-hidden">
            <div className="h-full bg-emerald-600" style={{ width: '100%' }}></div>
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------------- */}
      {/* SECCIÓN DEDICADA: TRÁMITES DE CONTRATACIÓN & ESTADO DE CRONOGRAMA  */}
      {/* ------------------------------------------------------------------- */}
      <div className="glass-card rounded-lg p-5 space-y-4">
        
        {/* Header & Filter Controls */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-zinc-200 dark:border-[#333438]">
          <div>
            <div className="flex items-center gap-2">
              <FileCheck2 className="w-4 h-4 text-zinc-500" />
              <h3 className="font-semibold text-sm md:text-base text-zinc-900 dark:text-white">
                Seguimiento de Trámites de Contratación y Formación Docente
              </h3>
            </div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
              Vinculación directa entre los correlativos oficiales UNEFCO (CP, INF, INI) y la asignación de cronogramas.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Filter Tabs */}
            <div className="flex bg-zinc-100 dark:bg-[#1e1f21] p-0.5 rounded border border-zinc-200 dark:border-[#333438] text-xs">
              <button
                type="button"
                onClick={() => setTramiteFilter('pendientes')}
                aria-label="Ver trámites pendientes"
                className={`px-2.5 py-1 rounded transition-colors cursor-pointer flex items-center gap-1 text-xs font-medium ${
                  tramiteFilter === 'pendientes'
                    ? 'bg-white dark:bg-[#2a2b2e] text-zinc-900 dark:text-white border border-zinc-200 dark:border-[#38393e] shadow-2xs'
                    : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-white'
                }`}
              >
                <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                <span>Pendientes ({tramitesPendientes.length})</span>
              </button>

              <button
                type="button"
                onClick={() => setTramiteFilter('completados')}
                aria-label="Ver trámites completados"
                className={`px-2.5 py-1 rounded transition-colors cursor-pointer flex items-center gap-1 text-xs font-medium ${
                  tramiteFilter === 'completados'
                    ? 'bg-white dark:bg-[#2a2b2e] text-zinc-900 dark:text-white border border-zinc-200 dark:border-[#38393e] shadow-2xs'
                    : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-white'
                }`}
              >
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span>Con Calendario ({tramitesCompletados.length})</span>
              </button>

              <button
                type="button"
                onClick={() => setTramiteFilter('todos')}
                aria-label="Ver todos los trámites"
                className={`px-2.5 py-1 rounded transition-colors cursor-pointer text-xs font-medium ${
                  tramiteFilter === 'todos'
                    ? 'bg-white dark:bg-[#2a2b2e] text-zinc-900 dark:text-white border border-zinc-200 dark:border-[#38393e] shadow-2xs'
                    : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-white'
                }`}
              >
                <span>Todos ({totalTramites})</span>
              </button>
            </div>

            {/* Search Input */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={tramiteSearch}
                onChange={(e) => setTramiteSearch(e.target.value)}
                placeholder="Buscar facilitador, CI..."
                className="pl-8 pr-3 py-1 text-xs bg-zinc-50 dark:bg-[#1e1f21] border border-zinc-300 dark:border-[#3e3f44] rounded w-44 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Trámites List / Grid */}
        {filteredTramites.length === 0 ? (
          <div className="p-6 text-center bg-zinc-50 dark:bg-[#1e1f21] rounded border border-dashed border-zinc-200 dark:border-[#333438] space-y-1">
            <Info className="w-6 h-6 text-zinc-400 mx-auto" />
            <p className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
              {tramiteFilter === 'pendientes'
                ? '¡Excelente! No hay trámites de contratación pendientes de asignación de cronograma.'
                : 'No se encontraron registros de trámites de contratación con los filtros seleccionados.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-2.5">
            {filteredTramites.map((item) => {
              return (
                <div
                  key={item.ciCompleta}
                  className="p-3.5 glass-card glass-card-hover flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs"
                >
                  {/* Left: Facilitador Info & CI */}
                  <div className="space-y-1 min-w-[200px]">
                    <div className="flex items-center gap-2">
                      <User className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
                      <h4 className="font-semibold text-xs text-zinc-900 dark:text-white uppercase">
                        {item.nombreFacilitador}
                      </h4>
                    </div>
                    <div className="flex items-center gap-2 text-[11px] text-zinc-500">
                      <span className="font-mono">
                        CI: {item.ciCompleta}
                      </span>
                    </div>
                  </div>

                  {/* Middle: Correlativos Status Badges */}
                  <div className="flex flex-wrap items-center gap-1.5 text-xs">
                    {item.cpRecord ? (
                      <div className="px-2 py-0.5 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 rounded flex items-center gap-1 text-[11px]">
                        <span className="font-semibold text-emerald-700 dark:text-emerald-400">P1:</span>
                        <span className="font-mono text-emerald-900 dark:text-emerald-200">{item.cpRecord.codigoCompleto}</span>
                      </div>
                    ) : (
                      <span className="px-2 py-0.5 bg-zinc-100 dark:bg-[#2d2e32] text-zinc-400 rounded text-[10px]">P1: Pendiente</span>
                    )}

                    {item.infRecord ? (
                      <div className="px-2 py-0.5 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 rounded flex items-center gap-1 text-[11px]">
                        <span className="font-semibold text-emerald-700 dark:text-emerald-400">P2:</span>
                        <span className="font-mono text-emerald-900 dark:text-emerald-200">{item.infRecord.codigoCompleto}</span>
                      </div>
                    ) : (
                      <span className="px-2 py-0.5 bg-zinc-100 dark:bg-[#2d2e32] text-zinc-400 rounded text-[10px]">P2: Pendiente</span>
                    )}

                    {item.iniRecord ? (
                      <div className="px-2 py-0.5 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 rounded flex items-center gap-1 text-[11px]">
                        <span className="font-semibold text-emerald-700 dark:text-emerald-400">P3:</span>
                        <span className="font-mono text-emerald-900 dark:text-emerald-200">{item.iniRecord.codigoCompleto}</span>
                      </div>
                    ) : (
                      <span className="px-2 py-0.5 bg-zinc-100 dark:bg-[#2d2e32] text-zinc-400 rounded text-[10px]">P3: Pendiente</span>
                    )}
                  </div>

                  {/* Right: Schedule Status & Action Button */}
                  <div className="flex items-center gap-2.5 shrink-0">
                    {item.hasSchedule && item.matchingSchedule ? (
                      <div className="text-right">
                        <span className="px-2 py-0.5 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 rounded text-[10px] font-medium uppercase inline-flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          Con Cronograma
                        </span>
                      </div>
                    ) : (
                      <div className="text-right">
                        <span className="px-2 py-0.5 bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800 rounded text-[10px] font-medium uppercase inline-flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3 text-amber-500" />
                          Sin Cronograma
                        </span>
                      </div>
                    )}

                    {onGoToProgramar && (
                      <button
                        type="button"
                        onClick={() => onGoToProgramar(item.nombreFacilitador, item.ciNum)}
                        className={`px-3 py-1.5 rounded text-xs font-medium flex items-center gap-1 transition-colors cursor-pointer ${
                          item.hasSchedule
                            ? 'bg-zinc-200 dark:bg-[#2d2e32] hover:bg-zinc-300 dark:hover:bg-[#38393e] text-zinc-800 dark:text-zinc-200'
                            : 'bg-[#4573d2] hover:bg-[#3866c6] text-white'
                        }`}
                      >
                        <Calendar className="w-3.5 h-3.5" />
                        <span>{item.hasSchedule ? 'Ver / Modificar' : 'Programar'}</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    )}
                  </div>

                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* If active resultado exists, render active schedule assignment metrics & Bento charts */}
      {resultado && (
        <>
          {/* Bento Charts Section */}
          <div className="grid grid-cols-12 gap-4">
            {/* Academic Program Progress */}
            <div className="col-span-12 lg:col-span-8 glass-card p-5 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-zinc-200 dark:border-[#333438] pb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <GraduationCap className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    <h3 className="font-semibold text-sm text-zinc-900 dark:text-white uppercase tracking-tight font-display">
                      Módulos Formativos Programados
                    </h3>
                  </div>
                  <p className="text-xs text-zinc-500 mt-0.5">
                    Facilitador/a: <span className="font-semibold text-zinc-900 dark:text-white">{nombreFacilitadorActual}</span>
                  </p>
                </div>
                <div className="text-xs font-mono bg-zinc-100 dark:bg-[#1e1f21] text-zinc-800 dark:text-zinc-200 px-2.5 py-1 rounded border border-zinc-200 dark:border-[#333438]">
                  {resultado.asignaciones.length} Módulo(s) Formativo(s)
                </div>
              </div>

              {/* Module Timeline Visualizer */}
              <div className="space-y-2 pt-1">
                {resultado.asignaciones.map((mod, idx) => {
                  const days = Math.max(1, Math.ceil((new Date(mod.fin).getTime() - new Date(mod.inicio).getTime()) / (1000 * 60 * 60 * 24)) + 1);
                  return (
                    <div key={idx} className="p-3 glass-card glass-card-hover space-y-1.5">
                      <div className="flex flex-wrap justify-between items-center text-xs">
                        <span className="font-semibold text-zinc-900 dark:text-white">
                          {mod.cicloId} — Módulo {idx + 1}: {mod.cursoNombre}
                        </span>
                        <span className="font-mono text-[11px] text-emerald-700 dark:text-emerald-400 font-bold">
                          {days} Días ({mod.modalidad})
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-[11px] text-zinc-500 pt-1">
                        <div>
                          Inicio: <strong className="text-zinc-700 dark:text-zinc-300 font-normal">{formatDateVisual(new Date(mod.inicio), false)}</strong>
                        </div>
                        <div>
                          Fin: <strong className="text-zinc-700 dark:text-zinc-300 font-normal">{formatDateVisual(new Date(mod.fin), false)}</strong>
                        </div>
                        <div>
                          Informe: <strong className="text-zinc-700 dark:text-zinc-300 font-normal">{formatDateVisual(new Date(mod.informeFinal), false)}</strong>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Location Distribution */}
            <div className="col-span-12 lg:col-span-4 glass-card p-5 flex flex-col justify-between">
              <div>
                <h3 className="font-semibold text-xs text-zinc-800 dark:text-zinc-200 uppercase tracking-wider mb-3 pb-2 border-b border-zinc-200 dark:border-[#333438]">
                  Distribución por Sede
                </h3>
                <div className="space-y-2.5">
                  {Object.entries(lugarCounts).map(([lugar, count], idx) => (
                    <div key={idx} className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="text-zinc-700 dark:text-zinc-300 truncate max-w-[180px]">{lugar}</span>
                        <span className="font-mono text-zinc-500">{count} módulo(s)</span>
                      </div>
                      <div className="h-1.5 bg-zinc-100 dark:bg-[#1e1f21] rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-emerald-600 rounded-full" 
                          style={{ width: `${(Number(count) / (resultado?.slots?.length || 1)) * 100}%` }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="pt-3 border-t border-zinc-200 dark:border-[#333438] text-[10px] text-zinc-400 font-mono">
                Cobertura de Sede: 100% Verificado
              </div>
            </div>
          </div>

          {/* Active Schedule Course Filter & Table */}
          <div className="glass-card rounded-lg p-5 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-zinc-200 dark:border-[#333438]">
              <div>
                <h3 className="font-semibold text-sm text-zinc-900 dark:text-white">
                  Módulos del Cronograma Vigente ({nombreFacilitadorActual})
                </h3>
                <p className="text-xs text-zinc-500">
                  Seguimiento de plazos de ejecución e informes finales.
                </p>
              </div>

              {/* Status Filter Pills */}
              <div className="flex bg-zinc-100 dark:bg-[#1e1f21] p-0.5 rounded border border-zinc-200 dark:border-[#333438] text-xs font-medium">
                <button
                  onClick={() => setFilterStatus('todos')}
                  className={`px-2.5 py-1 rounded transition-colors cursor-pointer ${
                    filterStatus === 'todos'
                      ? 'bg-white dark:bg-[#2a2b2e] text-zinc-900 dark:text-white shadow-2xs'
                      : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-white'
                  }`}
                >
                  Todos ({coursesWithStatus.length})
                </button>
                <button
                  onClick={() => setFilterStatus('en_curso')}
                  className={`px-2.5 py-1 rounded transition-colors cursor-pointer ${
                    filterStatus === 'en_curso'
                      ? 'bg-white dark:bg-[#2a2b2e] text-zinc-900 dark:text-white shadow-2xs'
                      : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-white'
                  }`}
                >
                  En Curso ({countEnCurso})
                </button>
                <button
                  onClick={() => setFilterStatus('proximo')}
                  className={`px-2.5 py-1 rounded transition-colors cursor-pointer ${
                    filterStatus === 'proximo'
                      ? 'bg-white dark:bg-[#2a2b2e] text-zinc-900 dark:text-white shadow-2xs'
                      : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-white'
                  }`}
                >
                  Próximos ({countProximos})
                </button>
                <button
                  onClick={() => setFilterStatus('informe_pendiente')}
                  className={`px-2.5 py-1 rounded transition-colors cursor-pointer ${
                    filterStatus === 'informe_pendiente'
                      ? 'bg-white dark:bg-[#2a2b2e] text-zinc-900 dark:text-white shadow-2xs'
                      : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-white'
                  }`}
                >
                  Inf. Pendientes ({countInformesPendientes})
                </button>
              </div>
            </div>

            {/* Detailed Course List */}
            <div className="space-y-2">
              {filteredCourses.length === 0 ? (
                <div className="p-6 text-center text-zinc-400 text-xs italic">
                  No hay módulos en esta categoría de filtro.
                </div>
              ) : (
                filteredCourses.map((c, idx) => {
                  let badgeColor = "bg-zinc-100 dark:bg-[#2d2e32] text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-[#3a3b40]";
                  let label = "Próximo";

                  if (c.status === 'en_curso') {
                    badgeColor = "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800";
                    label = "En Curso";
                  } else if (c.status === 'informe_pendiente') {
                    badgeColor = "bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800";
                    label = "Informe Pendiente";
                  } else if (c.status === 'finalizado') {
                    badgeColor = "bg-zinc-100 dark:bg-[#2d2e32] text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-[#333438]";
                    label = "Finalizado";
                  }

                  return (
                    <div 
                      key={idx}
                      className="p-3 glass-card glass-card-hover flex flex-wrap items-center justify-between gap-3 text-xs"
                    >
                      <div className="flex items-center gap-2.5">
                        <BookOpen className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
                        <div>
                          <h4 className="font-semibold text-zinc-900 dark:text-zinc-100 text-xs">
                            {c.cicloId} | M{c.cursoIndex + 1}: {c.cursoNombre}
                          </h4>
                          <p className="text-[10px] text-zinc-500 mt-0.5">
                            Lugar: {c.lugar} • Modalidad: {c.modalidad}
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-3">
                        <div className="text-right">
                          <span className="text-[9px] text-zinc-400 font-medium uppercase tracking-wider block">
                            Fechas Formativas
                          </span>
                          <span className="font-mono text-zinc-800 dark:text-zinc-200">
                            {formatDateVisual(c.inicio, false)} — {formatDateVisual(c.fin, false)}
                          </span>
                        </div>

                        <div className="text-right">
                          <span className="text-[9px] text-zinc-400 font-medium uppercase tracking-wider block">
                            Límite Informe
                          </span>
                          <span className="font-mono text-zinc-800 dark:text-zinc-200">
                            {formatDateVisual(c.informeFinal, false)}
                          </span>
                        </div>

                        <span className={`px-2 py-0.5 rounded border text-[10px] font-medium ${badgeColor}`}>
                          {label}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};
