import React, { useState } from 'react';
import { X, Send, Mail, Calendar, Copy, Check, ExternalLink, Download, MessageSquare, FileText } from 'lucide-react';
import { ProgramacionResultado } from '../types';
import { downloadICSFile, getWhatsAppShareURL, getEmailShareData } from '../utils/calendarAndSharing';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  resultado: ProgramacionResultado | null;
}

export const ShareModal: React.FC<ShareModalProps> = ({ isOpen, onClose, resultado }) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen || !resultado) return null;

  const whatsappURL = getWhatsAppShareURL(resultado);
  const emailData = getEmailShareData(resultado);

  const handleCopyText = () => {
    navigator.clipboard.writeText(emailData.body);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col">
        {/* Modal Header */}
        <div className="px-6 py-4 bg-zinc-50 dark:bg-zinc-800/80 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between font-display">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold">
              <Send className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-display text-base font-bold text-zinc-900 dark:text-white leading-tight">
                Notificar y Exportar Cronograma
              </h3>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400 font-medium">
                Sede UNEFCO La Paz — Docente: <span className="text-emerald-600 dark:text-emerald-400 font-bold">{resultado.facilitador || 'Por asignar'}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5 overflow-y-auto max-h-[80vh]">
          {/* Option 1: WhatsApp */}
          <div className="bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/50 p-4 rounded-xl flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0">
                <MessageSquare className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-emerald-950 dark:text-emerald-200 uppercase tracking-wide font-display">
                  Enviar por WhatsApp
                </h4>
                <p className="text-[11px] text-emerald-800/80 dark:text-emerald-400">
                  Envía el resumen estructurado de clases y fechas directamente al WhatsApp del docente.
                </p>
              </div>
            </div>
            <a
              href={whatsappURL}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-emerald-600 hover:bg-emerald-500 text-white px-3.5 py-2 rounded-lg font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 shrink-0 transition-colors shadow-2xs font-display"
            >
              <span>Enviar</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>

          {/* Option 2: Email (Gmail / Client) */}
          <div className="bg-teal-50/60 dark:bg-teal-950/20 border border-teal-200 dark:border-teal-800/50 p-4 rounded-xl flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-teal-600 text-white flex items-center justify-center shrink-0">
                <Mail className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-teal-950 dark:text-teal-200 uppercase tracking-wide font-display">
                  Enviar por Correo Electrónico
                </h4>
                <p className="text-[11px] text-teal-800/80 dark:text-teal-400">
                  Abre tu correo con el asunto <strong className="font-mono">Calendario Académico UNEFCO-LP</strong>.
                </p>
              </div>
            </div>
            <a
              href={emailData.mailtoURL}
              className="bg-teal-600 hover:bg-teal-500 text-white px-3.5 py-2 rounded-lg font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 shrink-0 transition-colors shadow-2xs font-display"
            >
              <span>Redactar</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>

          {/* Option 3: Export to Google Calendar / .ics */}
          <div className="bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700/80 p-4 rounded-xl flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-zinc-800 dark:bg-zinc-700 text-white flex items-center justify-center shrink-0">
                <Calendar className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-zinc-900 dark:text-zinc-100 uppercase tracking-wide flex items-center gap-1.5 font-display">
                  Google Calendar / iCal (.ics)
                </h4>
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                  Descarga el archivo de eventos para agregar automáticamente las clases y reportes a Google Calendar.
                </p>
              </div>
            </div>
            <button
              onClick={() => downloadICSFile(resultado)}
              className="bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-white text-white dark:text-zinc-900 px-3.5 py-2 rounded-lg font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 shrink-0 transition-colors shadow-2xs cursor-pointer font-display"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Descargar .ics</span>
            </button>
          </div>

          {/* Option 4: Preview & Copy Raw Text */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider flex items-center gap-1 font-display">
                <FileText className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                Vista Previa del Mensaje para el Docente
              </label>
              <button
                onClick={handleCopyText}
                className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1 cursor-pointer font-display"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-500" />
                    <span className="text-emerald-600 dark:text-emerald-400">Copiado al Portapapeles</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copiar Texto</span>
                  </>
                )}
              </button>
            </div>
            <textarea
              readOnly
              rows={6}
              value={emailData.body}
              className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg p-3 text-[11px] font-mono text-zinc-700 dark:text-zinc-300 focus:outline-none resize-none"
            />
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 bg-zinc-50 dark:bg-zinc-800/80 border-t border-zinc-200 dark:border-zinc-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-zinc-200 hover:bg-zinc-300 dark:bg-zinc-700 dark:hover:bg-zinc-600 text-zinc-800 dark:text-zinc-200 rounded-lg font-bold text-xs uppercase tracking-wider cursor-pointer transition-colors font-display"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
