// ═══════════════════════════════════════════════════════════════════════
//  CLASSHUB — Utils (Utilidades comunes)
// ═══════════════════════════════════════════════════════════════════════

/** Genera un PIN numérico de 6 dígitos */
export function generatePin() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/** Genera un código de sala alfanumérico de 6 caracteres (sin vocales ni ambiguos) */
export function generateRoomCode() {
  const chars = 'BCDFGHJKLMNPQRSTVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

/** Avatar robot DiceBear a partir del UID */
export function generateAvatar(uid) {
  return `https://api.dicebear.com/7.x/bottts/svg?seed=${uid}&backgroundColor=00e5ff,transparent`;
}

/** Avatar persona DiceBear (para profesores) */
export function generateTeacherAvatar(uid) {
  return `https://api.dicebear.com/7.x/avataaars/svg?seed=${uid}&backgroundColor=b6e3f4`;
}

/** Anonimiza nombre: "Nombre Apellido1 Apellido2" → "Nombre A1A2" */
export function anonymizeName(fullName) {
  if (!fullName) return 'Alumno Anónimo';
  const parts = fullName.trim().split(' ').filter(Boolean);
  if (parts.length === 1) return parts[0];
  const initials = parts.slice(1).map(p => p.charAt(0).toUpperCase()).join('');
  return `${parts[0]} ${initials}`;
}

/** Formatea timestamp Firebase → "dd/mm/yyyy HH:MM" */
export function formatDate(ts) {
  if (!ts) return '—';
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  return d.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' })
       + ' ' + d.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
}

/** Formatea segundos → "MM:SS" */
export function formatTime(seconds) {
  const m = Math.floor(seconds / 60).toString().padStart(2, '0');
  const s = (seconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

/** Formatea tiempo relativo → "hace 5 min", "hace 2 días" */
export function timeAgo(ts) {
  if (!ts) return '';
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  const diff = (Date.now() - d.getTime()) / 1000;
  if (diff < 60)    return 'hace un momento';
  if (diff < 3600)  return `hace ${Math.floor(diff / 60)} min`;
  if (diff < 86400) return `hace ${Math.floor(diff / 3600)}h`;
  return `hace ${Math.floor(diff / 86400)} días`;
}

/** Copia texto al portapapeles */
export async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    const el = document.createElement('textarea');
    el.value = text;
    document.body.appendChild(el);
    el.select();
    document.execCommand('copy');
    document.body.removeChild(el);
    return true;
  }
}

/** Convierte una puntuación a nota sobre 10 con umbral configurable */
export function scoreToGrade(score, targetScore) {
  if (!targetScore || targetScore <= 0) return 0;
  return Math.min(10, Math.round((score / targetScore) * 100) / 10);
}

/** Parámetros de URL como objeto */
export function getUrlParams() {
  return Object.fromEntries(new URLSearchParams(window.location.search));
}

/** Selecciona elemento por ID con shorthand */
export const $ = id => document.getElementById(id);

/** Selecciona todos los elementos por selector */
export const $$ = sel => document.querySelectorAll(sel);

/** Escapa HTML para evitar XSS */
export function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** Espera N milisegundos */
export const sleep = ms => new Promise(r => setTimeout(r, ms));

/**
 * Devuelve la URL absoluta correcta dentro de la aplicación para una ruta relativa dada.
 * Funciona de forma precisa en localhost, GitHub Pages (ej: /cyr/) o cualquier subdirectorio.
 * @param {string} relativePath - Ruta relativa a la raíz del proyecto (ej: 'index.html', 'dashboard_student.html')
 */
export function getAppUrl(relativePath = '') {
  const cleanPath = relativePath.startsWith('/') ? relativePath.slice(1) : relativePath;
  return new URL(`../../${cleanPath}`, import.meta.url).href;
}

/** Metadatos de los juegos disponibles */
export const GAMES = {
  mecanoclass: {
    id: 'mecanoclass',
    name: 'MecanoClass',
    description: 'Juego de mecanografía con modo en vivo',
    icon: '⌨️',
    color: '#00d4ff',
    colorDark: '#007a99',
    path: './mecanoclass/index.html',
    gamePath: './mecanoclass/index.html'
  },
  rompecodigos: {
    id: 'rompecodigos',
    name: 'RompeCódigos',
    description: 'Descifra mensajes cifrados en equipo',
    icon: '🔐',
    color: '#ff6b35',
    colorDark: '#c44a1a',
    path: './rompecodigos/index.html',
    gamePath: './rompecodigos/index.html'
  },
  helados: {
    id: 'helados',
    name: 'H3L4D0S',
    description: 'Sirve helados y aprende programación',
    icon: '🍦',
    color: '#ff8fab',
    colorDark: '#cc5a7a',
    path: './helados/index.html',
    gamePath: './helados/game.html'
  },
  moon: {
    id: 'moon',
    name: 'MOON',
    description: 'Aventura espacial de plataformas',
    icon: '🌙',
    color: '#a8d8ea',
    colorDark: '#5a9bb5',
    path: './moon/index.html',
    gamePath: './moon/game.html'
  },
  arenabots: {
    id: 'arenabots',
    name: 'ArenaBots',
    description: 'Programa tu robot para la batalla',
    icon: '🤖',
    color: '#00e5ff',
    colorDark: '#0099aa',
    path: './arenabots/index.html',
    gamePath: './arenabots/index.html'
  }
};
