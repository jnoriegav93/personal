// ── Exportar lista a Excel ────────────────────────────────────────
function exportPieceList() {
  if (!pieces.length) { notify('No hay piezas para exportar'); return; }

  const rows = [['Grupo', 'Nombre', 'Etiqueta', 'Largo (mm)', 'Ancho (mm)', 'Cantidad']];
  pieces.forEach(p => {
    rows.push([
      p.group  || 'Sin grupo',
      p.name   || '',
      p.tag    || '',
      +(p.length).toFixed(2),
      +(p.width).toFixed(2),
      p.qty || 1,
    ]);
  });

  const ws = XLSX.utils.aoa_to_sheet(rows);

  // Ancho de columnas
  ws['!cols'] = [
    { wch: 18 }, { wch: 28 }, { wch: 16 },
    { wch: 13 }, { wch: 13 }, { wch: 10 },
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Piezas');

  const sel  = document.getElementById('matPreset');
  const name = (sel.options[sel.selectedIndex]?.text || 'cutopt').replace(/[^a-z0-9]/gi, '_').slice(0, 30);
  XLSX.writeFile(wb, `${name}_piezas.xlsx`);
  notify(`Lista exportada: ${name}_piezas.xlsx`);
}

// ── Gestión de piezas ─────────────────────────────────────────────
function recolor() { pieces.forEach((p, i) => p.color = COLORS[i % COLORS.length]); }

function confirmClearAll() {
  if (!pieces.length) { notify('No hay piezas que limpiar'); return; }
  showConfirm(
    'Limpiar lista',
    `Se eliminarán todas las ${pieces.length} piezas. Esta acción no se puede deshacer.`,
    'Limpiar todo', 'danger',
    () => { pieces = []; optimized = []; renderPieceList(); resetStats(); hideCanvas(); notify('Lista limpiada'); }
  );
}

function resetStats() {
  document.getElementById('statUse').textContent   = '—';
  document.getElementById('statWaste').textContent = '—';
  document.getElementById('statSheets').textContent= '—';
  document.getElementById('usageBar').style.display = 'none';
  document.getElementById('remnantPanel').style.height   = '0';
  document.getElementById('remnantPanel').style.overflow = 'hidden';
  remnantOpen = false;
}

function hideCanvas() {
  document.getElementById('emptyState').style.display  = '';
  document.getElementById('canvasInner').style.display = 'none';
}

// ── Grupos ────────────────────────────────────────────────────────
function setLeftTab(tab) {
  document.getElementById('tabPiezas').classList.toggle('active', tab === 'piezas');
  document.getElementById('tabGrupos').classList.toggle('active', tab === 'grupos');
  document.getElementById('piezasContent').style.display  = tab === 'piezas'  ? 'contents' : 'none';
  document.getElementById('gruposContent').style.display  = tab === 'grupos'  ? 'flex'     : 'none';
}

function addGroupFromInput() {
  const input = document.getElementById('newGroupInput');
  const name  = (input.value || '').trim();
  if (!name) { notify('Escribe un nombre para el grupo'); return; }
  if (groups.includes(name)) { notify('Ese nombre ya existe'); return; }
  groups.push(name);
  input.value = '';
  renderGroupTab();
  renderPieceList();
  notify(`Grupo "${name}" creado`);
}

function removeGroup(name) {
  showConfirm(
    `Eliminar grupo "${name}"`,
    'Las piezas en este grupo pasarán a "Sin grupo".',
    'Eliminar', 'danger',
    () => {
      groups = groups.filter(g => g !== name);
      pieces.forEach(p => { if (p.group === name) p.group = ''; });
      renderGroupTab();
      renderPieceList();
    }
  );
}

function renameGroup(oldName) {
  const newName = prompt(`Nuevo nombre para "${oldName}":`, oldName);
  if (!newName || newName.trim() === oldName) return;
  const n = newName.trim();
  if (groups.includes(n)) { notify('Ese nombre ya existe'); return; }
  groups = groups.map(g => g === oldName ? n : g);
  pieces.forEach(p => { if (p.group === oldName) p.group = n; });
  renderGroupTab();
  renderPieceList();
}

function toggleGroupCollapse(name) {
  groupCollapsed[name] = !groupCollapsed[name];
  renderPieceList();
}

function renderGroupTab() {
  const cont = document.getElementById('gruposList');
  if (!cont) return;
  if (!groups.length) {
    cont.innerHTML = '<div style="color:var(--text-muted);font-size:0.78rem;padding:18px;text-align:center;font-family:\'IBM Plex Mono\',monospace;">Sin grupos creados.</div>';
    return;
  }
  cont.innerHTML = groups.map(g => {
    const count = pieces.filter(p => p.group === g).length;
    const gs = g.replace(/'/g, "\\'").replace(/"/g, '&quot;');
    return `<div class="group-item">
      <div class="group-item-left">
        <span class="group-item-dot"></span>
        <span class="group-item-name">${g}</span>
        <span class="group-item-count">${count}</span>
      </div>
      <div style="display:flex;gap:3px;flex-shrink:0;">
        <button class="piece-btn" onclick="renameGroup('${gs}')" title="Renombrar">✎</button>
        <button class="piece-btn del" onclick="removeGroup('${gs}')" title="Eliminar">✕</button>
      </div>
    </div>`;
  }).join('');
}

// ── Poblar select de grupos en modal ──────────────────────────────
function refreshGroupSelect(selectId) {
  const sel = document.getElementById(selectId);
  if (!sel) return;
  const cur = sel.value;
  sel.innerHTML = '<option value="">Sin grupo</option>' +
    groups.map(g => `<option value="${g}"${g === cur ? ' selected' : ''}>${g}</option>`).join('');
}

// ── Modal agregar / editar pieza ──────────────────────────────────
function openAddModal() {
  document.getElementById('addModalTitle').textContent = 'Agregar pieza';
  document.getElementById('addModalBtn').textContent   = 'Agregar pieza';
  document.getElementById('editingIdx').value = '-1';
  ['newName','newTag'].forEach(id => document.getElementById(id).value = '');
  document.getElementById('newLength').value = '';
  document.getElementById('newWidth').value  = '';
  document.getElementById('newQty').value    = '1';
  document.querySelectorAll('#addTagPills .tag-pill').forEach(p => p.classList.remove('selected'));
  refreshGroupSelect('newGroup');
  openModal('add');
}

function openEditModal(idx) {
  const p = pieces[idx];
  document.getElementById('addModalTitle').textContent = 'Editar pieza';
  document.getElementById('addModalBtn').textContent   = 'Guardar cambios';
  document.getElementById('editingIdx').value  = idx;
  document.getElementById('newName').value     = p.name;
  document.getElementById('newLength').value   = p.length;
  document.getElementById('newWidth').value    = p.width;
  document.getElementById('newQty').value      = p.qty;
  document.getElementById('newTag').value      = p.tag || '';
  document.querySelectorAll('#addTagPills .tag-pill').forEach(el => {
    el.classList.toggle('selected', el.textContent === p.tag);
  });
  refreshGroupSelect('newGroup');
  document.getElementById('newGroup').value = p.group || '';
  openModal('add');
}

function savePiece() {
  const name   = document.getElementById('newName').value.trim();
  const length = parseFloat(document.getElementById('newLength').value);
  const width  = parseFloat(document.getElementById('newWidth').value);
  const qty    = parseInt(document.getElementById('newQty').value) || 1;
  const tag    = document.getElementById('newTag').value.trim();
  const group  = document.getElementById('newGroup').value || '';
  if (!name || !length || !width) { notify('Completa nombre, largo y ancho'); return; }

  const idx = parseInt(document.getElementById('editingIdx').value);

  const doSave = () => {
    if (idx >= 0) {
      pieces[idx] = { ...pieces[idx], name, length, width, qty, tag, group };
    } else {
      pieces.push({ name, length, width, qty, tag, group, color: COLORS[pieces.length % COLORS.length] });
    }
    recolor();
    closeModal('add');
    renderPieceList();
    renderGroupTab();
    notify(idx >= 0 ? 'Pieza actualizada' : 'Pieza agregada');
  };

  // Advertir si necesita lámina adicional
  if (idx < 0 && optimized.length) {
    const allSpaces = optimized.flatMap(s => s.freeSpaces || []);
    const canFit = allSpaces.some(sp =>
      (length <= sp.w && width <= sp.h) || (width <= sp.w && length <= sp.h)
    );
    if (!canFit) {
      const largest = allSpaces.length
        ? allSpaces.reduce((b, sp) => sp.w * sp.h > b.w * b.h ? sp : b, allSpaces[0])
        : null;
      const maxMsg = largest ? ` Máximo disponible: ${Math.round(largest.w)}×${Math.round(largest.h)} mm.` : '';
      closeModal('add');
      showConfirm(
        'Requiere lámina adicional',
        `Esta pieza no cabe en ningún espacio libre actual y requerirá una lámina adicional.${maxMsg}`,
        'Agregar de todas formas', 'normal', doSave
      );
      return;
    }
  }

  doSave();
}

function removePiece(idx) {
  pieces.splice(idx, 1);
  recolor();
  renderPieceList();
  renderGroupTab();
}

function selectAddTag(el, tag) {
  document.querySelectorAll('#addTagPills .tag-pill').forEach(p => p.classList.remove('selected'));
  el.classList.add('selected');
  document.getElementById('newTag').value = tag;
}

// ── Renderizar lista de piezas (con grupos acordeón) ──────────────
function renderPieceList() {
  const container = document.getElementById('pieceList');
  document.getElementById('pieceCount').textContent = pieces.length;

  if (!pieces.length) {
    container.innerHTML = '<div style="text-align:center;padding:24px;color:var(--text-muted);font-size:0.78rem;font-family:\'IBM Plex Mono\',monospace;">Sin piezas.</div>';
    return;
  }

  const u = unitLabel();

  const renderItem = (p, i) => {
    const l = fmt(p.length), w = fmt(p.width);
    const tagBadge = p.tag
      ? `<span class="badge" style="background:${p.color}22;color:${p.color};border:1px solid ${p.color}44;margin-left:4px;">${p.tag}</span>`
      : '';
    return `<div class="piece-item${p.isSuggestion ? ' is-suggestion' : ''}" id="pi-${i}">
      <div class="piece-accent" style="background:${p.color}"></div>
      <div class="piece-body">
        <div class="piece-info">
          <div class="piece-label">${p.name}${tagBadge}</div>
          <div class="piece-sub">${l}×${w} ${u} · ×${p.qty}</div>
        </div>
        <div class="piece-actions">
          <button class="piece-btn" onclick="openEditModal(${i})" title="Editar">✎</button>
          <button class="piece-btn del" onclick="removePiece(${i})" title="Eliminar">✕</button>
        </div>
      </div>
    </div>`;
  };

  // Agrupar piezas
  const sinGrupo = pieces.map((p, i) => ({p, i})).filter(({p}) => !p.group);
  const byGroup = {};
  groups.forEach(g => { byGroup[g] = []; });
  pieces.forEach((p, i) => { if (p.group && byGroup[p.group] !== undefined) byGroup[p.group].push({p, i}); });

  let html = '';

  // Sección "Sin grupo"
  const sgCollapsed = groupCollapsed['__singrupo__'];
  html += `<div class="group-accordion">
    <div class="group-acc-header" onclick="toggleGroupCollapse('__singrupo__')">
      <span class="group-acc-name">Sin grupo <span class="group-acc-count">${sinGrupo.length}</span></span>
      <span class="chevron${sgCollapsed ? '' : ' open'}">▼</span>
    </div>
    ${!sgCollapsed ? `<div class="group-acc-body">${sinGrupo.map(({p,i}) => renderItem(p,i)).join('') || '<div class="group-empty">Sin piezas.</div>'}</div>` : ''}
  </div>`;

  // Grupos nombrados
  groups.forEach(g => {
    const items = byGroup[g] || [];
    const collapsed = groupCollapsed[g];
    const gs = g.replace(/'/g, "\\'");
    html += `<div class="group-accordion">
      <div class="group-acc-header" onclick="toggleGroupCollapse('${gs}')">
        <div style="display:flex;align-items:center;gap:6px;">
          <span class="group-acc-dot"></span>
          <span class="group-acc-name">${g} <span class="group-acc-count">${items.length}</span></span>
        </div>
        <span class="chevron${collapsed ? '' : ' open'}">▼</span>
      </div>
      ${!collapsed ? `<div class="group-acc-body">${items.map(({p,i}) => renderItem(p,i)).join('') || '<div class="group-empty">Sin piezas en este grupo.</div>'}</div>` : ''}
    </div>`;
  });

  container.innerHTML = html;
}
