import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { UserProfile, UserRole } from '../types';

const STORAGE_KEY_USER = 'unefco_supabase_session_user';

/**
 * Autenticación EXCLUSIVA y ESTRICTA con Supabase.
 * - Requiere que VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY estén configuradas en Secrets.
 * - Valida obligatoriamente usuario y contraseña contra Supabase Auth.
 * - No existen usuarios de prueba, ni bypasses, ni contraseñas locales.
 */
export const authenticateUser = async (
  inputIdentifier: string,
  inputPassword: string
): Promise<UserProfile> => {
  const cleanId = inputIdentifier.trim().toLowerCase();

  if (!cleanId || !inputPassword) {
    throw new Error('Ingrese su correo electrónico y su contraseña.');
  }

  if (!isSupabaseConfigured) {
    throw new Error(
      'Supabase no está conectado. Debe configurar VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY en los Secrets del proyecto.'
    );
  }

  // 1. Iniciar sesión formalmente a través de Supabase Auth
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: cleanId,
    password: inputPassword,
  });

  if (authError || !authData.user) {
    // Si falla Supabase Auth, denegar acceso inmediatamente
    throw new Error(
      authError?.message === 'Invalid login credentials'
        ? 'Credenciales inválidas en Supabase. Verifique su correo y contraseña.'
        : `Error de autenticación Supabase: ${authError?.message || 'Usuario no autorizado'}`
    );
  }

  // 2. Obtener rol y perfil desde la tabla `usuarios` en Supabase
  const { data: profileData, error: profileErr } = await supabase
    .from('usuarios')
    .select('*')
    .or(`auth_user_id.eq.${authData.user.id},email.eq.${authData.user.email}`)
    .maybeSingle();

  if (profileErr) {
    console.warn('[Supabase] No se pudo obtener perfil de usuarios:', profileErr);
  }

  const profile: UserProfile = {
    uid: authData.user.id,
    email: authData.user.email || cleanId,
    displayName: profileData?.display_name || authData.user.user_metadata?.display_name || authData.user.email || 'Usuario',
    role: (profileData?.role as UserRole) || 'tecnico',
    status: profileData?.status || 'active',
    cargo: profileData?.cargo || 'Técnico de Seguimiento Pedagógico',
    lastLogin: new Date().toISOString(),
  };

  if (profile.status === 'inactive') {
    await supabase.auth.signOut();
    throw new Error('Su cuenta ha sido desactivada por el Administrador en Supabase.');
  }

  // Actualizar último login en tabla usuarios
  if (profileData?.id) {
    await supabase
      .from('usuarios')
      .update({ last_login: new Date().toISOString() })
      .eq('id', profileData.id);
  }

  saveLoggedInUser(profile);
  return profile;
};

// Session persistence en localStorage
export const saveLoggedInUser = (user: UserProfile) => {
  localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(user));
};

export const getLoggedInUser = (): UserProfile | null => {
  try {
    // Limpiar claves legadas de sesiones anteriores de Firebase/Locales
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
