// ═══════════════════════════════════════════════════════════════════════
//  CLASSHUB — index.js (Página de login)
// ═══════════════════════════════════════════════════════════════════════

import {
  loginWithGoogle, loginAsTeacher,
  loginWithEmail, registerWithEmail,
  resetPassword, setupAuthListener
} from './js/common/auth.js';
import { initParticles } from './js/common/ui.js';
import { $ } from './js/common/utils.js';

// Inicializar partículas de fondo
initParticles('particles-canvas');

// ── Si ya hay sesión activa, redirigir ─────────────────────────
setupAuthListener((user, profile) => {
  if (!user || !profile) return; // No autenticado, mostrar login

  // Verificar si hay una URL guardada para redirigir (ej: venía de un juego)
  const redirect = sessionStorage.getItem('classhub_redirect');
  sessionStorage.removeItem('classhub_redirect');

  if (redirect && !redirect.includes('index.html')) {
    window.location.href = redirect;
    return;
  }

  // Redirigir al dashboard según rol
  if (profile.role === 'teacher') {
    window.location.href = './dashboard_teacher.html';
  } else {
    window.location.href = './dashboard_student.html';
  }
});

// ── Botón DOCENTE (Google + Classroom) ─────────────────────────
$('btn-teacher-google')?.addEventListener('click', async () => {
  try {
    setLoading(true);
    await loginAsTeacher();
    // El listener de arriba hará el redirect
  } catch (err) {
    showError(`Error al iniciar como docente: ${err.message}`);
    setLoading(false);
  }
});

// ── Botón ALUMNO (Google) ───────────────────────────────────────
$('btn-student-google')?.addEventListener('click', async () => {
  try {
    setLoading(true);
    await loginWithGoogle();
    // El listener de arriba hará el redirect
  } catch (err) {
    showError(`Error al iniciar sesión: ${err.message}`);
    setLoading(false);
  }
});

// ── Formulario EMAIL/CONTRASEÑA ─────────────────────────────────
$('form-email-login')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const email = $('email-input').value.trim();
  const pass  = $('pass-input').value;
  if (!email || !pass) return showError('Completa todos los campos.');

  try {
    setLoading(true);
    $('login-error').textContent = '';
    await loginWithEmail(email, pass);
    // El listener hará el redirect
  } catch (err) {
    let msg = 'Error al iniciar sesión.';
    if (err.code === 'auth/user-not-found')  msg = 'No existe ninguna cuenta con ese correo.';
    if (err.code === 'auth/wrong-password')  msg = 'Contraseña incorrecta.';
    if (err.code === 'auth/invalid-email')   msg = 'El formato del correo no es válido.';
    if (err.code === 'auth/too-many-requests') msg = 'Demasiados intentos. Espera un momento.';
    showError(msg);
    setLoading(false);
  }
});

// ── Mostrar/ocultar contraseña ──────────────────────────────────
$('btn-toggle-pass')?.addEventListener('click', () => {
  const input = $('pass-input');
  const isPass = input.type === 'password';
  input.type = isPass ? 'text' : 'password';
  $('btn-toggle-pass').textContent = isPass ? '🙈' : '👁';
});

// ── Cambiar a panel de registro ─────────────────────────────────
$('btn-show-register')?.addEventListener('click', () => {
  $('panel-role-select').classList.add('login-card--hidden');
  $('panel-register').classList.remove('login-card--hidden');
});

$('btn-back-login')?.addEventListener('click', () => {
  $('panel-register').classList.add('login-card--hidden');
  $('panel-role-select').classList.remove('login-card--hidden');
});

// ── Formulario REGISTRO ─────────────────────────────────────────
$('form-register')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const name  = $('reg-name').value.trim();
  const email = $('reg-email').value.trim();
  const pass  = $('reg-pass').value;
  const role  = $('reg-role').value;

  if (!name || !email || !pass) return showRegError('Completa todos los campos.');
  if (pass.length < 6) return showRegError('La contraseña debe tener al menos 6 caracteres.');

  try {
    setLoading(true);
    $('register-error').textContent = '';
    await registerWithEmail(email, pass, name, role);
    // El listener hará el redirect
  } catch (err) {
    let msg = 'Error al crear la cuenta.';
    if (err.code === 'auth/email-already-in-use') msg = 'Ya existe una cuenta con ese correo.';
    if (err.code === 'auth/weak-password') msg = 'La contraseña es demasiado débil.';
    if (err.code === 'auth/invalid-email')  msg = 'El formato del correo no es válido.';
    showRegError(msg);
    setLoading(false);
  }
});

// ── Recuperar contraseña ─────────────────────────────────────────
$('btn-forgot')?.addEventListener('click', async () => {
  const email = $('email-input').value.trim();
  if (!email) {
    showError('Introduce tu correo primero.');
    return;
  }
  try {
    await resetPassword(email);
    showError('✅ Correo de recuperación enviado. Revisa tu bandeja.', false);
  } catch {
    showError('No se pudo enviar el correo. Verifica el email.');
  }
});

// ── Helpers ─────────────────────────────────────────────────────
function showError(msg, isError = true) {
  const el = $('login-error');
  if (!el) return;
  el.textContent = msg;
  el.style.color = isError ? 'var(--error)' : 'var(--success)';
}

function showRegError(msg) {
  const el = $('register-error');
  if (el) el.textContent = msg;
}

function setLoading(active) {
  const btns = document.querySelectorAll('button, input[type="submit"]');
  btns.forEach(b => { b.disabled = active; });
  if (!active) btns.forEach(b => { b.disabled = false; });
}
