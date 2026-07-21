import { requireGameAccess } from '../../js/common/auth.js';

requireGameAccess('mecanoclass', {
  onGranted: (user, profile, classId) => {
    // Redirect to practice page with classId
    window.location.href = `practice.html${classId ? '?classId=' + classId : ''}`;
  }
});
