/* Un diligenciamiento por envío. Las preguntas dependen del programa.
   El taller es opcional y, si se elige, tiene que ser de ese mismo programa.
   Al guardar, las respuestas van en columnas de formulario.
   Categorías emocionales, servicios FeneSer y sustancias van a tablas de detalle. */

const PREGUNTAS_DETALLE = {
    categoria_emocional: true,
    servicios_feneser: true,
    sustancias: true
};
const borrador = {
    programa: '',
    personaId: '',
    diligenciaEsBeneficiaria: 'S',
    personaDiligenciaId: '',
    fecha: '',
    tallerId: '',
    respuestas: {}
};

let personas = [];
let talleresForm = [];
const CLAVE_BORRADOR = 'viba-form-borrador';

const programaSelect = document.getElementById('programa');
const personaSelect = document.getElementById('persona');
const fechaInput = document.getElementById('fecha_diligenciamiento');
const diligenciaSelect = document.getElementById('diligencia_es_beneficiaria');
const diligenciaFila = document.getElementById('fila-diligencia');
const personaDiligenciaSelect = document.getElementById('persona_diligencia');
const tallerSelect = document.getElementById('taller');
const preguntaSelect = document.getElementById('pregunta-select');
const controlPregunta = document.getElementById('control-pregunta');
const progresoTexto = document.getElementById('progreso-texto');
const progresoBarra = document.getElementById('progreso-barra');
const aviso = document.getElementById('form-aviso');
const listaRespuestas = document.getElementById('lista-respuestas');
const historialBody = document.getElementById('historial-body');

function escapar(valor) {
    return String(valor ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

function etiquetaCatalogo(clave, codigo) {
    const lista = (window.VIBA_CATALOGOS[clave] || []);
    const par = lista.find(function (item) { return item[0] === codigo; });
    return par ? par[1] : (codigo || '—');
}

function preguntaPorId(id) {
    return (window.VIBA_PREGUNTAS || []).find(function (pregunta) { return pregunta.id === id; });
}

function llenarSelect(select, opciones, placeholder) {
    const valor = select.value;
    select.innerHTML = '';
    const vacio = document.createElement('option');
    vacio.value = '';
    vacio.textContent = placeholder;
    select.appendChild(vacio);
    opciones.forEach(function (item) {
        const option = document.createElement('option');
        option.value = item[0];
        option.textContent = item[1];
        select.appendChild(option);
    });
    if ([...select.options].some(function (opcion) { return opcion.value === valor; })) {
        select.value = valor;
    }
}

function mostrarAviso(texto, tipo) {
    aviso.textContent = texto || '';
    aviso.className = 'aviso' + (tipo ? ' ' + tipo : '');
}

function hoyISO() {
    const hoy = new Date();
    const mes = String(hoy.getMonth() + 1).padStart(2, '0');
    const dia = String(hoy.getDate()).padStart(2, '0');
    return hoy.getFullYear() + '-' + mes + '-' + dia;
}

function personaPorId(id) {
    return personas.find(function (persona) { return String(persona.id) === String(id); });
}

function nombrePersona(id) {
    const persona = personaPorId(id);
    if (!persona) return '—';
    return persona.tipo_documento + ' ' + persona.numero_documento + ' · ' + persona.nombre_apellidos;
}

function preguntasDelPrograma(programa) {
    return (window.VIBA_PREGUNTAS || []).filter(function (pregunta) {
        return pregunta.programas.indexOf(programa) !== -1;
    });
}

function dependenciaCumplida(pregunta) {
    if (!pregunta.depende) return true;
    return borrador.respuestas[pregunta.depende.id] === pregunta.depende.valor;
}

function disponibles() {
    return preguntasDelPrograma(borrador.programa).filter(function (pregunta) {
        if (Object.prototype.hasOwnProperty.call(borrador.respuestas, pregunta.id)) return false;
        return dependenciaCumplida(pregunta);
    });
}

function totalVisibles() {
    return preguntasDelPrograma(borrador.programa).filter(dependenciaCumplida).length;
}

function guardarBorradorLocal() {
    sessionStorage.setItem(CLAVE_BORRADOR, JSON.stringify(borrador));
}

function leerBorradorLocal() {
    try {
        const raw = sessionStorage.getItem(CLAVE_BORRADOR);
        if (!raw) return;
        const dato = JSON.parse(raw);
        if (!dato || typeof dato !== 'object' || !dato.respuestas) return;
        borrador.programa = dato.programa || '';
        borrador.personaId = dato.personaId || '';
        borrador.diligenciaEsBeneficiaria = dato.diligenciaEsBeneficiaria === 'N' ? 'N' : 'S';
        borrador.personaDiligenciaId = dato.personaDiligenciaId || '';
        borrador.fecha = dato.fecha || '';
        borrador.tallerId = dato.tallerId || '';
        borrador.respuestas = dato.respuestas;
    } catch (error) {
        borrador.respuestas = {};
    }
}

function opcionesPersona() {
    return personas.map(function (persona) {
        return [String(persona.id), nombrePersona(persona.id)];
    });
}

function sincronizarContextoDesdeDom() {
    borrador.programa = programaSelect.value;
    borrador.personaId = personaSelect.value;
    borrador.fecha = fechaInput.value;
    borrador.diligenciaEsBeneficiaria = diligenciaSelect.value === 'N' ? 'N' : 'S';
    borrador.personaDiligenciaId = personaDiligenciaSelect.value;
    borrador.tallerId = tallerSelect.value;
    diligenciaFila.classList.toggle('oculto', borrador.diligenciaEsBeneficiaria !== 'N');
}

function depurarRespuestasAjenas() {
    const permitidas = {};
    preguntasDelPrograma(borrador.programa).forEach(function (pregunta) {
        permitidas[pregunta.id] = true;
    });
    let huboCambio = true;
    while (huboCambio) {
        huboCambio = false;
        Object.keys(borrador.respuestas).forEach(function (id) {
            const pregunta = preguntaPorId(id);
            const fuera = !permitidas[id];
            const sinCondicion = pregunta && pregunta.depende && !dependenciaCumplida(pregunta);
            if (fuera || sinCondicion) {
                delete borrador.respuestas[id];
                huboCambio = true;
            }
        });
    }
}

function pintarProgreso() {
    const hechas = Object.keys(borrador.respuestas).length;
    const total = totalVisibles();
    const pendientes = disponibles().length;
    if (!borrador.programa) {
        progresoTexto.textContent = 'Elija el programa para ver sus preguntas.';
        progresoBarra.style.width = '0%';
        return;
    }
    progresoTexto.textContent = hechas + ' respondidas · ' + pendientes + ' disponibles';
    const porcentaje = total === 0 ? 0 : Math.round((hechas / total) * 100);
    progresoBarra.style.width = porcentaje + '%';
}

function pintarPreguntas() {
    const lista = disponibles();
    const actual = preguntaSelect.value;
    preguntaSelect.innerHTML = '';
    const vacio = document.createElement('option');
    vacio.value = '';
    vacio.textContent = lista.length ? 'Seleccione la pregunta' : 'No quedan preguntas para este programa';
    preguntaSelect.appendChild(vacio);
    lista.forEach(function (pregunta) {
        const option = document.createElement('option');
        option.value = pregunta.id;
        option.textContent = pregunta.nombre;
        preguntaSelect.appendChild(option);
    });
    if (lista.some(function (pregunta) { return pregunta.id === actual; })) {
        preguntaSelect.value = actual;
    } else if (lista.length) {
        preguntaSelect.value = lista[0].id;
    }
    pintarControl();
    pintarProgreso();
}

function campoBase(etiqueta) {
    const grupo = document.createElement('div');
    grupo.className = 'form-group';
    const label = document.createElement('label');
    label.textContent = etiqueta;
    grupo.appendChild(label);
    return grupo;
}

function pintarControl() {
    controlPregunta.innerHTML = '';
    const pregunta = preguntaPorId(preguntaSelect.value);
    if (!pregunta) return;

    if (pregunta.tipo === 'texto') {
        const grupo = campoBase('Respuesta');
        const area = document.createElement('textarea');
        area.id = 'valor-respuesta';
        area.rows = 4;
        grupo.appendChild(area);
        controlPregunta.appendChild(grupo);
        return;
    }

    if (pregunta.tipo === 'sn' || pregunta.tipo === 'catalogo') {
        const grupo = campoBase('Respuesta');
        const select = document.createElement('select');
        select.id = 'valor-respuesta';
        const clave = pregunta.tipo === 'sn' ? 'sn' : pregunta.catalogo;
        llenarSelect(select, window.VIBA_CATALOGOS[clave] || [], 'Seleccione');
        grupo.appendChild(select);
        controlPregunta.appendChild(grupo);
        return;
    }

    if (pregunta.tipo === 'fecha' || pregunta.tipo === 'entero' || pregunta.tipo === 'decimal' || pregunta.tipo === 'escala') {
        const grupo = campoBase('Respuesta');
        const input = document.createElement('input');
        input.id = 'valor-respuesta';
        if (pregunta.tipo === 'fecha') input.type = 'date';
        if (pregunta.tipo === 'escala') {
            input.type = 'number';
            input.min = '0';
            input.max = '10';
            input.step = '1';
        }
        if (pregunta.tipo === 'entero') {
            input.type = 'number';
            input.min = String(pregunta.min ?? 0);
            input.step = '1';
            input.inputMode = 'numeric';
        }
        if (pregunta.tipo === 'decimal') {
            input.type = 'number';
            input.min = String(pregunta.min ?? 0);
            input.step = '0.01';
        }
        grupo.appendChild(input);
        controlPregunta.appendChild(grupo);
        return;
    }

    if (pregunta.tipo === 'multiple') {
        const grupo = campoBase('Puede marcar una o varias');
        const caja = document.createElement('div');
        caja.className = 'opciones-multi';
        caja.id = 'valor-respuesta';
        (window.VIBA_CATALOGOS[pregunta.catalogo] || []).forEach(function (item) {
            const etiqueta = document.createElement('label');
            etiqueta.className = 'opcion-check';
            const input = document.createElement('input');
            input.type = 'checkbox';
            input.value = item[0];
            etiqueta.appendChild(input);
            etiqueta.appendChild(document.createTextNode(item[1]));
            caja.appendChild(etiqueta);
        });
        grupo.appendChild(caja);
        controlPregunta.appendChild(grupo);
        return;
    }

    if (pregunta.tipo === 'sustancias') {
        const grupo = campoBase('Por cada sustancia, indique si la ha tomado');
        const tabla = document.createElement('div');
        tabla.className = 'sustancias';
        tabla.id = 'valor-respuesta';
        (window.VIBA_CATALOGOS.sustancia || []).forEach(function (item) {
            const fila = document.createElement('div');
            fila.className = 'sustancia-fila';
            fila.dataset.codigo = item[0];
            fila.innerHTML =
                '<strong>' + escapar(item[1]) + '</strong>' +
                '<select data-campo="ha_tomado"><option value="">—</option><option value="S">Sí la ha tomado</option><option value="N">No</option></select>' +
                '<select data-campo="primera_vez"><option value="">¿Primera vez?</option><option value="S">Primera vez</option><option value="N">Ya la conocía</option></select>' +
                '<input data-campo="detalle" type="text" placeholder="Detalle, si aplica">';
            tabla.appendChild(fila);
        });
        grupo.appendChild(tabla);
        controlPregunta.appendChild(grupo);
    }
}

function leerValor(pregunta) {
    if (pregunta.tipo === 'multiple') {
        const marcadas = [...controlPregunta.querySelectorAll('input:checked')].map(function (input) {
            return input.value;
        });
        if (!marcadas.length) return { ok: false, mensaje: 'Marque al menos una opción.' };
        return { ok: true, valor: marcadas };
    }

    if (pregunta.tipo === 'sustancias') {
        const sustancias = {};
        let alguna = false;
        let incompleta = false;
        controlPregunta.querySelectorAll('.sustancia-fila').forEach(function (fila) {
            const codigo = fila.dataset.codigo;
            const haTomado = fila.querySelector('[data-campo="ha_tomado"]').value;
            const primeraVez = fila.querySelector('[data-campo="primera_vez"]').value;
            const detalle = fila.querySelector('[data-campo="detalle"]').value.trim();
            if (!haTomado) return;
            if (haTomado === 'S' && !primeraVez) incompleta = true;
            alguna = true;
            sustancias[codigo] = {
                ha_tomado: haTomado,
                primera_vez: haTomado === 'S' ? primeraVez : '',
                detalle: haTomado === 'S' ? detalle : ''
            };
        });
        if (incompleta) return { ok: false, mensaje: 'Si ha tomado la sustancia, indique si es la primera vez.' };
        if (!alguna) return { ok: false, mensaje: 'Registre al menos una sustancia.' };
        return { ok: true, valor: sustancias };
    }

    const campo = document.getElementById('valor-respuesta');
    const texto = campo ? String(campo.value || '').trim() : '';
    if (!texto) return { ok: false, mensaje: 'Escriba o seleccione la respuesta.' };

    if (pregunta.tipo === 'sn' || pregunta.tipo === 'catalogo') {
        const clave = pregunta.tipo === 'sn' ? 'sn' : pregunta.catalogo;
        const codigos = (window.VIBA_CATALOGOS[clave] || []).map(function (item) { return item[0]; });
        if (codigos.indexOf(texto) === -1) return { ok: false, mensaje: 'Elija un valor del catálogo.' };
        return { ok: true, valor: texto };
    }

    if (pregunta.tipo === 'escala') {
        const numero = Number(texto);
        if (!Number.isInteger(numero) || numero < 0 || numero > 10) {
            return { ok: false, mensaje: 'La escala va de 0 a 10, en números enteros.' };
        }
        return { ok: true, valor: numero };
    }

    if (pregunta.tipo === 'entero') {
        if (!/^\d+$/.test(texto)) return { ok: false, mensaje: 'Use solo números enteros, sin puntos.' };
        const numero = Number(texto);
        if (pregunta.min != null && numero < pregunta.min) {
            return { ok: false, mensaje: 'El valor debe ser mayor que cero.' };
        }
        return { ok: true, valor: numero };
    }

    if (pregunta.tipo === 'decimal') {
        const numero = Number(texto);
        if (!Number.isFinite(numero) || numero < (pregunta.min ?? 0)) {
            return { ok: false, mensaje: 'El valor no puede ser negativo.' };
        }
        return { ok: true, valor: Math.round(numero * 100) / 100 };
    }

    if (pregunta.tipo === 'fecha') {
        if (!/^\d{4}-\d{2}-\d{2}$/.test(texto)) return { ok: false, mensaje: 'Indique una fecha válida.' };
        return { ok: true, valor: texto };
    }

    return { ok: true, valor: texto };
}

function textoRespuesta(pregunta, valor) {
    if (!pregunta) return String(valor ?? '');
    if (pregunta.tipo === 'sn') return etiquetaCatalogo('sn', valor);
    if (pregunta.tipo === 'catalogo') return etiquetaCatalogo(pregunta.catalogo, valor);
    if (pregunta.tipo === 'multiple') {
        return valor.map(function (codigo) { return etiquetaCatalogo(pregunta.catalogo, codigo); }).join(', ');
    }
    if (pregunta.tipo === 'sustancias') {
        return Object.keys(valor).map(function (codigo) {
            const fila = valor[codigo];
            const nombre = etiquetaCatalogo('sustancia', codigo);
            if (fila.ha_tomado === 'N') return nombre + ': no';
            const vez = fila.primera_vez === 'S' ? 'primera vez' : 'ya la conocía';
            return nombre + ': ' + vez + (fila.detalle ? ' (' + fila.detalle + ')' : '');
        }).join(' · ');
    }
    return String(valor);
}

function pintarLista() {
    const ids = Object.keys(borrador.respuestas);
    listaRespuestas.innerHTML = '';
    if (!ids.length) {
        listaRespuestas.innerHTML = '<li class="vacio">Aún no hay respuestas en este diligenciamiento.</li>';
        return;
    }
    ids.forEach(function (id) {
        const pregunta = preguntaPorId(id);
        const item = document.createElement('li');
        item.innerHTML =
            '<div><strong>' + escapar(pregunta ? pregunta.nombre : id) + '</strong>' +
            '<span>' + escapar(textoRespuesta(pregunta, borrador.respuestas[id])) + '</span></div>' +
            '<button type="button" class="btn-secondary" data-quitar="' + escapar(id) + '">Quitar</button>';
        listaRespuestas.appendChild(item);
    });
}

function contextoValido() {
    if (!borrador.programa) return 'Elija el programa.';
    if (!borrador.personaId) return 'Elija la persona beneficiaria.';
    if (!borrador.fecha) return 'Indique la fecha de diligenciamiento.';
    if (borrador.fecha > hoyISO()) return 'La fecha de diligenciamiento no puede ser futura.';
    if (borrador.diligenciaEsBeneficiaria === 'N') {
        if (!borrador.personaDiligenciaId) return 'Elija quién diligencia el formulario.';
        if (borrador.personaDiligenciaId === borrador.personaId) {
            return 'Si quien diligencia es otra persona, elija un registro distinto.';
        }
    }
    if (borrador.tallerId) {
        const taller = talleresForm.find(function (fila) { return String(fila.id) === String(borrador.tallerId); });
        if (!taller) return 'El taller elegido ya no existe.';
        if (taller.programa !== borrador.programa) return 'El taller no pertenece al programa elegido.';
    }
    return '';
}

function construirFilaFormulario(personaDiligencia) {
    const fila = {
        programa: borrador.programa,
        persona_id: Number(borrador.personaId),
        persona_diligencia_id: Number(personaDiligencia.id),
        diligencia_es_beneficiaria: borrador.diligenciaEsBeneficiaria,
        fecha_diligenciamiento: borrador.fecha,
        taller_id: borrador.tallerId ? Number(borrador.tallerId) : null,
        marca_temporal: new Date().toISOString()
    };
    Object.keys(borrador.respuestas).forEach(function (id) {
        if (PREGUNTAS_DETALLE[id]) return;
        const valor = borrador.respuestas[id];
        fila[id] = valor === '' || valor === undefined ? null : valor;
    });
    return fila;
}

function filasDetalle(formularioId) {
    const categorias = (borrador.respuestas.categoria_emocional || []).map(function (codigo) {
        return { formulario_id: formularioId, categoria_codigo: codigo };
    });
    const servicios = (borrador.respuestas.servicios_feneser || []).map(function (codigo) {
        return { formulario_id: formularioId, servicio_codigo: codigo };
    });
    const sustancias = [];
    const mapa = borrador.respuestas.sustancias || {};
    Object.keys(mapa).forEach(function (codigo) {
        const item = mapa[codigo];
        sustancias.push({
            formulario_id: formularioId,
            sustancia_codigo: codigo,
            ha_tomado: item.ha_tomado || null,
            primera_vez: item.primera_vez || null,
            detalle: item.detalle || null
        });
    });
    return { categorias: categorias, servicios: servicios, sustancias: sustancias };
}

function columnasPregunta() {
    return (window.VIBA_PREGUNTAS || [])
        .filter(function (pregunta) { return !PREGUNTAS_DETALLE[pregunta.id]; })
        .map(function (pregunta) { return pregunta.id; });
}

function contarRespuestasGuardadas(fila, detallePorFormulario) {
    let cantidad = 0;
    columnasPregunta().forEach(function (columna) {
        if (fila[columna] != null && fila[columna] !== '') cantidad += 1;
    });
    const detalle = detallePorFormulario[String(fila.id)] || { categorias: 0, servicios: 0, sustancias: 0 };
    return cantidad + detalle.categorias + detalle.servicios + detalle.sustancias;
}

async function leerConteoDetalle() {
    const resultado = await Promise.all([
        supabaseClient.from('formulario_categorias').select('*'),
        supabaseClient.from('formulario_servicios_feneser').select('*'),
        supabaseClient.from('formulario_sustancias').select('*')
    ]);
    const mapa = {};
    function sumar(filas, campo) {
        (filas || []).forEach(function (fila) {
            const clave = String(fila.formulario_id);
            if (!mapa[clave]) mapa[clave] = { categorias: 0, servicios: 0, sustancias: 0 };
            mapa[clave][campo] += 1;
        });
    }
    sumar(resultado[0].data, 'categorias');
    sumar(resultado[1].data, 'servicios');
    sumar(resultado[2].data, 'sustancias');
    return mapa;
}

async function guardarDiligenciamiento() {
    sincronizarContextoDesdeDom();
    const errorContexto = contextoValido();
    if (errorContexto) {
        mostrarAviso(errorContexto, 'error');
        return;
    }
    if (!Object.keys(borrador.respuestas).length) {
        mostrarAviso('Registre al menos una respuesta antes de guardar.', 'error');
        return;
    }

    const personaBeneficiaria = personaPorId(borrador.personaId);
    const personaDiligencia = borrador.diligenciaEsBeneficiaria === 'S'
        ? personaBeneficiaria
        : personaPorId(borrador.personaDiligenciaId);

    const registro = construirFilaFormulario(personaDiligencia);
    const { data: guardado, error } = await supabaseClient
        .from('formularios')
        .insert([registro])
        .select()
        .single();
    if (error || !guardado) {
        mostrarAviso('No se pudo guardar el diligenciamiento.', 'error');
        console.error(error);
        return;
    }

    const detalle = filasDetalle(guardado.id);
    if (detalle.categorias.length) {
        const r = await supabaseClient.from('formulario_categorias').insert(detalle.categorias);
        if (r.error) {
            mostrarAviso('El diligenciamiento quedó, pero fallaron las categorías emocionales.', 'error');
            console.error(r.error);
            cargarHistorial();
            return;
        }
    }
    if (detalle.servicios.length) {
        const r = await supabaseClient.from('formulario_servicios_feneser').insert(detalle.servicios);
        if (r.error) {
            mostrarAviso('El diligenciamiento quedó, pero fallaron los servicios FeneSer.', 'error');
            console.error(r.error);
            cargarHistorial();
            return;
        }
    }
    if (detalle.sustancias.length) {
        const r = await supabaseClient.from('formulario_sustancias').insert(detalle.sustancias);
        if (r.error) {
            mostrarAviso('El diligenciamiento quedó, pero fallaron las sustancias.', 'error');
            console.error(r.error);
            cargarHistorial();
            return;
        }
    }

    borrador.respuestas = {};
    guardarBorradorLocal();
    pintarPreguntas();
    pintarLista();
    mostrarAviso('Diligenciamiento guardado. Puede iniciar otro sin borrar el anterior.', 'ok');
    cargarHistorial();
}

async function cargarHistorial() {
    /* En sql.sql el diligenciamiento no trae created_at; se ordena por fecha e id. */
    const { data, error } = await supabaseClient.from('formularios').select('*').order('fecha_diligenciamiento', { ascending: false });
    const detallePorFormulario = await leerConteoDetalle();
    historialBody.innerHTML = '';
    if (error || !data || !data.length) {
        historialBody.innerHTML = '<tr><td colspan="6">Todavía no hay diligenciamientos guardados.</td></tr>';
        return;
    }
    data.forEach(function (fila) {
        const tr = document.createElement('tr');
        const cantidad = contarRespuestasGuardadas(fila, detallePorFormulario);
        const taller = talleresForm.find(function (item) { return String(item.id) === String(fila.taller_id); });
        tr.innerHTML =
            '<td>' + escapar(fila.fecha_diligenciamiento || '—') + '</td>' +
            '<td>' + escapar(etiquetaCatalogo('programa', fila.programa)) + '</td>' +
            '<td>' + escapar(taller ? taller.nombre : '—') + '</td>' +
            '<td>' + escapar(nombrePersona(fila.persona_id)) + '</td>' +
            '<td>' + cantidad + '</td>' +
            '<td class="actions-cell"><button type="button" class="btn-danger" data-eliminar-form="' + escapar(fila.id) + '">Eliminar</button></td>';
        historialBody.appendChild(tr);
    });
}

async function eliminarDetallesFormulario(formularioId) {
    await supabaseClient.from('formulario_categorias').delete().eq('formulario_id', formularioId);
    await supabaseClient.from('formulario_servicios_feneser').delete().eq('formulario_id', formularioId);
    await supabaseClient.from('formulario_sustancias').delete().eq('formulario_id', formularioId);
}

function etiquetaTaller(taller) {
    return taller.fecha_programada + ' · ' + taller.nombre;
}

/* Solo ofrece talleres del programa elegido. Si el borrador apunta a otro, se suelta. */
function pintarSelectorTaller() {
    const delPrograma = talleresForm.filter(function (taller) {
        return taller.programa === programaSelect.value;
    });
    const opciones = delPrograma.map(function (taller) {
        return [String(taller.id), etiquetaTaller(taller)];
    });
    const sigue = delPrograma.some(function (taller) { return String(taller.id) === String(borrador.tallerId); });
    if (!sigue) borrador.tallerId = '';
    llenarSelect(tallerSelect, opciones, opciones.length ? 'Sin taller' : 'No hay talleres de este programa');
    if (borrador.tallerId) tallerSelect.value = String(borrador.tallerId);
}

async function cargarTalleresFormulario() {
    const { data, error } = await supabaseClient.from('talleres').select('*');
    talleresForm = error ? [] : (data || []);
    talleresForm.sort(function (a, b) { return a.fecha_programada < b.fecha_programada ? -1 : 1; });
}

async function cargarPersonas() {
    const { data, error } = await supabaseClient.from('personas').select('*').order('nombre_apellidos', { ascending: true });
    personas = error ? [] : (data || []);
    const opciones = opcionesPersona();
    llenarSelect(personaSelect, opciones, personas.length ? 'Seleccione la persona' : 'No hay personas registradas');
    llenarSelect(personaDiligenciaSelect, opciones, 'Seleccione quién diligencia');
    if (borrador.personaId) personaSelect.value = borrador.personaId;
    if (borrador.personaDiligenciaId) personaDiligenciaSelect.value = borrador.personaDiligenciaId;
}

document.addEventListener('DOMContentLoaded', async function () {
    leerBorradorLocal();
    llenarSelect(programaSelect, window.VIBA_CATALOGOS.programa, 'Seleccione el programa');
    llenarSelect(diligenciaSelect, window.VIBA_CATALOGOS.sn, 'Seleccione');
    if (!fechaInput.value) fechaInput.value = borrador.fecha || hoyISO();
    if (borrador.programa) programaSelect.value = borrador.programa;
    if (borrador.fecha) fechaInput.value = borrador.fecha;
    diligenciaSelect.value = borrador.diligenciaEsBeneficiaria || 'S';

    await cargarPersonas();
    await cargarTalleresFormulario();
    pintarSelectorTaller();
    sincronizarContextoDesdeDom();
    depurarRespuestasAjenas();
    pintarPreguntas();
    pintarLista();
    cargarHistorial();

    programaSelect.addEventListener('change', function () {
        const anterior = borrador.programa;
        sincronizarContextoDesdeDom();
        const ajenas = Object.keys(borrador.respuestas).filter(function (id) {
            const pregunta = preguntaPorId(id);
            return !pregunta || pregunta.programas.indexOf(borrador.programa) === -1;
        });
        if (ajenas.length && !confirm('Al cambiar de programa se quitan las respuestas que no pertenecen al nuevo programa.')) {
            programaSelect.value = anterior;
            borrador.programa = anterior;
            return;
        }
        depurarRespuestasAjenas();
        pintarSelectorTaller();
        sincronizarContextoDesdeDom();
        guardarBorradorLocal();
        mostrarAviso('');
        pintarPreguntas();
        pintarLista();
    });

    [personaSelect, fechaInput, diligenciaSelect, personaDiligenciaSelect, tallerSelect].forEach(function (campo) {
        campo.addEventListener('change', function () {
            sincronizarContextoDesdeDom();
            guardarBorradorLocal();
        });
    });

    preguntaSelect.addEventListener('change', pintarControl);

    document.getElementById('btn-guardar-respuesta').addEventListener('click', function () {
        const pregunta = preguntaPorId(preguntaSelect.value);
        if (!pregunta) {
            mostrarAviso('Seleccione una pregunta.', 'error');
            return;
        }
        const leido = leerValor(pregunta);
        if (!leido.ok) {
            mostrarAviso(leido.mensaje, 'error');
            return;
        }
        borrador.respuestas[pregunta.id] = leido.valor;
        depurarRespuestasAjenas();
        guardarBorradorLocal();
        mostrarAviso('');
        pintarPreguntas();
        pintarLista();
    });

    document.getElementById('btn-guardar-diligenciamiento').addEventListener('click', guardarDiligenciamiento);

    document.getElementById('btn-limpiar').addEventListener('click', function () {
        if (Object.keys(borrador.respuestas).length && !confirm('¿Limpiar las respuestas de este diligenciamiento?')) return;
        borrador.respuestas = {};
        guardarBorradorLocal();
        mostrarAviso('');
        pintarPreguntas();
        pintarLista();
    });

    listaRespuestas.addEventListener('click', function (evento) {
        const boton = evento.target.closest('[data-quitar]');
        if (!boton) return;
        delete borrador.respuestas[boton.dataset.quitar];
        depurarRespuestasAjenas();
        guardarBorradorLocal();
        pintarPreguntas();
        pintarLista();
    });

    historialBody.addEventListener('click', async function (evento) {
        const boton = evento.target.closest('[data-eliminar-form]');
        if (!boton) return;
        if (!confirm('¿Eliminar este diligenciamiento?')) return;
        const valoraciones = await supabaseClient.from('valoraciones').select('*');
        const usada = (valoraciones.data || []).some(function (fila) {
            return String(fila.formulario_id) === String(boton.dataset.eliminarForm);
        });
        if (usada) {
            mostrarAviso('Este diligenciamiento está ligado a una valoración. No se elimina.', 'error');
            return;
        }
        const formularioId = boton.dataset.eliminarForm;
        await eliminarDetallesFormulario(formularioId);
        const { error } = await supabaseClient.from('formularios').delete().eq('id', formularioId);
        if (error) {
            mostrarAviso('No se pudo eliminar.', 'error');
            return;
        }
        cargarHistorial();
    });
});
