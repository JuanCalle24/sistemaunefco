import { User, UserRole } from '../types';

// 🔐 Sistema de autenticación SOLO LEGACY (sin Supabase)
// Esto es temporal hasta que puedas crear usuarios en Supabase

const USERS: Record<string, { password: string; role: UserRole; nombre: string }> = {
  'admin_juan_carlos_calle': {
    password: 'Fatimex25*',
    role: 'admin',
    nombre: 'JUAN CARLOS CALLE CHAVEZ'
  },
  'tecnico_victor_marcelo': {
    password: 'Unefco@339808',
    role: 'tecnico',
    nombre: 'VICTOR MARCELO'
  },
  'tecnica_paola_rosa': {
    password: 'Unefco@4371320',
    role: 'tecnico',
    nombre: 'PAOLA ROSA'
  }
};

export const authService = {
  // Login con credenciales legacy (sin Supabase)
  async login(username: string, password: string): Promise<User> {
    console.log('🔍 Intentando login legacy con:', { username });

    // Buscar usuario
    const userEntry = USERS[username];
    
    if (!userEntry) {
      console.error('❌ Usuario no encontrado:', username);
      throw new Error('Usuario o contraseña incorrectos');
    }

    if (userEntry.password !== password) {
      console.error('❌ Contraseña incorrecta para:', username);
      throw new Error('Usuario o contraseña incorrectos');
    }

    // Login exitoso
    const user: User = {
      uid: `legacy_${username}`,
      email: `${username}@unefco.com`,
      nombre: userEntry.nombre,
      role: userEntry.role,
    };

    localStorage.setItem('user', JSON.stringify(user));
    console.log('✅ Login exitoso:', user);
    return user;
  },

  // Cerrar sesión
  async logout(): Promise<void> {
    localStorage.removeItem('user');
    console.log('✅ Sesión cerrada');
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
