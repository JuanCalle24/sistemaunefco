import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { UserProfile, UserRole, UserStatus } from '../types';
import {
  X,
  UserPlus,
  Users,
  ShieldCheck,
  UserX,
  UserCheck,
  Search,
  CheckCircle2,
  AlertCircle,
  Briefcase,
  Info
} from 'lucide-react';

interface UserManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserProfile;
}

export const UserManagementModal: React.FC<UserManagementModalProps> = ({
  isOpen,
  onClose,
  currentUser
}) => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const [showAddForm, setShowAddForm] = useState(false);
  const [newUid, setNewUid] = useState('');
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newCargo, setNewCargo] = useState('Técnico de Seguimiento Pedagógico');
  const [newRole, setNewRole] = useState<UserRole>('tecnico');
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);

  const loadUsers = async () => {
    setLoadingUsers(true);
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .order('display_name', { ascending: true });

    if (error) {
      console.warn('Error cargando usuarios:', error);
      setUsers([]);
      setLoadingUsers(false);
      return;
    }

    const mapped: UserProfile[] = (data || []).map((d: any) => ({
      uid: d.uid,
      email: d.email,
      displayName: d.display_name,
      role: d.role,
      status: d.status,
      cargo: d.cargo,
      departamento: d.departamento,
      createdAt: d.created_at,
      lastLogin: d.last_login,
    }));

    mapped.sort((a, b) => {
      if (a.role === 'admin' && b.role !== 'admin') return -1;
      if (a.role !== 'admin' && b.role === 'admin') return 1;
      return a.displayName.localeCompare(b.displayName);
    });

    setUsers(mapped);
    setLoadingUsers(false);
  };

  useEffect(() => {
    if (!isOpen) return;
    loadUsers();
  }, [isOpen]);

  if (!isOpen) return null;

  const handleToggleStatus = async (targetUser: UserProfile) => {
    if (targetUser.uid === currentUser.uid) {
      alert('No puedes desactivar tu propia cuenta de Administrador.');
      return;
    }
    const newStatus: UserStatus = targetUser.status === 'active' ? 'inactive' : 'active';
    const { error } = await supabase
      .from('users')
      .update({ status: newStatus })
      .eq('uid', targetUser.uid);

    if (!error) {
      setUsers(prev => prev.map(u => u.uid === targetUser.uid ? { ...u, status: newStatus } : u));
    }
  };

  const handleToggleRole = async (targetUser: UserProfile) => {
    if (targetUser.uid === currentUser.uid) {
      alert('No puedes cambiar tu propio rol de Administrador.');
      return;
    }
    const newRoleVal: UserRole = targetUser.role === 'admin' ? 'tecnico' : 'admin';
    const { error } = await supabase
      .from('users')
      .update({ role: newRoleVal })
      .eq('uid', targetUser.uid);

    if (!error) {
      setUsers(prev => prev.map(u => u.uid === targetUser.uid ? { ...u, role: newRoleVal } : u));
    }
  };

  const handleCreateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setFormSuccess(null);

    if (!newUid.trim() || !newName.trim() || !newEmail.trim()) {
      setFormError('Por favor complete el UID, nombre y correo.');
      return;
    }

    setFormLoading(true);
    try {
      const { error } = await supabase.from('users').insert({
        uid: newUid.trim(),
        email: newEmail.trim(),
        display_name: newName.trim().toUpperCase(),
        role: newRole,
        status: 'active',
        cargo: newCargo.trim() || 'Técnico de Seguimiento Pedagógico UNEFCO La Paz',
      });

      if (error) throw error;

      setFormSuccess(`¡Perfil de "${newName.trim().toUpperCase()}" creado exitosamente!`);
      setNewUid('');
      setNewName('');
      setNewEmail('');
      setShowAddForm(false);
      loadUsers();
    } catch (err: any) {
      setFormError(`Error al crear perfil: ${err.message}`);
    } finally {
      setFormLoading(false);
    }
  };

  const filteredUsers = users.filter(u =>
    u.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (u.cargo && u.cargo.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/60 backdrop-blur-xs animate-fade-in">
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col max-h-[90vh]">

        <div className="p-4 bg-[#1e2330] text-white flex items-center justify-between border-b border-zinc-800">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-white/10 border border-white/20 rounded flex items-center justify-center">
              <Users className="w-4 h-4 text-zinc-200" />
            </div>
            <div>
              <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider block">
                UNEFCO LA PAZ • MÓDULO ADMINISTRATIVO
              </span>
              <h2 className="text-base font-semibold">
                Gestión de Técnicos de Seguimiento
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-3 border-b border-zinc-200 dark:border-[#333438] bg-zinc-50 dark:bg-[#1e1f21] flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
            <input
              type="text"
              placeholder="Buscar por nombre o correo..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-white dark:bg-[#252628] border border-zinc-200 dark:border-[#333438] rounded text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-[#4573d2]"
            />
          </div>

          <button
            onClick={() => {
              setShowAddForm(!showAddForm);
              setFormError(null);
              setFormSuccess(null);
            }}
            className="w-full sm:w-auto bg-[#4573d2] hover:bg-[#3866c6] text-white px-3 py-1.5 rounded text-xs font-medium flex items-center justify-center gap-2 cursor-pointer transition-colors"
          >
            <UserPlus className="w-4 h-4" />
            <span>{showAddForm ? 'Ocultar Formulario' : 'Registrar Perfil de Técnico'}</span>
          </button>
        </div>

        <div className="p-5 overflow-y-auto flex-1 space-y-5">

          {showAddForm && (
            <div className="bg-emerald-50/80 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/80 rounded-2xl p-4 animate-fade-in shadow-xs">
              <h3 className="text-sm font-bold text-emerald-950 dark:text-emerald-200 mb-3 flex items-center gap-2 font-display">
                <UserPlus className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>Registrar Perfil de Técnico</span>
              </h3>

              <div className="mb-3 p-2.5 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-200 rounded-xl text-xs flex items-start gap-2">
                <Info className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                <span>Primero cree la cuenta en Supabase (Authentication → Add user), copie su UID, y péguelo aquí junto al resto de los datos.</span>
              </div>

              {formError && (
                <div className="mb-3 p-2.5 bg-red-100 dark:bg-red-950/60 border border-red-300 dark:border-red-800 text-red-800 dark:text-red-200 rounded-xl text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <form onSubmit={handleCreateProfile} className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300 mb-1 font-display">
                    UID (copiado de Supabase Authentication)
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. a1b2c3d4-e5f6-..."
                    value={newUid}
                    onChange={(e) => setNewUid(e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-xl text-xs font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300 mb-1 font-display">
                    Nombre Completo del Técnico
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. LIC. MARIO MAMANI CONDORI"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-xl text-xs font-medium"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300 mb-1 font-display">
                    Correo Electrónico
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="mario.mamani@unefco.edu.bo"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-xl text-xs"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300 mb-1 font-display">
                    Cargo / Función
                  </label>
                  <input
                    type="text"
                    placeholder="Ej. Técnico de Seguimiento Pedagógico"
                    value={newCargo}
                    onChange={(e) => setNewCargo(e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-xl text-xs"
                  />
                </div>

                <div className="sm:col-span-2 flex items-center justify-between pt-2 border-t border-emerald-200/60 dark:border-emerald-800/60">
                  <div className="flex items-center gap-3">
                    <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 font-display">Rol asignado:</label>
                    <label className="inline-flex items-center gap-1.5 text-xs text-zinc-800 dark:text-zinc-200 cursor-pointer">
                      <input
                        type="radio"
                        name="userRole"
                        value="tecnico"
                        checked={newRole === 'tecnico'}
                        onChange={() => setNewRole('tecnico')}
                        className="text-emerald-600 focus:ring-emerald-500"
                      />
                      <span>Técnico de Seguimiento</span>
                    </label>
                    <label className="inline-flex items-center gap-1.5 text-xs text-zinc-800 dark:text-zinc-200 cursor-pointer">
                      <input
                        type="radio"
                        name="userRole"
                        value="admin"
                        checked={newRole === 'admin'}
                        onChange={() => setNewRole('admin')}
                        className="text-emerald-600 focus:ring-emerald-500"
                      />
                      <span>Administrador General</span>
                    </label>
                  </div>

                  <button
                    type="submit"
                    disabled={formLoading}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs uppercase tracking-wider py-2 px-4 rounded-xl transition-colors cursor-pointer shadow-xs disabled:opacity-50 font-display"
                  >
                    {formLoading ? 'Guardando...' : 'Guardar Perfil'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {formSuccess && (
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 rounded-xl text-xs flex items-center gap-2 font-medium">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
              <span>{formSuccess}</span>
            </div>
          )}

          <div className="border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden bg-white dark:bg-zinc-900 shadow-2xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 text-[11px] font-bold uppercase tracking-wider border-b border-zinc-200 dark:border-zinc-700 font-display">
                    <th className="py-2.5 px-4">Técnico / Usuario</th>
                    <th className="py-2.5 px-4">Correo</th>
                    <th className="py-2.5 px-4">Cargo</th>
                    <th className="py-2.5 px-4 text-center">Rol</th>
                    <th className="py-2.5 px-4 text-center">Estado</th>
                    <th className="py-2.5 px-4 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800 text-xs text-zinc-800 dark:text-zinc-200">
                  {loadingUsers ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-zinc-500">
                        Cargando personal de seguimiento...
                      </td>
                    </tr>
                  ) : filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-zinc-500">
                        No se encontraron técnicos registrados.
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map((u) => {
                      const isSelf = u.uid === currentUser.uid;
                      const isActive = u.status === 'active';
                      const isAdminRole = u.role === 'admin';

                      return (
                        <tr key={u.uid} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
                          <td className="py-3 px-4">
                            <div className="font-bold flex items-center gap-2">
                              <span>{u.displayName}</span>
                              {isSelf && (
                                <span className="bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 text-[10px] px-1.5 py-0.5 rounded-md font-bold font-display">
                                  Tú (Admin)
                                </span>
                              )}
                            </div>
                            <span className="text-[10px] text-zinc-400 block font-mono">ID: {u.uid.slice(0, 8)}...</span>
                          </td>

                          <td className="py-3 px-4 font-mono text-zinc-600 dark:text-zinc-300 text-[11px]">
                            {u.email}
                          </td>

                          <td className="py-3 px-4 text-zinc-600 dark:text-zinc-400 text-[11px]">
                            {u.cargo || 'Técnico de Seguimiento'}
                          </td>

                          <td className="py-3 px-4 text-center">
                            <button
                              onClick={() => !isSelf && handleToggleRole(u)}
                              disabled={isSelf}
                              className={`inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider cursor-pointer font-display ${
                                isAdminRole
                                  ? 'bg-amber-100 text-amber-900 dark:bg-amber-950/80 dark:text-amber-300 border border-amber-300'
                                  : 'bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 border border-zinc-300'
                              } ${isSelf ? 'opacity-80 cursor-default' : 'hover:opacity-80'}`}
                              title={isSelf ? 'Es tu propia cuenta' : 'Hacer clic para cambiar rol'}
                            >
                              {isAdminRole ? <ShieldCheck className="w-3 h-3 text-amber-600" /> : <Briefcase className="w-3 h-3 text-zinc-500" />}
                              <span>{isAdminRole ? 'ADMIN' : 'TÉCNICO'}</span>
                            </button>
                          </td>

                          <td className="py-3 px-4 text-center">
                            <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-0.5 rounded-full font-display ${
                              isActive
                                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                                : 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300'
                            }`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-emerald-500' : 'bg-red-500'}`}></span>
                              <span>{isActive ? 'ACTIVO' : 'INACTIVO'}</span>
                            </span>
                          </td>

                          <td className="py-3 px-4 text-right">
                            {!isSelf ? (
                              <button
                                onClick={() => handleToggleStatus(u)}
                                className={`px-2.5 py-1 rounded-xl text-[11px] font-bold transition-colors cursor-pointer inline-flex items-center gap-1 font-display ${
                                  isActive
                                    ? 'bg-red-50 hover:bg-red-100 text-red-700 dark:bg-red-950/40 dark:hover:bg-red-900/60 dark:text-red-300 border border-red-200'
                                    : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:hover:bg-emerald-900/60 dark:text-emerald-300 border border-emerald-200'
                                }`}
                              >
                                {isActive ? (
                                  <>
                                    <UserX className="w-3.5 h-3.5" />
                                    <span>Desactivar</span>
                                  </>
                                ) : (
                                  <>
                                    <UserCheck className="w-3.5 h-3.5" />
                                    <span>Activar</span>
                                  </>
                                )}
                              </button>
                            ) : (
                              <span className="text-[10px] text-zinc-400 italic">Cuenta Principal</span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>

        <div className="p-4 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 flex items-center justify-between text-xs text-zinc-500">
          <span>Personal Registrado: <strong>{users.length} técnicos</strong></span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-zinc-200 hover:bg-zinc-300 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 font-bold text-xs uppercase tracking-wider rounded-xl cursor-pointer transition-colors font-display"
          >
            Cerrar
          </button>
        </div>

      </div>
    </div>
  );
};
