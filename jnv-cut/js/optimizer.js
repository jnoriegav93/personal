// ── Motor de optimización (guillotine bin-packing) ────────────────
function runOptimization() {
  if (!pieces.length) { notify('Agrega piezas primero'); return; }
  const matL = parseFloat(document.getElementById('matLength').value);
  const matW = parseFloat(document.getElementById('matWidth').value);
  const kerf = parseFloat(document.getElementById('kerf').value) || 0;
  if (!matL || !matW) { notify('Selecciona un tipo de plancha primero'); return; }

  // Confirmar piezas sugeridas: dejan de ser "sugeridas" y entran al packing normal
  pieces.forEach(p => {
    if (!p.isSuggestion) return;
    delete p.isSuggestion;
    delete p._sheetIdx; delete p._x; delete p._y;
    delete p._rw; delete p._rh; delete p._rotated; delete p._cuts;
  });

  let all = [];
  pieces.forEach(p => { for (let q = 0; q < p.qty; q++) all.push({...p}); });
  all.sort((a, b) => b.length * b.width - a.length * a.width);

  // Calcular resultados primero (antes de renderizar)
  const sheets = [];
  let remaining = [...all];
  while (remaining.length) {
    const { placed, rem, spaces } = packSheet(remaining, matL, matW, kerf);
    if (!placed.length) break;
    sheets.push({
      placed, matL, matW,
      freeSpaces: spaces,
      suggestions: [],
      remnants: classifyFreeSpaces(spaces, matL, matW),
    });
    remaining = rem;
  }

  if (!sheets.length) { notify('Ninguna pieza cabe en la plancha seleccionada'); return; }

  const applyResults = () => {
    optimized = sheets;

    // Estadísticas
    const totalMat  = matL * matW * sheets.length;
    const totalUsed = all.reduce((s, p) => s + p.length * p.width, 0);
    const usePct    = Math.round(totalUsed / totalMat * 100);

    document.getElementById('statUse').textContent    = usePct + '%';
    document.getElementById('statWaste').textContent  = (100 - usePct) + '%';
    document.getElementById('statSheets').textContent = sheets.length;

    // Botones de láminas
    currentSheetIdx = 0;
    renderSheetButtons();

    const ub = document.getElementById('usageBar'); ub.style.display = 'flex';
    document.getElementById('usageFill').style.width      = usePct + '%';
    document.getElementById('usageFill').style.background =
      usePct > 70 ? 'var(--green)' : usePct > 40 ? 'var(--amber)' : 'var(--red)';
    document.getElementById('usageLabel').textContent =
      `${usePct}% usado`;
      // `${usePct}% uso · ${sheets.length} lámina${sheets.length > 1 ? 's' : ''}`;

    document.getElementById('emptyState').style.display  = 'none';
    document.getElementById('canvasInner').style.display = '';
    renderSheet();
    renderRemnants();
    if (!remnantOpen) toggleRemnant();
    notify(`Optimización lista — ${sheets.length} lámina${sheets.length > 1 ? 's' : ''}`);
  };

  if (sheets.length > 1) {
    const u = unitLabel();
    showConfirm(
      `Se necesitan ${sheets.length} láminas`,
      `Las piezas actuales requieren ${sheets.length} láminas de ${fmt(matL)}×${fmt(matW)} ${u}. ¿Continuar con la optimización?`,
      'Continuar', 'normal',
      applyResults
    );
  } else {
    applyResults();
  }
}

// ── Botones de selección de lámina ───────────────────────────────
function renderSheetButtons() {
  const container = document.getElementById('sheetBtns');
  if (!container) return;
  container.innerHTML = optimized.map((_, i) =>
    `<button class="sheet-btn${i === currentSheetIdx ? ' active' : ''}" onclick="selectSheet(${i})">${i + 1}</button>`
  ).join('');
}

function selectSheet(idx) {
  currentSheetIdx = idx;
  renderSheetButtons();
  renderSheet();
}

// ── Empaquetado guillotina (kerf sólo en el corte) ─────────────────
function packSheet(items, matL, matW, kerf) {
  const placed = [], spaces = [{ x:0, y:0, w:matL, h:matW }];
  const used = new Set();

  for (const piece of items) {
    if (used.has(piece)) continue;
    let best = -1, bestFit = Infinity, rotate = false;
    const vars = [
      { pl: piece.length, pw: piece.width,  r: false },
      { pl: piece.width,  pw: piece.length, r: true  },
    ];

    for (let si = 0; si < spaces.length; si++) {
      const sp = spaces[si];
      for (const v of vars) {
        if (v.pl <= sp.w && v.pw <= sp.h) {
          const waste = sp.w * sp.h - v.pl * v.pw;
          if (waste < bestFit) { bestFit = waste; best = si; rotate = v.r; }
        }
      }
    }
    if (best === -1) continue;

    const sp = spaces.splice(best, 1)[0];
    const pl = rotate ? piece.width  : piece.length;
    const pw = rotate ? piece.length : piece.width;
    placed.push({ ...piece, x: sp.x, y: sp.y, rw: pl, rh: pw, rotated: rotate });
    used.add(piece);

    const rightW = sp.w - pl - kerf;
    if (rightW > 0) spaces.push({ x: sp.x + pl + kerf, y: sp.y, w: rightW, h: pw });
    const belowH = sp.h - pw - kerf;
    if (belowH > 0) spaces.push({ x: sp.x, y: sp.y + pw + kerf, w: sp.w, h: belowH });

    spaces.sort((a, b) => a.w * a.h - b.w * b.h);
  }
  return { placed, rem: items.filter(p => !used.has(p)), spaces: mergeSpaces(spaces, kerf) };
}

// ── Fusionar espacios libres contiguos ────────────────────────────
// EPS_SAME: tolerancia de alineación (misma coordenada).
// EPS_ADJ : tolerancia de adyacencia (borde a borde, puede haber kerf entre ellos).
function mergeSpaces(spaces, kerf = 0) {
  const EPS_SAME = 0.5;
  const EPS_ADJ  = kerf + 0.5;
  let changed = true;
  while (changed) {
    changed = false;
    outer: for (let i = 0; i < spaces.length; i++) {
      for (let j = i + 1; j < spaces.length; j++) {
        const a = spaces[i], b = spaces[j];
        // Mismo x y ancho → fusión vertical
        if (Math.abs(a.x - b.x) < EPS_SAME && Math.abs(a.w - b.w) < EPS_SAME) {
          if (Math.abs(a.y + a.h - b.y) < EPS_ADJ) {
            spaces.splice(j, 1); spaces.splice(i, 1);
            spaces.push({ x: a.x, y: a.y, w: a.w, h: b.y + b.h - a.y });
            changed = true; break outer;
          }
          if (Math.abs(b.y + b.h - a.y) < EPS_ADJ) {
            spaces.splice(j, 1); spaces.splice(i, 1);
            spaces.push({ x: b.x, y: b.y, w: b.w, h: a.y + a.h - b.y });
            changed = true; break outer;
          }
        }
        // Mismo y y alto → fusión horizontal
        if (Math.abs(a.y - b.y) < EPS_SAME && Math.abs(a.h - b.h) < EPS_SAME) {
          if (Math.abs(a.x + a.w - b.x) < EPS_ADJ) {
            spaces.splice(j, 1); spaces.splice(i, 1);
            spaces.push({ x: a.x, y: a.y, w: b.x + b.w - a.x, h: a.h });
            changed = true; break outer;
          }
          if (Math.abs(b.x + b.w - a.x) < EPS_ADJ) {
            spaces.splice(j, 1); spaces.splice(i, 1);
            spaces.push({ x: b.x, y: b.y, w: a.x + a.w - b.x, h: a.h });
            changed = true; break outer;
          }
        }
      }
    }
  }
  return spaces;
}

// ── Clasificar espacios libres como sobrantes ─────────────────────
function classifyFreeSpaces(spaces, matL, matW) {
  const MIN = 50;
  const seen = new Set();
  const result = [];

  const candidates = spaces
    .map(sp => {
      const w = Math.min(sp.w, matL - sp.x);
      const h = Math.min(sp.h, matW - sp.y);
      const area = w * h;
      const ratio = Math.min(w, h) > 0 ? Math.max(w, h) / Math.min(w, h) : Infinity;
      const type = ratio >= 4 ? 'strip'
                 : Math.abs(w - h) < 0.15 * Math.min(w, h) ? 'square'
                 : 'rect';
      return { w, h, area, type, x: sp.x, y: sp.y };
    })
    .filter(sp => sp.w >= MIN && sp.h >= MIN)
    .sort((a, b) => b.area - a.area);

  for (const sp of candidates) {
    const key = `${Math.round(sp.w / 25) * 25}x${Math.round(sp.h / 25) * 25}`;
    if (!seen.has(key)) {
      seen.add(key);
      result.push(sp);
      if (result.length >= 6) break;
    }
  }
  return result;
}
