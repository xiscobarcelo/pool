// ========================================
// CLOUD SYNC - TRAININGS
// Sistema de sincronización para entrenamientos
// ========================================

const TrainingCloudSync = {
    config: null,
    syncing: false,
    
    init() {
        const config = localStorage.getItem('xisco_github_config');
        if (config) {
            this.config = JSON.parse(config);
            console.log('✅ TrainingCloudSync configurado para:', this.config.username + '/' + this.config.repo);
        } else {
            console.log('⚠️ TrainingCloudSync sin configurar (solo local)');
        }
    },
    
    // ========================================
    // OBTENER DATOS - SIEMPRE DESDE LOCALSTORAGE
    // ========================================
    
    getData() {
        const data = localStorage.getItem('xisco_trainings_data');
        
        if (data) {
            const parsed = JSON.parse(data);
            console.log('📦 Entrenamientos cargados:', parsed.trainings?.length || 0);
            return parsed;
        }
        
        console.log('📦 Sin entrenamientos, estructura vacía');
        return {
            trainings: [],
            version: '1.0'
        };
    },
    
    // ========================================
    // GUARDAR DATOS - INMEDIATO + BACKGROUND SYNC
    // ========================================
    
    saveData(data) {
        // 1. Guardar localmente INMEDIATO
        localStorage.setItem('xisco_trainings_data', JSON.stringify(data));
        console.log('💾 Entrenamientos guardados localmente');
        
        // 2. Si hay config, sincronizar en background
        if (this.config && this.config.token) {
            setTimeout(() => {
                this.pushToGitHub(data);
            }, 100);
        }
        
        return data;
    },
    
    // ========================================
    // PUSH A GITHUB - BACKGROUND
    // ========================================
    
    async pushToGitHub(data) {
        if (this.syncing) {
            console.log('⏳ Ya hay una sincronización en curso...');
            return;
        }
        
        this.syncing = true;
        this.updateSyncUI(true);
        
        try {
            console.log('☁️ Subiendo entrenamientos a GitHub...');
            
            const { username, repo, token } = this.config;
            const branch = 'main';
            const path = 'trainings.json';
            
            // 1. Obtener SHA del archivo actual (si existe)
            let sha = null;
            try {
                const getResponse = await fetch(
                    `https://api.github.com/repos/${username}/${repo}/contents/${path}?ref=${branch}`,
                    {
                        headers: {
                            'Authorization': `token ${token}`,
                            'Accept': 'application/vnd.github.v3+json'
                        }
                    }
                );
                
                if (getResponse.ok) {
                    const fileData = await getResponse.json();
                    sha = fileData.sha;
                    console.log('📄 Archivo existente encontrado, SHA:', sha);
                }
            } catch (e) {
                console.log('📄 Archivo nuevo, no existe SHA previo');
            }
            
            // 2. Subir archivo
            const content = btoa(unescape(encodeURIComponent(JSON.stringify(data, null, 2))));
            
            const payload = {
                message: `Update trainings - ${new Date().toISOString()}`,
                content: content,
                branch: branch
            };
            
            if (sha) {
                payload.sha = sha;
            }
            
            const putResponse = await fetch(
                `https://api.github.com/repos/${username}/${repo}/contents/${path}`,
                {
                    method: 'PUT',
                    headers: {
                        'Authorization': `token ${token}`,
                        'Accept': 'application/vnd.github.v3+json',
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(payload)
                }
            );
            
            if (putResponse.ok) {
                console.log('✅ Entrenamientos sincronizados con GitHub');
                this.showSyncNotification('Sincronizado con la nube ☁️', 'success');
            } else {
                const error = await putResponse.json();
                console.error('❌ Error al sincronizar:', error);
                this.showSyncNotification('Error al sincronizar', 'error');
            }
            
        } catch (error) {
            console.error('❌ Error en sincronización:', error);
            this.showSyncNotification('Error al sincronizar', 'error');
        } finally {
            this.syncing = false;
            this.updateSyncUI(false);
        }
    },
    
    // ========================================
    // PULL DESDE GITHUB - MANUAL
    // ========================================
    
    async pullFromGitHub() {
        if (!this.config || !this.config.token) {
            console.log('⚠️ No hay configuración de GitHub');
            return null;
        }
        
        if (this.syncing) {
            console.log('⏳ Ya hay una sincronización en curso...');
            return null;
        }
        
        this.syncing = true;
        this.updateSyncUI(true);
        
        try {
            console.log('☁️ Descargando entrenamientos desde GitHub...');
            
            const { username, repo, token } = this.config;
            const branch = 'main';
            const path = 'trainings.json';
            
            const response = await fetch(
                `https://api.github.com/repos/${username}/${repo}/contents/${path}?ref=${branch}`,
                {
                    headers: {
                        'Authorization': `token ${token}`,
                        'Accept': 'application/vnd.github.v3+json'
                    }
                }
            );
            
            if (response.ok) {
                const fileData = await response.json();
                const content = decodeURIComponent(escape(atob(fileData.content)));
                const data = JSON.parse(content);
                
                console.log('✅ Entrenamientos descargados:', data.trainings?.length || 0);
                
                // Guardar localmente
                this.saveData(data);
                
                this.showSyncNotification('Datos actualizados desde la nube ☁️', 'success');
                
                return data;
            } else if (response.status === 404) {
                console.log('📄 Archivo trainings.json no existe aún en GitHub');
                return null;
            } else {
                console.error('❌ Error al descargar:', response.status);
                this.showSyncNotification('Error al descargar datos', 'error');
                return null;
            }
            
        } catch (error) {
            console.error('❌ Error en descarga:', error);
            this.showSyncNotification('Error al descargar datos', 'error');
            return null;
        } finally {
            this.syncing = false;
            this.updateSyncUI(false);
        }
    },
    
    // ========================================
    // UI HELPERS
    // ========================================
    
    updateSyncUI(syncing) {
        const syncButton = document.getElementById('syncButton');
        if (syncButton) {
            if (syncing) {
                syncButton.classList.add('syncing');
            } else {
                syncButton.classList.remove('syncing');
            }
        }
    },
    
    showSyncNotification(message, type = 'info') {
        // Crear notificación temporal
        const notification = document.createElement('div');
        notification.className = `sync-notification ${type}`;
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 80px;
            right: 20px;
            background: ${type === 'success' ? '#34c759' : type === 'error' ? '#ff3b30' : '#007aff'};
            color: white;
            padding: 16px 24px;
            border-radius: 12px;
            font-weight: 600;
            z-index: 1000;
            animation: slideIn 0.3s ease;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }
};

// ========================================
// AÑADIR ENTRENAMIENTO
// ========================================

function addTraining(trainingData) {
    const data = TrainingCloudSync.getData();
    
    // Generar ID único
    const id = 'training_' + Date.now();
    
    const training = {
        id: id,
        date: trainingData.date,
        duration: parseInt(trainingData.duration) || 0,
        modality: trainingData.modality,
        totalShots: parseInt(trainingData.totalShots),
        totalErrors: parseInt(trainingData.totalErrors),
        errors: {
            banda: parseInt(trainingData.errors.banda) || 0,
            combinacion: parseInt(trainingData.errors.combinacion) || 0,
            posicionBlanca: parseInt(trainingData.errors.posicionBlanca) || 0,
            noForzado: parseInt(trainingData.errors.noForzado) || 0
        },
        notes: trainingData.notes || '',
        timestamp: new Date().toISOString()
    };
    
    // Calcular precisión
    training.accuracy = training.totalShots > 0 
        ? ((training.totalShots - training.totalErrors) / training.totalShots * 100).toFixed(1)
        : 0;
    
    data.trainings.push(training);
    
    // Ordenar por fecha (más reciente primero)
    data.trainings.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    TrainingCloudSync.saveData(data);
    
    console.log('✅ Entrenamiento añadido:', training);
    
    return training;
}

// ========================================
// ELIMINAR ENTRENAMIENTO
// ========================================

function deleteTraining(trainingId) {
    const data = TrainingCloudSync.getData();
    
    const index = data.trainings.findIndex(t => t.id === trainingId);
    
    if (index !== -1) {
        const training = data.trainings[index];
        data.trainings.splice(index, 1);
        TrainingCloudSync.saveData(data);
        console.log('🗑️ Entrenamiento eliminado:', training);
        return true;
    }
    
    return false;
}

// ========================================
// OBTENER ESTADÍSTICAS
// ========================================

function getTrainingStats() {
    const data = TrainingCloudSync.getData();
    const trainings = data.trainings || [];
    
    if (trainings.length === 0) {
        return {
            totalTrainings: 0,
            totalHours: 0,
            totalShots: 0,
            totalErrors: 0,
            accuracyRate: 0,
            errorsByType: {
                banda: 0,
                combinacion: 0,
                posicionBlanca: 0,
                noForzado: 0
            },
            byModality: {}
        };
    }
    
    const stats = {
        totalTrainings: trainings.length,
        totalHours: 0,
        totalShots: 0,
        totalErrors: 0,
        errorsByType: {
            banda: 0,
            combinacion: 0,
            posicionBlanca: 0,
            noForzado: 0
        },
        byModality: {}
    };
    
    trainings.forEach(t => {
        stats.totalHours += t.duration || 0;
        stats.totalShots += t.totalShots;
        stats.totalErrors += t.totalErrors;
        
        stats.errorsByType.banda += t.errors.banda;
        stats.errorsByType.combinacion += t.errors.combinacion;
        stats.errorsByType.posicionBlanca += t.errors.posicionBlanca;
        stats.errorsByType.noForzado += t.errors.noForzado;
        
        // Por modalidad
        if (!stats.byModality[t.modality]) {
            stats.byModality[t.modality] = {
                trainings: 0,
                shots: 0,
                errors: 0,
                accuracy: 0
            };
        }
        
        stats.byModality[t.modality].trainings++;
        stats.byModality[t.modality].shots += t.totalShots;
        stats.byModality[t.modality].errors += t.totalErrors;
    });
    
    // Calcular precisión general
    stats.accuracyRate = stats.totalShots > 0 
        ? ((stats.totalShots - stats.totalErrors) / stats.totalShots * 100).toFixed(1)
        : 0;
    
    // Calcular precisión por modalidad
    Object.keys(stats.byModality).forEach(modality => {
        const mod = stats.byModality[modality];
        mod.accuracy = mod.shots > 0 
            ? ((mod.shots - mod.errors) / mod.shots * 100).toFixed(1)
            : 0;
    });
    
    // Convertir minutos a horas
    stats.totalHoursFormatted = (stats.totalHours / 60).toFixed(1) + 'h';
    
    return stats;
}

// ========================================
// INICIALIZAR AL CARGAR
// ========================================

TrainingCloudSync.init();

console.log('✅ TrainingCloudSync cargado');
