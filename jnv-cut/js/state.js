// ── Estado global ─────────────────────────────────────────────────
let pieces = [], optimized = [], currentZoom = 0.6, remnantOpen = false;
let suggestionCounter = 0, currentSheetIdx = 0;
let measureMode = false, measuring = false, measureStart = null;
let groups = [];           // Array of group name strings
let groupCollapsed = {};   // { groupName: boolean }
let groupColors  = {};     // { groupName: '#hex' }
let colorMode    = 'piece';// 'piece' | 'group'
let projectName  = '';
let materialOpen = true;   // accordion state
let detailOpen   = true;   // accordion state

// ── Paleta 40 colores (8 × 5) ─────────────────────────────────────
const COLORS = [
  // Rojos / Naranjas / Amarillos
  '#EF4444','#DC2626','#F97316','#EA580C','#F59E0B','#D97706','#EAB308','#B45309',
  // Verdes
  '#84CC16','#65A30D','#22C55E','#16A34A','#10B981','#059669','#14B8A6','#0D9488',
  // Azules / Cianes
  '#06B6D4','#0891B2','#0EA5E9','#0284C7','#3B82F6','#2563EB','#6366F1','#4F46E5',
  // Morados / Rosas
  '#8B5CF6','#7C3AED','#A855F7','#9333EA','#EC4899','#DB2777','#F43F5E','#E11D48',
  // Mixtos
  '#4A90D9','#5BA85A','#9B6DB5','#3AACB8','#C88B2E','#7A8FA6','#A67C52','#D97BB6',
];

// ── Helpers de color ──────────────────────────────────────────────
function getNextColor(excludeIdxs) {
  const used = new Set(pieces.map(p => p.color).filter(Boolean));
  if (excludeIdxs) excludeIdxs.forEach(c => used.add(c));
  return COLORS.find(c => !used.has(c)) || COLORS[pieces.length % COLORS.length];
}

function getNextGroupColor() {
  const used = new Set(Object.values(groupColors));
  return COLORS.find(c => !used.has(c)) || COLORS[groups.length % COLORS.length];
}

function pieceDisplayColor(p) {
  if (colorMode === 'group' && p.group && groupColors[p.group]) return groupColors[p.group];
  return p.color || '#888';
}

function setColorMode(mode) {
  colorMode = mode;
  const bp = document.getElementById('cmPiece'), bg = document.getElementById('cmGroup');
  if (bp) bp.classList.toggle('active', mode === 'piece');
  if (bg) bg.classList.toggle('active', mode === 'group');
  if (optimized.length) renderSheet();
}

// ── Nombre de proyecto ────────────────────────────────────────────
function onProjectNameInput(el) {
  let v = el.value
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')  // quitar tildes
    .replace(/[^a-zA-Z0-9 _-]/g, '')                   // solo alfanumérico+espacio+_-
    .slice(0, 30);
  if (v !== el.value) el.value = v;
  projectName = v;
}

function sanitizedProjectName() {
  return (projectName || 'proyecto').trim().replace(/ +/g, '_').slice(0, 30) || 'proyecto';
}

// ── Color picker HTML ─────────────────────────────────────────────
const _SVG_CHECK = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="white" style="width:11px;height:11px;position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);pointer-events:none;"><path fill-rule="evenodd" d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z" clip-rule="evenodd"/></svg>`;

function buildColorPickerHTML(selectedColor, usedColors, onClickExpr) {
  const used = new Set(usedColors || []);
  let html = '<div class="color-picker-grid">';
  COLORS.forEach(c => {
    const sel  = c === selectedColor;
    const inUse = used.has(c) && !sel;
    html += `<button type="button" class="cp-dot${sel ? ' selected' : ''}${inUse ? ' in-use' : ''}" style="background:${c};" onclick="${onClickExpr}(this,'${c}')" title="${c}">${sel ? _SVG_CHECK : ''}</button>`;
  });
  return html + '</div>';
}

// ── Modo oscuro / claro ───────────────────────────────────────────
function toggleDarkMode() {
  const html  = document.documentElement;
  const isNowDark = html.getAttribute('data-theme') !== 'light';
  const next  = isNowDark ? 'light' : 'dark';
  html.setAttribute('data-theme', next);
  localStorage.setItem('jnvcut-theme', next);
  _syncThemeIcons(next);
}

function _syncThemeIcons(theme) {
  const moon = document.getElementById('iconMoon');
  const sun  = document.getElementById('iconSun');
  if (moon) moon.style.display = theme === 'light' ? 'none'  : '';
  if (sun)  sun.style.display  = theme === 'light' ? ''      : 'none';
}

// ── Notificaciones y modales ──────────────────────────────────────
function notify(msg, dur = 2500) {
  const el = document.getElementById('notification');
  el.textContent = msg;
  el.classList.add('show');
  setTimeout(() => el.classList.remove('show'), dur);
}

function openModal(n)  { document.getElementById(n + 'Modal').classList.add('open'); }
function closeModal(n) { document.getElementById(n + 'Modal').classList.remove('open'); }

function showConfirm(title, msg, okLabel, okStyle, cb) {
  document.getElementById('confirmTitle').textContent = title;
  document.getElementById('confirmMsg').textContent   = msg;
  const btn = document.getElementById('confirmOkBtn');
  btn.textContent    = okLabel;
  btn.style.background  = okStyle === 'danger' ? 'var(--red)' : 'var(--accent)';
  btn.style.borderColor = okStyle === 'danger' ? 'var(--red)' : 'var(--accent)';
  btn.onclick = () => { closeModal('confirm'); cb(); };
  openModal('confirm');
}

// ── Helpers de unidad de visualización ───────────────────────────
function dispFactor() {
  const toMm = { mm:1, cm:10, m:1000, in:25.4 };
  return 1 / toMm[document.getElementById('unit').value];
}
function dispDec() {
  const u = document.getElementById('unit').value;
  return u === 'm' ? 3 : u === 'in' ? 2 : u === 'cm' ? 1 : 0;
}
function fmt(v)       { return (v * dispFactor()).toFixed(dispDec()); }
function unitLabel()  { return document.getElementById('unit').value; }
