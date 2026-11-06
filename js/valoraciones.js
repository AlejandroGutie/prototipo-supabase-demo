/* Valoración del profesional sobre la persona.
   El tipo es previa, de seguimiento o de cierre.
   Estado emocional y estado físico se guardan en campos distintos.
   Las cinco escalas son enteros de 0 a 10. Bienestar no se mezcla con las otras.
   Si hay taller, su programa tiene que coincidir con el de la valoración.
   Si hay diligenciamiento, tiene que ser de la misma persona. */

let valoraciones = [];
let personas = [];
let profesionales = [];
let talleres = [];
let formularios = [];

const form = document.getElementById('val-form');
const idInput = document.getElementById('val-id');
const personaSelect = document.getElementById('val-persona');
const profesionalSelect = document.getElementById('val-profesional');
const fechaInput = document.getElementById('val-fecha');
const tipoSelect = document.getElementById('val-tipo');
const programaSelect = document.getElementById('val-programa');
const modalidadSelect = document.getElementById('val-modalidad');
const tallerSelect = document.getElementById('val-taller');
const formularioSelect = document.getElementById('val-formulario');
const motivoInput = document.getElementById('val-motivo');
const objetivoInput = document.getElementById('val-objetivo');
const emocionalInput = document.getElementById('val-emocional');
const fisicoInput = document.getElementById('val-fisico');
const animoInput = document.getElementById('val-animo');
const ansiedadInput = document.getElementById('val-ansiedad');
const suenoInput = document.getElementById('val-sueno');
const dolorInput = document.getElementById('val-dolor');
const bienestarInput = document.getElementById('val-bienestar');
const riesgosInput = document.getElementById('val-riesgos');
const recomendacionesInput = document.getElementById('val-recomendaciones');
const conceptoSelect = document.getElementById('val-concepto');
const seguimientoSelect = document.getElementById('val-seguimiento');
const filaProxima = document.getElementById('fila-proxima');
const proximaInput = document.getElementById('val-proxima');
const notasInput = document.getElementById('val-notas');
const aviso = document.getElementById('aviso-val');
const cuerpo = document.getElementById('val-body');
const titulo = document.getElementById('titulo-valoracion');
const btnGuardar = document.getElementById('btn-guardar');
const btnCancelar = document.getElementById('btn-cancelar');

const ESCALAS = [
    [animoInput, 'Ánimo', 'escala_animo'],
    [ansiedadInput, 'Ansiedad', 'escala_ansiedad'],
    [suenoInput, 'Sueño', 'escala_sueno'],
    [dolorInput, 'Dolor', 'escala_dolor_eva'],
    [bienestarInput, 'Bienestar', 'escala_bienestar']
];

function escapar(texto) {
    return String(texto == null ? '' : texto)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

function etiqueta(catalogo, codigo) {
    if (!codigo) return '—';
    const par = (window.VIBA_CATALOGOS[catalogo] || []).find(function (fila) {
        return fila[0] === codigo;
    });
    return par ? par[1] : codigo;
}

function llenarSelect(select, opciones, placeholder) {
    const actual = select.value;
    select.innerHTML = '';
    const vacio = document.createElement('option');
    vacio.value = '';
    vacio.textContent = placeholder;
    select.appendChild(vacio);
    opciones.forEach(function (par) {
        const opcion = document.createElement('option');
        opcion.value = par[0];
        opcion.textContent = par[1];
        select.appendChild(opcion);
    });
    if ([...select.options].some(function (opcion) { return opcion.value === actual; })) {
        select.value = actual;
    }
}

function mostrarAviso(texto, tipo) {
    aviso.textContent = texto || '';
    aviso.className = 'aviso' + (texto ? ' ' + tipo : '');
}

function hoyISO() {
    const hoy = new Date();
    const mes = String(hoy.getMonth() + 1).padStart(2, '0');
    const dia = String(hoy.getDate()).padStart(2, '0');
    return hoy.getFullYear() + '-' + mes + '-' + dia;
}

function porId(lista, id) {
    return lista.find(function (fila) { return String(fila.id) === String(id); }) || null;
}

function nombrePersona(id) {
    const persona = porId(personas, id);
    return persona ? persona.nombre_apellidos : 'Persona ' + id;
}

function nombreProfesional(id) {
    const profesional = porId(profesionales, id);
    return profesional ? profesional.nombre : 'Profesional ' + id;
}

function textoONull(valor) {
    const limpio = String(valor || '').trim();
    return limpio || null;
}

function mostrarProxima() {
    const pide = seguimientoSelect.value === 'S';
    filaProxima.classList.toggle('oculto', !pide);
    if (!pide) proximaInput.value = '';
}

function opcionesProfesional(incluirId) {
    return profesionales
        .filter(function (profesional) {
            return profesional.activo === 'S' || String(profesional.id) === String(incluirId || '');
        })
        .map(function (profesional) {
            const nota = profesional.activo === 'N' ? ' (inactivo)' : '';
            return [String(profesional.id), profesional.nombre + nota];
        });
}

function pintarPersonas() {
    const opciones = personas.map(function (persona) {
        return [String(persona.id), persona.nombre_apellidos];
    });
    llenarSelect(personaSelect, opciones, personas.length ? 'Seleccione' : 'Primero registre una persona');
}

function pintarProfesionales(incluirId) {
    const opciones = opcionesProfesional(incluirId);
    llenarSelect(profesionalSelect, opciones, opciones.length ? 'Seleccione' : 'Primero registre un profesional en Talleres');
}

function pintarTalleres() {
    const programa = programaSelect.value;
    const lista = talleres.filter(function (taller) {
        return !programa || taller.programa === programa;
    });
    const opciones = lista.map(function (taller) {
        return [String(taller.id), taller.fecha_programada + ' · ' + taller.nombre];
    });
    const placeholder = programa && !lista.length ? 'No hay talleres de este programa' : 'Sin taller';
    llenarSelect(tallerSelect, opciones, placeholder);
}

function pintarFormularios() {
    const personaId = personaSelect.value;
    const lista = formularios.filter(function (fila) {
        return personaId && String(fila.persona_id) === String(personaId);
    });
    const opciones = lista.map(function (fila) {
        return [String(fila.id), fila.fecha_diligenciamiento + ' · ' + etiqueta('programa', fila.programa)];
    });
    const placeholder = personaId && !lista.length ? 'Esta persona no tiene diligenciamientos' : 'Sin diligenciamiento';
    llenarSelect(formularioSelect, opciones, placeholder);
}

function pintarLista() {
    cuerpo.innerHTML = '';
    if (!valoraciones.length) {
        cuerpo.innerHTML = '<tr><td colspan="7">Todavía no hay valoraciones.</td></tr>';
        return;
    }
    valoraciones.forEach(function (fila) {
        const tr = document.createElement('tr');
        if (String(fila.id) === String(idInput.value)) tr.className = 'fila-activa';
        tr.innerHTML =
            '<td>' + escapar(fila.fecha) + '</td>' +
            '<td>' + escapar(etiqueta('tipoValoracion', fila.tipo)) + '</td>' +
            '<td>' + escapar(nombrePersona(fila.persona_id)) + '</td>' +
            '<td>' + escapar(nombreProfesional(fila.profesional_id)) + '</td>' +
            '<td>' + escapar(etiqueta('programa', fila.programa)) + '</td>' +
            '<td>' + escapar(etiqueta('aceptacion', fila.concepto)) + '</td>' +
            '<td class="actions-cell">' +
                '<button type="button" class="btn-warning" data-editar="' + fila.id + '">Editar</button>' +
                '<button type="button" class="btn-danger" data-eliminar="' + fila.id + '">Eliminar</button>' +
            '</td>';
        cuerpo.appendChild(tr);
    });
}

async function leerTablas() {
    const resultado = await Promise.all([
        supabaseClient.from('valoraciones').select('*'),
        supabaseClient.from('personas').select('*'),
        supabaseClient.from('profesionales').select('*'),
        supabaseClient.from('talleres').select('*'),
        supabaseClient.from('formularios').select('*')
    ]);
    valoraciones = resultado[0].data || [];
    personas = resultado[1].data || [];
    profesionales = resultado[2].data || [];
    talleres = resultado[3].data || [];
    formularios = resultado[4].data || [];
    valoraciones.sort(function (a, b) {
        if (a.fecha === b.fecha) return Number(b.id) - Number(a.id);
        return a.fecha < b.fecha ? 1 : -1;
    });
    personas.sort(function (a, b) { return a.nombre_apellidos.localeCompare(b.nombre_apellidos, 'es'); });
    profesionales.sort(function (a, b) { return a.nombre.localeCompare(b.nombre, 'es'); });
}

function limpiar() {
    idInput.value = '';
    form.reset();
    titulo.textContent = 'Registrar valoración';
    btnGuardar.textContent = 'Guardar valoración';
    btnCancelar.classList.add('oculto');
    pintarProfesionales('');
    pintarTalleres();
    pintarFormularios();
    mostrarProxima();
    mostrarAviso('');
    pintarLista();
}

function leerEscala(input, nombre) {
    const texto = input.value.trim();
    if (!texto) return { ok: true, valor: null };
    if (!/^\d+$/.test(texto)) {
        return { ok: false, mensaje: nombre + ' va de 0 a 10, en números enteros.' };
    }
    const numero = Number(texto);
    if (numero > 10) {
        return { ok: false, mensaje: nombre + ' va de 0 a 10, en números enteros.' };
    }
    return { ok: true, valor: numero };
}

function leerValoracion() {
    const persona = porId(personas, personaSelect.value);
    if (!persona) return { ok: false, mensaje: 'Elija la persona que se valora.' };
    const profesional = porId(profesionales, profesionalSelect.value);
    if (!profesional) return { ok: false, mensaje: 'Elija el profesional que valora.' };
    const actual = porId(valoraciones, idInput.value);
    const mismoProfesional = actual && String(actual.profesional_id) === String(profesional.id);
    if (profesional.activo !== 'S' && !mismoProfesional) {
        return { ok: false, mensaje: 'Ese profesional está inactivo. Elija uno activo.' };
    }
    if (!fechaInput.value) return { ok: false, mensaje: 'Indique la fecha de la valoración.' };
    if (fechaInput.value > hoyISO()) return { ok: false, mensaje: 'La fecha de la valoración no puede ser futura.' };
    if (!tipoSelect.value) return { ok: false, mensaje: 'Elija si es previa, de seguimiento o de cierre.' };

    const taller = tallerSelect.value ? porId(talleres, tallerSelect.value) : null;
    if (tallerSelect.value && !taller) return { ok: false, mensaje: 'El taller elegido ya no está disponible.' };
    if (taller && programaSelect.value && taller.programa !== programaSelect.value) {
        return { ok: false, mensaje: 'El taller no corresponde al programa elegido.' };
    }

    const formulario = formularioSelect.value ? porId(formularios, formularioSelect.value) : null;
    if (formularioSelect.value && !formulario) {
        return { ok: false, mensaje: 'El diligenciamiento elegido ya no está disponible.' };
    }
    if (formulario && String(formulario.persona_id) !== String(persona.id)) {
        return { ok: false, mensaje: 'El diligenciamiento no es de esta persona.' };
    }

    const escalas = {};
    for (const grupo of ESCALAS) {
        const leido = leerEscala(grupo[0], grupo[1]);
        if (!leido.ok) return leido;
        escalas[grupo[2]] = leido.valor;
    }

    if (seguimientoSelect.value === 'S' && !proximaInput.value) {
        return { ok: false, mensaje: 'Si requiere seguimiento, indique la próxima fecha.' };
    }
    if (seguimientoSelect.value === 'S' && proximaInput.value < fechaInput.value) {
        return { ok: false, mensaje: 'La próxima fecha no puede ser anterior a la valoración.' };
    }

    return {
        ok: true,
        datos: {
            persona_id: Number(persona.id),
            profesional_id: Number(profesional.id),
            taller_id: taller ? Number(taller.id) : null,
            formulario_id: formulario ? Number(formulario.id) : null,
            fecha: fechaInput.value,
            tipo: tipoSelect.value,
            programa: programaSelect.value || null,
            modalidad: modalidadSelect.value || null,
            motivo: textoONull(motivoInput.value),
            objetivo: textoONull(objetivoInput.value),
            estado_emocional: textoONull(emocionalInput.value),
            estado_fisico: textoONull(fisicoInput.value),
            escala_animo: escalas.escala_animo,
            escala_ansiedad: escalas.escala_ansiedad,
            escala_sueno: escalas.escala_sueno,
            escala_dolor_eva: escalas.escala_dolor_eva,
            escala_bienestar: escalas.escala_bienestar,
            riesgos: textoONull(riesgosInput.value),
            recomendaciones: textoONull(recomendacionesInput.value),
            concepto: conceptoSelect.value || null,
            requiere_seguimiento: seguimientoSelect.value || null,
            proxima_fecha: seguimientoSelect.value === 'S' ? proximaInput.value : null,
            notas: textoONull(notasInput.value)
        }
    };
}

function cargar(id) {
    const fila = porId(valoraciones, id);
    if (!fila) return;
    idInput.value = fila.id;
    personaSelect.value = String(fila.persona_id);
    pintarProfesionales(fila.profesional_id);
    profesionalSelect.value = String(fila.profesional_id);
    fechaInput.value = fila.fecha;
    tipoSelect.value = fila.tipo;
    programaSelect.value = fila.programa || '';
    modalidadSelect.value = fila.modalidad || '';
    pintarTalleres();
    tallerSelect.value = fila.taller_id ? String(fila.taller_id) : '';
    pintarFormularios();
    formularioSelect.value = fila.formulario_id ? String(fila.formulario_id) : '';
    motivoInput.value = fila.motivo || '';
    objetivoInput.value = fila.objetivo || '';
    emocionalInput.value = fila.estado_emocional || '';
    fisicoInput.value = fila.estado_fisico || '';
    animoInput.value = fila.escala_animo == null ? '' : fila.escala_animo;
    ansiedadInput.value = fila.escala_ansiedad == null ? '' : fila.escala_ansiedad;
    suenoInput.value = fila.escala_sueno == null ? '' : fila.escala_sueno;
    dolorInput.value = fila.escala_dolor_eva == null ? '' : fila.escala_dolor_eva;
    bienestarInput.value = fila.escala_bienestar == null ? '' : fila.escala_bienestar;
    riesgosInput.value = fila.riesgos || '';
    recomendacionesInput.value = fila.recomendaciones || '';
    conceptoSelect.value = fila.concepto || '';
    seguimientoSelect.value = fila.requiere_seguimiento || '';
    mostrarProxima();
    proximaInput.value = fila.proxima_fecha || '';
    titulo.textContent = 'Editar valoración';
    btnGuardar.textContent = 'Actualizar';
    btnCancelar.classList.remove('oculto');
    mostrarAviso('');
    pintarLista();
    form.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

async function eliminar(id) {
    if (!confirm('¿Eliminar esta valoración?')) return;
    const { error } = await supabaseClient.from('valoraciones').delete().eq('id', id);
    if (error) {
        mostrarAviso('No se pudo eliminar la valoración.', 'error');
        return;
    }
    if (String(idInput.value) === String(id)) {
        limpiar();
    }
    await leerTablas();
    pintarLista();
    mostrarAviso('Valoración eliminada.', 'ok');
}

document.addEventListener('DOMContentLoaded', async function () {
    const catalogos = window.VIBA_CATALOGOS;
    llenarSelect(tipoSelect, catalogos.tipoValoracion, 'Seleccione');
    llenarSelect(programaSelect, catalogos.programa, 'Sin programa');
    llenarSelect(modalidadSelect, catalogos.modalidad, 'Sin modalidad');
    llenarSelect(conceptoSelect, catalogos.aceptacion, 'Sin concepto');
    llenarSelect(seguimientoSelect, catalogos.sn, 'Sin definir');

    await leerTablas();
    pintarPersonas();
    pintarProfesionales('');
    pintarTalleres();
    pintarFormularios();
    pintarLista();

    personaSelect.addEventListener('change', pintarFormularios);
    programaSelect.addEventListener('change', function () {
        pintarTalleres();
        if (tallerSelect.value) return;
        mostrarAviso('');
    });
    seguimientoSelect.addEventListener('change', mostrarProxima);
    btnCancelar.addEventListener('click', limpiar);

    form.addEventListener('submit', async function (evento) {
        evento.preventDefault();
        const leido = leerValoracion();
        if (!leido.ok) {
            mostrarAviso(leido.mensaje, 'error');
            return;
        }
        const id = idInput.value;
        const consulta = id
            ? supabaseClient.from('valoraciones').update(leido.datos).eq('id', id)
            : supabaseClient.from('valoraciones').insert([leido.datos]);
        const { error } = await consulta;
        if (error) {
            mostrarAviso('No se pudo guardar la valoración.', 'error');
            return;
        }
        await leerTablas();
        limpiar();
        mostrarAviso(id ? 'Valoración actualizada.' : 'Valoración guardada.', 'ok');
    });

    cuerpo.addEventListener('click', async function (evento) {
        const editar = evento.target.closest('[data-editar]');
        if (editar) {
            cargar(editar.dataset.editar);
            return;
        }
        const quitar = evento.target.closest('[data-eliminar]');
        if (quitar) await eliminar(quitar.dataset.eliminar);
    });
});
