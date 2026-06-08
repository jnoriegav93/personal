// logica.js — Reglas de juego: puntaje, dias por tarea, niveles y rachas.

// Hora a partir de la cual, si no marcaste el ejercicio del dia, se considera "por vencer".
const HORA_AVISO = 20; // 8:00 p.m.

// ---------- Fechas ----------
export const claveDia = (fecha = new Date()) => {
  const d = new Date(fecha);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

export const hoyClave = () => claveDia();

const diasEntre = (claveA, claveB) => {
  const a = new Date(`${claveA}T00:00:00`);
  const b = new Date(`${claveB}T00:00:00`);
  return Math.round((b - a) / 86400000);
};

// "07:00 a.m." -> { hora: 7, minuto: 0 }
const parsearCooldown = (texto = '07:00 a.m.') => {
  const m = String(texto).trim().match(/(\d{1,2}):(\d{2})\s*(a\.?m\.?|p\.?m\.?)?/i);
  if (!m) return { hora: 0, minuto: 0 };
  let hora = parseInt(m[1], 10);
  const minuto = parseInt(m[2], 10);
  const meridiano = (m[3] || '').toLowerCase();
  if (meridiano.startsWith('p') && hora < 12) hora += 12;
  if (meridiano.startsWith('a') && hora === 12) hora = 0;
  return { hora, minuto };
};

// ---------- Dias / puntaje por tarea ----------
export const diasRequeridos = (tarea) =>
  Math.max(1, Math.round((tarea.puntos_requeridos || 0) / (tarea.puntos_obtenidos || 1)));

// Estado consolidado del progreso de una tarea.
export const estadoTarea = (tarea, progreso) => {
  const marcas = progreso?.marcas || [];
  const requeridas = diasRequeridos(tarea);
  const hechas = Math.min(marcas.length, requeridas);
  const completada = hechas >= requeridas;
  const porcentaje = Math.round((hechas / requeridas) * 100);
  const puntos = Math.min(hechas * tarea.puntos_obtenidos, tarea.puntos_requeridos);
  const ultimaMarca = marcas.length ? marcas[marcas.length - 1] : null;
  return { marcas, requeridas, hechas, completada, porcentaje, puntos, ultimaMarca };
};

// Se puede marcar hoy? (una vez por dia, respetando el cooldown)
export const puedeMarcarHoy = (tarea, progreso) => {
  const { completada, ultimaMarca } = estadoTarea(tarea, progreso);
  if (completada) return false;
  if (ultimaMarca && ultimaMarca === hoyClave()) return false;
  const { hora, minuto } = parsearCooldown(tarea.cooldown);
  const ahora = new Date();
  const aperturaHoy = new Date();
  aperturaHoy.setHours(hora, minuto, 0, 0);
  return ahora >= aperturaHoy;
};

// Proxima fecha/hora en que la tarea volvera a estar disponible (siguiente dia al cooldown).
// Devuelve un Date, o null si nunca se ha marcado o ya esta disponible ahora.
export const proximaApertura = (tarea, progreso) => {
  const { ultimaMarca, completada } = estadoTarea(tarea, progreso);
  if (!ultimaMarca) return null;
  const { hora, minuto } = parsearCooldown(tarea.cooldown);
  const fecha = new Date(`${ultimaMarca}T00:00:00`);
  fecha.setDate(fecha.getDate() + 1);
  fecha.setHours(hora, minuto, 0, 0);
  if (!completada && new Date() >= fecha) return null; // ya volvio a estar disponible
  return fecha;
};

// Formatea milisegundos restantes a { h, m, s, texto }.
export const formatearRestante = (ms) => {
  const total = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  return { h, m, s, texto: `${h}h ${String(m).padStart(2, '0')}m ${String(s).padStart(2, '0')}s` };
};

// Estado de alerta: 'ninguno' | 'porVencer' | 'rota'
// Regla acordada: la racha se CONSERVA, solo se avisa.
export const estadoAlerta = (tarea, progreso) => {
  const { marcas, completada, ultimaMarca } = estadoTarea(tarea, progreso);
  if (completada || !marcas.length) return 'ninguno';

  const diff = diasEntre(ultimaMarca, hoyClave());
  if (diff >= 2) return 'rota'; // se salto al menos un dia
  if (diff >= 1 && new Date().getHours() >= HORA_AVISO) return 'porVencer'; // hoy no marcada y ya es tarde
  return 'ninguno';
};

// ---------- Bloques y niveles ----------
export const estadoBloque = (bloque, mapaProgreso) => {
  let puntos = 0;
  let tareasCompletas = 0;
  bloque.tareas.forEach((tarea) => {
    const e = estadoTarea(tarea, mapaProgreso[tarea.id]);
    puntos += e.puntos;
    if (e.completada) tareasCompletas += 1;
  });
  // El progreso se mide contra el total real de todas las tareas del bloque
  // (asi el 100% solo se alcanza cuando TODAS las tareas estan completas).
  const necesario = bloque.tareas.reduce((s, t) => s + t.puntos_requeridos, 0) || bloque.puntaje_necesario || 1;
  const completado = puntos >= necesario;
  const porcentaje = Math.min(100, Math.round((puntos / necesario) * 100));
  return { puntos, necesario, completado, porcentaje, tareasCompletas, totalTareas: bloque.tareas.length };
};

export const estadoNivel = (nivel, mapaProgreso) => {
  let puntos = 0;
  let bloquesCompletos = 0;
  nivel.bloques.forEach((bloque) => {
    const e = estadoBloque(bloque, mapaProgreso);
    puntos += e.puntos;
    if (e.completado) bloquesCompletos += 1;
  });
  const completado = bloquesCompletos === nivel.bloques.length;
  return { puntos, completado, bloquesCompletos, totalBloques: nivel.bloques.length };
};

// Un nivel esta desbloqueado si es el primero o si el nivel anterior esta completo.
export const nivelDesbloqueado = (mundo, indiceNivel, mapaProgreso) => {
  if (indiceNivel === 0) return true;
  const anterior = mundo.niveles[indiceNivel - 1];
  return estadoNivel(anterior, mapaProgreso).completado;
};

// Puntaje total del usuario en el mundo.
export const puntajeTotal = (mundo, mapaProgreso) =>
  mundo.niveles.reduce((s, nivel) => s + estadoNivel(nivel, mapaProgreso).puntos, 0);

// Nivel "actual" del usuario = primer nivel no completado desbloqueado.
export const nivelActual = (mundo, mapaProgreso) => {
  for (let i = 0; i < mundo.niveles.length; i += 1) {
    if (!estadoNivel(mundo.niveles[i], mapaProgreso).completado) return mundo.niveles[i].numero;
  }
  return mundo.niveles[mundo.niveles.length - 1].numero;
};
