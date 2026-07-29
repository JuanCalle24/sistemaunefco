import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, doc, setDoc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { UserProfile, UserRole, UserStatus } from '../types';
import { OFFICIAL_TEAM_PRESETS, saveCustomUserLocal } from '../utils/authService';
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
  Key
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
  
  // New user form state
  const [showAddForm, setShowAddForm] = useState(false);
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('Unefco2026');
  const [newCargo, setNewCargo] = useState('Técnico de Seguimiento Pedagógico');
  const [newRole, setNewRole] = useState<UserRole>('tecnico');
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);

  // Subscribe to users collection in Firestore
  useEffect(() => {
    if (!isOpen) return;

    setLoadingUsers(true);
    const unsubscribe = onSnapshot(
      collection(db, 'users'),
      (snapshot) => {
        const map = new Map<string, UserProfile>();

        // Always seed initial team members in list
        OFFICIAL_TEAM_PRESETS.forEach(item => map.set(item.uid, item));

        snapshot.forEach((docSnap) => {
          map.set(docSnap.id, { uid: docSnap.id, ...docSnap.data() } as UserProfile);
        });

        const list = Array.from(map.values());
        list.sort((a, b) => {
          if (a.role === 'admin' && b.role !== 'admin') return -1;
          if (a.role !== 'admin' && b.role === 'admin') return 1;
          return a.displayName.localeCompare(b.displayName);
        });

        setUsers(list);
        setLoadingUsers(false);
      },
      (err) => {
        console.warn('Cargando lista base de usuarios:', err);
        setUsers(OFFICIAL_TEAM_PRESETS);
        setLoadingUsers(false);
      }
    );

    return () => unsubscribe();
  }, [isOpen]);

  if (!isOpen) return null;

  const handleToggleStatus = async (targetUser: UserProfile) => {
    if (targetUser.uid === currentUser.uid) {
      alert('No puedes desactivar tu propia cuenta de Administrador.');
      return;
    }

    const newStatus: UserStatus = targetUser.status === 'active' ? 'inactive' : 'active';
    try {
      const userRef = doc(db, 'users', targetUser.uid);
      await updateDoc(userRef, { status: newStatus });
    } catch (err: any) {
      // Local state fallback
      setUsers(prev => prev.map(u => u.uid === targetUser.uid ? { ...u, status: newStatus } : u));
    }
  };

  const handleToggleRole = async (targetUser: UserProfile) => {
    if (targetUser.uid === currentUser.uid) {
      alert('No puedes cambiar tu propio rol de Administrador.');
      return;
    }

    const newRoleVal: UserRole = targetUser.role === 'admin' ? 'tecnico' : 'admin';
    try {
      const userRef = doc(db, 'users', targetUser.uid);
      await updateDoc(userRef, { role: newRoleVal });
    } catch (err: any) {
      setUsers(prev => prev.map(u => u.uid === targetUser.uid ? { ...u, role: newRoleVal } : u));
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setFormSuccess(null);

    if (!newName.trim() || !newPassword.trim()) {
      setFormError('Por favor complete el nombre y la contraseña.');
      return;
    }

    const formattedName = newName.trim().toUpperCase();
    const formattedEmail = newEmail.trim() || `${formattedName.toLowerCase().replace(/\s+/g, '.')}@unefco.edu.bo`;
    const newUid = `user_tec_${Date.now()}`;

    setFormLoading(true);

    try {
      const newUserProfile: UserProfile = {
        uid: newUid,
        email: formattedEmail,
        displayName: formattedName,
        role: newRole,
        status: 'active',
        cargo: newCargo.trim() || 'Técnico de Seguimiento Pedagógico UNEFCO La Paz',
        createdAt: new Date().toISOString(),
        lastLogin: new Date().toISOString()
      };

      // 1. Save in Firestore
      try {
        await setDoc(doc(db, 'users', newUid), newUserProfile);
      } catch (e) {
        console.warn('Firestore write warning:', e);
      }

      // 2. Save in Local Auth Registry
      saveCustomUserLocal(newUserProfile, newPassword.trim());

      setFormSuccess(`¡Técnico "${formattedName}" registrado exitosamente con la contraseña "${newPassword.trim()}"!`);
      setNewName('');
      setNewEmail('');
      setNewPassword('Unefco2026');
      setShowAddForm(false);
    } catch (err: any) {
      console.error('Error al registrar técnico:', err);
      setFormError(`Error al registrar usuario: ${err.message}`);
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Modal Header */}
        <div className="p-5 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-600/30 border border-indigo-400/40 rounded-lg flex items-center justify-center">
              <Users className="w-5 h-5 text-indigo-400" />
            </div>
            <div>
              <span className="text-[10px] font-bold text-indigo-300 uppercase tracking-widest block">
                UNEFCO LA PAZ • MÓDULO ADMINISTRATIVO
              </span>
              <h2 className="text-lg font-bold font-display">
                Gestión de Técnicos de Seguimiento
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Action Toolbar */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar por nombre o correo..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <button
            onClick={() => {
              setShowAddForm(!showAddForm);
              setFormError(null);
              setFormSuccess(null);
            }}
            className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700 text-white px-3.5 py-2 rounded-md text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer shadow-xs transition-colors"
          >
            <UserPlus className="w-4 h-4" />
            <span>{showAddForm ? 'Ocultar Formulario' : 'Registrar Nuevo Técnico'}</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto flex-1 space-y-5">

          {/* Form to add new technician */}
          {showAddForm && (
            <div className="bg-indigo-50/80 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800/80 rounded-xl p-4 animate-fade-in shadow-xs">
              <h3 className="text-sm font-bold text-indigo-950 dark:text-indigo-200 mb-3 flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <span>Registrar Nuevo Técnico de Seguimiento UNEFCO</span>
              </h3>

              {formError && (
                <div className="mb-3 p-2.5 bg-red-100 dark:bg-red-950/60 border border-red-300 dark:border-red-800 text-red-800 dark:text-red-200 rounded-md text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <form onSubmit={handleCreateUser} className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
                    Nombre Completo del Técnico
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. LIC. MARIO MAMANI CONDORI"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    className="w-full px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-md text-xs font-medium"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
                    Correo Electrónico (Opcional)
                  </label>
                  <input
                    type="email"
                    placeholder="mario.mamani@unefco.edu.bo"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    className="w-full px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-md text-xs"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
                    Contraseña de Acceso
                  </label>
                  <div className="relative">
                    <Key className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      required
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full pl-8 pr-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-md text-xs font-mono font-bold"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
                    Cargo / Función
                  </label>
                  <input
                    type="text"
                    placeholder="Ej. Técnico de Seguimiento Pedagógico"
                    value={newCargo}
                    onChange={(e) => setNewCargo(e.target.value)}
                    className="w-full px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-md text-xs"
                  />
                </div>

                <div className="sm:col-span-2 flex items-center justify-between pt-2 border-t border-indigo-200/60 dark:border-indigo-800/60">
                  <div className="flex items-center gap-3">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Rol asignado:</label>
                    <label className="inline-flex items-center gap-1.5 text-xs text-slate-800 dark:text-slate-200 cursor-pointer">
                      <input
                        type="radio"
                        name="userRole"
                        value="tecnico"
                        checked={newRole === 'tecnico'}
                        onChange={() => setNewRole('tecnico')}
                        className="text-indigo-600 focus:ring-indigo-500"
                      />
                      <span>Técnico de Seguimiento</span>
                    </label>
                    <label className="inline-flex items-center gap-1.5 text-xs text-slate-800 dark:text-slate-200 cursor-pointer">
                      <input
                        type="radio"
                        name="userRole"
                        value="admin"
                        checked={newRole === 'admin'}
                        onChange={() => setNewRole('admin')}
                        className="text-indigo-600 focus:ring-indigo-500"
                      />
                      <span>Administrador General</span>
                    </label>
                  </div>

                  <button
                    type="submit"
                    disabled={formLoading}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs uppercase tracking-wider py-2 px-4 rounded-md transition-colors cursor-pointer shadow-xs disabled:opacity-50"
                  >
                    {formLoading ? 'Guardando...' : 'Guardar y Habilitar Técnico'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {formSuccess && (
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 rounded-md text-xs flex items-center gap-2 font-medium">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
              <span>{formSuccess}</span>
            </div>
          )}

          {/* User List Table */}
          <div className="border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden bg-white dark:bg-slate-900 shadow-2xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[11px] font-bold uppercase tracking-wider border-b border-slate-200 dark:border-slate-700">
                    <th className="py-2.5 px-4">Técnico / Usuario</th>
                    <th className="py-2.5 px-4">Correo</th>
                    <th className="py-2.5 px-4">Cargo</th>
                    <th className="py-2.5 px-4 text-center">Rol</th>
                    <th className="py-2.5 px-4 text-center">Estado</th>
                    <th className="py-2.5 px-4 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-xs text-slate-800 dark:text-slate-200">
                  {loadingUsers ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-500">
                        Cargando personal de seguimiento...
                      </td>
                    </tr>
                  ) : filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-500">
                        No se encontraron técnicos registrados.
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map((u) => {
                      const isSelf = u.uid === currentUser.uid;
                      const isActive = u.status === 'active';
                      const isAdminRole = u.role === 'admin';

                      return (
                        <tr key={u.uid} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                          <td className="py-3 px-4">
                            <div className="font-bold flex items-center gap-2">
                              <span>{u.displayName}</span>
                              {isSelf && (
                                <span className="bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 text-[10px] px-1.5 py-0.5 rounded-xs font-bold">
                                  Tú (Admin)
                                </span>
                              )}
                            </div>
                            <span className="text-[10px] text-slate-400 block font-mono">ID: {u.uid}</span>
                          </td>

                          <td className="py-3 px-4 font-mono text-slate-600 dark:text-slate-300 text-[11px]">
                            {u.email}
                          </td>

                          <td className="py-3 px-4 text-slate-600 dark:text-slate-400 text-[11px]">
                            {u.cargo || 'Técnico de Seguimiento'}
                          </td>

                          <td className="py-3 px-4 text-center">
                            <button
                              onClick={() => !isSelf && handleToggleRole(u)}
                              disabled={isSelf}
                              className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider cursor-pointer ${
                                isAdminRole 
                                  ? 'bg-purple-100 text-purple-800 dark:bg-purple-950/80 dark:text-purple-300 border border-purple-300' 
                                  : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-300'
                              } ${isSelf ? 'opacity-80 cursor-default' : 'hover:opacity-80'}`}
                              title={isSelf ? 'Es tu propia cuenta' : 'Hacer clic para cambiar rol'}
                            >
                              {isAdminRole ? <ShieldCheck className="w-3 h-3 text-purple-600" /> : <Briefcase className="w-3 h-3 text-slate-500" />}
                              <span>{isAdminRole ? 'ADMIN' : 'TÉCNICO'}</span>
                            </button>
                          </td>

                          <td className="py-3 px-4 text-center">
                            <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${
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
                                className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-colors cursor-pointer inline-flex items-center gap-1 ${
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
                              <span className="text-[10px] text-slate-400 italic">Cuenta Principal</span>
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

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 flex items-center justify-between text-xs text-slate-500">
          <span>Personal Registrado: <strong>{users.length} técnicos</strong></span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs uppercase tracking-wider rounded-md cursor-pointer transition-colors"
          >
            Cerrar
          </button>
        </div>

      </div>
    </div>
  );
};
