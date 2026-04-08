// ── Herramienta de medición ───────────────────────────────────────
function toggleMeasure() {
  if (!optimized.length) { notify('Genera la optimización primero'); return; }
  measureMode = !measureMode;
  const btn = document.getElementById('measureBtn');
  const mc  = document.getElementById('measureCanvas');
  btn.classList.toggle('active', measureMode);
  mc.style.display = measureMode ? 'block' : 'none';
  if (!measureMode) {
    const ctx = mc.getContext('2d'); ctx.clearRect(0, 0, mc.width, mc.height);
    closeMeasureTooltip();
    measuring = false; measureStart = null;
  }
}

function closeMeasureTooltip() {
  document.getElementById('measureTooltip').style.display = 'none';
  measureStart = null; measuring = false;
  const mc = document.getElementById('measureCanvas');
  if (mc) { const ctx = mc.getContext('2d'); ctx.clearRect(0, 0, mc.width, mc.height); }
}

function initMeasureCanvas() {
  const mc = document.getElementById('measureCanvas');

  mc.addEventListener('mousedown', e => {
    if (!measureMode) return;
    e.preventDefault(); measuring = true;
    const r = mc.getBoundingClientRect();
    measureStart = { x: e.clientX - r.left, y: e.clientY - r.top };
  });

  mc.addEventListener('mousemove', e => {
    if (!measuring || !measureStart) return;
    const r = mc.getBoundingClientRect();
    drawMeasureLine(measureStart.x, measureStart.y, e.clientX - r.left, e.clientY - r.top, e.clientX, e.clientY);
  });

  mc.addEventListener('mouseup', e => {
    if (!measureMode || !measureStart) return;
    const r = mc.getBoundingClientRect();
    drawMeasureLine(measureStart.x, measureStart.y, e.clientX - r.left, e.clientY - r.top, e.clientX, e.clientY);
    measuring = false;
  });

  mc.addEventListener('mouseleave', () => { measuring = false; });

  mc.addEventListener('dblclick', () => {
    if (!measureMode) return;
    closeMeasureTooltip();
  });
}

// ── Dibujar la línea de medición ──────────────────────────────────
function drawMeasureLine(x1, y1, x2, y2, cx, cy) {
  const mc  = document.getElementById('measureCanvas');
  const ctx = mc.getContext('2d');
  ctx.clearRect(0, 0, mc.width, mc.height);

  const dx = x2 - x1, dy = y2 - y1;
  if (Math.abs(dx) < 1 && Math.abs(dy) < 1) return;

  // Línea principal
  ctx.strokeStyle = '#E84B1C'; ctx.lineWidth = 1.5; ctx.setLineDash([5, 3]);
  ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();

  // Referencia ortogonal
  if (Math.abs(dy) > 6 && Math.abs(dx) > 6) {
    ctx.strokeStyle = 'rgba(232,75,28,0.25)'; ctx.lineWidth = 1; ctx.setLineDash([3, 4]);
    ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y1); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x2, y1); ctx.lineTo(x2, y2); ctx.stroke();
  }
  ctx.setLineDash([]);

  // Puntos de anclaje
  ctx.fillStyle = '#E84B1C';
  [{x:x1,y:y1},{x:x2,y:y2}].forEach(p => { ctx.beginPath(); ctx.arc(p.x, p.y, 4, 0, Math.PI*2); ctx.fill(); });

  // Tooltip (z-index < modal para no tapar los modales abiertos)
  const scale = currentZoom;
  const dxMm  = dx / scale, dyMm = dy / scale, diagMm = Math.sqrt(dxMm*dxMm + dyMm*dyMm);
  const f = dispFactor(), dec = dispDec(), u = unitLabel();
  const txt =
    `↔\u00a0${(Math.abs(dxMm)*f).toFixed(dec)}\u00a0\u00a0` +
    `↕\u00a0${(Math.abs(dyMm)*f).toFixed(dec)}\u00a0\u00a0` +
    `⤢\u00a0${(diagMm*f).toFixed(dec)}\u00a0${u}`;
  const textEl = document.getElementById('measureTooltipText');
  if (textEl) textEl.textContent = txt;
  const tooltip = document.getElementById('measureTooltip');
  tooltip.style.display = 'flex';
  // Posicionar para que no se salga de la ventana
  const ttW = 280, ttH = 32;
  const left = cx + 14 + ttW > window.innerWidth  ? cx - ttW - 8 : cx + 14;
  const top  = cy - 36 < 0                        ? cy + 8        : cy - 36;
  tooltip.style.left = left + 'px';
  tooltip.style.top  = top  + 'px';
}
