// ===================================
// FUNCIONES COMUNES COMPARTIDAS
// ===================================

// Toggle menú hamburguesa
function toggleMenu() {
    const hamburger = document.querySelector('.hamburger');
    const mobileMenu = document.querySelector('.mobile-menu');
    const overlay = document.querySelector('.mobile-menu-overlay');
    
    hamburger.classList.toggle('active');
    mobileMenu.classList.toggle('active');
    overlay.classList.toggle('active');
}

// Toggle info desplegable
function toggleInfo(id) {
    const content = document.getElementById(id);
    const chevron = document.getElementById(id + 'Chevron');
    
    content.classList.toggle('active');
    if (chevron) {
        chevron.classList.toggle('active');
    }
}

// Cerrar menú al hacer click en un enlace
document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('.mobile-nav .nav-link').forEach(link => {
        link.addEventListener('click', () => {
            if (!link.getAttribute('onclick')) {
                toggleMenu();
            }
        });
    });

    // Cerrar menú al hacer click en overlay
    const overlay = document.querySelector('.mobile-menu-overlay');
    if (overlay) {
        overlay.addEventListener('click', toggleMenu);
    }
});

// Función de logout
function logout() {
    if (confirm('¿Cerrar sesión?')) {
        sessionStorage.removeItem('xisco_session_active');
        window.location.href = 'index.html';
    }
}
