import { supabase } from '../lib/supabase';
import { User, UserRole } from '../types';

// 🔧 MODO PUENTE: Permite transición suave desde credenciales hardcodeadas
// Después de migrar todos los usuarios, eliminar esta sección
const LEGACY_CREDENTIALS: Record<string, { email: string; password: string; role: UserRole; nombre: string }> = {
  'admin_juan_carlos_calle': {
    email: 'admin@unefco.com',
    password: 'Fatimex25*',
    role: 'admin',
    nombre: 'JUAN CARLOS CALLE CHAVEZ'
  },
  'tecnico_victor_marcelo': {
    email: 'tecnico1@unefco.com',
    password: 'Unefco@339808',
    role: 'tecnico',
    nombre: 'VICTOR MARCELO'
  },
  'tecnica_paola_rosa': {
    email: 'tecnico2@unefco.com',
    password: 'Unefco@4371320',
    role: 'tecnico',
    nombre: 'PAOLA ROSA'
  }
};

// 🔐 Sistema de autenticación unificado con Supabase
export const authService = {
  // Login con Supabase Auth (email + password) + MODO PUENTE
  async login(emailOrUsername: string, password: string): Promise<User> {
    try {
      // 1️⃣ PRIMERO: Intentar con Supabase (nuevo sistema)
      try {
        // Si es username, convertirlo a email
        const email = emailOrUsername.includes('@') 
          ? emailOrUsername 
          : `${emailOrUsername}@unefco.com`;

        const { data, error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password: password.trim(),
        });

        if (!error && data.user) {
          // ✅ Login exitoso con Supabase
          return await this._getUserFromSupabase(data.user);
        }
      } catch (e) {
        // Falló Supabase, continuar con modo legacy
        console.log('Supabase login falló, intentando modo legacy...');
      }

      // 2️⃣ SEGUNDO: Intentar con credenciales legacy (puente)
      const legacyEntry = Object.entries(LEGACY_CREDENTIALS).find(
        ([username, creds]) => {
          // Coincidir username o email
          const matchUsername = username === emailOrUsername;
          const matchEmail = creds.email === emailOrUsername;
          const matchPassword = creds.password === password;
          return (matchUsername || matchEmail) && matchPassword;
        }
      );

      if (legacyEntry) {
        const [username, creds] = legacyEntry;
        console.warn(`⚠️ Usuario ${username} usando credenciales legacy`);
        
        // Intentar migrar automáticamente a Supabase
        try {
          // Crear usuario en Supabase Auth
          const { data, error } = await supabase.auth.signUp({
            email: creds.email,
            password: creds.password,
          });

          if (!error && data.user) {
            // Crear registro en tabla users
            await supabase.from('users').insert({
              id: data.user.id,
              email: creds.email,
              nombre_completo: creds.nombre,
              role: creds.role
            });
            
            const user: User = {
              uid: data.user.id,
              email: creds.email,
              nombre: creds.nombre,
              role: creds.role,
            };
            
            localStorage.setItem('user', JSON.stringify(user));
            return user;
          }
        } catch (e) {
          console.warn('No se pudo migrar automáticamente:', e);
          // Aún así, dar acceso con credenciales legacy
          const user: User = {
            uid: `legacy_${username}`,
            email: creds.email,
            nombre: creds.nombre,
            role: creds.role,
          };
          localStorage.setItem('user', JSON.stringify(user));
          return user;
        }
      }

      throw new Error('Credenciales inválidas');
    } catch (error) {
      console.error('Error en login:', error);
      throw new Error('Error al iniciar sesión');
    }
  },

  // Helper para obtener usuario de Supabase
  async _getUserFromSupabase(supabaseUser: any): Promise<User> {
    const { data: userData, error } = await supabase
      .from('users')
      .select('role, nombre_completo')
      .eq('id', supabaseUser.id)
      .single();

    if (error) {
      console.warn('Usuario no tiene rol asignado, usando viewer por defecto');
    }

    const user: User = {
      uid: supabaseUser.id,
      email: supabaseUser.email!,
      nombre: userData?.nombre_completo || supabaseUser.email!.split('@')[0],
      role: userData?.role || 'viewer',
    };

    localStorage.setItem('user', JSON.stringify(user));
    return user;
  },

  // Cerrar sesión
  async logout(): Promise<void> {
    try {
      await supabase.auth.signOut();
      localStorage.removeItem('user');
    } catch (error) {
      console.error('Error en logout:', error);
      throw new Error('Error al cerrar sesión');
    }
  },

  // Obtener usuario actual
  getCurrentUser(): User | null {
    const userStr = localStorage.getItem('user');
    if (!userStr) return null;
    try {
      return JSON.parse(userStr);
    } catch {
      return null;
    }
  },

  // Verificar si el usuario está autenticado
  isAuthenticated(): boolean {
    return !!this.getCurrentUser();
  },

  // Verificar si tiene permisos de admin/tecnico
  hasEditPermission(user: User | null): boolean {
    return user?.role === 'admin' || user?.role === 'tecnico';
  },

  // Verificar si es viewer
  isViewer(user: User | null): boolean {
    return user?.role === 'viewer';
  },
};
