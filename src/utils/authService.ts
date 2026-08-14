import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { UserProfile, UserRole } from '../types';

const STORAGE_KEY_USER = 'unefco_supabase_session_user';

/**
 * Autenticación con Supabase.
 * - Soporta ingreso con correo electrónico o nombre de usuario (ej: "carlos", "juan.perez", etc.).
 * - Valida obligatoriamente usuario y contraseña contra Supabase Auth.
 */
export const authenticateUser = async (
  inputIdentifier: string,
  inputPassword: string
): Promise<UserProfile> => {
  const cleanId = inputIdentifier.trim();

  if (!cleanId || !inputPassword) {
    throw new Error('Ingrese su usuario y contraseña.');
  }

  if (!isSupabaseConfigured) {
    throw new Error(
      'El servicio de autenticación no está configurado. Por favor contacte al administrador.'
    );
  }

  // Resolver email: si el usuario no incluyó "@", buscar en la tabla usuarios o formatear como correo institucional
  let emailToAuth = cleanId;
  if (!cleanId.includes('@')) {
    try {
      const { data: matchedUser } = await supabase
        .from('usuarios')
        .select('email')
        .ilike('display_name', `%${cleanId}%`)
        .limit(1)
        .maybeSingle();

      if (matchedUser?.email) {
        emailToAuth = matchedUser.email;
      } else {
        emailToAuth = `${cleanId.toLowerCase()}@unefco.edu.bo`;
      }
    } catch {
      emailToAuth = `${cleanId.toLowerCase()}@unefco.edu.bo`;
    }
  }

  // 1. Iniciar sesión a través de Supabase Auth
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: emailToAuth.toLowerCase(),
    password: inputPassword,
  });

  if (authError || !authData.user) {
    throw new Error(
      authError?.message === 'Invalid login credentials'
        ? 'Usuario o contraseña incorrectos.'
        : `Error de autenticación: ${authError?.message || 'Usuario no autorizado'}`
    );
  }

  // 2. Obtener rol y perfil desde la tabla `usuarios` en Supabase
  const { data: profileData, error: profileErr } = await supabase
    .from('usuarios')
    .select('*')
    .or(`auth_user_id.eq.${authData.user.id},email.eq.${authData.user.email}`)
    .maybeSingle();

  if (profileErr) {
    console.warn('Perfil warning:', profileErr);
  }

  const profile: UserProfile = {
    uid: authData.user.id,
    email: authData.user.email || emailToAuth,
    displayName: profileData?.display_name || authData.user.user_metadata?.display_name || authData.user.email || 'Usuario',
    role: (profileData?.role as UserRole) || 'tecnico',
    status: profileData?.status || 'active',
    cargo: profileData?.cargo || 'Técnico de Seguimiento Pedagógico',
    lastLogin: new Date().toISOString(),
  };

  if (profile.status === 'inactive') {
    await supabase.auth.signOut();
    throw new Error('Su cuenta ha sido desactivada.');
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
