import React, { useState, useEffect, useMemo } from 'react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from './lib/firebase';
import { Header } from './components/Header';
import { Sidebar, MainViewOption } from './components/Sidebar';
import { Timeline } from './components/Timeline';
import { CicloCard } from './components/CicloCard';
import { AdminModal } from './components/AdminModal';
import { DashboardMetrics } from './components/DashboardMetrics';
import { HistoryModal } from './components/HistoryModal';
import { ShareModal } from './components/ShareModal';
import { EventoView } from './components/EventoView';
import { ProgramarView, MatrixRowItem } from './components/ProgramarView';
import { AlertsBanner } from './components/AlertsBanner';
import { ScheduleFilterBar, StatusFilterType } from './components/ScheduleFilterBar';
import { LoginScreen } from './components/LoginScreen';
import { UserManagementModal } from './components/UserManagementModal';
import { InactivityModal } from './components/InactivityModal';
import { generateCourseAlerts, getAlertSeverity } from './utils/alertUtils';
import { downloadICSFile, getWhatsAppShareURL, getEmailShareData } from './utils/calendarAndSharing';
import { OFERTA_FORMATIVA_UNEFCO_2026 } from './data/ofertaFormativa';
import { 
  SlotAsignacion, 
  ProgramacionResultado, 
  Modalidad, 
  ManualCourseInput,
  UserProfile,
  UserRole
} from './types';
import { calculateSchedulerAuto, calculateSchedulerManual } from './utils/scheduler';
import { generatePDFDocument } from './utils/pdfGenerator';
import { ShieldCheck, FileSpreadsheet, FileText, CheckCircle2, LayoutDashboard, CalendarDays, Send, Mail, Calendar, Download, MessageSquare, RotateCcw, ShieldAlert } from 'lucide-react';

import { getLoggedInUser, clearLoggedInUser, saveLoggedInUser } from './utils/authService';

export default function App() {
  // Auth State
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [authLoading, setAuthLoading] = useState<boolean>(true);
  const [isUserMgmtOpen, setIsUserMgmtOpen] = useState<boolean>(false);

  // Active Role Selection (Option A)
  const [activeRole, setActiveRole] = useState<UserRole>('tecnico');

  // Sync activeRole with currentUser role when user logs in
  useEffect(() => {
    if (currentUser) {
      setActiveRole(currentUser.role || 'tecnico');
    }
  }, [currentUser]);

  const handleToggleActiveRole = () => {
    if (currentUser?.role !== 'admin') return;
    setActiveRole(prev => (prev === 'admin' ? 'tecnico' : 'admin'));
  };

  // Inactivity & Session Timeout Management
  const [showInactivityModal, setShowInactivityModal] = useState<boolean>(false);
  const [inactivityRemainingSeconds, setInactivityRemainingSeconds] = useState<number>(60);

  useEffect(() => {
    if (!currentUser) return;

    let inactivityTimer: NodeJS.Timeout;
    const INACTIVITY_TIMEOUT_MS = 9 * 60 * 1000; // 9 minutes of inactivity before warning

    const resetInactivityTimer = () => {
      if (showInactivityModal) return;
      clearTimeout(inactivityTimer);
      inactivityTimer = setTimeout(() => {
        setShowInactivityModal(true);
        setInactivityRemainingSeconds(60);
      }, INACTIVITY_TIMEOUT_MS);
    };

    const activityEvents = ['mousemove', 'keydown', 'click', 'scroll', 'touchstart'];
    activityEvents.forEach(evt => window.addEventListener(evt, resetInactivityTimer));
    resetInactivityTimer();

    return () => {
      clearTimeout(inactivityTimer);
      activityEvents.forEach(evt => window.removeEventListener(evt, resetInactivityTimer));
    };
  }, [currentUser, showInactivityModal]);

  // Handle countdown when inactivity modal is visible
  useEffect(() => {
    if (!showInactivityModal) return;

    const interval = setInterval(() => {
      setInactivityRemainingSeconds(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          handleSignOut();
          setShowInactivityModal(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [showInactivityModal]);

  const handleExtendSession = () => {
    setShowInactivityModal(false);
    setInactivityRemainingSeconds(60);
  };

  // Theme & Views
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    return localStorage.getItem('unefco_dark_mode') === 'true';
  });
  const [activeTab, setActiveTab] = useState<'cronograma' | 'dashboard'>('cronograma');
  const [selectedView, setSelectedView] = useState<MainViewOption>('programar');
  const [isHistoryOpen, setIsHistoryOpen] = useState<boolean>(false);
  const [isShareOpen, setIsShareOpen] = useState<boolean>(false);

  // User Session Listener
  useEffect(() => {
    // Check saved local user session first
    const savedUser = getLoggedInUser();
    if (savedUser && savedUser.status === 'active') {
      setCurrentUser(savedUser);
      if (savedUser.displayName) {
        setTecnico(savedUser.displayName);
      }
      setAuthLoading(false);
    } else {
      clearLoggedInUser();
      setAuthLoading(false);
    }

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const userRef = doc(db, 'users', firebaseUser.uid);
          const snap = await getDoc(userRef);
          if (snap.exists()) {
            const profile = { uid: firebaseUser.uid, ...snap.data() } as UserProfile;
            if (profile.status === 'inactive') {
              alert('Su cuenta ha sido desactivada por el Administrador Juan Carlos Calle Chávez.');
              await signOut(auth);
              clearLoggedInUser();
              setCurrentUser(null);
            } else {
              setCurrentUser(profile);
              saveLoggedInUser(profile);
              if (profile.displayName) {
                setTecnico(profile.displayName);
              }
            }
          }
        } catch (err) {
          console.warn('Syncing auth state warning:', err);
        }
      }
    });

    return () => unsubscribe();
  }, []);

  // Ensure tecnico state stays synced with logged in currentUser
  useEffect(() => {
    if (currentUser?.displayName) {
      setTecnico(currentUser.displayName);
    }
  }, [currentUser]);

  const handleSignOut = async () => {
    // Save draft state before logging out if form has input
    if (facilitador || ci) {
      const draftState = {
        facilitador,
        ci,
        matrixRows,
        selectedDate: selectedDate ? selectedDate.toISOString() : null,
        savedAt: new Date().toISOString()
      };
      localStorage.setItem('unefco_form_draft', JSON.stringify(draftState));
    }

    try {
      await signOut(auth);
    } catch (err) {
      // Ignore
    }
    clearLoggedInUser();
    setCurrentUser(null);
  };

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
  const [ci, setCi] = useState<string>('6849201');
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
      return [res, ...filtered].slice(0, 30);
    });
  };

  // Cancellation and deletion logic with active role authorization
  const handleAnularHistoryItem = (idTransaccion: string, motivo: string) => {
    setHistory(prev =>
      prev.map(item => {
        if (item.idTransaccion === idTransaccion) {
          if (activeRole === 'tecnico' && item.tecnico !== (currentUser?.displayName || tecnico)) {
            alert('Restricción de Seguridad: El Técnico de Seguimiento solo puede anular sus propios cronogramas.');
            return item;
          }
          return {
            ...item,
            estado: 'ANULADO',
            motivoAnulacion: motivo,
            fechaAnulacion: new Date(),
            usuarioAnulador: currentUser?.displayName || tecnico
          };
        }
        return item;
      })
    );
  };

  const handleDeleteHistoryItem = (idTransaccion: string) => {
    if (activeRole !== 'admin') {
      alert('Acceso Denegado: Solo el Administrador del Sistema puede eliminar registros permanentemente del historial.');
      return;
    }
    setHistory(prev => prev.filter(item => item.idTransaccion !== idTransaccion));
  };

  // Expand matrix rows into Slots array
  const currentSlots = useMemo<SlotAsignacion[]>(() => {
    const slots: SlotAsignacion[] = [];
    matrixRows.forEach((row, rIdx) => {
      const oferta = OFERTA_FORMATIVA_UNEFCO_2026[row.cicloIndex];
      let courseList = oferta.cursos;

      // Exceptional / Single Course Assignment
      if (row.isExceptional && typeof row.selectedCursoIndex === 'number' && row.selectedCursoIndex >= 0) {
        const singleCourse = oferta.cursos[row.selectedCursoIndex];
        if (singleCourse) {
          courseList = [singleCourse];
        }
      }

      for (let g = 0; g < row.cant; g++) {
        slots.push({
          id: `${oferta.id}-${rIdx + 1}-${g + 1}`,
          cicloId: oferta.id,
          cicloNombre: oferta.nombre,
          cat: oferta.cat,
          duracionCurso: oferta.duracionDiasCurso,
          cursos: courseList,
          lugar: (row.lugar || (oferta.cat === 'TACFI' ? 'SEDE CENTRAL - LA PAZ' : 'SEDE VIACHA')).toUpperCase(),
          modalidad: row.modalidad,
          isExceptional: row.isExceptional,
          selectedCursoIndex: row.selectedCursoIndex
        });
      }
    });
    return slots;
  }, [matrixRows]);

  const totalCiclosCount = currentSlots.length;
  const isFormValid =
    (facilitador || '').trim() !== '' &&
    (ci || '').trim() !== '' &&
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
    if (!selectedDate || !facilitador || !ci) return;
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
        feriadosLocales,
        ci
      );

      if (errorMsg) {
        setErrorMessage(errorMsg);
        setProgramacionResult(null);
      } else {
        setProgramacionResult(resultado);
        if (resultado) saveToHistory(resultado);
        setSelectedView('eventos');
      }
      setIsGenerating(false);
    }, 300);
  };

  // Trigger Manual Calculation
  const triggerCalculationManual = (datesMap = manualDatesMap) => {
    if (!selectedDate || !facilitador || !ci) return;
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
      feriadosLocales,
      ci
    );

    setProgramacionResult(resultado);
    setWarnings(warnList);
    if (resultado) saveToHistory(resultado);
    setSelectedView('eventos');
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

  if (authLoading) {
    return (
      <div className={`min-h-screen flex items-center justify-center p-4 transition-colors ${
        isDarkMode ? 'dark bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'
      }`}>
        <div className="text-center space-y-3">
          <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">
            Cargando Seguridad UNEFCO...
          </p>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <LoginScreen
        onLoginSuccess={(u) => {
          setCurrentUser(u);
          setTecnico(u.displayName);
        }}
        isDarkMode={isDarkMode}
      />
    );
  }

  return (
    <div className={`min-h-screen flex flex-col font-sans antialiased transition-colors ${isDarkMode ? 'dark bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'}`}>
      <Header
        isDarkMode={isDarkMode}
        onToggleDarkMode={handleToggleDarkMode}
        currentUser={currentUser}
        onOpenUserManagement={() => setIsUserMgmtOpen(true)}
        onSignOut={handleSignOut}
      />


      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* Sidebar Controls */}
        <Sidebar
          selectedView={selectedView}
          onSelectView={v => {
            if (v === 'historial') {
              setIsHistoryOpen(true);
            } else {
              setSelectedView(v);
            }
          }}
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
          activeTab={activeTab}
          onTabChange={setActiveTab}
          onOpenHistory={() => setIsHistoryOpen(true)}
          onOpenShare={() => setIsShareOpen(true)}
          onGeneratePDF={handleGeneratePDF}
          pdfDisabled={!programacionResult}
          onOpenUserManagement={() => setIsUserMgmtOpen(true)}
          currentUserRole={currentUser?.role}
          currentUser={currentUser}
          hasResult={!!programacionResult}
        />

        {/* Main Dashboard Panel */}
        <main className="flex-1 p-6 md:p-8 overflow-y-auto space-y-6">
          {/* Header Section */}
          <div className="flex flex-wrap justify-between items-end gap-4 pb-2 border-b border-slate-200 dark:border-slate-800">
            <div>
              <nav className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 mb-1 flex items-center gap-2 tracking-wider">
                <span>Gestión Académica</span>
                <span className="text-slate-400 dark:text-slate-600">›</span>
                <span className="text-indigo-600 dark:text-indigo-400 font-bold">
                  {selectedView === 'programar' && 'Programación y Parámetros'}
                  {selectedView === 'eventos' && 'Evento y Cursos Programados'}
                  {selectedView === 'dashboard' && 'Métricas e Indicadores'}
                  {selectedView === 'historial' && 'Historial de Programaciones'}
                </span>
              </nav>
              <h1 className="font-display text-2xl md:text-3xl font-bold text-slate-900 dark:text-white">
                {selectedView === 'programar' && 'Programar Cronograma'}
                {selectedView === 'eventos' && 'Cursos del Evento'}
                {selectedView === 'dashboard' && 'Dashboard y Métricas'}
                {selectedView === 'historial' && 'Historial Registrado'}
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

          {/* Dynamic Views */}
          {selectedView === 'programar' && (
            <ProgramarView
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
              ci={ci}
              onChangeCi={setCi}
              history={history}
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
              onClearAll={handleClearAll}
              errorMessage={errorMessage}
              warnings={warnings}
              currentUser={currentUser}
            />
          )}

          {selectedView === 'eventos' && (
            <EventoView
              resultado={programacionResult}
              onGoToProgramar={() => setSelectedView('programar')}
              filteredSlots={filteredSlots}
              modo={modo}
              onManualDateChange={handleManualDateChange}
              manualDatesMap={manualDatesMap}
              activeAlerts={activeAlerts}
              filterCounts={filterCounts}
              searchTerm={searchTerm}
              onSearchChange={setSearchTerm}
              statusFilter={statusFilter}
              onStatusFilterChange={setStatusFilter}
              selectedTecnico={selectedTecnico}
              onTecnicoChange={setSelectedTecnico}
              availableTecnicos={availableTecnicos}
              onResetFilters={handleResetFilters}
            />
          )}

          {selectedView === 'dashboard' && (
            <div className="animate-in fade-in duration-200">
              {programacionResult ? (
                <DashboardMetrics resultado={programacionResult} isDarkMode={isDarkMode} />
              ) : (
                <div className="min-h-[350px] flex flex-col items-center justify-center p-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-center">
                  <LayoutDashboard className="w-12 h-12 text-slate-400 mb-3" />
                  <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider mb-1">
                    No hay datos de Dashboard disponibles
                  </h3>
                  <p className="text-xs text-slate-500 max-w-sm mb-4">
                    Genere un cronograma primero para visualizar las métricas y la tasa de cumplimiento.
                  </p>
                  <button
                    onClick={() => setSelectedView('programar')}
                    className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs px-4 py-2 rounded-xl uppercase tracking-wider"
                  >
                    Ir a Programar
                  </button>
                </div>
              )}
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
        currentUser={currentUser}
      />

      {/* History Modal */}
      <HistoryModal
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        history={history}
        onSelectHistoryItem={(item) => {
          setProgramacionResult(item);
          setSelectedView('eventos');
          setIsHistoryOpen(false);
        }}
        onAnularHistoryItem={handleAnularHistoryItem}
        onDeleteHistoryItem={handleDeleteHistoryItem}
        currentUser={currentUser}
        activeRole={activeRole}
      />

      {/* User & Technician Management Modal */}
      {currentUser && (
        <UserManagementModal
          isOpen={isUserMgmtOpen}
          onClose={() => setIsUserMgmtOpen(false)}
          currentUser={currentUser}
        />
      )}

      {/* Inactivity Security Warning Modal */}
      <InactivityModal
        isOpen={showInactivityModal}
        remainingSeconds={inactivityRemainingSeconds}
        onExtendSession={handleExtendSession}
        onSignOut={handleSignOut}
      />
    </div>
  );
}



