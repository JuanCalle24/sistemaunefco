import React, { useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
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
  Briefcase
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
  const [newPassword, setNewPassword] = useState('');
  const [newCargo, setNewCargo] = useState('Técnico de Seguimiento Pedagógico');
  const [newRole, setNewRole] = useState<UserRole>('tecnico');
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);

  // Cargar usuarios desde Supabase
  const loadUsers = async () => {
    setLoadingUsers(true);
    if (!isSupabaseConfigured) {
      setUsers([]);
      setLoadingUsers(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('usuarios')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (data) {
        const mapped: UserProfile[] = data.map((u: any) => ({
          uid: u.id,
          email: u.email,
          displayName: u.display_name,
          role: u.role as UserRole,
          status: u.status as UserStatus,
          cargo: u.cargo,
          createdAt: u.created_at,
          lastLogin: u.last_login
        }));
        setUsers(mapped);
      }
    } catch (err: any) {
      console.error('Error cargando usuarios de Supabase:', err);
    } finally {
      setLoadingUsers(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadUsers();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleToggleStatus = async (targetUser: UserProfile) => {
    if (targetUser.uid === currentUser.uid) {
      alert('No puedes desactivar tu propia cuenta de Administrador.');
      return;
    }

    const newStatus: UserStatus = targetUser.status === 'active' ? 'inactive' : 'active';
    try {
      if (isSupabaseConfigured) {
        await supabase
          .from('usuarios')
          .update({ status: newStatus })
          .eq('id', targetUser.uid);
      }
      setUsers(prev => prev.map(u => u.uid === targetUser.uid ? { ...u, status: newStatus } : u));
    } catch (err: any) {
      console.error('Error al actualizar estado:', err);
      alert(`Error al actualizar estado en Supabase: ${err.message}`);
    }
  };

  const handleToggleRole = async (targetUser: UserProfile) => {
    if (targetUser.uid === currentUser.uid) {
      alert('No puedes cambiar tu propio rol de Administrador.');
      return;
    }

    const newRoleVal: UserRole = targetUser.role === 'admin' ? 'tecnico' : 'admin';
    try {
      if (isSupabaseConfigured) {
        await supabase
          .from('usuarios')
          .update({ role: newRoleVal })
          .eq('id', targetUser.uid);
      }
      setUsers(prev => prev.map(u => u.uid === targetUser.uid ? { ...u, role: newRoleVal } : u));
    } catch (err: any) {
      console.error('Error al actualizar rol:', err);
      alert(`Error al actualizar rol en Supabase: ${err.message}`);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setFormSuccess(null);

    if (!newName.trim()) {
      setFormError('Por favor complete el nombre completo del técnico.');
      return;
    }

    const formattedName = newName.trim().toUpperCase();
    const formattedEmail = newEmail.trim() || `${formattedName.toLowerCase().replace(/\s+/g, '.')}@unefco.edu.bo`;

    setFormLoading(true);

    try {
      if (!isSupabaseConfigured) {
        throw new Error('Supabase no está configurado. Conecte VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY.');
      }

      // 1. Si se especificó contraseña y correo, registrar en Supabase Auth
      let authUserId: string | null = null;
      if (newPassword.trim()) {
        const { data: signUpData, error: signUpErr } = await supabase.auth.signUp({
          email: formattedEmail,
          password: newPassword.trim(),
          options: {
            data: { display_name: formattedName }
          }
        });
        if (!signUpErr && signUpData.user) {
          authUserId = signUpData.user.id;
        }
      }

      // 2. Guardar en la tabla `usuarios` de Supabase
      const { data: inserted, error: insertErr } = await supabase
        .from('usuarios')
        .insert({
          auth_user_id: authUserId,
          email: formattedEmail,
          display_name: formattedName,
          role: newRole,
          status: 'active',
          cargo: newCargo.trim() || 'Técnico de Seguimiento Pedagógico UNEFCO La Paz',
          created_at: new Date().toISOString(),
          last_login: new Date().toISOString()
        })
        .select()
        .single();

      if (insertErr) throw insertErr;

      const newUserProfile: UserProfile = {
        uid: inserted.id,
        email: inserted.email,
        displayName: inserted.display_name,
        role: inserted.role as UserRole,
        status: inserted.status as UserStatus,
        cargo: inserted.cargo,
        createdAt: inserted.created_at,
        lastLogin: inserted.last_login
      };

      setUsers(prev => [newUserProfile, ...prev]);
      setFormSuccess(`¡Técnico "${formattedName}" registrado exitosamente en Supabase!`);
      setNewName('');
      setNewEmail('');
      setNewPassword('');
      setShowAddForm(false);
    } catch (err: any) {
      console.error('Error al registrar técnico:', err);
      setFormError(`Error al registrar en Supabase: ${err.message}`);
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white dark:bg-[#1e1f21] border border-zinc-200 dark:border-[#333438] rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="p-4 border-b border-zinc-200 dark:border-[#333438] flex items-center justify-between bg-zinc-50 dark:bg-[#252628]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-blue-100 dark:bg-blue-950/60 rounded-lg text-blue-600 dark:text-blue-400">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-zinc-900 dark:text-white">
                Gestión de Usuarios y Técnicos (Supabase)
              </h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Administración de cuentas con acceso al sistema en base de datos Supabase
              </p>
            </div>
          </div>
          
          <button
            onClick={onClose}
            className="p-1.5 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 rounded-md hover:bg-zinc-200 dark:hover:bg-[#333438] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto flex-1 space-y-4">
          
          {/* Top Bar: Search + Add Button */}
          <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Buscar por nombre, correo o cargo..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-zinc-50 dark:bg-[#252628] border border-zinc-300 dark:border-[#3e3f44] rounded-md text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <button
              onClick={() => {
                setShowAddForm(!showAddForm);
                setFormError(null);
                setFormSuccess(null);
              }}
              className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors shadow-xs cursor-pointer"
            >
              <UserPlus className="w-4 h-4" />
              <span>{showAddForm ? 'Cancelar Registro' : 'Registrar Nuevo Técnico'}</span>
            </button>
          </div>

          {/* Add User Form Drawer */}
          {showAddForm && (
            <form onSubmit={handleCreateUser} className="p-4 bg-zinc-50 dark:bg-[#252628] border border-zinc-200 dark:border-[#333438] rounded-lg space-y-3 animate-in fade-in duration-150">
              <div className="flex items-center justify-between pb-2 border-b border-zinc-200 dark:border-[#333438]">
                <span className="text-xs font-semibold text-zinc-800 dark:text-zinc-200 flex items-center gap-1.5">
                  <UserPlus className="w-4 h-4 text-blue-500" />
                  Nuevo Usuario para Supabase
                </span>
                <span className="text-[10px] bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded font-mono">
                  Base de Datos Supabase
                </span>
              </div>

              {formError && (
                <div className="p-2.5 bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900/60 rounded text-xs text-red-700 dark:text-red-300 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                    Nombre Completo del Técnico *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. JUAN PEREZ LOPEZ"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-[#1e1f21] border border-zinc-300 dark:border-[#3e3f44] rounded text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-1 focus:ring-blue-500 uppercase"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                    Correo Electrónico (Opcional)
                  </label>
                  <input
                    type="email"
                    placeholder="ejemplo@unefco.edu.bo"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-[#1e1f21] border border-zinc-300 dark:border-[#3e3f44] rounded text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                    Contraseña para Supabase Auth
                  </label>
                  <input
                    type="password"
                    placeholder="Contraseña segura"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-[#1e1f21] border border-zinc-300 dark:border-[#3e3f44] rounded text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                    Cargo o Función
                  </label>
                  <input
                    type="text"
                    placeholder="Técnico de Seguimiento Pedagógico"
                    value={newCargo}
                    onChange={(e) => setNewCargo(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-[#1e1f21] border border-zinc-300 dark:border-[#3e3f44] rounded text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                    Rol en la Plataforma
                  </label>
                  <select
                    value={newRole}
                    onChange={(e) => setNewRole(e.target.value as UserRole)}
                    className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-[#1e1f21] border border-zinc-300 dark:border-[#3e3f44] rounded text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="tecnico">Técnico (Gestión de sus propios cronogramas)</option>
                    <option value="admin">Administrador General (Acceso Total)</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="px-3 py-1 text-xs text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-[#333438] rounded"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={formLoading}
                  className="px-4 py-1 text-xs font-medium bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors disabled:opacity-60"
                >
                  {formLoading ? 'Guardando en Supabase...' : 'Guardar en Supabase'}
                </button>
              </div>
            </form>
          )}

          {formSuccess && (
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-900/60 rounded text-xs text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{formSuccess}</span>
            </div>
          )}

          {/* User List Table */}
          <div className="border border-zinc-200 dark:border-[#333438] rounded-lg overflow-hidden">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-zinc-100 dark:bg-[#252628] border-b border-zinc-200 dark:border-[#333438] text-zinc-600 dark:text-zinc-400 font-medium">
                  <th className="py-2.5 px-3">Técnico / Usuario</th>
                  <th className="py-2.5 px-3">Cargo</th>
                  <th className="py-2.5 px-3">Rol</th>
                  <th className="py-2.5 px-3">Estado</th>
                  <th className="py-2.5 px-3 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 dark:divide-[#333438] bg-white dark:bg-[#1e1f21]">
                {loadingUsers ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-zinc-400">
                      Cargando usuarios desde Supabase...
                    </td>
                  </tr>
                ) : filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-zinc-400">
                      No se encontraron usuarios en Supabase.
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((user) => {
                    const isCurrent = user.uid === currentUser.uid;
                    const isActive = user.status === 'active';
                    const isAdmin = user.role === 'admin';

                    return (
                      <tr key={user.uid} className="hover:bg-zinc-50 dark:hover:bg-[#252628]/60 transition-colors">
                        <td className="py-2.5 px-3">
                          <div className="font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                            {user.displayName}
                            {isCurrent && (
                              <span className="text-[9px] bg-blue-100 dark:bg-blue-950/70 text-blue-700 dark:text-blue-300 px-1.5 py-0.2 rounded font-medium">
                                Tú
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-zinc-500 dark:text-zinc-400 font-mono">
                            {user.email}
                          </div>
                        </td>

                        <td className="py-2.5 px-3 text-zinc-700 dark:text-zinc-300">
                          <div className="flex items-center gap-1">
                            <Briefcase className="w-3 h-3 text-zinc-400 shrink-0" />
                            <span>{user.cargo || 'Técnico de Seguimiento'}</span>
                          </div>
                        </td>

                        <td className="py-2.5 px-3">
                          <button
                            onClick={() => handleToggleRole(user)}
                            disabled={isCurrent}
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${
                              isAdmin
                                ? 'bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300'
                                : 'bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300'
                            } ${isCurrent ? 'cursor-default' : 'hover:opacity-80 cursor-pointer'}`}
                            title={isCurrent ? 'Tu propio rol' : 'Hacer clic para cambiar rol'}
                          >
                            <ShieldCheck className="w-3 h-3" />
                            <span>{isAdmin ? 'Administrador' : 'Técnico'}</span>
                          </button>
                        </td>

                        <td className="py-2.5 px-3">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium ${
                            isActive
                              ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300'
                              : 'bg-red-100 dark:bg-red-950/60 text-red-700 dark:text-red-300'
                          }`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-emerald-500' : 'bg-red-500'}`} />
                            {isActive ? 'Activo' : 'Inactivo'}
                          </span>
                        </td>

                        <td className="py-2.5 px-3 text-right">
                          <button
                            onClick={() => handleToggleStatus(user)}
                            disabled={isCurrent}
                            className={`inline-flex items-center gap-1 px-2 py-1 rounded text-[11px] font-medium transition-colors ${
                              isActive
                                ? 'text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40'
                                : 'text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40'
                            } ${isCurrent ? 'opacity-30 cursor-not-allowed' : 'cursor-pointer'}`}
                            title={isCurrent ? 'No puedes desactivar tu cuenta' : isActive ? 'Desactivar acceso' : 'Activar acceso'}
                          >
                            {isActive ? (
                              <>
                                <UserX className="w-3.5 h-3.5" />
                                <span>Desactivar</span>
                              </>
                            ) : (
                              <>
                                <UserCheck className="w-3.5 h-3.5" />
                                <span>Reactivar</span>
                              </>
                            )}
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 bg-zinc-50 dark:bg-[#252628] border-t border-zinc-200 dark:border-[#333438] flex items-center justify-between">
          <span className="text-[11px] text-zinc-500 dark:text-zinc-400">
            Total técnicos registrados en Supabase: {users.length}
          </span>
          <button
            onClick={onClose}
            className="px-3 py-1.5 text-xs font-medium bg-zinc-200 dark:bg-[#333438] text-zinc-800 dark:text-zinc-200 hover:bg-zinc-300 dark:hover:bg-[#3e3f44] rounded transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
