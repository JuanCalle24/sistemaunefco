import React, { useState, useEffect, useMemo } from 'react';
import { supabase, isSupabaseConfigured } from './lib/supabase';
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
import { ShieldCheck, FileSpreadsheet, FileText, CheckCircle2, LayoutDashboard, CalendarDays, Send, Mail, Calendar, Download, MessageSquare, RotateCcw, ShieldAlert, Sliders } from 'lucide-react';

import { getLoggedInUser, clearLoggedInUser, saveLoggedInUser } from './utils/authService';
import { saveScheduleToFirestore, subscribeToSchedules, deleteScheduleFromFirestore, clearAllSchedulesFromFirestore } from './services/scheduleService';
import { CorrelativoRecord, subscribeToCorrelativos } from './services/correlativoService';
import { CorrelativosModule } from './components/CorrelativosModule';

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

  // User Session Listener via Supabase Auth
  useEffect(() => {
    const savedUser = getLoggedInUser();
    if (savedUser && savedUser.status === 'active') {
      setCurrentUser(savedUser);
      if (savedUser.displayName) {
        setTecnico(savedUser.displayName);
      }
      setAuthLoading(false);
    } else {
      clearLoggedInUser();
      setCurrentUser(null);
      setAuthLoading(false);
    }

    if (isSupabaseConfigured) {
      const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
        if (event === 'SIGNED_OUT' || !session) {
          clearLoggedInUser();
          setCurrentUser(null);
        } else if (session?.user) {
          try {
            const { data: profileData } = await supabase
              .from('usuarios')
              .select('*')
              .or(`auth_user_id.eq.${session.user.id},email.eq.${session.user.email}`)
              .maybeSingle();

            const profile: UserProfile = {
              uid: session.user.id,
              email: session.user.email || '',
              displayName: profileData?.display_name || session.user.user_metadata?.display_name || session.user.email || 'Usuario',
              role: (profileData?.role as UserRole) || 'tecnico',
              status: profileData?.status || 'active',
              cargo: profileData?.cargo || 'Técnico de Seguimiento Pedagógico',
              lastLogin: new Date().toISOString(),
            };

            if (profile.status === 'inactive') {
              await supabase.auth.signOut();
              clearLoggedInUser();
              setCurrentUser(null);
              alert('Su cuenta ha sido desactivada.');
            } else {
              setCurrentUser(profile);
              saveLoggedInUser(profile);
              if (profile.displayName) {
                setTecnico(profile.displayName);
              }
            }
          } catch (err) {
            console.warn('[Supabase] Auth listener sync warning:', err);
          }
        }
      });

      return () => {
        subscription.unsubscribe();
      };
    }
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
      if (isSupabaseConfigured) {
        await supabase.auth.signOut();
      }
    } catch (err) {
      // Ignore
    }
    clearLoggedInUser();
    setCurrentUser(null);
    setTecnico('');
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

  // User-filtered history so each technician only sees their own programming
  const userHistory = useMemo(() => {
    if (!currentUser?.displayName) return history;
    const currentName = currentUser.displayName.trim().toLowerCase();
    return history.filter(h => !h.tecnico || h.tecnico.trim().toLowerCase() === currentName);
  }, [history, currentUser]);
  const [modo, setModo] = useState<'automatico' | 'manual'>('automatico');

  // Personal
  const [facilitador, setFacilitador] = useState<string>('');
  const [ci, setCi] = useState<string>('');
  const [tecnico, setTecnico] = useState<string>(() => currentUser?.displayName || '');

  const [savedDocentes, setSavedDocentes] = useState<string[]>(() => {
    const local = localStorage.getItem('unefco_docentes');
    return local ? JSON.parse(local) : [];
  });

  const [savedCoordinadores, setSavedCoordinadores] = useState<string[]>(() => {
    const local = localStorage.getItem('unefco_coordinadores');
    return local ? JSON.parse(local) : [];
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
      modalidad: 'Semipresencial'
    }
  ]);

  // Contract Start Date
  const [selectedDate, setSelectedDate] = useState<Date | null>(() => {
    return new Date(2026, 6, 22); // 22/07/2026
  });

  // Course 1 Start Date (independent of contract start)
  const [fechaInicioCurso1, setFechaInicioCurso1] = useState<Date | null>(null);

  // Scheduling Density Regulator (holgura in days)
  const [holguraDias, setHolguraDias] = useState<number>(0);

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

  // Real-time listener for Firestore database sync
  useEffect(() => {
    const unsubscribe = subscribeToSchedules((remoteSchedules) => {
      setHistory(remoteSchedules || []);
    });
    return () => unsubscribe();
  }, []);

  // Real-time listener for Correlativos
  const [correlativoRecords, setCorrelativoRecords] = useState<CorrelativoRecord[]>([]);
  useEffect(() => {
    const unsubscribe = subscribeToCorrelativos((records) => {
      setCorrelativoRecords(records);
    });
    return () => unsubscribe();
  }, []);

  // Helper to save schedule to history with active role transparency and Firestore sync
  const saveToHistory = (res: ProgramacionResultado) => {
    const enrichedRes: ProgramacionResultado = {
      ...res,
      rolOperador: res.rolOperador || activeRole,
      usuarioRegistro: res.usuarioRegistro || currentUser?.displayName || tecnico
    };
    setProgramacionResult(enrichedRes);
    setHistory(prev => {
      const filtered = prev.filter(item => item.idTransaccion !== enrichedRes.idTransaccion);
      return [enrichedRes, ...filtered].slice(0, 30);
    });
    // Sync seamlessly to Firestore database
    saveScheduleToFirestore(enrichedRes);
  };

  // Cancellation and deletion logic with active role authorization and Firestore sync
  const handleAnularHistoryItem = (idTransaccion: string, motivo: string) => {
    const currentUserName = (currentUser?.displayName || tecnico).trim().toLowerCase();
    let updatedTarget: ProgramacionResultado | null = null;
    setHistory(prev =>
      prev.map(item => {
        if (item.idTransaccion === idTransaccion) {
          const itemTech = (item.tecnico || '').trim().toLowerCase();
          const itemReg = (item.usuarioRegistro || '').trim().toLowerCase();

          if (activeRole === 'tecnico' && itemTech !== currentUserName && itemReg !== currentUserName) {
            alert('Restricción de Seguridad: En Modo Técnico de Seguimiento solo puedes anular tus propios cronogramas. Cambia a Modo Administrador si necesitas anular registros de otros técnicos.');
            return item;
          }

          const updated: ProgramacionResultado = {
            ...item,
            estado: 'ANULADO',
            motivoAnulacion: motivo,
            fechaAnulacion: new Date() as any,
            usuarioAnulador: currentUser?.displayName || tecnico
          };
          updatedTarget = updated;
          return updated;
        }
        return item;
      })
    );
    if (updatedTarget) {
      saveScheduleToFirestore(updatedTarget);
    }
  };

  const handleDeleteHistoryItem = async (idTransaccion: string) => {
    setHistory(prev => {
      const next = prev.filter(item => item.idTransaccion !== idTransaccion);
      localStorage.setItem('unefco_history_schedules', JSON.stringify(next));
      return next;
    });
    await deleteScheduleFromFirestore(idTransaccion);
  };

  const handleClearHistory = async () => {
    setHistory([]);
    localStorage.removeItem('unefco_history_schedules');
    await clearAllSchedulesFromFirestore();
  };

  // Expand matrix rows into Slots array
  const currentSlots = useMemo<SlotAsignacion[]>(() => {
    const slots: SlotAsignacion[] = [];
    matrixRows.forEach((row, rIdx) => {
      const oferta = OFERTA_FORMATIVA_UNEFCO_2026[row.cicloIndex];
      let courseList = oferta.cursos;

      // Exceptional / Single Course Assignment
      if (row.isExceptional) {
        const selectedIdx = typeof row.selectedCursoIndex === 'number' ? row.selectedCursoIndex : 0;
        const singleCourse = oferta.cursos[selectedIdx] || oferta.cursos[0];
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
      modalidad: 'Semipresencial'
    };
    setMatrixRows([...matrixRows, newRow]);
  };

  const handleRemoveMatrixRow = (id: string) => {
    if (matrixRows.length <= 1) return;
    setMatrixRows(matrixRows.filter(r => r.id !== id));
  };

  const handleUpdateMatrixRow = (
    id: string,
    fieldOrUpdates: keyof MatrixRowItem | Partial<MatrixRowItem>,
    value?: any
  ) => {
    setMatrixRows(prevRows =>
      prevRows.map(r => {
        if (r.id === id) {
          if (typeof fieldOrUpdates === 'object' && fieldOrUpdates !== null) {
            const updates = { ...fieldOrUpdates };
            if (typeof updates.lugar === 'string') {
              updates.lugar = updates.lugar.toUpperCase();
            }
            return { ...r, ...updates };
          }
          const fieldKey = fieldOrUpdates as keyof MatrixRowItem;
          const val = fieldKey === 'lugar' && typeof value === 'string' ? value.toUpperCase() : value;
          return { ...r, [fieldKey]: val };
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
        ci,
        fechaInicioCurso1,
        holguraDias
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

    const { resultado, warnings: warnList, errorMsg } = calculateSchedulerManual(
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

    if (errorMsg) {
      setErrorMessage(errorMsg);
      // Do not save to history or automatically jump views when there is a blocking 100-day limit error
    } else {
      setErrorMessage(null);
      if (resultado) saveToHistory(resultado);
      setSelectedView('eventos');
    }
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
        modalidad: 'Semipresencial'
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
    <div className={`min-h-screen flex flex-col font-sans antialiased relative overflow-x-hidden transition-colors ${isDarkMode ? 'dark bg-[#1e1f21] text-zinc-100' : 'bg-[#f8f9fa] text-zinc-900'}`}>
      <Header
        isDarkMode={isDarkMode}
        onToggleDarkMode={handleToggleDarkMode}
        currentUser={currentUser}
        onOpenUserManagement={() => setIsUserMgmtOpen(true)}
        onSignOut={handleSignOut}
        activeRole={activeRole}
        onToggleActiveRole={handleToggleActiveRole}
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
          activeRole={activeRole}
          hasResult={!!programacionResult}
        />

        {/* Main Dashboard Panel */}
        <main className="flex-1 p-6 md:p-8 overflow-y-auto space-y-6">
          {/* Header Section */}
          <div className="flex flex-wrap justify-between items-end gap-4 pb-3 border-b border-zinc-200 dark:border-zinc-800">
            <div>
              <nav className="text-[11px] uppercase font-black text-zinc-500 dark:text-zinc-400 mb-1 flex items-center gap-2 tracking-wider">
                <span className="text-emerald-700 dark:text-emerald-400 font-extrabold">Gestión Académica</span>
                <span className="text-zinc-300 dark:text-zinc-700">/</span>
                <span className="text-zinc-700 dark:text-zinc-200 font-bold">
                  {selectedView === 'programar' && 'Programación y Parámetros'}
                  {selectedView === 'eventos' && 'Calendario y Módulos Programados'}
                  {selectedView === 'dashboard' && 'Resumen Académico e Indicadores'}
                  {selectedView === 'historial' && 'Historial de Calendarios Académicos'}
                  {selectedView === 'correlativos' && 'Correlativos UNEFCO'}
                </span>
              </nav>
              <h1 className="font-display text-2xl md:text-3xl font-black text-zinc-900 dark:text-white tracking-tight">
                {selectedView === 'programar' && 'Programar Calendario Académico'}
                {selectedView === 'eventos' && 'Calendario de Eventos y Cursos'}
                {selectedView === 'dashboard' && 'Resumen Académico UNEFCO'}
                {selectedView === 'historial' && 'Historial de Calendarios'}
                {selectedView === 'correlativos' && 'Correlativos UNEFCO'}
              </h1>
            </div>
            <div className="flex items-center gap-3">
              {programacionResult && (
                <button
                  type="button"
                  onClick={handleClearAll}
                  className="bg-zinc-100 hover:bg-red-50 dark:bg-zinc-800 dark:hover:bg-red-950/50 text-zinc-700 dark:text-zinc-300 hover:text-red-600 dark:hover:text-red-400 border border-zinc-200 dark:border-zinc-700 hover:border-red-300 px-3 py-1.5 rounded-md text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
                  title="Reiniciar y crear nueva programación"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reiniciar Programación</span>
                </button>
              )}
              <div className="flex items-center bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 px-3 py-1.5 rounded-md text-xs gap-3 shadow-2xs">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                  <span className="text-zinc-600 dark:text-zinc-400 font-medium">Ejecución Activa</span>
                </div>
                <div className="h-3.5 w-px bg-zinc-200 dark:bg-zinc-700"></div>
                <span className="font-mono font-bold text-emerald-700 dark:text-emerald-400">UNEFCO La Paz</span>
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
              history={userHistory}
              tecnico={tecnico}
              onChangeTecnico={setTecnico}
              savedCoordinadores={savedCoordinadores}
              matrixRows={matrixRows}
              onAddMatrixRow={handleAddMatrixRow}
              onRemoveMatrixRow={handleRemoveMatrixRow}
              onUpdateMatrixRow={handleUpdateMatrixRow}
              selectedDate={selectedDate}
              onSelectDate={setSelectedDate}
              fechaInicioCurso1={fechaInicioCurso1}
              onSelectFechaInicioCurso1={setFechaInicioCurso1}
              holguraDias={holguraDias}
              onChangeHolguraDias={setHolguraDias}
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
              onGuardarSeguimiento={() => programacionResult && saveToHistory(programacionResult)}
              onGenerarPDF={handleGeneratePDF}
              onCompartir={() => setIsShareOpen(true)}
            />
          )}

          {selectedView === 'dashboard' && (
            <div className="animate-in fade-in duration-200">
              <DashboardMetrics 
                resultado={programacionResult} 
                isDarkMode={isDarkMode} 
                activeRole={activeRole}
                currentUser={currentUser}
                history={userHistory}
                correlativoRecords={correlativoRecords}
                onGoToProgramar={(nombre, ciNum) => {
                  if (nombre) setFacilitador(nombre);
                  if (ciNum) setCi(ciNum);
                  setSelectedView('programar');
                }}
              />
            </div>
          )}

          {selectedView === 'correlativos' && (
            <CorrelativosModule
              currentUser={currentUser}
              activeRole={activeRole}
              tecnicoName={tecnico}
              schedulesHistory={userHistory}
              onPreloadFacilitadorForSchedule={(nombre, cNum, cComp) => {
                setFacilitador(nombre);
                setCi(cNum);
                setSelectedView('programar');
              }}
            />
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
      <footer className="bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 flex items-center px-6 md:px-8 justify-between text-[10px] font-bold tracking-widest uppercase h-10 shrink-0 border-t border-zinc-200 dark:border-zinc-800 transition-colors">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-zinc-800 dark:text-zinc-200">Fase Actual: Control Total de Programación Académica</span>
        </div>
        <div className="hidden sm:flex items-center gap-4 text-zinc-500 dark:text-zinc-400">
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
        history={userHistory}
        onSelectHistoryItem={(item) => {
          setProgramacionResult(item);
          setSelectedView('eventos');
          setIsHistoryOpen(false);
        }}
        onAnularHistoryItem={handleAnularHistoryItem}
        onDeleteHistoryItem={handleDeleteHistoryItem}
        onClearHistory={handleClearHistory}
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



