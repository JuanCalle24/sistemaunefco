import React, { useState, useEffect, useMemo } from 'react';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { Timeline } from './components/Timeline';
import { CicloCard } from './components/CicloCard';
import { AdminModal } from './components/AdminModal';
import { DashboardMetrics } from './components/DashboardMetrics';
import { HistoryModal } from './components/HistoryModal';
import { ShareModal } from './components/ShareModal';
import { AlertsBanner } from './components/AlertsBanner';
import { ScheduleFilterBar, StatusFilterType } from './components/ScheduleFilterBar';
import { generateCourseAlerts, getAlertSeverity } from './utils/alertUtils';
import { downloadICSFile, getWhatsAppShareURL, getEmailShareData } from './utils/calendarAndSharing';
import { OFERTA_FORMATIVA_UNEFCO_2026 } from './data/ofertaFormativa';
import { 
  SlotAsignacion, 
  ProgramacionResultado, 
  Modalidad, 
  ManualCourseInput 
} from './types';
import { calculateSchedulerAuto, calculateSchedulerManual } from './utils/scheduler';
import { generatePDFDocument } from './utils/pdfGenerator';
import { ShieldCheck, FileSpreadsheet, FileText, CheckCircle2, LayoutDashboard, CalendarDays, Send, Mail, Calendar, Download, MessageSquare, RotateCcw } from 'lucide-react';

interface MatrixRowItem {
  id: string;
  cicloIndex: number;
  cant: number;
  lugar: string;
  modalidad: Modalidad;
}

export default function App() {
  // Theme & Views
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    return localStorage.getItem('unefco_dark_mode') === 'true';
  });
  const [activeTab, setActiveTab] = useState<'cronograma' | 'dashboard'>('cronograma');
  const [isHistoryOpen, setIsHistoryOpen] = useState<boolean>(false);
  const [isShareOpen, setIsShareOpen] = useState<boolean>(false);

  // History State
  const [history, setHistory] = useState<ProgramacionResultado[]>(() => {
    const local = localStorage.getItem('unefco_history_schedules');
    if (!local) return [];
    try {
      const parsed = JSON.parse(local);
      return parsed.map((item: any) => ({
        ...item,
        fechaInicioContrato: new Date(item.fechaInicioContrato),
        limiteContrato: new Date(item.limiteContrato),
        asignaciones: item.asignaciones.map((a: any) => ({
          ...a,
          inicio: new Date(a.inicio),
          sesion2: new Date(a.sesion2),
          sesion3: new Date(a.sesion3),
          fin: new Date(a.fin),
          planificacion: new Date(a.planificacion),
          informeFinal: new Date(a.informeFinal)
        }))
      }));
    } catch (e) {
      return [];
    }
  });

  // Mode: automatico vs manual
  const [modo, setModo] = useState<'automatico' | 'manual'>('automatico');

  // Personal
  const [facilitador, setFacilitador] = useState<string>('M.Sc. Roberto Paredes');
  const [tecnico, setTecnico] = useState<string>('Juan Carlos Calle');

  const [savedDocentes, setSavedDocentes] = useState<string[]>(() => {
    const local = localStorage.getItem('unefco_docentes');
    return local ? JSON.parse(local) : ['Lic. Juan Carlos Calle', 'M.Sc. Paola Cadena', 'Ph.D. Marcelo Morales', 'Ing. Gonzalo Fernández'];
  });

  const [savedCoordinadores, setSavedCoordinadores] = useState<string[]>(() => {
    const local = localStorage.getItem('unefco_coordinadores');
    return local ? JSON.parse(local) : ['Juan Carlos Calle', 'Paola Cadena', 'Marcelo Morales'];
  });

  const [feriadosLocales, setFeriadosLocales] = useState<string[]>(() => {
    const local = localStorage.getItem('unefco_feriados_locales');
    return local ? JSON.parse(local) : [];
  });

  // Matrix Slots
  const [matrixRows, setMatrixRows] = useState<MatrixRowItem[]>([
    {
      id: 'row-1',
      cicloIndex: 0, // CICLO-01
      cant: 1,
      lugar: 'SEDE CENTRAL - LA PAZ',
      modalidad: 'Presencial'
    }
  ]);

  // Contract Start Date
  const [selectedDate, setSelectedDate] = useState<Date | null>(() => {
    return new Date(2026, 6, 22); // 22/07/2026
  });

  // Manual Date Inputs map (key: slotId-cursoIndex -> dateStr YYYY-MM-DD)
  const [manualDatesMap, setManualDatesMap] = useState<Record<string, string>>({});

  // Calculation State
  const [programacionResult, setProgramacionResult] = useState<ProgramacionResultado | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);

  // Admin Modal state
  const [isAdminOpen, setIsAdminOpen] = useState<boolean>(false);

  // Toggle Dark Mode
  const handleToggleDarkMode = () => {
    const nextVal = !isDarkMode;
    setIsDarkMode(nextVal);
    localStorage.setItem('unefco_dark_mode', String(nextVal));
  };

  // Sync dark class on html root element
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  // Save to localStorage when updated
  useEffect(() => {
    localStorage.setItem('unefco_docentes', JSON.stringify(savedDocentes));
  }, [savedDocentes]);

  useEffect(() => {
    localStorage.setItem('unefco_coordinadores', JSON.stringify(savedCoordinadores));
  }, [savedCoordinadores]);

  useEffect(() => {
    localStorage.setItem('unefco_feriados_locales', JSON.stringify(feriadosLocales));
  }, [feriadosLocales]);

  useEffect(() => {
    localStorage.setItem('unefco_history_schedules', JSON.stringify(history));
  }, [history]);

  // Helper to save schedule to history
  const saveToHistory = (res: ProgramacionResultado) => {
    setHistory(prev => {
      const filtered = prev.filter(item => item.idTransaccion !== res.idTransaccion);
      return [res, ...filtered].slice(0, 15);
    });
  };

  // Expand matrix rows into Slots array
  const currentSlots = useMemo<SlotAsignacion[]>(() => {
    const slots: SlotAsignacion[] = [];
    matrixRows.forEach((row, rIdx) => {
      const oferta = OFERTA_FORMATIVA_UNEFCO_2026[row.cicloIndex];
      for (let g = 0; g < row.cant; g++) {
        slots.push({
          id: `${oferta.id}-${rIdx + 1}-${g + 1}`,
          cicloId: oferta.id,
          cicloNombre: oferta.nombre,
          cat: oferta.cat,
          duracionCurso: oferta.duracionDiasCurso,
          cursos: oferta.cursos,
          lugar: (row.lugar || (oferta.cat === 'TACFI' ? 'SEDE CENTRAL - LA PAZ' : 'SEDE VIACHA')).toUpperCase(),
          modalidad: row.modalidad
        });
      }
    });
    return slots;
  }, [matrixRows]);

  const totalCiclosCount = currentSlots.length;
  const isFormValid =
    facilitador.trim() !== '' &&
    selectedDate !== null &&
    totalCiclosCount > 0 &&
    totalCiclosCount <= 5;

  // Add / Remove / Update Matrix rows
  const handleAddMatrixRow = () => {
    if (totalCiclosCount >= 5) return;
    const newRow: MatrixRowItem = {
      id: `row-${Date.now()}`,
      cicloIndex: Math.min(matrixRows.length, OFERTA_FORMATIVA_UNEFCO_2026.length - 1),
      cant: 1,
      lugar: 'SEDE CENTRAL - LA PAZ',
      modalidad: 'Presencial'
    };
    setMatrixRows([...matrixRows, newRow]);
  };

  const handleRemoveMatrixRow = (id: string) => {
    if (matrixRows.length <= 1) return;
    setMatrixRows(matrixRows.filter(r => r.id !== id));
  };

  const handleUpdateMatrixRow = (id: string, field: keyof MatrixRowItem, value: any) => {
    setMatrixRows(
      matrixRows.map(r => {
        if (r.id === id) {
          const val = field === 'lugar' && typeof value === 'string' ? value.toUpperCase() : value;
          return { ...r, [field]: val };
        }
        return r;
      })
    );
  };

  // Manual Date Input Change Handler
  const handleManualDateChange = (slotId: string, cursoIndex: number, dateStr: string) => {
    const key = `${slotId}-${cursoIndex}`;
    const nextMap = { ...manualDatesMap, [key]: dateStr };
    setManualDatesMap(nextMap);

    // Re-calculate live in manual mode
    if (modo === 'manual' && selectedDate && facilitador) {
      triggerCalculationManual(nextMap);
    }
  };

  // Trigger Automatic Scheduler Calculation
  const triggerCalculationAuto = () => {
    if (!selectedDate || !facilitador) return;
    setIsGenerating(true);
    setErrorMessage(null);
    setWarnings([]);

    setTimeout(() => {
      // Automatically save new teacher to saved docentes if not exists
      if (facilitador && !savedDocentes.includes(facilitador)) {
        setSavedDocentes([...savedDocentes, facilitador]);
      }

      const { resultado, errorMsg } = calculateSchedulerAuto(
        currentSlots,
        facilitador,
        tecnico,
        selectedDate,
        feriadosLocales
      );

      if (errorMsg) {
        setErrorMessage(errorMsg);
        setProgramacionResult(null);
      } else {
        setProgramacionResult(resultado);
        saveToHistory(resultado);
      }
      setIsGenerating(false);
    }, 300);
  };

  // Trigger Manual Calculation
  const triggerCalculationManual = (datesMap = manualDatesMap) => {
    if (!selectedDate || !facilitador) return;
    setIsGenerating(true);
    setErrorMessage(null);

    const manualInputs: ManualCourseInput[] = [];
    currentSlots.forEach(slot => {
      slot.cursos.forEach((_, cIdx) => {
        const key = `${slot.id}-${cIdx}`;
        const val = datesMap[key];
        if (val) {
          manualInputs.push({ slotId: slot.id, cursoIndex: cIdx, inicioStr: val });
        }
      });
    });

    const { resultado, warnings: warnList } = calculateSchedulerManual(
      currentSlots,
      manualInputs,
      facilitador,
      tecnico,
      selectedDate,
      feriadosLocales
    );

    setWarnings(warnList);
    setProgramacionResult(resultado);
    saveToHistory(resultado);
    setIsGenerating(false);
  };

  const handleGenerar = () => {
    if (modo === 'automatico') {
      triggerCalculationAuto();
    } else {
      triggerCalculationManual();
    }
  };

  // PDF Download Handler
  const handleGeneratePDF = async () => {
    if (!programacionResult) return;
    await generatePDFDocument(programacionResult);
  };

  // Admin Management handlers
  const handleAddDocente = (name: string) => {
    if (!savedDocentes.includes(name)) setSavedDocentes([...savedDocentes, name]);
  };
  const handleRemoveDocente = (name: string) => {
    setSavedDocentes(savedDocentes.filter(d => d !== name));
  };

  const handleAddCoordinador = (name: string) => {
    if (!savedCoordinadores.includes(name)) setSavedCoordinadores([...savedCoordinadores, name]);
  };
  const handleRemoveCoordinador = (name: string) => {
    setSavedCoordinadores(savedCoordinadores.filter(c => c !== name));
  };

  const handleAddFeriadoLocal = (iso: string) => {
    if (!feriadosLocales.includes(iso)) setFeriadosLocales([...feriadosLocales, iso]);
  };
  const handleRemoveFeriadoLocal = (iso: string) => {
    setFeriadosLocales(feriadosLocales.filter(f => f !== iso));
  };

  // Load schedule from History
  const handleLoadScheduleFromHistory = (item: ProgramacionResultado) => {
    setProgramacionResult(item);
    setFacilitador(item.facilitador);
    setTecnico(item.tecnico);
    setSelectedDate(item.fechaInicioContrato);
    setModo(item.modo);
  };

  // Filter and Search state for Cronograma
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilterType>('todos');
  const [selectedLugar, setSelectedLugar] = useState('todas');
  const [selectedCat, setSelectedCat] = useState('todas');
  const [selectedTecnico, setSelectedTecnico] = useState('todos');

  // Active Alerts for critical dates
  const activeAlerts = useMemo(() => {
    if (!programacionResult) return [];
    return generateCourseAlerts(programacionResult.asignaciones);
  }, [programacionResult]);

  // Available unique lugares, categories and tecnicos for dropdowns
  const availableLugares = useMemo(() => {
    if (!programacionResult) return [];
    const set = new Set<string>();
    programacionResult.slots.forEach(s => set.add(s.lugar));
    return Array.from(set);
  }, [programacionResult]);

  const availableCats = useMemo(() => {
    if (!programacionResult) return [];
    const set = new Set<string>();
    programacionResult.slots.forEach(s => set.add(s.cat));
    return Array.from(set);
  }, [programacionResult]);

  const availableTecnicos = useMemo(() => {
    const set = new Set<string>();
    if (tecnico) set.add(tecnico);
    savedCoordinadores.forEach(c => set.add(c));
    if (programacionResult?.tecnico) set.add(programacionResult.tecnico);
    return Array.from(set).filter(Boolean);
  }, [tecnico, savedCoordinadores, programacionResult]);

  // Counts by status
  const filterCounts = useMemo(() => {
    if (!programacionResult) return { todos: 0, alertas: 0, en_curso: 0, proximos: 0, finalizados: 0 };
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    let en_curso = 0;
    let proximos = 0;
    let finalizados = 0;

    programacionResult.asignaciones.forEach(a => {
      const status = getAlertSeverity(a, hoy);
      if (status.badgeText === 'En Curso') en_curso++;
      else if (status.severity === 'completed') finalizados++;
      else if (status.severity === 'info') proximos++;
    });

    return {
      todos: programacionResult.slots.length,
      alertas: activeAlerts.length,
      en_curso,
      proximos,
      finalizados
    };
  }, [programacionResult, activeAlerts]);

  // Filtered Slots
  const filteredSlots = useMemo(() => {
    if (!programacionResult) return [];
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    const term = searchTerm.trim().toLowerCase();

    return programacionResult.slots.filter(slot => {
      // 1. Filter by Lugar
      if (selectedLugar !== 'todas' && slot.lugar !== selectedLugar) return false;

      // 2. Filter by Categoria
      if (selectedCat !== 'todas' && slot.cat !== selectedCat) return false;

      // 3. Filter by Técnico de Seguimiento
      if (selectedTecnico !== 'todos') {
        const matchesTecnico = (programacionResult.tecnico || '').toLowerCase().includes(selectedTecnico.toLowerCase());
        if (!matchesTecnico) return false;
      }

      // Courses for this slot
      const cursosCiclo = programacionResult.asignaciones.filter(a => a.slotId === slot.id);

      // 4. Filter by Search Term
      if (term) {
        const matchesSlotName = slot.cicloNombre.toLowerCase().includes(term);
        const matchesSlotId = slot.cicloId.toLowerCase().includes(term);
        const matchesLugar = slot.lugar.toLowerCase().includes(term);
        const matchesCat = slot.cat.toLowerCase().includes(term);
        const matchesFacilitador = (programacionResult.facilitador || '').toLowerCase().includes(term);
        const matchesTecnico = (programacionResult.tecnico || '').toLowerCase().includes(term);
        const matchesCurso = cursosCiclo.some(c => c.cursoNombre.toLowerCase().includes(term));

        if (!matchesSlotName && !matchesSlotId && !matchesLugar && !matchesCat && !matchesFacilitador && !matchesTecnico && !matchesCurso) {
          return false;
        }
      }

      // 5. Filter by Status
      if (statusFilter === 'alertas') {
        const hasAlert = cursosCiclo.some(c => {
          const s = getAlertSeverity(c, hoy);
          return s.severity === 'critical' || s.severity === 'warning';
        });
        if (!hasAlert) return false;
      } else if (statusFilter === 'en_curso') {
        const hasEnCurso = cursosCiclo.some(c => hoy >= c.inicio && hoy <= c.fin);
        if (!hasEnCurso) return false;
      } else if (statusFilter === 'proximos') {
        const hasProximo = cursosCiclo.some(c => hoy < c.inicio);
        if (!hasProximo) return false;
      } else if (statusFilter === 'finalizados') {
        const hasFinalizado = cursosCiclo.some(c => hoy > c.informeFinal);
        if (!hasFinalizado) return false;
      }

      return true;
    });
  }, [programacionResult, searchTerm, statusFilter, selectedLugar, selectedCat, selectedTecnico]);

  const handleResetFilters = () => {
    setSearchTerm('');
    setStatusFilter('todos');
    setSelectedLugar('todas');
    setSelectedCat('todas');
    setSelectedTecnico('todos');
  };

  const handleClearAll = () => {
    setProgramacionResult(null);
    setErrorMessage(null);
    setWarnings([]);
    setManualDatesMap({});
    setMatrixRows([
      {
        id: 'row-1',
        cicloIndex: 0,
        cant: 1,
        lugar: 'SEDE CENTRAL - LA PAZ',
        modalidad: 'Presencial'
      }
    ]);
    setFacilitador('Lic. ');
    handleResetFilters();
  };

  return (
    <div className={`min-h-screen flex flex-col font-sans antialiased transition-colors ${isDarkMode ? 'dark bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'}`}>
      <Header
        onGeneratePDF={handleGeneratePDF}
        pdfDisabled={!programacionResult}
        totalDaysUsed={programacionResult?.daysUsed}
        isDarkMode={isDarkMode}
        onToggleDarkMode={handleToggleDarkMode}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onOpenHistory={() => setIsHistoryOpen(true)}
        onOpenShare={() => setIsShareOpen(true)}
      />

      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* Sidebar Controls */}
        <Sidebar
          modo={modo}
          onToggleModo={m => {
            setModo(m);
            setProgramacionResult(null);
            setErrorMessage(null);
            setWarnings([]);
          }}
          facilitador={facilitador}
          onChangeFacilitador={setFacilitador}
          savedDocentes={savedDocentes}
          tecnico={tecnico}
          onChangeTecnico={setTecnico}
          savedCoordinadores={savedCoordinadores}
          matrixRows={matrixRows}
          onAddMatrixRow={handleAddMatrixRow}
          onRemoveMatrixRow={handleRemoveMatrixRow}
          onUpdateMatrixRow={handleUpdateMatrixRow}
          selectedDate={selectedDate}
          onSelectDate={setSelectedDate}
          feriadosCustom={feriadosLocales}
          onGenerar={handleGenerar}
          isGenerating={isGenerating}
          isValid={isFormValid}
          totalCiclosCount={totalCiclosCount}
          onOpenAdminModal={() => setIsAdminOpen(true)}
          onClearAll={handleClearAll}
          errorMessage={errorMessage}
          warnings={warnings}
        />

        {/* Main Dashboard Panel */}
        <main className="flex-1 p-6 md:p-8 overflow-y-auto space-y-6">
          {/* Header Section from Stitch */}
          <div className="flex flex-wrap justify-between items-end gap-4 pb-2 border-b border-slate-200 dark:border-slate-800">
            <div>
              <nav className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 mb-1 flex items-center gap-2 tracking-wider">
                <span>Gestión Académica</span>
                <span className="text-slate-400 dark:text-slate-600">›</span>
                <span className="text-indigo-600 dark:text-indigo-400 font-bold">
                  {activeTab === 'cronograma' ? 'Cronograma General' : 'Dashboard Metrics'}
                </span>
              </nav>
              <h1 className="font-display text-2xl md:text-3xl font-bold text-slate-900 dark:text-white">
                {activeTab === 'cronograma' ? 'Gestión 2026' : 'Dashboard Metrics'}
              </h1>
            </div>
            <div className="flex items-center gap-3">
              {programacionResult && (
                <button
                  type="button"
                  onClick={handleClearAll}
                  className="bg-slate-100 hover:bg-red-50 dark:bg-slate-800 dark:hover:bg-red-950/50 text-slate-700 dark:text-slate-300 hover:text-red-600 dark:hover:text-red-400 border border-slate-200 dark:border-slate-700 hover:border-red-300 px-3 py-1.5 rounded-md text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
                  title="Reiniciar y crear nueva programación"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reiniciar Programación</span>
                </button>
              )}
              <div className="flex items-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-3 py-1.5 rounded-md text-xs gap-3 shadow-2xs">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                  <span className="text-slate-600 dark:text-slate-400 font-medium">Ejecución Activa</span>
                </div>
                <div className="h-3.5 w-px bg-slate-200 dark:bg-slate-700"></div>
                <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">UNEFCO La Paz</span>
              </div>
            </div>
          </div>

          {!programacionResult ? (
            <div className="h-full min-h-[400px] flex flex-col items-center justify-center text-center p-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-md shadow-2xs">
              <div className="w-14 h-14 bg-indigo-50 dark:bg-indigo-950 border border-indigo-200 dark:border-indigo-800 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-4 rounded-md">
                <FileSpreadsheet className="w-7 h-7" />
              </div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider mb-1 font-display">
                Generador y Controlador de Calendarios UNEFCO
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md leading-relaxed mb-6 font-medium">
                Ingrese el docente, asignaciones formativas y fecha de inicio de contrato en el panel de parámetros para calcular el itinerario secuencial.
              </p>
              <div className="flex flex-wrap justify-center gap-3 text-xs text-slate-700 dark:text-slate-300 font-bold uppercase tracking-wider">
                <span className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3 py-1.5 rounded-md">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  Margen Fijo 100 Días
                </span>
                <span className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3 py-1.5 rounded-md">
                  <CheckCircle2 className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  Sin Colisiones de Feriados
                </span>
              </div>
            </div>
          ) : activeTab === 'dashboard' ? (
            /* Dashboard Metrics View */
            <div className="animate-in fade-in duration-200">
              <DashboardMetrics resultado={programacionResult} isDarkMode={isDarkMode} />
            </div>
          ) : (
            /* Cronograma Detailed View */
            <div className="space-y-6 animate-in fade-in duration-200">
              {/* Critical Alerts Banner & Traffic Light Status */}
              <AlertsBanner
                alerts={activeAlerts}
                onSelectAlertFilter={() => setStatusFilter('alertas')}
                totalEnCursoCount={filterCounts.en_curso}
                totalProximosCount={filterCounts.proximos}
              />

              {/* Timeline Track */}
              <Timeline
                slots={programacionResult.slots}
                asignaciones={programacionResult.asignaciones}
                fechaInicioContrato={programacionResult.fechaInicioContrato}
                daysUsed={programacionResult.daysUsed}
              />

              {/* Search and Semaforización Quick Filter Bar */}
              <ScheduleFilterBar
                searchTerm={searchTerm}
                onSearchChange={setSearchTerm}
                statusFilter={statusFilter}
                onStatusFilterChange={setStatusFilter}
                selectedTecnico={selectedTecnico}
                onTecnicoChange={setSelectedTecnico}
                availableTecnicos={availableTecnicos}
                counts={filterCounts}
                totalCount={programacionResult.slots.length}
                filteredCount={filteredSlots.length}
                onResetFilters={handleResetFilters}
              />

              {/* Cycle Cards Container */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider flex items-center gap-2 font-display">
                    Detalle de Asignaciones y Cursos
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950 border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 font-mono">
                      {filteredSlots.length} {filteredSlots.length === 1 ? 'Ciclo Asignado' : 'Ciclos Asignados'}
                    </span>
                  </h2>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">
                    Código de Registro: <code className="text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950 border border-indigo-200 dark:border-indigo-800 px-2 py-0.5 rounded">{programacionResult.idTransaccion}</code>
                  </span>
                </div>

                {filteredSlots.length > 0 ? (
                  <div className="space-y-4">
                    {filteredSlots.map((slot, idx) => {
                      const cursosCiclo = programacionResult.asignaciones.filter(
                        a => a.slotId === slot.id
                      );

                      return (
                        <CicloCard
                          key={slot.id}
                          slot={slot}
                          index={idx}
                          cursos={cursosCiclo}
                          modo={modo}
                          onManualDateChange={handleManualDateChange}
                          manualDates={manualDatesMap}
                        />
                      );
                    })}
                  </div>
                ) : (
                  <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-8 text-center space-y-3">
                    <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
                      No se encontraron asignaciones que coincidan con los filtros aplicados.
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Intenta cambiar los términos de búsqueda o selecciona la pestaña "Todos".
                    </p>
                    <button
                      type="button"
                      onClick={handleResetFilters}
                      className="px-4 py-2 bg-indigo-600 text-white font-bold text-xs rounded-lg hover:bg-indigo-500 transition-colors cursor-pointer"
                    >
                      Restablecer Filtros
                    </button>
                  </div>
                )}
              </div>

              {/* Notification & Calendar Export Section for Docente */}
              <div className="pt-6 border-t border-slate-200 dark:border-slate-800 grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="bg-white dark:bg-slate-900 p-5 rounded-md border border-slate-200 dark:border-slate-800 shadow-2xs">
                  <h5 className="text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-2 flex items-center gap-2 uppercase tracking-wider font-mono">
                    <FileText className="w-3.5 h-3.5 text-indigo-500" />
                    Resumen Académico
                  </h5>
                  <div className="space-y-2 text-xs">
                    <p className="text-slate-700 dark:text-slate-300">
                      <strong className="text-slate-900 dark:text-white">Docente:</strong> {programacionResult.facilitador || 'Por asignar'}
                    </p>
                    {programacionResult.tecnico && (
                      <p className="text-slate-700 dark:text-slate-300">
                        <strong className="text-slate-900 dark:text-white">Técnico:</strong> {programacionResult.tecnico}
                      </p>
                    )}
                    <p className="text-slate-700 dark:text-slate-300">
                      <strong className="text-slate-900 dark:text-white">Total Cursos:</strong> {programacionResult.asignaciones.length} asignaciones
                    </p>
                  </div>
                </div>

                <div className="lg:col-span-2 bg-gradient-to-r from-indigo-900 to-slate-900 dark:from-indigo-950 dark:to-slate-950 border border-indigo-800 rounded-md p-6 relative overflow-hidden flex flex-col justify-between">
                  <div className="relative z-10 mb-4">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold font-mono bg-indigo-500/30 text-indigo-200 border border-indigo-400/30 uppercase">
                        UNEFCO La Paz
                      </span>
                      <span className="text-xs text-indigo-300 font-semibold">• Gestión de Envíos</span>
                    </div>
                    <h4 className="text-white font-display text-lg font-bold mb-1">Notificación y Calendario para el Docente</h4>
                    <p className="text-indigo-200 text-xs max-w-xl">
                      Envía directamente la programación al docente por WhatsApp o Correo, o descarga el archivo de calendario (<code className="font-mono bg-indigo-900/60 px-1 rounded text-indigo-200">.ics</code>) para agregarlo a Google Calendar.
                    </p>
                  </div>

                  <div className="relative z-10 flex flex-wrap gap-3">
                    <a
                      href={getWhatsAppShareURL(programacionResult)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-md font-bold text-xs uppercase tracking-wider flex items-center gap-2 transition-colors cursor-pointer shadow-xs"
                    >
                      <MessageSquare className="w-4 h-4" />
                      <span>WhatsApp</span>
                    </a>

                    <a
                      href={getEmailShareData(programacionResult).mailtoURL}
                      className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-md font-bold text-xs uppercase tracking-wider flex items-center gap-2 transition-colors cursor-pointer shadow-xs"
                    >
                      <Mail className="w-4 h-4" />
                      <span>Correo</span>
                    </a>

                    <button
                      onClick={() => downloadICSFile(programacionResult)}
                      className="bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded-md font-bold text-xs uppercase tracking-wider flex items-center gap-2 transition-colors cursor-pointer shadow-xs"
                    >
                      <Calendar className="w-4 h-4 text-indigo-300" />
                      <span>Google Calendar (.ics)</span>
                    </button>

                    <button
                      onClick={() => setIsShareOpen(true)}
                      className="bg-white/10 hover:bg-white/20 text-white px-3.5 py-2 rounded-md font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 transition-colors cursor-pointer ml-auto border border-white/20"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Ver Opciones</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Share & Notification Modal */}
      <ShareModal
        isOpen={isShareOpen}
        onClose={() => setIsShareOpen(false)}
        resultado={programacionResult}
      />

      {/* Geometric Balance Footer Status Bar */}
      <footer className="bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 flex items-center px-6 md:px-8 justify-between text-[10px] font-bold tracking-widest uppercase h-10 shrink-0 border-t border-slate-200 dark:border-slate-800 transition-colors">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-slate-800 dark:text-slate-200">Fase Actual: Control Total de Programación Académica</span>
        </div>
        <div className="hidden sm:flex items-center gap-4 text-slate-500 dark:text-slate-400">
          <span>UNEFCO La Paz</span>
          <span>•</span>
          <span>Modelo de Contrato: 100 Días</span>
        </div>
      </footer>

      {/* Admin Panel Modal */}
      <AdminModal
        isOpen={isAdminOpen}
        onClose={() => setIsAdminOpen(false)}
        savedDocentes={savedDocentes}
        onAddDocente={handleAddDocente}
        onRemoveDocente={handleRemoveDocente}
        savedCoordinadores={savedCoordinadores}
        onAddCoordinador={handleAddCoordinador}
        onRemoveCoordinador={handleRemoveCoordinador}
        feriadosLocales={feriadosLocales}
        onAddFeriadoLocal={handleAddFeriadoLocal}
        onRemoveFeriadoLocal={handleRemoveFeriadoLocal}
      />

      {/* History Modal */}
      <HistoryModal
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        history={history}
        onLoadSchedule={handleLoadScheduleFromHistory}
        onClearHistory={() => {
          setHistory([]);
          localStorage.removeItem('unefco_history_schedules');
        }}
        onRemoveHistoryItem={(id) => {
          const next = history.filter(h => h.idTransaccion !== id);
          setHistory(next);
        }}
      />
    </div>
  );
}


