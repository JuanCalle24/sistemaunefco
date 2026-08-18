import { supabase } from '../lib/supabase';
import { UserProfile, UserRole } from '../types';

const STORAGE_KEY_USER = 'unefco_supabase_session_user';

/**
 * Autenticación con Supabase usando correo sintético (@unefco.local)
 * y consulta de perfil en tabla public.users.
 */
export const authenticateUser = async (
  inputIdentifier: string,
  inputPassword: string
): Promise<UserProfile> => {
  const cleanUser = inputIdentifier.trim().toLowerCase();

  if (!cleanUser || !inputPassword) {
    throw new Error('Usuario o contraseña incorrectos');
  }

  // 1. Armar correo sintético agregando @unefco.edu.bo
  const email = cleanUser.includes('@') ? cleanUser : `${cleanUser}@unefco.edu.bo`;

  // 2. Llamar a supabase.auth.signInWithPassword({ email, password })
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email,
    password: inputPassword,
  });

  // 4. Si el login falla, mostrar mensaje genérico
  if (authError || !authData.user) {
    throw new Error('Usuario o contraseña incorrectos');
  }

  // 3. Si el login es exitoso, buscar perfil en public.users
  let nombreCompleto = authData.user.user_metadata?.display_name || cleanUser;
  let userRole: UserRole = 'tecnico';

  try {
    const { data: userData } = await supabase
      .from('users')
      .select('nombre_completo, role')
      .eq('id', authData.user.id)
      .maybeSingle();

    if (userData) {
      if (userData.nombre_completo) {
        nombreCompleto = userData.nombre_completo;
      }
      if (userData.role) {
        userRole = userData.role as UserRole;
      }
    }
  } catch (err) {
    console.warn('Error al consultar tabla users:', err);
  }

  const profile: UserProfile = {
    uid: authData.user.id,
    email: authData.user.email || email,
    displayName: nombreCompleto,
    role: userRole,
    status: 'active',
    lastLogin: new Date().toISOString(),
  };

  saveLoggedInUser(profile);
  return profile;
};

// Session persistence en localStorage
export const saveLoggedInUser = (user: UserProfile) => {
  localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(user));
};

export const getLoggedInUser = (): UserProfile | null => {
  try {
    localStorage.removeItem('unefco_logged_in_user');
    const raw = localStorage.getItem(STORAGE_KEY_USER);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

export const clearLoggedInUser = () => {
  localStorage.removeItem(STORAGE_KEY_USER);
  localStorage.removeItem('unefco_logged_in_user');
};
