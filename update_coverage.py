import re

new_show_coverage = """
function showCoverage() {
  const container = $('cobertura-body');
  container.innerHTML = '';
  
  let totalPreguntas = preguntas.length;

  // 1. STATS POR BLOQUES
  const stats = {};
  Object.keys(TOPICS).forEach(key => {
    stats[key] = { total: 0, baja: 0, media: 0, alta: 0 };
  });
  
  preguntas.forEach(p => {
    if (!stats[p.block]) stats[p.block] = { total: 0, baja: 0, media: 0, alta: 0 };
    stats[p.block].total++;
    stats[p.block][p.dificultad || 'media']++;
  });
  
  const blocksTitle = document.createElement('h3');
  blocksTitle.innerHTML = '📊 Resumen por Bloques Temáticos';
  blocksTitle.style.marginBottom = 'var(--space-3)';
  container.appendChild(blocksTitle);

  Object.keys(TOPICS).forEach(key => {
    const s = stats[key];
    const name = TOPICS[key].name;
    const percent = totalPreguntas > 0 ? Math.round((s.total / totalPreguntas) * 100) : 0;
    
    const card = document.createElement('div');
    card.className = 'coverage-card';
    card.innerHTML = `
      <div class="coverage-header">
        <div>${escapeHtml(name)}</div>
        <div><span class="badge badge--primary">${s.total} preguntas (${percent}%)</span></div>
      </div>
      <div class="coverage-body">
        <ul class="coverage-list" style="display: flex; gap: 15px; border: none; padding-bottom: 0;">
          <li style="border:none; padding:0; flex:1; text-align:center; display:block;">
            <div class="text-muted" style="font-size:0.8rem;">Baja</div>
            <div class="badge badge--success">${s.baja}</div>
          </li>
          <li style="border:none; padding:0; flex:1; text-align:center; display:block;">
            <div class="text-muted" style="font-size:0.8rem;">Media</div>
            <div class="badge badge--warning">${s.media}</div>
          </li>
          <li style="border:none; padding:0; flex:1; text-align:center; display:block;">
            <div class="text-muted" style="font-size:0.8rem;">Alta</div>
            <div class="badge badge--error">${s.alta}</div>
          </li>
        </ul>
      </div>
    `;
    container.appendChild(card);
  });

  // 2. STATS POR CRITERIOS
  const critTitle = document.createElement('h3');
  critTitle.innerHTML = '🎯 Cobertura de Criterios (LOMLOE)';
  critTitle.style.marginTop = 'var(--space-5)';
  critTitle.style.marginBottom = 'var(--space-3)';
  container.appendChild(critTitle);

  const allCriteriosMap = {};
  // Combinamos todos los criterios de todos los cursos para tener la lista completa
  if (typeof CYR_EVALUATION_DATA !== 'undefined') {
    Object.values(CYR_EVALUATION_DATA).forEach(courseList => {
      courseList.forEach(item => {
         allCriteriosMap[item.crit] = item.text;
      });
    });
  }

  // Contamos cuantas preguntas hay por criterio
  const critCounts = {};
  Object.keys(allCriteriosMap).forEach(c => critCounts[c] = 0);
  
  preguntas.forEach(p => {
    if (p.criterio) {
      if (critCounts[p.criterio] === undefined) {
         critCounts[p.criterio] = 0;
         allCriteriosMap[p.criterio] = 'Criterio personalizado';
      }
      critCounts[p.criterio]++;
    }
  });

  // Renderizar la lista de Criterios
  const critCard = document.createElement('div');
  critCard.className = 'coverage-card';
  let critHtml = `<div class="coverage-body" style="max-height: 400px; overflow-y: auto;"><ul class="coverage-list">`;
  
  // Agrupar por Competencia (el primer número del criterio)
  const grouped = {};
  Object.keys(allCriteriosMap).sort().forEach(c => {
    const ce = c.split('.')[0];
    if (!grouped[ce]) grouped[ce] = [];
    grouped[ce].push(c);
  });

  Object.keys(grouped).sort().forEach(ce => {
    critHtml += `<li style="background: var(--surface-2); font-weight: bold; border-top: 2px solid var(--border);">Competencia Específica ${ce}</li>`;
    grouped[ce].forEach(c => {
      const count = critCounts[c] || 0;
      const text = allCriteriosMap[c];
      const badge = count > 0 
        ? `<span class="badge badge--success">${count} pregs</span>`
        : `<span class="badge badge--error">0 pregs (Sin cubrir)</span>`;
      
      critHtml += `
        <li style="display:flex; flex-direction:column; gap:5px; align-items:flex-start;">
          <div style="display:flex; justify-content:space-between; width:100%;">
            <strong>Criterio ${c}</strong>
            ${badge}
          </div>
          <div style="font-size: 0.85rem; color: var(--text-secondary);">${escapeHtml(text)}</div>
        </li>
      `;
    });
  });

  critHtml += `</ul></div>`;
  critCard.innerHTML = critHtml;
  container.appendChild(critCard);
}
"""

with open("js/banco_preguntas.js", "r", encoding="utf-8") as f:
    content = f.read()

# Replace old function
start_idx = content.find("function showCoverage()")
if start_idx != -1:
    end_idx = content.find("}", start_idx)
    # The function has nested blocks, so simple find("}") won't work perfectly. Let's use regex or split.
    # Fortunately, it's the last function in the file, or close to it.
    pass
