// ═══════════════════════════════════════════════════════════════════════
//  CYR CLASSHUB — Gamificación (Gremios, Ligas, Medallas, XP)
// ═══════════════════════════════════════════════════════════════════════

import {
  db,
  doc, getDoc, updateDoc,
  arrayUnion, increment, serverTimestamp
} from './firebase-config.js';

// --- GREMIOS (4 robots de ciencia ficción) ---
export const GUILDS_CATALOG = [
  {
    id: 'r2d2',
    name: 'La Brigada R2-D2',
    icon: '🔵',
    image: 'img/gremios/r2d2.png',
    color: '#00bcd4',
    desc: 'Fieles, valientes y siempre listos para la misión. Inspirados en el famoso astromecánico de Star Wars, esta brigada destaca por su lealtad y su capacidad para resolver problemas en los momentos más críticos.'
  },
  {
    id: 'walle',
    name: 'El Colectivo WALL·E',
    icon: '🟠',
    image: 'img/gremios/walle.png',
    color: '#ff9800',
    desc: 'Curiosos, creativos y con un enorme corazón. Como el robot de Pixar, este colectivo valora la creatividad por encima de todo y cree que incluso la tarea más pequeña puede cambiar el mundo.'
  },
  {
    id: 'baymax',
    name: 'La Unidad Baymax',
    icon: '🤍',
    image: 'img/gremios/baymax.png',
    color: '#e53935',
    desc: 'Pacíficos, empáticos y siempre dispuestos a ayudar. Inspirados en el robot asistente médico, los miembros de esta unidad destacan por su compañerismo y su capacidad para sanar los errores del código en equipo.'
  },
  {
    id: 'terminator',
    name: 'La Orden Terminator',
    icon: '💀',
    image: 'img/gremios/terminator.png',
    color: '#607d8b',
    desc: 'Imparables, determinados y forjados en acero. Como el T-800, los miembros de esta orden no conocen el abandono. Una vez que se proponen un objetivo, nada ni nadie puede detenerlos.'
  }
];

// --- LIGAS ---
export const LEAGUES = [
  { id: 'maestro',  name: 'Liga Maestro',  pts: 25000, icon: '🏆', color: '#f1c40f' },
  { id: 'diamante', name: 'Liga Diamante', pts: 10000, icon: '💎', color: '#00d2d3' },
  { id: 'platino',  name: 'Liga Platino',  pts: 5000,  icon: '⭐', color: '#9b59b6' },
  { id: 'oro',      name: 'Liga Oro',      pts: 2000,  icon: '🥇', color: '#f39c12' },
  { id: 'plata',    name: 'Liga Plata',    pts: 500,   icon: '🥈', color: '#bdc3c7' },
  { id: 'bronce',   name: 'Liga Bronce',   pts: 0,     icon: '🥉', color: '#cd6133' }
];

// --- MEDALLAS ---
export const MEDALS_CATALOG = [
  // Progresión
  { id: 'primer_circuito',     name: 'Primer Circuito',        desc: 'Completa tu primera partida a cualquier juego.',                   icon: '🔌', public: true },
  { id: 'novato',              name: 'Novato Digital',          desc: 'Alcanza los 500 Puntos de Experiencia.',                           icon: '🌱', public: true },
  { id: 'aprendiz',            name: 'Aprendiz Digital',        desc: 'Alcanza los 2.000 Puntos de Experiencia.',                         icon: '🎓', public: true },
  { id: 'veterano',            name: 'Veterano',                desc: 'Alcanza los 5.000 Puntos de Experiencia.',                         icon: '⚔️', public: true },
  { id: 'maestro_xp',         name: 'Maestro Cibernético',     desc: 'Alcanza los 15.000 Puntos de Experiencia.',                        icon: '👑', public: true },
  { id: 'cibernauta',         name: 'Cibernauta',              desc: 'Alcanza los 30.000 Puntos de Experiencia.',                        icon: '🚀', public: true },
  // NetDefender
  { id: 'defensor',           name: 'Defensor',                desc: 'Consigue tu primera puntuación en NetDefender.',                   icon: '🛡️', public: true },
  { id: 'guardian_red',       name: 'Guardián de la Red',      desc: 'Supera los 500 pts en NetDefender.',                               icon: '🌐', public: true },
  { id: 'parachoques',        name: 'Parachoques',             desc: 'Llega al nivel 5 en NetDefender.',                                 icon: '💪', public: true },
  // MecanoClass
  { id: 'mecanografo',        name: 'Mecanógrafo',             desc: 'Supera las 40 PPM en MecanoClass.',                                icon: '⌨️', public: true },
  { id: 'velocista',          name: 'Velocista',               desc: 'Supera las 70 PPM en MecanoClass.',                                icon: '⚡', public: true },
  // RompeCódigos
  { id: 'descifrador',        name: 'Descifrador',             desc: 'Completa RompeCódigos por primera vez.',                           icon: '🔐', public: true },
  { id: 'criptologo',         name: 'Criptólogo',              desc: 'Supera los 800 pts en RompeCódigos.',                              icon: '🔑', public: true },
  // H3L4D0S
  { id: 'heladero',           name: 'Heladero',                desc: 'Completa el primer nivel de H3L4D0S.',                             icon: '🍦', public: true },
  { id: 'programador_bloques',name: 'Programador en Bloques',  desc: 'Supera los 200 pts en H3L4D0S.',                                   icon: '🧩', public: true },
  // MOON
  { id: 'astronauta',         name: 'Astronauta',              desc: 'Completa MOON.',                                                    icon: '🌙', public: true },
  { id: 'explorador_lunar',   name: 'Explorador Lunar',        desc: 'Llega al nivel 5 en MOON.',                                         icon: '🌑', public: true },
  // ArenaBots
  { id: 'robotizador',        name: 'Robotizador',             desc: 'Completa tu primera partida en ArenaBots.',                         icon: '🤖', public: true },
  { id: 'arquitecto_bot',     name: 'Arquitecto de Robots',    desc: 'Gana 3 partidas en ArenaBots.',                                     icon: '🏆', public: true },
  // CyberSmith
  { id: 'smith',              name: 'CyberSmith',              desc: 'Monta tu primer PC en CyberSmith.',                                 icon: '🛠️', public: true },
  { id: 'ingeniero',          name: 'Ingeniero',               desc: 'Completa CyberSmith con puntuación alta.',                          icon: '⚙️', public: true },
  // Asimov.IO
  { id: 'etico_ia',           name: 'Ético de la IA',          desc: 'Completa Asimov.IO.',                                               icon: '⚖️', public: true },
  // AppFlow
  { id: 'dev_app',            name: 'Dev de Apps',             desc: 'Completa AppFlow.',                                                 icon: '📱', public: true },
  // Exámenes
  { id: 'primer_examen',      name: 'Primer Examen',           desc: 'Entrega tu primer examen tipo test.',                               icon: '📝', public: true },
  { id: 'maestro_teoria',     name: 'Maestro de la Teoría',    desc: 'Saca un 10 absoluto en un examen.',                                 icon: '💯', public: true },
  { id: 'aprobado_teoria',      name: 'Aprobado Teórico',        desc: 'Saca más de un 5 en un examen.',                               icon: '🎓', public: true },
  { id: 'casi_perfecto',      name: 'Casi Perfecto',           desc: 'Saca un 9 en un examen.',                                           icon: '🎯', public: true },
  { id: 'por_los_pelos',      name: 'Por los Pelos',           desc: 'Saca exactamente un 5 en un examen.',                               icon: '😅', public: true },
  { id: 'remontada',          name: 'La Remontada',            desc: 'Saca más de un 8 habiendo suspendido el examen anterior.',          icon: '📈', public: true },
  { id: 'erudito',            name: 'Erudito',                 desc: 'Realiza 5 exámenes distintos.',                                     icon: '📚', public: true },
  // Tiempo
  { id: 'madrugador',         name: 'El Madrugador',           desc: 'Completa una actividad entre las 6:00 y las 8:00 AM.',              icon: '🌅', public: true },
  { id: 'finde',              name: 'Sin Descanso',            desc: 'Realiza una actividad durante el fin de semana.',                   icon: '🏖️', public: true },
  { id: 'constancia',         name: 'Constancia',              desc: 'Entra a CyR Hub tres días seguidos.',                               icon: '🔥', public: true },
  // Gremios
  { id: 'rey_gremio',         name: 'Rey del Gremio',          desc: 'Tu gremio llega al nº1 en el ranking de la clase.',                 icon: '🥇', public: true },
  { id: 'leal',               name: 'Leal al Gremio',          desc: 'Permanece en tu gremio hasta el fin de la evaluación.',            icon: '🤝', public: true },
  // Ocultas
  { id: 'hora_bruja',         name: '?????',                   desc: 'Completa una actividad a una hora muy especial de la noche...',     icon: '👻', public: false },
  { id: 'nocturno',           name: '?????',                   desc: 'Las mejores ideas llegan de madrugada...',                          icon: '🦉', public: false },
  { id: 'asimov_rebelde',     name: '?????',                   desc: 'A veces las reglas se hacen para romperse...',                      icon: '🤖', public: false },
  { id: 'exterminador',       name: '?????',                   desc: 'Una victoria aplastante e imparable...',                            icon: '💥', public: false },
  { id: 'suerte_ciega',       name: '?????',                   desc: 'La rapidez puede ser una forma de sabiduría...',                    icon: '🎲', public: false },
  { id: 'adicto',             name: '?????',                   desc: 'Dicen que la práctica hace al maestro...',                          icon: '🤓', public: false },
];

// --- CONFIGURACIÓN XP POR JUEGO ---
export const GAME_XP_CONFIG = {
  netdefender:  { maxRef: 800,  base: 80  },
  trivial:      { maxRef: 100,  base: 50  },
  mecanoclass:  { maxRef: 100,  base: 80  },
  rompecodigos: { maxRef: 1000, base: 100 },
  helados:      { maxRef: 500,  base: 90  },
  moon:         { maxRef: 300,  base: 70  },
  arenabots:    { maxRef: 200,  base: 100 },
  cybersmith:   { maxRef: 500,  base: 90  },
  asimov:       { maxRef: 100,  base: 60  },
  appflow:      { maxRef: 300,  base: 70  },
};

// --- FUNCIONES NÚCLEO ---

/** Devuelve la liga actual en base a los puntos. */
export function getLeague(points) {
  for (const liga of LEAGUES) {
    if (points >= liga.pts) return liga;
  }
  return LEAGUES[LEAGUES.length - 1];
}

/**
 * Calcula los XP a otorgar por una partida usando fórmula no lineal:
 * xp = base × √(score / maxRef) × bonusPartidas
 * bonusPartidas = 1 + 0.15 × log2(1 + nPartidas)
 * Mínimo garantizado: 10 XP si score > 0
 */
export function computeGameXP(gameId, score, nPartidas = 1) {
  if (!score || score <= 0) return 0;
  const cfg = GAME_XP_CONFIG[gameId];
  if (!cfg) return Math.min(10, Math.round(score * 0.1));

  const ratio = Math.min(1, score / cfg.maxRef);
  const base = cfg.base * Math.sqrt(ratio);
  
  // Rendimientos decrecientes: cada intento consecutivo da menos XP (100%, 75%, 56%, 42%, etc.)
  // Evita que los alumnos grindee infinitamente el mismo juego para inflar puntos.
  const bonus = Math.pow(0.75, nPartidas - 1);
  
  return Math.max(5, Math.round(base * bonus));
}

/**
 * Añade XP a un usuario y comprueba medallas desbloqueadas.
 * @param {string} userId - UID del usuario en Firestore
 * @param {number} xp - Puntos a sumar
 * @returns {object} { success, newPoints, leagueUp, newLeague, nuevasMedallas }
 */
export async function addXPAndCheckLogros(userId, xp) {
  if (!userId || xp <= 0) return { success: false };

  const userRef = doc(db, 'users', userId);
  const userSnap = await getDoc(userRef);

  if (!userSnap.exists()) {
    console.warn('Usuario no encontrado para gamificación:', userId);
    return { success: false };
  }

  const userData = userSnap.data();
  const currentPts = userData.puntosTotal || 0;
  const newPts = currentPts + xp;

  const currentLeague = getLeague(currentPts);
  const newLeague = getLeague(newPts);
  const leagueUp = newLeague.id !== currentLeague.id && newPts > currentPts;

  await updateDoc(userRef, {
    puntosTotal: increment(xp),
    updatedAt: serverTimestamp()
  });

  // Evaluar medallas de XP
  const nuevasMedallas = [];
  const logros = userData.logros || [];
  const hasLogro = (id) => logros.some(l => l.id === id);

  // Medallas de progresión por XP
  const xpMedals = [
    { id: 'novato',    pts: 500 },
    { id: 'aprendiz',  pts: 2000 },
    { id: 'veterano',  pts: 5000 },
    { id: 'maestro_xp', pts: 15000 },
    { id: 'cibernauta', pts: 30000 },
  ];
  for (const m of xpMedals) {
    if (newPts >= m.pts && !hasLogro(m.id)) {
      const awarded = await awardMedal(userId, m.id);
      if (awarded) nuevasMedallas.push(awarded);
    }
  }

  // Medallas de tiempo
  const h = new Date().getHours();
  const day = new Date().getDay(); // 0=Dom, 6=Sáb
  if (h >= 6 && h <= 8 && !hasLogro('madrugador')) {
    const m = await awardMedal(userId, 'madrugador'); if (m) nuevasMedallas.push(m);
  }
  if (h >= 0 && h <= 4 && !hasLogro('nocturno')) {
    const m = await awardMedal(userId, 'nocturno'); if (m) nuevasMedallas.push(m);
  }
  if (h === 3 && new Date().getMinutes() === 33 && !hasLogro('hora_bruja')) {
    const m = await awardMedal(userId, 'hora_bruja'); if (m) nuevasMedallas.push(m);
  }
  if ((day === 0 || day === 6) && !hasLogro('finde')) {
    const m = await awardMedal(userId, 'finde'); if (m) nuevasMedallas.push(m);
  }

  return { success: true, newPoints: newPts, leagueUp, newLeague, nuevasMedallas };
}

/**
 * Otorga una medalla específica a un usuario si no la tiene ya.
 * @returns {object|false} El objeto de la medalla si se otorgó, false si ya la tenía
 */
export async function awardMedal(userId, medalId) {
  const userRef = doc(db, 'users', userId);
  const userSnap = await getDoc(userRef);
  if (!userSnap.exists()) return false;

  const logros = userSnap.data().logros || [];
  if (logros.some(m => m.id === medalId)) return false;

  const medal = MEDALS_CATALOG.find(m => m.id === medalId);
  if (!medal) return false;

  const medalObj = {
    id: medal.id,
    name: medal.name,
    icon: medal.icon,
    desc: medal.desc,
    fecha: new Date().toISOString()
  };

  await updateDoc(userRef, { logros: arrayUnion(medalObj) });
  return medalObj;
}

/** Renderiza la tarjeta de liga para un perfil dado */
export function renderLeagueCard(points) {
  const liga = getLeague(points);
  return `
    <div style="border: 2px solid ${liga.color}; border-radius: 8px; padding: 15px; text-align: center;">
      <div style="font-size: 2.5rem;">${liga.icon}</div>
      <h4 style="color: ${liga.color}; margin: 10px 0 5px 0;">${liga.name}</h4>
      <p style="margin: 0; font-size: 1.1rem; font-weight: bold;">${points} XP</p>
    </div>
  `;
}
