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

export const MEDAL_XP = {
    netdefender_300: 50, guardian_red: 100, netdefender_700: 150, netdefender_1000: 200,
    mecanoclass_20: 20, mecanografo: 50, mecanoclass_60: 100, velocista: 120, mecanoclass_100: 250,
    rompecodigos_200: 50, rompecodigos_500: 100, criptologo: 150, rompecodigos_1200: 200,
    helados_1000: 100, helados_1500: 150, helados_2000: 200, helados_2500: 250, helados_3000: 300, helados_35000: 1000,
    moon_3: 50, explorador_lunar: 100, moon_10: 150, moon_15: 200,
    arenabots_50: 50, arenabots_100: 100, arenabots_150: 150, arquitecto_bot: 250,
    cybersmith_100: 50, cybersmith_250: 100, ingeniero: 150, cybersmith_600: 200,
    asimov_20: 30, asimov_50: 60, leyes_robotica: 100, asimov_100: 150,
    appflow_50: 50, appflow_100: 100, unicornio: 150, appflow_300: 200,
    trivial_30: 30, trivial_60: 60, sabiondo: 100,
    madrugador: 10, finde: 10, constancia: 10
};

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
  { id: 'netdefender_300',    name: 'Cortafuegos Activo',      desc: 'Supera los 300 pts en NetDefender.',                               icon: '🔥', public: true },
  { id: 'guardian_red',       name: 'Guardián de la Red',      desc: 'Supera los 500 pts en NetDefender.',                               icon: '🌐', public: true },
  { id: 'netdefender_700',    name: 'SysAdmin',                desc: 'Supera los 700 pts en NetDefender.',                               icon: '🖥️', public: true },
  { id: 'netdefender_1000',   name: 'Dios de la Red',          desc: 'Supera los 1000 pts en NetDefender.',                              icon: '⚡', public: true },
  // MecanoClass
  { id: 'tecleador',          name: 'Tecleador',               desc: 'Juega tu primera partida de MecanoClass.',                         icon: '📝', public: true },
  { id: 'mecanoclass_20',     name: 'Pulsador',                desc: 'Supera las 20 PPM en MecanoClass.',                                icon: '⌨️', public: true },
  { id: 'mecanografo',        name: 'Mecanógrafo',             desc: 'Supera las 40 PPM en MecanoClass.',                                icon: '📝', public: true },
  { id: 'mecanoclass_60',     name: 'Dedos Ágiles',            desc: 'Supera las 60 PPM en MecanoClass.',                                icon: '🏃', public: true },
  { id: 'velocista',          name: 'Velocista',               desc: 'Supera las 70 PPM en MecanoClass.',                                icon: '⚡', public: true },
  { id: 'mecanoclass_100',    name: 'Piano Hacker',            desc: 'Supera las 100 PPM en MecanoClass.',                               icon: '🎹', public: true },
  // RompeCódigos
  { id: 'descifrador',        name: 'Descifrador',             desc: 'Completa RompeCódigos por primera vez.',                           icon: '🔐', public: true },
  { id: 'rompecodigos_200',   name: 'Espía Novato',            desc: 'Supera los 200 pts en RompeCódigos.',                              icon: '🕵️', public: true },
  { id: 'rompecodigos_500',   name: 'Analista de Datos',       desc: 'Supera los 500 pts en RompeCódigos.',                              icon: '📊', public: true },
  { id: 'criptologo',         name: 'Criptólogo',              desc: 'Supera los 800 pts en RompeCódigos.',                              icon: '🔑', public: true },
  { id: 'rompecodigos_1200',  name: 'Enigma Master',           desc: 'Supera los 1200 pts en RompeCódigos.',                             icon: '🧠', public: true },
  // H3L4D0S
  { id: 'heladero',           name: 'Heladero',                desc: 'Completa el primer nivel de H3L4D0S.',                             icon: '🍦', public: true },
  { id: 'programador_bloques',name: 'Programador en Bloques',  desc: 'Supera los 200 pts en H3L4D0S.',                                   icon: '🧩', public: true },
  { id: 'helados_500',        name: 'Heladero Bronce',         desc: 'Consigue más de 500 pts en H3L4D0S.',                              icon: '🥉', public: true },
  { id: 'helados_1000',       name: 'Heladero Plata',          desc: 'Consigue más de 1000 pts en H3L4D0S.',                             icon: '🥈', public: true },
  { id: 'helados_1500',       name: 'Heladero Oro',            desc: 'Consigue más de 1500 pts en H3L4D0S.',                             icon: '🥇', public: true },
  { id: 'helados_2000',       name: 'Heladero Platino',        desc: 'Consigue más de 2000 pts en H3L4D0S.',                             icon: '⭐', public: true },
  { id: 'helados_2500',       name: 'Heladero Diamante',       desc: 'Consigue más de 2500 pts en H3L4D0S.',                             icon: '💎', public: true },
  { id: 'helados_3000',       name: 'Leyenda Heladera',        desc: 'Consigue más de 3000 pts en H3L4D0S.',                             icon: '👑', public: true },
  { id: 'helados_35000',      name: 'Dios de los Helados',     desc: 'Consigue más de 35000 pts en H3L4D0S.',                            icon: '🌟', public: true },
  // MOON
  { id: 'astronauta',         name: 'Astronauta',              desc: 'Completa MOON.',                                                   icon: '🌙', public: true },
  { id: 'moon_3',             name: 'Cadete Espacial',         desc: 'Llega al nivel 3 en MOON.',                                        icon: '🚀', public: true },
  { id: 'explorador_lunar',   name: 'Explorador Lunar',        desc: 'Llega al nivel 5 en MOON.',                                        icon: '🌑', public: true },
  { id: 'moon_10',            name: 'Comandante',              desc: 'Llega al nivel 10 en MOON.',                                       icon: '👨‍🚀', public: true },
  { id: 'moon_15',            name: 'Conquistador Galáctico',  desc: 'Llega al nivel 15 en MOON.',                                       icon: '🌌', public: true },
  // ArenaBots
  { id: 'robotizador',        name: 'Robotizador',             desc: 'Completa tu primera partida en ArenaBots.',                        icon: '🤖', public: true },
  { id: 'arenabots_50',       name: 'Tuerca Floja',            desc: 'Consigue 50 pts en ArenaBots.',                                    icon: '🔧', public: true },
  { id: 'arenabots_100',      name: 'Soldador',                desc: 'Consigue 100 pts en ArenaBots.',                                   icon: '🔥', public: true },
  { id: 'arenabots_150',      name: 'Ingeniero de Combate',    desc: 'Consigue 150 pts en ArenaBots.',                                   icon: '⚔️', public: true },
  { id: 'arquitecto_bot',     name: 'Arquitecto de Robots',    desc: 'Consigue 250 pts en ArenaBots.',                                   icon: '🏆', public: true },
  // CyberSmith
  { id: 'smith',              name: 'CyberSmith',              desc: 'Monta tu primer PC en CyberSmith.',                                icon: '🛠️', public: true },
  { id: 'cybersmith_100',     name: 'Ensamblador',             desc: 'Consigue 100 pts en CyberSmith.',                                  icon: '🪛', public: true },
  { id: 'cybersmith_250',     name: 'Técnico de Hardware',     desc: 'Consigue 250 pts en CyberSmith.',                                  icon: '💻', public: true },
  { id: 'ingeniero',          name: 'Ingeniero',               desc: 'Consigue 400 pts en CyberSmith.',                                  icon: '⚙️', public: true },
  { id: 'cybersmith_600',     name: 'Overclocker',             desc: 'Consigue 600 pts en CyberSmith.',                                  icon: '🚀', public: true },
  // Asimov.IO
  { id: 'etico_ia',           name: 'Ético de la IA',          desc: 'Completa Asimov.IO por primera vez.',                              icon: '⚖️', public: true },
  { id: 'asimov_20',          name: 'Aprendiz de Asimov',      desc: 'Consigue 20 pts en Asimov.IO.',                                    icon: '📖', public: true },
  { id: 'asimov_50',          name: 'Filósofo Sintético',      desc: 'Consigue 50 pts en Asimov.IO.',                                    icon: '🧠', public: true },
  { id: 'leyes_robotica',     name: 'Leyes de la Robótica',    desc: 'Consigue 80 pts en Asimov.IO.',                                    icon: '📜', public: true },
  { id: 'asimov_100',         name: 'Cerebro Positrónico',     desc: 'Consigue 100 pts en Asimov.IO.',                                   icon: '🤖', public: true },
  // AppFlow
  { id: 'dev_app',            name: 'Dev de Apps',             desc: 'Completa AppFlow por primera vez.',                                icon: '📱', public: true },
  { id: 'appflow_50',         name: 'Programador Junior',      desc: 'Consigue 50 pts en AppFlow.',                                      icon: '💻', public: true },
  { id: 'appflow_100',        name: 'Desarrollador Senior',    desc: 'Consigue 100 pts en AppFlow.',                                     icon: '🚀', public: true },
  { id: 'unicornio',          name: 'Unicornio',               desc: 'Consigue 200 pts en AppFlow.',                                     icon: '🦄', public: true },
  { id: 'appflow_300',        name: 'Tech Lead',               desc: 'Consigue 300 pts en AppFlow.',                                     icon: '👑', public: true },
  // Trivial
  { id: 'preguntador',        name: 'Curioso',                 desc: 'Juega tu primera partida de Trivial.',                             icon: '❓', public: true },
  { id: 'trivial_30',         name: 'Estudiante Aplicado',     desc: 'Consigue 30 pts en Trivial.',                                      icon: '📚', public: true },
  { id: 'trivial_60',         name: 'Rata de Biblioteca',      desc: 'Consigue 60 pts en Trivial.',                                      icon: '🐀', public: true },
  { id: 'sabiondo',           name: 'Sabiondo',                desc: 'Consigue 100 pts en Trivial.',                                     icon: '🧠', public: true },
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
 * Calcula los XP a otorgar por una partida.
 * No lineal: base por jugar, logarítmico para puntuación, reduce logarítmicamente por repetición
 */
export function computeGameXP(gameId, score, nPartidas = 1, previousMaxScore = 0) {
  if (!score || score <= 0) return 5; // Mínimo 5 por jugar
  const cfg = GAME_XP_CONFIG[gameId];
  if (!cfg) return Math.min(10, Math.round(score * 0.1));

  // Base XP por jugar simplemente
  const basePlay = 5;

  const getScoreXP = (s) => {
    const ratio = s / cfg.maxRef;
    const scoreFactor = Math.pow(ratio, 0.65); // Curva progresiva
    return cfg.base * scoreFactor;
  };

  if (nPartidas === 1) {
    // Primera partida: toda la XP de golpe
    return Math.max(1, Math.round(basePlay + getScoreXP(score)));
  } else {
    // Repetición
    if (score > previousMaxScore) {
      // Superó su récord: damos la diferencia de XP
      const delta = getScoreXP(score) - getScoreXP(previousMaxScore);
      return Math.max(1, Math.round(basePlay + delta));
    } else {
      // No superó su récord: solo XP base de repetición muy baja
      return basePlay;
    }
  }
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
