import React, { useState } from 'react';
import { X, UserPlus, Users, Calendar, Trash2, Plus, ShieldAlert, Database, AlertTriangle, RefreshCw, CheckCircle2 } from 'lucide-react';
import { capitalizeName } from '../utils/textUtils';
import { GRADOS_ACADEMICOS } from './Sidebar';
import { UserProfile } from '../types';
import { clearAllSchedulesFromFirestore } from '../services/scheduleService';
import { clearAllCorrelativosFromFirestore, resetCorrelativoCountersInFirestore } from '../services/correlativoService';

interface AdminModalProps {
  isOpen: boolean;
  onClose: () => void;
  savedDocentes: string[];
  onAddDocente: (name: string) => void;
  onRemoveDocente: (name: string) => void;
  savedCoordinadores: string[];
  onAddCoordinador: (name: string) => void;
  onRemoveCoordinador: (name: string) => void;
  feriadosLocales: string[];
  onAddFeriadoLocal: (isoDate: string) => void;
  onRemoveFeriadoLocal: (isoDate: string) => void;
  currentUser?: UserProfile | null;
}

export const AdminModal: React.FC<AdminModalProps> = ({
  isOpen,
  onClose,
  savedDocentes,
  onAddDocente,
  onRemoveDocente,
  savedCoordinadores,
  onAddCoordinador,
  onRemoveCoordinador,
  feriadosLocales,
  onAddFeriadoLocal,
  onRemoveFeriadoLocal,
  currentUser
}) => {
  const [activeTab, setActiveTab] = useState<'docentes' | 'coordinadores' | 'feriados' | 'dbCleanup'>('docentes');
  const [newDocenteGrado, setNewDocenteGrado] = useState('LIC.');
  const [newDocenteInput, setNewDocenteInput] = useState('');
  const [newCoordInput, setNewCoordInput] = useState('');
  const [newHolidayInput, setNewHolidayInput] = useState('');

  // DB Cleanup States
  const [dbActionLoading, setDbActionLoading] = useState(false);
  const [dbActionStatus, setDbActionStatus] = useState<string | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState<'schedules' | 'correlativos' | 'counters' | 'full' | null>(null);

  if (!isOpen) return null;

  const isAdmin = currentUser?.role === 'admin';

  const handleAddDocenteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) return;
    const formatted = newDocenteInput.trim().toUpperCase();
    if (formatted) {
      const fullDocente = newDocenteGrado ? `${newDocenteGrado} ${formatted}` : formatted;
      onAddDocente(fullDocente);
      setNewDocenteInput('');
    }
  };

  const handleAddCoordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) return;
    const formatted = newCoordInput.trim().toUpperCase();
    if (formatted) {
      onAddCoordinador(formatted);
      setNewCoordInput('');
    }
  };

  const handleAddHolidaySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) return;
    if (newHolidayInput) {
      onAddFeriadoLocal(newHolidayInput);
      setNewHolidayInput('');
    }
  };

  // Database cleanup actions
  const handleExecuteDbCleanup = async () => {
    if (!showConfirmModal || !isAdmin) return;
    setDbActionLoading(true);
    setDbActionStatus(null);

    try {
      if (showConfirmModal === 'schedules') {
        await clearAllSchedulesFromFirestore();
        localStorage.removeItem('unefco_history_schedules');
        setDbActionStatus('¡Historial de cronogramas eliminado exitosamente de Firestore!');
      } else if (showConfirmModal === 'correlativos') {
        await clearAllCorrelativosFromFirestore();
        localStorage.removeItem('unefco_correlativos_records');
        setDbActionStatus('¡Todos los correlativos y hojas de ruta han sido eliminados de Firestore!');
      } else if (showConfirmModal === 'counters') {
        await resetCorrelativoCountersInFirestore();
        setDbActionStatus('¡Contadores de correlativos (CP, INF, INI) reiniciados a cero!');
      } else if (showConfirmModal === 'full') {
        await clearAllSchedulesFromFirestore();
        await clearAllCorrelativosFromFirestore();
        localStorage.removeItem('unefco_history_schedules');
        localStorage.removeItem('unefco_correlativos_records');
        setDbActionStatus('¡LIMPIEZA TOTAL COMPLETADA! Firestore restablecido a cero.');
      }
    } catch (err: any) {
      setDbActionStatus(`Error al realizar limpieza: ${err.message || 'Error desconocido'}`);
    } finally {
      setDbActionLoading(false);
      setShowConfirmModal(null);
    }
  };

  return (
    <div className="fixed inset-0 bg-zinc-950/70 dark:bg-zinc-950/80 backdrop-blur-xs flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl relative">
        {/* Header */}
        <div className="px-6 py-4 bg-zinc-50 dark:bg-zinc-950 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold shadow-md shadow-emerald-600/20 font-display">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xs font-bold text-zinc-900 dark:text-zinc-100 uppercase tracking-wider font-display">
                Gestión de Personal & Configuración
              </h2>
              <p className="text-[10px] text-zinc-500 dark:text-zinc-400 font-bold uppercase tracking-tight">
                Configuración Restringida UNEFCO La Paz
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-zinc-400 dark:text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Security Guard Notice if non-admin */}
        {!isAdmin && (
          <div className="p-4 bg-amber-50 dark:bg-amber-950/60 border-b border-amber-200 dark:border-amber-900 text-amber-900 dark:text-amber-200 text-xs flex items-center gap-3">
            <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0" />
            <div>
              <p className="font-bold uppercase text-[11px] font-display">Acceso Restringido</p>
              <p className="text-[10px] leading-relaxed">
                Solo el Administrador General puede modificar listas, catálogos o realizar limpiezas en la base de datos.
              </p>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="flex border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-6 pt-2 font-display overflow-x-auto">
          <button
            onClick={() => setActiveTab('docentes')}
            className={`pb-3 px-3 text-[11px] font-bold uppercase tracking-wider border-b-2 transition-colors cursor-pointer whitespace-nowrap ${
              activeTab === 'docentes'
                ? 'border-emerald-600 dark:border-emerald-400 text-emerald-700 dark:text-emerald-300'
                : 'border-transparent text-zinc-400 dark:text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'
            }`}
          >
            Docentes ({savedDocentes.length})
          </button>
          <button
            onClick={() => setActiveTab('coordinadores')}
            className={`pb-3 px-3 text-[11px] font-bold uppercase tracking-wider border-b-2 transition-colors cursor-pointer whitespace-nowrap ${
              activeTab === 'coordinadores'
                ? 'border-emerald-600 dark:border-emerald-400 text-emerald-700 dark:text-emerald-300'
                : 'border-transparent text-zinc-400 dark:text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'
            }`}
          >
            Técnicos ({savedCoordinadores.length})
          </button>
          <button
            onClick={() => setActiveTab('feriados')}
            className={`pb-3 px-3 text-[11px] font-bold uppercase tracking-wider border-b-2 transition-colors cursor-pointer whitespace-nowrap ${
              activeTab === 'feriados'
                ? 'border-emerald-600 dark:border-emerald-400 text-emerald-700 dark:text-emerald-300'
                : 'border-transparent text-zinc-400 dark:text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'
            }`}
          >
            Feriados ({feriadosLocales.length})
          </button>
          <button
            onClick={() => setActiveTab('dbCleanup')}
            className={`pb-3 px-3 text-[11px] font-bold uppercase tracking-wider border-b-2 transition-colors cursor-pointer whitespace-nowrap flex items-center gap-1 ${
              activeTab === 'dbCleanup'
                ? 'border-red-600 dark:border-red-400 text-red-700 dark:text-red-400'
                : 'border-transparent text-zinc-400 dark:text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'
            }`}
          >
            <Database className="w-3.5 h-3.5" />
            <span>Limpieza Firestore</span>
          </button>
        </div>

        {/* Tab Contents */}
        <div className="p-6 max-h-[380px] overflow-y-auto">
          {activeTab === 'docentes' && (
            <div>
              {isAdmin && (
                <form onSubmit={handleAddDocenteSubmit} className="flex gap-2 mb-4">
                  <select
                    value={newDocenteGrado}
                    onChange={e => setNewDocenteGrado(e.target.value)}
                    className="w-24 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-2 py-2 text-xs font-bold text-emerald-700 dark:text-emerald-300 focus:outline-none focus:border-emerald-600 cursor-pointer font-display"
                    title="Grado Académico"
                  >
                    {Array.from(new Set(GRADOS_ACADEMICOS.map(g => g.toUpperCase()))).map(g => (
                      <option key={g} value={g} className="bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100">{g}</option>
                    ))}
                    <option value="" className="bg-white dark:bg-zinc-900 text-zinc-500">(SIN GRADO)</option>
                  </select>
                  <input
                    type="text"
                    placeholder="Escriba Nombre y Apellido..."
                    value={newDocenteInput}
                    onChange={e => setNewDocenteInput(e.target.value.toUpperCase())}
                    className="flex-1 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-3 py-2 text-xs text-zinc-900 dark:text-zinc-100 font-semibold focus:outline-none focus:border-emerald-600 focus:bg-white dark:focus:bg-zinc-900 uppercase"
                  />
                  <button
                    type="submit"
                    className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold uppercase tracking-wider px-4 py-2 rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer font-display"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    <span>Guardar</span>
                  </button>
                </form>
              )}

              <div className="space-y-1.5">
                {savedDocentes.map((doc, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-2.5 bg-zinc-50 dark:bg-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-750 rounded-xl text-xs font-semibold text-zinc-800 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-700 transition-colors"
                  >
                    <span className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-500" />
                      {doc}
                    </span>
                    {isAdmin && (
                      <button
                        type="button"
                        onClick={() => onRemoveDocente(doc)}
                        className="text-zinc-400 dark:text-zinc-500 hover:text-red-600 dark:hover:text-red-400 p-1 rounded-lg transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'coordinadores' && (
            <div>
              {isAdmin && (
                <form onSubmit={handleAddCoordSubmit} className="flex gap-2 mb-4">
                  <input
                    type="text"
                    placeholder="Escriba Nombre y Apellido..."
                    value={newCoordInput}
                    onChange={e => setNewCoordInput(e.target.value.toUpperCase())}
                    className="flex-1 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-3 py-2 text-xs text-zinc-900 dark:text-zinc-100 font-semibold focus:outline-none focus:border-emerald-600 focus:bg-white dark:focus:bg-zinc-900 uppercase"
                  />
                  <button
                    type="submit"
                    className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold uppercase tracking-wider px-4 py-2 rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer font-display"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Agregar</span>
                  </button>
                </form>
              )}

              <div className="space-y-1.5">
                {savedCoordinadores.map((coord, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-2.5 bg-zinc-50 dark:bg-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-750 rounded-xl text-xs font-semibold text-zinc-800 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-700 transition-colors"
                  >
                    <span className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-teal-500" />
                      {coord}
                    </span>
                    {isAdmin && (
                      <button
                        type="button"
                        onClick={() => onRemoveCoordinador(coord)}
                        className="text-zinc-400 dark:text-zinc-500 hover:text-red-600 dark:hover:text-red-400 p-1 rounded-lg transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'feriados' && (
            <div>
              {isAdmin && (
                <form onSubmit={handleAddHolidaySubmit} className="flex gap-2 mb-4">
                  <input
                    type="date"
                    value={newHolidayInput}
                    onChange={e => setNewHolidayInput(e.target.value)}
                    className="flex-1 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-3 py-2 text-xs text-zinc-900 dark:text-zinc-100 font-bold focus:outline-none focus:border-emerald-600 focus:bg-white dark:focus:bg-zinc-900"
                  />
                  <button
                    type="submit"
                    className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold uppercase tracking-wider px-4 py-2 rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer font-display"
                  >
                    <Calendar className="w-3.5 h-3.5" />
                    <span>Agregar Feriado</span>
                  </button>
                </form>
              )}

              <div className="space-y-1.5">
                {feriadosLocales.length === 0 ? (
                  <p className="text-xs text-zinc-400 dark:text-zinc-500 italic text-center py-4">
                    No hay feriados adicionales agregados
                  </p>
                ) : (
                  feriadosLocales.map((f, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-2.5 bg-rose-50 dark:bg-rose-950/60 rounded-xl text-xs font-bold text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-800"
                    >
                      <span>Feriado Local: {f}</span>
                      {isAdmin && (
                        <button
                          type="button"
                          onClick={() => onRemoveFeriadoLocal(f)}
                          className="text-rose-400 hover:text-rose-700 dark:hover:text-rose-200 p-1 rounded-lg transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Database Cleanup Tab */}
          {activeTab === 'dbCleanup' && (
            <div className="space-y-4 font-display">
              <div className="bg-amber-50 dark:bg-amber-950/50 p-3 rounded-xl border border-amber-200 dark:border-amber-900 flex items-start gap-2.5">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div className="text-xs text-amber-900 dark:text-amber-200 leading-relaxed">
                  <p className="font-bold uppercase text-[10px]">Mantenimiento General de Firestore</p>
                  <p className="text-[11px] mt-0.5">
                    Permite limpiar registros acumulados de prueba en la base de datos centralizada de UNEFCO La Paz.
                  </p>
                </div>
              </div>

              {dbActionStatus && (
                <div className="p-3 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 rounded-xl text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>{dbActionStatus}</span>
                </div>
              )}

              <div className="space-y-2.5">
                {/* Clean Schedules */}
                <div className="p-3 bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 rounded-xl flex items-center justify-between gap-3">
                  <div>
                    <h4 className="text-xs font-bold text-zinc-900 dark:text-white uppercase">
                      Historial de Cronogramas
                    </h4>
                    <p className="text-[10px] text-zinc-500 dark:text-zinc-400">
                      Elimina todos los cronogramas guardados en la colección <code className="font-mono text-emerald-600 dark:text-emerald-400">schedules</code>
                    </p>
                  </div>
                  <button
                    type="button"
                    disabled={!isAdmin || dbActionLoading}
                    onClick={() => setShowConfirmModal('schedules')}
                    className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-[10px] font-bold uppercase rounded-lg transition-colors cursor-pointer shrink-0 disabled:opacity-50"
                  >
                    Limpiar
                  </button>
                </div>

                {/* Clean Correlativos */}
                <div className="p-3 bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 rounded-xl flex items-center justify-between gap-3">
                  <div>
                    <h4 className="text-xs font-bold text-zinc-900 dark:text-white uppercase">
                      Hojas de Ruta y Correlativos
                    </h4>
                    <p className="text-[10px] text-zinc-500 dark:text-zinc-400">
                      Elimina todos los correlativos de contratos guardados en <code className="font-mono text-emerald-600 dark:text-emerald-400">correlativos</code>
                    </p>
                  </div>
                  <button
                    type="button"
                    disabled={!isAdmin || dbActionLoading}
                    onClick={() => setShowConfirmModal('correlativos')}
                    className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-[10px] font-bold uppercase rounded-lg transition-colors cursor-pointer shrink-0 disabled:opacity-50"
                  >
                    Limpiar
                  </button>
                </div>

                {/* Reset Counters */}
                <div className="p-3 bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 rounded-xl flex items-center justify-between gap-3">
                  <div>
                    <h4 className="text-xs font-bold text-zinc-900 dark:text-white uppercase">
                      Reiniciar Contadores a 0
                    </h4>
                    <p className="text-[10px] text-zinc-500 dark:text-zinc-400">
                      Reinicia los numeradores de correlativos CP, INF e INI a cero para inicio de gestión
                    </p>
                  </div>
                  <button
                    type="button"
                    disabled={!isAdmin || dbActionLoading}
                    onClick={() => setShowConfirmModal('counters')}
                    className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-[10px] font-bold uppercase rounded-lg transition-colors cursor-pointer shrink-0 disabled:opacity-50 flex items-center gap-1"
                  >
                    <RefreshCw className="w-3 h-3" />
                    <span>Reiniciar</span>
                  </button>
                </div>

                {/* FULL RESET */}
                <div className="p-4 bg-red-50 dark:bg-red-950/40 border border-red-300 dark:border-red-900/60 rounded-xl space-y-2">
                  <div className="flex items-center gap-2 text-red-900 dark:text-red-200">
                    <Trash2 className="w-4 h-4 text-red-600" />
                    <h4 className="text-xs font-extrabold uppercase">
                      Restablecimiento de Fábrica General
                    </h4>
                  </div>
                  <p className="text-[10px] text-red-800 dark:text-red-300 leading-relaxed">
                    Elimina simultáneamente todo el historial de cronogramas y correlativos guardados en Firestore, restableciendo contadores a cero para la nueva gestión.
                  </p>
                  <button
                    type="button"
                    disabled={!isAdmin || dbActionLoading}
                    onClick={() => setShowConfirmModal('full')}
                    className="w-full py-2 bg-red-700 hover:bg-red-800 text-white text-xs font-extrabold uppercase tracking-wider rounded-lg transition-colors cursor-pointer shadow-xs disabled:opacity-50"
                  >
                    {dbActionLoading ? 'Limpiando Base de Datos...' : 'EJECUTAR RESTABLECIMIENTO TOTAL FIRESTORE'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-zinc-50 dark:bg-zinc-950 border-t border-zinc-200 dark:border-zinc-800 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="bg-zinc-900 dark:bg-emerald-600 hover:bg-zinc-800 dark:hover:bg-emerald-500 text-white text-xs font-bold uppercase tracking-widest px-5 py-2.5 rounded-xl transition-colors cursor-pointer font-display"
          >
            Cerrar
          </button>
        </div>

        {/* Inner Confirmation Modal Overlay */}
        {showConfirmModal && (
          <div className="absolute inset-0 bg-zinc-950/85 backdrop-blur-xs flex items-center justify-center p-6 z-50 animate-fade-in font-display">
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 shadow-2xl max-w-sm w-full space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-red-100 dark:bg-red-950/80 text-red-600 rounded-xl shrink-0">
                  <AlertTriangle className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-zinc-900 dark:text-white uppercase tracking-wider">
                    ¿Confirmar Limpieza?
                  </h3>
                  <p className="text-[10px] text-zinc-500">Acción de Administrador General</p>
                </div>
              </div>

              <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 rounded-xl text-xs text-red-900 dark:text-red-200 leading-relaxed font-medium">
                {showConfirmModal === 'schedules' && 'Se eliminarán todos los cronogramas guardados en Firestore.'}
                {showConfirmModal === 'correlativos' && 'Se eliminarán todos los correlativos emitidos.'}
                {showConfirmModal === 'counters' && 'Se reiniciarán los numeradores CP, INF, INI a 0.'}
                {showConfirmModal === 'full' && '¡ATENCIÓN! Se eliminarán todos los cronogramas, correlativos y se reiniciarán contadores en la base de datos central.'}
              </div>

              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowConfirmModal(null)}
                  className="px-3 py-1.5 text-xs font-bold text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleExecuteDbCleanup}
                  className="px-4 py-1.5 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-lg shadow-xs uppercase tracking-wider"
                >
                  Sí, Ejecutar
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

