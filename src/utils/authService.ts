import { doc, getDoc, setDoc, collection, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { UserProfile, UserRole } from '../types';

const STORAGE_KEY_USER = 'unefco_logged_in_user';
const STORAGE_KEY_CUSTOM_USERS = 'unefco_custom_team_users';

// Predefined official team members
export const OFFICIAL_TEAM_PRESETS: UserProfile[] = [
  {
    uid: 'admin_juan_carlos_calle',
    email: 'carlosj724@gmail.com',
    displayName: 'JUAN CARLOS CALLE CHAVEZ',
    role: 'admin',
    status: 'active',
    cargo: 'Creador y Administrador General UNEFCO La Paz',
    createdAt: new Date().toISOString()
  },
  {
    uid: 'tecnico_victor_marcelo',
    email: 'victor.morales@unefco.edu.bo',
    displayName: 'VICTOR MARCELO MORALES AVILA',
    role: 'tecnico',
    status: 'active',
    cargo: 'Técnico de Seguimiento Pedagógico UNEFCO La Paz',
    createdAt: new Date().toISOString()
  },
  {
    uid: 'tecnica_paola_rosa',
    email: 'paola.cadena@unefco.edu.bo',
    displayName: 'PAOLA ROSA CADENA GUZMAN',
    role: 'tecnico',
    status: 'active',
    cargo: 'Técnica de Seguimiento Pedagógica UNEFCO La Paz',
    createdAt: new Date().toISOString()
  }
];

// Helper to normalize strings for comparison (case & accent insensitive)
export const normalizeText = (str: string): string => {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
};

// Check if password matches default patterns (Unefco2026, Unfeco2026, unefco2026, etc.)
export const isDefaultPasswordMatch = (password: string): boolean => {
  const norm = normalizeText(password);
  return norm === 'unefco2026' || norm === 'unfeco2026';
};

// Get all custom created technicians stored locally + sync with Firestore
export const getCustomUsers = (): Record<string, { profile: UserProfile; passwordHash: string }> => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_CUSTOM_USERS);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
};

export const saveCustomUserLocal = (profile: UserProfile, pass: string) => {
  const current = getCustomUsers();
  current[profile.uid] = {
    profile,
    passwordHash: pass
  };
  localStorage.setItem(STORAGE_KEY_CUSTOM_USERS, JSON.stringify(current));
};

// Initialize default users in Firestore if missing
export const seedDefaultTeamToFirestore = async () => {
  try {
    for (const member of OFFICIAL_TEAM_PRESETS) {
      const ref = doc(db, 'users', member.uid);
      const snap = await getDoc(ref);
      if (!snap.exists()) {
        await setDoc(ref, member);
      }
    }
  } catch (err) {
    console.warn('No se pudo sembrar usuarios predeterminados en Firestore (offline o permisos):', err);
  }
};

// Main authentication function
export const authenticateUser = async (
  inputIdentifier: string,
  inputPassword: string
): Promise<UserProfile> => {
  const cleanId = normalizeText(inputIdentifier);
  const cleanPass = normalizeText(inputPassword);

  if (!cleanId || !inputPassword) {
    throw new Error('Ingrese su nombre/correo y contraseña.');
  }

  // 1. Check against Official Team Presets
  const officialMatch = OFFICIAL_TEAM_PRESETS.find(p => {
    const nameMatch = normalizeText(p.displayName).includes(cleanId) || cleanId.includes(normalizeText(p.displayName));
    const emailMatch = normalizeText(p.email) === cleanId;
    return nameMatch || emailMatch;
  });

  if (officialMatch) {
    if (isDefaultPasswordMatch(inputPassword)) {
      if (officialMatch.status === 'inactive') {
        throw new Error('Su cuenta ha sido desactivada. Contacte al Administrador Juan Carlos Calle Chávez.');
      }
      // Save last login time
      const updatedProfile = { ...officialMatch, lastLogin: new Date().toISOString() };
      try {
        await setDoc(doc(db, 'users', officialMatch.uid), updatedProfile, { merge: true });
      } catch (e) {
        console.warn('Sync login to Firestore skipped:', e);
      }
      saveLoggedInUser(updatedProfile);
      return updatedProfile;
    } else {
      throw new Error('Contraseña incorrecta para el usuario seleccionado. Pruebe con: Unefco2026');
    }
  }

  // 2. Check Custom Local Users
  const customUsersMap = getCustomUsers();
  const customList = Object.values(customUsersMap);
  const customMatch = customList.find(item => {
    const p = item.profile;
    const nameMatch = normalizeText(p.displayName).includes(cleanId) || cleanId.includes(normalizeText(p.displayName));
    const emailMatch = normalizeText(p.email) === cleanId;
    return nameMatch || emailMatch;
  });

  if (customMatch) {
    if (normalizeText(customMatch.passwordHash) === cleanPass || isDefaultPasswordMatch(inputPassword)) {
      if (customMatch.profile.status === 'inactive') {
        throw new Error('Su cuenta ha sido desactivada. Contacte al Administrador Juan Carlos Calle Chávez.');
      }
      const updatedProfile = { ...customMatch.profile, lastLogin: new Date().toISOString() };
      saveLoggedInUser(updatedProfile);
      return updatedProfile;
    } else {
      throw new Error('Contraseña incorrecta.');
    }
  }

  // 3. Try checking Firestore database
  try {
    const querySnap = await getDocs(collection(db, 'users'));
    let foundProfile: UserProfile | null = null;
    querySnap.forEach((docSnap) => {
      const data = docSnap.data() as UserProfile;
      const nameMatch = normalizeText(data.displayName || '').includes(cleanId);
      const emailMatch = normalizeText(data.email || '') === cleanId;
      if (nameMatch || emailMatch) {
        foundProfile = { uid: docSnap.id, ...data };
      }
    });

    if (foundProfile) {
      if (isDefaultPasswordMatch(inputPassword)) {
        if ((foundProfile as UserProfile).status === 'inactive') {
          throw new Error('Su cuenta ha sido desactivada. Contacte al Administrador.');
        }
        saveLoggedInUser(foundProfile);
        return foundProfile;
      }
    }
  } catch (err) {
    console.warn('Firestore fallback fetch failed:', err);
  }

  throw new Error('Usuario o contraseña no encontrados. Verifique sus datos.');
};

// Session persistence
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
