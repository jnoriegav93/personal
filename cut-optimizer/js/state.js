// ── Estado global ─────────────────────────────────────────────────
let pieces = [], optimized = [], currentZoom = 0.6, remnantOpen = false;
let suggestionCounter = 0, currentSheetIdx = 0;
let measureMode = false, measuring = false, measureStart = null;
let groups = [];           // Array of group name strings
let groupCollapsed = {};   // { groupName: boolean }

const COLORS = [
  '#4A90D9','#E8812A','#5BA85A','#9B6DB5','#D4535C',
  '#3AACB8','#C88B2E','#7A8FA6','#A67C52','#5E9E8B',
  '#D97BB6','#6B8E23','#CD853F','#708090','#2E8B57'
];

// ── Modo oscuro / claro ───────────────────────────────────────────
function toggleDarkMode() {
  const html  = document.documentElement;
  const isNowDark = html.getAttribute('data-theme') !== 'light';
  const next  = isNowDark ? 'light' : 'dark';
  html.setAttribute('data-theme', next);
  localStorage.setItem('cutopt-theme', next);
  const btn = document.getElementById('themeBtn');
  if (btn) btn.textContent = next === 'light' ? '☀' : '☾';
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
