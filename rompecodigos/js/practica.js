// ============================================================
// practica.js — Modo Práctica (Monojugador) RompeCódigos
// ============================================================

import { requireAuth, currentProfile } from '../../js/common/auth.js';
import { renderHeader, showToast, initParticles } from '../../js/common/ui.js';
import { saveGameResult } from '../../js/common/db.js';

// ─── Misiones de Práctica ────────────────────────────────────
const MISIONES = [
  {
    id: 1,
    titulo: 'Misión 1: Cifrado César Básico',
    tipo: 'caesar',
    tipoBadge: 'César',
    descripcion: 'El mensaje ha sido desplazado un número fijo de posiciones en el alfabeto. Utiliza el slider César para descubrir el mensaje original.',
    textoOriginal: 'EL CODIGO SECRETO HA SIDO DESCIFRADO CON EXITO',
    shift: 3,
    pistas: [
      'El cifrado César mueve cada letra un número constante de posiciones en el alfabeto.',
      'La letra original "A" se ha transformado en "D" (un avance de 3 letras).',
      'Desplaza el control deslizante a la posición 3 para ver el texto claro.'
    ]
  },
  {
    id: 2,
    titulo: 'Misión 2: Interceptación Espacial',
    tipo: 'caesar',
    tipoBadge: 'César',
    descripcion: 'Un mensaje interceptado de la base lunar. Utiliza la gráfica de frecuencias para deducir qué letra cifrada corresponde a la "E" o la "A".',
    textoOriginal: 'LA BASE LUNAR NECESITA SUMINISTROS DE ENERGIA DE INMEDIATO',
    shift: 7,
    pistas: [
      'Observa en el gráfico de barras la letra que tiene la frecuencia más alta.',
      'En el idioma español, las vocales "E" y "A" son las más utilizadas.',
      'Prueba a situar el slider César en la posición 7.'
    ]
  },
  {
    id: 3,
    titulo: 'Misión 3: Criptoanálisis de Sustitución',
    tipo: 'substitution',
    tipoBadge: 'Sustitución',
    descripcion: 'Cifrado por sustitución monoalfabética. Cada letra ha sido cambiada por otra. Usa el botón "Sugerir Sustitución" y afina con el teclado.',
    textoOriginal: 'LA CRIPTOGRAFIA PROTEGE LA INFORMACION MEDIANTE ALGORITMOS MATEMATICOS',
    // Mapeo fijo para consistencia educativa
    substMap: {
      'A': 'X', 'B': 'Y', 'C': 'Z', 'D': 'A', 'E': 'B', 'F': 'C', 'G': 'D', 'H': 'E',
      'I': 'F', 'J': 'G', 'K': 'H', 'L': 'I', 'M': 'J', 'N': 'K', 'O': 'L', 'P': 'M',
      'Q': 'N', 'R': 'O', 'S': 'P', 'T': 'Q', 'U': 'R', 'V': 'S', 'W': 'T', 'X': 'U',
      'Y': 'V', 'Z': 'W'
    },
    pistas: [
      'En este cifrado las letras no siguen un desplazamiento uniforme.',
      'Pulsa el botón "Sugerir Sustitución" para obtener un punto de partida estadístico.',
      'Palabras cortas como "LA" o "DE" te indican rápidamente las vocales principales.'
    ]
  },
  {
    id: 4,
    titulo: 'Misión 4: Cifrado Polialfabético Vigenère',
    tipo: 'vigenere',
    tipoBadge: 'Vigenère',
    descripcion: 'Cifrado polialfabético usando una palabra clave. La clave modifica el desplazamiento de cada letra secuencialmente.',
    textoOriginal: 'LA CLAVE SECRETA ABRE TODAS LAS PUERTAS DEL SISTEMA CENTRAL',
    key: 'ROBOT',
    pistas: [
      'Vigenère utiliza una palabra clave para cifrar cada letra con un desplazamiento distinto.',
      'La clave interceptada tiene 5 letras y se relaciona con autómatas y programación...',
      'Escribe la palabra "ROBOT" en el campo de clave Vigenère y pulsa "Aplicar".'
    ]
  },
  {
    id: 5,
    titulo: 'Misión 5: Reto Ciberpunk ROT13',
    tipo: 'caesar',
    tipoBadge: 'ROT13',
    descripcion: 'Misión final a contrarreloj. Aplica el histórico algoritmo ROT13 (desplazamiento simétrico de 13 posiciones) para completar el entrenamiento.',
    textoOriginal: 'FELICIDADES AGENTE HAS DEMOSTRADO UN GRAN DOMINIO DE LA CRIPTOGRAFIA',
    shift: 13,
    pistas: [
      'ROT13 es un cifrado César simétrico con exactamente 13 posiciones de desplazamiento.',
      'Al tener el alfabeto 26 letras, cifrar dos veces con ROT13 devuelve el mensaje original.',
      'Ajusta el slider César a 13.'
    ]
  }
];

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

// ─── Estado del Modo Práctica ────────────────────────────────
const state = {
  user: null,
  profile: null,
  misionIndex: 0,
  textoCifrado: '',
  textoOriginal: '',
  tablaSustitucion: {}, // { cifrado -> descifrado }
  puntuacionTotal: 0,
  puntuacionMision: 0,
  tiempoInicio: null,
  timerInterval: null,
  pistasUsadas: 0,
  frecChart: null,
  misionesCompletadas: new Set(),
  historialIntentos: []
};

// ─── Inicialización ──────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  initParticles('particles-canvas', '#00e5ff', '#ff3366');

  requireAuth({
    allowedRoles: ['teacher', 'student', 'admin'],
    onAuthorized: (user, profile) => {
      state.user = user;
      state.profile = profile;
      renderHeader(user, profile);
      initPractica();
    }
  });
});

function initPractica() {
  buildSustKeyboard();
  initCesarSlider();
  initVigenereHandler();
  initSubmitHandler();
  renderMisionesNav();
  cargarMision(0);
}

// ─── Renderizar navegación de misiones ────────────────────────
function renderMisionesNav() {
  const container = document.getElementById('misiones-nav');
  if (!container) return;
  container.innerHTML = '';

  MISIONES.forEach((m, idx) => {
    const btn = document.createElement('button');
    btn.className = `mission-pill ${idx === state.misionIndex ? 'active' : ''} ${state.misionesCompletadas.has(idx) ? 'completed' : ''}`;
    btn.innerHTML = `${state.misionesCompletadas.has(idx) ? '✓ ' : ''}Misión ${idx + 1}`;
    btn.addEventListener('click', () => {
      cargarMision(idx);
    });
    container.appendChild(btn);
  });
}

// ─── Cargar Misión ───────────────────────────────────────────
function cargarMision(idx) {
  state.misionIndex = idx;
  const mision = MISIONES[idx];
  state.textoOriginal = mision.textoOriginal;
  state.tablaSustitucion = {};
  state.pistasUsadas = 0;
  state.historialIntentos = [];

  // Generar texto cifrado
  if (mision.tipo === 'caesar') {
    state.textoCifrado = Caesar.encrypt(mision.textoOriginal, mision.shift);
  } else if (mision.tipo === 'vigenere') {
    state.textoCifrado = Vigenere.encrypt(mision.textoOriginal, mision.key);
  } else if (mision.tipo === 'substitution') {
    state.textoCifrado = mision.textoOriginal.split('').map(ch => {
      const upper = ch.toUpperCase();
      return mision.substMap[upper] || ch;
    }).join('');
  }

  // Actualizar HUD e info de misión
  document.getElementById('hud-mision').textContent = `${idx + 1} / ${MISIONES.length}`;
  document.getElementById('mision-title').textContent = mision.titulo;
  document.getElementById('mision-tipo').textContent = mision.tipoBadge;
  document.getElementById('mision-desc').textContent = mision.descripcion;
  document.getElementById('hud-pistas-left').textContent = mision.pistas.length - state.pistasUsadas;

  // Visibilidad de herramientas según tipo
  const secCesar = document.getElementById('section-cesar');
  const secVigenere = document.getElementById('section-vigenere');
  if (mision.tipo === 'vigenere') {
    if (secCesar) secCesar.classList.add('hidden');
    if (secVigenere) secVigenere.classList.remove('hidden');
    const vKeyInput = document.getElementById('vigenere-key-input');
    if (vKeyInput) vKeyInput.value = '';
  } else {
    if (secCesar) secCesar.classList.remove('hidden');
    if (secVigenere) secVigenere.classList.add('hidden');
  }

  // Reset de controles
  const cesarSlider = document.getElementById('cesar-slider');
  if (cesarSlider) {
    cesarSlider.value = 0;
    updateCesarValue(0);
  }
  resetSustInputs();

  // Renderizar vistas
  renderTextoCifrado();
  renderTextoDescifrado();
  renderPistas();
  renderHistorial();
  updateFrequencyChart();
  renderMisionesNav();

  // Iniciar timer
  startTimer();

  // Limpiar campo de solución
  const inputSolucion = document.getElementById('input-solucion');
  if (inputSolucion) inputSolucion.value = '';
  const feedback = document.getElementById('submit-feedback');
  if (feedback) feedback.className = 'submit-feedback hidden';
}

// ─── Renderizar Texto Cifrado ─────────────────────────────────
function renderTextoCifrado() {
  const container = document.getElementById('texto-cifrado');
  if (!container) return;
  container.innerHTML = '';

  state.textoCifrado.split('').forEach(ch => {
    const span = document.createElement('span');
    if (ALPHABET.includes(ch)) {
      span.className = 'char-token letter';
      span.textContent = ch;
      if (state.tablaSustitucion[ch]) {
        span.classList.add('mapped');
      }
      span.addEventListener('click', () => {
        focusSustKey(ch);
      });
    } else if (ch === ' ') {
      span.className = 'char-token space';
      span.innerHTML = '&nbsp;';
    } else {
      span.className = 'char-token';
      span.textContent = ch;
    }
    container.appendChild(span);
  });
}

// ─── Renderizar Texto Descifrado ──────────────────────────────
function renderTextoDescifrado() {
  const container = document.getElementById('texto-descifrado');
  if (!container) return;

  const descifrado = applySubstitution(state.textoCifrado, state.tablaSustitucion);
  container.textContent = descifrado || '— escribe sustituciones para ver el preview';
}

// ─── Teclado de Sustitución ───────────────────────────────────
function buildSustKeyboard() {
  const container = document.getElementById('sust-keyboard');
  if (!container) return;
  container.innerHTML = '';

  ALPHABET.split('').forEach(ch => {
    const keyWrap = document.createElement('div');
    keyWrap.className = 'sust-key';

    const label = document.createElement('div');
    label.className = 'sust-key-label';
    label.textContent = ch;

    const input = document.createElement('input');
    input.type = 'text';
    input.maxLength = 1;
    input.className = 'sust-key-input';
    input.dataset.char = ch;
    input.autocomplete = 'off';
    input.spellcheck = false;

    input.addEventListener('input', e => {
      const val = e.target.value.toUpperCase().replace(/[^A-Z]/g, '');
      e.target.value = val;

      if (val) {
        state.tablaSustitucion[ch] = val;
        e.target.classList.add('filled');
      } else {
        delete state.tablaSustitucion[ch];
        e.target.classList.remove('filled');
      }

      renderTextoCifrado();
      renderTextoDescifrado();
    });

    keyWrap.appendChild(label);
    keyWrap.appendChild(input);
    container.appendChild(keyWrap);
  });

  const btnReset = document.getElementById('btn-reset-sust');
  if (btnReset) {
    btnReset.addEventListener('click', () => {
      state.tablaSustitucion = {};
      resetSustInputs();
      renderTextoCifrado();
      renderTextoDescifrado();
      showToast('Sustituciones limpiadas', 'info');
    });
  }

  const btnSugerir = document.getElementById('btn-sugerir');
  if (btnSugerir) {
    btnSugerir.addEventListener('click', () => {
      const sugerencias = FrequencyAnalyzer.suggestSubstitutions(state.textoCifrado);
      state.tablaSustitucion = { ...sugerencias };
      
      document.querySelectorAll('.sust-key-input').forEach(input => {
        const ch = input.dataset.char;
        if (state.tablaSustitucion[ch]) {
          input.value = state.tablaSustitucion[ch];
          input.classList.add('filled');
        } else {
          input.value = '';
          input.classList.remove('filled');
        }
      });

      renderTextoCifrado();
      renderTextoDescifrado();
      showToast('Sugerencia de frecuencias aplicada', 'success');
    });
  }
}

function focusSustKey(char) {
  const input = document.querySelector(`.sust-key-input[data-char="${char}"]`);
  if (input) {
    input.focus();
    input.select();
  }
}

function resetSustInputs() {
  document.querySelectorAll('.sust-key-input').forEach(input => {
    input.value = '';
    input.classList.remove('filled');
  });
}

// ─── Slider César ─────────────────────────────────────────────
function initCesarSlider() {
  const slider = document.getElementById('cesar-slider');
  const btnReset = document.getElementById('btn-reset-cesar');

  if (slider) {
    slider.addEventListener('input', e => {
      const shift = parseInt(e.target.value, 10);
      updateCesarValue(shift);
      applyCesarShift(shift);
    });
  }

  if (btnReset) {
    btnReset.addEventListener('click', () => {
      if (slider) slider.value = 0;
      updateCesarValue(0);
      applyCesarShift(0);
    });
  }
}

function updateCesarValue(shift) {
  const valEl = document.getElementById('cesar-val');
  const mapEl = document.getElementById('cesar-char-map');
  if (valEl) valEl.textContent = shift;
  if (mapEl) {
    const targetIdx = (0 - shift + 26) % 26;
    mapEl.textContent = ALPHABET[targetIdx];
  }
}

function applyCesarShift(shift) {
  // Descifrado César equivalente a sustitución
  ALPHABET.split('').forEach((ch, idx) => {
    if (shift === 0) {
      delete state.tablaSustitucion[ch];
    } else {
      const descIdx = ((idx - shift) + 26) % 26;
      state.tablaSustitucion[ch] = ALPHABET[descIdx];
    }
  });

  // Reflejar en teclado
  document.querySelectorAll('.sust-key-input').forEach(input => {
    const ch = input.dataset.char;
    if (state.tablaSustitucion[ch]) {
      input.value = state.tablaSustitucion[ch];
      input.classList.add('filled');
    } else {
      input.value = '';
      input.classList.remove('filled');
    }
  });

  const preview = Caesar.decrypt(state.textoCifrado, shift);
  const cesarPreviewEl = document.getElementById('cesar-preview');
  if (cesarPreviewEl) cesarPreviewEl.textContent = preview;

  renderTextoCifrado();
  renderTextoDescifrado();
}

// ─── Herramienta Vigenère ─────────────────────────────────────
function initVigenereHandler() {
  const btnAplicar = document.getElementById('btn-aplicar-vigenere');
  const inputKey = document.getElementById('vigenere-key-input');

  if (btnAplicar && inputKey) {
    btnAplicar.addEventListener('click', () => {
      const key = inputKey.value.trim().toUpperCase();
      if (!key) {
        showToast('Introduce una clave para descifrar con Vigenère', 'error');
        return;
      }
      const descifrado = Vigenere.decrypt(state.textoCifrado, key);
      const descContainer = document.getElementById('texto-descifrado');
      if (descContainer) descContainer.textContent = descifrado;
      showToast(`Clave "${key}" aplicada a la vista previa`, 'info');
    });
  }
}

// ─── Gráfico de Frecuencias (Chart.js) ─────────────────────────
function updateFrequencyChart() {
  const ctx = document.getElementById('freq-chart')?.getContext('2d');
  if (!ctx) return;

  const cipherFreqs = FrequencyAnalyzer.analyze(state.textoCifrado);
  const labels = ALPHABET.split('');
  
  const cipherData = labels.map(ch => {
    const found = cipherFreqs.find(f => f.char === ch);
    return found ? found.percent.toFixed(1) : 0;
  });

  const spanishData = labels.map(ch => FrequencyAnalyzer.SPANISH_FREQS[ch] || 0);

  if (state.frecChart) {
    state.frecChart.data.datasets[0].data = cipherData;
    state.frecChart.data.datasets[1].data = spanishData;
    state.frecChart.update();
    return;
  }

  state.frecChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels,
      datasets: [
        {
          label: 'Texto Cifrado (%)',
          data: cipherData,
          backgroundColor: 'rgba(0, 229, 255, 0.65)',
          borderColor: '#00e5ff',
          borderWidth: 1,
          borderRadius: 2
        },
        {
          label: 'Español Estándar (%)',
          data: spanishData,
          type: 'line',
          borderColor: '#00ff88',
          borderWidth: 2,
          pointRadius: 2,
          pointBackgroundColor: '#00ff88',
          tension: 0.2
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          labels: {
            color: '#a0aec0',
            font: { size: 10, family: 'Rajdhani' }
          }
        },
        tooltip: {
          callbacks: {
            label: (item) => `${item.dataset.label}: ${item.raw}%`
          }
        }
      },
      scales: {
        x: {
          ticks: { color: '#718096', font: { size: 9, family: 'JetBrains Mono' } },
          grid: { color: 'rgba(255,255,255,0.04)' }
        },
        y: {
          beginAtZero: true,
          ticks: { color: '#718096', font: { size: 9 } },
          grid: { color: 'rgba(255,255,255,0.04)' }
        }
      }
    }
  });
}

// ─── Gestión de Pistas ────────────────────────────────────────
function renderPistas() {
  const mision = MISIONES[state.misionIndex];
  const list = document.getElementById('pistas-list');
  const btnPista = document.getElementById('btn-pedir-pista');
  const hudCount = document.getElementById('hud-pistas-left');

  if (hudCount) hudCount.textContent = Math.max(0, mision.pistas.length - state.pistasUsadas);

  if (!list) return;
  list.innerHTML = '';

  if (state.pistasUsadas === 0) {
    list.innerHTML = '<div class="text-muted" style="font-size:0.8rem">Pulsa en "Pista" si necesitas ayuda (-100 pts).</div>';
    return;
  }

  for (let i = 0; i < state.pistasUsadas; i++) {
    const div = document.createElement('div');
    div.className = 'pista-item';
    div.innerHTML = `<span>💡</span><div><strong>Pista ${i + 1}:</strong> ${mision.pistas[i]}</div>`;
    list.appendChild(div);
  }

  if (btnPista) {
    btnPista.disabled = state.pistasUsadas >= mision.pistas.length;
  }
}

document.getElementById('btn-pedir-pista')?.addEventListener('click', () => {
  const mision = MISIONES[state.misionIndex];
  if (state.pistasUsadas < mision.pistas.length) {
    state.pistasUsadas++;
    renderPistas();
    showToast('Nueva pista desbloqueada (-100 pts)', 'info');
  } else {
    showToast('No quedan más pistas para esta misión', 'warning');
  }
});

// ─── Enviar y Validar Solución ────────────────────────────────
function initSubmitHandler() {
  const btnEnviar = document.getElementById('btn-enviar-solucion');
  const inputSolucion = document.getElementById('input-solucion');
  const btnCopiar = document.getElementById('btn-copiar-preview');

  if (btnCopiar && inputSolucion) {
    btnCopiar.addEventListener('click', () => {
      const previewText = document.getElementById('texto-descifrado')?.textContent || '';
      if (previewText && !previewText.startsWith('—')) {
        inputSolucion.value = previewText.trim();
        showToast('Vista previa copiada a la solución', 'info');
      } else {
        showToast('Primero ajusta el descifrado para generar la vista previa', 'warning');
      }
    });
  }

  if (btnEnviar && inputSolucion) {
    btnEnviar.addEventListener('click', () => {
      verificarSolucion();
    });

    inputSolucion.addEventListener('keydown', e => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        verificarSolucion();
      }
    });
  }
}

function verificarSolucion() {
  const input = document.getElementById('input-solucion');
  const feedback = document.getElementById('submit-feedback');
  if (!input) return;

  const respuesta = input.value.trim();
  if (!respuesta) {
    showToast('Por favor, escribe una solución antes de enviar', 'warning');
    return;
  }

  const esCorrecto = verifySolution(respuesta, state.textoOriginal);
  const now = new Date();
  const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;

  // Registrar en historial
  state.historialIntentos.unshift({
    texto: respuesta,
    correcto: esCorrecto,
    hora: timeStr
  });
  renderHistorial();

  if (esCorrecto) {
    stopTimer();
    const tiempoSegundos = Math.floor((Date.now() - state.tiempoInicio) / 1000);
    
    // Cálculo de puntuación
    const basePuntos = 1000;
    const tiempoPenalizacion = Math.min(400, tiempoSegundos * 2);
    const pistasPenalizacion = state.pistasUsadas * 100;
    const puntosRonda = Math.max(200, basePuntos - tiempoPenalizacion - pistasPenalizacion);

    state.puntuacionTotal += puntosRonda;
    document.getElementById('hud-puntos').textContent = state.puntuacionTotal;
    state.misionesCompletadas.add(state.misionIndex);
    renderMisionesNav();

    // Mostrar feedback
    if (feedback) {
      feedback.textContent = '¡RESPUESTA CORRECTA!';
      feedback.className = 'submit-feedback success';
    }

    // Modal de victoria
    mostrarModalVictoria(puntosRonda, tiempoSegundos);
  } else {
    if (feedback) {
      feedback.textContent = 'Solución incorrecta. Revisa el texto y vuelve a intentarlo.';
      feedback.className = 'submit-feedback error';
    }
    showToast('Código incorrecto, revisa las sustituciones', 'error');
  }
}

function renderHistorial() {
  const list = document.getElementById('historial-list');
  if (!list) return;
  list.innerHTML = '';

  if (state.historialIntentos.length === 0) {
    list.innerHTML = '<div class="text-muted" style="font-size:0.78rem; text-align:center">Sin intentos todavía</div>';
    return;
  }

  state.historialIntentos.forEach(item => {
    const div = document.createElement('div');
    div.className = `historial-item ${item.correcto ? 'correcto' : 'incorrecto'}`;
    div.innerHTML = `
      <span class="hist-icon">${item.correcto ? '✅' : '❌'}</span>
      <span class="hist-text">${item.texto}</span>
      <span class="hist-time">${item.hora}</span>
    `;
    list.appendChild(div);
  });
}

// ─── Modales y Flujo ──────────────────────────────────────────
function mostrarModalVictoria(puntos, segundos) {
  const modal = document.getElementById('modal-victoria');
  const solText = document.getElementById('modal-solucion');
  const ptsText = document.getElementById('modal-puntos-ronda');
  const timeText = document.getElementById('modal-tiempo-ronda');
  const btnSig = document.getElementById('btn-siguiente-mision');

  if (solText) solText.textContent = state.textoOriginal;
  if (ptsText) ptsText.textContent = `+${puntos} PTS`;
  
  const min = String(Math.floor(segundos / 60)).padStart(2, '0');
  const sec = String(segundos % 60).padStart(2, '0');
  if (timeText) timeText.textContent = `${min}:${sec}`;

  if (modal) modal.classList.remove('hidden');

  if (btnSig) {
    btnSig.onclick = () => {
      if (modal) modal.classList.add('hidden');
      if (state.misionIndex + 1 < MISIONES.length) {
        cargarMision(state.misionIndex + 1);
      } else {
        finalizarEntrenamientoCompleto();
      }
    };
  }
}

async function finalizarEntrenamientoCompleto() {
  const modalFinal = document.getElementById('modal-resumen-final');
  const totalPtsEl = document.getElementById('final-total-pts');
  if (totalPtsEl) totalPtsEl.textContent = `${state.puntuacionTotal} PTS`;
  if (modalFinal) modalFinal.classList.remove('hidden');

  // Guardar partida en Firebase
  if (state.user) {
    try {
      await saveGameResult(
        'rompecodigos',
        state.user.uid,
        currentProfile?.classId || null,
        state.puntuacionTotal,
        {
          mode: 'practice',
          misionesTotal: MISIONES.length,
          misionesSuperadas: state.misionesCompletadas.size,
          timestamp: new Date().toISOString()
        }
      );
      showToast('Puntuación guardada en tu perfil', 'success');
    } catch (err) {
      console.warn('Error al guardar resultado de práctica:', err);
    }
  }
}

// ─── Temporizador ─────────────────────────────────────────────
function startTimer() {
  stopTimer();
  state.tiempoInicio = Date.now();
  const timerEl = document.getElementById('hud-timer');

  state.timerInterval = setInterval(() => {
    const elapsed = Math.floor((Date.now() - state.tiempoInicio) / 1000);
    const min = String(Math.floor(elapsed / 60)).padStart(2, '0');
    const sec = String(elapsed % 60).padStart(2, '0');
    if (timerEl) timerEl.textContent = `${min}:${sec}`;
  }, 1000);
}

function stopTimer() {
  if (state.timerInterval) {
    clearInterval(state.timerInterval);
    state.timerInterval = null;
  }
}
