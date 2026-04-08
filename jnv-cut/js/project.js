// ── Nuevo proyecto ────────────────────────────────────────────────
function newProject() {
  const hasPieces = pieces.length > 0;
  const doNew = () => {
    pieces = []; optimized = []; groups = []; groupColors = {}; projectName = '';
    const nameInput = document.getElementById('projectNameInput');
    if (nameInput) nameInput.value = '';
    document.getElementById('matPreset').value = '';
    applyPreset();
    renderPieceList();
    renderGroupTab();
    resetStats();
    hideCanvas();
    notify('Nuevo proyecto creado');
  };
  if (hasPieces) {
    showConfirm(
      'Nuevo proyecto',
      `Se perderán las ${pieces.length} piezas actuales y toda la configuración. ¿Continuar?`,
      'Crear nuevo', 'danger', doNew
    );
  } else {
    doNew();
  }
}

// ── Acordeón Material ─────────────────────────────────────────────
function toggleMaterial() {
  const body    = document.getElementById('materialBody');
  const chevron = document.getElementById('materialChevron');
  if (materialOpen) {
    body.style.display = 'none';
    chevron.classList.remove('open');
  } else {
    body.style.display = '';
    chevron.classList.add('open');
  }
  materialOpen = !materialOpen;
}

// ── Acordeón Herramientas ─────────────────────────────────────────
function toggleHerramientas() {
  const body    = document.getElementById('herramientasBody');
  const chevron = document.getElementById('herramientasChevron');
  if (herramientasOpen) {
    body.style.display = 'none';
    chevron.classList.remove('open');
  } else {
    body.style.display = '';
    chevron.classList.add('open');
  }
  herramientasOpen = !herramientasOpen;
}

// ── Acordeón Detalle ──────────────────────────────────────────────
function toggleDetail() {
  const body    = document.getElementById('detailBody');
  const chevron = document.getElementById('detailChevron');
  if (detailOpen) {
    body.style.display = 'none';
    chevron.classList.remove('open');
  } else {
    body.style.display = 'flex';
    chevron.classList.add('open');
  }
  detailOpen = !detailOpen;
}

// ── Guardar proyecto (.jnvcut) ────────────────────────────────────
function saveProject() {
  if (!pieces.length) { notify('No hay piezas para guardar'); return; }
  const project = {
    version: '1.4',
    created: new Date().toISOString(),
    projectName,
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
    groupColors,
  };
  const name = sanitizedProjectName();
  const link = document.createElement('a');
  link.href     = URL.createObjectURL(new Blob([JSON.stringify(project, null, 2)], { type: 'application/json' }));
  link.download = `${name}.jnvcut`;
  link.click();
  notify(`Proyecto guardado: ${name}.jnvcut`);
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
      groupColors = (p.groupColors && typeof p.groupColors === 'object') ? p.groupColors : {};
      projectName = p.projectName || '';
      const nameInput = document.getElementById('projectNameInput');
      if (nameInput) nameInput.value = projectName;
      // Preserve saved colors; only assign new colors to pieces missing one
      pieces = p.pieces.map((pc, i) => ({
        ...pc,
        color: pc.color || COLORS[i % COLORS.length],
        group: pc.group || '',
      }));
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

// ── Panel izquierdo: toggle ───────────────────────────────────────
let _panelVisible = true;
function toggleLeftPanel() {
  const panel  = document.getElementById('panelLeft');
  const handle = document.getElementById('panelResizeHandle');
  const btn    = document.getElementById('panelToggleBtn');
  if (!panel) return;
  const isDesktop = window.innerWidth >= 768;
  if (_panelVisible) {
    if (isDesktop) {
      panel.style.width    = '0';
      panel.style.minWidth = '0';
    } else {
      panel.style.height    = '0';
      panel.style.minHeight = '0';
    }
    panel.style.overflow = 'hidden';
    if (handle) handle.style.display = 'none';
    if (btn) btn.style.opacity = '0.5';
  } else {
    panel.style.width    = '';
    panel.style.minWidth = '';
    panel.style.height   = '';
    panel.style.minHeight = '';
    panel.style.overflow = '';
    if (handle && window.innerWidth >= 1024) handle.style.display = '';
    if (btn) btn.style.opacity = '';
    // Re-apply saved width on desktop
    if (isDesktop) {
      const saved = parseInt(localStorage.getItem('jnvcut-panel-width'));
      if (saved && saved >= 280) panel.style.width = saved + 'px';
    }
  }
  _panelVisible = !_panelVisible;
}

// ── Panel izquierdo redimensionable ───────────────────────────────
function initPanelResize() {
  const handle  = document.getElementById('panelResizeHandle');
  const panel   = document.getElementById('panelLeft');
  if (!handle || !panel) return;

  // Solo visible en desktop (lg = 1024px)
  if (window.innerWidth < 1024) handle.style.display = 'none';

  let dragging = false, startX = 0, startW = 0;
  const MIN_W = 280, MAX_RATIO = 0.65;

  handle.addEventListener('mousedown', e => {
    if (window.innerWidth < 768) return;
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
    localStorage.setItem('jnvcut-panel-width', panel.offsetWidth);
  });

  // Restaurar ancho guardado (solo desktop)
  const saved = parseInt(localStorage.getItem('jnvcut-panel-width'));
  if (saved && saved >= MIN_W && window.innerWidth >= 768) {
    panel.style.width = saved + 'px';
  }
}

// ── Inicialización ────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  // Restaurar tema guardado
  const savedTheme = localStorage.getItem('jnvcut-theme');
  if (savedTheme) {
    document.documentElement.setAttribute('data-theme', savedTheme);
    _syncThemeIcons(savedTheme);
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
