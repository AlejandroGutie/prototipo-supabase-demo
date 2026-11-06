// =======================================================
// LÓGICA DE AUTENTICACIÓN Y SESIONES (js/auth.js)
// =======================================================

document.addEventListener('DOMContentLoaded', () => {
    const isLoginPage = window.location.pathname.includes('login.html');

    // 1. Validar el estado de la sesión al cargar la página
    verificarSesion(isLoginPage);

    if (isLoginPage) {
        inicializarInterfazAuth();
    } else {
        inyectarBotonCerrarSesion();
    }
});

// Verificación y protección de rutas
async function verificarSesion(isLoginPage) {
    const { data: { session } } = await supabaseClient.auth.getSession();

    if (!session && !isLoginPage) {
        // Redirigir al login si el usuario intenta ingresar sin sesión activa
        window.location.href = 'login.html';
    } else if (session && isLoginPage) {
        // Redirigir a la aplicación si el usuario ya está autenticado
        window.location.href = 'index.html';
    }
}

// Inicio de sesión
async function iniciarSesion(email, password) {
    const msgDiv = document.getElementById('auth-message');
    msgDiv.innerText = 'Verificando credenciales...';
    msgDiv.style.color = '#2b6cb0';

    const { data, error } = await supabaseClient.auth.signInWithPassword({
        email: email,
        password: password
    });

    if (error) {
        msgDiv.innerText = 'Error de acceso: ' + error.message;
        msgDiv.style.color = '#e53e3e';
    } else {
        msgDiv.innerText = '¡Acceso concedido! Entrando...';
        msgDiv.style.color = '#38a169';
        setTimeout(() => window.location.href = 'index.html', 1000);
    }
}

// Cierre de sesión
async function cerrarSesion() {
    const { error } = await supabaseClient.auth.signOut();
    if (error) {
        alert('Error al cerrar sesión: ' + error.message);
    } else {
        window.location.href = 'login.html';
    }
}

// Hacer visible la función globalmente
window.cerrarSesion = cerrarSesion;

// Manejo de eventos del formulario y pestañas
function inicializarInterfazAuth() {
    const loginForm = document.getElementById('login-form');

    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const email = document.getElementById('login-email').value;
        const pass = document.getElementById('login-password').value;
        iniciarSesion(email, pass);
    });

    const hint = document.createElement('p');
    hint.id = 'modo-local-hint';
    hint.style.marginTop = '12px';
    hint.style.fontSize = '0.85rem';
    hint.style.textAlign = 'center';
    hint.style.color = '#4a5568';
    if (window.VIBA_MODO_LOCAL) {
        hint.textContent = 'Modo local: entra con demo@consciencia.local y la contraseña demo1234. Los datos se guardan solo en este navegador.';
    } else {
        hint.textContent = 'Conectado a Supabase. Use el correo y la contraseña del usuario creado en Authentication.';
    }
    document.querySelector('.auth-container').appendChild(hint);
}

// Inyección dinámica de datos del usuario y botón de salida en el header
async function inyectarBotonCerrarSesion() {
    const header = document.querySelector('header');
    if (!header) return;

    const { data: { session } } = await supabaseClient.auth.getSession();
    if (session) {
        const userDiv = document.createElement('div');
        userDiv.className = 'user-badge';
        userDiv.innerHTML = `
            <span>👤 ${session.user.email}</span>
            <button type="button" class="btn-danger" id="btn-logout">Salir</button>
        `;
        header.appendChild(userDiv);

        // Asignar listener explícito al botón inyectado
        document.getElementById('btn-logout').addEventListener('click', cerrarSesion);
    }
}
