// ═══════════════════════════════════════════════════════════════════════
//  CLASSHUB — Auth (Autenticación unificada)
//  -----------------------------------------------------------------------
//  Gestiona:
//   - Login con Google (alumno o profesor)
//   - Login con email/contraseña
//   - Token de Google Classroom (solo para profesores)
//   - Guard de autenticación (requireAuth)
//   - Guard de acceso a juego (requireGameAccess)
//   - Estado global: currentUser, currentProfile, classroomToken
// ═══════════════════════════════════════════════════════════════════════

import { auth, db, googleProvider, GoogleAuthProvider,
  signInWithPopup, signInWithEmailAndPassword,
  createUserWithEmailAndPassword, signOut, onAuthStateChanged,
  sendPasswordResetEmail, updateProfile, doc, getDoc, setDoc, updateDoc, serverTimestamp
} from './firebase-config.js';
import { generateAvatar, generateTeacherAvatar, anonymizeName, getUrlParams } from './utils.js';
import { isStudentInAnyClass } from './db.js';

// ──────────────────────────────────────────────────────────────────────
//  Estado global exportado
// ──────────────────────────────────────────────────────────────────────
export let currentUser    = null;
export let currentProfile = null;   // documento users/{uid}
export let classroomToken = null;   // access token Google Classroom (solo profesores)

// Scopes requeridos para acceder a la API de Google Classroom
const CLASSROOM_SCOPES = [
  'https://www.googleapis.com/auth/classroom.courses.readonly',
  'https://www.googleapis.com/auth/classroom.coursework.students',
  'https://www.googleapis.com/auth/classroom.rosters.readonly',
  'https://www.googleapis.com/auth/classroom.profile.emails'
];

// ──────────────────────────────────────────────────────────────────────
//  LOGIN — Google (Alumno)
// ──────────────────────────────────────────────────────────────────────
export async function loginWithGoogle() {
  const result = await signInWithPopup(auth, googleProvider);
  const email = result.user.email;
  
  if (!email) {
    await signOut(auth);
    throw new Error('No se pudo obtener el correo de Google.');
  }

  // Verificar si está en alguna clase (IES Machado)
  const isAllowed = await isStudentInAnyClass(email);
  if (!isAllowed) {
    await signOut(auth);
    throw new Error('Acceso denegado. No perteneces a ninguna clase activa.');
  }

  return result.user;
}

// ──────────────────────────────────────────────────────────────────────
//  LOGIN — Google con Classroom (Profesor)
// ──────────────────────────────────────────────────────────────────────
export async function loginAsTeacher() {
  const provider = new GoogleAuthProvider();
  CLASSROOM_SCOPES.forEach(s => provider.addScope(s));
  provider.setCustomParameters({ prompt: 'select_account' });

  const result = await signInWithPopup(auth, provider);
  const email = result.user.email;

  if (!email) {
    await signOut(auth);
    throw new Error('No se pudo obtener el correo de Google.');
  }

  // Restricciones IES Machado para docentes
  if (!email.endsWith('@iesamachado.org')) {
    await signOut(auth);
    throw new Error('Acceso denegado. Se requiere un correo corporativo del IES Antonio Machado.');
  }
  const username = email.split('@')[0];
  if (/\d$/.test(username)) {
    await signOut(auth);
    throw new Error('Acceso denegado. El correo pertenece a un alumno, usa la entrada de Alumnado.');
  }

  const credential = GoogleAuthProvider.credentialFromResult(result);
  classroomToken = credential?.accessToken || null;

  // Marcar como profesor en Firestore
  await setDoc(doc(db, 'users', result.user.uid), {
    role: 'teacher'
  }, { merge: true });

  return result.user;
}

// ──────────────────────────────────────────────────────────────────────
//  Refresco manual del token Classroom (el profesor lo reautoriza)
// ──────────────────────────────────────────────────────────────────────
export async function refreshClassroomToken() {
  if (!currentUser) throw new Error('No hay sesión activa');
  const provider = new GoogleAuthProvider();
  CLASSROOM_SCOPES.forEach(s => provider.addScope(s));
  provider.setCustomParameters({ prompt: 'consent', login_hint: currentUser.email });

  const result = await signInWithPopup(auth, provider);
  const credential = GoogleAuthProvider.credentialFromResult(result);
  classroomToken = credential?.accessToken || null;
  return classroomToken;
}

// ──────────────────────────────────────────────────────────────────────
//  LOGIN — Email / Contraseña
// ──────────────────────────────────────────────────────────────────────
export async function loginWithEmail(email, password) {
  const result = await signInWithEmailAndPassword(auth, email, password);
  return result.user;
}

// ──────────────────────────────────────────────────────────────────────
//  REGISTRO — Email / Contraseña (Alumno o Profesor)
// ──────────────────────────────────────────────────────────────────────
export async function registerWithEmail(email, password, displayName, role = 'student') {
  const result = await createUserWithEmailAndPassword(auth, email, password);
  const user = result.user;
  await _createOrUpdateProfile(user, role, displayName);
  return user;
}

// ──────────────────────────────────────────────────────────────────────
//  LOGOUT
// ──────────────────────────────────────────────────────────────────────
export async function logout() {
  classroomToken = null;
  await signOut(auth);
  // Calcular la ruta raíz relativa al directorio actual
  const depth = window.location.pathname.split('/').filter(Boolean).length;
  // Si estamos en /classhub/moon/index.html → depth=3, necesitamos ../../index.html
  // La raíz es siempre el index.html del proyecto
  const root = Array(depth - 1).fill('..').join('/') || '.';
  window.location.href = `${root}/index.html`;
}

// ──────────────────────────────────────────────────────────────────────
//  Reset de contraseña
// ──────────────────────────────────────────────────────────────────────
export async function resetPassword(email) {
  await sendPasswordResetEmail(auth, email);
}

// ──────────────────────────────────────────────────────────────────────
//  Crear / actualizar perfil en Firestore
// ──────────────────────────────────────────────────────────────────────
async function _createOrUpdateProfile(user, role = null, providedName = null) {
  const ref  = doc(db, 'users', user.uid);
  const snap = await getDoc(ref);

  const rawName = providedName || user.displayName || user.email.split('@')[0];
  const isTeacher = role === 'teacher';
  const finalDisplayName = isTeacher ? rawName : anonymizeName(rawName);

  if (!snap.exists()) {
    // Primer registro → crear perfil completo
    await setDoc(ref, {
      uid:          user.uid,
      email:        user.email,
      displayName:  finalDisplayName,
      displayNameAnonymized: anonymizeName(rawName),
      photoURL:     isTeacher
                      ? generateTeacherAvatar(user.uid)
                      : generateAvatar(user.uid),
      role:         role || 'student',
      createdAt:    serverTimestamp(),
      lastLogin:    serverTimestamp()
    });

    if (user.displayName !== finalDisplayName) {
      await updateProfile(user, { displayName: finalDisplayName });
    }

    return { role: role || 'student' };
  } else {
    // Actualizar lastLogin
    await setDoc(ref, { lastLogin: serverTimestamp() }, { merge: true });
    return snap.data();
  }
}

// ──────────────────────────────────────────────────────────────────────
//  Actualizar datos del perfil
// ──────────────────────────────────────────────────────────────────────
/** Actualiza datos del perfil (nombre, avatar) en Auth y Firestore */
export async function updateUserProfileData(data) {
  const user = auth.currentUser;
  if (!user) throw new Error("No hay usuario activo.");

  const authData = {};
  if (data.displayName !== undefined) authData.displayName = data.displayName;
  if (data.photoURL !== undefined) authData.photoURL = data.photoURL;

  if (Object.keys(authData).length > 0) {
    await updateProfile(user, authData);
  }

  await updateDoc(doc(db, 'users', user.uid), {
    ...authData,
    updatedAt: serverTimestamp()
  });

  if (authData.displayName) currentProfile.displayName = authData.displayName;
  if (authData.photoURL) currentProfile.photoURL = authData.photoURL;
}

// ──────────────────────────────────────────────────────────────────────
//  LISTENER principal — onAuthStateChanged
//  callback(user, profile) | callback(null, null)
// ──────────────────────────────────────────────────────────────────────
export function setupAuthListener(callback) {
  return onAuthStateChanged(auth, async user => {
    if (user) {
      currentUser = user;
      const ref  = doc(db, 'users', user.uid);
      try {
        const snap = await getDoc(ref);

        if (snap.exists()) {
          currentProfile = snap.data();
        } else {
          // Usuario nuevo sin rol definido (login Google alumno por primera vez)
          currentProfile = await _createOrUpdateProfile(user, 'student');
        }
        callback(user, currentProfile);
      } catch (error) {
        console.warn("No se pudo obtener el perfil de usuario (puede que la sesión se haya cerrado):", error);
        // Si hay error de permisos (porque se forzó el logout), abortar
      }
    } else {
      currentUser    = null;
      currentProfile = null;
      classroomToken = null;
      callback(null, null);
    }
  });
}

// ──────────────────────────────────────────────────────────────────────
//  GUARD — Requiere autenticación
//  Opciones:
//    allowedRoles: ['teacher'] | ['student'] | ['teacher','student'] (por defecto ambos)
//    onAuthorized(user, profile): callback si autorizado
//    redirectTo: URL a la que redirigir si no autenticado (por defecto raíz)
// ──────────────────────────────────────────────────────────────────────
export function requireAuth({ allowedRoles = ['teacher', 'student'], onAuthorized, redirectTo } = {}) {
  const depth = window.location.pathname.split('/').filter(Boolean).length;
  const root  = depth > 1 ? Array(depth - 1).fill('..').join('/') : '.';
  const loginPage = redirectTo || `${root}/index.html`;

  return setupAuthListener((user, profile) => {
    if (!user || !profile) {
      // Guardar la URL actual para volver después del login
      sessionStorage.setItem('classhub_redirect', window.location.href);
      window.location.href = loginPage;
      return;
    }

    if (!allowedRoles.includes(profile.role)) {
      // Redirigir al dashboard correcto
      if (profile.role === 'teacher') {
        window.location.href = `${root}/dashboard_teacher.html`;
      } else {
        window.location.href = `${root}/dashboard_student.html`;
      }
      return;
    }

    if (onAuthorized) onAuthorized(user, profile);
  });
}

// ──────────────────────────────────────────────────────────────────────
//  GUARD — Requiere acceso al juego
//  Verifica que el usuario tenga una clase con el juego habilitado.
//  Los profesores siempre tienen acceso.
//  onGranted(user, profile, classId): se llama con el classId de la sesión
// ──────────────────────────────────────────────────────────────────────
export function requireGameAccess(gameId, { onGranted } = {}) {
  const depth = window.location.pathname.split('/').filter(Boolean).length;
  const root  = depth > 1 ? Array(depth - 1).fill('..').join('/') : '.';

  return requireAuth({
    allowedRoles: ['teacher', 'student'],
    onAuthorized: async (user, profile) => {
      const { classId } = getUrlParams();

      // Los profesores siempre tienen acceso
      if (profile.role === 'teacher') {
        if (onGranted) onGranted(user, profile, classId || null);
        return;
      }

      // Alumnos: verificar que tienen al menos una clase con el juego habilitado
      const { getStudentClasses } = await import('./db.js');
      const classes = await getStudentClasses(user.uid);
      const eligible = classes.filter(c =>
        Array.isArray(c.enabledGames) && c.enabledGames.includes(gameId)
      );

      if (eligible.length === 0) {
        // Sin acceso → al dashboard con mensaje
        sessionStorage.setItem('classhub_no_access_game', gameId);
        window.location.href = `${root}/dashboard_student.html?noAccess=${gameId}`;
        return;
      }

      // Si viene classId en URL, verificar que es una de las elegibles
      let resolvedClassId = classId;
      if (classId && !eligible.find(c => c.id === classId)) {
        resolvedClassId = eligible[0].id;
      } else if (!classId) {
        resolvedClassId = eligible[0].id;
      }

      if (onGranted) onGranted(user, profile, resolvedClassId);
    }
  });
}
