import { requireAuth } from './common/auth.js';
import { db, doc, getDoc, updateDoc, collection, getDocs, addDoc, serverTimestamp, query, where } from './common/firebase-config.js';
import { renderHeader, showToast, showModal } from './common/ui.js';
import { getUrlParams, escapeHtml, TOPICS } from './common/utils.js';
import { addXPAndCheckLogros, awardMedal } from './common/gamification.js';

let currentUser = null;
let currentProfile = null;
let currentTopicId = getUrlParams().topic;
let tData = TOPICS[currentTopicId];

let questions = [];
let answers = [];
let currentQ = 0;
let testActive = false;
let blurWarnings = 0;

if (!tData) {
  window.location.href = '../index.html';
}

requireAuth({
  allowedRoles: ['student', 'teacher', 'admin'],
  onAuthorized: async (user, profile) => {
    currentUser = user;
    currentProfile = profile;
    renderHeader(user, profile);
    
    document.title = `Test: ${tData.name}`;
    
    await fetchQuestions();
    
    if (questions.length === 0) {
      document.getElementById('loading-view').innerHTML = `
        <div class="card" style="text-align:center; margin-top: 100px; padding: 40px;">
          <div style="font-size: 4rem; margin-bottom: 20px;">📭</div>
          <h2 style="margin-bottom: 15px;">Aún no hay test para este bloque</h2>
          <p style="color: var(--text-muted); margin-bottom: 30px;">El profesor todavía no ha cargado preguntas en el banco para este temario.</p>
          <button class="btn btn-primary" onclick="history.back()" style="font-weight: bold;">← Volver al temario</button>
        </div>
      `;
      return;
    }
    
    document.getElementById('loading-view').style.display = 'none';
    document.getElementById('test-view').style.display = 'flex';
    
    testActive = true;
    renderNavigator();
    renderQuestion();
    setupEvents();
  }
});

async function fetchQuestions() {
  try {
    const qSnap = await getDocs(query(collection(db, 'preguntas'), where('block', '==', currentTopicId)));
    let allQ = [];
    const seenEnunciados = new Set();
    
    qSnap.forEach(d => {
      let data = d.data();
      data.id = d.id;
      // Anti-duplicados: Solo añadimos la pregunta si no hemos visto antes este mismo enunciado
      const normalizedEnunciado = data.enunciado ? data.enunciado.trim().toLowerCase() : '';
      if (normalizedEnunciado && !seenEnunciados.has(normalizedEnunciado)) {
        seenEnunciados.add(normalizedEnunciado);
        allQ.push(data);
      }
    });
    
    // Shuffle and pick up to 10
    allQ.sort(() => 0.5 - Math.random());
    questions = allQ.slice(0, 10);
    
    // Shuffle options for each question
    questions.forEach(q => {
      q.opciones.sort(() => 0.5 - Math.random());
    });
    
    answers = new Array(questions.length).fill(null);
  } catch(e) {
    console.error(e);
  }
}

function renderNavigator() {
  const nav = document.getElementById('q-navigator');
  nav.innerHTML = '';
  
  questions.forEach((q, idx) => {
    const btn = document.createElement('div');
    btn.className = 'nav-btn';
    btn.textContent = idx + 1;
    
    if (idx === currentQ) {
      btn.classList.add('current');
    } else if (answers[idx] !== null) {
      btn.classList.add('answered');
    } else {
      btn.classList.add('blank');
    }
    
    btn.addEventListener('click', () => {
      currentQ = idx;
      renderQuestion();
    });
    nav.appendChild(btn);
  });
}

function renderQuestion() {
  document.getElementById('q-counter').textContent = `Pregunta ${currentQ + 1} de ${questions.length}`;
  const pct = ((currentQ + 1) / questions.length) * 100;
  document.getElementById('progress-fill').style.width = `${pct}%`;
  
  const q = questions[currentQ];
  const qCard = document.getElementById('q-card');
  
  let html = `
    <h3 style="margin-bottom: 25px; font-size: 1.5rem; line-height: 1.4;">${escapeHtml(q.enunciado).replace(/\n/g, '<br>')}</h3>
  `;
  
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  q.opciones.forEach((opt, optIdx) => {
    const isSelected = answers[currentQ] === optIdx;
    html += `
      <label class="option-label ${isSelected ? 'selected' : ''}">
        <input type="radio" name="q_opt" value="${optIdx}" style="display:none;" ${isSelected ? 'checked' : ''}>
        <div style="display:flex; align-items:center; gap: 15px;">
          <div style="width: 30px; height: 30px; border-radius: 50%; background: ${isSelected ? 'var(--text-primary)' : '#e9ecef'}; color: ${isSelected ? 'white' : '#666'}; display: flex; align-items: center; justify-content: center; font-weight: bold; flex-shrink:0;">${letters[optIdx]}</div>
          <div style="flex: 1;">${escapeHtml(opt.texto)}</div>
        </div>
      </label>
    `;
  });
  
  qCard.innerHTML = html;
  
  document.querySelectorAll('input[name="q_opt"]').forEach(rad => {
    rad.addEventListener('change', (e) => {
      answers[currentQ] = parseInt(e.target.value);
      renderQuestion();
    });
  });
  
  const btnPrev = document.getElementById('btn-prev');
  const btnNext = document.getElementById('btn-next');
  
  btnPrev.style.visibility = currentQ > 0 ? 'visible' : 'hidden';
  
  if (currentQ === questions.length - 1) {
    btnNext.textContent = 'Entregar Test ✔️';
    btnNext.style.background = 'var(--success)';
  } else {
    btnNext.textContent = 'Siguiente ➡';
    btnNext.style.background = 'var(--primary)';
  }
  renderNavigator();
}

function setupEvents() {
  document.getElementById('btn-prev').addEventListener('click', () => {
    if (currentQ > 0) { currentQ--; renderQuestion(); }
  });
  
  document.getElementById('btn-next').addEventListener('click', () => {
    if (currentQ < questions.length - 1) {
      currentQ++; renderQuestion();
    } else {
      submitTest();
    }
  });
  
  document.getElementById('btn-exit').addEventListener('click', () => {
    showModal({
      title: 'Salir sin guardar',
      body: '¿Seguro que quieres salir? Perderás el progreso del test actual.',
      confirmText: 'Salir y Perder Progreso',
      cancelText: 'Cancelar',
      dangerous: true,
      onConfirm: () => {
        window.location.href = `../temario/${currentTopicId}.html`;
      }
    });
  });
}

function submitTest() {
  if (!testActive) return;
  showModal({
    title: 'Entregar Test',
    body: '¿Estás seguro de entregar el test? Se evaluarán tus respuestas y no podrás cambiar nada.',
    confirmText: 'Entregar Test',
    cancelText: 'Seguir Revisando',
    onConfirm: async () => {
      document.getElementById('test-view').style.display = 'none';
      await processSubmission();
    }
  });
}

async function processSubmission(forcedFail = false) {
  testActive = false;
  document.getElementById('loading-view').style.display = 'flex';
  document.getElementById('loading-view').innerHTML = '<div style="text-align:center;margin-top:100px;"><h2>Evaluando...</h2></div>';
  
  let score = 0;
  let respuestas = [];

  questions.forEach((q, idx) => {
    let answered = answers[idx];
    if (answered === null || answered === undefined) answered = -1;
    let isCorrect = false;
    
    if (answered !== -1) {
      if (q.opciones[answered].correcta) {
        score += 1;
        isCorrect = true;
      } else {
        score -= 0.33;
      }
    }
    
    respuestas.push({
      preguntaId: q.id,
      criterio: q.criterio || null,
      ce: q.ce || null,
      enunciado: q.enunciado,
      marcada: answered !== -1 ? q.opciones[answered].texto : 'BLANCO',
      correctaTexto: q.opciones.find(o => o.correcta)?.texto || '?',
      isCorrect: forcedFail ? false : isCorrect,
      isBlanco: answered === -1
    });
  });

  const totalPossible = questions.length;
  let finalScore = (score / totalPossible) * 10;
  if (finalScore < 0) finalScore = 0;
  finalScore = Math.round(finalScore * 100) / 100;
  if (forcedFail) finalScore = 0;

  if (currentProfile.role === 'student' && !forcedFail) {
    try {
      // 1. XP (Experiencia)
      let xpEarned = 20; // 20 XP base por completarlo
      if (finalScore >= 5) xpEarned += 30; // +30 XP por aprobar
      if (finalScore >= 9) xpEarned += 50; // +50 XP por sobresaliente
      
      await addXPAndCheckLogros(currentUser.uid, xpEarned);

      // 2. Medallas
      await awardMedal(currentUser.uid, 'primer_examen');
      
      if (finalScore === 10) {
        await awardMedal(currentUser.uid, 'maestro_teoria');
      } else if (finalScore >= 9) {
        await awardMedal(currentUser.uid, 'casi_perfecto');
      }
      
      if (finalScore > 5) {
        await awardMedal(currentUser.uid, 'aprobado_teoria');
      } else if (finalScore === 5) {
        await awardMedal(currentUser.uid, 'por_los_pelos');
      }
    } catch(err) {
      console.error('Error awarding medals:', err);
    }
  }

  try {
    await addDoc(collection(db, 'test_teoria_respuestas'), {
      uid: currentUser.uid,
      alumnoNombre: currentProfile.displayNameAnonymized || currentProfile.displayName || currentProfile.email,
      topicId: currentTopicId,
      topicName: tData.name,
      score: finalScore,
      rawScore: score,
      maxPossible: totalPossible,
      forcedFail: forcedFail,
      respuestas: respuestas,
      fecha: serverTimestamp()
    });
  } catch (err) {
    console.error('Error saving test results:', err);
  }

  document.getElementById('loading-view').style.display = 'none';
  document.getElementById('results-view').style.display = 'flex';
  
  const resultsContent = document.getElementById('results-content');
  resultsContent.innerHTML = `
    <h2 style="margin-bottom: 20px; font-size: 2rem;">Resultados del Test</h2>
    <div style="font-size: 6rem; margin-bottom: 10px; filter: drop-shadow(0 4px 6px rgba(0,0,0,0.1));">${finalScore >= 5 ? '🎉' : '💀'}</div>
    <h1 style="color: ${finalScore >= 5 ? 'var(--success)' : 'var(--error)'}; font-size: 4rem; margin-bottom: 20px;">
      ${finalScore} <span style="font-size: 2rem; color: #7f8c8d;">/ 10</span>
    </h1>
    <p style="font-size: 1.3rem; margin-bottom: 30px; color: #555;">
      ${finalScore >= 5 
        ? '¡Enhorabuena! Has aprobado el test. Tus resultados han sido guardados.' 
        : 'Has suspendido. Repasa el temario y vuelve a intentarlo más tarde.'}
    </p>
    ${finalScore === 10 ? '<p style="color: #f1c40f; font-weight: bold; font-size: 1.4rem; margin-bottom: 30px;">¡Examen Perfecto! Has desbloqueado una medalla 🥇</p><br>' : ''}
    <button class="btn btn-primary btn--lg" onclick="window.location.href='../temario/${currentTopicId}.html'">⬅ Volver al Temario</button>
  `;
}

// --- Anti-Chuletas ---
function handleFocusLost() {
  if (!testActive) return;
  if (currentProfile && currentProfile.role !== 'student') return;
  
  blurWarnings++;
  
  if (blurWarnings === 1) {
    showModal({
      title: '⚠️ ¡Atención! Actividad sospechosa',
      body: 'Hemos detectado que has salido de la ventana o cambiado de pestaña. Durante el test no está permitido consultar otras fuentes.<br><br><b>Si vuelves a salir, el test se suspenderá automáticamente con un 0.</b>',
      confirmText: 'Entendido',
      cancelText: 'Cerrar'
    });
  } else if (blurWarnings >= 2) {
    testActive = false;
    processSubmission(true); // Guarda el 0 en segundo plano
    
    // Ocultar el test y mostrar mensaje grande
    document.getElementById('test-view').style.display = 'none';
    document.getElementById('loading-view').style.display = 'block';
    document.getElementById('loading-view').innerHTML = `
      <div class="card" style="text-align:center; margin-top: 100px; padding: 40px; border: 2px solid var(--error);">
        <div style="font-size: 4rem; margin-bottom: 20px;">❌</div>
        <h2 style="margin-bottom: 15px; color: var(--error);">Test Suspendido</h2>
        <p style="color: var(--text-muted); margin-bottom: 30px; font-size: 1.1rem;">Has vuelto a salir de la ventana. El test ha sido anulado con un 0 automático por medidas anti-chuletas.</p>
        <button class="btn btn-primary" onclick="window.location.href = '../temario/${currentTopicId}.html'" style="font-weight: bold;">← Volver al temario</button>
      </div>
    `;
  }
}

window.addEventListener('blur', handleFocusLost);
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'hidden') handleFocusLost();
});
