// ========================================
// CLOUD SYNC - ULTRA SIMPLE & INMEDIATO
// ========================================

const CloudSync = {
    config: null,
    
    init() {
        const config = localStorage.getItem('xisco_github_config');
        if (config) {
            this.config = JSON.parse(config);
        }
    },
    
    // ========================================
    // OBTENER DATOS - SÍNCRONO Y DIRECTO
    // ========================================
    
    getData() {
        const data = localStorage.getItem('shared_matches_data');
        
        if (data) {
            return JSON.parse(data);
        }
        
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
    // GUARDAR DATOS - INMEDIATO
    // ========================================
    
    saveData(data) {
        // Guardar INMEDIATAMENTE en localStorage
        localStorage.setItem('shared_matches_data', JSON.stringify(data));
        console.log('💾 Guardado local inmediato');
        
        // Subir a GitHub en segundo plano (no bloquea)
        if (this.config && this.config.token) {
            setTimeout(() => {
                this.uploadToGitHub(data);
            }, 100);
        }
    },
    
    // ========================================
    // AÑADIR PARTIDO
    // ========================================
    
    addMatch(match) {
        const data = this.getData();
        
        // ID único
        match.id = Date.now() + Math.floor(Math.random() * 1000);
        
        // Añadir partido
        data.matches.push(match);
        
        // Añadir jugadores si son nuevos
        if (!data.players.includes(match.player1)) {
            data.players.push(match.player1);
        }
        if (!data.players.includes(match.player2)) {
            data.players.push(match.player2);
        }
        
        // Añadir materiales
        if (match.material1 && !data.materials.includes(match.material1)) {
            data.materials.push(match.material1);
        }
        
        // Guardar INMEDIATAMENTE
        this.saveData(data);
        
        console.log('✅ Partido añadido:', match.id);
        return data;
    },
    
    // ========================================
    // ELIMINAR PARTIDO
    // ========================================
    
    deleteMatch(matchId) {
        const data = this.getData();
        
        console.log('🔍 Buscando partido ID:', matchId);
        console.log('📊 Total partidos antes:', data.matches.length);
        
        // Filtrar
        data.matches = data.matches.filter(m => {
            const keep = m.id !== matchId;
            if (!keep) {
                console.log('🗑️ Eliminando partido:', m);
            }
            return keep;
        });
        
        console.log('📊 Total partidos después:', data.matches.length);
        
        // Guardar INMEDIATAMENTE
        this.saveData(data);
        
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
        
        return data;
    },
    
    // ========================================
    // SUBIR A GITHUB (BACKGROUND)
    // ========================================
    
    async uploadToGitHub(data) {
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
                console.log('Archivo no existe, creando nuevo');
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
                console.log('☁️ Subido a GitHub');
                this.showNotification('☁️ Sincronizado', 'success');
            }
            
        } catch (error) {
            console.error('Error GitHub:', error);
        }
    },
    
    // ========================================
    // NOTIFICACIÓN
    // ========================================
    
    showNotification(message, type) {
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
            `;
            document.body.appendChild(notif);
        }
        
        notif.textContent = message;
        notif.style.display = 'block';
        
        setTimeout(() => {
            notif.style.display = 'none';
        }, 2000);
    }
};

// Inicializar
CloudSync.init();
window.CloudSync = CloudSync;
