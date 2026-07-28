// Referencias del DOM
const clienteForm = document.getElementById('cliente-form');
const clienteIdInput = document.getElementById('cliente-id');
const nombreInput = document.getElementById('nombre');
const emailInput = document.getElementById('email');
const telefonoInput = document.getElementById('telefono');
const empresaInput = document.getElementById('empresa');
const estadoSelect = document.getElementById('estado');
const btnGuardar = document.getElementById('btn-guardar');
const btnCancelar = document.getElementById('btn-cancelar');
const searchInput = document.getElementById('search-input');
const clientesTbody = document.getElementById('clientes-tbody');

// Inicialización
document.addEventListener('DOMContentLoaded', () => {
    cargarClientes();

    clienteForm.addEventListener('submit', guardarCliente);
    btnCancelar.addEventListener('click', resetearFormulario);
    searchInput.addEventListener('input', (e) => cargarClientes(e.target.value));
});

// 1. LEER Y BUSCAR (Select / Search)
async function cargarClientes(filtro = '') {
    try {
        let query = supabaseClient.from('clientes').select('*').order('created_at', { ascending: false });
        
        if (filtro.trim() !== '') {
            query = query.or(`nombre.ilike.%${filtro}%,email.ilike.%${filtro}%`);
        }

        const { data: clientes, error } = await query;

        if (error) throw error;

        clientesTbody.innerHTML = '';

        if (!clientes || clientes.length === 0) {
            clientesTbody.innerHTML = '<tr><td colspan="5">No se encontraron clientes.</td></tr>';
            return;
        }

        clientes.forEach(cliente => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td><strong>${cliente.nombre}</strong></td>
                <td>${cliente.email}</td>
                <td>${cliente.empresa || '-'}</td>
                <td><span class="badge">${cliente.estado}</span></td>
                <td class="actions-cell">
                    <button class="btn-warning" onclick="prepararEdicion(${cliente.id})">✏️ Editar</button>
                    <button class="btn-danger" onclick="eliminarCliente(${cliente.id})">🗑️ Eliminar</button>
                </td>
            `;
            clientesTbody.appendChild(tr);
        });
    } catch (err) {
        console.error('Error al cargar clientes:', err.message);
        clientesTbody.innerHTML = `<tr><td colspan="5" style="color:red;">Error: ${err.message}</td></tr>`;
    }
}

// 2. CREAR Y EDITAR (Insert / Update)
async function guardarCliente(e) {
    e.preventDefault();

    const id = clienteIdInput.value;
    const datosCliente = {
        nombre: nombreInput.value.trim(),
        email: emailInput.value.trim(),
        telefono: telefonoInput.value.trim(),
        empresa: empresaInput.value.trim(),
        estado: estadoSelect.value
    };

    try {
        if (id) {
            // EDITAR / ACTUALIZAR
            const { error } = await supabaseClient
                .from('clientes')
                .update(datosCliente)
                .eq('id', id);

            if (error) throw error;
            alert('Cliente actualizado con éxito');
        } else {
            // GUARDAR / CREAR
            const { error } = await supabaseClient
                .from('clientes')
                .insert([datosCliente]);

            if (error) throw error;
            alert('Cliente creado con éxito');
        }

        resetearFormulario();
        cargarClientes();
    } catch (err) {
        alert('Error al guardar cliente: ' + err.message);
    }
}

// Preparar edición
window.prepararEdicion = async function(id) {
    try {
        const { data, error } = await supabaseClient
            .from('clientes')
            .select('*')
            .eq('id', id)
            .single();

        if (error) throw error;

        clienteIdInput.value = data.id;
        nombreInput.value = data.nombre;
        emailInput.value = data.email;
        telefonoInput.value = data.telefono || '';
        empresaInput.value = data.empresa || '';
        estadoSelect.value = data.estado;

        document.getElementById('form-title').innerText = 'Editar Cliente';
        btnGuardar.innerText = 'Actualizar Cambios';
        btnCancelar.style.display = 'inline-block';
    } catch (err) {
        alert('Error al obtener datos: ' + err.message);
    }
};

// 3. ELIMINAR (Delete)
window.eliminarCliente = async function(id) {
    if (!confirm('¿Está seguro de que desea eliminar este cliente?')) return;

    try {
        const { error } = await supabaseClient
            .from('clientes')
            .delete()
            .eq('id', id);

        if (error) throw error;

        alert('Cliente eliminado con éxito');
        cargarClientes();
    } catch (err) {
        alert('Error al eliminar: ' + err.message);
    }
};

function resetearFormulario() {
    clienteIdInput.value = '';
    clienteForm.reset();
    document.getElementById('form-title').innerText = 'Registrar Nuevo Cliente';
    btnGuardar.innerText = 'Guardar Cliente';
    btnCancelar.style.display = 'none';
}
