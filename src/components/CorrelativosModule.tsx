import React, { useState, useEffect, useMemo } from 'react';
import { 
  Stamp, 
  FileCheck2, 
  FileText, 
  AlertCircle, 
  CheckCircle2, 
  Copy, 
  Check, 
  Search, 
  RotateCcw, 
  Clock, 
  UserCheck, 
  Calendar, 
  AlertTriangle, 
  XCircle, 
  Info,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Hash,
  Lock
} from 'lucide-react';
import { 
  CorrelativoRecord, 
  CorrelativoCounters, 
  DEFAULT_COUNTERS, 
  saveCorrelativoRecord, 
  subscribeToCorrelativos, 
  subscribeToCounters 
} from '../services/correlativoService';
import { ProgramacionResultado, UserProfile } from '../types';

const YEAR = 2026;

export const DOC_TYPES = [
  { 
    id: 'cp' as const, 
    label: 'Paso 1 · SOLICITUD DE CERTIFICACIÓN PRESUPUESTARIA', 
    prefix: 'UNEFCO-LP Nº', 
    short: 'Certificación Presupuestaria',
    badge: 'CP',
    color: 'from-emerald-600 to-teal-700'
  },
  { 
    id: 'inf' as const, 
    label: 'Paso 2 · INFORME DE JUSTIFICACIÓN', 
    prefix: 'UNEFCO/UAF/INF-LP Nº', 
    short: 'Informe de Justificación',
    badge: 'INF',
    color: 'from-amber-600 to-orange-700'
  },
  { 
    id: 'ini' as const, 
    label: 'Paso 3 · SOLICITUD DE AUTORIZACIÓN DE INICIO DE PROCESO DE CONTRATACIÓN', 
    prefix: 'UNEFCO-LP Nº', 
    short: 'Inicio de Contratación',
    badge: 'INI',
    color: 'from-emerald-700 to-teal-800'
  },
];

const STEP_ORDER = ['cp', 'inf', 'ini'] as const;

interface CorrelativosModuleProps {
  currentUser: UserProfile | null;
  activeRole: 'admin' | 'tecnico';
  tecnicoName: string;
  schedulesHistory?: ProgramacionResultado[];
  onPreloadFacilitadorForSchedule?: (nombre: string, ci: string, ciComp: string) => void;
}

export const CorrelativosModule: React.FC<CorrelativosModuleProps> = ({
  currentUser,
  activeRole,
  tecnicoName,
  schedulesHistory = [],
  onPreloadFacilitadorForSchedule
}) => {
  // Real-time Firestore State
  const [records, setRecords] = useState<CorrelativoRecord[]>([]);
  const [counters, setCounters] = useState<CorrelativoCounters>(DEFAULT_COUNTERS);

  // Form State
  const [ciNum, setCiNum] = useState('');
  const [ciComp, setCiComp] = useState('');
  const [facilitador, setFacilitador] = useState('');
  const [tipo, setTipo] = useState<'cp' | 'inf' | 'ini'>('cp');
  
  // UI & Feedback State
  const [isGenerating, setIsGenerating] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [lastGenerated, setLastGenerated] = useState<CorrelativoRecord | null>(null);
  const [isCopied, setIsCopied] = useState(false);
  const [copyPulse, setCopyPulse] = useState(false);

  // Success Modal & Card Copy State
  const [successModalRecord, setSuccessModalRecord] = useState<CorrelativoRecord | null>(null);
  const [modalCopied, setModalCopied] = useState(false);
  const [stepCopiedId, setStepCopiedId] = useState<string | null>(null);

  // Cancellation Modal State
  const [anularModalRecord, setAnularModalRecord] = useState<CorrelativoRecord | null>(null);
  const [anularMotivo, setAnularMotivo] = useState('');

  // History Filter State
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth());

  // Subscribe to Firestore Real-time Updates
  useEffect(() => {
    const unsubRecords = subscribeToCorrelativos((data) => {
      setRecords(data);
    });
    const unsubCounters = subscribeToCounters((cnt) => {
      setCounters(cnt);
    });

    return () => {
      unsubRecords();
      unsubCounters();
    };
  }, []);

  // Format CI String
  const formatCI = (num: string, comp: string) => {
    const cleanNum = num.trim();
    const cleanComp = comp.trim().toUpperCase();
    return cleanComp ? `${cleanNum}-${cleanComp}` : cleanNum;
  };

  const currentCiFull = formatCI(ciNum, ciComp);

  // 1. Progress of a CI Helper
  const hasActiveRecord = (ciString: string, docType: 'cp' | 'inf' | 'ini') => {
    return records.some(
      (r) => r.ciCompleta === ciString && r.tipo === docType && r.estado === 'Activo'
    );
  };

  const getProgressOfCI = (ciString: string) => {
    if (!ciString) return { done: [], nextStep: 'cp' as const };
    const done = STEP_ORDER.filter((t) => hasActiveRecord(ciString, t));
    const nextStep = STEP_ORDER.find((t) => !done.includes(t)) || null;
    return { done, nextStep };
  };

  const ciProgress = useMemo(() => {
    return getProgressOfCI(currentCiFull);
  }, [currentCiFull, records]);

  // 2. Active Contract Check (100 days)
  const activeContractInfo = useMemo(() => {
    if (!currentCiFull) return null;

    // Check if there is an active contract in schedulesHistory or correlativos with contract start date
    const foundSchedule = schedulesHistory.find((s) => {
      const scheduleCI = formatCI(s.ci || '', s.ciComplemento || '');
      return scheduleCI === currentCiFull && s.estado !== 'ANULADO' && s.fechaInicioContrato;
    });

    if (foundSchedule && foundSchedule.fechaInicioContrato) {
      const startDate = new Date(foundSchedule.fechaInicioContrato);
      const endDate = foundSchedule.limiteContrato ? new Date(foundSchedule.limiteContrato) : new Date(startDate.getTime() + 100 * 24 * 60 * 60 * 1000);
      const today = new Date();
      
      const diffTime = Math.abs(today.getTime() - startDate.getTime());
      const daysElapsed = Math.floor(diffTime / (1000 * 60 * 60 * 24));

      if (today <= endDate) {
        return {
          isActive: true,
          startDate,
          endDate,
          daysElapsed,
          daysRemaining: Math.max(0, 100 - daysElapsed),
          source: 'Cronograma Académico Programado'
        };
      }
    }

    return null;
  }, [currentCiFull, schedulesHistory]);

  // Auto-suggest Next Document Type when CI changes
  useEffect(() => {
    if (ciNum.length >= 5) {
      if (ciProgress.nextStep) {
        setTipo(ciProgress.nextStep);
      }
    }
  }, [ciNum, ciComp, ciProgress.nextStep]);

  // Check for auto-filling name if CI already exists in system records
  useEffect(() => {
    if (currentCiFull && currentCiFull.length >= 5) {
      const matchCorrelativo = records.find((r) => r.ciCompleta === currentCiFull);
      if (matchCorrelativo && !facilitador) {
        setFacilitador(matchCorrelativo.nombreFacilitador);
      } else {
        const matchSchedule = schedulesHistory.find((s) => formatCI(s.ci || '', s.ciComplemento || '') === currentCiFull);
        if (matchSchedule && matchSchedule.facilitador && !facilitador) {
          setFacilitador(matchSchedule.facilitador.toUpperCase());
        }
      }
    }
  }, [currentCiFull, records, schedulesHistory, facilitador]);

  // Validate Flow before Generating
  const validateFlow = (): string | null => {
    if (!facilitador.trim()) {
      return 'El nombre completo del facilitador es obligatorio.';
    }
    if (!ciNum.trim()) {
      return 'El número de Cédula de Identidad es obligatorio.';
    }

    const targetTypeDoc = DOC_TYPES.find((d) => d.id === tipo);

    // Rule 1: No duplicate active steps for same CI
    if (hasActiveRecord(currentCiFull, tipo)) {
      return `Esta CI (${currentCiFull}) ya cuenta con un documento "${targetTypeDoc?.short}" en estado ACTIVO. No se pueden duplicar pasos activos.`;
    }

    // Rule 2: Strict Sequence Check
    if (tipo === 'inf' && !hasActiveRecord(currentCiFull, 'cp')) {
      return `Requisito previo pendiente: La CI (${currentCiFull}) no tiene registrado el Paso 1 (Certificación Presupuestaria Activa).`;
    }
    if (tipo === 'ini' && !hasActiveRecord(currentCiFull, 'cp')) {
      return `Requisito previo pendiente: Debe generar primero el Paso 1 (Certificación Presupuestaria).`;
    }
    if (tipo === 'ini' && !hasActiveRecord(currentCiFull, 'inf')) {
      return `Requisito previo pendiente: La CI (${currentCiFull}) no tiene registrado el Paso 2 (Informe de Justificación Activo).`;
    }

    // Rule 3: Active 100-day contract protection
    if (tipo === 'cp' && activeContractInfo?.isActive) {
      return `Atención: El facilitador (${currentCiFull}) tiene un Contrato Activo vigente (${activeContractInfo.daysElapsed} días transcurridos de 100). No requiere nueva certificación hasta el vencimiento del contrato.`;
    }

    return null;
  };

  // Helper to Format Code: e.g. UNEFCO-CP-LP Nº001/2026
  const buildCode = (prefix: string, num: number) => {
    const padded = String(num).padStart(3, '0');
    return `${prefix}${padded}/${YEAR}`;
  };

  // Handle Generate
  const handleGenerate = async () => {
    setValidationError(null);
    const err = validateFlow();
    if (err) {
      setValidationError(err);
      return;
    }

    setIsGenerating(true);

    try {
      const nextNum = (counters[tipo] || 0) + 1;
      const targetDoc = DOC_TYPES.find((d) => d.id === tipo)!;
      const code = buildCode(targetDoc.prefix, nextNum);
      const now = new Date();

      const newRecord: CorrelativoRecord = {
        id: `${tipo.toUpperCase()}-${nextNum}-${YEAR}`,
        tipo,
        prefijo: targetDoc.prefix,
        numero: nextNum,
        codigoCompleto: code,
        ciNum: ciNum.trim(),
        ciComp: ciComp.trim().toUpperCase(),
        ciCompleta: currentCiFull,
        nombreFacilitador: facilitador.trim().toUpperCase(),
        motivo: 'CONTRATO FACILITADOR',
        anio: YEAR,
        fechaGeneracion: now.toISOString(),
        usuarioGenerador: currentUser?.displayName || tecnicoName || 'Técnico UNEFCO',
        estado: 'Activo',
        updatedAt: now.toISOString()
      };

      const updatedCounters: CorrelativoCounters = {
        ...counters,
        [tipo]: nextNum
      };

      await saveCorrelativoRecord(newRecord, updatedCounters);

      setLastGenerated(newRecord);
      setSuccessModalRecord(newRecord);
      setModalCopied(false);
      setCopyPulse(true);
      setTimeout(() => setCopyPulse(false), 5000);
    } catch (e) {
      console.error('Error al generar correlativo:', e);
      setValidationError('Error de red al guardar en la base de datos. Por favor reintente.');
    } finally {
      setIsGenerating(false);
    }
  };

  // Copy Code to Clipboard
  const handleCopyCode = (codeText: string) => {
    navigator.clipboard.writeText(codeText);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2500);
  };

  // Dependents of a record when canceling
  const getDependentsOf = (rec: CorrelativoRecord) => {
    const idx = STEP_ORDER.indexOf(rec.tipo);
    const laterTypes = STEP_ORDER.slice(idx + 1);
    return records.filter(
      (r) => r.ciCompleta === rec.ciCompleta && r.estado === 'Activo' && laterTypes.includes(r.tipo)
    );
  };

  // Handle Anulacion Confirmation
  const handleConfirmAnulacion = async () => {
    if (!anularModalRecord) return;
    if (!anularMotivo.trim()) {
      alert('Debe especificar un motivo de anulación obligatorio.');
      return;
    }

    const now = new Date().toISOString();
    const updatedRec: CorrelativoRecord = {
      ...anularModalRecord,
      estado: 'Anulado',
      motivoAnulacion: anularMotivo.trim(),
      fechaAnulacion: now,
      usuarioAnulador: currentUser?.displayName || tecnicoName || 'Usuario UNEFCO',
      updatedAt: now
    };

    await saveCorrelativoRecord(updatedRec, counters);
    setAnularModalRecord(null);
    setAnularMotivo('');
  };

  // Pending Processes grouped by CI
  const pendingProcesses = useMemo(() => {
    const map = new Map<string, { ci: string; name: string; lastDate: string; nextStep: 'cp' | 'inf' | 'ini' | null; doneSteps: string[] }>();

    records.forEach((r) => {
      if (r.estado === 'Activo') {
        const existing = map.get(r.ciCompleta);
        if (!existing) {
          map.set(r.ciCompleta, {
            ci: r.ciCompleta,
            name: r.nombreFacilitador,
            lastDate: r.fechaGeneracion,
            nextStep: null,
            doneSteps: [r.tipo]
          });
        } else {
          if (!existing.doneSteps.includes(r.tipo)) {
            existing.doneSteps.push(r.tipo);
          }
          if (new Date(r.fechaGeneracion) > new Date(existing.lastDate)) {
            existing.lastDate = r.fechaGeneracion;
          }
        }
      }
    });

    const pendingList: Array<{ ci: string; name: string; lastDate: string; nextStep: 'cp' | 'inf' | 'ini'; doneSteps: string[] }> = [];

    map.forEach((item) => {
      const done = STEP_ORDER.filter((t) => item.doneSteps.includes(t));
      const nextStep = STEP_ORDER.find((t) => !done.includes(t));
      if (nextStep) {
        pendingList.push({
          ...item,
          nextStep
        });
      }
    });

    return pendingList.sort((a, b) => new Date(b.lastDate).getTime() - new Date(a.lastDate).getTime());
  }, [records]);

  // Load pending process into form
  const handleLoadPending = (item: { ci: string; name: string; nextStep: 'cp' | 'inf' | 'ini' }) => {
    const parts = item.ci.split('-');
    setCiNum(parts[0] || '');
    setCiComp(parts[1] || '');
    setFacilitador(item.name);
    setTipo(item.nextStep);
    setValidationError(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Filtered History for Monthly Table
  const filteredHistory = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    return records.filter((r) => {
      const recordDate = new Date(r.fechaGeneracion);
      const isSameMonth = recordDate.getMonth() === selectedMonth && recordDate.getFullYear() === YEAR;
      if (!isSameMonth) return false;

      if (!term) return true;

      const matchCI = r.ciCompleta.toLowerCase().includes(term);
      const matchName = r.nombreFacilitador.toLowerCase().includes(term);
      const matchCode = r.codigoCompleto.toLowerCase().includes(term);
      const matchUser = (r.usuarioGenerador || '').toLowerCase().includes(term);

      return matchCI || matchName || matchCode || matchUser;
    });
  }, [records, selectedMonth, searchTerm]);

  // Separate history by document type for 3-column view
  const cpList = useMemo(() => filteredHistory.filter((r) => r.tipo === 'cp'), [filteredHistory]);
  const infList = useMemo(() => filteredHistory.filter((r) => r.tipo === 'inf'), [filteredHistory]);
  const iniList = useMemo(() => filteredHistory.filter((r) => r.tipo === 'ini'), [filteredHistory]);

  const monthNames = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* ------------------------------------------------------------------- */}
      {/* MAIN GENERATION FORM CARD                                           */}
      {/* ------------------------------------------------------------------- */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-sm overflow-hidden">
        <div className="p-4 md:p-5 border-b border-zinc-200 dark:border-[#333438] bg-zinc-50 dark:bg-[#1e1f21] flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded bg-zinc-100 dark:bg-[#2d2e32] border border-zinc-200 dark:border-[#3a3b40] text-zinc-700 dark:text-zinc-200 flex items-center justify-center font-bold">
              <Stamp className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg md:text-xl font-semibold text-zinc-900 dark:text-white">
                Generación de Correlativos Oficiales
              </h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Emisión secuencial e inalterable de números correlativos para contrataciones
              </p>
            </div>
          </div>
        </div>

        <div className="p-5 md:p-6 space-y-6">
          {/* STEP PROGRESS BADGES FOR ACTIVE CI */}
          {currentCiFull && currentCiFull.length >= 5 && (
            <div className="p-4 bg-zinc-50 dark:bg-zinc-950/60 rounded-2xl border border-zinc-200 dark:border-zinc-800 space-y-2.5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-sm font-extrabold text-zinc-800 dark:text-zinc-200 uppercase tracking-wider flex items-center gap-2 font-display">
                  <ShieldCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                  Estado de Progreso CI: <strong className="text-emerald-600 dark:text-emerald-400 font-mono text-base">{currentCiFull}</strong>
                </span>

                {/* 100-Day Contract Badge if Active */}
                {activeContractInfo?.isActive && (
                  <span className="text-xs md:text-sm font-bold bg-amber-100 dark:bg-amber-950 text-amber-900 dark:text-amber-200 border border-amber-300 dark:border-amber-800 px-3 py-1 rounded-xl flex items-center gap-2 font-display">
                    <Clock className="w-4 h-4 text-amber-600" />
                    <span>Contrato Activo: Día {activeContractInfo.daysElapsed} de 100 ({activeContractInfo.daysRemaining} días restantes)</span>
                  </span>
                )}
              </div>

              {/* Steps pills */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
                {DOC_TYPES.map((dt) => {
                  const isDone = ciProgress.done.includes(dt.id);
                  const isNext = ciProgress.nextStep === dt.id;

                  return (
                    <div
                      key={dt.id}
                      className={`px-3.5 py-2.5 rounded-xl border text-xs md:text-sm font-bold flex items-center justify-between font-display ${
                        isDone
                          ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200'
                          : isNext
                          ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-200 animate-pulse'
                          : 'bg-zinc-100 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-400 dark:text-zinc-500'
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        <span className="font-mono text-xs font-black">{dt.badge}</span>
                        <span>{dt.short}</span>
                      </span>
                      {isDone ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                      ) : isNext ? (
                        <span className="text-xs uppercase font-black bg-amber-200 dark:bg-amber-900 text-amber-900 dark:text-amber-200 px-2 py-0.5 rounded-md">
                          Siguiente
                        </span>
                      ) : (
                        <span className="text-xs text-zinc-400">Pendiente</span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* INPUT FORM FIELDS */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
            {/* CI NUMBER & COMPLEMENT */}
            <div className="md:col-span-5 space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider">
                  Cédula de Identidad (CI) *
                </label>
                {(ciNum.length > 0 || facilitador.length > 0) && (
                  <button
                    type="button"
                    onClick={() => {
                      setCiNum('');
                      setCiComp('');
                      setFacilitador('');
                      setTipo('cp');
                      setValidationError(null);
                    }}
                    className="text-xs font-medium text-zinc-500 hover:text-zinc-800 dark:hover:text-white flex items-center gap-1 cursor-pointer"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Limpiar / Nueva CI</span>
                  </button>
                )}
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  autoComplete="off"
                  value={ciNum}
                  onChange={(e) => {
                    const clean = e.target.value.replace(/\D/g, '').slice(0, 9);
                    setCiNum(clean);
                    setValidationError(null);
                  }}
                  placeholder="Ej. 3436443"
                  className="flex-1 px-3.5 py-2.5 bg-zinc-50 dark:bg-[#1e1f21] border border-zinc-300 dark:border-[#3e3f44] hover:border-zinc-400 dark:hover:border-zinc-500 rounded-lg text-sm font-mono text-zinc-900 dark:text-white focus:outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20 transition-all duration-150"
                />
                <input
                  type="text"
                  autoComplete="off"
                  value={ciComp}
                  onChange={(e) => {
                    const clean = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 3);
                    setCiComp(clean);
                    setValidationError(null);
                  }}
                  placeholder="Comp (1A)"
                  title="Complemento SEGIP (si aplica)"
                  className="w-28 px-3.5 py-2.5 bg-zinc-50 dark:bg-[#1e1f21] border border-zinc-300 dark:border-[#3e3f44] hover:border-zinc-400 dark:hover:border-zinc-500 rounded-lg text-sm font-mono text-zinc-900 dark:text-white focus:outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20 transition-all duration-150 text-center"
                />
              </div>
            </div>

            {/* FACILITADOR FULL NAME */}
            <div className="md:col-span-7 space-y-1.5">
              <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider">
                Facilitador/a *
              </label>
              <input
                type="text"
                autoComplete="off"
                value={facilitador}
                onChange={(e) => {
                  setFacilitador(e.target.value.toUpperCase());
                  setValidationError(null);
                }}
                placeholder="EJ. ZALLES PARI MARIA DEL PILAR"
                className="w-full px-3.5 py-2.5 bg-zinc-50 dark:bg-[#1e1f21] border border-zinc-300 dark:border-[#3e3f44] hover:border-zinc-400 dark:hover:border-zinc-500 rounded-lg text-sm font-medium text-zinc-900 dark:text-white focus:outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20 transition-all duration-150 uppercase"
              />
            </div>

            {/* DOCUMENT TYPE SELECTION (3 STEPS) */}
            <div className="md:col-span-12 space-y-2">
              <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <span>Seleccionar Tipo de Documento *</span>
                  {ciProgress.nextStep && (
                    <span className="text-[10px] font-mono font-bold text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-800">
                      Sugerido: Paso {STEP_ORDER.indexOf(ciProgress.nextStep) + 1}
                    </span>
                  )}
                </span>
              </label>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {DOC_TYPES.map((dt) => {
                  const isSelected = tipo === dt.id;
                  const isNextSugg = ciProgress.nextStep === dt.id;
                  const currentCounter = counters[dt.id] || 0;
                  const nextNumber = currentCounter + 1;
                  const formattedNext = `${dt.prefix}${String(nextNumber).padStart(3, '0')}/${YEAR}`;

                  // Active record for current CI on this step
                  const activeRec = records.find(
                    (r) => r.ciCompleta === currentCiFull && r.tipo === dt.id && r.estado === 'Activo'
                  );
                  const isCompleted = !!activeRec;

                  // Blocked logic
                  let isBlocked = false;
                  let blockedReason = '';
                  if (!isCompleted) {
                    if (dt.id === 'inf' && !hasActiveRecord(currentCiFull, 'cp')) {
                      isBlocked = true;
                      blockedReason = 'Paso 1 Requerido';
                    } else if (dt.id === 'ini') {
                      if (!hasActiveRecord(currentCiFull, 'cp')) {
                        isBlocked = true;
                        blockedReason = 'Paso 1 Requerido';
                      } else if (!hasActiveRecord(currentCiFull, 'inf')) {
                        isBlocked = true;
                        blockedReason = 'Paso 2 Requerido';
                      }
                    }
                  }

                  return (
                    <div
                      key={dt.id}
                      onClick={() => {
                        if (!isCompleted && !isBlocked) {
                          setTipo(dt.id);
                          setValidationError(null);
                        }
                      }}
                      className={`p-4 rounded-xl border text-left transition-all relative flex flex-col justify-between ${
                        isCompleted
                          ? 'bg-emerald-50/80 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800/80'
                          : isBlocked
                          ? 'bg-zinc-100/80 dark:bg-zinc-950/60 border-zinc-200 dark:border-zinc-800/80 opacity-70 cursor-not-allowed'
                          : isSelected
                          ? 'bg-emerald-600 text-white border-emerald-600 shadow-md cursor-pointer'
                          : 'bg-white dark:bg-[#1e1f21] border-zinc-200 dark:border-[#333438] text-zinc-700 dark:text-zinc-300 hover:border-emerald-500/50 hover:bg-emerald-50/30 dark:hover:bg-emerald-950/20 cursor-pointer'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span
                            className={`text-xs font-bold uppercase px-2 py-0.5 rounded ${
                              isCompleted
                                ? 'bg-emerald-700 text-white'
                                : isBlocked
                                ? 'bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400'
                                : isSelected
                                ? 'bg-white/20 text-white font-mono'
                                : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-mono'
                            }`}
                          >
                            {dt.badge}
                          </span>

                          {isCompleted && (
                            <span className="text-[10px] font-bold bg-emerald-200 dark:bg-emerald-900/80 text-emerald-900 dark:text-emerald-200 px-2 py-0.5 rounded flex items-center gap-1 uppercase">
                              <CheckCircle2 className="w-3 h-3" />
                              Completado
                            </span>
                          )}

                          {isBlocked && (
                            <span className="text-[10px] font-medium bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 px-2 py-0.5 rounded flex items-center gap-1 uppercase">
                              <Lock className="w-3 h-3" />
                              {blockedReason}
                            </span>
                          )}

                          {!isCompleted && !isBlocked && isNextSugg && !isSelected && (
                            <span className="text-[10px] font-bold bg-amber-100 text-amber-900 px-2 py-0.5 rounded uppercase">
                              Siguiente
                            </span>
                          )}
                        </div>

                        <div className={`text-xs font-bold leading-tight ${isCompleted ? 'text-emerald-950 dark:text-emerald-100' : ''}`}>
                          {dt.label}
                        </div>
                      </div>

                      {/* BOTTOM SECTION OF STEP CARD */}
                      {isCompleted && activeRec ? (
                        <div className="mt-3 pt-2.5 border-t border-emerald-200 dark:border-emerald-800/80 flex items-center justify-between gap-2">
                          <div>
                            <div className="text-[10px] font-bold uppercase text-emerald-800 dark:text-emerald-300">Código Generado:</div>
                            <div className="text-xs font-mono font-bold text-emerald-950 dark:text-white select-all">{activeRec.codigoCompleto}</div>
                          </div>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCopyCode(activeRec.codigoCompleto);
                              setStepCopiedId(activeRec.id);
                              setTimeout(() => setStepCopiedId(null), 2000);
                            }}
                            className="px-2.5 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-bold flex items-center gap-1 transition-all shrink-0 cursor-pointer shadow-2xs"
                          >
                            {stepCopiedId === activeRec.id ? (
                              <>
                                <Check className="w-3 h-3" />
                                <span>¡Copiado!</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3 h-3" />
                                <span>Copiar</span>
                              </>
                            )}
                          </button>
                        </div>
                      ) : isBlocked ? (
                        <div className="text-[11px] text-zinc-400 dark:text-zinc-500 mt-2.5 pt-2 border-t border-zinc-200 dark:border-zinc-800">
                          Complete el paso previo para habilitar
                        </div>
                      ) : (
                        <div
                          className={`text-xs font-mono mt-2.5 pt-2 border-t flex items-center justify-between ${
                            isSelected
                              ? 'border-white/20 text-white/90'
                              : 'border-zinc-100 dark:border-zinc-800 text-zinc-500 dark:text-zinc-400'
                          }`}
                        >
                          <span>Próximo Correlativo:</span>
                          <span className="font-bold underline">{formattedNext}</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* FIXED MOTIVO (READ ONLY) */}
            <div className="md:col-span-8 space-y-1.5">
              <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider">
                Motivo del Trámite
              </label>
              <input
                type="text"
                readOnly
                value="CONTRATO FACILITADOR"
                className="w-full px-3.5 py-2.5 bg-zinc-100 dark:bg-[#1e1f21] border border-zinc-200 dark:border-[#333438] rounded-lg text-sm font-bold text-zinc-700 dark:text-zinc-300 cursor-not-allowed uppercase"
              />
            </div>

            {/* GENERATE ACTION BUTTON */}
            <div className="md:col-span-4 flex items-end">
              <button
                type="button"
                onClick={handleGenerate}
                disabled={isGenerating}
                className="w-full h-[46px] bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold text-sm rounded-lg uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm hover:shadow-md disabled:opacity-50"
              >
                {isGenerating ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Procesando...</span>
                  </>
                ) : (
                  <>
                    <Stamp className="w-4 h-4" />
                    <span>Generar Correlativo</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* VALIDATION ERROR ALERT BOX */}
          {validationError && (
            <div className="p-4 md:p-5 bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900/60 rounded-xl text-red-900 dark:text-red-200 flex items-start gap-3 animate-in fade-in duration-200">
              <AlertCircle className="w-6 h-6 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
              <div className="space-y-1 text-sm font-medium">
                <div className="font-extrabold text-base text-red-950 dark:text-red-100">Validación de Regla de Negocio:</div>
                <p>{validationError}</p>
              </div>
            </div>
          )}

          {/* SUCCESS RESULT BANNER WITH PULSING COPY BUTTON */}
          {lastGenerated && (
            <div className="p-5 md:p-6 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800/80 rounded-2xl space-y-4 animate-in slide-in-from-top-2 duration-300">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-xs shrink-0">
                    <CheckCircle2 className="w-7 h-7" />
                  </div>
                  <div>
                    <span className="text-xs font-black uppercase text-emerald-800 dark:text-emerald-300 tracking-wider">
                      ¡Correlativo Asignado Exitosamente!
                    </span>
                    <h3 className="text-2xl md:text-3xl font-black font-mono text-emerald-950 dark:text-white">
                      {lastGenerated.codigoCompleto}
                    </h3>
                  </div>
                </div>

                <div className="flex items-center gap-2.5">
                  <button
                    type="button"
                    onClick={() => handleCopyCode(lastGenerated.codigoCompleto)}
                    className={`px-5 py-3 rounded-xl font-extrabold text-sm uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer shadow-sm ${
                      isCopied
                        ? 'bg-emerald-700 text-white'
                        : copyPulse
                        ? 'bg-emerald-600 text-white animate-bounce ring-4 ring-emerald-400/50'
                        : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                    }`}
                  >
                    {isCopied ? (
                      <>
                        <Check className="w-5 h-5" />
                        <span>¡Copiado!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-5 h-5" />
                        <span>Copiar Código</span>
                      </>
                    )}
                  </button>

                  {/* Preload into Schedule Generator option if Paso 3 */}
                  {lastGenerated.tipo === 'ini' && onPreloadFacilitadorForSchedule && (
                    <button
                      type="button"
                      onClick={() => {
                        onPreloadFacilitadorForSchedule(
                          lastGenerated.nombreFacilitador,
                          lastGenerated.ciNum,
                          lastGenerated.ciComp
                        );
                      }}
                      className="px-4 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-sm rounded-xl uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer font-display"
                      title="Ir a Programar Cronograma con este docente"
                    >
                      <ArrowRight className="w-5 h-5" />
                      <span>Programar Cronograma</span>
                    </button>
                  )}
                </div>
              </div>

              <div className="pt-3 border-t border-emerald-200 dark:border-emerald-900/60 flex flex-wrap items-center justify-between text-sm text-emerald-900 dark:text-emerald-200 font-medium">
                <div>
                  Beneficiario: <strong className="font-extrabold text-zinc-900 dark:text-white">{lastGenerated.nombreFacilitador}</strong> (CI: {lastGenerated.ciCompleta})
                </div>
                <div>
                  Próximo paso sugerido: {
                    lastGenerated.tipo === 'cp' 
                      ? 'Paso 2 · INFORME DE JUSTIFICACIÓN' 
                      : lastGenerated.tipo === 'inf' 
                      ? 'Paso 3 · SOLICITUD DE AUTORIZACIÓN DE INICIO DE PROCESO DE CONTRATACIÓN' 
                      : '¡Proceso Completo! Listo para Programación Académica'
                  }
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ------------------------------------------------------------------- */}
      {/* PENDING PROCESSES PANEL (PROCESOS PENDIENTES POR CI)                */}
      {/* ------------------------------------------------------------------- */}
      {pendingProcesses.length > 0 && (
        <div className="bg-white dark:bg-[#252628] border border-zinc-200 dark:border-[#333438] rounded-lg overflow-hidden">
          <div className="p-3.5 md:p-4 border-b border-zinc-200 dark:border-[#333438] bg-zinc-50 dark:bg-[#1e1f21] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              <h3 className="text-xs md:text-sm font-semibold text-zinc-900 dark:text-white uppercase tracking-wider">
                Procesos en Curso Pendientes ({pendingProcesses.length})
              </h3>
            </div>
            <span className="text-xs text-zinc-500 dark:text-zinc-400">
              Haz clic en una tarjeta para retomar el siguiente paso
            </span>
          </div>

          <div className="p-3.5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {pendingProcesses.map((item) => {
              const nextDoc = DOC_TYPES.find((d) => d.id === item.nextStep)!;
              return (
                <div
                  key={item.ci}
                  onClick={() => handleLoadPending(item)}
                  className="p-3 bg-zinc-50 hover:bg-zinc-100 dark:bg-[#1e1f21] dark:hover:bg-[#2d2e32] border border-zinc-200 dark:border-[#333438] rounded cursor-pointer transition-colors space-y-2 group"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-800">
                      CI: {item.ci}
                    </span>
                    <span className="text-[10px] font-medium text-amber-800 dark:text-amber-300 bg-amber-100 dark:bg-amber-950/60 px-2 py-0.5 rounded uppercase">
                      Falta: {nextDoc.badge}
                    </span>
                  </div>

                  <div className="text-xs font-semibold text-zinc-900 dark:text-white truncate group-hover:text-[#4573d2] transition-colors">
                    {item.name}
                  </div>

                  <div className="text-[11px] text-zinc-500 dark:text-zinc-400 flex items-center justify-between pt-1.5 border-t border-zinc-200 dark:border-[#333438]">
                    <span>Avance: <strong>{item.doneSteps.length}/3 Pasos</strong></span>
                    <span className="flex items-center gap-1 text-[#4573d2] font-medium">
                      <span>Continuar</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------------- */}
      {/* MONTHLY HISTORY GRID (HISTORIAL MENSUAL EN 3 COLUMNAS)               */}
      {/* ------------------------------------------------------------------- */}
      <div className="bg-white dark:bg-[#252628] border border-zinc-200 dark:border-[#333438] rounded-lg overflow-hidden">
        {/* History Header Controls */}
        <div className="p-3.5 md:p-4 border-b border-zinc-200 dark:border-[#333438] bg-zinc-50 dark:bg-[#1e1f21] flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-zinc-600 dark:text-zinc-300" />
            <h3 className="text-xs md:text-sm font-semibold text-zinc-900 dark:text-white">
              Historial de Correlativos
            </h3>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Search Bar */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar por CI, Nombre o Código..."
                className="pl-8 pr-2.5 py-1.5 bg-white dark:bg-[#252628] border border-zinc-200 dark:border-[#333438] rounded text-xs text-zinc-900 dark:text-white focus:outline-none focus:border-[#4573d2] w-56 md:w-64"
              />
            </div>

            {/* Month Selector */}
            <div className="flex items-center gap-1 bg-white dark:bg-[#252628] border border-zinc-200 dark:border-[#333438] rounded p-0.5">
              <button
                type="button"
                onClick={() => setSelectedMonth((m) => Math.max(0, m - 1))}
                disabled={selectedMonth === 0}
                className="p-1 hover:bg-zinc-100 dark:hover:bg-[#2d2e32] rounded text-zinc-700 dark:text-zinc-300 disabled:opacity-30 cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-xs font-medium px-2 text-zinc-900 dark:text-white min-w-[90px] text-center">
                {monthNames[selectedMonth]} {YEAR}
              </span>
              <button
                type="button"
                onClick={() => setSelectedMonth((m) => Math.min(11, m + 1))}
                disabled={selectedMonth === 11}
                className="p-1 hover:bg-zinc-100 dark:hover:bg-[#2d2e32] rounded text-zinc-700 dark:text-zinc-300 disabled:opacity-30 cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* 3 COLUMNS PER DOCUMENT TYPE */}
        <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-zinc-200 dark:divide-[#333438] min-h-[380px]">
          {DOC_TYPES.map((dt) => {
            const list = dt.id === 'cp' ? cpList : dt.id === 'inf' ? infList : iniList;

            return (
              <div key={dt.id} className="flex flex-col h-full bg-zinc-50/50 dark:bg-[#1e1f21]">
                <div className="p-3 bg-zinc-100 dark:bg-[#252628] border-b border-zinc-200 dark:border-[#333438] flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] font-semibold uppercase text-white px-2 py-0.5 rounded bg-gradient-to-r ${dt.color}`}>
                      {dt.badge}
                    </span>
                    <span className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">
                      {dt.short}
                    </span>
                  </div>
                  <span className="text-xs font-mono text-zinc-500 dark:text-zinc-400">
                    ({list.length})
                  </span>
                </div>

                <div className="p-3 space-y-2.5 overflow-y-auto max-h-[550px] flex-1">
                  {list.length === 0 ? (
                    <div className="text-center py-12 text-xs text-zinc-400 font-medium">
                      Sin registros en {monthNames[selectedMonth]}
                    </div>
                  ) : (
                    list.map((item) => {
                      const isAnulado = item.estado === 'Anulado';

                      return (
                        <div
                          key={item.id}
                          className={`p-3 rounded border transition-colors space-y-1.5 ${
                            isAnulado
                              ? 'bg-red-50/50 dark:bg-red-950/20 border-red-200 dark:border-red-900/50 text-zinc-500'
                              : 'bg-white dark:bg-[#252628] border-zinc-200 dark:border-[#333438] hover:border-zinc-300'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className={`font-mono text-xs font-semibold ${isAnulado ? 'line-through text-red-600 dark:text-red-400' : 'text-zinc-900 dark:text-white'}`}>
                              {item.codigoCompleto}
                            </span>
                            <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded uppercase ${
                              isAnulado
                                ? 'bg-red-100 dark:bg-red-950 text-red-800 dark:text-red-200 border border-red-200'
                                : 'bg-emerald-50 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-200'
                            }`}>
                              {item.estado}
                            </span>
                          </div>

                          <div className="text-xs font-semibold text-zinc-900 dark:text-white truncate">
                            {item.nombreFacilitador}
                          </div>

                          <div className="text-[11px] text-zinc-500 dark:text-zinc-400 flex items-center justify-between font-mono">
                            <span>CI: {item.ciCompleta}</span>
                            <span>{new Date(item.fechaGeneracion).toLocaleDateString('es-BO')}</span>
                          </div>

                          {/* Cancellation reason if anulado */}
                          {isAnulado && item.motivoAnulacion && (
                            <div className="mt-1 p-2 bg-red-100/80 dark:bg-red-950/60 rounded text-[11px] text-red-900 dark:text-red-200 space-y-0.5">
                              <div className="font-semibold">Motivo: {item.motivoAnulacion}</div>
                              <div className="text-[10px]">Anulado por: {item.usuarioAnulador} ({item.fechaAnulacion ? new Date(item.fechaAnulacion).toLocaleDateString('es-BO') : ''})</div>
                            </div>
                          )}

                          {/* Action button if active */}
                          {!isAnulado && (
                            <div className="pt-1.5 border-t border-zinc-100 dark:border-[#333438] flex items-center justify-between text-[11px]">
                              <span className="text-zinc-400">Gen: {item.usuarioGenerador}</span>
                              <button
                                type="button"
                                onClick={() => {
                                  setAnularModalRecord(item);
                                  setAnularMotivo('');
                                }}
                                className="text-red-600 hover:text-red-700 dark:text-red-400 font-medium hover:underline cursor-pointer"
                              >
                                Anular
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ------------------------------------------------------------------- */}
      {/* CANCELLATION MODAL WITH DEPENDENCY WARNING                          */}
      {/* ------------------------------------------------------------------- */}
      {anularModalRecord && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl animate-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3 text-red-600 dark:text-red-400">
              <AlertTriangle className="w-6 h-6 shrink-0" />
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Anulación de Correlativo Oficial
              </h3>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 font-medium leading-relaxed">
              Está a punto de anular el correlativo <strong className="font-mono text-slate-900 dark:text-white">{anularModalRecord.codigoCompleto}</strong> correspondiente a <strong className="text-slate-900 dark:text-white">{anularModalRecord.nombreFacilitador}</strong> (CI: {anularModalRecord.ciCompleta}).
            </p>

            {/* DEPENDENCY WARNING IF LATER STEPS EXIST */}
            {getDependentsOf(anularModalRecord).length > 0 && (
              <div className="p-3 bg-amber-50 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-800 rounded-xl text-amber-800 dark:text-amber-300 text-xs space-y-1">
                <div className="font-bold flex items-center gap-1.5">
                  <Info className="w-4 h-4 text-amber-600" />
                  <span>Advertencia de Dependencia de Flujo:</span>
                </div>
                <p>
                  Esta CI tiene pasos posteriores activos que se generaron después de este documento. La anulación conservará trazabilidad histórica.
                </p>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase text-slate-700 dark:text-slate-300">
                Motivo de Anulación (Obligatorio) *
              </label>
              <textarea
                value={anularMotivo}
                onChange={(e) => setAnularMotivo(e.target.value)}
                placeholder="Escriba el motivo detallado de la anulación..."
                rows={3}
                className="w-full p-3 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-red-500 outline-none"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setAnularModalRecord(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs rounded-xl uppercase tracking-wider cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmAnulacion}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl uppercase tracking-wider cursor-pointer shadow-sm"
              >
                Confirmar Anulación
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------------- */}
      {/* PROMINENT SUCCESS CONFIRMATION MODAL                                */}
      {/* ------------------------------------------------------------------- */}
      {successModalRecord && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-lg w-full p-6 md:p-8 shadow-2xl space-y-6 text-center animate-in zoom-in-95 duration-200">
            
            {/* Header Icon & Title */}
            <div className="space-y-3">
              <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto ring-8 ring-emerald-50 dark:ring-emerald-900/30">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <h3 className="text-2xl font-black text-slate-900 dark:text-white">
                ¡Correlativo Generado Exitosamente!
              </h3>
              <p className="text-xs font-black uppercase text-indigo-600 dark:text-indigo-400 tracking-wider">
                {DOC_TYPES.find((d) => d.id === successModalRecord.tipo)?.label}
              </p>
            </div>

            {/* Prominent Code Display Box */}
            <div className="bg-slate-50 dark:bg-slate-950 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
              <span className="text-[11px] font-extrabold uppercase text-slate-400 tracking-wider block">
                Código Correlativo Oficial Registrado
              </span>
              <div className="text-2xl md:text-3xl font-black font-mono text-indigo-600 dark:text-indigo-400 tracking-tight select-all">
                {successModalRecord.codigoCompleto}
              </div>

              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(successModalRecord.codigoCompleto);
                  setModalCopied(true);
                  setTimeout(() => setModalCopied(false), 2500);
                }}
                className={`w-full py-3.5 px-4 rounded-xl font-extrabold text-xs md:text-sm flex items-center justify-center gap-2.5 transition-all shadow-md cursor-pointer ${
                  modalCopied
                    ? 'bg-emerald-600 text-white shadow-emerald-600/20'
                    : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-600/20'
                }`}
              >
                {modalCopied ? (
                  <>
                    <Check className="w-5 h-5" />
                    <span>¡CÓDIGO COPIADO AL PORTAPAPELES!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-5 h-5" />
                    <span>COPIAR CÓDIGO CORRELATIVO</span>
                  </>
                )}
              </button>
            </div>

            {/* Metadata summary */}
            <div className="text-left bg-slate-50/80 dark:bg-slate-950/50 p-4 rounded-xl border border-slate-200 dark:border-slate-800 text-xs space-y-1.5 text-slate-700 dark:text-slate-300">
              <div className="flex justify-between">
                <span className="font-bold text-slate-500">Facilitador/a:</span>
                <span className="font-extrabold text-slate-900 dark:text-white uppercase">{successModalRecord.nombreFacilitador}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-bold text-slate-500">Cédula de Identidad:</span>
                <span className="font-mono font-bold text-slate-900 dark:text-white">{successModalRecord.ciCompleta}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-bold text-slate-500">Registrado por:</span>
                <span className="font-bold text-slate-900 dark:text-white">{successModalRecord.usuarioGenerador}</span>
              </div>
            </div>

            {/* Next Step Guidance Callout */}
            <div className="p-3.5 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 rounded-xl text-left flex items-start gap-3">
              <Info className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <div className="text-xs text-amber-900 dark:text-amber-200 font-medium">
                {successModalRecord.tipo === 'cp' && (
                  <p><strong>Siguiente Paso Activado:</strong> Copie el código arriba. El sistema ha habilitado automáticamente el <strong>Paso 2 (Informe de Justificación)</strong> para esta misma CI.</p>
                )}
                {successModalRecord.tipo === 'inf' && (
                  <p><strong>Siguiente Paso Activado:</strong> Copie el código arriba. El sistema ha habilitado automáticamente el <strong>Paso 3 (Inicio de Contratación)</strong> para esta misma CI.</p>
                )}
                {successModalRecord.tipo === 'ini' && (
                  <p><strong>Trámite Completo:</strong> Se han generado con éxito los 3 correlativos requeridos para la contratación de este facilitador.</p>
                )}
              </div>
            </div>

            {/* Modal Action Buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setSuccessModalRecord(null);
                  setCiNum('');
                  setCiComp('');
                  setFacilitador('');
                  setTipo('cp');
                }}
                className="px-4 py-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs rounded-xl transition-colors cursor-pointer uppercase tracking-wider"
              >
                Nueva CI / Limpiar Formulario
              </button>

              <button
                type="button"
                onClick={() => {
                  setSuccessModalRecord(null);
                }}
                className="px-4 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs rounded-xl shadow-md transition-colors cursor-pointer uppercase tracking-wider"
              >
                Continuar con esta CI
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
};
