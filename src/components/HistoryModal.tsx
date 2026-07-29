import React from 'react';
import { X, Clock, FileDown, RotateCcw, Trash2, Calendar, UserCheck } from 'lucide-react';
import { ProgramacionResultado } from '../types';
import { formatDateVisual } from '../utils/textUtils';
import { generatePDFDocument } from '../utils/pdfGenerator';

interface HistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  history: ProgramacionResultado[];
  onLoadSchedule: (prog: ProgramacionResultado) => void;
  onClearHistory: () => void;
  onRemoveHistoryItem: (id: string) => void;
}

export const HistoryModal: React.FC<HistoryModalProps> = ({
  isOpen,
  onClose,
  history,
  onLoadSchedule,
  onClearHistory,
  onRemoveHistoryItem
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-sm w-full max-w-3xl overflow-hidden shadow-2xl flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-2xs bg-indigo-600 text-white flex items-center justify-center font-bold">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
                Historial de Cronogramas Generados
              </h2>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-tight">
                Registros guardados localmente ({history.length})
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {history.length > 0 && (
              <button
                type="button"
                onClick={onClearHistory}
                className="text-[10px] font-bold text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/40 px-2.5 py-1 rounded-2xs uppercase tracking-wider transition-colors cursor-pointer"
              >
                Limpiar Historial
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-2xs transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-3 flex-1">
          {history.length === 0 ? (
            <div className="text-center py-12 text-slate-400 dark:text-slate-500 text-xs italic space-y-2">
              <Clock className="w-8 h-8 mx-auto text-slate-300 dark:text-slate-600" />
              <p>No hay cronogramas guardados en el historial aún.</p>
              <p className="text-[10px] text-slate-400">Genere un nuevo cronograma desde el panel lateral para guardarlo automáticamente.</p>
            </div>
          ) : (
            history.map((item) => (
              <div
                key={item.idTransaccion}
                className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 p-4 rounded-2xs flex flex-wrap items-center justify-between gap-4 hover:border-indigo-300 dark:hover:border-indigo-700 transition-colors"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
                      Docente: {item.facilitador}
                    </span>
                    <span className="text-[10px] bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-bold px-2 py-0.5 rounded-2xs border border-indigo-200 dark:border-indigo-800">
                      ID: {item.idTransaccion}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                    <span>Técnico: <strong className="text-slate-700 dark:text-slate-300">{item.tecnico}</strong></span>
                    <span>•</span>
                    <span>Asignaciones: <strong className="text-slate-700 dark:text-slate-300">{item.slots.length}</strong></span>
                    <span>•</span>
                    <span>Inicio: <strong className="text-slate-700 dark:text-slate-300">{formatDateVisual(item.fechaInicioContrato, false)}</strong></span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      onLoadSchedule(item);
                      onClose();
                    }}
                    className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold uppercase tracking-wider rounded-2xs flex items-center gap-1.5 transition-colors cursor-pointer"
                    title="Cargar este cronograma en la vista principal"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Cargar</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => generatePDFDocument(item)}
                    className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold uppercase tracking-wider rounded-2xs flex items-center gap-1.5 transition-colors cursor-pointer"
                    title="Exportar PDF directo"
                  >
                    <FileDown className="w-3.5 h-3.5 text-emerald-400" />
                    <span>PDF</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => onRemoveHistoryItem(item.idTransaccion)}
                    className="p-1.5 text-slate-400 hover:text-red-600 transition-colors cursor-pointer"
                    title="Eliminar de historial"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-100 dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 flex justify-end shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold uppercase tracking-widest px-5 py-2 rounded-2xs transition-colors cursor-pointer"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
