// ── Guardar proyecto (.cutopt) ────────────────────────────────────
function saveProject() {
  if (!pieces.length) { notify('No hay piezas para guardar'); return; }
  const project = {
    version: '1.3',
    created: new Date().toISOString(),
    material: {
      presetIdx: document.getElementById('matPreset').value,
      length:    document.getElementById('matLength').value,
      width:     document.getElementById('matWidth').value,
      thick:     document.getElementById('matThick').value,
      kerf:      document.getElementById('kerf').value,
      unit:      document.getElementById('unit').value,
    },
    pieces,
    groups,
  };
  const sel  = document.getElementById('matPreset');
  const name = (sel.options[sel.selectedIndex]?.text || 'proyecto').replace(/[^a-z0-9]/gi, '_').slice(0, 40);
  const link = document.createElement('a');
  link.href     = URL.createObjectURL(new Blob([JSON.stringify(project, null, 2)], { type: 'application/json' }));
  link.download = `${name}.cutopt`;
  link.click();
  notify(`Proyecto guardado: ${name}.cutopt`);
}

// ── Cargar proyecto ───────────────────────────────────────────────
function loadProject() { document.getElementById('projectFileInput').click(); }

function loadProjectFile(ev) {
  const file = ev.target.files[0]; if (!file) return;
  const reader = new FileReader();
  reader.onload = e => {
    try {
      const p = JSON.parse(e.target.result);
      if (!p.pieces || !p.material) throw new Error();
      const m = p.material;
      if (m.presetIdx !== undefined) document.getElementById('matPreset').value = m.presetIdx;
      applyPreset();
      document.getElementById('kerf').value  = m.kerf || 3;
      document.getElementById('unit').value  = m.unit || 'cm';
      groups = Array.isArray(p.groups) ? p.groups : [];
      pieces = p.pieces.map((pc, i) => ({...pc, color: COLORS[i % COLORS.length], group: pc.group || ''}));
      renderGroupTab();
      renderPieceList();
      if (pieces.length) runOptimization();
      notify('Proyecto cargado');
    } catch { notify('Error al cargar el proyecto'); }
  };
  reader.readAsText(file); ev.target.value = '';
}

// ── Modales arrastrables ──────────────────────────────────────────
function initDraggableModals() {
  document.querySelectorAll('.modal-overlay .modal').forEach(modal => {
    const handle = modal.querySelector('.modal-drag-handle');
    if (!handle) return;
    let startX = 0, startY = 0, origLeft = 0, origTop = 0, dragging = false;

    handle.addEventListener('mousedown', e => {
      if (e.target.tagName === 'BUTTON') return;
      dragging = true;
      const rect = modal.getBoundingClientRect();
      startX = e.clientX; startY = e.clientY;
      origLeft = rect.left; origTop = rect.top;
      modal.style.position = 'fixed';
      modal.style.margin   = '0';
      modal.style.left     = rect.left + 'px';
      modal.style.top      = rect.top  + 'px';
      e.preventDefault();
    });
    document.addEventListener('mousemove', e => {
      if (!dragging) return;
      modal.style.left = (origLeft + e.clientX - startX) + 'px';
      modal.style.top  = (origTop  + e.clientY - startY) + 'px';
    });
    document.addEventListener('mouseup', () => { dragging = false; });
  });
}

// ── Panel izquierdo redimensionable ───────────────────────────────
function initPanelResize() {
  const handle  = document.getElementById('panelResizeHandle');
  const panel   = document.getElementById('panelLeft');
  if (!handle || !panel) return;

  let dragging = false, startX = 0, startW = 0;
  const MIN_W = 420, MAX_RATIO = 0.65;

  handle.addEventListener('mousedown', e => {
    if (window.innerWidth <= 768) return; // Solo desktop
    dragging = true;
    startX = e.clientX;
    startW = panel.offsetWidth;
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
    e.preventDefault();
  });

  document.addEventListener('mousemove', e => {
    if (!dragging) return;
    const newW = Math.max(MIN_W, Math.min(window.innerWidth * MAX_RATIO, startW + e.clientX - startX));
    panel.style.width = newW + 'px';
  });

  document.addEventListener('mouseup', () => {
    if (!dragging) return;
    dragging = false;
    document.body.style.cursor = '';
    document.body.style.userSelect = '';
    localStorage.setItem('cutopt-panel-width', panel.offsetWidth);
  });

  // Restaurar ancho guardado
  const saved = parseInt(localStorage.getItem('cutopt-panel-width'));
  if (saved && saved >= MIN_W && window.innerWidth > 768)
    panel.style.width = saved + 'px';
}

// ── Inicialización ────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  // Restaurar tema guardado
  const savedTheme = localStorage.getItem('cutopt-theme');
  if (savedTheme) {
    document.documentElement.setAttribute('data-theme', savedTheme);
    const btn = document.getElementById('themeBtn');
    if (btn) btn.textContent = savedTheme === 'light' ? '☀' : '☾';
  }

  buildMaterialSelect();
  initMeasureCanvas();
  initDraggableModals();
  initPanelResize();

  // Refrescar vista al cambiar unidad
  document.getElementById('unit').addEventListener('change', () => {
    renderPieceList();
    if (optimized.length) { renderSheet(); renderRemnants(); }
  });
});

// ── Atajos de teclado ─────────────────────────────────────────────
document.addEventListener('keydown', e => {
  if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') runOptimization();
  if ((e.ctrlKey || e.metaKey) && e.key === 's')     { e.preventDefault(); saveProject(); }
});
