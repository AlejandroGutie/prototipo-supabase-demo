// =======================================================
// CONFIGURACIÓN DE SUPABASE CLIENT
// MODO_LOCAL = true guarda sesión y datos en este navegador.
// Cámbialo a false cuando vuelvas a tener acceso a Supabase.
// =======================================================
(function () {
    if (window.supabaseClient) return;

    const MODO_LOCAL = true;
    window.VIBA_MODO_LOCAL = MODO_LOCAL;

    if (!MODO_LOCAL) {
        const SUPABASE_URL = 'https://blarjnvouvqovlfocmbr.supabase.co';
        const SUPABASE_ANON_KEY = 'sb_publishable_e34jI9zd6gNSJb1wC25hnw_Gj5tR_NX';
        window.supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        return;
    }

    const CLAVES = {
        usuarios: 'viba-local:usuarios',
        sesion: 'viba-local:sesion',
        clientes: 'viba-local:clientes',
        proyectos: 'viba-local:proyectos'
    };

    function leer(clave, defecto) {
        try {
            const raw = localStorage.getItem(clave);
            return raw ? JSON.parse(raw) : defecto;
        } catch (e) {
            return defecto;
        }
    }

    function guardar(clave, valor) {
        localStorage.setItem(clave, JSON.stringify(valor));
    }

    function siguienteId(filas) {
        return filas.reduce((max, fila) => Math.max(max, Number(fila.id) || 0), 0) + 1;
    }

    function asegurarDatos() {
        if (!localStorage.getItem(CLAVES.usuarios)) {
            guardar(CLAVES.usuarios, [
                { id: 1, email: 'demo@consciencia.local', password: 'demo1234' }
            ]);
        }

        if (!localStorage.getItem(CLAVES.clientes)) {
            guardar(CLAVES.clientes, [
                {
                    id: 1,
                    nombre: 'María Pérez',
                    email: 'maria@correo.com',
                    telefono: '+57 300 111 1111',
                    empresa: 'Programa Semilla',
                    estado: 'Activo',
                    created_at: '2026-09-01T12:00:00.000Z'
                },
                {
                    id: 2,
                    nombre: 'Juan Gómez',
                    email: 'juan@correo.com',
                    telefono: '+57 301 222 2222',
                    empresa: 'Programa Raíz',
                    estado: 'Prospecto',
                    created_at: '2026-09-15T12:00:00.000Z'
                },
                {
                    id: 3,
                    nombre: 'Ana López',
                    email: 'ana@correo.com',
                    telefono: '',
                    empresa: 'Programa Cosecha',
                    estado: 'Inactivo',
                    created_at: '2026-09-20T12:00:00.000Z'
                }
            ]);
        }

        if (!localStorage.getItem(CLAVES.proyectos)) {
            guardar(CLAVES.proyectos, [
                {
                    id: 1,
                    titulo: 'Huerta comunitaria',
                    cliente_nombre: 'María Pérez',
                    presupuesto: 1500,
                    prioridad: 'Alta',
                    descripcion: 'Siembra y seguimiento del primer ciclo.',
                    created_at: '2026-09-10T12:00:00.000Z'
                },
                {
                    id: 2,
                    titulo: 'Taller de liderazgo',
                    cliente_nombre: 'Juan Gómez',
                    presupuesto: 800,
                    prioridad: 'Media',
                    descripcion: 'Cuatro sesiones con el grupo de jóvenes.',
                    created_at: '2026-09-18T12:00:00.000Z'
                }
            ]);
        }
    }

    function coincide(fila, filtro) {
        if (filtro.tipo === 'eq') {
            return String(fila[filtro.col]) === String(filtro.val);
        }

        if (filtro.tipo === 'or') {
            return filtro.expr.split(',').some((parte) => {
                const match = parte.match(/^([a-zA-Z0-9_]+)\.ilike\.%([\s\S]*)%$/);
                if (!match) return false;
                return String(fila[match[1]] ?? '').toLowerCase().includes(match[2].toLowerCase());
            });
        }

        return true;
    }

    function ejecutar(tabla, estado) {
        asegurarDatos();
        const clave = CLAVES[tabla];
        if (!clave) {
            return { data: null, error: { message: 'Tabla no disponible en modo local' } };
        }

        let filas = leer(clave, []);

        if (estado.operacion === 'select') {
            let resultado = filas.filter((fila) => estado.filtros.every((filtro) => coincide(fila, filtro)));

            if (estado.orden) {
                const { col, asc } = estado.orden;
                resultado = resultado.slice().sort((a, b) => {
                    const av = a[col] ?? '';
                    const bv = b[col] ?? '';
                    if (av < bv) return asc ? -1 : 1;
                    if (av > bv) return asc ? 1 : -1;
                    return 0;
                });
            }

            if (estado.unico) {
                if (!resultado.length) {
                    return { data: null, error: { message: 'No se encontró el registro' } };
                }
                return { data: { ...resultado[0] }, error: null };
            }

            return { data: resultado.map((fila) => ({ ...fila })), error: null };
        }

        if (estado.operacion === 'insert') {
            const nuevas = [];
            (estado.datos || []).forEach((fila) => {
                const nueva = {
                    ...fila,
                    id: siguienteId(filas),
                    created_at: new Date().toISOString()
                };
                filas.push(nueva);
                nuevas.push({ ...nueva });
            });
            guardar(clave, filas);
            return { data: nuevas, error: null };
        }

        if (estado.operacion === 'update') {
            let actualizados = 0;
            filas = filas.map((fila) => {
                if (!estado.filtros.every((filtro) => coincide(fila, filtro))) return fila;
                actualizados += 1;
                return { ...fila, ...estado.datos, id: fila.id, created_at: fila.created_at };
            });
            if (!actualizados) {
                return { data: null, error: { message: 'No se encontró el registro' } };
            }
            guardar(clave, filas);
            return { data: null, error: null };
        }

        if (estado.operacion === 'delete') {
            const restantes = filas.filter((fila) => !estado.filtros.every((filtro) => coincide(fila, filtro)));
            if (restantes.length === filas.length) {
                return { data: null, error: { message: 'No se encontró el registro' } };
            }
            guardar(clave, restantes);
            return { data: null, error: null };
        }

        return { data: null, error: { message: 'Operación no soportada' } };
    }

    function crearConsulta(tabla) {
        const estado = {
            operacion: 'select',
            filtros: [],
            orden: null,
            unico: false,
            datos: null
        };

        const consulta = {
            select() {
                estado.operacion = 'select';
                return consulta;
            },
            insert(filas) {
                estado.operacion = 'insert';
                estado.datos = filas;
                return consulta;
            },
            update(datos) {
                estado.operacion = 'update';
                estado.datos = datos;
                return consulta;
            },
            delete() {
                estado.operacion = 'delete';
                return consulta;
            },
            eq(col, val) {
                estado.filtros.push({ tipo: 'eq', col, val });
                return consulta;
            },
            or(expr) {
                estado.filtros.push({ tipo: 'or', expr });
                return consulta;
            },
            order(col, opciones) {
                estado.orden = { col, asc: !opciones || opciones.ascending !== false };
                return consulta;
            },
            single() {
                estado.unico = true;
                return consulta;
            },
            then(resolve, reject) {
                return Promise.resolve()
                    .then(() => ejecutar(tabla, estado))
                    .then(resolve, reject);
            }
        };

        return consulta;
    }

    window.supabaseClient = {
        auth: {
            async getSession() {
                return { data: { session: leer(CLAVES.sesion, null) }, error: null };
            },
            async signInWithPassword({ email, password }) {
                asegurarDatos();
                const usuarios = leer(CLAVES.usuarios, []);
                const usuario = usuarios.find((item) => item.email.toLowerCase() === String(email || '').trim().toLowerCase());

                if (!usuario || usuario.password !== password) {
                    return {
                        data: { session: null, user: null },
                        error: { message: 'Credenciales inválidas' }
                    };
                }

                const sesion = { user: { id: usuario.id, email: usuario.email } };
                guardar(CLAVES.sesion, sesion);
                return { data: { session: sesion, user: sesion.user }, error: null };
            },
            async signUp({ email, password }) {
                asegurarDatos();
                const usuarios = leer(CLAVES.usuarios, []);
                const limpio = String(email || '').trim().toLowerCase();

                if (!limpio) {
                    return { data: { session: null, user: null }, error: { message: 'El correo es obligatorio' } };
                }
                if (usuarios.some((item) => item.email.toLowerCase() === limpio)) {
                    return { data: { session: null, user: null }, error: { message: 'Este correo ya está registrado' } };
                }
                if (!password || String(password).length < 6) {
                    return {
                        data: { session: null, user: null },
                        error: { message: 'La contraseña debe tener al menos 6 caracteres' }
                    };
                }

                const usuario = { id: siguienteId(usuarios), email: limpio, password: String(password) };
                usuarios.push(usuario);
                guardar(CLAVES.usuarios, usuarios);

                const sesion = { user: { id: usuario.id, email: usuario.email } };
                guardar(CLAVES.sesion, sesion);
                return { data: { session: sesion, user: sesion.user }, error: null };
            },
            async signOut() {
                localStorage.removeItem(CLAVES.sesion);
                return { error: null };
            }
        },
        from(tabla) {
            return crearConsulta(tabla);
        }
    };
})();
