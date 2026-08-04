import React, { useState } from 'react';
import { X, UserPlus, Users, Calendar, Trash2, Plus, ShieldAlert } from 'lucide-react';
import { capitalizeName } from '../utils/textUtils';
import { GRADOS_ACADEMICOS } from './Sidebar';
import { UserProfile } from '../types';

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
  const [activeTab, setActiveTab] = useState<'docentes' | 'coordinadores' | 'feriados'>('docentes');
  const [newDocenteGrado, setNewDocenteGrado] = useState('Lic.');
  const [newDocenteInput, setNewDocenteInput] = useState('');
  const [newCoordInput, setNewCoordInput] = useState('');
  const [newHolidayInput, setNewHolidayInput] = useState('');

  if (!isOpen) return null;

  const isAdmin = currentUser?.role === 'admin';

  const handleAddDocenteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) return;
    const formatted = capitalizeName(newDocenteInput.trim());
    if (formatted) {
      const fullDocente = newDocenteGrado ? `${newDocenteGrado} ${formatted}` : formatted;
      onAddDocente(fullDocente);
      setNewDocenteInput('');
    }
  };

  const handleAddCoordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) return;
    const formatted = capitalizeName(newCoordInput.trim());
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

  return (
    <div className="fixed inset-0 bg-zinc-950/70 dark:bg-zinc-950/80 backdrop-blur-xs flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="px-6 py-4 bg-zinc-50 dark:bg-zinc-950 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold shadow-md shadow-emerald-600/20 font-display">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xs font-bold text-zinc-900 dark:text-zinc-100 uppercase tracking-wider font-display">
                Gestión de Personal & Feriados Locales
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
                Solo el Administrador General puede agregar o modificar los catálogos de feriados y oferta académica.
              </p>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="flex border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-6 pt-2 font-display">
          <button
            onClick={() => setActiveTab('docentes')}
            className={`pb-3 px-3 text-[11px] font-bold uppercase tracking-wider border-b-2 transition-colors cursor-pointer ${
              activeTab === 'docentes'
                ? 'border-emerald-600 dark:border-emerald-400 text-emerald-700 dark:text-emerald-300'
                : 'border-transparent text-zinc-400 dark:text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'
            }`}
          >
            Docentes ({savedDocentes.length})
          </button>
          <button
            onClick={() => setActiveTab('coordinadores')}
            className={`pb-3 px-3 text-[11px] font-bold uppercase tracking-wider border-b-2 transition-colors cursor-pointer ${
              activeTab === 'coordinadores'
                ? 'border-emerald-600 dark:border-emerald-400 text-emerald-700 dark:text-emerald-300'
                : 'border-transparent text-zinc-400 dark:text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'
            }`}
          >
            Técnicos ({savedCoordinadores.length})
          </button>
          <button
            onClick={() => setActiveTab('feriados')}
            className={`pb-3 px-3 text-[11px] font-bold uppercase tracking-wider border-b-2 transition-colors cursor-pointer ${
              activeTab === 'feriados'
                ? 'border-emerald-600 dark:border-emerald-400 text-emerald-700 dark:text-emerald-300'
                : 'border-transparent text-zinc-400 dark:text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'
            }`}
          >
            Feriados ({feriadosLocales.length})
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
                    {GRADOS_ACADEMICOS.map(g => (
                      <option key={g} value={g} className="bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100">{g}</option>
                    ))}
                    <option value="" className="bg-white dark:bg-zinc-900 text-zinc-500">(Sin Grado)</option>
                  </select>
                  <input
                    type="text"
                    placeholder="Escriba Nombre y Apellido..."
                    value={newDocenteInput}
                    onChange={e => setNewDocenteInput(capitalizeName(e.target.value))}
                    className="flex-1 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-3 py-2 text-xs text-zinc-900 dark:text-zinc-100 font-semibold focus:outline-none focus:border-emerald-600 focus:bg-white dark:focus:bg-zinc-900"
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
                    onChange={e => setNewCoordInput(capitalizeName(e.target.value))}
                    className="flex-1 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-3 py-2 text-xs text-zinc-900 dark:text-zinc-100 font-semibold focus:outline-none focus:border-emerald-600 focus:bg-white dark:focus:bg-zinc-900"
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
      </div>
    </div>
  );
};
