/* Ficha de la persona. Se reconoce por tipo y número de documento.
   La edad se calcula al mostrar y no se guarda.
   Los conteos de talleres, acompañamientos y valoraciones siguen la lógica de v_persona_actividad.
   No se elimina si ya tiene un diligenciamiento, una inscripción o una valoración. */

/* Programas que el modelo cuenta como acompañamiento. */
const PROGRAMAS_ACOMPANAMIENTO = {
    ASA: true,
    ADAM: true,
    ANIMK: true,
    RENASER: true,
    FENESER: true,
    MICRODOSIS: true
};

const ESTADOS_CUPO = { INSCRITA: true, ASISTIO: true };
const personaForm = document.getElementById('persona-form');
const personaIdInput = document.getElementById('persona-id');
const tipoDocumentoSelect = document.getElementById('tipo_documento');
const numeroDocumentoInput = document.getElementById('numero_documento');
const nombreInput = document.getElementById('nombre_apellidos');
const sexoSelect = document.getElementById('sexo');
const fechaNacimientoInput = document.getElementById('fecha_nacimiento');
const municipioInput = document.getElementById('municipio_residencia');
const direccionInput = document.getElementById('direccion_residencia');
const ocupacionInput = document.getElementById('ocupacion');
const emailInput = document.getElementById('email');
const telefonoInput = document.getElementById('telefono');
const btnGuardar = document.getElementById('btn-guardar');
const btnCancelar = document.getElementById('btn-cancelar');
const searchInput = document.getElementById('search-input');
const personasTbody = document.getElementById('personas-tbody');

function etiqueta(lista, codigo) {
    const par = (lista || []).find(function (item) { return item[0] === codigo; });
    return par ? par[1] : (codigo || '—');
}

function llenarSelect(select, opciones, placeholder) {
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
}

function escapar(valor) {
    return String(valor ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

function edadCumplida(fecha) {
    if (!fecha) return '—';
    const nacimiento = new Date(fecha + 'T00:00:00');
    if (Number.isNaN(nacimiento.getTime())) return '—';
    const hoy = new Date();
    let anios = hoy.getFullYear() - nacimiento.getFullYear();
    const mes = hoy.getMonth() - nacimiento.getMonth();
    if (mes < 0 || (mes === 0 && hoy.getDate() < nacimiento.getDate())) anios -= 1;
    return anios >= 0 ? String(anios) : '—';
}

function soloDigitos(valor) {
    return String(valor || '').replace(/\D/g, '');
}

function hoyISO() {
    const hoy = new Date();
    const mes = String(hoy.getMonth() + 1).padStart(2, '0');
    const dia = String(hoy.getDate()).padStart(2, '0');
    return hoy.getFullYear() + '-' + mes + '-' + dia;
}

function actividadPorPersona(inscripciones, talleres, valoraciones) {
    const tallerPorId = {};
    (talleres || []).forEach(function (taller) {
        tallerPorId[String(taller.id)] = taller;
    });
    const mapa = {};
    function fila(id) {
        const clave = String(id);
        if (!mapa[clave]) {
            mapa[clave] = { talleres: {}, acompanamientos: {}, valoraciones: 0 };
        }
        return mapa[clave];
    }
    (inscripciones || []).forEach(function (inscripcion) {
        if (!ESTADOS_CUPO[inscripcion.estado]) return;
        const act = fila(inscripcion.persona_id);
        const tallerId = String(inscripcion.taller_id);
        act.talleres[tallerId] = true;
        const taller = tallerPorId[tallerId];
        if (taller && PROGRAMAS_ACOMPANAMIENTO[taller.programa]) {
            act.acompanamientos['t:' + tallerId] = true;
        }
    });
    (valoraciones || []).forEach(function (valoracion) {
        const act = fila(valoracion.persona_id);
        act.valoraciones += 1;
        if (PROGRAMAS_ACOMPANAMIENTO[valoracion.programa]) {
            act.acompanamientos['v:' + valoracion.id] = true;
        }
    });
    const salida = {};
    Object.keys(mapa).forEach(function (clave) {
        salida[clave] = {
            talleres: Object.keys(mapa[clave].talleres).length,
            acompanamientos: Object.keys(mapa[clave].acompanamientos).length,
            valoraciones: mapa[clave].valoraciones
        };
    });
    return salida;
}

document.addEventListener('DOMContentLoaded', () => {
    const catalogos = window.VIBA_CATALOGOS;
    llenarSelect(tipoDocumentoSelect, catalogos.tipoDocumento, 'Seleccione');
    llenarSelect(sexoSelect, catalogos.sexo, 'Sin registrar');
    cargarPersonas();

    personaForm.addEventListener('submit', guardarPersona);
    btnCancelar.addEventListener('click', resetearFormulario);
    searchInput.addEventListener('input', (e) => cargarPersonas(e.target.value));
});

async function cargarPersonas(filtro = '') {
    try {
        /* El modelo no guarda created_at en persona; se ordena por id. */
        let query = supabaseClient.from('personas').select('*').order('id', { ascending: false });
        if (filtro.trim() !== '') {
            query = query.or(
                `nombre_apellidos.ilike.%${filtro}%,email.ilike.%${filtro}%,numero_documento.ilike.%${filtro}%,municipio_residencia.ilike.%${filtro}%`
            );
        }

        const [{ data: personas, error }, insc, tall, vals] = await Promise.all([
            query,
            supabaseClient.from('inscripciones').select('*'),
            supabaseClient.from('talleres').select('*'),
            supabaseClient.from('valoraciones').select('*')
        ]);
        if (error) throw error;

        const actividad = actividadPorPersona(insc.data, tall.data, vals.data);

        personasTbody.innerHTML = '';
        if (!personas || personas.length === 0) {
            personasTbody.innerHTML = '<tr><td colspan="9">No hay personas con ese criterio.</td></tr>';
            return;
        }

        const catalogos = window.VIBA_CATALOGOS;
        personas.forEach(function (persona) {
            const conteo = actividad[String(persona.id)] || { talleres: 0, acompanamientos: 0, valoraciones: 0 };
            const tr = document.createElement('tr');
            tr.innerHTML =
                '<td><strong>' + escapar(persona.nombre_apellidos) + '</strong></td>' +
                '<td>' + escapar(persona.tipo_documento) + ' ' + escapar(persona.numero_documento) + '</td>' +
                '<td>' + escapar(etiqueta(catalogos.sexo, persona.sexo)) + '</td>' +
                '<td>' + escapar(edadCumplida(persona.fecha_nacimiento)) + '</td>' +
                '<td>' + escapar(persona.municipio_residencia || '—') + '</td>' +
                '<td>' + conteo.talleres + '</td>' +
                '<td>' + conteo.acompanamientos + '</td>' +
                '<td>' + conteo.valoraciones + '</td>' +
                '<td class="actions-cell">' +
                    '<button class="btn-warning" type="button" data-editar="' + escapar(persona.id) + '">Editar</button>' +
                    '<button class="btn-danger" type="button" data-eliminar="' + escapar(persona.id) + '">Eliminar</button>' +
                '</td>';
            personasTbody.appendChild(tr);
        });
    } catch (err) {
        personasTbody.innerHTML = '<tr><td colspan="9">No se pudo cargar el directorio.</td></tr>';
    }
}

async function documentoRepetido(tipo, numero, idActual) {
    const { data, error } = await supabaseClient.from('personas').select('*');
    if (error) throw error;
    return (data || []).some(function (persona) {
        return persona.tipo_documento === tipo &&
            String(persona.numero_documento) === String(numero) &&
            String(persona.id) !== String(idActual || '');
    });
}

async function guardarPersona(e) {
    e.preventDefault();

    const tipo = tipoDocumentoSelect.value;
    const numero = soloDigitos(numeroDocumentoInput.value);
    const nombre = nombreInput.value.trim();
    if (!tipo || !numero || !nombre) {
        alert('Tipo de documento, número y nombre son obligatorios.');
        return;
    }
    if (Number(numero) <= 0) {
        alert('El número de documento debe ser mayor que cero.');
        return;
    }

    const fechaNacimiento = fechaNacimientoInput.value || null;
    if (fechaNacimiento && fechaNacimiento > hoyISO()) {
        alert('La fecha de nacimiento no puede ser futura.');
        return;
    }

    const id = personaIdInput.value;
    if (await documentoRepetido(tipo, numero, id)) {
        alert('Ya existe una persona con ese tipo y número de documento.');
        return;
    }

    const telefono = soloDigitos(telefonoInput.value);
    if (telefono && Number(telefono) <= 0) {
        alert('El teléfono debe ser mayor que cero.');
        return;
    }
    const textoONull = function (valor) {
        const limpio = String(valor || '').trim();
        return limpio || null;
    };
    const datos = {
        tipo_documento: tipo,
        numero_documento: Number(numero),
        nombre_apellidos: nombre,
        sexo: sexoSelect.value || null,
        fecha_nacimiento: fechaNacimiento,
        municipio_residencia: textoONull(municipioInput.value),
        direccion_residencia: textoONull(direccionInput.value),
        ocupacion: textoONull(ocupacionInput.value),
        email: textoONull(emailInput.value),
        telefono: telefono ? Number(telefono) : null
    };

    try {
        if (id) {
            const { error } = await supabaseClient.from('personas').update(datos).eq('id', id);
            if (error) throw error;
        } else {
            const { error } = await supabaseClient.from('personas').insert([datos]);
            if (error) throw error;
        }
        resetearFormulario();
        cargarPersonas(searchInput.value);
    } catch (err) {
        alert('No se pudo guardar la persona.');
    }
}

personasTbody.addEventListener('click', async function (evento) {
    const editar = evento.target.closest('[data-editar]');
    const eliminar = evento.target.closest('[data-eliminar]');
    if (editar) await prepararEdicion(editar.dataset.editar);
    if (eliminar) await eliminarPersona(eliminar.dataset.eliminar);
});

async function prepararEdicion(id) {
    const { data, error } = await supabaseClient.from('personas').select('*').eq('id', id).single();
    if (error) {
        alert('No se encontró la persona.');
        return;
    }

    personaIdInput.value = data.id;
    tipoDocumentoSelect.value = data.tipo_documento || '';
    numeroDocumentoInput.value = data.numero_documento || '';
    nombreInput.value = data.nombre_apellidos || '';
    sexoSelect.value = data.sexo || '';
    fechaNacimientoInput.value = data.fecha_nacimiento || '';
    municipioInput.value = data.municipio_residencia || '';
    direccionInput.value = data.direccion_residencia || '';
    ocupacionInput.value = data.ocupacion || '';
    emailInput.value = data.email || '';
    telefonoInput.value = data.telefono || '';

    document.getElementById('form-title').textContent = 'Editar persona';
    btnGuardar.textContent = 'Actualizar';
    btnCancelar.style.display = 'inline-block';
}

async function eliminarPersona(id) {
    if (!confirm('¿Eliminar esta persona del directorio de demostración?')) return;

    const formularios = await supabaseClient.from('formularios').select('*');
    const inscripciones = await supabaseClient.from('inscripciones').select('*');
    const valoraciones = await supabaseClient.from('valoraciones').select('*');
    const usadaEnFormulario = (formularios.data || []).some(function (fila) {
        return String(fila.persona_id) === String(id) || String(fila.persona_diligencia_id) === String(id);
    });
    const usadaEnTaller = (inscripciones.data || []).some(function (fila) {
        return String(fila.persona_id) === String(id);
    });
    const usadaEnValoracion = (valoraciones.data || []).some(function (fila) {
        return String(fila.persona_id) === String(id);
    });
    if (usadaEnFormulario || usadaEnTaller || usadaEnValoracion) {
        alert('Esta persona ya tiene un diligenciamiento, una inscripción o una valoración. No se elimina para no dejar datos sueltos.');
        return;
    }

    const { error } = await supabaseClient.from('personas').delete().eq('id', id);
    if (error) {
        alert('No se pudo eliminar.');
        return;
    }
    if (String(personaIdInput.value) === String(id)) resetearFormulario();
    cargarPersonas(searchInput.value);
}

function resetearFormulario() {
    personaIdInput.value = '';
    personaForm.reset();
    document.getElementById('form-title').textContent = 'Registrar persona';
    btnGuardar.textContent = 'Guardar';
    btnCancelar.style.display = 'none';
}
