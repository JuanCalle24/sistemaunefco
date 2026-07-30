import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ShieldAlert, Clock, LogOut, CheckCircle2 } from 'lucide-react';

interface InactivityModalProps {
  isOpen: boolean;
  secondsLeft: number;
  onExtendSession: () => void;
  onLogoutNow: () => void;
}

export const InactivityModal: React.FC<InactivityModalProps> = ({
  isOpen,
  secondsLeft,
  onExtendSession,
  onLogoutNow
}) => {
  if (!isOpen) return null;

  const mins = Math.floor(secondsLeft / 60);
  const secs = secondsLeft % 60;
  const timeFormatted = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4 z-50">
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 15 }}
          transition={{ duration: 0.2 }}
          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl p-6 space-y-5"
        >
          <div className="flex items-center gap-3">
            <motion.div
              animate={{ scale: [1, 1.08, 1], rotate: [0, -3, 3, 0] }}
              transition={{ repeat: Infinity, duration: 1.5 }}
              className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 shadow-xs"
            >
              <ShieldAlert className="w-7 h-7" />
            </motion.div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider font-display">
                Advertencia de Inactividad
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                Protección de seguridad activa
              </p>
            </div>
          </div>

          <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 rounded-xl p-4 text-center space-y-2">
            <p className="text-xs text-amber-900 dark:text-amber-200 font-semibold leading-relaxed">
              Su sesión expirará automáticamente por falta de actividad para prevenir accesos no autorizados.
            </p>
            <div className="flex items-center justify-center gap-2 pt-1 font-mono text-2xl font-black text-amber-700 dark:text-amber-300">
              <Clock className="w-6 h-6 animate-pulse" />
              <span>{timeFormatted}</span>
            </div>
            <p className="text-[10px] text-amber-700 dark:text-amber-400 font-medium">
              ✓ Su borrador de trabajo actual será respaldado automáticamente.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-2 pt-2">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="button"
              onClick={onExtendSession}
              className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs uppercase tracking-wider py-3 px-4 rounded-xl flex items-center justify-center gap-2 shadow-md transition-colors cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4 text-indigo-200" />
              <span>Extender Sesión (+15m)</span>
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="button"
              onClick={onLogoutNow}
              className="bg-slate-100 dark:bg-slate-800 hover:bg-red-50 dark:hover:bg-red-950/50 text-slate-700 dark:text-slate-300 hover:text-red-600 border border-slate-200 dark:border-slate-700 font-bold text-xs uppercase tracking-wider py-3 px-4 rounded-xl flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              <span>Salir Ahora</span>
            </motion.button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
