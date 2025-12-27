// ========================================
// TOP NAVIGATION MENU - Componente Reutilizable
// ========================================

// Función para cargar el menú de navegación
function loadTopNavigation() {
    const navHTML = `
    <!-- Header con Logo y Menú -->
    <div class="top-header">
        <div class="header-content">
            <a href="inicio.html" class="logo">
                <div class="logo-icon">
                    <img src="/pool/images/poollogo_11.svg" width="190px" alt="PoolFlow tracker">               
                </div>
            </a>
            
            <nav class="desktop-nav">
                <a href="registro-partidos.html" class="nav-link" data-page="registro-partidos">Registrar</a>
                <a href="estadisticas.html" class="nav-link" data-page="estadisticas">Estadísticas</a>
                <a href="historial.html" class="nav-link" data-page="historial">Historial</a>	
                <a href="torneos.html" class="nav-link" data-page="torneos">Torneos</a>
                <a href="analisis.html" class="nav-link" data-page="analisis">Análisis</a>
                <a href="config-github.html" class="nav-link" data-page="config-github">Sincronización</a>
                <a href="#" class="nav-link danger" onclick="resetAllDataDashboard(); return false;">Reiniciar</a>
                <a href="#" class="nav-link" onclick="logoutDashboard(); return false;">Salir</a>
            </nav>

            <div class="hamburger" onclick="toggleMenu()">
                <span></span>
                <span></span>
                <span></span>
            </div>
        </div>
    </div>

    <!-- Overlay del menú móvil -->
    <div class="mobile-menu-overlay" onclick="toggleMenu()"></div>

    <!-- Menú lateral móvil -->
    <div class="mobile-menu">
        <nav class="mobile-nav">
            <a href="registro-partidos.html" class="nav-link" data-page="registro-partidos">Registrar</a>
            <a href="estadisticas.html" class="nav-link" data-page="estadisticas">Estadísticas</a>
            <a href="historial.html" class="nav-link" data-page="historial">Historial</a>
            <a href="torneos.html" class="nav-link" data-page="torneos">Torneos</a>
            <a href="analisis.html" class="nav-link" data-page="analisis">Análisis</a>
            <a href="config-github.html" class="nav-link" data-page="config-github">Configuración</a>
            <a href="#" class="nav-link danger" onclick="resetAllDataDashboard(); return false;">Reiniciar Datos</a>
            <a href="#" class="nav-link" onclick="logoutDashboard(); return false;">Cerrar Sesión</a>
        </nav>
    </div>
    `;
    
    // Insertar el menú al inicio del body
    document.body.insertAdjacentHTML('afterbegin', navHTML);
    
    // Marcar la página actual como activa
    setActiveNavLink();
}

// Función para marcar el link activo según la página actual
function setActiveNavLink() {
    const currentPage = window.location.pathname.split('/').pop().replace('.html', '');
    
    // Seleccionar todos los links con data-page
    const navLinks = document.querySelectorAll('.nav-link[data-page]');
    
    navLinks.forEach(link => {
        const linkPage = link.getAttribute('data-page');
        
        if (linkPage === currentPage) {
            link.classList.add('active');
        } else {
            link.classList.remove('active');
        }
    });
}

// Función para toggle del menú móvil
function toggleMenu() {
    const mobileMenu = document.querySelector('.mobile-menu');
    const overlay = document.querySelector('.mobile-menu-overlay');
    const hamburger = document.querySelector('.hamburger');
    
    if (mobileMenu && overlay && hamburger) {
        mobileMenu.classList.toggle('active');
        overlay.classList.toggle('active');
        hamburger.classList.toggle('active');
        document.body.classList.toggle('menu-open');
    }
}

// Funciones de utilidad (si no están definidas en otro archivo)
function resetAllDataDashboard() {
    const confirmMessage = `⚠️ ADVERTENCIA IMPORTANTE ⚠️

¿Estás seguro de que quieres BORRAR TODOS LOS DATOS?

Esto eliminará:
• Todos los partidos registrados
• Todas las estadísticas de modalidad
• Todo el historial
• Datos en ambas páginas (registro y estadísticas)

Esta acción NO se puede deshacer.

Escribe "BORRAR" para confirmar:`;

    const userInput = prompt(confirmMessage);
    
    if (userInput === 'BORRAR') {
        localStorage.removeItem('xisco_matches_data');
        localStorage.removeItem('shared_matches_data');
        localStorage.clear();
        alert('✅ Todos los datos han sido eliminados');
        location.reload();
    } else if (userInput !== null) {
        alert('❌ Reinicio cancelado. Debes escribir exactamente "BORRAR" para confirmar.');
    }
}

function logoutDashboard() {
    if (confirm('¿Cerrar sesión?')) {
        sessionStorage.removeItem('xisco_session_active');
        window.location.href = 'index.html';
    }
}

// Cargar el menú cuando el DOM esté listo
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadTopNavigation);
} else {
    loadTopNavigation();
}
