// ═══════════════════════════════════════════════════════════════════════
//  CLASSHUB — DB (Capa de datos Firestore unificada)
//  -----------------------------------------------------------------------
//  Colecciones:
//    users/{uid}                     → perfiles de usuario
//    classes/{classId}               → clases gestionadas por profesores
//    classes/{classId}/assignments/  → tareas vinculadas a Classroom
//    class_members/{classId_uid}     → alumnos que se unieron por PIN
//    game_results/{autoId}           → resultados de todos los juegos
//    live_sessions/{pin}             → sesiones en vivo (MecanoClass/RompeCodigos)
//    live_participants/{pin_uid}     → participantes de sesiones en vivo
//    mecanoclass_texts/{autoId}      → textos de práctica para MecanoClass
//    settings/site                   → configuración global
// ═══════════════════════════════════════════════════════════════════════

import {
  db,
  doc, collection,
  getDoc, getDocs, setDoc, addDoc, updateDoc, deleteDoc,
  query, where, orderBy, limit,
  arrayUnion, arrayRemove,
  serverTimestamp, Timestamp,
  onSnapshot
} from './firebase-config.js';
import { generatePin, generateRoomCode } from './utils.js';

// ══════════════════════════════════════════════════════════════════
//  USUARIOS
// ══════════════════════════════════════════════════════════════════

export async function getUserProfile(uid) {
  const snap = await getDoc(doc(db, 'users', uid));
  return snap.exists() ? { uid: snap.id, ...snap.data() } : null;
}

export async function updateUserProfile(uid, data) {
  await setDoc(doc(db, 'users', uid), { ...data, updatedAt: serverTimestamp() }, { merge: true });
}

/** Busca usuarios por email (para importación desde Classroom) */
export async function findUserByEmail(email) {
  const q = query(collection(db, 'users'), where('email', '==', email));
  const snap = await getDocs(q);
  return snap.empty ? null : { uid: snap.docs[0].id, ...snap.docs[0].data() };
}

// ══════════════════════════════════════════════════════════════════
//  CLASES
// ══════════════════════════════════════════════════════════════════

/**
 * Crea una nueva clase.
 * @param {string} teacherId
 * @param {string} name
 * @param {object} extra - campos adicionales (classroomCourseId, etc.)
 * @returns {object} { id, pin, name }
 */
export async function createClass(teacherId, name, extra = {}) {
  const pin = generatePin();
  const ref = doc(collection(db, 'classes'));
  await setDoc(ref, {
    id:           ref.id,
    teacherId,
    name,
    pin,
    enabledGames: [],   // El profesor los habilita después
    members:      [],   // UIDs de alumnos importados desde Classroom
    ...extra,
    createdAt:    serverTimestamp()
  });
  return { id: ref.id, pin, name, ...extra };
}

export async function getClass(classId) {
  const snap = await getDoc(doc(db, 'classes', classId));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

export async function getTeacherClasses(teacherId) {
  const q = query(collection(db, 'classes'), where('teacherId', '==', teacherId));
  const snap = await getDocs(q);
  const classes = snap.docs.map(d => ({ id: d.id, ...d.data() }));
  return classes.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
}

/**
 * Clases donde el alumno aparece en 'members' (importados desde Classroom)
 * o en la colección 'class_members' (unión por PIN).
 */
export async function getStudentClasses(studentId) {
  // 1. Clases donde está en el array 'members' (importación Classroom)
  const q1 = query(collection(db, 'classes'), where('members', 'array-contains', studentId));
  const snap1 = await getDocs(q1);
  const byMembers = snap1.docs.map(d => ({ id: d.id, ...d.data() }));

  // 2. Clases donde se unió por PIN
  const q2 = query(collection(db, 'class_members'), where('studentId', '==', studentId));
  const snap2 = await getDocs(q2);
  const classIdsByPin = snap2.docs.map(d => d.data().classId);

  // 3. Cargar los docs de esas clases (evitando duplicados)
  const alreadyLoaded = new Set(byMembers.map(c => c.id));
  const byPinClasses = [];
  for (const cid of classIdsByPin) {
    if (!alreadyLoaded.has(cid)) {
      const cls = await getClass(cid);
      if (cls) byPinClasses.push(cls);
    }
  }

  return [...byMembers, ...byPinClasses].sort((a, b) =>
    (a.name || '').localeCompare(b.name || '')
  );
}

/** Unirse a una clase por PIN */
export async function joinClassByPin(studentId, pin) {
  const q = query(collection(db, 'classes'), where('pin', '==', pin));
  const snap = await getDocs(q);
  if (snap.empty) throw new Error('No se encontró ninguna clase con ese PIN.');

  const classDoc = snap.docs[0];
  const classData = { id: classDoc.id, ...classDoc.data() };

  // Registrar en class_members
  const memberId = `${classDoc.id}_${studentId}`;
  await setDoc(doc(db, 'class_members', memberId), {
    classId:    classDoc.id,
    studentId,
    joinedAt:   serverTimestamp()
  }, { merge: true });

  return classData;
}

/** Habilitar / deshabilitar un juego en una clase */
export async function toggleGameInClass(classId, gameId, enabled) {
  const ref = doc(db, 'classes', classId);
  await updateDoc(ref, {
    enabledGames: enabled ? arrayUnion(gameId) : arrayRemove(gameId),
    updatedAt: serverTimestamp()
  });
}

/** Actualizar nombre de clase */
export async function updateClass(classId, data) {
  await updateDoc(doc(db, 'classes', classId), { ...data, updatedAt: serverTimestamp() });
}

/** Eliminar clase */
export async function deleteClass(classId) {
  await deleteDoc(doc(db, 'classes', classId));
}

/** Obtener miembros de una clase (fusión de ambas fuentes) */
export async function getClassMembers(classId) {
  const memberIds = new Set();
  const members   = [];

  // Fuente 1: class_members (unión por PIN)
  const q1 = query(collection(db, 'class_members'), where('classId', '==', classId));
  const snap1 = await getDocs(q1);
  for (const d of snap1.docs) {
    const { studentId, joinedAt } = d.data();
    if (!memberIds.has(studentId)) {
      memberIds.add(studentId);
      const profile = await getUserProfile(studentId);
      if (profile) members.push({ ...profile, joinedAt, source: 'pin' });
    }
  }

  // Fuente 2: array members del doc de clase (importación Classroom)
  const classSnap = await getDoc(doc(db, 'classes', classId));
  if (classSnap.exists()) {
    const { members: arr = [] } = classSnap.data();
    for (const entry of arr) {
      if (typeof entry === 'string') {
        // UID directo
        if (!memberIds.has(entry)) {
          memberIds.add(entry);
          const profile = await getUserProfile(entry);
          if (profile) members.push({ ...profile, joinedAt: null, source: 'classroom' });
        }
      } else if (entry?.pending) {
        // Alumno pendiente de registrarse
        members.push({ ...entry, source: 'classroom', pending: true });
      }
    }
  }

  return members;
}

/** Añadir alumno al array members de la clase (importación Classroom) */
export async function addMemberToClass(classId, uid) {
  await updateDoc(doc(db, 'classes', classId), {
    members: arrayUnion(uid)
  });
}

/** Añadir alumno pendiente (sin cuenta) al array members */
export async function addPendingMember(classId, email, name) {
  await updateDoc(doc(db, 'classes', classId), {
    members: arrayUnion({ email, name, pending: true })
  });
}

// ══════════════════════════════════════════════════════════════════
//  TAREAS (Assignments)
// ══════════════════════════════════════════════════════════════════

export async function createAssignment(classId, data) {
  const ref = await addDoc(collection(db, 'classes', classId, 'assignments'), {
    ...data,
    createdAt: serverTimestamp()
  });
  return ref.id;
}

export async function getClassAssignments(classId) {
  const snap = await getDocs(collection(db, 'classes', classId, 'assignments'));
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function deleteAssignment(classId, assignmentId) {
  await deleteDoc(doc(db, 'classes', classId, 'assignments', assignmentId));
}

// ══════════════════════════════════════════════════════════════════
//  RESULTADOS DE JUEGOS
// ══════════════════════════════════════════════════════════════════

/**
 * Guarda el resultado de una partida.
 * @param {string} gameId       - 'mecanoclass' | 'rompecodigos' | 'helados' | 'moon'
 * @param {string} studentId    - UID del jugador
 * @param {string|null} classId - ID de la clase (o null si partida libre del profesor)
 * @param {number} score        - Puntuación principal
 * @param {object} metadata     - Datos específicos del juego (wpm, accuracy, etc.)
 */
export async function saveGameResult(gameId, studentId, classId, score, metadata = {}) {
  const ref = await addDoc(collection(db, 'game_results'), {
    gameId,
    studentId,
    classId:   classId || null,
    score,
    metadata,
    timestamp: serverTimestamp()
  });

  // También guardar en users/{uid}/games/ para historial rápido del perfil
  await addDoc(collection(db, 'users', studentId, 'games'), {
    gameId,
    classId: classId || null,
    score,
    timestamp: serverTimestamp()
  });

  return ref.id;
}

export async function getStudentResults(studentId, limitN = 20) {
  const q = query(
    collection(db, 'game_results'),
    where('studentId', '==', studentId),
    orderBy('timestamp', 'desc'),
    limit(limitN)
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function getStudentResultsByGame(studentId, gameId, limitN = 20) {
  const q = query(
    collection(db, 'game_results'),
    where('studentId', '==', studentId),
    where('gameId', '==', gameId),
    orderBy('timestamp', 'desc'),
    limit(limitN)
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function getClassResults(classId, gameId = null, limitN = 100) {
  let q;
  if (gameId) {
    q = query(
      collection(db, 'game_results'),
      where('classId', '==', classId),
      where('gameId', '==', gameId),
      orderBy('timestamp', 'desc'),
      limit(limitN)
    );
  } else {
    q = query(
      collection(db, 'game_results'),
      where('classId', '==', classId),
      orderBy('timestamp', 'desc'),
      limit(limitN)
    );
  }
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

/** Obtiene el mejor score de un alumno en un juego para una clase */
export async function getStudentBestScore(studentId, gameId, classId) {
  const q = query(
    collection(db, 'game_results'),
    where('studentId', '==', studentId),
    where('gameId', '==', gameId),
    where('classId', '==', classId),
    orderBy('score', 'desc'),
    limit(1)
  );
  const snap = await getDocs(q);
  return snap.empty ? 0 : snap.docs[0].data().score;
}

/** Ranking de la clase para un juego (mejor score por alumno) */
export async function getClassRanking(classId, gameId) {
  const results = await getClassResults(classId, gameId, 500);

  // Agrupa por alumno → mejor score
  const bestByStudent = {};
  for (const r of results) {
    if (!bestByStudent[r.studentId] || r.score > bestByStudent[r.studentId].score) {
      bestByStudent[r.studentId] = r;
    }
  }

  return Object.values(bestByStudent).sort((a, b) => b.score - a.score);
}

// ══════════════════════════════════════════════════════════════════
//  SESIONES EN VIVO (MecanoClass & RompeCodigos)
// ══════════════════════════════════════════════════════════════════

/** Crea una sesión en vivo. Devuelve el PIN (= ID del documento) */
export async function createLiveSession(hostId, gameId, data = {}) {
  const pin = generatePin();
  await setDoc(doc(db, 'live_sessions', pin), {
    hostId,
    gameId,
    pin,
    status:    'lobby',   // lobby | running | finished
    createdAt: serverTimestamp(),
    ...data
  });
  return pin;
}

export async function getLiveSession(pin) {
  const snap = await getDoc(doc(db, 'live_sessions', pin));
  return snap.exists() ? snap.data() : null;
}

export async function updateLiveSession(pin, data) {
  await updateDoc(doc(db, 'live_sessions', pin), data);
}

export function listenToLiveSession(pin, onChange) {
  return onSnapshot(doc(db, 'live_sessions', pin), snap => {
    if (snap.exists()) onChange(snap.data());
  });
}

/** Unirse a una sesión en vivo */
export async function joinLiveSession(pin, studentId, displayName) {
  const session = await getLiveSession(pin);
  if (!session) throw new Error('Sesión no encontrada.');
  if (session.status !== 'lobby') throw new Error('La sesión ya ha comenzado o finalizado.');

  await setDoc(doc(db, 'live_participants', `${pin}_${studentId}`), {
    sessionId:   pin,
    studentId,
    displayName: displayName || 'Jugador',
    score:       0,
    progress:    0,
    status:      'waiting',  // waiting | playing | finished
    joinedAt:    serverTimestamp()
  }, { merge: true });

  return session;
}

export async function updateLiveParticipant(pin, studentId, data) {
  await setDoc(doc(db, 'live_participants', `${pin}_${studentId}`), data, { merge: true });
}

export function listenToLiveParticipants(pin, onChange) {
  const q = query(collection(db, 'live_participants'), where('sessionId', '==', pin));
  return onSnapshot(q, snap => {
    onChange(snap.docs.map(d => d.data()));
  });
}

export async function getHostLiveSessions(hostId, gameId) {
  const q = query(
    collection(db, 'live_sessions'),
    where('hostId', '==', hostId),
    where('gameId', '==', gameId),
    orderBy('createdAt', 'desc'),
    limit(10)
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => d.data());
}

// ══════════════════════════════════════════════════════════════════
//  TEXTOS DE MECANOGRAFÍA (MecanoClass)
// ══════════════════════════════════════════════════════════════════

export async function getMecanoTexts(classId = null) {
  const pool = [];

  // Textos globales (colección global)
  const globalSnap = await getDocs(collection(db, 'mecanoclass_texts'));
  const globalTexts = globalSnap.docs.map(d => ({ id: d.id, ...d.data(), source: 'global' }));

  if (!classId) return globalTexts;

  // Textos personalizados de la clase + filtro de deshabilitados
  const classDoc = await getDoc(doc(db, 'classes', classId));
  if (!classDoc.exists()) return globalTexts;

  const { customTexts = [], disabledGlobalTexts = [] } = classDoc.data();
  const disabledSet = new Set(disabledGlobalTexts);

  const filtered = globalTexts.filter(t => !disabledSet.has(t.id));
  return [...filtered, ...customTexts.map(t => ({ ...t, source: 'custom' }))];
}

export async function getRandomMecanoText(classId = null) {
  const texts = await getMecanoTexts(classId);
  if (texts.length === 0) return null;
  return texts[Math.floor(Math.random() * texts.length)];
}

export async function seedMecanoTexts(texts) {
  const batch = [];
  for (const item of texts) {
    batch.push(setDoc(doc(collection(db, 'mecanoclass_texts')), item));
  }
  await Promise.all(batch);
}

// ══════════════════════════════════════════════════════════════════
//  CONFIGURACIÓN GLOBAL
// ══════════════════════════════════════════════════════════════════

export async function getSiteSettings() {
  const snap = await getDoc(doc(db, 'settings', 'site'));
  return snap.exists() ? snap.data() : { siteUrl: window.location.origin };
}

export async function updateSiteSettings(data) {
  await setDoc(doc(db, 'settings', 'site'), data, { merge: true });
}
