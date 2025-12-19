// ============================================================
// USER MANAGER - Pool Tracker
// Gestiona autenticación y personalización del usuario
// ============================================================

const UserManager = {
    // ============================================================
    // OBTENER INFORMACIÓN DEL USUARIO
    // ============================================================
    
    getUser: function() {
        const userStr = localStorage.getItem('pool_tracker_user');
        if (!userStr) return null;
        
        try {
            return JSON.parse(userStr);
        } catch (e) {
            console.error('Error parsing user data:', e);
            return null;
        }
    },
    
    getUserName: function() {
        const user = this.getUser();
        if (!user) return 'Usuario';
        
        // Si es invitado, usar nombre genérico
        if (user.loginMethod === 'guest') {
            return 'Invitado';
        }
        
        // Si tiene nombre, usarlo
        if (user.name) {
            // Usar solo el primer nombre
            return user.name.split(' ')[0];
        }
        
        // Si tiene email, usar la parte antes del @
        if (user.email) {
            return user.email.split('@')[0];
        }
        
        return 'Usuario';
    },
    
    getUserEmail: function() {
        const user = this.getUser();
        return user?.email || null;
    },
    
    getUserPicture: function() {
        const user = this.getUser();
        return user?.picture || null;
    },
    
    isGuest: function() {
        const user = this.getUser();
        return user?.loginMethod === 'guest';
    },
    
    isLoggedIn: function() {
        return !!this.getUser();
    },
    
    // ============================================================
    // PERSONALIZACIÓN DE UI
    // ============================================================
    
    updatePageTitle: function() {
        const userName = this.getUserName();
        const titleElements = document.querySelectorAll('[data-user-name]');
        
        titleElements.forEach(el => {
            const template = el.getAttribute('data-user-name');
            el.textContent = template.replace('{name}', userName);
        });
        
        // También actualizar el título de la página si contiene "Xisco"
        if (document.title.includes('Xisco')) {
            document.title = document.title.replace('Xisco', userName);
        }
    },
    
    updateUserProfile: function() {
        const userName = this.getUserName();
        const userPicture = this.getUserPicture();
        
        // Actualizar nombre en el header
        const userNameElements = document.querySelectorAll('.user-name, [data-user-name]');
        userNameElements.forEach(el => {
            if (el.hasAttribute('data-user-name')) {
                const template = el.getAttribute('data-user-name');
                el.textContent = template.replace('{name}', userName);
            } else {
                el.textContent = userName;
            }
        });
        
        // Actualizar foto de perfil
        const userPictureElements = document.querySelectorAll('.user-picture, [data-user-picture]');
        userPictureElements.forEach(el => {
            if (userPicture) {
                el.src = userPicture;
                el.style.display = 'block';
            } else {
                // Mostrar inicial si no hay foto
                el.style.display = 'none';
                const initial = userName.charAt(0).toUpperCase();
                const parent = el.parentElement;
                if (parent && !parent.querySelector('.user-initial')) {
                    const initialEl = document.createElement('div');
                    initialEl.className = 'user-initial';
                    initialEl.textContent = initial;
                    initialEl.style.cssText = `
                        width: 40px;
                        height: 40px;
                        border-radius: 50%;
                        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                        color: white;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        font-weight: 600;
                        font-size: 16px;
                    `;
                    parent.appendChild(initialEl);
                }
            }
        });
        
        // Actualizar saludos personalizados
        const greetings = document.querySelectorAll('[data-greeting]');
        greetings.forEach(el => {
            const hour = new Date().getHours();
            let greeting = 'Hola';
            
            if (hour < 12) greeting = 'Buenos días';
            else if (hour < 20) greeting = 'Buenas tardes';
            else greeting = 'Buenas noches';
            
            el.textContent = `${greeting}, ${userName}`;
        });
    },
    
    // ============================================================
    // GESTIÓN DE SESIÓN
    // ============================================================
    
    logout: function() {
        // Confirmar
        if (!confirm('¿Cerrar sesión? Tus datos locales se mantendrán.')) {
            return;
        }
        
        // Limpiar sesión
        localStorage.removeItem('pool_tracker_user');
        sessionStorage.removeItem('xisco_session_active');
        
        // Redirigir al login
        window.location.href = 'index.html';
    },
    
    requireAuth: function() {
        if (!this.isLoggedIn() || !sessionStorage.getItem('xisco_session_active')) {
            window.location.href = 'index.html';
        }
    },
    
    // ============================================================
    // SINCRONIZACIÓN EN LA NUBE
    // ============================================================
    
    canSync: function() {
        return !this.isGuest();
    },
    
    getCloudStorageKey: function() {
        const user = this.getUser();
        if (!user) return null;
        
        // Usar el ID del usuario para crear una clave única
        return `pool_tracker_data_${user.id}`;
    },
    
    // ============================================================
    // INICIALIZACIÓN
    // ============================================================
    
    init: function() {
        // Verificar autenticación
        this.requireAuth();
        
        // Actualizar UI
        this.updatePageTitle();
        this.updateUserProfile();
        
        // Log de usuario
        const user = this.getUser();
        console.log('👤 Usuario activo:', this.getUserName());
        console.log('📧 Email:', this.getUserEmail() || 'N/A');
        console.log('🔐 Método:', user?.loginMethod || 'desconocido');
        console.log('☁️ Sincronización:', this.canSync() ? 'Disponible' : 'No disponible (invitado)');
        
        return user;
    }
};

// ============================================================
// HEADER DE USUARIO MEJORADO
// ============================================================

function createUserHeader() {
    const user = UserManager.getUser();
    if (!user) return '';
    
    const userName = UserManager.getUserName();
    const userPicture = UserManager.getUserPicture();
    const isGuest = UserManager.isGuest();
    
    return `
        <div class="user-header">
            <div class="user-info">
                ${userPicture ? 
                    `<img src="${userPicture}" class="user-avatar" alt="${userName}">` :
                    `<div class="user-avatar-initial">${userName.charAt(0).toUpperCase()}</div>`
                }
                <div class="user-details">
                    <div class="user-name">${userName}</div>
                    ${isGuest ? 
                        '<div class="user-status">Modo invitado</div>' :
                        `<div class="user-status">${user.email}</div>`
                    }
                </div>
            </div>
            <button class="logout-btn" onclick="UserManager.logout()">
                Cerrar sesión
            </button>
        </div>
    `;
}

// ============================================================
// ESTILOS CSS PARA COMPONENTES DE USUARIO
// ============================================================

function injectUserStyles() {
    if (document.getElementById('user-manager-styles')) return;
    
    const style = document.createElement('style');
    style.id = 'user-manager-styles';
    style.textContent = `
        .user-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 16px 20px;
            background: rgba(255, 255, 255, 0.95);
            border-bottom: 1px solid rgba(0, 0, 0, 0.1);
        }
        
        .user-info {
            display: flex;
            align-items: center;
            gap: 12px;
        }
        
        .user-avatar {
            width: 40px;
            height: 40px;
            border-radius: 50%;
            object-fit: cover;
            border: 2px solid #fff;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }
        
        .user-avatar-initial {
            width: 40px;
            height: 40px;
            border-radius: 50%;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: 600;
            font-size: 16px;
            box-shadow: 0 2px 8px rgba(102, 126, 234, 0.3);
        }
        
        .user-details {
            display: flex;
            flex-direction: column;
        }
        
        .user-name {
            font-weight: 600;
            font-size: 15px;
            color: #1d1d1f;
        }
        
        .user-status {
            font-size: 13px;
            color: #86868b;
        }
        
        .logout-btn {
            padding: 8px 16px;
            background: transparent;
            border: 1px solid rgba(0, 0, 0, 0.15);
            border-radius: 8px;
            color: #1d1d1f;
            font-size: 14px;
            font-weight: 500;
            cursor: pointer;
            transition: all 0.2s;
        }
        
        .logout-btn:hover {
            background: rgba(0, 0, 0, 0.05);
            border-color: rgba(0, 0, 0, 0.25);
        }
        
        @media (max-width: 768px) {
            .user-header {
                flex-direction: column;
                gap: 12px;
            }
            
            .logout-btn {
                width: 100%;
            }
        }
    `;
    
    document.head.appendChild(style);
}

// ============================================================
// AUTO-INICIALIZACIÓN
// ============================================================

// Si esta página requiere autenticación, inicializar automáticamente
if (typeof document !== 'undefined') {
    document.addEventListener('DOMContentLoaded', () => {
        // Solo inicializar si no estamos en la página de login
        if (!window.location.pathname.includes('index.html')) {
            injectUserStyles();
            UserManager.init();
        }
    });
}

// Exportar para uso global
if (typeof window !== 'undefined') {
    window.UserManager = UserManager;
    window.createUserHeader = createUserHeader;
}
