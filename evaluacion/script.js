let preguntas = [];
let respuestas = {};
let actual = 0;

async function iniciarEvaluacion() {
  const res = await fetch('preguntas.json');
  preguntas = await res.json();
  document.getElementById('instrucciones').style.display = 'none';
  mostrarPregunta(0);
}

function mostrarPregunta(indice) {
  actual = indice;
  const pregunta = preguntas[indice];
  let html = `<h3 class="my-2" style="min-height:100px">${indice + 1}. ${pregunta.texto}</h3><ul class="list-group" style="min-height:270">`;

  pregunta.opciones.forEach((op, i) => {
    const checked = respuestas[indice] === op ? 'checked' : '';
    html += `
      <li class="list-group-item list-group-item-action" onclick="guardarRespuesta(${indice}, '${op}')">
        <div class="d-flex align-items-center gap-2">
          <input type="radio" name="respuesta" id="op${i}" value="${op}" style="pointer-events: none;" ${checked}>
          <label class="ms-2">${op}</label>
        </div>
      </li>`;
  });

  html += `</ul><div class="d-flex justify-content-between mt-3">`;

  if (indice > 0) {
    html += `<button class="btn btn-secondary" onclick="mostrarPregunta(${indice - 1})">Anterior</button>`;
  } else {
    html += `<span></span>`;
  }

  html += `<div>${indice + 1} de ${preguntas.length}</div>`;

  if (indice < preguntas.length - 1) {
    html += `<button class="btn btn-primary" onclick="mostrarPregunta(${indice + 1})">Siguiente</button>`;
  } else {
    html += `<button class="btn btn-success" onclick="finalizar()">Finalizar</button>`;
  }

  html += `</div><div class="mt-3 mx-auto text-center" style="max-width:650px">${numerosDePreguntas()}</div>`;

  document.getElementById('pregunta-contenedor').style.display = 'block';
  document.getElementById('pregunta-contenedor').innerHTML = html;
}

function guardarRespuesta(indice, respuesta) {
  respuestas[indice] = respuesta;
  mostrarPregunta(indice); // Volver a cargar para actualizar visual
}

function numerosDePreguntas() {
  return preguntas.map((_, i) => {
    const respondido = respuestas[i] ? 'btn-primary text-light' : 'btn-secondary';
    return `<span id="numero-${i}" class="btn btn-sm ${respondido} m-1" onclick="mostrarPregunta(${i})">${i + 1}</span>`;
  }).join('');
}

function finalizar() {
  document.getElementById('pregunta-contenedor').style.display = 'none';
  document.getElementById('resumen-respuestas').style.display = 'block';

  let resultadoHTML = '';
  let correctas = 0;
  let incorrectas = 0;
  let marcadas = 0;

  preguntas.forEach((p, i) => {
    const respuestaUsuario = respuestas[i];
    const esCorrecta = respuestaUsuario === p.respuesta;
    if (respuestaUsuario) marcadas++;
    if (respuestaUsuario && esCorrecta) correctas++;
    else if (respuestaUsuario && !esCorrecta) incorrectas++;

    const badge = esCorrecta
      ? '<span class="badge bg-primary ms-2">Correcta</span>'
      : '<span class="badge bg-danger ms-2">Incorrecta</span>';

    resultadoHTML += `
      <div class="mb-4">
        <h5>${i + 1}. ${p.texto} ${badge}</h5>
        <ol class="list-group list-group-numbered">`;

    p.opciones.forEach(op => {
      const esSeleccionada = respuestaUsuario === op;
      const esCorrecta = p.respuesta === op;

      let clase = 'list-group-item d-flex_ justify-content-between align-items-center';
      let iconos = '';

      if (esSeleccionada && esCorrecta) {
        iconos = `
          <span>
            <i class="fas fa-hand-pointer text-primary me-2"></i>
            <i class="fas fa-check text-success"></i>
          </span>`;
        clase += ' text-primary fw-bold';
      } else if (esSeleccionada && !esCorrecta) {
        iconos = `<i class="fas fa-hand-pointer text-primary"></i>`;
        clase += ' text-primary fw-bold';
      } else if (!esSeleccionada && esCorrecta) {
        iconos = `<i class="fas fa-check text-success"></i>`;
        clase += ' text-success';
      }

      resultadoHTML += `<li class="${clase}">${op} ${iconos}</li>`;
    });

    resultadoHTML += `
        </ol>
      </div>
      <hr>`;
  });

  const total = preguntas.length;
  const sinMarcar = total - marcadas;
  const porcentajeCorrectas = ((correctas / total) * 100).toFixed(2);
  const porcentajeIncorrectas = ((incorrectas / total) * 100).toFixed(2);
  const aprobado = correctas >= 26;

  resultadoHTML = `
    <div class="alert ${aprobado ? 'alert-success' : 'alert-danger'} text-center">
      <h4>${aprobado ? '¡Aprobado!' : 'No Aprobado'}</h4>
      <p>${correctas} respuestas correctas de ${total} (${porcentajeCorrectas}%)</p>
    </div>
    <ul class="list-group mb-4">
      <li class="list-group-item d-flex justify-content-between">
        <span>Total de preguntas</span><strong>${total}</strong>
      </li>
      <li class="list-group-item d-flex justify-content-between">
        <span>Respuestas marcadas</span><strong>${marcadas}</strong>
      </li>
      <li class="list-group-item d-flex justify-content-between">
        <span>Respuestas sin marcar</span><strong>${sinMarcar}</strong>
      </li>
      <li class="list-group-item d-flex justify-content-between">
        <span>Correctas</span><strong class="text-success">${correctas} (${porcentajeCorrectas}%)</strong>
      </li>
      <li class="list-group-item d-flex justify-content-between">
        <span>Incorrectas</span><strong class="text-danger">${incorrectas} (${porcentajeIncorrectas}%)</strong>
      </li>
    </ul>
  ` + resultadoHTML;

  document.getElementById('respuestas-json').innerHTML = resultadoHTML;
}
