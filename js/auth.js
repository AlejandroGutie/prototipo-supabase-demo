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

// Registro de usuario (SignUp)
async function registrarUsuario(email, password) {
    const msgDiv = document.getElementById('auth-message');
    msgDiv.innerText = 'Procesando registro...';
    msgDiv.style.color = '#2b6cb0';

    const { data, error } = await supabaseClient.auth.signUp({
        email: email,
        password: password
    });

    if (error) {
        msgDiv.innerText = 'Error: ' + error.message;
        msgDiv.style.color = '#e53e3e';
    } else {
        if (data.session) {
            msgDiv.innerText = '¡Registro e inicio de sesión exitoso! Redirigiendo...';
            msgDiv.style.color = '#38a169';
            setTimeout(() => window.location.href = 'index.html', 1200);
        } else {
            msgDiv.innerText = 'Registro exitoso. Por favor revisa tu correo electrónico para confirmar la cuenta.';
            msgDiv.style.color = '#38a169';
        }
    }
}

// Inicio de sesión (SignIn)
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

// Cierre de sesión (SignOut)
async function cerrarSesion() {
    const { error } = await supabaseClient.auth.signOut();
    if (error) {
        alert('Error al cerrar sesión: ' + error.message);
    } else {
        window.location.href = 'login.html';
    }
}

// Manejo de eventos del formulario y pestañas
function inicializarInterfazAuth() {
    const tabLogin = document.getElementById('tab-login');
    const tabRegister = document.getElementById('tab-register');
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');

    tabLogin.addEventListener('click', () => {
        tabLogin.classList.add('active');
        tabRegister.classList.remove('active');
        loginForm.style.display = 'block';
        registerForm.style.display = 'none';
    });

    tabRegister.addEventListener('click', () => {
        tabRegister.classList.add('active');
        tabLogin.classList.remove('active');
        registerForm.style.display = 'block';
        loginForm.style.display = 'none';
    });

    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const email = document.getElementById('login-email').value;
        const pass = document.getElementById('login-password').value;
        iniciarSesion(email, pass);
    });

    registerForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const email = document.getElementById('reg-email').value;
        const pass = document.getElementById('reg-password').value;
        registrarUsuario(email, pass);
    });
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
            👤 ${session.user.email}
            Salir
        `;
        header.appendChild(userDiv);
    }
}
