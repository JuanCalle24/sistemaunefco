import React from 'react';
import { X, Clock, FileDown, RotateCcw, Trash2, ShieldCheck, Lock, AlertCircle, Ban } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { ProgramacionResultado, UserProfile } from '../types';
import { formatDateVisual } from '../utils/textUtils';
import { generatePDFDocument } from '../utils/pdfGenerator';

interface HistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  history: ProgramacionResultado[];
  onLoadSchedule: (prog: ProgramacionResultado) => void;
  onClearHistory: () => void;
  onRemoveHistoryItem: (id: string) => void;
  currentUser?: UserProfile | null;
}

export const HistoryModal: React.FC<HistoryModalProps> = ({
  isOpen,
  onClose,
  history,
  onLoadSchedule,
  onClearHistory,
  onRemoveHistoryItem,
  currentUser
}) => {
  if (!isOpen) return null;

  const isAdmin = currentUser?.role === 'admin';
  const currentTechName = currentUser?.displayName?.trim().toLowerCase() || '';

  // Can the user clear all history? Only Admin or if all records belong to current user
  const canClearAll = isAdmin || history.every(h => h.tecnico.trim().toLowerCase() === currentTechName);

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ duration: 0.2 }}
          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-3xl overflow-hidden shadow-2xl flex flex-col max-h-[85vh]"
        >
          {/* Header */}
          <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <motion.div 
                whileHover={{ rotate: 180 }}
                transition={{ duration: 0.4 }}
                className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold shadow-xs"
              >
                <Clock className="w-5 h-5" />
              </motion.div>
              <div>
                <h2 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider flex items-center gap-2">
                  <span>Historial de Cronogramas</span>
                  {isAdmin ? (
                    <span className="text-[9px] bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800 px-1.5 py-0.5 rounded-full font-extrabold flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3 text-purple-600 dark:text-purple-400" />
                      ADMIN
                    </span>
                  ) : (
                    <span className="text-[9px] bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 px-1.5 py-0.5 rounded-full font-extrabold flex items-center gap-1">
                      <Lock className="w-3 h-3 text-indigo-600 dark:text-indigo-400" />
                      TÉCNICO
                    </span>
                  )}
                </h2>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-tight">
                  {isAdmin 
                    ? `Vista global de administración (${history.length} registros)`
                    : `Control de registros del técnico ${currentUser?.displayName || ''}`}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {history.length > 0 && canClearAll && (
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  type="button"
                  onClick={onClearHistory}
                  className="text-[10px] font-bold text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/40 px-3 py-1.5 rounded-xl uppercase tracking-wider transition-colors cursor-pointer border border-red-200 dark:border-red-900/40 flex items-center gap-1"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Limpiar Todo</span>
                </motion.button>
              )}
              <motion.button
                whileHover={{ scale: 1.1, rotate: 90 }}
                whileTap={{ scale: 0.9 }}
                onClick={onClose}
                className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </motion.button>
            </div>
          </div>

          {/* Content Body */}
          <div className="p-6 overflow-y-auto space-y-3 flex-1">
            {history.length === 0 ? (
              <div className="text-center py-12 text-slate-400 dark:text-slate-500 text-xs italic space-y-2">
                <motion.div
                  animate={{ y: [0, -4, 0] }}
                  transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
                >
                  <Clock className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-600" />
                </motion.div>
                <p className="font-semibold text-slate-600 dark:text-slate-400">No hay cronogramas guardados en el historial aún.</p>
                <p className="text-[10px] text-slate-400">Genere un nuevo cronograma desde la vista principal para registrarlo automáticamente.</p>
              </div>
            ) : (
              history.map((item) => {
                const isOwner = isAdmin || (item.tecnico && item.tecnico.trim().toLowerCase() === currentTechName);

                return (
                  <motion.div
                    key={item.idTransaccion}
                    whileHover={{ x: 2 }}
                    className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 p-4 rounded-xl flex flex-wrap items-center justify-between gap-4 hover:border-indigo-300 dark:hover:border-indigo-700 transition-all shadow-2xs"
                  >
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
                          Docente: {item.facilitador}
                        </span>
                        <span className="text-[10px] bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-bold px-2 py-0.5 rounded-lg border border-indigo-200 dark:border-indigo-800 font-mono">
                          ID: {item.idTransaccion}
                        </span>
                        {item.estado === 'ANULADO' && (
                          <span className="text-[9px] bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-300 font-bold px-2 py-0.5 rounded-lg border border-red-200 dark:border-red-800 uppercase flex items-center gap-1">
                            <Ban className="w-3 h-3 text-red-600" />
                            Anulado
                          </span>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                        <span>Técnico: <strong className="text-slate-800 dark:text-slate-200">{item.tecnico}</strong></span>
                        <span>•</span>
                        <span>Asignaciones: <strong className="text-slate-800 dark:text-slate-200">{item.slots.length}</strong></span>
                        <span>•</span>
                        <span>Inicio: <strong className="text-slate-800 dark:text-slate-200">{formatDateVisual(item.fechaInicioContrato, false)}</strong></span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <motion.button
                        whileHover={{ scale: 1.04 }}
                        whileTap={{ scale: 0.96 }}
                        type="button"
                        onClick={() => {
                          onLoadSchedule(item);
                          onClose();
                        }}
                        className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold uppercase tracking-wider rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
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
                        className="px-3 py-1.5 bg-slate-900 dark:bg-slate-700 hover:bg-slate-800 dark:hover:bg-slate-600 text-white text-xs font-bold uppercase tracking-wider rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
                        title="Exportar PDF directo"
                      >
                        <FileDown className="w-3.5 h-3.5 text-emerald-400" />
                        <span>PDF</span>
                      </motion.button>

                      {/* Delete / Anular Button with Strict Owner/Admin Permission Check */}
                      {isOwner ? (
                        <motion.button
                          whileHover={{ scale: 1.1, rotate: 6 }}
                          whileTap={{ scale: 0.9 }}
                          type="button"
                          onClick={() => onRemoveHistoryItem(item.idTransaccion)}
                          className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-xl transition-colors cursor-pointer"
                          title="Anular / Eliminar de mi historial"
                        >
                          <Trash2 className="w-4 h-4" />
                        </motion.button>
                      ) : (
                        <div 
                          className="p-1.5 text-slate-400 dark:text-slate-600 bg-slate-100 dark:bg-slate-800 rounded-xl flex items-center gap-1 text-[10px] font-bold"
                          title="Solo el técnico autor o el Administrador pueden borrar o anular este registro"
                        >
                          <Lock className="w-3.5 h-3.5 shrink-0" />
                          <span className="hidden sm:inline">Protegido</span>
                        </div>
                      )}
                    </div>
                  </motion.div>
                );
              })
            )}
          </div>

          {/* Footer */}
          <div className="px-6 py-3 bg-slate-100 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-700 flex justify-between items-center shrink-0">
            <span className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold flex items-center gap-1">
              <AlertCircle className="w-3.5 h-3.5 text-amber-500" />
              <span>Los técnicos solo pueden anular sus propios cronogramas. Los administradores tienen acceso global.</span>
            </span>
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              type="button"
              onClick={onClose}
              className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold uppercase tracking-widest px-5 py-2 rounded-xl transition-colors cursor-pointer"
            >
              Cerrar
            </motion.button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

