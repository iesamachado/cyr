import { requireAuth, currentUser, currentProfile } from '../../js/common/auth.js';
import { renderHeader, showToast } from '../../js/common/ui.js';
import { $ } from '../../js/common/utils.js';

document.addEventListener('DOMContentLoaded', () => {
    requireAuth({
        allowedRoles: ['teacher', 'student'],
        onAuthorized: (user, profile) => {
            renderHeader('app-header', profile);
            setupUI(profile);
        }
    });
});

function setupUI(profile) {
    if (profile.role === 'teacher') {
        const teacherSection = $('#teacher-section');
        if (teacherSection) teacherSection.style.display = 'block';
        
        const btnCrear = $('#btn-crear-sala');
        if (btnCrear) {
            btnCrear.addEventListener('click', () => {
                window.location.href = 'sala_profesor.html';
            });
        }
    }
    
    const formUnirse = $('#form-unirse');
    if (formUnirse) {
        formUnirse.addEventListener('submit', (e) => {
            e.preventDefault();
            const code = $('#input-codigo').value.trim().toUpperCase();
            if (code.length > 0) {
                window.location.href = `sala_alumno.html?code=${code}`;
            } else {
                showToast('Por favor, introduce un código de sala.', 'error');
            }
        });
    }
}
