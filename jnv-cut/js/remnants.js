// ── Renderizar panel de sobrantes ─────────────────────────────────
function renderRemnants() {
  // NO tocar panel.style.overflow aquí — lo gestiona toggleRemnant
  const allRemnants = optimized.flatMap((sheet, si) => sheet.remnants.map(r => ({...r, sheet: si+1})));
  const badge = document.getElementById('remnantBadge');
  badge.textContent = allRemnants.length ? `${allRemnants.length} zona${allRemnants.length !== 1 ? 's' : ''}` : '';

  if (!allRemnants.length) {
    document.getElementById('remnantBody').innerHTML =
      '<div style="color:var(--text-muted);font-size:0.78rem;padding:6px 0;">No se detectaron sobrantes significativos.</div>';
    return;
  }

  const typeLabel = { strip: 'Listón', square: 'Cuadrado', rect: 'Rectángulo' };
  const u = unitLabel();
  let html = '<div class="remnant-grid">';
  allRemnants.forEach(r => {
    html += `<div class="remnant-card">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px;">
        <span class="rem-sheet-badge">Lámina ${r.sheet}</span>
        <span class="rem-type-badge rem-type-${r.type}">${typeLabel[r.type] || 'Zona'}</span>
      </div>
      <div class="rem-size">${fmt(r.w)} × ${fmt(r.h)} ${u}</div>
      <div class="rem-area">${(r.area / 1e6).toFixed(4)} m²</div>
      <button class="rem-add-btn" onclick="openAddSuggestionModal(${r.w},${r.h},${r.sheet-1})">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" style="width:12px;height:12px;"><path d="M10.75 4.75a.75.75 0 0 0-1.5 0v4.5h-4.5a.75.75 0 0 0 0 1.5h4.5v4.5a.75.75 0 0 0 1.5 0v-4.5h4.5a.75.75 0 0 0 0-1.5h-4.5v-4.5Z"/></svg>
        Agregar a plancha
      </button>
    </div>`;
  });
  html += '</div>';
  document.getElementById('remnantBody').innerHTML = html;
}

function toggleRemnant() {
  const body    = document.getElementById('remnantBody');
  const chevron = document.getElementById('remnantChevron');
  if (remnantOpen) {
    body.style.display = 'none';
    chevron.classList.remove('open');
    remnantOpen = false;
  } else {
    body.style.display = '';
    chevron.classList.add('open');
    remnantOpen = true;
    if (optimized.length) renderRemnants();
  }
}

// ── Modal: agregar pieza sugerida ─────────────────────────────────
let sugDivMode = 'none';

function openAddSuggestionModal(remW, remH, sheetIdx) {
  if (!optimized[sheetIdx]) { notify('Lámina no encontrada'); return; }

  // Buscar el espacio libre real más grande que contenga o cubra este sobrante.
  // Puede ser mayor al del card si mergeSpaces fusionó espacios adyacentes.
  const sheet = optimized[sheetIdx];
  const freeSpaces = sheet.freeSpaces || [];
  const best = freeSpaces.reduce((b, sp) => {
    const covers = (Math.abs(sp.w - remW) < 50 || sp.w >= remW) &&
                   (Math.abs(sp.h - remH) < 50 || sp.h >= remH);
    if (covers && sp.w * sp.h > b.w * b.h) return sp;
    return b;
  }, { w: remW, h: remH });
  const actualW = best.w, actualH = best.h;

  document.getElementById('sugName').value     = '';
  document.getElementById('sugLength').value   = Math.round(actualW);
  document.getElementById('sugWidth').value    = Math.round(actualH);
  document.getElementById('sugCols').value     = '2';
  document.getElementById('sugRows').value     = '2';
  document.getElementById('sugSheetIdx').value = sheetIdx;
  document.getElementById('sugRemW').value     = actualW;
  document.getElementById('sugRemH').value     = actualH;
  document.getElementById('sugFitWarning').style.display = 'none';
  const u = unitLabel();
  document.getElementById('sugSpaceInfo').innerHTML =
    `Espacio libre disponible: <strong>${fmt(actualW)} × ${fmt(actualH)} ${u}</strong><br>` +
    `<span style="opacity:0.75">Lámina ${sheetIdx+1} · Kerf ya descontado en el espacio</span>`;
  setSugDiv('none');
  openModal('addSug');
}

function setSugDiv(mode) {
  sugDivMode = mode;
  ['none','vert','horiz','grid'].forEach(m => {
    const id = 'div' + m.charAt(0).toUpperCase() + m.slice(1);
    const el = document.getElementById(id);
    if (el) el.classList.toggle('active', m === mode);
  });
  const di      = document.getElementById('divInputs');
  const colWrap = document.getElementById('divColWrap');
  const rowWrap = document.getElementById('divRowWrap');
  di.style.display      = mode === 'none' ? 'none' : 'flex';
  colWrap.style.display = (mode === 'vert'  || mode === 'grid')  ? '' : 'none';
  rowWrap.style.display = (mode === 'horiz' || mode === 'grid')  ? '' : 'none';
  updateSugPreview();
}

function updateSugPreview() {
  const l    = parseFloat(document.getElementById('sugLength').value) || 0;
  const w    = parseFloat(document.getElementById('sugWidth').value)  || 0;
  const cols = (sugDivMode === 'vert'  || sugDivMode === 'grid')  ? Math.max(1, parseInt(document.getElementById('sugCols').value) || 2) : 1;
  const rows = (sugDivMode === 'horiz' || sugDivMode === 'grid') ? Math.max(1, parseInt(document.getElementById('sugRows').value) || 2) : 1;
  drawSugPreviewCanvas(l, w, cols, rows);

  const rl = document.getElementById('sugResultList');
  if (!l || !w) { rl.innerHTML = ''; return; }
  const name  = document.getElementById('sugName').value.trim() || 'Sugerido';
  const total = cols * rows;
  const pW = Math.round(l / cols), pH = Math.round(w / rows);
  rl.innerHTML = total === 1
    ? `<span class="sug-result-chip">${name} — ${l}×${w} mm</span>`
    : Array.from({length: total}, (_, i) =>
        `<span class="sug-result-chip">${name} [pieza ${i+1}] — ${pW}×${pH} mm</span>`
      ).join('');
}

function drawSugPreviewCanvas(l, w, cols, rows) {
  const canvas = document.getElementById('sugPreviewCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const containerW = canvas.parentElement ? canvas.parentElement.offsetWidth : 430;
  canvas.width  = Math.max(100, containerW - 4);
  canvas.height = 160;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  if (!l || !w) return;

  const PAD = 14;
  const scale = Math.min((canvas.width - PAD*2) / l, (canvas.height - PAD*2) / w);
  const pw = Math.round(l * scale), ph = Math.round(w * scale);
  const ox = Math.round((canvas.width  - pw) / 2);
  const oy = Math.round((canvas.height - ph) / 2);

  const isDark = document.documentElement.getAttribute('data-theme') !== 'light';
  const cellColors = [
    isDark ? 'rgba(232,75,28,0.18)'   : 'rgba(232,75,28,0.12)',
    isDark ? 'rgba(91,168,90,0.18)'   : 'rgba(91,168,90,0.12)',
    isDark ? 'rgba(74,144,217,0.18)'  : 'rgba(74,144,217,0.12)',
    isDark ? 'rgba(155,109,181,0.18)' : 'rgba(155,109,181,0.12)',
    isDark ? 'rgba(232,129,42,0.18)'  : 'rgba(232,129,42,0.12)',
    isDark ? 'rgba(58,172,184,0.18)'  : 'rgba(58,172,184,0.12)',
  ];
  const cellPW = pw / cols, cellPH = ph / rows;

  // Cell fills
  for (let r = 0; r < rows; r++)
    for (let c = 0; c < cols; c++) {
      ctx.fillStyle = cellColors[(r * cols + c) % cellColors.length];
      ctx.fillRect(ox + c * cellPW, oy + r * cellPH, cellPW, cellPH);
    }

  // Outer border
  ctx.strokeStyle = isDark ? '#888' : '#555'; ctx.lineWidth = 1.5; ctx.setLineDash([]);
  ctx.strokeRect(ox, oy, pw, ph);

  // Single piece label
  if (cols === 1 && rows === 1 && pw > 50 && ph > 20) {
    ctx.fillStyle = isDark ? 'rgba(240,237,232,0.55)' : 'rgba(26,25,22,0.5)';
    ctx.font = `${Math.max(8, Math.min(11, pw/7, ph/3))}px "IBM Plex Mono",monospace`;
    ctx.textAlign = 'center';
    ctx.fillText(`${l}×${w} mm`, ox + pw/2, oy + ph/2 + 4);
    ctx.textAlign = 'left';
  }

  // Cut lines + per-cell labels
  if (cols > 1 || rows > 1) {
    ctx.strokeStyle = isDark ? 'rgba(232,75,28,0.7)' : 'rgba(232,75,28,0.6)';
    ctx.lineWidth = 1.2; ctx.setLineDash([5, 3]);
    for (let c = 1; c < cols; c++) { const lx = ox + c*cellPW; ctx.beginPath(); ctx.moveTo(lx,oy); ctx.lineTo(lx,oy+ph); ctx.stroke(); }
    for (let r = 1; r < rows; r++) { const ly = oy + r*cellPH; ctx.beginPath(); ctx.moveTo(ox,ly); ctx.lineTo(ox+pw,ly); ctx.stroke(); }
    ctx.setLineDash([]);

    if (cellPW > 30 && cellPH > 18) {
      const fs = Math.max(7, Math.min(10, cellPW/5, cellPH/3));
      ctx.fillStyle = isDark ? 'rgba(240,237,232,0.65)' : 'rgba(26,25,22,0.6)';
      ctx.font = `${fs}px "IBM Plex Mono",monospace`;
      ctx.textAlign = 'center';
      const pW_each = Math.round(l/cols), pH_each = Math.round(w/rows);
      for (let r = 0; r < rows; r++)
        for (let c = 0; c < cols; c++)
          ctx.fillText(`${pW_each}×${pH_each}`, ox + c*cellPW + cellPW/2, oy + r*cellPH + cellPH/2 + fs/2);
      ctx.textAlign = 'left';
    }
  }
}

function findBestFitSpace(spaces, needW, needH) {
  let best = null, bestFit = Infinity;
  for (const sp of spaces) {
    if (needW <= sp.w && needH <= sp.h) {
      const waste = sp.w * sp.h - needW * needH;
      if (waste < bestFit) { bestFit = waste; best = sp; }
    }
  }
  return best;
}

function confirmAddSuggestion() {
  const name     = document.getElementById('sugName').value.trim();
  const l        = parseFloat(document.getElementById('sugLength').value);
  const w        = parseFloat(document.getElementById('sugWidth').value);
  const sheetIdx = parseInt(document.getElementById('sugSheetIdx').value);
  const remW     = parseFloat(document.getElementById('sugRemW').value);
  const remH     = parseFloat(document.getElementById('sugRemH').value);
  if (!l || !w) { notify('Ingresa dimensiones válidas'); return; }

  const sheet  = optimized[sheetIdx];
  const spaces = sheet.freeSpaces || [];

  // El espacio libre ya tiene el kerf descontado → solo verificar si la pieza cabe
  const fitsN = l <= remW && w <= remH;
  const fitsR = w <= remW && l <= remH;

  if (!fitsN && !fitsR) {
    const warn = document.getElementById('sugFitWarning');
    warn.style.display = '';
    warn.innerHTML = `⚠ La pieza no cabe en este sobrante.<br>Máximo disponible: <strong>${Math.round(remW)} × ${Math.round(remH)} mm</strong>`;
    return;
  }

  const rotate = !fitsN && fitsR;
  const pl = rotate ? w : l, pw = rotate ? l : w;

  let fit = findBestFitSpace(spaces, pl, pw);
  if (!fit && spaces.length) fit = spaces.reduce((best, sp) => sp.w*sp.h > best.w*best.h ? sp : best, spaces[0]);
  const sx = fit ? fit.x : 0, sy = fit ? fit.y : 0;

  // Cortes
  const cols    = (sugDivMode === 'vert'  || sugDivMode === 'grid') ? Math.max(1, parseInt(document.getElementById('sugCols').value) || 2) : 1;
  const rows    = (sugDivMode === 'horiz' || sugDivMode === 'grid') ? Math.max(1, parseInt(document.getElementById('sugRows').value) || 2) : 1;
  const hasCuts = cols > 1 || rows > 1;
  const total   = cols * rows;

  suggestionCounter++;
  const baseName = name || `Sugerido ${suggestionCounter}`;

  // Agregar al canvas
  sheet.suggestions = sheet.suggestions || [];
  sheet.suggestions.push({ name: baseName, rw: pl, rh: pw, x: sx, y: sy, rotated: rotate, cuts: { cols, rows } });

  // Agregar a la lista de piezas (qty = total piezas, sin nombres individuales)
  const pW = Math.round(pl / cols), pH = Math.round(pw / rows);
  pieces.push({
    name: baseName,
    length: hasCuts ? pW : pl,
    width:  hasCuts ? pH : pw,
    qty:    total,
    tag:    'Sobrante',
    group:  '',
    color:  COLORS[pieces.length % COLORS.length],
    isSuggestion: true,
    // Placement info para re-adjuntar al canvas tras re-optimizar
    _sheetIdx: sheetIdx,
    _x: sx, _y: sy, _rw: pl, _rh: pw,
    _rotated: rotate,
    _cuts: { cols, rows },
  });

  // Eliminar el sobrante usado de la lista para evitar duplicados
  const ridx = sheet.remnants.findIndex(r =>
    Math.abs(r.w - remW) < 1 && Math.abs(r.h - remH) < 1
  );
  if (ridx !== -1) sheet.remnants.splice(ridx, 1);

  closeModal('addSug');
  renderSheet();
  renderRemnants();
  renderPieceList();
  renderGroupTab();
  notify(`${baseName} agregado${hasCuts ? ` · ${total}×${pW}×${pH} mm` : ''}`);
}
