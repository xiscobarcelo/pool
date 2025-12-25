// ============================================================
// GESTIÓN DE TORNEOS - Pool Tracker CON CloudSync
// ============================================================

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
let editingTournamentId = null;

// ============================================================
// INICIALIZACIÓN CON CloudSync
// ============================================================

document.addEventListener('DOMContentLoaded', async () => {
    console.log('🚀 Inicializando torneos...');
    
    // 1️⃣ CARGAR DATOS LOCALES INMEDIATAMENTE
    const localData = CloudSync.getData();
    matchesData = {
        ...matchesData,
        ...localData,
        tournaments: localData.tournaments || [],
        circuits: localData.circuits || []
    };
    
    filteredTournaments = matchesData.tournaments;
    
    console.log('📦 Datos locales:', matchesData.tournaments.length, 'torneos,', matchesData.circuits.length, 'circuitos');
    
    // Renderizar UI
    populateSelects();
    renderAll();
    resetFiltersOnLoad();
    showSection('tournaments');
    
    // 2️⃣ SINCRONIZAR CON GITHUB EN SEGUNDO PLANO
    if (CloudSync.config && CloudSync.config.token) {
        setTimeout(async () => {
            console.log('🔄 Sincronizando torneos con GitHub...');
            
            const githubData = await CloudSync.pullFromGitHub();
            
            if (githubData) {
                console.log('📦 Datos de GitHub:', githubData.tournaments?.length || 0, 'torneos');
                
                // Solo actualizar si hay cambios
                if (githubData.tournaments && githubData.tournaments.length !== matchesData.tournaments.length) {
                    console.log('🔄 Actualizando UI con datos de GitHub');
                    
                    matchesData.tournaments = githubData.tournaments || [];
                    matchesData.circuits = githubData.circuits || [];
                    filteredTournaments = matchesData.tournaments;
                    
                    populateSelects();
                    renderAll();
                } else {
                    console.log('✅ Torneos ya sincronizados');
                }
            }
        }, 500);
    }
});

// ============================================================
// GUARDAR DATOS CON CloudSync
// ============================================================

function saveData() {
    console.log('💾 Guardando datos...');
    
    // ✅ Usar CloudSync para guardar
    CloudSync.saveData(matchesData);
    
    showSyncIndicator();
    
    // Recargar automáticamente la sección actual
    if (currentSection === 'tournaments') {
        renderTournaments();
        console.log('🔄 Torneos recargados automáticamente');
    } else if (currentSection === 'circuits') {
        renderCircuits();
        console.log('🔄 Circuitos recargados automáticamente');
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
    
    if (typeof renderCharts === 'function') {
        renderCharts();
    }
}

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
    
    container.classList.add('fade-in');
}

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

// ============================================================
// GESTIÓN DE TORNEOS CON CloudSync
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
    
    console.log(editingTournamentId ? '✏️ Editando torneo' : '➕ Creando torneo');
    
    if (editingTournamentId) {
        // MODO EDICIÓN
        const index = matchesData.tournaments.findIndex(t => t.id === editingTournamentId);
        if (index !== -1) {
            matchesData.tournaments[index] = {
                ...tournamentData,
                id: editingTournamentId,
                createdAt: matchesData.tournaments[index].createdAt,
                updatedAt: new Date().toISOString()
            };
            
            console.log('✅ Torneo actualizado:', editingTournamentId);
            showMessage('✅ Torneo actualizado correctamente', 'success');
        }
        editingTournamentId = null;
    } else {
        // MODO CREACIÓN
        const tournament = {
            ...tournamentData,
            id: `tournament_${Date.now()}`,
            createdAt: new Date().toISOString()
        };
        matchesData.tournaments.push(tournament);
        
        console.log('✅ Torneo creado:', tournament.id);
        showMessage('✅ Torneo guardado correctamente', 'success');
    }
    
    // ✅ Guardar con CloudSync
    saveData();
    
    // Actualizar filtros
    filteredTournaments = matchesData.tournaments;
    
    // Resetear formulario
    document.getElementById('tournamentForm').reset();
    resetFormToCreateMode();
    
    // Volver a la lista
    showSection('tournaments');
}

function deleteTournament(id) {
    if (!confirm('¿Estás seguro de que quieres eliminar este torneo?')) return;
    
    console.log('🗑️ Eliminando torneo:', id);
    
    const before = matchesData.tournaments.length;
    matchesData.tournaments = matchesData.tournaments.filter(t => t.id !== id);
    const after = matchesData.tournaments.length;
    
    console.log(`Torneos. Antes: ${before}, Después: ${after}`);
    
    // ✅ Guardar con CloudSync
    saveData();
    
    // Actualizar filtros
    filteredTournaments = matchesData.tournaments;
    
    renderAll();
    showMessage('🗑️ Torneo eliminado', 'success');
}

function editTournament(id) {
    const tournament = matchesData.tournaments.find(t => t.id === id);
    if (!tournament) {
        showMessage('❌ Torneo no encontrado', 'error');
        return;
    }
    
    console.log('✏️ Editando torneo:', id);
    
    editingTournamentId = id;
    showSection('add');
    
    const titleElement = document.querySelector('#addTournamentSection .section-title');
    if (titleElement) {
        titleElement.textContent = 'Editar Torneo';
    }
    
    const descElement = document.querySelector('#addTournamentSection .section-description');
    if (descElement) {
        descElement.textContent = 'Actualiza los detalles de tu competición';
    }
    
    document.getElementById('tournamentName').value = tournament.name;
    document.getElementById('tournamentDate').value = tournament.date;
    document.getElementById('tournamentModality').value = tournament.modality;
    document.getElementById('tournamentPlayers').value = tournament.totalPlayers || '';
    document.getElementById('tournamentResult').value = tournament.result;
    document.getElementById('tournamentCircuit').value = tournament.circuit || '';
    document.getElementById('tournamentCue').value = tournament.cue || '';
    document.getElementById('tournamentRival').value = tournament.finalRival || '';
    document.getElementById('tournamentNotes').value = tournament.notes || '';
    
    if (tournament.stats) {
        document.getElementById('tournamentMatchesPlayed').value = tournament.stats.matchesPlayed || '';
        document.getElementById('tournamentMatchesWon').value = tournament.stats.matchesWon || '';
        document.getElementById('tournamentGamesWon').value = tournament.stats.gamesWon || '';
        document.getElementById('tournamentGamesLost').value = tournament.stats.gamesLost || '';
    }
    
    const submitBtn = document.querySelector('#tournamentForm button[type="submit"]');
    if (submitBtn) {
        submitBtn.innerHTML = '💾 Actualizar Torneo';
    }
    
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function showTournamentDetails(id) {
    console.log('Mostrar detalles del torneo:', id);
}




// ============================================================
// GESTIÓN DE TORNEOS - Pool Tracker CON CloudSync
// PARTE 2/3 - Renderizado de Torneos y Gestión de Circuitos
// ============================================================

// CONTINÚA DESDE PARTE 1...

// ============================================================
// RENDERIZAR TORNEOS
// ============================================================

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
    
    const sorted = [...filteredTournaments].sort((a, b) => 
        new Date(b.date) - new Date(a.date)
    );
    
    const totalPages = Math.ceil(sorted.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const currentTournaments = sorted.slice(startIndex, endIndex);
    
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
    
    if (pagination && totalPages > 1) {
        pagination.style.display = 'flex';
        pagination.innerHTML = `
            <div class="pagination-info">
                Mostrando ${startIndex + 1}-${Math.min(endIndex, sorted.length)} de ${sorted.length} torneos
            </div>
            <div class="pagination-controls">
                <button class="pagination-btn" onclick="changePage(${currentPage - 1})" ${currentPage === 1 ? 'disabled' : ''}>
                    ← Anterior
                </button>
                <span class="pagination-current">Página ${currentPage} de ${totalPages}</span>
                <button class="pagination-btn" onclick="changePage(${currentPage + 1})" ${currentPage === totalPages ? 'disabled' : ''}>
                    Siguiente →
                </button>
            </div>
        `;
    } else if (pagination) {
        pagination.style.display = 'none';
    }
}

// ============================================================
// RENDERIZAR CIRCUITOS
// ============================================================

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
// GESTIÓN DE CIRCUITOS CON CloudSync
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
            '5º': 25,
            '9º': 15,
            '17º': 10,
            '33º': 5,
            'Eliminado en Ronda 1': 3,
            'Participación': 1
        },
        tournaments: [],
        totalPoints: 0,
        ranking: null
    };
    
    console.log('➕ Creando circuito:', circuit.name);
    
    matchesData.circuits.push(circuit);
    
    // ✅ Guardar con CloudSync
    saveData();
    
    populateSelects();
    renderAll();
    
    showMessage('✅ Circuito creado correctamente', 'success');
}

function deleteCircuit(id) {
    if (!confirm('¿Estás seguro? Esto no eliminará los torneos asociados.')) return;
    
    console.log('🗑️ Eliminando circuito:', id);
    
    matchesData.circuits = matchesData.circuits.filter(c => c.id !== id);
    
    matchesData.tournaments.forEach(t => {
        if (t.circuit === id) {
            t.circuit = null;
        }
    });
    
    // ✅ Guardar con CloudSync
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
    
    console.log('✏️ Editando circuito:', id);
    
    const name = prompt('Nombre del circuito:', circuit.name);
    if (name === null) return;
    if (!name.trim()) {
        showMessage('❌ El nombre no puede estar vacío', 'error');
        return;
    }
    
    const year = prompt('Año:', circuit.year);
    if (year === null) return;
    if (!year || isNaN(parseInt(year))) {
        showMessage('❌ Año inválido', 'error');
        return;
    }
    
    const description = prompt('Descripción (opcional):', circuit.description || '');
    if (description === null) return;
    
    circuit.name = name.trim();
    circuit.year = parseInt(year);
    circuit.description = description.trim();
    
    // ✅ Guardar con CloudSync
    saveData();
    
    populateSelects();
    renderAll();
    
    showMessage('✅ Circuito actualizado correctamente', 'success');
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
    if (result === '5º') return '';
    return '';
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
// PAGINACIÓN
// ============================================================

function changePage(page) {
    const totalPages = Math.ceil(filteredTournaments.length / itemsPerPage);
    
    if (page < 1 || page > totalPages) return;
    
    currentPage = page;
    renderTournaments();
    
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ============================================================
// FILTROS
// ============================================================

function resetFiltersOnLoad() {
    const filterYear = document.getElementById('filterYear');
    const filterModality = document.getElementById('filterModality');
    const filterCircuit = document.getElementById('filterCircuit');
    const filterResult = document.getElementById('filterResult');
    
    if (filterYear) filterYear.value = '';
    if (filterModality) filterModality.value = '';
    if (filterCircuit) filterCircuit.value = '';
    if (filterResult) filterResult.value = '';
    
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
    
    currentPage = 1;
    renderTournaments();
}

function resetFilters() {
    document.getElementById('filterYear').value = '';
    document.getElementById('filterModality').value = '';
    document.getElementById('filterCircuit').value = '';
    document.getElementById('filterResult').value = '';
    
    filteredTournaments = matchesData.tournaments;
    currentPage = 1;
    renderTournaments();
}



// ============================================================
// GESTIÓN DE TORNEOS - Pool Tracker CON CloudSync
// PARTE 3/3 - Navegación, Exportación, Gráficos y Utilidades
// ============================================================

// CONTINÚA DESDE PARTE 2...

// ============================================================
// NAVEGACIÓN
// ============================================================

function resetFormToCreateMode() {
    editingTournamentId = null;
    
    const titleElement = document.querySelector('#addTournamentSection .section-title');
    if (titleElement) {
        titleElement.textContent = 'Nuevo Torneo';
    }
    
    const descElement = document.querySelector('#addTournamentSection .section-description');
    if (descElement) {
        descElement.textContent = 'Registra los detalles de tu competición';
    }
    
    const submitBtn = document.querySelector('#tournamentForm button[type="submit"]');
    if (submitBtn) {
        submitBtn.innerHTML = '💾 Crear Torneo';
    }
}

function cancelEditTournament() {
    document.getElementById('tournamentForm').reset();
    resetFormToCreateMode();
    showSection('tournaments');
}

function showSection(section) {
    currentSection = section;
    
    if (section === 'add' && editingTournamentId === null) {
        resetFormToCreateMode();
    }
    
    document.getElementById('tournamentsSection').style.display = 'none';
    document.getElementById('circuitsSection').style.display = 'none';
    document.getElementById('addTournamentSection').style.display = 'none';
    
    if (section === 'tournaments') {
        document.getElementById('tournamentsSection').style.display = 'block';
        renderTournaments();
        console.log('📊 Torneos cargados automáticamente');
    } else if (section === 'circuits') {
        document.getElementById('circuitsSection').style.display = 'block';
        renderCircuits();
        console.log('🔄 Circuitos cargados automáticamente');
    } else if (section === 'add') {
        document.getElementById('addTournamentSection').style.display = 'block';
        if (editingTournamentId === null) {
            document.getElementById('tournamentDate').value = new Date().toISOString().split('T')[0];
        }
    }
    
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
        background: ${type === 'success' ? 'linear-gradient(62deg,rgba(0, 255, 242, 1) 0%, rgba(0, 217, 255, 1) 100%)' : '#007aff'};
        color: #000;
    `;
    
    document.body.appendChild(message);
    
    setTimeout(() => message.remove(), 3000);
}

function showSyncIndicator() {
    const indicator = document.getElementById('syncIndicator');
    if (indicator) {
        indicator.innerHTML = '💾 Guardado localmente';
        indicator.style.background = 'linear-gradient(62deg,rgba(0, 255, 242, 1) 0%, rgba(0, 217, 255, 1) 100%)';
        indicator.style.opacity = '1';
        setTimeout(() => {
            indicator.style.opacity = '0';
        }, 2000);
    }
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

function renderCharts() {
    if (matchesData.tournaments.length === 0) {
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

function renderYearResultsChart() {
    const ctx = document.getElementById('yearResultsChart');
    if (!ctx) return;
    
    if (charts.yearResults) {
        charts.yearResults.destroy();
    }
    
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
            backgroundColor: '#666',
            borderColor: '#666',
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

function renderMaterialPerformanceChart() {
    const ctx = document.getElementById('materialPerformanceChart');
    if (!ctx) return;
    
    if (charts.materialPerformance) {
        charts.materialPerformance.destroy();
    }
    
    const materialData = {};
    
    matchesData.tournaments.forEach(t => {
        if (!t.cue || t.cue === '') return;
        
        if (!materialData[t.cue]) {
            materialData[t.cue] = {
                total: 0,
                championships: 0,
                podium: 0
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
    
    const materials = Object.keys(materialData);
    const successRates = materials.map(m => {
        return (materialData[m].podium / materialData[m].total * 100).toFixed(1);
    });
    
    const sortedData = materials
        .map((m, i) => ({ material: m, rate: parseFloat(successRates[i]), total: materialData[m].total }))
        .sort((a, b) => b.rate - a.rate)
        .slice(0, 5);
    
    if (sortedData.length === 0) {
        return;
    }
    
    charts.materialPerformance = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: sortedData.map(d => `${d.material} (${d.total})`),
            datasets: [{
                data: sortedData.map(d => d.rate),
                backgroundColor: [
                    'rgba(0, 255, 242, 1)',
                    'rgba(0, 217, 255, 1)',
                    'rgba(22, 35, 129, 1)',
                    'rgba(22, 47, 133, 1)',
                    'rgba(0, 255, 242, 0.7)'
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

function renderTimelineChart() {
    const ctx = document.getElementById('timelineChart');
    if (!ctx) return;
    
    if (charts.timeline) {
        charts.timeline.destroy();
    }
    
    const sorted = [...matchesData.tournaments].sort((a, b) => 
        new Date(a.date) - new Date(b.date)
    );
    
    const resultValues = {
        'Campeón': 5,
        'Subcampeón': 4,
        'Semifinales': 3,
        '5º': 2,
        '9º': 1,
        '17º': 1,
        '33º': 1,
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
                pointBackgroundColor: 'rgba(22, 35, 129, 1)',
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
                            const labels = ['', '9º', '5º', 'Semi', 'Sub', 'Campeón'];
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


console.log('✅ torneos.js cargado completamente con CloudSync');
