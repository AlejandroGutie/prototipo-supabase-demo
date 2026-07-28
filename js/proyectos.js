// Referencias
const projForm = document.getElementById('proyecto-form');
const projIdInput = document.getElementById('proyecto-id');
const tituloInput = document.getElementById('titulo');
const clienteNombreInput = document.getElementById('cliente_nombre');
const presupuestoInput = document.getElementById('presupuesto');
const prioridadSelect = document.getElementById('prioridad');
const descripcionInput = document.getElementById('descripcion');
const btnGuardarProj = document.getElementById('btn-guardar-proj');
const btnCancelarProj = document.getElementById('btn-cancelar-proj');
const searchProjInput = document.getElementById('search-proj');
const proyectosTbody = document.getElementById('proyectos-tbody');

document.addEventListener('DOMContentLoaded', () => {
    cargarProyectos();

    projForm.addEventListener('submit', guardarProyecto);
    btnCancelarProj.addEventListener('click', resetearFormProj);
    searchProjInput.addEventListener('input', (e) => cargarProyectos(e.target.value));
});

async function cargarProyectos(filtro = '') {
    try {
        let query = supabaseClient.from('proyectos').select('*').order('created_at', { ascending: false });

        if (filtro.trim() !== '') {
            query = query.or(`titulo.ilike.%${filtro}%,cliente_nombre.ilike.%${filtro}%`);
        }

        const { data: proyectos, error } = await query;
        if (error) throw error;

        proyectosTbody.innerHTML = '';

        if (!proyectos || proyectos.length === 0) {
            proyectosTbody.innerHTML = '<tr><td colspan="5">No hay proyectos registrados.</td></tr>';
            return;
        }

        proyectos.forEach(proj => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td><strong>${proj.titulo}</strong></td>
                <td>${proj.cliente_nombre}</td>
                <td>$${Number(proj.presupuesto || 0).toLocaleString()}</td>
                <td>${proj.prioridad}</td>
                <td class="actions-cell">
                    <button class="btn-warning" onclick="prepararEdicionProj(${proj.id})">✏️ Editar</button>
                    <button class="btn-danger" onclick="eliminarProyecto(${proj.id})">🗑️ Eliminar</button>
                </td>
            `;
            proyectosTbody.appendChild(tr);
        });
    } catch (err) {
        console.error('Error al cargar proyectos:', err.message);
        proyectosTbody.innerHTML = `<tr><td colspan="5" style="color:red;">Error: ${err.message}</td></tr>`;
    }
}

async function guardarProyecto(e) {
    e.preventDefault();

    const id = projIdInput.value;
    const datosProj = {
        titulo: tituloInput.value.trim(),
        cliente_nombre: clienteNombreInput.value.trim(),
        presupuesto: parseFloat(presupuestoInput.value) || 0,
        prioridad: prioridadSelect.value,
        descripcion: descripcionInput.value.trim()
    };

    try {
        if (id) {
            const { error } = await supabaseClient.from('proyectos').update(datosProj).eq('id', id);
            if (error) throw error;
            alert('Proyecto actualizado exitosamente');
        } else {
            const { error } = await supabaseClient.from('proyectos').insert([datosProj]);
            if (error) throw error;
            alert('Proyecto creado exitosamente');
        }

        resetearFormProj();
        cargarProyectos();
    } catch (err) {
        alert('Error al guardar proyecto: ' + err.message);
    }
}

window.prepararEdicionProj = async function(id) {
    try {
        const { data, error } = await supabaseClient.from('proyectos').select('*').eq('id', id).single();
        if (error) throw error;

        projIdInput.value = data.id;
        tituloInput.value = data.titulo;
        clienteNombreInput.value = data.cliente_nombre;
        presupuestoInput.value = data.presupuesto;
        prioridadSelect.value = data.prioridad;
        descripcionInput.value = data.descripcion || '';

        document.getElementById('proyecto-form-title').innerText = 'Editar Proyecto';
        btnGuardarProj.innerText = 'Actualizar Proyecto';
        btnCancelarProj.style.display = 'inline-block';
    } catch (err) {
        alert('Error al obtener proyecto: ' + err.message);
    }
};

window.eliminarProyecto = async function(id) {
    if (!confirm('¿Desea eliminar este proyecto?')) return;

    try {
        const { error } = await supabaseClient.from('proyectos').delete().eq('id', id);
        if (error) throw error;

        alert('Proyecto eliminado exitosamente');
        cargarProyectos();
    } catch (err) {
        alert('Error al eliminar proyecto: ' + err.message);
    }
};

function resetearFormProj() {
    projIdInput.value = '';
    projForm.reset();
    document.getElementById('proyecto-form-title').innerText = 'Nuevo Proyecto';
    btnGuardarProj.innerText = 'Guardar Proyecto';
    btnCancelarProj.style.display = 'none';
}
