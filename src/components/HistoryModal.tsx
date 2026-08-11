import React, { useState } from 'react';
import { X, Clock, FileDown, RotateCcw, Trash2, ShieldCheck, Lock, AlertCircle, Ban, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { ProgramacionResultado, UserProfile } from '../types';
import { formatDateVisual } from '../utils/textUtils';
import { generatePDFDocument } from '../utils/pdfGenerator';

interface HistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  history: ProgramacionResultado[];
  onSelectHistoryItem: (prog: ProgramacionResultado) => void;
  onAnularHistoryItem: (id: string, motivo: string) => void;
  onDeleteHistoryItem: (id: string) => void;
  onClearHistory?: () => void;
  currentUser?: UserProfile | null;
  activeRole?: string;
}

export const HistoryModal: React.FC<HistoryModalProps> = ({
  isOpen,
  onClose,
  history,
  onSelectHistoryItem,
  onAnularHistoryItem,
  onDeleteHistoryItem,
  onClearHistory,
  currentUser,
  activeRole = 'tecnico'
}) => {
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  if (!isOpen) return null;

  const isAdmin = activeRole === 'admin' || currentUser?.role === 'admin';
  const currentTechName = currentUser?.displayName?.trim().toLowerCase() || '';

  // Can the user clear all history? Only Admin or if all records belong to current user
  const canClearAll = isAdmin || history.every(h => h.tecnico.trim().toLowerCase() === currentTechName);

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-zinc-950/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ duration: 0.2 }}
          className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl w-full max-w-3xl overflow-hidden shadow-2xl flex flex-col max-h-[85vh]"
        >
          {/* Header */}
          <div className="px-6 py-4 bg-zinc-50 dark:bg-zinc-800/80 border-b border-zinc-200 dark:border-zinc-700 flex items-center justify-between shrink-0 font-display">
            <div className="flex items-center gap-3">
              <motion.div 
                whileHover={{ rotate: 180 }}
                transition={{ duration: 0.4 }}
                className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold shadow-xs"
              >
                <Clock className="w-5 h-5" />
              </motion.div>
              <div>
                <h2 className="text-xs font-bold text-zinc-900 dark:text-zinc-100 uppercase tracking-wider flex items-center gap-2 font-display">
                  <span>Historial de Calendarios Académicos</span>
                  {isAdmin ? (
                    <span className="text-[9px] bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800 px-1.5 py-0.5 rounded-full font-extrabold flex items-center gap-1 font-display">
                      <ShieldCheck className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                      ADMIN
                    </span>
                  ) : (
                    <span className="text-[9px] bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 px-1.5 py-0.5 rounded-full font-extrabold flex items-center gap-1 font-display">
                      <Lock className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                      TÉCNICO
                    </span>
                  )}
                </h2>
                <p className="text-[10px] text-zinc-500 dark:text-zinc-400 font-semibold uppercase tracking-tight">
                  {isAdmin 
                    ? `Vista global de administración (${history.length} registros)`
                    : `Control de registros del técnico ${currentUser?.displayName || ''}`}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {history.length > 0 && (
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  type="button"
                  onClick={() => setShowClearConfirm(true)}
                  className="text-[10px] font-bold text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/40 px-3 py-1.5 rounded-xl uppercase tracking-wider transition-colors cursor-pointer border border-red-200 dark:border-red-900/40 flex items-center gap-1 font-display"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Limpiar Todo</span>
                </motion.button>
              )}
              <motion.button
                whileHover={{ scale: 1.1, rotate: 90 }}
                whileTap={{ scale: 0.9 }}
                onClick={onClose}
                className="p-1.5 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-200/60 dark:hover:bg-zinc-800 rounded-xl transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </motion.button>
            </div>
          </div>

          {/* Content Body */}
          <div className="p-6 overflow-y-auto space-y-3 flex-1">
            {history.length === 0 ? (
              <div className="text-center py-12 text-zinc-400 dark:text-zinc-500 text-xs italic space-y-2">
                <motion.div
                  animate={{ y: [0, -4, 0] }}
                  transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
                >
                  <Clock className="w-10 h-10 mx-auto text-zinc-300 dark:text-zinc-600" />
                </motion.div>
                <p className="font-semibold text-zinc-600 dark:text-zinc-400">No hay calendarios académicos guardados en el historial aún.</p>
                <p className="text-[10px] text-zinc-400">Programar un nuevo calendario académico desde la vista principal para registrarlo automáticamente.</p>
              </div>
            ) : (
              history.map((item) => {
                const isOwner = isAdmin || (item.tecnico && item.tecnico.trim().toLowerCase() === currentTechName);

                return (
                  <motion.div
                    key={item.idTransaccion}
                    whileHover={{ x: 2 }}
                    className="glass-panel p-4 rounded-xl flex flex-wrap items-center justify-between gap-4 transition-all shadow-2xs hover:border-emerald-500/30"
                  >
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                          Docente: {item.facilitador}
                        </span>
                        <span className="text-[10px] bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-bold px-2 py-0.5 rounded-lg border border-emerald-200 dark:border-emerald-800 font-mono">
                          ID: {item.idTransaccion}
                        </span>
                        {item.rolOperador && (
                          <span className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded-md border uppercase tracking-wide font-display ${
                            item.rolOperador === 'admin'
                              ? 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800'
                              : 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                          }`}>
                            Rol: {item.rolOperador === 'admin' ? 'ADMIN' : 'TÉCNICO'}
                          </span>
                        )}
                        {item.estado === 'ANULADO' && (
                          <span className="text-[9px] bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-300 font-bold px-2 py-0.5 rounded-lg border border-red-200 dark:border-red-800 uppercase flex items-center gap-1 font-display">
                            <Ban className="w-3 h-3 text-red-600" />
                            Anulado
                          </span>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-3 text-[11px] text-zinc-500 dark:text-zinc-400 font-medium">
                        <span>Técnico: <strong className="text-zinc-800 dark:text-zinc-200">{item.tecnico}</strong></span>
                        <span>•</span>
                        <span>Asignaciones: <strong className="text-zinc-800 dark:text-zinc-200">{item.slots.length}</strong></span>
                        <span>•</span>
                        <span>Inicio: <strong className="text-zinc-800 dark:text-zinc-200">{formatDateVisual(item.fechaInicioContrato, false)}</strong></span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <motion.button
                        whileHover={{ scale: 1.04 }}
                        whileTap={{ scale: 0.96 }}
                        type="button"
                        onClick={() => {
                          onSelectHistoryItem(item);
                          onClose();
                        }}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold uppercase tracking-wider rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs font-display"
                        title="Cargar este cronograma en la vista principal"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Cargar</span>
                      </motion.button>

                      <motion.button
                        whileHover={{ scale: 1.04 }}
                        whileTap={{ scale: 0.96 }}
                        type="button"
                        onClick={() => generatePDFDocument(item)}
                        className="px-3 py-1.5 bg-zinc-900 dark:bg-zinc-700 hover:bg-zinc-800 dark:hover:bg-zinc-600 text-white text-xs font-bold uppercase tracking-wider rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs font-display"
                        title="Exportar PDF directo"
                      >
                        <FileDown className="w-3.5 h-3.5 text-emerald-400" />
                        <span>PDF</span>
                      </motion.button>

                      {/* Anular Button (Available to Owner Technician and Admin) */}
                      {isOwner && item.estado !== 'ANULADO' && (
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          type="button"
                          onClick={() => {
                            const motivo = prompt('Por favor ingrese el motivo de la anulación de este cronograma:') || 'Anulación realizada por el Técnico de Seguimiento';
                            onAnularHistoryItem(item.idTransaccion, motivo);
                          }}
                          className="px-2.5 py-1.5 text-amber-700 dark:text-amber-400 bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 rounded-xl transition-colors cursor-pointer text-xs font-bold uppercase flex items-center gap-1 font-display"
                          title="Anular cronograma (No se borra del historial)"
                        >
                          <Ban className="w-3.5 h-3.5" />
                          <span>Anular</span>
                        </motion.button>
                      )}

                      {/* Delete Button (Admin or Owner) */}
                      {(isAdmin || isOwner) ? (
                        <motion.button
                          whileHover={{ scale: 1.1, rotate: 6 }}
                          whileTap={{ scale: 0.9 }}
                          type="button"
                          onClick={() => {
                            if (confirm(`¿Confirma eliminar definitivamente el cronograma ${item.idTransaccion}? Esta acción no se puede deshacer.`)) {
                              onDeleteHistoryItem(item.idTransaccion);
                            }
                          }}
                          className="p-2 text-zinc-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-xl transition-colors cursor-pointer"
                          title="Eliminar permanentemente del historial"
                        >
                          <Trash2 className="w-4 h-4" />
                        </motion.button>
                      ) : (
                        <div 
                          className="p-1.5 text-zinc-400 dark:text-zinc-600 bg-zinc-100 dark:bg-zinc-800 rounded-xl flex items-center gap-1 text-[10px] font-bold font-display"
                          title="Solo el técnico autor o el Administrador pueden modificar este registro"
                        >
                          <Lock className="w-3.5 h-3.5 shrink-0" />
                          <span className="hidden sm:inline font-mono">Protegido</span>
                        </div>
                      )}
                    </div>
                  </motion.div>
                );
              })
            )}
          </div>

          {/* Footer */}
          <div className="px-6 py-3 bg-zinc-100 dark:bg-zinc-800/80 border-t border-zinc-200 dark:border-zinc-700 flex justify-between items-center shrink-0">
            <span className="text-[10px] text-zinc-500 dark:text-zinc-400 font-semibold flex items-center gap-1">
              <AlertCircle className="w-3.5 h-3.5 text-amber-500" />
              <span>Los técnicos solo pueden anular sus propios cronogramas. Los administradores tienen acceso global.</span>
            </span>
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              type="button"
              onClick={onClose}
              className="bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-bold uppercase tracking-widest px-5 py-2 rounded-xl transition-colors cursor-pointer font-display"
            >
              Cerrar
            </motion.button>
          </div>
        </motion.div>

        {/* Are You Sure? Confirmation Step Overlay */}
        <AnimatePresence>
          {showClearConfirm && (
            <div className="fixed inset-0 bg-zinc-950/80 backdrop-blur-xs flex items-center justify-center p-4 z-50">
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 12 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 12 }}
                transition={{ duration: 0.2 }}
                className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 font-display"
              >
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-400 rounded-2xl shrink-0">
                    <AlertTriangle className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-zinc-900 dark:text-white uppercase tracking-wide">
                      ¿Eliminar todo el historial?
                    </h3>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">
                      Paso de confirmación de seguridad
                    </p>
                  </div>
                </div>

                <div className="bg-red-50/70 dark:bg-red-950/30 p-3.5 rounded-xl border border-red-200/80 dark:border-red-900/50 space-y-1.5">
                  <p className="text-xs text-red-900 dark:text-red-200 leading-relaxed font-medium">
                    Se eliminarán permanentemente <strong className="font-extrabold underline">{history.length} registro(s)</strong> de la base de datos central y del sistema local.
                  </p>
                  <p className="text-[11px] text-red-700 dark:text-red-400">
                    ⚠️ Esta acción no se puede deshacer ni recuperar posteriormente.
                  </p>
                </div>

                <div className="flex items-center justify-end gap-2.5 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowClearConfirm(false)}
                    className="px-4 py-2 text-xs font-bold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl transition-colors cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      onClearHistory?.();
                      setShowClearConfirm(false);
                    }}
                    className="px-4 py-2 text-xs font-bold text-white bg-red-600 hover:bg-red-700 active:bg-red-800 rounded-xl shadow-sm transition-colors cursor-pointer flex items-center gap-1.5 uppercase tracking-wider"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Sí, Limpiar Historial</span>
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </AnimatePresence>
  );
};

