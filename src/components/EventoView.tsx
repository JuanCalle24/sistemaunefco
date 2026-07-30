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
      <div className="min-h-[450px] flex flex-col items-center justify-center p-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm text-center">
        <div className="w-16 h-16 bg-indigo-50 dark:bg-indigo-950/80 border border-indigo-200 dark:border-indigo-800 text-indigo-600 dark:text-indigo-400 flex items-center justify-center rounded-2xl mb-4 shadow-xs">
          <BookOpen className="w-8 h-8" />
        </div>
        <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider mb-2 font-display">
          No hay Cursos Programados Activos
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md leading-relaxed mb-6 font-medium">
          Seleccione la opción "Generar Cronograma" en el menú lateral de opciones para ingresar los parámetros del docente y calcular los itinerarios formativos.
        </p>
        <button
          onClick={onGoToProgramar}
          className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-3 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center gap-2 shadow-md transition-all cursor-pointer"
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
  const modalidadStr = primarySlot ? primarySlot.modalidad : 'Presencial / Semipresencial';
  
  // Format month name
  const monthName = resultado.fechaInicioContrato
    ? new Date(resultado.fechaInicioContrato).toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })
    : 'Julio 2026';

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* SIE UNEFCO STYLE BLUE EVENT BANNER */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-2xl p-6 shadow-md flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-widest text-indigo-200 bg-white/10 px-2.5 py-1 rounded-md border border-white/20 mb-2 inline-block">
            Sistema SIE UNEFCO - La Paz
          </span>
          <h2 className="text-xl md:text-2xl font-bold font-display tracking-tight">
            Evento: {lugarName}
          </h2>
          <p className="text-xs text-indigo-100 font-medium">
            Sede La Paz • {resultado.asignaciones.length} Cursos Programados • Código: <code className="font-mono bg-black/20 px-1.5 py-0.5 rounded">{resultado.idTransaccion}</code>
          </p>
        </div>

        <div className="flex flex-wrap gap-2.5">
          <button
            onClick={onGoToProgramar}
            className="bg-white/20 hover:bg-white/30 text-white text-xs font-bold uppercase tracking-wider px-4 py-2.5 rounded-xl border border-white/30 flex items-center gap-2 transition-all cursor-pointer shadow-xs"
          >
            <Sliders className="w-4 h-4" />
            <span>Editar Parámetros</span>
          </button>
        </div>
      </div>

      {/* INFORMACIÓN DEL EVENTO CARDS (Matching SIE UNEFCO Image 2) */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-2 font-display">
          <Info className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          <span>Información del Evento</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Facilitador */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 flex flex-col items-center text-center shadow-xs">
            <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/80 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-2">
              <User className="w-5 h-5" />
            </div>
            <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider">
              Facilitador
            </span>
            <span className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-tight mt-0.5">
              {resultado.facilitador || 'Lic. Por Asignar'}
            </span>
          </div>

          {/* Card 2: Distrito / Lugar */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 flex flex-col items-center text-center shadow-xs">
            <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/80 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-2">
              <MapPin className="w-5 h-5" />
            </div>
            <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider">
              Distrito / Sede
            </span>
            <span className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-tight mt-0.5">
              {lugarName}
            </span>
          </div>

          {/* Card 3: Mes / Versión */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 flex flex-col items-center text-center shadow-xs">
            <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/80 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-2">
              <Calendar className="w-5 h-5" />
            </div>
            <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider">
              Mes / Versión
            </span>
            <span className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-tight mt-0.5 capitalize">
              {monthName}
            </span>
          </div>

          {/* Card 4: Modalidad */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 flex flex-col items-center text-center shadow-xs">
            <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/80 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-2">
              <Laptop className="w-5 h-5" />
            </div>
            <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider">
              Modalidad
            </span>
            <span className="text-[10px] font-black bg-cyan-100 text-cyan-800 dark:bg-cyan-950/80 dark:text-cyan-300 px-2 py-0.5 rounded-md uppercase tracking-wider mt-1">
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
