// ========================================
// CLOUD SYNC - FINAL VERSION
// Sincronización bidireccional automática
// ========================================

const CloudSync = {
    config: null,
    syncing: false,
    
    init() {
        const config = localStorage.getItem('xisco_github_config');
        if (config) {
            this.config = JSON.parse(config);
            console.log('✅ CloudSync configurado para:', this.config.username + '/' + this.config.repo);
        } else {
            console.log('⚠️ CloudSync sin configurar (solo local)');
        }
    },
    
    // ========================================
    // OBTENER DATOS - SIEMPRE DESDE LOCALSTORAGE
    // ========================================
    
    getData() {
        const data = localStorage.getItem('shared_matches_data');
        
        if (data) {
            const parsed = JSON.parse(data);
            console.log('📦 Datos cargados:', parsed.matches.length, 'partidos');
            return parsed;
        }
        
        console.log('📦 Sin datos, estructura vacía');
        return {
            matches: [],
            players: ["Xisco"],
            materials: ["Velasco+Revo12.9", "Lucasi+Revo12.9", "Bear+Centro"],
            modalityStats: {
                bola8: { matchesPlayed: 0, matchesWon: 0, gamesPlayed: 0, gamesWon: 0 },
                bola9: { matchesPlayed: 0, matchesWon: 0, gamesPlayed: 0, gamesWon: 0 },
                bola10: { matchesPlayed: 0, matchesWon: 0, gamesPlayed: 0, gamesWon: 0 }
            }
        };
    },
    
    // ========================================
    // GUARDAR DATOS - INMEDIATO + BACKGROUND SYNC
    // ========================================
    
    saveData(data) {
        // 1. Guardar INMEDIATAMENTE en localStorage
        localStorage.setItem('shared_matches_data', JSON.stringify(data));
        console.log('💾 [LOCAL] Guardado:', data.matches.length, 'partidos');
        
        // 2. Subir a GitHub en segundo plano
        if (this.config && this.config.token) {
            setTimeout(() => {
                this.pushToGitHub(data);
            }, 100);
        }
    },
    
    // ========================================
    // AÑADIR PARTIDO
    // ========================================
    
    addMatch(match) {
        const data = this.getData();
        
        match.id = Date.now() + Math.floor(Math.random() * 1000);
        data.matches.push(match);
        
        if (!data.players.includes(match.player1)) data.players.push(match.player1);
        if (!data.players.includes(match.player2)) data.players.push(match.player2);
        if (match.material1 && !data.materials.includes(match.material1)) {
            data.materials.push(match.material1);
        }
        
        this.saveData(data);
        console.log('✅ [ADD] Partido añadido. ID:', match.id);
        
        return data;
    },
    
    // ========================================
    // ELIMINAR PARTIDO
    // ========================================
    
    deleteMatch(matchId) {
        const data = this.getData();
        
        const before = data.matches.length;
        data.matches = data.matches.filter(m => m.id !== matchId);
        const after = data.matches.length;
        
        this.saveData(data);
        console.log(`🗑️ [DELETE] Partido eliminado. Antes: ${before}, Después: ${after}`);
        
        return data;
    },
    
    // ========================================
    // ACTUALIZAR PARTIDO
    // ========================================
    
    updateMatch(matchId, updatedMatch) {
        const data = this.getData();
        
        const index = data.matches.findIndex(m => m.id === matchId);
        if (index !== -1) {
            data.matches[index] = { ...data.matches[index], ...updatedMatch };
        }
        
        this.saveData(data);
        console.log('✅ [UPDATE] Partido actualizado. ID:', matchId);
        
        return data;
    },
    
    // ========================================
    // SUBIR A GITHUB (PUSH)
    // ========================================
    
    async pushToGitHub(data) {
        if (this.syncing) {
            console.log('⏳ Sync ya en progreso...');
            return;
        }
        
        this.syncing = true;
        
        try {
            const apiUrl = `https://api.github.com/repos/${this.config.username}/${this.config.repo}/contents/appx/data.json`;
            
            // Obtener SHA
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
            } catch (e) {
                console.log('📝 Creando archivo nuevo en GitHub');
            }
            
            // Subir
            const content = btoa(unescape(encodeURIComponent(JSON.stringify(data, null, 2))));
            
            const payload = {
                message: `Update - ${new Date().toLocaleString('es-ES')}`,
                content: content,
                branch: 'main'
            };
            
            if (sha) payload.sha = sha;
            
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
                console.log('☁️ [PUSH] Subido a GitHub');
                this.showNotification('☁️ Sincronizado con GitHub');
            } else {
                console.error('❌ [PUSH] Error:', response.status);
            }
            
        } catch (error) {
            console.error('❌ [PUSH] Error:', error);
        } finally {
            this.syncing = false;
        }
    },
    
    // ========================================
    // BAJAR DE GITHUB (PULL)
    // ========================================
    
    async pullFromGitHub() {
        if (!this.config || !this.config.token) {
            console.log('⚠️ Sin configuración de GitHub');
            return null;
        }
        
        try {
            const url = `https://raw.githubusercontent.com/${this.config.username}/${this.config.repo}/main/appx/data.json`;
            
            console.log('🔄 [PULL] Descargando desde GitHub...');
            
            const response = await fetch(url, {
                cache: 'no-cache',
                headers: { 'Accept': 'application/json' }
            });
            
            if (response.ok) {
                const githubData = await response.json();
                
                // Comparar con datos locales
                const localData = this.getData();
                
                console.log('📊 Local:', localData.matches.length, 'partidos');
                console.log('📊 GitHub:', githubData.matches.length, 'partidos');
                
                // Si GitHub tiene más datos recientes, usar esos
                if (githubData.matches.length !== localData.matches.length) {
                    localStorage.setItem('shared_matches_data', JSON.stringify(githubData));
                    console.log('✅ [PULL] Datos actualizados desde GitHub');
                    this.showNotification('🔄 Actualizado desde GitHub');
                    return githubData;
                } else {
                    console.log('✅ [PULL] Datos ya sincronizados');
                }
                
                return githubData;
            } else {
                console.log('⚠️ [PULL] No se pudo descargar:', response.status);
            }
            
        } catch (error) {
            console.error('❌ [PULL] Error:', error);
        }
        
        return null;
    },
    
    // ========================================
    // NOTIFICACIÓN
    // ========================================
    
    showNotification(message) {
        let notif = document.getElementById('sync-notif');
        
        if (!notif) {
            notif = document.createElement('div');
            notif.id = 'sync-notif';
            notif.style.cssText = `
                position: fixed;
                top: 80px;
                right: 20px;
                padding: 12px 20px;
                border-radius: 10px;
                font-weight: 600;
                font-size: 0.85rem;
                z-index: 10000;
                box-shadow: 0 4px 15px rgba(0,0,0,0.2);
                background: linear-gradient(135deg, #00d9ff 0%, #00fff2 100%);
                color: #0a0a2e;
                animation: slideIn 0.3s ease-out;
            `;
            
            // Añadir estilos de animación
            if (!document.getElementById('sync-animation-styles')) {
                const style = document.createElement('style');
                style.id = 'sync-animation-styles';
                style.textContent = `
                    @keyframes slideIn {
                        from { transform: translateX(400px); opacity: 0; }
                        to { transform: translateX(0); opacity: 1; }
                    }
                `;
                document.head.appendChild(style);
            }
            
            document.body.appendChild(notif);
        }
        
        notif.textContent = message;
        notif.style.display = 'block';
        
        setTimeout(() => {
            notif.style.display = 'none';
        }, 2500);
    }
};

// Inicializar
CloudSync.init();
window.CloudSync = CloudSync;

console.log('🚀 CloudSync cargado');
