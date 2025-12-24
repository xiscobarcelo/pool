// ========================================
// CLOUD SYNC MODULE - Sincronización Automática
// ========================================

const CloudSync = {
    config: null,
    syncInProgress: false,
    
    // Inicializar el módulo
    init() {
        this.loadConfig();
        console.log('🔄 CloudSync inicializado');
    },
    
    // Cargar configuración de GitHub
    loadConfig() {
        const config = localStorage.getItem('xisco_github_config');
        if (config) {
            this.config = JSON.parse(config);
            console.log('✅ Configuración de GitHub cargada');
        } else {
            console.log('⚠️ No hay configuración de GitHub');
        }
    },
    
    // Obtener datos actuales (combina localStorage con GitHub)
    async getData() {
        // Primero intentar GitHub
        if (this.config) {
            try {
                const githubData = await this.getFromGitHub();
                if (githubData) {
                    // Guardar en localStorage como backup
                    localStorage.setItem('shared_matches_data', JSON.stringify(githubData));
                    return githubData;
                }
            } catch (error) {
                console.error('Error obteniendo datos de GitHub:', error);
            }
        }
        
        // Fallback a localStorage
        const localData = localStorage.getItem('shared_matches_data');
        if (localData) {
            return JSON.parse(localData);
        }
        
        // Si no hay datos, retornar estructura vacía
        return {
            matches: [],
            players: ["Xisco"],
            materials: [],
            modalityStats: {
                bola8: { matchesPlayed: 0, matchesWon: 0, gamesPlayed: 0, gamesWon: 0 },
                bola9: { matchesPlayed: 0, matchesWon: 0, gamesPlayed: 0, gamesWon: 0 },
                bola10: { matchesPlayed: 0, matchesWon: 0, gamesPlayed: 0, gamesWon: 0 }
            }
        };
    },
    
    // Obtener datos desde GitHub
    async getFromGitHub() {
        if (!this.config) return null;
        
        const url = `https://raw.githubusercontent.com/${this.config.username}/${this.config.repo}/main/appx/data.json`;
        
        const response = await fetch(url, {
            cache: 'no-cache',
            headers: { 'Accept': 'application/json' }
        });
        
        if (response.ok) {
            return await response.json();
        }
        
        return null;
    },
    
    // Guardar datos (localStorage + GitHub)
    async saveData(data) {
        if (this.syncInProgress) {
            console.log('⏳ Sincronización en progreso, esperando...');
            return false;
        }
        
        this.syncInProgress = true;
        
        try {
            // 1. Guardar en localStorage inmediatamente
            localStorage.setItem('shared_matches_data', JSON.stringify(data));
            console.log('✅ Datos guardados en localStorage');
            
            // 2. Si hay configuración de GitHub, subir a la nube
            if (this.config && this.config.token) {
                await this.uploadToGitHub(data);
            } else {
                console.log('⚠️ No hay token de GitHub, solo guardado local');
            }
            
            this.syncInProgress = false;
            return true;
            
        } catch (error) {
            console.error('❌ Error guardando datos:', error);
            this.syncInProgress = false;
            return false;
        }
    },
    
    // Subir datos a GitHub
    async uploadToGitHub(data) {
        if (!this.config || !this.config.token) {
            console.log('⚠️ No se puede subir a GitHub: falta configuración');
            return false;
        }
        
        try {
            const apiUrl = `https://api.github.com/repos/${this.config.username}/${this.config.repo}/contents/appx/data.json`;
            
            // Obtener el SHA del archivo actual
            let sha = null;
            try {
                const getResponse = await fetch(apiUrl, {
                    headers: {
                        'Authorization': `token ${this.config.token}`,
                        'Accept': 'application/vnd.github.v3+json'
                    }
                });
                
                if (getResponse.ok) {
                    const fileData = await getResponse.json();
                    sha = fileData.sha;
                }
            } catch (error) {
                console.log('📝 Archivo no existe, se creará uno nuevo');
            }
            
            // Preparar contenido
            const content = btoa(unescape(encodeURIComponent(JSON.stringify(data, null, 2))));
            
            // Crear/actualizar archivo
            const payload = {
                message: `Update data.json - ${new Date().toISOString()}`,
                content: content,
                branch: 'main'
            };
            
            if (sha) {
                payload.sha = sha;
            }
            
            const response = await fetch(apiUrl, {
                method: 'PUT',
                headers: {
                    'Authorization': `token ${this.config.token}`,
                    'Accept': 'application/vnd.github.v3+json',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });
            
            if (response.ok) {
                console.log('☁️ Datos subidos a GitHub correctamente');
                this.showSyncNotification('success');
                return true;
            } else {
                const errorData = await response.json();
                console.error('❌ Error subiendo a GitHub:', errorData);
                this.showSyncNotification('error');
                return false;
            }
            
        } catch (error) {
            console.error('❌ Error en uploadToGitHub:', error);
            this.showSyncNotification('error');
            return false;
        }
    },
    
    // Añadir un partido
    async addMatch(match) {
        const data = await this.getData();
        
        // Generar ID único
        match.id = Date.now();
        
        // Añadir partido
        data.matches.push(match);
        
        // Añadir jugadores si son nuevos
        if (!data.players.includes(match.player1)) {
            data.players.push(match.player1);
        }
        if (!data.players.includes(match.player2)) {
            data.players.push(match.player2);
        }
        
        // Añadir materiales si son nuevos
        if (match.material1 && !data.materials.includes(match.material1)) {
            data.materials.push(match.material1);
        }
        if (match.material2 && !data.materials.includes(match.material2)) {
            data.materials.push(match.material2);
        }
        
        // Guardar
        const success = await this.saveData(data);
        
        if (success) {
            console.log('✅ Partido añadido y sincronizado');
        }
        
        return success;
    },
    
    // Eliminar un partido
    async deleteMatch(matchId) {
        const data = await this.getData();
        
        // Filtrar el partido
        data.matches = data.matches.filter(m => m.id !== matchId);
        
        // Guardar
        const success = await this.saveData(data);
        
        if (success) {
            console.log('✅ Partido eliminado y sincronizado');
        }
        
        return success;
    },
    
    // Actualizar un partido
    async updateMatch(matchId, updatedMatch) {
        const data = await this.getData();
        
        // Encontrar y actualizar partido
        const index = data.matches.findIndex(m => m.id === matchId);
        if (index !== -1) {
            data.matches[index] = { ...data.matches[index], ...updatedMatch };
        }
        
        // Guardar
        const success = await this.saveData(data);
        
        if (success) {
            console.log('✅ Partido actualizado y sincronizado');
        }
        
        return success;
    },
    
    // Actualizar estadísticas de modalidad
    async updateModalityStats(modalityStats) {
        const data = await this.getData();
        
        data.modalityStats = modalityStats;
        
        // Guardar
        const success = await this.saveData(data);
        
        if (success) {
            console.log('✅ Estadísticas de modalidad actualizadas y sincronizadas');
        }
        
        return success;
    },
    
    // Mostrar notificación de sincronización
    showSyncNotification(type) {
        // Buscar si ya existe una notificación
        let notification = document.getElementById('sync-notification');
        
        if (!notification) {
            notification = document.createElement('div');
            notification.id = 'sync-notification';
            notification.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                padding: 16px 24px;
                border-radius: 12px;
                font-weight: 600;
                font-size: 0.9rem;
                z-index: 10000;
                display: flex;
                align-items: center;
                gap: 10px;
                box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
                animation: slideInRight 0.3s ease-out;
            `;
            document.body.appendChild(notification);
        }
        
        if (type === 'success') {
            notification.style.background = 'linear-gradient(135deg, #00d9ff 0%, #00fff2 100%)';
            notification.style.color = '#0a0a2e';
            notification.innerHTML = '☁️ Sincronizado con GitHub';
        } else if (type === 'error') {
            notification.style.background = 'linear-gradient(135deg, #ff3b30 0%, #ff6b6b 100%)';
            notification.style.color = '#fff';
            notification.innerHTML = '⚠️ Error de sincronización';
        } else if (type === 'local') {
            notification.style.background = 'linear-gradient(135deg, #34c759 0%, #5fd068 100%)';
            notification.style.color = '#fff';
            notification.innerHTML = '💾 Guardado localmente';
        }
        
        // Ocultar después de 3 segundos
        setTimeout(() => {
            notification.style.animation = 'slideOutRight 0.3s ease-out';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 3000);
    }
};

// Estilos para animaciones
const syncStyles = document.createElement('style');
syncStyles.textContent = `
    @keyframes slideInRight {
        from {
            transform: translateX(400px);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOutRight {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(400px);
            opacity: 0;
        }
    }
`;
document.head.appendChild(syncStyles);

// Inicializar automáticamente
CloudSync.init();

// Exportar para uso global
window.CloudSync = CloudSync;
