import React, { useState } from 'react';
import { X, UserPlus, Users, Calendar, Trash2, Plus } from 'lucide-react';
import { capitalizeName } from '../utils/textUtils';
import { GRADOS_ACADEMICOS } from './Sidebar';

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
  onRemoveFeriadoLocal
}) => {
  const [activeTab, setActiveTab] = useState<'docentes' | 'coordinadores' | 'feriados'>('docentes');
  const [newDocenteGrado, setNewDocenteGrado] = useState('Lic.');
  const [newDocenteInput, setNewDocenteInput] = useState('');
  const [newCoordInput, setNewCoordInput] = useState('');
  const [newHolidayInput, setNewHolidayInput] = useState('');

  if (!isOpen) return null;

  const handleAddDocenteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const formatted = capitalizeName(newDocenteInput.trim());
    if (formatted) {
      const fullDocente = newDocenteGrado ? `${newDocenteGrado} ${formatted}` : formatted;
      onAddDocente(fullDocente);
      setNewDocenteInput('');
    }
  };

  const handleAddCoordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const formatted = capitalizeName(newCoordInput.trim());
    if (formatted) {
      onAddCoordinador(formatted);
      setNewCoordInput('');
    }
  };

  const handleAddHolidaySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newHolidayInput) {
      onAddFeriadoLocal(newHolidayInput);
      setNewHolidayInput('');
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-sm w-full max-w-lg overflow-hidden shadow-xl">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-2xs bg-indigo-600 dark:bg-indigo-500 text-white flex items-center justify-center font-bold">
              <Users className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
                Gestión de Personal & Feriados
              </h2>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-tight">
                Catálogos locales UNEFCO La Paz
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-2xs transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-6 pt-2">
          <button
            onClick={() => setActiveTab('docentes')}
            className={`pb-3 px-3 text-[11px] font-bold uppercase tracking-wider border-b-2 transition-colors cursor-pointer ${
              activeTab === 'docentes'
                ? 'border-indigo-600 dark:border-indigo-400 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            Docentes ({savedDocentes.length})
          </button>
          <button
            onClick={() => setActiveTab('coordinadores')}
            className={`pb-3 px-3 text-[11px] font-bold uppercase tracking-wider border-b-2 transition-colors cursor-pointer ${
              activeTab === 'coordinadores'
                ? 'border-indigo-600 dark:border-indigo-400 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            Técnicos ({savedCoordinadores.length})
          </button>
          <button
            onClick={() => setActiveTab('feriados')}
            className={`pb-3 px-3 text-[11px] font-bold uppercase tracking-wider border-b-2 transition-colors cursor-pointer ${
              activeTab === 'feriados'
                ? 'border-indigo-600 dark:border-indigo-400 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            Feriados ({feriadosLocales.length})
          </button>
        </div>

        {/* Tab Contents */}
        <div className="p-6 max-h-[380px] overflow-y-auto">
          {activeTab === 'docentes' && (
            <div>
              <form onSubmit={handleAddDocenteSubmit} className="flex gap-2 mb-4">
                <select
                  value={newDocenteGrado}
                  onChange={e => setNewDocenteGrado(e.target.value)}
                  className="w-24 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xs px-2 py-2 text-xs font-bold text-indigo-700 dark:text-indigo-300 focus:outline-none focus:border-indigo-600 dark:focus:border-indigo-500 cursor-pointer"
                  title="Grado Académico"
                >
                  {GRADOS_ACADEMICOS.map(g => (
                    <option key={g} value={g} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">{g}</option>
                  ))}
                  <option value="" className="bg-white dark:bg-slate-900 text-slate-500">(Sin Grado)</option>
                </select>
                <input
                  type="text"
                  placeholder="Escriba Nombre y Apellido..."
                  value={newDocenteInput}
                  onChange={e => setNewDocenteInput(capitalizeName(e.target.value))}
                  className="flex-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xs px-3 py-2 text-xs text-slate-900 dark:text-slate-100 font-semibold focus:outline-none focus:border-indigo-600 dark:focus:border-indigo-500 focus:bg-white dark:focus:bg-slate-900"
                />
                <button
                  type="submit"
                  className="bg-indigo-600 dark:bg-indigo-500 hover:bg-indigo-700 dark:hover:bg-indigo-600 text-white text-xs font-bold uppercase tracking-wider px-4 py-2 rounded-2xs flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>Guardar</span>
                </button>
              </form>

              <div className="space-y-1.5">
                {savedDocentes.map((doc, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-2.5 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-750 rounded-2xs text-xs font-semibold text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 transition-colors"
                  >
                    <span className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-500" />
                      {doc}
                    </span>
                    <button
                      type="button"
                      onClick={() => onRemoveDocente(doc)}
                      className="text-slate-400 dark:text-slate-500 hover:text-red-600 dark:hover:text-red-400 p-1 rounded-2xs transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'coordinadores' && (
            <div>
              <form onSubmit={handleAddCoordSubmit} className="flex gap-2 mb-4">
                <input
                  type="text"
                  placeholder="Escriba Nombre y Apellido..."
                  value={newCoordInput}
                  onChange={e => setNewCoordInput(capitalizeName(e.target.value))}
                  className="flex-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xs px-3 py-2 text-xs text-slate-900 dark:text-slate-100 font-semibold focus:outline-none focus:border-indigo-600 dark:focus:border-indigo-500 focus:bg-white dark:focus:bg-slate-900"
                />
                <button
                  type="submit"
                  className="bg-indigo-600 dark:bg-indigo-500 hover:bg-indigo-700 dark:hover:bg-indigo-600 text-white text-xs font-bold uppercase tracking-wider px-4 py-2 rounded-2xs flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Agregar</span>
                </button>
              </form>

              <div className="space-y-1.5">
                {savedCoordinadores.map((coord, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-2.5 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-750 rounded-2xs text-xs font-semibold text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 transition-colors"
                  >
                    <span className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-indigo-500" />
                      {coord}
                    </span>
                    <button
                      type="button"
                      onClick={() => onRemoveCoordinador(coord)}
                      className="text-slate-400 dark:text-slate-500 hover:text-red-600 dark:hover:text-red-400 p-1 rounded-2xs transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'feriados' && (
            <div>
              <form onSubmit={handleAddHolidaySubmit} className="flex gap-2 mb-4">
                <input
                  type="date"
                  value={newHolidayInput}
                  onChange={e => setNewHolidayInput(e.target.value)}
                  className="flex-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xs px-3 py-2 text-xs text-slate-900 dark:text-slate-100 font-bold focus:outline-none focus:border-indigo-600 dark:focus:border-indigo-500 focus:bg-white dark:focus:bg-slate-900"
                />
                <button
                  type="submit"
                  className="bg-indigo-600 dark:bg-indigo-500 hover:bg-indigo-700 dark:hover:bg-indigo-600 text-white text-xs font-bold uppercase tracking-wider px-4 py-2 rounded-2xs flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Calendar className="w-3.5 h-3.5" />
                  <span>Agregar Feriado</span>
                </button>
              </form>

              <div className="space-y-1.5">
                {feriadosLocales.length === 0 ? (
                  <p className="text-xs text-slate-400 dark:text-slate-500 italic text-center py-4">
                    No hay feriados adicionales agregados
                  </p>
                ) : (
                  feriadosLocales.map((f, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-2.5 bg-rose-50 dark:bg-rose-950/60 rounded-2xs text-xs font-bold text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-800"
                    >
                      <span>Feriado Local: {f}</span>
                      <button
                        type="button"
                        onClick={() => onRemoveFeriadoLocal(f)}
                        className="text-rose-400 hover:text-rose-700 dark:hover:text-rose-200 p-1 rounded-2xs transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-50 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="bg-slate-900 dark:bg-indigo-600 hover:bg-slate-800 dark:hover:bg-indigo-500 text-white text-xs font-bold uppercase tracking-widest px-5 py-2 rounded-2xs transition-colors cursor-pointer"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};

