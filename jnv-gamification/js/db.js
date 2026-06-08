// db.js — Capa de acceso a IndexedDB.
// Tablas: usuarios, mundos (config del mundo), progreso (avance por usuario+tarea).

const NOMBRE_BD = 'jnv_gamification';
const VERSION_BD = 1;

let _bd = null;

export const abrirBD = () =>
  new Promise((resolver, rechazar) => {
    if (_bd) return resolver(_bd);
    const solicitud = indexedDB.open(NOMBRE_BD, VERSION_BD);

    solicitud.onupgradeneeded = (evento) => {
      const bd = evento.target.result;

      if (!bd.objectStoreNames.contains('usuarios')) {
        const tienda = bd.createObjectStore('usuarios', { keyPath: 'id', autoIncrement: true });
        tienda.createIndex('correo', 'correo', { unique: false });
      }
      if (!bd.objectStoreNames.contains('mundos')) {
        // Config del mundo. keyPath compuesto: usuario + mundo, para permitir
        // configuraciones personalizadas por perfil.
        bd.createObjectStore('mundos', { keyPath: 'clave' });
      }
      if (!bd.objectStoreNames.contains('progreso')) {
        const tienda = bd.createObjectStore('progreso', { keyPath: 'clave' });
        tienda.createIndex('usuarioId', 'usuarioId', { unique: false });
      }
    };

    solicitud.onsuccess = () => {
      _bd = solicitud.result;
      resolver(_bd);
    };
    solicitud.onerror = () => rechazar(solicitud.error);
  });

const transaccion = async (tienda, modo) => {
  const bd = await abrirBD();
  return bd.transaction(tienda, modo).objectStore(tienda);
};

const promesa = (solicitud) =>
  new Promise((resolver, rechazar) => {
    solicitud.onsuccess = () => resolver(solicitud.result);
    solicitud.onerror = () => rechazar(solicitud.error);
  });

// ---------- Usuarios ----------
export const listarUsuarios = async () => {
  const t = await transaccion('usuarios', 'readonly');
  return promesa(t.getAll());
};

export const crearUsuario = async (usuario) => {
  const t = await transaccion('usuarios', 'readwrite');
  const id = await promesa(t.add({ ...usuario, creado: new Date().toISOString() }));
  return id;
};

export const obtenerUsuario = async (id) => {
  const t = await transaccion('usuarios', 'readonly');
  return promesa(t.get(id));
};

export const eliminarUsuario = async (id) => {
  const t = await transaccion('usuarios', 'readwrite');
  return promesa(t.delete(id));
};

// ---------- Mundos (config) ----------
const claveMundo = (usuarioId, mundoId) => `${usuarioId}::${mundoId}`;

export const guardarMundo = async (usuarioId, mundo) => {
  const t = await transaccion('mundos', 'readwrite');
  return promesa(t.put({ clave: claveMundo(usuarioId, mundo.id), usuarioId, ...mundo }));
};

export const obtenerMundo = async (usuarioId, mundoId) => {
  const t = await transaccion('mundos', 'readonly');
  return promesa(t.get(claveMundo(usuarioId, mundoId)));
};

export const listarMundos = async (usuarioId) => {
  const t = await transaccion('mundos', 'readonly');
  const todos = await promesa(t.getAll());
  return todos.filter((m) => m.usuarioId === usuarioId);
};

// ---------- Progreso por tarea ----------
const claveProgreso = (usuarioId, tareaId) => `${usuarioId}::${tareaId}`;

export const obtenerProgreso = async (usuarioId, tareaId) => {
  const t = await transaccion('progreso', 'readonly');
  return promesa(t.get(claveProgreso(usuarioId, tareaId)));
};

export const guardarProgreso = async (usuarioId, tareaId, datos) => {
  const t = await transaccion('progreso', 'readwrite');
  return promesa(
    t.put({ clave: claveProgreso(usuarioId, tareaId), usuarioId, tareaId, ...datos })
  );
};

export const listarProgresoUsuario = async (usuarioId) => {
  const t = await transaccion('progreso', 'readonly');
  const idx = t.index('usuarioId');
  return promesa(idx.getAll(usuarioId));
};

// ---------- Utilidad: hay datos? ----------
export const hayUsuarios = async () => (await listarUsuarios()).length > 0;
