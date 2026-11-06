/* Talleres del modelo: profesional, su agenda, el taller y la inscripción.
   La persona sale del módulo Personas. Un taller se puede vincular luego en Formularios.
   Inscrita y Asistió ocupan cupo. Lista de espera y Cancelada no. */

const ESTADOS_CON_CUPO = { INSCRITA: true, ASISTIO: true };

/* Programas que el modelo cuenta como acompañamiento (v_profesional_actividad). */
const PROGRAMAS_ACOMPANAMIENTO = {
    ASA: true,
    ADAM: true,
    ANIMK: true,
    RENASER: true,
    FENESER: true,
    MICRODOSIS: true
};

let profesionales = [];
let disponibilidades = [];
let talleres = [];
let inscripciones = [];
let personas = [];
let valoraciones = [];
let profesionalActivoId = '';
let tallerActivoId = '';

const profForm = document.getElementById('prof-form');
const profIdInput = document.getElementById('prof-id');
const profNombre = document.getElementById('prof-nombre');
const profEmail = document.getElementById('prof-email');
const profTelefono = document.getElementById('prof-telefono');
const profActivo = document.getElementById('prof-activo');
const profBody = document.getElementById('prof-body');
const avisoProf = document.getElementById('aviso-prof');

const panelAgenda = document.getElementById('panel-agenda');
const tituloAgenda = document.getElementById('titulo-agenda');
const dispForm = document.getElementById('disp-form');
const dispIdInput = document.getElementById('disp-id');
const dispFecha = document.getElementById('disp-fecha');
const dispInicio = document.getElementById('disp-inicio');
const dispFin = document.getElementById('disp-fin');
const dispModalidad = document.getElementById('disp-modalidad');
const dispBody = document.getElementById('disp-body');
const avisoAgenda = document.getElementById('aviso-agenda');

const tallerForm = document.getElementById('taller-form');
const tallerIdInput = document.getElementById('taller-id');
const tallerNombre = document.getElementById('taller-nombre');
const tallerPrograma = document.getElementById('taller-programa');
const tallerFecha = document.getElementById('taller-fecha');
const tallerLugar = document.getElementById('taller-lugar');
const tallerCupo = document.getElementById('taller-cupo');
const tallerProfesional = document.getElementById('taller-profesional');
const tallerBody = document.getElementById('taller-body');
const avisoTaller = document.getElementById('aviso-taller');

const panelInscripcion = document.getElementById('panel-inscripcion');
const tituloInscripcion = document.getElementById('titulo-inscripcion');
const textoCupo = document.getElementById('texto-cupo');
const inscForm = document.getElementById('insc-form');
const inscIdInput = document.getElementById('insc-id');
const inscPersona = document.getElementById('insc-persona');
const inscFecha = document.getElementById('insc-fecha');
const inscEstado = document.getElementById('insc-estado');
const inscBody = document.getElementById('insc-body');
const avisoInsc = document.getElementById('aviso-insc');

function escapar(valor) {
    return String(valor ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

function etiqueta(clave, codigo) {
    const par = (window.VIBA_CATALOGOS[clave] || []).find(function (item) { return item[0] === codigo; });
    return par ? par[1] : (codigo || '—');
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

function aviso(nodo, texto, tipo) {
    nodo.textContent = texto || '';
    nodo.className = 'aviso' + (tipo ? ' ' + tipo : '');
}

function hoyISO() {
    const hoy = new Date();
    const mes = String(hoy.getMonth() + 1).padStart(2, '0');
    const dia = String(hoy.getDate()).padStart(2, '0');
    return hoy.getFullYear() + '-' + mes + '-' + dia;
}

function soloDigitos(valor) {
    return String(valor || '').replace(/\D/g, '');
}

function correoValido(valor) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(valor);
}

function porId(lista, id) {
    return lista.find(function (fila) { return String(fila.id) === String(id); });
}

function nombrePersona(id) {
    const persona = porId(personas, id);
    if (!persona) return '—';
    return persona.tipo_documento + ' ' + persona.numero_documento + ' · ' + persona.nombre_apellidos;
}

function nombreProfesional(id) {
    const profesional = porId(profesionales, id);
    return profesional ? profesional.nombre : 'Sin responsable';
}

/* Inscrita y Asistió ocupan un lugar. Espera y Cancelada no. */
function ocupaCupo(estado) {
    return !!ESTADOS_CON_CUPO[estado];
}

function cupoOcupado(tallerId, ignorarId) {
    return inscripciones.filter(function (fila) {
        return String(fila.taller_id) === String(tallerId) &&
            String(fila.id) !== String(ignorarId || '') &&
            ocupaCupo(fila.estado);
    }).length;
}

function horariosDelProfesional(profesionalId) {
    return disponibilidades
        .filter(function (fila) { return String(fila.profesional_id) === String(profesionalId); })
        .sort(function (a, b) {
            if (a.fecha !== b.fecha) return a.fecha < b.fecha ? -1 : 1;
            return a.hora_inicio < b.hora_inicio ? -1 : 1;
        });
}

function horaCorta(valor) {
    return String(valor || '').slice(0, 5);
}

function seCruzan(inicioA, finA, inicioB, finB) {
    return inicioA < finB && inicioB < finA;
}

/* Devuelve 'repetido', 'cruzado' o cadena vacía. No usa some(): some solo dice sí o no. */
function horarioRepetidoOCruzado(datos, ignorarId) {
    const delDia = horariosDelProfesional(datos.profesional_id).filter(function (fila) {
        return String(fila.id) !== String(ignorarId || '') && fila.fecha === datos.fecha;
    });
    const repetido = delDia.some(function (fila) {
        return horaCorta(fila.hora_inicio) === datos.hora_inicio && fila.modalidad === datos.modalidad;
    });
    if (repetido) return 'repetido';
    const cruzado = delDia.some(function (fila) {
        return seCruzan(datos.hora_inicio, datos.hora_fin, horaCorta(fila.hora_inicio), horaCorta(fila.hora_fin));
    });
    return cruzado ? 'cruzado' : '';
}

async function leerTablas() {
    const resultado = await Promise.all([
        supabaseClient.from('profesionales').select('*'),
        supabaseClient.from('disponibilidades').select('*'),
        supabaseClient.from('talleres').select('*'),
        supabaseClient.from('inscripciones').select('*'),
        supabaseClient.from('personas').select('*'),
        supabaseClient.from('valoraciones').select('*')
    ]);
    profesionales = resultado[0].data || [];
    disponibilidades = resultado[1].data || [];
    talleres = resultado[2].data || [];
    inscripciones = resultado[3].data || [];
    personas = resultado[4].data || [];
    valoraciones = resultado[5].data || [];
    profesionales.sort(function (a, b) { return a.nombre.localeCompare(b.nombre, 'es'); });
    talleres.sort(function (a, b) { return a.fecha_programada < b.fecha_programada ? -1 : 1; });
    personas.sort(function (a, b) { return a.nombre_apellidos.localeCompare(b.nombre_apellidos, 'es'); });
}

function pintarProfesionales() {
    profBody.innerHTML = '';
    if (!profesionales.length) {
        profBody.innerHTML = '<tr><td colspan="7">Todavía no hay profesionales.</td></tr>';
        return;
    }
    profesionales.forEach(function (profesional) {
        const aCargo = talleres.filter(function (taller) {
            return String(taller.profesional_id) === String(profesional.id);
        }).length;
        const propias = valoraciones.filter(function (fila) {
            return String(fila.profesional_id) === String(profesional.id);
        });
        const cantidadValoraciones = propias.length;
        const cantidadAcompanamientos = propias.filter(function (fila) {
            return PROGRAMAS_ACOMPANAMIENTO[fila.programa];
        }).length;
        const tr = document.createElement('tr');
        if (String(profesional.id) === String(profesionalActivoId)) tr.className = 'fila-activa';
        tr.innerHTML =
            '<td><strong>' + escapar(profesional.nombre) + '</strong></td>' +
            '<td>' + escapar(profesional.email || '—') + '<br>' + escapar(profesional.telefono || '—') + '</td>' +
            '<td>' + escapar(etiqueta('sn', profesional.activo)) + '</td>' +
            '<td>' + aCargo + '</td>' +
            '<td>' + cantidadAcompanamientos + '</td>' +
            '<td>' + cantidadValoraciones + '</td>' +
            '<td class="actions-cell">' +
                '<button type="button" class="btn-warning" data-editar-prof="' + profesional.id + '">Editar</button>' +
                '<button type="button" class="btn-secondary" data-agenda="' + profesional.id + '">Agenda</button>' +
                '<button type="button" class="btn-danger" data-eliminar-prof="' + profesional.id + '">Eliminar</button>' +
            '</td>';
        profBody.appendChild(tr);
    });
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

function pintarSelectorProfesional() {
    const incluir = tallerProfesional.value || tallerIdInput.value && (porId(talleres, tallerIdInput.value) || {}).profesional_id;
    llenarSelect(tallerProfesional, opcionesProfesional(incluir), 'Sin responsable');
}

function pintarTalleres() {
    tallerBody.innerHTML = '';
    if (!talleres.length) {
        tallerBody.innerHTML = '<tr><td colspan="6">Todavía no hay talleres.</td></tr>';
        return;
    }
    talleres.forEach(function (taller) {
        const ocupados = cupoOcupado(taller.id);
        const cupo = taller.cupo == null ? 'Sin límite' : ocupados + ' / ' + taller.cupo;
        const tr = document.createElement('tr');
        if (String(taller.id) === String(tallerActivoId)) tr.className = 'fila-activa';
        tr.innerHTML =
            '<td>' + escapar(taller.fecha_programada) + '</td>' +
            '<td><strong>' + escapar(taller.nombre) + '</strong>' +
                (taller.lugar ? '<br>' + escapar(taller.lugar) : '') + '</td>' +
            '<td>' + escapar(etiqueta('programa', taller.programa)) + '</td>' +
            '<td>' + escapar(cupo) + '</td>' +
            '<td>' + escapar(nombreProfesional(taller.profesional_id)) + '</td>' +
            '<td class="actions-cell">' +
                '<button type="button" class="btn-warning" data-editar-taller="' + taller.id + '">Editar</button>' +
                '<button type="button" class="btn-secondary" data-inscripciones="' + taller.id + '">Inscripciones</button>' +
                '<button type="button" class="btn-danger" data-eliminar-taller="' + taller.id + '">Eliminar</button>' +
            '</td>';
        tallerBody.appendChild(tr);
    });
}

function pintarAgenda() {
    const profesional = porId(profesionales, profesionalActivoId);
    if (!profesional) {
        panelAgenda.classList.add('oculto');
        return;
    }
    panelAgenda.classList.remove('oculto');
    tituloAgenda.textContent = 'Agenda de ' + profesional.nombre;
    const filas = horariosDelProfesional(profesional.id);
    dispBody.innerHTML = '';
    if (!filas.length) {
        dispBody.innerHTML = '<tr><td colspan="5">Sin horarios en esta agenda.</td></tr>';
        return;
    }
    filas.forEach(function (fila) {
        const tr = document.createElement('tr');
        tr.innerHTML =
            '<td>' + escapar(fila.fecha) + '</td>' +
            '<td>' + escapar(fila.hora_inicio) + '</td>' +
            '<td>' + escapar(fila.hora_fin) + '</td>' +
            '<td>' + escapar(etiqueta('modalidad', fila.modalidad)) + '</td>' +
            '<td class="actions-cell">' +
                '<button type="button" class="btn-warning" data-editar-disp="' + fila.id + '">Editar</button>' +
                '<button type="button" class="btn-danger" data-eliminar-disp="' + fila.id + '">Quitar</button>' +
            '</td>';
        dispBody.appendChild(tr);
    });
}

function pintarInscripciones() {
    const taller = porId(talleres, tallerActivoId);
    if (!taller) {
        panelInscripcion.classList.add('oculto');
        return;
    }
    panelInscripcion.classList.remove('oculto');
    tituloInscripcion.textContent = 'Inscripciones · ' + taller.nombre;
    const ocupados = cupoOcupado(taller.id);
    textoCupo.textContent = taller.cupo == null
        ? 'Este taller no tiene límite de cupo. Hay ' + ocupados + ' con lugar confirmado.'
        : 'Cupo ' + ocupados + ' de ' + taller.cupo + '. Lista de espera y canceladas no ocupan lugar.';

    const opciones = personas.map(function (persona) {
        return [String(persona.id), nombrePersona(persona.id)];
    });
    llenarSelect(inscPersona, opciones, personas.length ? 'Seleccione la persona' : 'Primero registre la persona');

    const filas = inscripciones
        .filter(function (fila) { return String(fila.taller_id) === String(taller.id); })
        .sort(function (a, b) { return a.fecha_inscripcion < b.fecha_inscripcion ? -1 : 1; });
    inscBody.innerHTML = '';
    if (!filas.length) {
        inscBody.innerHTML = '<tr><td colspan="4">Nadie está inscrito en este taller.</td></tr>';
        return;
    }
    filas.forEach(function (fila) {
        const tr = document.createElement('tr');
        tr.innerHTML =
            '<td>' + escapar(nombrePersona(fila.persona_id)) + '</td>' +
            '<td>' + escapar(fila.fecha_inscripcion) + '</td>' +
            '<td>' + escapar(etiqueta('estadoInscripcion', fila.estado)) + '</td>' +
            '<td class="actions-cell">' +
                '<button type="button" class="btn-warning" data-editar-insc="' + fila.id + '">Editar</button>' +
                '<button type="button" class="btn-danger" data-eliminar-insc="' + fila.id + '">Quitar</button>' +
            '</td>';
        inscBody.appendChild(tr);
    });
}

function pintarTodo() {
    pintarProfesionales();
    pintarSelectorProfesional();
    pintarTalleres();
    pintarAgenda();
    pintarInscripciones();
}

function limpiarProfesional() {
    profIdInput.value = '';
    profForm.reset();
    profActivo.value = 'S';
    document.getElementById('titulo-profesional').textContent = 'Registrar profesional';
    document.getElementById('btn-guardar-prof').textContent = 'Guardar';
    document.getElementById('btn-cancelar-prof').classList.add('oculto');
    aviso(avisoProf, '');
}

function limpiarDisponibilidad() {
    dispIdInput.value = '';
    dispForm.reset();
    document.getElementById('btn-guardar-disp').textContent = 'Guardar horario';
    document.getElementById('btn-cancelar-disp').classList.add('oculto');
    aviso(avisoAgenda, '');
}

function limpiarTaller() {
    tallerIdInput.value = '';
    tallerForm.reset();
    document.getElementById('titulo-taller').textContent = 'Registrar taller';
    document.getElementById('btn-guardar-taller').textContent = 'Guardar';
    document.getElementById('btn-cancelar-taller').classList.add('oculto');
    pintarSelectorProfesional();
    aviso(avisoTaller, '');
}

function limpiarInscripcion() {
    inscIdInput.value = '';
    inscFecha.value = hoyISO();
    inscEstado.value = 'INSCRITA';
    inscPersona.value = '';
    document.getElementById('btn-guardar-insc').textContent = 'Guardar inscripción';
    document.getElementById('btn-cancelar-insc').classList.add('oculto');
    aviso(avisoInsc, '');
}

function leerProfesional() {
    const nombre = profNombre.value.trim();
    const correo = profEmail.value.trim();
    const telefono = soloDigitos(profTelefono.value);
    if (!nombre) return { ok: false, mensaje: 'Escriba el nombre del profesional.' };
    if (!profActivo.value) return { ok: false, mensaje: 'Indique si está activo.' };
    if (correo && !correoValido(correo)) return { ok: false, mensaje: 'El correo no tiene un formato válido.' };
    if (telefono && Number(telefono) <= 0) return { ok: false, mensaje: 'El teléfono debe ser mayor que cero.' };
    return {
        ok: true,
        datos: {
            nombre: nombre,
            email: correo,
            telefono: telefono ? Number(telefono) : null,
            activo: profActivo.value
        }
    };
}

function leerDisponibilidad() {
    const datos = {
        profesional_id: Number(profesionalActivoId),
        fecha: dispFecha.value,
        hora_inicio: horaCorta(dispInicio.value),
        hora_fin: horaCorta(dispFin.value),
        modalidad: dispModalidad.value
    };
    if (!datos.profesional_id) return { ok: false, mensaje: 'Elija primero la agenda de un profesional.' };
    if (!datos.fecha || !datos.hora_inicio || !datos.hora_fin || !datos.modalidad) {
        return { ok: false, mensaje: 'Fecha, horario y modalidad son obligatorios.' };
    }
    if (datos.hora_fin <= datos.hora_inicio) {
        return { ok: false, mensaje: 'La hora de fin tiene que ser posterior a la de inicio.' };
    }
    const conflicto = horarioRepetidoOCruzado(datos, dispIdInput.value);
    if (conflicto === 'repetido') {
        return { ok: false, mensaje: 'Ya existe ese inicio, esa fecha y esa modalidad.' };
    }
    if (conflicto === 'cruzado') {
        return { ok: false, mensaje: 'Ese horario se cruza con otro del mismo día.' };
    }
    return { ok: true, datos: datos };
}

function leerTaller() {
    const nombre = tallerNombre.value.trim();
    const cupoTexto = tallerCupo.value.trim();
    let cupo = null;
    if (!nombre) return { ok: false, mensaje: 'Escriba el nombre del taller.' };
    if (!tallerPrograma.value) return { ok: false, mensaje: 'Elija el programa.' };
    if (!tallerFecha.value) return { ok: false, mensaje: 'Indique la fecha programada.' };
    if (cupoTexto) {
        if (!/^\d+$/.test(cupoTexto) || Number(cupoTexto) < 1) {
            return { ok: false, mensaje: 'El cupo, si se escribe, es un entero mayor que cero.' };
        }
        cupo = Number(cupoTexto);
        const ocupados = cupoOcupado(tallerIdInput.value);
        if (tallerIdInput.value && ocupados > cupo) {
            return { ok: false, mensaje: 'El cupo no puede ser menor que los ' + ocupados + ' lugares ya ocupados.' };
        }
    }
    const responsable = tallerProfesional.value;
    if (responsable) {
        const profesional = porId(profesionales, responsable);
        if (!profesional) return { ok: false, mensaje: 'El profesional responsable no existe.' };
        if (profesional.activo !== 'S' && String(profesional.id) !== String((porId(talleres, tallerIdInput.value) || {}).profesional_id)) {
            return { ok: false, mensaje: 'El responsable tiene que estar activo.' };
        }
    }
    return {
        ok: true,
        datos: {
            nombre: nombre,
            programa: tallerPrograma.value,
            fecha_programada: tallerFecha.value,
            lugar: tallerLugar.value.trim(),
            cupo: cupo,
            profesional_id: responsable ? Number(responsable) : null
        }
    };
}

function leerInscripcion() {
    const taller = porId(talleres, tallerActivoId);
    if (!taller) return { ok: false, mensaje: 'Elija el taller en la tabla.' };
    if (!inscPersona.value) return { ok: false, mensaje: 'Elija la persona. Si no está, regístrela en Personas.' };
    if (!inscFecha.value) return { ok: false, mensaje: 'Indique la fecha de inscripción.' };
    if (inscFecha.value > hoyISO()) return { ok: false, mensaje: 'La fecha de inscripción no puede ser futura.' };
    if (!inscEstado.value) return { ok: false, mensaje: 'Elija el estado.' };
    const repetida = inscripciones.some(function (fila) {
        return String(fila.taller_id) === String(taller.id) &&
            String(fila.persona_id) === String(inscPersona.value) &&
            String(fila.id) !== String(inscIdInput.value || '');
    });
    if (repetida) return { ok: false, mensaje: 'Esa persona ya está inscrita en este taller.' };
    if (ocupaCupo(inscEstado.value) && taller.cupo != null) {
        const ocupados = cupoOcupado(taller.id, inscIdInput.value);
        if (ocupados >= Number(taller.cupo)) {
            return { ok: false, mensaje: 'El cupo está completo. Puede dejarla en lista de espera.' };
        }
    }
    return {
        ok: true,
        datos: {
            taller_id: Number(taller.id),
            persona_id: Number(inscPersona.value),
            fecha_inscripcion: inscFecha.value,
            estado: inscEstado.value
        }
    };
}

async function guardarFila(tabla, id, datos) {
    if (id) {
        return supabaseClient.from(tabla).update(datos).eq('id', id);
    }
    return supabaseClient.from(tabla).insert([datos]);
}

document.addEventListener('DOMContentLoaded', async function () {
    llenarSelect(profActivo, window.VIBA_CATALOGOS.sn, 'Seleccione');
    llenarSelect(dispModalidad, window.VIBA_CATALOGOS.modalidad, 'Seleccione');
    llenarSelect(tallerPrograma, window.VIBA_CATALOGOS.programa, 'Seleccione el programa');
    llenarSelect(inscEstado, window.VIBA_CATALOGOS.estadoInscripcion, 'Seleccione');
    profActivo.value = 'S';
    inscFecha.value = hoyISO();
    inscEstado.value = 'INSCRITA';

    await leerTablas();
    pintarTodo();

    profForm.addEventListener('submit', async function (evento) {
        evento.preventDefault();
        const leido = leerProfesional();
        if (!leido.ok) {
            aviso(avisoProf, leido.mensaje, 'error');
            return;
        }
        const { error } = await guardarFila('profesionales', profIdInput.value, leido.datos);
        if (error) {
            aviso(avisoProf, 'No se pudo guardar el profesional.', 'error');
            return;
        }
        await leerTablas();
        limpiarProfesional();
        pintarTodo();
        aviso(avisoProf, 'Profesional guardado.', 'ok');
    });

    dispForm.addEventListener('submit', async function (evento) {
        evento.preventDefault();
        const leido = leerDisponibilidad();
        if (!leido.ok) {
            aviso(avisoAgenda, leido.mensaje, 'error');
            return;
        }
        const { error } = await guardarFila('disponibilidades', dispIdInput.value, leido.datos);
        if (error) {
            aviso(avisoAgenda, 'No se pudo guardar el horario.', 'error');
            return;
        }
        await leerTablas();
        limpiarDisponibilidad();
        pintarTodo();
        aviso(avisoAgenda, 'Horario guardado.', 'ok');
    });

    tallerForm.addEventListener('submit', async function (evento) {
        evento.preventDefault();
        const leido = leerTaller();
        if (!leido.ok) {
            aviso(avisoTaller, leido.mensaje, 'error');
            return;
        }
        const { error } = await guardarFila('talleres', tallerIdInput.value, leido.datos);
        if (error) {
            aviso(avisoTaller, 'No se pudo guardar el taller.', 'error');
            return;
        }
        await leerTablas();
        limpiarTaller();
        pintarTodo();
        aviso(avisoTaller, 'Taller guardado.', 'ok');
    });

    inscForm.addEventListener('submit', async function (evento) {
        evento.preventDefault();
        const leido = leerInscripcion();
        if (!leido.ok) {
            aviso(avisoInsc, leido.mensaje, 'error');
            return;
        }
        const { error } = await guardarFila('inscripciones', inscIdInput.value, leido.datos);
        if (error) {
            aviso(avisoInsc, 'No se pudo guardar la inscripción.', 'error');
            return;
        }
        await leerTablas();
        limpiarInscripcion();
        pintarTodo();
        aviso(avisoInsc, 'Inscripción guardada.', 'ok');
    });

    document.getElementById('btn-cancelar-prof').addEventListener('click', limpiarProfesional);
    document.getElementById('btn-cancelar-disp').addEventListener('click', limpiarDisponibilidad);
    document.getElementById('btn-cancelar-taller').addEventListener('click', limpiarTaller);
    document.getElementById('btn-cancelar-insc').addEventListener('click', limpiarInscripcion);

    document.body.addEventListener('click', async function (evento) {
        const boton = evento.target.closest('button');
        if (!boton) return;

        if (boton.dataset.editarProf) cargarProfesional(boton.dataset.editarProf);
        if (boton.dataset.agenda) abrirAgenda(boton.dataset.agenda);
        if (boton.dataset.eliminarProf) await eliminarProfesional(boton.dataset.eliminarProf);

        if (boton.dataset.editarDisp) cargarDisponibilidad(boton.dataset.editarDisp);
        if (boton.dataset.eliminarDisp) await eliminarDisponibilidad(boton.dataset.eliminarDisp);

        if (boton.dataset.editarTaller) cargarTaller(boton.dataset.editarTaller);
        if (boton.dataset.inscripciones) abrirInscripciones(boton.dataset.inscripciones);
        if (boton.dataset.eliminarTaller) await eliminarTaller(boton.dataset.eliminarTaller);

        if (boton.dataset.editarInsc) cargarInscripcion(boton.dataset.editarInsc);
        if (boton.dataset.eliminarInsc) await eliminarInscripcion(boton.dataset.eliminarInsc);
    });
});

function cargarProfesional(id) {
    const profesional = porId(profesionales, id);
    if (!profesional) return;
    profIdInput.value = profesional.id;
    profNombre.value = profesional.nombre;
    profEmail.value = profesional.email || '';
    profTelefono.value = profesional.telefono || '';
    profActivo.value = profesional.activo || 'S';
    document.getElementById('titulo-profesional').textContent = 'Editar profesional';
    document.getElementById('btn-guardar-prof').textContent = 'Actualizar';
    document.getElementById('btn-cancelar-prof').classList.remove('oculto');
    aviso(avisoProf, '');
}

function abrirAgenda(id) {
    profesionalActivoId = id;
    limpiarDisponibilidad();
    pintarProfesionales();
    pintarAgenda();
    panelAgenda.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

async function eliminarProfesional(id) {
    const aCargo = talleres.some(function (taller) { return String(taller.profesional_id) === String(id); });
    const conValoracion = valoraciones.some(function (fila) { return String(fila.profesional_id) === String(id); });
    if (aCargo || conValoracion) {
        aviso(avisoProf, 'Este profesional tiene talleres o valoraciones. No se elimina.', 'error');
        return;
    }
    if (!confirm('¿Eliminar este profesional y su agenda?')) return;
    const { error } = await supabaseClient.from('profesionales').delete().eq('id', id);
    if (error) {
        aviso(avisoProf, 'No se pudo eliminar el profesional.', 'error');
        return;
    }
    const propias = disponibilidades.filter(function (fila) { return String(fila.profesional_id) === String(id); });
    for (const fila of propias) {
        await supabaseClient.from('disponibilidades').delete().eq('id', fila.id);
    }
    if (String(profesionalActivoId) === String(id)) profesionalActivoId = '';
    await leerTablas();
    limpiarProfesional();
    pintarTodo();
}

function cargarDisponibilidad(id) {
    const fila = porId(disponibilidades, id);
    if (!fila) return;
    profesionalActivoId = String(fila.profesional_id);
    dispIdInput.value = fila.id;
    dispFecha.value = fila.fecha;
    dispInicio.value = fila.hora_inicio;
    dispFin.value = fila.hora_fin;
    dispModalidad.value = fila.modalidad;
    document.getElementById('btn-guardar-disp').textContent = 'Actualizar horario';
    document.getElementById('btn-cancelar-disp').classList.remove('oculto');
    pintarAgenda();
    aviso(avisoAgenda, '');
}

async function eliminarDisponibilidad(id) {
    if (!confirm('¿Quitar este horario de la agenda?')) return;
    const { error } = await supabaseClient.from('disponibilidades').delete().eq('id', id);
    if (error) {
        aviso(avisoAgenda, 'No se pudo quitar el horario.', 'error');
        return;
    }
    await leerTablas();
    limpiarDisponibilidad();
    pintarTodo();
}

function cargarTaller(id) {
    const taller = porId(talleres, id);
    if (!taller) return;
    tallerIdInput.value = taller.id;
    tallerNombre.value = taller.nombre;
    tallerPrograma.value = taller.programa;
    tallerFecha.value = taller.fecha_programada;
    tallerLugar.value = taller.lugar || '';
    tallerCupo.value = taller.cupo == null ? '' : taller.cupo;
    pintarSelectorProfesional();
    tallerProfesional.value = taller.profesional_id ? String(taller.profesional_id) : '';
    document.getElementById('titulo-taller').textContent = 'Editar taller';
    document.getElementById('btn-guardar-taller').textContent = 'Actualizar';
    document.getElementById('btn-cancelar-taller').classList.remove('oculto');
    aviso(avisoTaller, '');
}

function abrirInscripciones(id) {
    tallerActivoId = id;
    limpiarInscripcion();
    pintarTalleres();
    pintarInscripciones();
    panelInscripcion.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

async function eliminarTaller(id) {
    const conPersonas = inscripciones.some(function (fila) { return String(fila.taller_id) === String(id); });
    const formularios = await supabaseClient.from('formularios').select('*');
    const conFormulario = (formularios.data || []).some(function (fila) {
        return String(fila.taller_id) === String(id);
    });
    const conValoracion = valoraciones.some(function (fila) { return String(fila.taller_id) === String(id); });
    if (conPersonas || conFormulario || conValoracion) {
        aviso(avisoTaller, 'Este taller tiene inscripciones, un diligenciamiento o una valoración. No se elimina.', 'error');
        return;
    }
    if (!confirm('¿Eliminar este taller?')) return;
    const { error } = await supabaseClient.from('talleres').delete().eq('id', id);
    if (error) {
        aviso(avisoTaller, 'No se pudo eliminar el taller.', 'error');
        return;
    }
    if (String(tallerActivoId) === String(id)) tallerActivoId = '';
    await leerTablas();
    limpiarTaller();
    pintarTodo();
}

function cargarInscripcion(id) {
    const fila = porId(inscripciones, id);
    if (!fila) return;
    tallerActivoId = String(fila.taller_id);
    inscIdInput.value = fila.id;
    pintarInscripciones();
    inscPersona.value = String(fila.persona_id);
    inscFecha.value = fila.fecha_inscripcion;
    inscEstado.value = fila.estado;
    document.getElementById('btn-guardar-insc').textContent = 'Actualizar inscripción';
    document.getElementById('btn-cancelar-insc').classList.remove('oculto');
    aviso(avisoInsc, '');
}

async function eliminarInscripcion(id) {
    if (!confirm('¿Quitar esta inscripción?')) return;
    const { error } = await supabaseClient.from('inscripciones').delete().eq('id', id);
    if (error) {
        aviso(avisoInsc, 'No se pudo quitar la inscripción.', 'error');
        return;
    }
    await leerTablas();
    limpiarInscripcion();
    pintarTodo();
}
