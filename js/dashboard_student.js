// ═══════════════════════════════════════════════════════════════════════
//  CLASSHUB — dashboard_student.js
// ═══════════════════════════════════════════════════════════════════════

import { requireAuth, currentUser, currentProfile } from './common/auth.js';
import { getStudentClasses, joinClassByPin, getStudentResults } from './common/db.js';
import { renderHeader, showToast, showLoading, hideLoading } from './common/ui.js';
import { GAMES, $, escapeHtml, formatDate, getUrlParams } from './common/utils.js';

let myClasses = [];

// ── Guard ───────────────────────────────────────────────────────
requireAuth({
  allowedRoles: ['student', 'teacher'],
  onAuthorized: async (user, profile) => {
    renderHeader(user, profile);
    const name = profile.displayNameAnonymized || profile.displayName || 'Alumno';
    $('student-welcome').textContent = `¡Hola, ${name.split(' ')[0]}! 👋`;

    checkNoAccessAlert();
    await loadClasses(user);
    await loadHistory(user);
    setupModals(user);
  }
});

// ── Mostrar aviso si venía sin acceso a un juego ────────────────
function checkNoAccessAlert() {
  const { noAccess } = getUrlParams();
  if (!noAccess) return;
  const game = GAMES[noAccess];
  const alertEl = $('no-access-alert');
  const msgEl   = $('no-access-msg');
  if (alertEl && msgEl && game) {
    msgEl.innerHTML = `No tienes acceso a <strong>${escapeHtml(game.name)}</strong> ${game.icon}. 
      Tu docente aún no ha habilitado ese juego en ninguna de tus clases.`;
    alertEl.style.display = 'flex';
  }
}

// ── Cargar clases del alumno ────────────────────────────────────
async function loadClasses(user) {
  try {
    myClasses = await getStudentClasses(user.uid);
    renderStudentClasses(myClasses);
    updateStats(myClasses);
  } catch (err) {
    console.error('Error cargando clases:', err);
    showToast('Error', 'No se pudieron cargar tus clases.', 'error');
  }
}

function renderStudentClasses(classes) {
  const list    = $('student-classes-list');
  const noMsg   = $('no-classes-msg');
  if (!list) return;

  if (classes.length === 0) {
    list.innerHTML = '';
    noMsg.style.display = 'block';
    return;
  }
  noMsg.style.display = 'none';

  list.innerHTML = classes.map(cls => renderStudentClassCard(cls)).join('');
}

function renderStudentClassCard(cls) {
  const enabledGames = cls.enabledGames || [];

  if (enabledGames.length === 0) {
    return `
      <div class="class-card">
        <div class="class-card-header">
          <h3 class="class-card-name">${escapeHtml(cls.name)}</h3>
        </div>
        <p class="empty-state" style="padding:var(--space-4) 0; font-size:var(--text-sm)">
          Ningún juego habilitado en esta clase todavía.
        </p>
      </div>`;
  }

  const gameCards = enabledGames.map(gid => {
    const g = GAMES[gid];
    if (!g) return '';
    return `
      <a class="game-card" href="${g.gamePath}?classId=${cls.id}"
         style="--game-color:${g.color}; --game-color-dark:${g.colorDark}">
        <div class="game-card-icon">${g.icon}</div>
        <div class="game-card-name">${escapeHtml(g.name)}</div>
        <div class="game-card-desc">${escapeHtml(g.description)}</div>
      </a>`;
  }).join('');

  return `
    <div class="class-card">
      <div class="class-card-header">
        <h3 class="class-card-name">${escapeHtml(cls.name)}</h3>
        <span class="badge badge--accent">🎮 ${enabledGames.length} juego${enabledGames.length !== 1 ? 's' : ''}</span>
      </div>
      <div class="games-grid student-games-grid">${gameCards}</div>
    </div>`;
}

// ── Stats ───────────────────────────────────────────────────────
function updateStats(classes) {
  const totalGames = new Set(classes.flatMap(c => c.enabledGames || [])).size;
  $('stat-my-classes').textContent     = classes.length;
  $('stat-available-games').textContent = totalGames;
}

// ── Historial de partidas ────────────────────────────────────────
async function loadHistory(user) {
  try {
    const results = await getStudentResults(user.uid, 20);
    const tbody   = $('history-tbody');
    const table   = $('history-table');
    const empty   = $('history-empty');

    if (!tbody) return;

    if (results.length === 0) {
      table.style.display = 'none';
      empty.style.display = 'block';
      return;
    }

    // Mejor puntuación global
    const best = Math.max(...results.map(r => r.score || 0));
    $('stat-total-score').textContent = best;

    table.style.display = 'table';
    empty.style.display = 'none';
    tbody.innerHTML = results.map(r => {
      const g = GAMES[r.gameId] || { icon: '🎮', name: r.gameId };
      const cls = myClasses.find(c => c.id === r.classId);
      return `<tr>
        <td>${g.icon} ${escapeHtml(g.name)}</td>
        <td class="ranking-score">${r.score}</td>
        <td>${cls ? escapeHtml(cls.name) : '—'}</td>
        <td style="color:var(--text-muted); font-size:var(--text-xs)">${formatDate(r.timestamp)}</td>
      </tr>`;
    }).join('');
  } catch (err) {
    console.error('Error cargando historial:', err);
  }
}

// ── Modal: Unirse a clase ────────────────────────────────────────
function setupModals(user) {
  const modal     = $('modal-join-class');
  const btnOpen   = $('btn-join-class');
  const btnClose  = $('close-join-modal');
  const btnCancel = $('cancel-join');
  const form      = $('form-join-class');
  const pinInput  = $('pin-input');

  const openModal  = () => { pinInput.value = ''; $('join-error').textContent = ''; modal.setAttribute('aria-hidden', 'false'); pinInput.focus(); };
  const closeModal = () => modal.setAttribute('aria-hidden', 'true');

  btnOpen?.addEventListener('click', openModal);
  btnClose?.addEventListener('click', closeModal);
  btnCancel?.addEventListener('click', closeModal);
  modal?.addEventListener('click', e => { if (e.target === modal) closeModal(); });

  // Solo permitir dígitos en el PIN
  pinInput?.addEventListener('input', () => {
    pinInput.value = pinInput.value.replace(/\D/g, '').slice(0, 6);
  });

  form?.addEventListener('submit', async e => {
    e.preventDefault();
    const pin = pinInput.value.trim();
    if (pin.length !== 6) {
      $('join-error').textContent = 'El PIN debe tener exactamente 6 dígitos.';
      return;
    }
    try {
      showLoading('Uniéndote a la clase...');
      const cls = await joinClassByPin(user.uid, pin);
      closeModal();
      showToast('¡Te has unido!', `Ahora formas parte de "${cls.name}".`, 'success');
      myClasses = await getStudentClasses(user.uid);
      renderStudentClasses(myClasses);
      updateStats(myClasses);
    } catch (err) {
      $('join-error').textContent = err.message;
    } finally {
      hideLoading();
    }
  });
}
