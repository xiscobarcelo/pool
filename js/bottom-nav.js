// Bottom Navigation Component
function initBottomNav() {
    const navHTML = `
    <nav class="bottom-nav">
        <div class="nav-container">
            <a href="registro-partidos.html" class="nav-item" data-page="registro-partidos">
             <img src="images/partidos.svg" width="24">
                <span class="nav-label">Registrar</span>
            </a>
            
            <a href="estadisticas.html" class="nav-item" data-page="estadisticas">
                            <img src="images/stats.svg" width="24">

                <span class="nav-label">Estadísticas</span>
            </a>
            
            <a href="torneos.html" class="nav-item" data-page="torneos">
                            <img src="images/cup.svg" width="24">

                <span class="nav-label">Torneos</span>
            </a>
            
            <a href="analisis.html" class="nav-item" data-page="analisis">
                            <img src="images/stats1.svg" width="24">

                <span class="nav-label">Análisis</span>
            </a>
              <a href="historial.html" class="nav-item" data-page="historial">
                            <img src="images/historial.svg" width="24">

                <span class="nav-label">Historial</span>
            </a>
        
        </div>
    </nav>
    `;
    
    // Insertar el nav al final del body
    document.body.insertAdjacentHTML('beforeend', navHTML);
    
    // Marcar el elemento activo según la página actual
    setActiveNavItem();
}

function setActiveNavItem() {
    const currentPage = window.location.pathname.split('/').pop().replace('.html', '');
    const navItems = document.querySelectorAll('.nav-item');
    
    navItems.forEach(item => {
        const itemPage = item.getAttribute('data-page');
        if (itemPage === currentPage) {
            item.classList.add('active');
        } else {
            item.classList.remove('active');
        }
    });
}

// Inicializar cuando el DOM esté listo
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initBottomNav);
} else {
    initBottomNav();
}
