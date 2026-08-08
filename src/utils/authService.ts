import { supabase } from '../lib/supabase';
import { UserProfile } from '../types';

const STORAGE_KEY_USER = 'unefco_logged_in_user';

// Normaliza texto para comparaciones (ya no se usa para login, pero se mantiene por compatibilidad)
export const normalizeText = (str: string): string => {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
};

// Trae el perfil desde la tabla "users" usando el uid de Supabase Auth
const fetchProfileByUid = async (uid: string): Promise<UserProfile | null> => {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('uid', uid)
    .single();

  if (error || !data) return null;

  return {
    uid: data.uid,
    email: data.email,
    displayName: data.display_name,
    role: data.role,
    status: data.status,
    cargo: data.cargo,
    departamento: data.departamento,
    createdAt: data.created_at,
    lastLogin: data.last_login,
  };
};

const touchLastLogin = async (uid: string) => {
  await supabase
    .from('users')
    .update({ last_login: new Date().toISOString() })
    .eq('uid', uid);
};

// Login con correo y contraseña
export const authenticateUser = async (
  email: string,
  password: string
): Promise<UserProfile> => {
  if (!email || !password) {
    throw new Error('Ingrese su correo y contraseña.');
  }

  const { data, error } = await supabase.auth.signInWithPassword({
    email: email.trim(),
    password,
  });

  if (error || !data.user) {
    throw new Error('Correo o contraseña incorrectos.');
  }

  const profile = await fetchProfileByUid(data.user.id);

  if (!profile) {
    await supabase.auth.signOut();
    throw new Error('No se encontró su perfil en el sistema. Contacte al Administrador.');
  }

  if (profile.status === 'inactive') {
    await supabase.auth.signOut();
    throw new Error('Su cuenta ha sido desactivada. Contacte al Administrador General.');
  }

  await touchLastLogin(profile.uid);
  const updatedProfile = { ...profile, lastLogin: new Date().toISOString() };
  saveLoggedInUser(updatedProfile);
  return updatedProfile;
};

// Login con Google
export const authenticateWithGoogle = async (): Promise<void> => {
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: window.location.origin,
    },
  });

  if (error) {
    throw new Error('No se pudo iniciar sesión con Google. Intente nuevamente.');
  }
  // Nota: signInWithOAuth redirige fuera de la app.
  // El perfil se valida al regresar, con checkGoogleSession() (ver abajo).
};

// Se llama al cargar la app, para completar el login de Google tras la redirección
export const checkGoogleSession = async (): Promise<UserProfile | null> => {
  const { data } = await supabase.auth.getSession();
  const user = data.session?.user;
  if (!user) return null;

  const profile = await fetchProfileByUid(user.id);

  if (!profile) {
    await supabase.auth.signOut();
    throw new Error(
      `El correo ${user.email} no está autorizado para acceder al sistema. Contacte al Administrador para ser agregado.`
    );
  }

  if (profile.status === 'inactive') {
    await supabase.auth.signOut();
    throw new Error('Su cuenta ha sido desactivada. Contacte al Administrador General.');
  }

  await touchLastLogin(profile.uid);
  const updatedProfile = { ...profile, lastLogin: new Date().toISOString() };
  saveLoggedInUser(updatedProfile);
  return updatedProfile;
};

// Cerrar sesión
export const logoutUser = async () => {
  await supabase.auth.signOut();
  clearLoggedInUser();
};

// Persistencia local del perfil (para que la app sepa quién está activo)
export const saveLoggedInUser = (user: UserProfile) => {
  localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(user));
};

export const getLoggedInUser = (): UserProfile | null => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_USER);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

export const clearLoggedInUser = () => {
  localStorage.removeItem(STORAGE_KEY_USER);
};
