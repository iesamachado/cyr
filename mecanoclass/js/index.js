// ============================================================
// index.js — Portal de Modos de Juego MecanoClass
// ============================================================

import { requireAuth, isAdmin } from '../../js/common/auth.js';
import { renderHeader, showToast } from '../../js/common/ui.js';
import { $, getUrlParams } from '../../js/common/utils.js';

document.addEventListener('DOMContentLoaded', () => {
    requireAuth({
        allowedRoles: ['teacher', 'student', 'admin'],
        onAuthorized: (user, profile) => {
            renderHeader(user, profile);
            setupUI(user, profile);
        }
    });
});

function setupUI(user, profile) {
    const isTeacherOrAdmin = profile.role === 'teacher' || profile.role === 'admin' || isAdmin(user, profile);

    // Reenviar classId al modo entrenamiento si existe
    const params = getUrlParams();
    const classId = params.classId;
    if (classId) {
        const btnPractice = $('btn-practice-mode');
        if (btnPractice) {
            btnPractice.href = `practice.html?classId=${classId}`;
        }
    }

    // Mostrar panel docente
    if (isTeacherOrAdmin) {
        const teacherSection = $('teacher-section');
        if (teacherSection) teacherSection.style.display = 'flex';

        const btnCrear = $('btn-crear-carrera');
        if (btnCrear) {
            btnCrear.addEventListener('click', () => {
                window.location.href = 'live_host.html';
            });
        }
    }

    // Formulario unirse a carrera alumno
    const formUnirse = $('form-unirse-carrera');
    if (formUnirse) {
        formUnirse.addEventListener('submit', (e) => {
            e.preventDefault();
            const pinInput = $('input-pin-carrera');
            const pin = pinInput ? pinInput.value.trim().toUpperCase() : '';

            if (pin.length > 0) {
                window.location.href = `live_player.html?pin=${encodeURIComponent(pin)}`;
            } else {
                showToast('Por favor, introduce el PIN de la carrera.', 'warning');
            }
        });
    }
}
