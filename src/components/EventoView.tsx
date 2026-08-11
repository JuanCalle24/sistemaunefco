import React from 'react';
import { motion } from 'motion/react';
import { 
  User, 
  MapPin, 
  Calendar, 
  BookOpen, 
  Plus, 
  Award, 
  Edit3, 
  Users, 
  Star, 
  FileText,
  Sparkles,
  Sliders,
  Info,
  CheckCircle2,
  Clock,
  Laptop
} from 'lucide-react';
import { ProgramacionResultado, SlotAsignacion } from '../types';
import { CicloCard } from './CicloCard';
import { Timeline } from './Timeline';
import { ScheduleFilterBar, StatusFilterType } from './ScheduleFilterBar';
import { AlertsBanner } from './AlertsBanner';

interface EventoViewProps {
  resultado: ProgramacionResultado | null;
  onGoToProgramar: () => void;
  filteredSlots: SlotAsignacion[];
  modo: 'automatico' | 'manual';
  onManualDateChange: (slotId: string, cursoIdx: number, newDateStr: string) => void;
  manualDatesMap: Record<string, string>;
  activeAlerts: any[];
  filterCounts: any;
  searchTerm: string;
  onSearchChange: (v: string) => void;
  statusFilter: StatusFilterType;
  onStatusFilterChange: (s: StatusFilterType) => void;
  selectedTecnico: string;
  onTecnicoChange: (v: string) => void;
  availableTecnicos: string[];
  onResetFilters: () => void;
}

export const EventoView: React.FC<EventoViewProps> = ({
  resultado,
  onGoToProgramar,
  filteredSlots,
  modo,
  onManualDateChange,
  manualDatesMap,
  activeAlerts,
  filterCounts,
  searchTerm,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  selectedTecnico,
  onTecnicoChange,
  availableTecnicos,
  onResetFilters
}) => {
  if (!resultado) {
    return (
      <div className="min-h-[400px] flex flex-col items-center justify-center p-8 bg-white dark:bg-[#252628] border border-zinc-200 dark:border-[#333438] rounded-lg text-center">
        <div className="w-12 h-12 bg-zinc-100 dark:bg-[#2d2e32] border border-zinc-200 dark:border-[#3a3b40] text-zinc-600 dark:text-zinc-300 flex items-center justify-center rounded-lg mb-3">
          <BookOpen className="w-6 h-6" />
        </div>
        <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 uppercase tracking-wider mb-1.5">
          No hay Cursos Programados Activos
        </h3>
        <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-md leading-relaxed mb-5">
          Seleccione la opción "Generar Cronograma" en el menú lateral de opciones para ingresar los parámetros del docente y calcular los itinerarios formativos.
        </p>
        <button
          onClick={onGoToProgramar}
          className="bg-[#4573d2] hover:bg-[#3866c6] text-white px-4 py-2 rounded text-xs font-medium flex items-center gap-2 transition-colors cursor-pointer"
        >
          <Sliders className="w-4 h-4" />
          <span>Configurar Parámetros</span>
        </button>
      </div>
    );
  }

  // Primary slot details
  const primarySlot = resultado.slots[0];
  const lugarName = primarySlot ? primarySlot.lugar : 'SEDE LA PAZ';
  const rawModalidad = primarySlot?.modalidad;
  const modalidadStr = (!rawModalidad || rawModalidad === 'Presencial') ? 'Semipresencial' : rawModalidad;
  
  // Format month name
  const monthName = resultado.fechaInicioContrato
    ? new Date(resultado.fechaInicioContrato).toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })
    : 'Julio 2026';

  const [showSavedToast, setShowSavedToast] = React.useState(false);

  const handleConfirmAndSave = () => {
    if (resultado && resultado.daysUsed > 100) {
      alert(`⚠️ NO SE PUEDE GUARDAR: La programación abarca ${resultado.daysUsed} días, excediendo el límite máximo de 100 días del contrato UNEFCO por ${resultado.daysUsed - 100} día(s). Por favor reajuste las fechas de inicio de los cursos.`);
      return;
    }
    setShowSavedToast(true);
    setTimeout(() => {
      setShowSavedToast(false);
    }, 4000);
  };

  return (
    <div className="space-y-5">
      {/* Toast Notification when saving schedule */}
      {showSavedToast && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          className="bg-emerald-600 text-white px-4 py-3 rounded-lg shadow-lg flex items-center justify-between gap-3 text-xs font-bold"
        >
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-200 shrink-0" />
            <span>CRONOGRAMA GUARDADO Y CONFIRMADO: Registrado correctamente en el Sistema de Seguimiento y Dashboard Académico.</span>
          </div>
          <button
            onClick={() => setShowSavedToast(false)}
            className="bg-emerald-700 hover:bg-emerald-800 text-white px-2 py-1 rounded text-[10px] font-mono cursor-pointer"
          >
            CERRAR
          </button>
        </motion.div>
      )}

      {/* OVERFLOW 100 DAYS BLOCKING CRITICAL ALERT BANNER */}
      {resultado && resultado.daysUsed > 100 && (
        <div className="bg-red-50 dark:bg-red-950/60 border-2 border-red-500 p-4 rounded-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-red-900 dark:text-red-100 shadow-md">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-red-600 text-white flex items-center justify-center shrink-0 font-bold">
              <Clock className="w-5 h-5 animate-bounce" />
            </div>
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-red-700 dark:text-red-300">
                🚨 Error de Límite de Contrato ({resultado.daysUsed} / 100 Días)
              </h4>
              <p className="text-xs font-medium mt-0.5">
                La programación manual abarca <strong>{resultado.daysUsed} días calendario</strong>, excediendo por <strong className="text-red-700 dark:text-red-300">+{resultado.daysUsed - 100} día(s)</strong> el límite máximo de 100 días de contrato UNEFCO. Debe reajustar las fechas para poder registrar un cronograma válido.
              </p>
            </div>
          </div>
          <button
            onClick={onGoToProgramar}
            className="bg-red-600 hover:bg-red-700 text-white text-xs font-bold px-3.5 py-2 rounded shadow-sm flex items-center gap-1.5 shrink-0 transition-all cursor-pointer"
          >
            <Sliders className="w-4 h-4" />
            <span>Ajustar Fechas en Programador</span>
          </button>
        </div>
      )}

      {/* Manual Mode Active Notice */}
      {modo === 'manual' && (
        <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 p-3.5 rounded-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-amber-900 dark:text-amber-200">
            <Clock className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
            <span className="text-xs font-semibold">
              Modo Programación Manual Activo — Seleccione la fecha de inicio para cada curso individualmente.
            </span>
          </div>
          <button
            onClick={handleConfirmAndSave}
            className="bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold px-3.5 py-1.5 rounded shadow-2xs flex items-center gap-1.5 transition-all cursor-pointer shrink-0"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Confirmar Programación Manual</span>
          </button>
        </div>
      )}

      {/* ASANA STYLE CLEAN EVENT BANNER */}
      <div className="bg-[#1e2330] text-white rounded-lg p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border border-zinc-800">
        <div>
          <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-400 bg-white/10 px-2.5 py-0.5 rounded border border-white/10 mb-1.5 inline-block">
            PORTAL ACADÉMICO UNEFCO LA PAZ
          </span>
          <h2 className="text-lg md:text-xl font-semibold tracking-tight text-white font-display">
            Evento: {lugarName}
          </h2>
          <p className="text-xs text-zinc-300 mt-0.5 font-body">
            Sede La Paz • {resultado.asignaciones.length} Cursos Programados • Código: <code className="font-mono bg-black/40 px-1.5 py-0.5 rounded font-medium text-zinc-200">{resultado.idTransaccion}</code>
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleConfirmAndSave}
            className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-4 py-2 rounded border border-emerald-500 flex items-center gap-2 shadow-sm transition-colors cursor-pointer"
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-200" />
            <span>Guardar en Seguimiento</span>
          </button>

          <button
            onClick={onGoToProgramar}
            className="bg-white/10 hover:bg-white/20 text-white text-xs font-medium px-3.5 py-2 rounded border border-white/20 flex items-center gap-2 transition-colors cursor-pointer"
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Editar Parámetros</span>
          </button>
        </div>
      </div>

      {/* INFORMACIÓN DEL EVENTO CARDS */}
      <div className="space-y-2.5">
        <h3 className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider flex items-center gap-2">
          <Info className="w-4 h-4 text-zinc-500" />
          <span>Información del Evento</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Card 1: Facilitador */}
          <div className="glass-panel p-4 flex flex-col items-center text-center rounded-lg">
            <div className="w-10 h-10 rounded bg-zinc-100 dark:bg-[#2d2e32] text-zinc-600 dark:text-zinc-300 flex items-center justify-center mb-2 shrink-0">
              <User className="w-5 h-5" />
            </div>
            <span className="text-[10px] text-zinc-500 uppercase tracking-wider font-medium">
              Facilitador
            </span>
            <span className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 uppercase mt-0.5">
              {resultado.facilitador || 'Lic. Por Asignar'}
            </span>
            {resultado.ci && (
              <span className="text-[10px] font-mono text-zinc-600 dark:text-zinc-400 mt-1 bg-zinc-100 dark:bg-[#2d2e32] px-2 py-0.5 rounded border border-zinc-200 dark:border-[#3a3b40]">
                CI: {resultado.ci}
              </span>
            )}
          </div>

          {/* Card 2: Distrito / Lugar */}
          <div className="glass-panel p-4 flex flex-col items-center text-center rounded-lg">
            <div className="w-10 h-10 rounded bg-zinc-100 dark:bg-[#2d2e32] text-zinc-600 dark:text-zinc-300 flex items-center justify-center mb-2 shrink-0">
              <MapPin className="w-5 h-5" />
            </div>
            <span className="text-[10px] text-zinc-500 uppercase tracking-wider font-medium">
              Distrito / Sede
            </span>
            <span className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 uppercase mt-0.5">
              {lugarName}
            </span>
          </div>

          {/* Card 3: Mes / Versión */}
          <div className="glass-panel p-4 flex flex-col items-center text-center rounded-lg">
            <div className="w-10 h-10 rounded bg-zinc-100 dark:bg-[#2d2e32] text-zinc-600 dark:text-zinc-300 flex items-center justify-center mb-2 shrink-0">
              <Calendar className="w-5 h-5" />
            </div>
            <span className="text-[10px] text-zinc-500 uppercase tracking-wider font-medium">
              Mes / Versión
            </span>
            <span className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 uppercase mt-0.5 capitalize">
              {monthName}
            </span>
          </div>

          {/* Card 4: Modalidad */}
          <div className="glass-panel p-4 flex flex-col items-center text-center rounded-lg">
            <div className="w-10 h-10 rounded bg-zinc-100 dark:bg-[#2d2e32] text-zinc-600 dark:text-zinc-300 flex items-center justify-center mb-2 shrink-0">
              <Laptop className="w-5 h-5" />
            </div>
            <span className="text-[10px] text-zinc-500 uppercase tracking-wider font-medium">
              Modalidad
            </span>
            <span className="text-[10px] font-mono text-zinc-700 dark:text-zinc-300 bg-zinc-100 dark:bg-[#2d2e32] px-2.5 py-0.5 rounded uppercase mt-1 border border-zinc-200 dark:border-[#3a3b40]">
              {modalidadStr.toUpperCase()}
            </span>
          </div>
        </div>
      </div>

      {/* Critical Alerts Banner */}
      <AlertsBanner
        alerts={activeAlerts}
        onSelectAlertFilter={() => onStatusFilterChange('alertas')}
        totalEnCursoCount={filterCounts.en_curso}
        totalProximosCount={filterCounts.proximos}
      />

      {/* Visual Timeline Track */}
      <Timeline
        slots={resultado.slots}
        asignaciones={resultado.asignaciones}
        fechaInicioContrato={resultado.fechaInicioContrato}
        daysUsed={resultado.daysUsed}
      />

      {/* Search and Semaforización Quick Filter Bar */}
      <ScheduleFilterBar
        searchTerm={searchTerm}
        onSearchChange={onSearchChange}
        statusFilter={statusFilter}
        onStatusFilterChange={onStatusFilterChange}
        selectedTecnico={selectedTecnico}
        onTecnicoChange={onTecnicoChange}
        availableTecnicos={availableTecnicos}
        counts={filterCounts}
        totalCount={resultado.slots.length}
        filteredCount={filteredSlots.length}
        onResetFilters={onResetFilters}
      />

      {/* CURSOS DEL EVENTO SECTION */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider flex items-center gap-2 font-display">
            <BookOpen className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <span>Cursos del Evento</span>
          </h3>
          <span className="text-xs font-bold bg-cyan-600 text-white px-3 py-1 rounded-xl shadow-xs">
            {resultado.asignaciones.length} cursos registrados
          </span>
        </div>

        {/* Cycle Cards */}
        <div className="space-y-4">
          {filteredSlots.map((slot, idx) => {
            const cursosCiclo = resultado.asignaciones.filter(a => a.slotId === slot.id);

            return (
              <CicloCard
                key={slot.id}
                slot={slot}
                index={idx}
                cursos={cursosCiclo}
                modo={modo}
                onManualDateChange={onManualDateChange}
                manualDates={manualDatesMap}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
};
