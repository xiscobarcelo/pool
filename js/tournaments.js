// ============================================================
// GESTIÓN DE TORNEOS - Pool Tracker
// Con sincronización automática a GitHub
// ============================================================

// Configuración
const STORAGE_KEY = 'xisco_matches_data';
const GITHUB_CONFIG_KEY = 'xisco_github_config';

// Datos globales
let matchesData = {
    matches: [],
    players: ['Xisco'],
    materials: ['Velasco+Revo12.9', 'Lucasi+Revo12.9', 'Bear+Centro'],
    modalityStats: {
        bola8: { matchesPlayed: 0, matchesWon: 0, gamesPlayed: 0, gamesWon: 0 },
        bola9: { matchesPlayed: 0, matchesWon: 0, gamesPlayed: 0, gamesWon: 0 },
        bola10: { matchesPlayed: 0, matchesWon: 0, gamesPlayed: 0, gamesWon: 0 }
    },
    tournaments: [],
    circuits: []
};

let currentSection = 'tournaments';
let filteredTournaments = [];
let currentPage = 1;
let itemsPerPage = 30;

// ============================================================
// INICIALIZACIÓN
// ============================================================

document.addEventListener('DOMContentLoaded', async () => {
    // Cargar datos locales primero
    loadData();
    populateSelects();
    renderAll();
    
    // ✅ Limpiar filtros al cargar (evita bug de filtros activados)
    resetFiltersOnLoad();
    
    // Intentar sincronizar automáticamente desde GitHub
    await autoSyncFromGitHub();
    
    // Después de sincronizar, recargar todo
    populateSelects();
    renderAll();
    
    // Mostrar la sección de torneos por defecto con carga automática
    showSection('tournaments');
    
    console.log('✅ Sistema de carga automática activado');
    console.log('   - Los torneos se cargan al abrir la pestaña');
    console.log('   - Los circuitos se cargan al abrir su pestaña');
    console.log('   - Sincronización automática desde GitHub completada');
});

// Cargar datos
function loadData() {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
        try {
            const data = JSON.parse(stored);
            matchesData = {
                ...matchesData,
                ...data,
                tournaments: data.tournaments || [],
                circuits: data.circuits || []
            };
            console.log('✅ Datos cargados:', {
                tournaments: matchesData.tournaments.length,
                circuits: matchesData.circuits.length
            });
        } catch (e) {
            console.error('Error cargando datos:', e);
        }
    } else {
        console.log('⚠️ No hay datos en localStorage');
    }
    
    // Inicializar filtros
    filteredTournaments = matchesData.tournaments;
    console.log('🔍 Torneos filtrados:', filteredTournaments.length);
}

// Guardar datos
function saveData() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(matchesData));
    localStorage.setItem('shared_matches_data', JSON.stringify(matchesData));
    showSyncIndicator();
    
    // Recargar automáticamente la sección actual
    if (currentSection === 'tournaments') {
        renderTournaments();
        console.log('🔄 Torneos recargados automáticamente');
    } else if (currentSection === 'circuits') {
        renderCircuits();
        console.log('🔄 Circuitos recargados automáticamente');
    }
    
    // NO sincronizar automáticamente - el usuario lo hace manualmente
    // syncToGitHub();
}

// ============================================================
// SINCRONIZACIÓN CON GITHUB
// ============================================================

function getGitHubConfig() {
    const config = localStorage.getItem(GITHUB_CONFIG_KEY);
    return config ? JSON.parse(config) : null;
}

function setGitHubConfig(username, repo, token) {
    localStorage.setItem(GITHUB_CONFIG_KEY, JSON.stringify({ username, repo, token }));
}

async function syncToGitHub() {
    let config = getGitHubConfig();

    // Si no hay configuración, pedirla
    if (!config) {
        const username = prompt('🔧 Configuración de GitHub\n\n1️⃣ Introduce tu USUARIO de GitHub:');
        if (!username) return;

        const repo = prompt('2️⃣ Introduce el NOMBRE del repositorio:\n(ejemplo: pool-tracker-data)');
        if (!repo) return;

        const token = prompt('3️⃣ Pega tu TOKEN de acceso personal:\n(empieza con ghp_...)');
        if (!token) return;

        setGitHubConfig(username, repo, token);
        config = { username, repo, token };
        
        alert('✅ Configuración guardada!\nAhora se subirán los datos...');
    }

    // Mostrar loading
    const btn = event ? event.target : null;
    let originalText = '';
    if (btn) {
        originalText = btn.innerHTML;
        btn.innerHTML = '⏳ Subiendo...';
        btn.disabled = true;
    }

    try {
        // Preparar SOLO datos de torneos
        const tournamentsData = {
            tournaments: matchesData.tournaments || [],
            circuits: matchesData.circuits || [],
            lastUpdated: new Date().toISOString()
        };
        
        const dataToUpload = JSON.stringify(tournamentsData, null, 2);
        const encodedContent = btoa(unescape(encodeURIComponent(dataToUpload)));

        // Usar tournaments.json en lugar de data.json
        const getUrl = `https://api.github.com/repos/${config.username}/${config.repo}/contents/app/tournaments.json`;
        let sha = null;

        try {
            const getResponse = await fetch(getUrl, {
                headers: {
                    'Authorization': `token ${config.token}`,
                    'Accept': 'application/vnd.github.v3+json'
                }
            });

            if (getResponse.ok) {
                const fileData = await getResponse.json();
                sha = fileData.sha;
            }
        } catch (e) {
            console.log('Archivo tournaments.json no existe, se creará uno nuevo');
        }

        // Subir archivo
        const putUrl = `https://api.github.com/repos/${config.username}/${config.repo}/contents/app/tournaments.json`;
        
        // Preparar el body del request
        const requestBody = {
            message: `Update tournaments - ${new Date().toLocaleString('es-ES')}`,
            content: encodedContent,
            branch: 'main'
        };
        
        // Solo incluir SHA si existe (archivo ya existente)
        if (sha) {
            requestBody.sha = sha;
        }
        
        const response = await fetch(putUrl, {
            method: 'PUT',
            headers: {
                'Authorization': `token ${config.token}`,
                'Accept': 'application/vnd.github.v3+json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(requestBody)
        });

        if (response.ok) {
            if (btn) {
                btn.innerHTML = '✅ ¡Subido!';
                setTimeout(() => {
                    btn.innerHTML = originalText;
                    btn.disabled = false;
                }, 2000);
            }
            showMessage('☁️ Torneos sincronizados', 'success');
            console.log('✅ Archivo subido correctamente a app/tournaments.json');
        } else {
            const errorData = await response.json();
            console.error('❌ Error de Servidor:', errorData);
            
            let errorMessage = errorData.message || 'Error desconocido';
            
            // Mensajes específicos según el error
            if (response.status === 404) {
                errorMessage = 'Repositorio no encontrado. Verifica el nombre.';
            } else if (response.status === 401) {
                errorMessage = 'Token inválido o sin permisos.';
            } else if (response.status === 422) {
                errorMessage = 'Error en los datos enviados. Verifica que la carpeta "app" exista en tu repositorio.';
            }
            
            throw new Error(errorMessage);
        }

    } catch (error) {
        console.error('Error completo:', error);
        if (btn) {
            btn.innerHTML = originalText;
            btn.disabled = false;
        }
        
        let troubleshootMsg = '';
        if (error.message.includes('Token')) {
            troubleshootMsg = '\n\n📝 Cómo crear un token:\n1. GitHub → Settings → Developer settings\n2. Personal access tokens → Tokens (classic)\n3. Generate new token\n4. Seleccionar scope: repo (todos los checks)\n5. Copiar el token';
        } else if (error.message.includes('Repositorio')) {
            troubleshootMsg = '\n\n📝 Formato del repositorio: usuario/nombre-repo\nEjemplo: juanperez/pool-tracker-data';
        } else if (error.message.includes('carpeta')) {
            troubleshootMsg = '\n\n📝 Crear carpeta "app":\n1. Ve a tu repositorio en GitHub\n2. Click "Add file" → "Create new file"\n3. Escribe: app/README.md\n4. Commit';
        }
        
        alert(`❌ Error al subir a GitHub:\n\n${error.message}${troubleshootMsg}`);
        
        // Opción de reconfigurar
        if (confirm('¿Quieres reconfigurar GitHub?')) {
            localStorage.removeItem(GITHUB_CONFIG_KEY);
            syncToGitHub();
        }
    }
}

async function loadFromGitHub() {
    const config = getGitHubConfig();
    if (!config) {
        alert('⚠️ Primero configura GitHub haciendo click en "↑ Subir a Cloud"');
        return;
    }

    // Mostrar loading
    const btn = event ? event.target : null;
    let originalText = '';
    if (btn) {
        originalText = btn.innerHTML;
        btn.innerHTML = '⏳ Descargando...';
        btn.disabled = true;
    }

    try {
        // Descargar desde tournaments.json
        const githubUrl = `https://raw.githubusercontent.com/${config.username}/${config.repo}/main/app/tournaments.json`;
        
        console.log('🔄 Cargando torneos desde el server:', githubUrl);
        
        const response = await fetch(githubUrl, {
            cache: 'no-cache',
            headers: {
                'Accept': 'application/json'
            }
        });

        if (response.ok) {
            const githubData = await response.json();
            
            // Validar estructura
            if (!githubData.tournaments || !Array.isArray(githubData.tournaments)) {
                throw new Error('Datos inválidos en GitHub');
            }
            
            // Mantener partidos locales y actualizar solo torneos
            matchesData.tournaments = githubData.tournaments || [];
            matchesData.circuits = githubData.circuits || [];
            
            // Guardar localmente
            saveData();
            
            // Re-poblar selectores y renderizar
            populateSelects();
            renderAll();
            
            const tournamentsCount = githubData.tournaments ? githubData.tournaments.length : 0;
            const circuitsCount = githubData.circuits ? githubData.circuits.length : 0;
            const message = `☁️ Torneos actualizados desde GitHub\n${tournamentsCount} torneos y ${circuitsCount} circuitos sincronizados`;
            showMessage(message, 'success');
            console.log('✅ Torneos cargados desde el server:', tournamentsCount, 'torneos');
            
            if (btn) {
                btn.innerHTML = '✅ ¡Descargado!';
                setTimeout(() => {
                    btn.innerHTML = originalText;
                    btn.disabled = false;
                }, 2000);
            }
        } else {
            throw new Error(`Error ${response.status}: ${response.statusText}`);
        }

    } catch (error) {
        console.error('Error cargando desde GitHub:', error);
        if (btn) {
            btn.innerHTML = originalText;
            btn.disabled = false;
        }
        
        alert(`❌ Error al descargar de GitHub:\n\n${error.message}\n\nVerifica:\n• Repositorio existe\n• Archivo tournaments.json existe en /app/\n• Configuración correcta\n\nNOTA: Si es la primera vez, primero SUBE datos para crear el archivo.`);
    }
}

// Sincronización automática silenciosa al cargar
async function autoSyncFromGitHub() {
    const config = getGitHubConfig();
    
    // Si no hay configuración, no hacer nada (silencioso)
    if (!config) {
        console.log('ℹ️ GitHub no configurado - usando datos locales');
        return;
    }

    try {
        const githubUrl = `https://raw.githubusercontent.com/${config.username}/${config.repo}/main/app/tournaments.json`;
        
        console.log('🔄 Sincronización automática desde GitHub...');
        
        const response = await fetch(githubUrl, {
            cache: 'no-cache',
            headers: {
                'Accept': 'application/json'
            }
        });

        if (response.ok) {
            const githubData = await response.json();
            
            // Validar estructura
            if (githubData.tournaments && Array.isArray(githubData.tournaments)) {
                // Actualizar datos
                matchesData.tournaments = githubData.tournaments || [];
                matchesData.circuits = githubData.circuits || [];
                
                // ✅ IMPORTANTE: Actualizar torneos filtrados
                filteredTournaments = matchesData.tournaments;
                
                // Guardar localmente
                localStorage.setItem(STORAGE_KEY, JSON.stringify(matchesData));
                localStorage.setItem('shared_matches_data', JSON.stringify(matchesData));
                
                const tournamentsCount = githubData.tournaments.length;
                const circuitsCount = githubData.circuits ? githubData.circuits.length : 0;
                
                console.log(`✅ Sincronización automática completada: ${tournamentsCount} torneos, ${circuitsCount} circuitos`);
                
                // Mostrar indicador discreto
                showMessage(`☁️ ${tournamentsCount} torneos sincronizados desde la nube`, 'success');
            }
        } else {
            console.log('ℹ️ No se encontraron datos en GitHub - usando datos locales');
        }
    } catch (error) {
        // Error silencioso - solo log en consola
        console.log('ℹ️ No se pudo sincronizar desde GitHub - usando datos locales:', error.message);
    }
}

// Mostrar indicador de sincronización
function showSyncIndicator() {
    const indicator = document.getElementById('syncIndicator');
    if (indicator) {
        indicator.innerHTML = '💾 Guardado localmente';
        indicator.style.background = '#34c759';
        indicator.style.opacity = '1';
        setTimeout(() => {
            indicator.style.opacity = '0';
        }, 2000);
    }
}

// ============================================================
// POBLAR SELECTORES
// ============================================================

function populateSelects() {
    // Circuitos
    const circuitSelect = document.getElementById('tournamentCircuit');
    const filterCircuitSelect = document.getElementById('filterCircuit');
    
    if (circuitSelect) {
        circuitSelect.innerHTML = '<option value="">Sin circuito</option>';
        matchesData.circuits.forEach(circuit => {
            circuitSelect.innerHTML += `<option value="${circuit.id}">${circuit.name}</option>`;
        });
    }
    
    if (filterCircuitSelect) {
        filterCircuitSelect.innerHTML = '<option value="">Todos los circuitos</option>';
        matchesData.circuits.forEach(circuit => {
            filterCircuitSelect.innerHTML += `<option value="${circuit.id}">${circuit.name}</option>`;
        });
    }
    
    // Materiales (tacos)
    const cueSelect = document.getElementById('tournamentCue');
    if (cueSelect) {
        cueSelect.innerHTML = '<option value="">Seleccionar...</option>';
        matchesData.materials.forEach(material => {
            cueSelect.innerHTML += `<option value="${material}">${material}</option>`;
        });
    }
    
    // Años
    const yearSelect = document.getElementById('filterYear');
    if (yearSelect) {
        const years = [...new Set(matchesData.tournaments.map(t => 
            new Date(t.date).getFullYear()
        ))].sort((a, b) => b - a);
        
        yearSelect.innerHTML = '<option value="">Todos los años</option>';
        years.forEach(year => {
            yearSelect.innerHTML += `<option value="${year}">${year}</option>`;
        });
    }
}

// ============================================================
// RENDERIZADO
// ============================================================

function renderAll() {
    renderStats();
    renderTournaments();
    renderCircuits();
    
    // Renderizar gráficos analíticos
    if (typeof renderCharts === 'function') {
        renderCharts();
    }
}

// Renderizar estadísticas globales
function renderStats() {
    const stats = calculateGlobalStats();
    const container = document.getElementById('statsOverview');
    
    if (!container) {
        console.error('❌ Elemento statsOverview no encontrado');
        return;
    }
    
    console.log('📊 Renderizando stats:', stats);
    
    container.innerHTML = `
        
        
        <div class="stat-card-tournament">
            <div class="stat-icon">🥇</div>
            <div class="stat-number">${stats.championships}</div>
            <div class="stat-label">Campeonatos</div>
        </div>
        
        <div class="stat-card-tournament">
            <div class="stat-icon">🥈</div>
            <div class="stat-number">${stats.runnerUps}</div>
            <div class="stat-label">Subcampeón</div>
        </div>
       
        
        <div class="stat-card-tournament">
            <div class="stat-icon">🥉</div>
            <div class="stat-number">${stats.semifinals}</div>
            <div class="stat-label">Semifinales</div>
        </div>
        <div class="stat-card-tournament">
            <div class="stat-icon">🏆</div>
            <div class="stat-number">${stats.totalTournaments}</div>
            <div class="stat-label">Torneos</div>
        </div>
         
        <div class="stat-card-tournament">
            <div class="stat-icon">📊</div>
            <div class="stat-number">${stats.winRate}%</div>
            <div class="stat-label">Win Rate</div>
        </div>
    `;
    
    // Añadir clase para animación
    container.classList.add('fade-in');
}

// Calcular estadísticas globales
function calculateGlobalStats() {
    const tournaments = matchesData.tournaments;
    
    const stats = {
        totalTournaments: tournaments.length,
        championships: tournaments.filter(t => t.result === 'Campeón').length,
        runnerUps: tournaments.filter(t => t.result === 'Subcampeón').length,
        semifinals: tournaments.filter(t => t.result === 'Semifinales').length,
        totalMatches: 0,
        totalWins: 0,
        winRate: 0
    };
    
    tournaments.forEach(t => {
        if (t.stats) {
            stats.totalMatches += t.stats.matchesPlayed || 0;
            stats.totalWins += t.stats.matchesWon || 0;
        }
    });
    
    if (stats.totalMatches > 0) {
        stats.winRate = ((stats.totalWins / stats.totalMatches) * 100).toFixed(1);
    }
    
    return stats;
}

// Renderizar torneos
// Renderizar torneos
function renderTournaments() {
    const container = document.getElementById('tournamentsGrid');
    const empty = document.getElementById('emptyTournaments');
    const pagination = document.getElementById('tournamentsPagination');
    
    if (!container || !empty) return;
    
    if (filteredTournaments.length === 0) {
        container.style.display = 'none';
        empty.style.display = 'block';
        if (pagination) pagination.style.display = 'none';
        return;
    }
    
    container.style.display = 'grid';
    empty.style.display = 'none';
    
    // Ordenar por fecha (más reciente primero)
    const sorted = [...filteredTournaments].sort((a, b) => 
        new Date(b.date) - new Date(a.date)
    );
    
    // Calcular paginación
    const totalPages = Math.ceil(sorted.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const currentTournaments = sorted.slice(startIndex, endIndex);
    
    // Renderizar torneos de la página actual
    container.innerHTML = currentTournaments.map(tournament => {
        const resultClass = getResultClass(tournament.result);
        const trophy = getResultTrophy(tournament.result);
        const circuit = matchesData.circuits.find(c => c.id === tournament.circuit);
        
        return `
            <div class="tournament-card ${resultClass}" onclick="showTournamentDetails('${tournament.id}')">
                <div class="tournament-header">
                    <div style="display: flex; align-items: flex-start; flex: 1;">
                        <div class="tournament-trophy">${trophy}</div>
                        <div class="tournament-title">
                            <h3 class="tournament-name">${tournament.name}</h3>
                            <p class="tournament-date">${formatDate(tournament.date)}</p>
                        </div>
                    </div>
                    <div class="tournament-result-badge ${resultClass}">
                        ${tournament.result}
                    </div>
                </div>
                
                <div class="tournament-details">
                    <div class="tournament-detail">
                        <span class="tournament-detail-label">Modalidad</span>
                        <span class="tournament-detail-value">${tournament.modality}</span>
                    </div>
                    <div class="tournament-detail">
                        <span class="tournament-detail-label">Jugadores</span>
                        <span class="tournament-detail-value">${tournament.totalPlayers || 'N/A'}</span>
                    </div>
                    <div class="tournament-detail">
                        <span class="tournament-detail-label">Taco</span>
                        <span class="tournament-detail-value">${tournament.cue || 'N/A'}</span>
                    </div>
                    ${tournament.finalRival ? `
                        <div class="tournament-detail">
                            <span class="tournament-detail-label">Rival Final</span>
                            <span class="tournament-detail-value">${tournament.finalRival}</span>
                        </div>
                    ` : ''}
                </div>
                
                ${circuit ? `
                    <div style="margin-top: 16px;">
                        <div class="tournament-circuit-tag">
                            ● ${circuit.name}
                        </div>
                    </div>
                ` : ''}
                
                ${tournament.stats && tournament.stats.matchesPlayed > 0 ? `
                    <div class="tournament-stats">
                        <div class="tournament-stat">
                            <div class="tournament-stat-value">${tournament.stats.matchesWon || 0}</div>
                            <div class="tournament-stat-label">Ganados</div>
                        </div>
                        <div class="tournament-stat">
                            <div class="tournament-stat-value">${tournament.stats.matchesPlayed || 0}</div>
                            <div class="tournament-stat-label">Jugados</div>
                        </div>
                        <div class="tournament-stat">
                            <div class="tournament-stat-value">
                                ${tournament.stats.matchesPlayed > 0 ? 
                                    ((tournament.stats.matchesWon / tournament.stats.matchesPlayed) * 100).toFixed(0) : 0}%
                            </div>
                            <div class="tournament-stat-label">Win Rate</div>
                        </div>
                    </div>
                ` : ''}
                
                <div class="tournament-actions">
                    <button class="tournament-action-btn" onclick="event.stopPropagation(); editTournament('${tournament.id}')">
                        Editar
                    </button>
                    <button class="tournament-action-btn delete" onclick="event.stopPropagation(); deleteTournament('${tournament.id}')">
                        Eliminar
                    </button>
                </div>
            </div>
        `;
    }).join('');
    
    // Renderizar controles de paginación
    if (pagination && totalPages > 1) {
        pagination.style.display = 'flex';
        pagination.innerHTML = `
            <div class="pagination-info">
                Mostrando ${startIndex + 1}-${Math.min(endIndex, sorted.length)} de ${sorted.length} torneos
            </div>
            <div class="pagination-controls">
                <button class="pagination-btn" onclick="changePage(${currentPage - 1})" ${currentPage === 1 ? 'disabled' : ''}>
                    Anterior
                </button>
                <span class="pagination-current">Página ${currentPage} de ${totalPages}</span>
                <button class="pagination-btn" onclick="changePage(${currentPage + 1})" ${currentPage === totalPages ? 'disabled' : ''}>
                    Siguiente
                </button>
            </div>
        `;
    } else if (pagination) {
        pagination.style.display = 'none';
    }
}

// Renderizar circuitos
function renderCircuits() {
    const container = document.getElementById('circuitsGrid');
    const empty = document.getElementById('emptyCircuits');
    
    if (!container || !empty) return;
    
    if (matchesData.circuits.length === 0) {
        container.style.display = 'none';
        empty.style.display = 'block';
        return;
    }
    
    container.style.display = 'grid';
    empty.style.display = 'none';
    
    container.innerHTML = matchesData.circuits.map(circuit => {
        const tournamentsCount = matchesData.tournaments.filter(t => 
            t.circuit === circuit.id
        ).length;
        
        const totalPoints = calculateCircuitPoints(circuit);
        
        return `
            <div class="circuit-card">
                <div class="circuit-header">
                    <div>
                        <h3 class="circuit-name">${circuit.name}</h3>
                        <p class="circuit-year">${circuit.year}</p>
                    </div>
                    <div class="circuit-points">
                        <div class="circuit-points-value">${totalPoints}</div>
                        <div class="circuit-points-label">Puntos</div>
                    </div>
                </div>
                
                ${circuit.description ? `
                    <p class="circuit-description">${circuit.description}</p>
                ` : ''}
                
                <div class="tournament-circuits-count">
                    🏆 ${tournamentsCount} torneos
                </div>
                
                ${circuit.ranking ? `
                    <div class="circuit-ranking">
                        <div class="circuit-ranking-label">Tu posición</div>
                        <div class="circuit-ranking-value">
                            ${circuit.ranking}<span class="ordinal">º</span>
                        </div>
                    </div>
                ` : ''}
                
                <div class="tournament-actions" style="margin-top: 20px;">
                    <button class="tournament-action-btn" onclick="editCircuit('${circuit.id}')">
                        Editar
                    </button>
                    <button class="tournament-action-btn delete" onclick="deleteCircuit('${circuit.id}')">
                        Eliminar
                    </button>
                </div>
            </div>
        `;
    }).join('');
}

// ============================================================
// FUNCIONES DE HELPERS
// ============================================================

function getResultClass(result) {
    if (result === 'Campeón') return 'champion';
    if (result === 'Subcampeón') return 'runner-up';
    if (result === 'Semifinales') return 'semifinal';
    return 'other';
}

function getResultTrophy(result) {
    if (result === 'Campeón') return '🥇';
    if (result === 'Subcampeón') return '🥈';
    if (result === 'Semifinales') return '🥉';
    if (result === 'Cuartos de Final') return '🏅';
    return '🎯';
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    });
}

function calculateCircuitPoints(circuit) {
    let total = 0;
    
    matchesData.tournaments.forEach(tournament => {
        if (tournament.circuit === circuit.id) {
            const points = circuit.pointsSystem?.[tournament.result] || 0;
            total += points;
        }
    });
    
    return total;
}

// ============================================================
// GESTIÓN DE TORNEOS
// ============================================================

function saveTournament(event) {
    event.preventDefault();
    
    const tournamentData = {
        name: document.getElementById('tournamentName').value,
        date: document.getElementById('tournamentDate').value,
        modality: document.getElementById('tournamentModality').value,
        totalPlayers: parseInt(document.getElementById('tournamentPlayers').value) || 0,
        result: document.getElementById('tournamentResult').value,
        circuit: document.getElementById('tournamentCircuit').value || null,
        cue: document.getElementById('tournamentCue').value,
        finalRival: document.getElementById('tournamentRival').value,
        notes: document.getElementById('tournamentNotes').value,
        stats: {
            matchesPlayed: parseInt(document.getElementById('tournamentMatchesPlayed').value) || 0,
            matchesWon: parseInt(document.getElementById('tournamentMatchesWon').value) || 0,
            matchesLost: 0,
            gamesWon: parseInt(document.getElementById('tournamentGamesWon').value) || 0,
            gamesLost: parseInt(document.getElementById('tournamentGamesLost').value) || 0,
            winRate: 0,
            averageGamesPerMatch: 0
        }
    };
    
    // Calcular stats derivadas
    tournamentData.stats.matchesLost = tournamentData.stats.matchesPlayed - tournamentData.stats.matchesWon;
    if (tournamentData.stats.matchesPlayed > 0) {
        tournamentData.stats.winRate = ((tournamentData.stats.matchesWon / tournamentData.stats.matchesPlayed) * 100).toFixed(1);
        tournamentData.stats.averageGamesPerMatch = 
            ((tournamentData.stats.gamesWon + tournamentData.stats.gamesLost) / tournamentData.stats.matchesPlayed).toFixed(1);
    }
    
    if (editingTournamentId) {
        // MODO EDICIÓN - Actualizar torneo existente
        const index = matchesData.tournaments.findIndex(t => t.id === editingTournamentId);
        if (index !== -1) {
            // Mantener el ID y fecha de creación originales
            matchesData.tournaments[index] = {
                ...tournamentData,
                id: editingTournamentId,
                createdAt: matchesData.tournaments[index].createdAt,
                updatedAt: new Date().toISOString()
            };
            showMessage('✅ Torneo actualizado correctamente', 'success');
        }
        editingTournamentId = null;
    } else {
        // MODO CREACIÓN - Nuevo torneo
        const tournament = {
            ...tournamentData,
            id: `tournament_${Date.now()}`,
            createdAt: new Date().toISOString()
        };
        matchesData.tournaments.push(tournament);
        showMessage('✅ Torneo guardado correctamente', 'success');
    }
    
    saveData();
    
    // Resetear formulario
    document.getElementById('tournamentForm').reset();
    resetFormToCreateMode();
    
    // Volver a la lista
    showSection('tournaments');
}

function deleteTournament(id) {
    if (!confirm('¿Estás seguro de que quieres eliminar este torneo?')) return;
    
    matchesData.tournaments = matchesData.tournaments.filter(t => t.id !== id);
    saveData();
    renderAll();
    
    showMessage('🗑️ Torneo eliminado', 'success');
}

// Variable global para saber si estamos editando
let editingTournamentId = null;

function editTournament(id) {
    const tournament = matchesData.tournaments.find(t => t.id === id);
    if (!tournament) {
        showMessage('❌ Torneo no encontrado', 'error');
        return;
    }
    
    // Guardar ID del torneo que estamos editando
    editingTournamentId = id;
    
    // Cambiar a la sección de añadir
    showSection('add');
    
    // Cambiar el título
    const titleElement = document.querySelector('#addTournamentSection .section-title');
    if (titleElement) {
        titleElement.textContent = 'Editar Torneo';
    }
    
    const descElement = document.querySelector('#addTournamentSection .section-description');
    if (descElement) {
        descElement.textContent = 'Actualiza los detalles de tu competición';
    }
    
    // Rellenar el formulario con los datos existentes
    document.getElementById('tournamentName').value = tournament.name;
    document.getElementById('tournamentDate').value = tournament.date;
    document.getElementById('tournamentModality').value = tournament.modality;
    document.getElementById('tournamentPlayers').value = tournament.totalPlayers || '';
    document.getElementById('tournamentResult').value = tournament.result;
    document.getElementById('tournamentCircuit').value = tournament.circuit || '';
    document.getElementById('tournamentCue').value = tournament.cue || '';
    document.getElementById('tournamentRival').value = tournament.finalRival || '';
    document.getElementById('tournamentNotes').value = tournament.notes || '';
    
    // Stats
    if (tournament.stats) {
        document.getElementById('tournamentMatchesPlayed').value = tournament.stats.matchesPlayed || '';
        document.getElementById('tournamentMatchesWon').value = tournament.stats.matchesWon || '';
        document.getElementById('tournamentGamesWon').value = tournament.stats.gamesWon || '';
        document.getElementById('tournamentGamesLost').value = tournament.stats.gamesLost || '';
    }
    
    // Cambiar el texto del botón de guardar
    const submitBtn = document.querySelector('#tournamentForm button[type="submit"]');
    if (submitBtn) {
        submitBtn.innerHTML = '💾 Actualizar Torneo';
    }
    
    // Scroll hacia arriba
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function showTournamentDetails(id) {
    // Por implementar
    console.log('Mostrar detalles del torneo:', id);
}

// ============================================================
// GESTIÓN DE CIRCUITOS
// ============================================================

function showAddCircuitModal() {
    const name = prompt('Nombre del circuito:');
    if (!name) return;
    
    const year = prompt('Año:', new Date().getFullYear());
    if (!year) return;
    
    const description = prompt('Descripción (opcional):');
    
    const circuit = {
        id: `circuit_${Date.now()}`,
        name: name,
        year: parseInt(year),
        description: description || '',
        pointsSystem: {
            'Campeón': 100,
            'Subcampeón': 75,
            'Semifinales': 50,
            'Cuartos de Final': 25,
            'Octavos de Final': 15,
            'Dieciseisavos': 10,
            'Fase de Grupos': 5,
            'Eliminado en Ronda 1': 3,
            'Participación': 1
        },
        tournaments: [],
        totalPoints: 0,
        ranking: null
    };
    
    matchesData.circuits.push(circuit);
    saveData();
    populateSelects();
    renderAll();
    
    showMessage('✅ Circuito creado correctamente', 'success');
}

function deleteCircuit(id) {
    if (!confirm('¿Estás seguro? Esto no eliminará los torneos asociados.')) return;
    
    matchesData.circuits = matchesData.circuits.filter(c => c.id !== id);
    
    // Quitar circuito de los torneos
    matchesData.tournaments.forEach(t => {
        if (t.circuit === id) {
            t.circuit = null;
        }
    });
    
    saveData();
    populateSelects();
    renderAll();
    
    showMessage('🗑️ Circuito eliminado', 'success');
}

function editCircuit(id) {
    const circuit = matchesData.circuits.find(c => c.id === id);
    if (!circuit) {
        showMessage('❌ Circuito no encontrado', 'error');
        return;
    }
    
    const name = prompt('Nombre del circuito:', circuit.name);
    if (name === null) return; // Usuario canceló
    if (!name.trim()) {
        showMessage('❌ El nombre no puede estar vacío', 'error');
        return;
    }
    
    const year = prompt('Año:', circuit.year);
    if (year === null) return; // Usuario canceló
    if (!year || isNaN(parseInt(year))) {
        showMessage('❌ Año inválido', 'error');
        return;
    }
    
    const description = prompt('Descripción (opcional):', circuit.description || '');
    if (description === null) return; // Usuario canceló
    
    // Actualizar circuito
    circuit.name = name.trim();
    circuit.year = parseInt(year);
    circuit.description = description.trim();
    
    saveData();
    populateSelects();
    renderAll();
    
    showMessage('✅ Circuito actualizado correctamente', 'success');
}

// ============================================================
// PAGINACIÓN
// ============================================================

function changePage(page) {
    const totalPages = Math.ceil(filteredTournaments.length / itemsPerPage);
    
    if (page < 1 || page > totalPages) return;
    
    currentPage = page;
    renderTournaments();
    
    // Scroll suave hacia arriba
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ============================================================
// FILTROS
// ============================================================

// Limpiar filtros al cargar (sin renderizar)
function resetFiltersOnLoad() {
    // Limpiar selectores sin disparar onChange
    const filterYear = document.getElementById('filterYear');
    const filterModality = document.getElementById('filterModality');
    const filterCircuit = document.getElementById('filterCircuit');
    const filterResult = document.getElementById('filterResult');
    
    if (filterYear) filterYear.value = '';
    if (filterModality) filterModality.value = '';
    if (filterCircuit) filterCircuit.value = '';
    if (filterResult) filterResult.value = '';
    
    // Asegurar que filteredTournaments tiene todos los torneos
    filteredTournaments = matchesData.tournaments;
    
    console.log('🔍 Filtros reseteados al cargar');
}

function applyFilters() {
    const year = document.getElementById('filterYear').value;
    const modality = document.getElementById('filterModality').value;
    const circuit = document.getElementById('filterCircuit').value;
    const result = document.getElementById('filterResult').value;
    
    filteredTournaments = matchesData.tournaments.filter(t => {
        if (year && new Date(t.date).getFullYear() !== parseInt(year)) return false;
        if (modality && t.modality !== modality) return false;
        if (circuit && t.circuit !== circuit) return false;
        if (result && t.result !== result) return false;
        return true;
    });
    
    // Reset a la primera página al filtrar
    currentPage = 1;
    renderTournaments();
}

function resetFilters() {
    document.getElementById('filterYear').value = '';
    document.getElementById('filterModality').value = '';
    document.getElementById('filterCircuit').value = '';
    document.getElementById('filterResult').value = '';
    
    filteredTournaments = matchesData.tournaments;
    currentPage = 1; // Reset a primera página
    renderTournaments();
}

// ============================================================
// NAVEGACIÓN
// ============================================================

function resetFormToCreateMode() {
    editingTournamentId = null;
    
    // Restaurar títulos originales
    const titleElement = document.querySelector('#addTournamentSection .section-title');
    if (titleElement) {
        titleElement.textContent = 'Nuevo Torneo';
    }
    
    const descElement = document.querySelector('#addTournamentSection .section-description');
    if (descElement) {
        descElement.textContent = 'Registra los detalles de tu competición';
    }
    
    // Restaurar texto del botón
    const submitBtn = document.querySelector('#tournamentForm button[type="submit"]');
    if (submitBtn) {
        submitBtn.innerHTML = '💾 Crear Torneo';
    }
}

function cancelEditTournament() {
    // Resetear formulario
    document.getElementById('tournamentForm').reset();
    resetFormToCreateMode();
    
    // Volver a la lista
    showSection('tournaments');
}

// ============================================================
// NAVEGACIÓN
// ============================================================

function showSection(section) {
    currentSection = section;
    
    // Si vamos a añadir y NO estamos editando, resetear el formulario
    if (section === 'add' && editingTournamentId === null) {
        resetFormToCreateMode();
    }
    
    // Ocultar todas las secciones
    document.getElementById('tournamentsSection').style.display = 'none';
    document.getElementById('circuitsSection').style.display = 'none';
    document.getElementById('addTournamentSection').style.display = 'none';
    
    // Mostrar sección actual y cargar datos automáticamente
    if (section === 'tournaments') {
        document.getElementById('tournamentsSection').style.display = 'block';
        // Cargar torneos automáticamente
        renderTournaments();
        console.log('📊 Torneos cargados automáticamente');
    } else if (section === 'circuits') {
        document.getElementById('circuitsSection').style.display = 'block';
        // Cargar circuitos automáticamente
        renderCircuits();
        console.log('🔄 Circuitos cargados automáticamente');
    } else if (section === 'add') {
        document.getElementById('addTournamentSection').style.display = 'block';
        // Establecer fecha de hoy por defecto solo si no estamos editando
        if (editingTournamentId === null) {
            document.getElementById('tournamentDate').value = new Date().toISOString().split('T')[0];
        }
    }
    
    // Actualizar botones activos
    document.querySelectorAll('.button-group .btn, .button-group .btn-secondary').forEach(btn => {
        btn.classList.remove('btn-primary');
        btn.classList.add('btn-secondary');
    });
    
    const activeBtn = document.querySelector(`.button-group button[onclick*="showSection('${section}')"]`);
    if (activeBtn) {
        activeBtn.classList.remove('btn-secondary');
        activeBtn.classList.add('btn-primary');
    }
}

// ============================================================
// EXPORTACIÓN
// ============================================================

function exportToJSON() {
    const data = {
        tournaments: matchesData.tournaments,
        circuits: matchesData.circuits,
        exportDate: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `torneos_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    
    showMessage('📄 JSON exportado correctamente', 'success');
}

function exportToCSV() {
    const headers = [
        'Nombre',
        'Fecha',
        'Modalidad',
        'Total Jugadores',
        'Resultado',
        'Circuito',
        'Taco',
        'Rival Final',
        'Partidos Jugados',
        'Partidos Ganados'
    ];
    
    const rows = matchesData.tournaments.map(t => {
        const circuit = matchesData.circuits.find(c => c.id === t.circuit);
        return [
            t.name,
            t.date,
            t.modality,
            t.totalPlayers,
            t.result,
            circuit ? circuit.name : 'N/A',
            t.cue || 'N/A',
            t.finalRival || 'N/A',
            t.stats?.matchesPlayed || 0,
            t.stats?.matchesWon || 0
        ];
    });
    
    const csv = [
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `torneos_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    
    showMessage('📊 CSV exportado correctamente', 'success');
}

// ============================================================
// UTILIDADES
// ============================================================

function showMessage(text, type = 'success') {
    const existing = document.querySelector('.message');
    if (existing) existing.remove();
    
    const message = document.createElement('div');
    message.className = `message ${type}`;
    message.textContent = text;
    message.style.cssText = `
        position: fixed;
        top: 90px;
        right: 20px;
        padding: 16px 24px;
        border-radius: 12px;
        font-weight: 600;
        font-size: 0.95rem;
        box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
        z-index: 10000;
        animation: slideIn 0.3s ease-out;
        background: ${type === 'success' ? '#34c759' : '#007aff'};
        color: white;
    `;
    
    document.body.appendChild(message);
    
    setTimeout(() => message.remove(), 3000);
}

function resetAllData() {
    if (!confirm('⚠️ ¿BORRAR TODOS LOS DATOS DE TORNEOS? Esta acción no se puede deshacer.')) return;
    
    const confirmText = prompt('Escribe "BORRAR" para confirmar:');
    if (confirmText !== 'BORRAR') {
        alert('❌ Cancelado');
        return;
    }
    
    matchesData.tournaments = [];
    matchesData.circuits = [];
    saveData();
    renderAll();
    
    showMessage('🗑️ Todos los datos han sido eliminados', 'success');
}

function logout() {
    if (confirm('¿Cerrar sesión?')) {
        sessionStorage.removeItem('xisco_session_active');
        window.location.href = 'index.html';
    }
}

// ============================================================
// GRÁFICOS ANALÍTICOS
// ============================================================

let charts = {
    yearResults: null,
    materialPerformance: null,
    timeline: null
};

// Renderizar todos los gráficos
function renderCharts() {
    if (matchesData.tournaments.length === 0) {
        // Ocultar sección de gráficos si no hay datos
        const analyticsSection = document.querySelector('.analytics-section');
        if (analyticsSection) {
            analyticsSection.style.display = 'none';
        }
        return;
    }
    
    const analyticsSection = document.querySelector('.analytics-section');
    if (analyticsSection) {
        analyticsSection.style.display = 'block';
    }
    
    renderYearResultsChart();
    renderMaterialPerformanceChart();
    renderTimelineChart();
}

// Gráfico 1: Resultados por Año
function renderYearResultsChart() {
    const ctx = document.getElementById('yearResultsChart');
    if (!ctx) return;
    
    // Destruir gráfico anterior si existe
    if (charts.yearResults) {
        charts.yearResults.destroy();
    }
    
    // Agrupar por año y resultado
    const yearData = {};
    
    matchesData.tournaments.forEach(t => {
        const year = new Date(t.date).getFullYear();
        if (!yearData[year]) {
            yearData[year] = {
                'Campeón': 0,
                'Subcampeón': 0,
                'Semifinales': 0,
                'Otros': 0
            };
        }
        
        if (t.result === 'Campeón') {
            yearData[year]['Campeón']++;
        } else if (t.result === 'Subcampeón') {
            yearData[year]['Subcampeón']++;
        } else if (t.result === 'Semifinales') {
            yearData[year]['Semifinales']++;
        } else {
            yearData[year]['Otros']++;
        }
    });
    
    const years = Object.keys(yearData).sort();
    
    const datasets = [
        {
            label: '🥇 Campeón',
            data: years.map(y => yearData[y]['Campeón']),
            backgroundColor: 'rgba(255, 215, 0, 0.8)',
            borderColor: 'rgba(255, 215, 0, 1)',
            borderWidth: 2
        },
        {
            label: '🥈 Subcampeón',
            data: years.map(y => yearData[y]['Subcampeón']),
            backgroundColor: 'rgba(192, 192, 192, 0.8)',
            borderColor: 'rgba(192, 192, 192, 1)',
            borderWidth: 2
        },
        {
            label: '🥉 Semifinales',
            data: years.map(y => yearData[y]['Semifinales']),
            backgroundColor: 'rgba(205, 127, 50, 0.8)',
            borderColor: 'rgba(205, 127, 50, 1)',
            borderWidth: 2
        },
        {
            label: 'Otros',
            data: years.map(y => yearData[y]['Otros']),
            backgroundColor: 'rgba(102, 126, 234, 0.3)',
            borderColor: 'rgba(102, 126, 234, 1)',
            borderWidth: 2
        }
    ];
    
    charts.yearResults = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: years,
            datasets: datasets
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'top',
                    labels: {
                        font: {
                            family: '-apple-system, BlinkMacSystemFont, Inter, sans-serif',
                            size: 12
                        },
                        padding: 15,
                        usePointStyle: true
                    }
                },
                tooltip: {
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    padding: 12,
                    titleFont: {
                        size: 14,
                        weight: 'bold'
                    },
                    bodyFont: {
                        size: 13
                    },
                    cornerRadius: 8
                }
            },
            scales: {
                x: {
                    stacked: true,
                    grid: {
                        display: false
                    },
                    ticks: {
                        font: {
                            size: 12
                        }
                    }
                },
                y: {
                    stacked: true,
                    beginAtZero: true,
                    ticks: {
                        stepSize: 1,
                        font: {
                            size: 12
                        }
                    },
                    grid: {
                        color: 'rgba(0, 0, 0, 0.05)'
                    }
                }
            }
        }
    });
}

// Gráfico 2: Rendimiento por Material (Taco)
function renderMaterialPerformanceChart() {
    const ctx = document.getElementById('materialPerformanceChart');
    if (!ctx) return;
    
    if (charts.materialPerformance) {
        charts.materialPerformance.destroy();
    }
    
    // Agrupar por material
    const materialData = {};
    
    matchesData.tournaments.forEach(t => {
        if (!t.cue || t.cue === '') return;
        
        if (!materialData[t.cue]) {
            materialData[t.cue] = {
                total: 0,
                championships: 0,
                podium: 0 // Top 3
            };
        }
        
        materialData[t.cue].total++;
        
        if (t.result === 'Campeón') {
            materialData[t.cue].championships++;
            materialData[t.cue].podium++;
        } else if (t.result === 'Subcampeón' || t.result === 'Semifinales') {
            materialData[t.cue].podium++;
        }
    });
    
    // Calcular porcentaje de éxito (podium / total)
    const materials = Object.keys(materialData);
    const successRates = materials.map(m => {
        return (materialData[m].podium / materialData[m].total * 100).toFixed(1);
    });
    
    // Ordenar por tasa de éxito
    const sortedData = materials
        .map((m, i) => ({ material: m, rate: parseFloat(successRates[i]), total: materialData[m].total }))
        .sort((a, b) => b.rate - a.rate)
        .slice(0, 5); // Top 5
    
    if (sortedData.length === 0) {
        // No hay datos de materiales
        ctx.getContext('2d').font = '14px Inter';
        ctx.getContext('2d').fillStyle = '#86868b';
        ctx.getContext('2d').textAlign = 'center';
        ctx.getContext('2d').fillText('No hay datos de tacos registrados', ctx.width / 2, ctx.height / 2);
        return;
    }
    
    charts.materialPerformance = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: sortedData.map(d => `${d.material} (${d.total})`),
            datasets: [{
                data: sortedData.map(d => d.rate),
                backgroundColor: [
                    'rgba(255, 215, 0, 0.8)',
                    'rgba(102, 126, 234, 0.8)',
                    'rgba(52, 199, 89, 0.8)',
                    '(0, 255, 242, 0.8)',
                    'rgba(88, 86, 214, 0.8)'
                ],
                borderColor: '#fff',
                borderWidth: 3
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'right',
                    labels: {
                        font: {
                            family: '-apple-system, BlinkMacSystemFont, Inter, sans-serif',
                            size: 11
                        },
                        padding: 12,
                        usePointStyle: true,
                        generateLabels: function(chart) {
                            const data = chart.data;
                            return data.labels.map((label, i) => ({
                                text: `${label}: ${data.datasets[0].data[i]}%`,
                                fillStyle: data.datasets[0].backgroundColor[i],
                                hidden: false,
                                index: i
                            }));
                        }
                    }
                },
                tooltip: {
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    padding: 12,
                    titleFont: {
                        size: 13,
                        weight: 'bold'
                    },
                    bodyFont: {
                        size: 12
                    },
                    cornerRadius: 8,
                    callbacks: {
                        label: function(context) {
                            return `Éxito: ${context.parsed}% (Top 3)`;
                        }
                    }
                }
            }
        }
    });
}

// Gráfico 3: Evolución Temporal
function renderTimelineChart() {
    const ctx = document.getElementById('timelineChart');
    if (!ctx) return;
    
    if (charts.timeline) {
        charts.timeline.destroy();
    }
    
    // Ordenar torneos por fecha
    const sorted = [...matchesData.tournaments].sort((a, b) => 
        new Date(a.date) - new Date(b.date)
    );
    
    // Asignar valor numérico a resultados
    const resultValues = {
        'Campeón': 5,
        'Subcampeón': 4,
        'Semifinales': 3,
        'Cuartos de Final': 2,
        'Octavos de Final': 1,
        'Dieciseisavos': 1,
        'Fase de Grupos': 1,
        'Eliminado en Ronda 1': 0,
        'Participación': 0
    };
    
    const dates = sorted.map(t => {
        const date = new Date(t.date);
        return date.toLocaleDateString('es-ES', { month: 'short', year: '2-digit' });
    });
    
    const values = sorted.map(t => resultValues[t.result] || 0);
    
    charts.timeline = new Chart(ctx, {
        type: 'line',
        data: {
            labels: dates,
            datasets: [{
                label: 'Rendimiento',
                data: values,
                borderColor: '#00d9ff',
                backgroundColor: 'rgba(0, 0, 0, 0.01)',
                borderWidth: 3,
                fill: true,
                tension: 0.4,
                pointRadius: 5,
                pointHoverRadius: 7,
                pointBackgroundColor: 'rgba(102, 126, 234, 1)',
                pointBorderColor: '#fff',
                pointBorderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    padding: 12,
                    cornerRadius: 8,
                    callbacks: {
                        title: function(context) {
                            const index = context[0].dataIndex;
                            return sorted[index].name;
                        },
                        label: function(context) {
                            const index = context.dataIndex;
                            return sorted[index].result;
                        }
                    }
                }
            },
            scales: {
                x: {
                    grid: {
                        display: false
                    },
                    ticks: {
                        maxRotation: 45,
                        minRotation: 45,
                        font: {
                            size: 10
                        }
                    }
                },
                y: {
                    beginAtZero: true,
                    max: 5,
                    ticks: {
                        stepSize: 1,
                        callback: function(value) {
                            const labels = ['', 'Octavos', 'Cuartos', 'Semi', 'Sub', 'Campeón'];
                            return labels[value] || '';
                        },
                        font: {
                            size: 11
                        }
                    },
                    grid: {
                        color: 'rgba(0, 0, 0, 0.05)'
                    }
                }
            }
        }
    });
}

// Gráfico 4: Win Rate por Modalidad

// Integrar gráficos en la función renderAll existente
// (Los gráficos se renderizarán automáticamente cuando se llame a renderAll)
