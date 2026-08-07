// ═══════════════════════════════════════════════════════════════════════
//  CLASSHUB — class_detail.js (Gestión de clase - Docente)
// ═══════════════════════════════════════════════════════════════════════

import { requireAuth, currentUser, currentProfile, classroomToken, refreshClassroomToken } from './common/auth.js';
import {
  getClass, updateClass, getClassMembers, getClassAssignments,
  toggleGameInClass, createAssignment, deleteAssignment,
  getClassRanking
} from './common/db.js';
import { createClassroomAssignment, syncClassroomGrades } from './common/classroom.js';
import { renderHeader, showToast, showLoading, hideLoading, renderPodium, renderRankingTable } from './common/ui.js';
import { GAMES, $, $$, escapeHtml, formatDate, getUrlParams, copyToClipboard } from './common/utils.js';

let classData = null;
let members   = [];
let activeTab = 'games';
let activeGameFilter = '';

// ── Guard ───────────────────────────────────────────────────────
requireAuth({
  allowedRoles: ['teacher'],
  onAuthorized: async (user, profile) => {
    renderHeader(user, profile);
    const { classId } = getUrlParams();
    if (!classId) { window.location.href = 'dashboard_teacher.html'; return; }

    try {
      classData = await getClass(classId);
      if (!classData || classData.teacherId !== user.uid) {
        showToast('Acceso denegado', 'No tienes acceso a esta clase.', 'error');
        setTimeout(() => window.location.href = 'dashboard_teacher.html', 2000);
        return;
      }

      initPage(user, profile);
      await loadGamesTab();
    } catch (err) {
      console.error(err);
      showToast('Error', 'No se pudo cargar la clase.', 'error');
    }
  }
});

// ── Inicialización ──────────────────────────────────────────────
function initPage(user, profile) {
  // Cabecera
  $('class-name').textContent = classData.name;
  const pinBtn = $('class-pin');
  if (pinBtn) {
    pinBtn.textContent = `📋 ${classData.pin}`;
    pinBtn.addEventListener('click', async () => {
      await copyToClipboard(classData.pin);
      showToast('PIN copiado', classData.pin, 'success', 2000);
    });
  }
  if (classData.classroomCourseId) {
    $('classroom-link-meta')?.style && ($('classroom-link-meta').style.display = 'flex');
  }

  // Tabs
  $$('.tab-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      $$('.tab-btn').forEach(b => b.classList.remove('tab-btn--active'));
      btn.classList.add('tab-btn--active');
      $$('.tab-content').forEach(s => s.style.display = 'none');
      const tab = btn.dataset.tab;
      $(`tab-${tab}`).style.display = 'block';
      activeTab = tab;

      if (tab === 'students')    await loadStudentsTab();
      if (tab === 'assignments') await loadAssignmentsTab();
      if (tab === 'results')     await loadResultsTab();
    });
  });

  setupModals(user);
}

// ══════════════════════════════════════════════════════════════
//  TAB: JUEGOS
// ══════════════════════════════════════════════════════════════

async function loadGamesTab() {
  const list = $('games-toggle-list');
  if (!list) return;

  const enabled = classData.enabledGames || [];

  list.innerHTML = Object.values(GAMES).map(g => `
    <div class="game-toggle-row" id="game-row-${g.id}">
      <div class="game-toggle-info">
        <span class="game-toggle-icon">${g.icon}</span>
        <div>
          <strong>${escapeHtml(g.name)}</strong>
          <small>${escapeHtml(g.description)}</small>
        </div>
      </div>
      <div class="game-toggle-actions">
        <a class="btn btn-ghost btn--sm" href="${g.gamePath}" target="_blank">🎮 Probar</a>
        <label class="toggle-switch" title="${enabled.includes(g.id) ? 'Desactivar' : 'Activar'}">
          <input type="checkbox" 
                 id="toggle-${g.id}"
                 data-game-id="${g.id}"
                 ${enabled.includes(g.id) ? 'checked' : ''}>
          <span class="toggle-slider"></span>
        </label>
      </div>
    </div>`).join('');

  // Eventos toggle
  $$('[data-game-id]').forEach(input => {
    input.addEventListener('change', async () => {
      const gameId = input.dataset.gameId;
      const active = input.checked;
      try {
        await toggleGameInClass(classData.id, gameId, active);
        if (active) {
          classData.enabledGames = [...(classData.enabledGames || []), gameId];
        } else {
          classData.enabledGames = (classData.enabledGames || []).filter(g => g !== gameId);
        }
        showToast(
          active ? `${GAMES[gameId].icon} ${GAMES[gameId].name} activado` : `${GAMES[gameId].name} desactivado`,
          '',
          active ? 'success' : 'info',
          2000
        );
      } catch (err) {
        input.checked = !active; // Revertir
        showToast('Error', err.message, 'error');
      }
    });
  });
}

// ══════════════════════════════════════════════════════════════
//  TAB: ALUMNOS
// ══════════════════════════════════════════════════════════════

async function loadStudentsTab() {
  const list = $('students-list');
  const noMsg = $('no-students');
  if (!list) return;

  try {
    members = await getClassMembers(classData.id);

    if (members.length === 0) {
      list.innerHTML = '';
      noMsg.style.display = 'block';
      return;
    }

    noMsg.style.display = 'none';
    list.innerHTML = `
      <div class="students-list-header">
        <span>${members.length} alumno${members.length !== 1 ? 's' : ''}</span>
      </div>
      <div class="students-list-body">
        ${members.map(m => renderStudentRow(m)).join('')}
      </div>`;
  } catch (err) {
    showToast('Error', err.message, 'error');
  }
}

function renderStudentRow(m) {
  if (m.pending) {
    return `<div class="student-row student-row--pending">
      <div class="student-row-avatar student-row-avatar--pending">⏳</div>
      <div class="student-row-info">
        <strong>${escapeHtml(m.name || m.email)}</strong>
        <small>${escapeHtml(m.email)} — <em>Pendiente de registro</em></small>
      </div>
      <span class="badge badge--warning">Pendiente</span>
    </div>`;
  }
  return `<div class="student-row">
    <img class="student-row-avatar"
         src="${escapeHtml(m.photoURL || `https://api.dicebear.com/7.x/bottts/svg?seed=${m.uid}`)}"
         alt="${escapeHtml(m.displayNameAnonymized || m.displayName || 'Alumno')}"
         onerror="this.src='https://api.dicebear.com/7.x/bottts/svg?seed=${m.uid}'">
    <div class="student-row-info">
      <strong>${escapeHtml(m.displayNameAnonymized || m.displayName || 'Alumno')}</strong>
      <small>${escapeHtml(m.email || '')}</small>
    </div>
    <span class="badge ${m.source === 'classroom' ? 'badge--accent' : 'badge--muted'}">
      ${m.source === 'classroom' ? 'Classroom' : 'PIN'}
    </span>
  </div>`;
}

// ══════════════════════════════════════════════════════════════
//  TAB: TAREAS
// ══════════════════════════════════════════════════════════════

async function loadAssignmentsTab() {
  const list = $('assignments-list');
  if (!list) return;

  try {
    const assignments = await getClassAssignments(classData.id);
    const noMsg = $('no-assignments');

    if (assignments.length === 0) {
      noMsg && (noMsg.style.display = 'block');
      return;
    }
    noMsg && (noMsg.style.display = 'none');

    list.innerHTML = assignments.map(a => {
      const g = GAMES[a.gameId] || { icon: '🎮', name: a.gameId };
      return `<div class="assignment-row">
        <div class="assignment-info">
          <span class="assignment-game-icon">${g.icon}</span>
          <div>
            <strong>${escapeHtml(a.title)}</strong>
            <small>${escapeHtml(g.name)} · Objetivo: ${a.targetScore} pts${a.dueDate ? ` · ${formatDate({ toDate: () => new Date(a.dueDate) })}` : ''}</small>
          </div>
        </div>
        <div class="assignment-actions">
          ${a.classroomCourseWorkId ? `
            <button class="btn btn-ghost btn--sm" data-assignment-id="${a.id}"
                    data-game-id="${a.gameId}" data-target="${a.targetScore}"
                    data-coursework="${a.classroomCourseWorkId}" onclick="window._syncGrade(this)">
              📤 Sincronizar notas
            </button>` : ''}
          <span class="badge ${a.classroomCourseWorkId ? 'badge--accent' : 'badge--muted'}">
            ${a.classroomCourseWorkId ? '🔗 Classroom' : 'Solo ClassHub'}
          </span>
        </div>
      </div>`;
    }).join('');

    // Handler de sincronizar
    window._syncGrade = async (btn) => {
      const { assignmentId, gameId, target, coursework } = btn.dataset;
      if (!classroomToken) {
        showToast('Token expirado', 'Vuelve a iniciar sesión como docente para sincronizar.', 'warning');
        return;
      }
      try {
        showLoading('Sincronizando notas...');
        const count = await syncClassroomGrades(
          classroomToken,
          classData.classroomCourseId,
          classData.id,
          coursework,
          { targetScore: parseInt(target), gameId }
        );
        showToast('Notas sincronizadas', `${count} alumno${count !== 1 ? 's' : ''} actualizado${count !== 1 ? 's' : ''} en Classroom.`, 'success');
      } catch (err) {
        showToast('Error', err.message, 'error');
      } finally {
        hideLoading();
      }
    };
  } catch (err) {
    showToast('Error', err.message, 'error');
  }
}

// ══════════════════════════════════════════════════════════════
//  TAB: RESULTADOS
// ══════════════════════════════════════════════════════════════

async function loadResultsTab() {
  // Filter pills
  const pillsContainer = $('game-filter-pills');
  if (pillsContainer && pillsContainer.children.length === 1) {
    Object.values(GAMES).forEach(g => {
      const btn = document.createElement('button');
      btn.className = 'filter-pill';
      btn.dataset.game = g.id;
      btn.textContent = `${g.icon} ${g.name}`;
      btn.addEventListener('click', () => setGameFilter(g.id));
      pillsContainer.appendChild(btn);
    });
    pillsContainer.querySelector('[data-game=""]')?.addEventListener('click', () => setGameFilter(''));
  }

  await renderResults();
}

async function setGameFilter(gameId) {
  activeGameFilter = gameId;
  $$('.filter-pill').forEach(p => {
    p.classList.toggle('filter-pill--active', p.dataset.game === gameId);
  });
  await renderResults();
}

async function renderResults() {
  try {
    showLoading('Cargando resultados...');
    const ranking = await getClassRanking(classData.id, activeGameFilter || null);

    // Enriquecer con perfiles
    const enriched = await Promise.all(ranking.map(async r => {
      const member = members.find(m => m.uid === r.studentId);
      return {
        ...r,
        displayNameAnonymized: member?.displayNameAnonymized || member?.displayName || 'Alumno',
        photoURL: member?.photoURL || `https://api.dicebear.com/7.x/bottts/svg?seed=${r.studentId}`
      };
    }));

    renderPodium(enriched, 'results-podium');
    renderRankingTable(enriched, 'results-ranking');
  } catch (err) {
    showToast('Error', err.message, 'error');
  } finally {
    hideLoading();
  }
}

// ══════════════════════════════════════════════════════════════
//  MODALES
// ══════════════════════════════════════════════════════════════

function setupModals(user) {

  // Modal nueva tarea
  const modalAssignment = $('modal-new-assignment');
  const formAssignment  = $('form-new-assignment');
  const btnNew          = $('btn-new-assignment');
  const closeBtn        = $('close-new-assignment');
  const cancelBtn       = $('cancel-new-assignment');

  // Rellenar select de juegos
  const gameSelect = $('assignment-game');
  if (gameSelect) {
    Object.values(GAMES).forEach(g => {
      const opt = document.createElement('option');
      opt.value = g.id;
      opt.textContent = `${g.icon} ${g.name}`;
      gameSelect.appendChild(opt);
    });
  }

  // Mostrar nota si no hay Classroom vinculado
  if (!classData.classroomCourseId) {
    $('assignment-classroom-note').style.display = 'block';
  }

  const openModal  = () => { formAssignment?.reset(); $('assignment-error').textContent = ''; modalAssignment.setAttribute('aria-hidden', 'false'); };
  const closeModal = () => modalAssignment.setAttribute('aria-hidden', 'true');

  btnNew?.addEventListener('click', openModal);
  closeBtn?.addEventListener('click', closeModal);
  cancelBtn?.addEventListener('click', closeModal);
  modalAssignment?.addEventListener('click', e => { if (e.target === modalAssignment) closeModal(); });

  formAssignment?.addEventListener('submit', async e => {
    e.preventDefault();
    const gameId = $('assignment-game').value;
    const title  = $('assignment-title').value.trim();
    const target = parseInt($('assignment-target').value);
    const due    = $('assignment-due').value;

    if (!gameId || !title || !target) {
      $('assignment-error').textContent = 'Completa todos los campos obligatorios.';
      return;
    }

    try {
      showLoading('Creando tarea...');
      $('assignment-error').textContent = '';

      let classroomCourseWorkId = null;

      // Si tiene Classroom y hay token, publicar la tarea
      if (classData.classroomCourseId && classroomToken) {
        const settings = await import('./common/db.js').then(m => m.getSiteSettings());
        const result = await createClassroomAssignment(classroomToken, classData.classroomCourseId, classData.id, {
          gameId, title, targetScore: target,
          dueDate: due || null,
          siteUrl: settings.siteUrl
        });
        classroomCourseWorkId = result.id;
        showToast('Tarea publicada en Classroom', title, 'success');
      } else {
        // Solo guardar en Firestore
        await createAssignment(classData.id, {
          gameId, title, targetScore: target,
          dueDate: due || null,
          classroomCourseId: classData.classroomCourseId || null
        });
        showToast('Tarea creada', 'Guardada en ClassHub (sin Classroom).', 'success');
      }

      closeModal();
      await loadAssignmentsTab();
    } catch (err) {
      $('assignment-error').textContent = err.message;
    } finally {
      hideLoading();
    }
  });

  // Sincronizar alumnos desde Classroom
  $('btn-sync-students')?.addEventListener('click', async () => {
    if (!classData.classroomCourseId) {
      showToast('Sin Classroom', 'Esta clase no está vinculada a un curso de Classroom.', 'warning');
      return;
    }
    let token = classroomToken;
    if (!token) {
      try { token = await refreshClassroomToken(); } catch { return; }
    }
    try {
      showLoading('Sincronizando alumnos...');
      const { importClassroomStudents } = await import('./common/classroom.js');
      const { matched, pending } = await importClassroomStudents(token, classData.classroomCourseId, classData.id);
      showToast('Alumnos sincronizados', `${matched} vinculados, ${pending} pendientes de registro.`, 'success');
      await loadStudentsTab();
    } catch (err) {
      showToast('Error', err.message, 'error');
    } finally {
      hideLoading();
    }
  });
}
