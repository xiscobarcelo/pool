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

// ============================================================
// INICIALIZACIÓN
// ============================================================

document.addEventListener('DOMContentLoaded', () => {
    loadData();
    populateSelects();
    renderAll();
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
        } catch (e) {
            console.error('Error cargando datos:', e);
        }
    }
    
    // Inicializar filtros
    filteredTournaments = matchesData.tournaments;
}

// Guardar datos
function saveData() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(matchesData));
    localStorage.setItem('shared_matches_data', JSON.stringify(matchesData));
    showSyncIndicator();
    
    // Sincronizar con GitHub
    syncToGitHub();
}

// ============================================================
// SINCRONIZACIÓN CON GITHUB
// ============================================================

async function syncToGitHub() {
    const config = localStorage.getItem(GITHUB_CONFIG_KEY);
    if (!config) return;
    
    try {
        const { username, repo, token } = JSON.parse(config);
        
        // Obtener SHA del archivo actual
        const getResponse = await fetch(
            `https://api.github.com/repos/${username}/${repo}/contents/app/data.json`,
            {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/vnd.github.v3+json'
                }
            }
        );
        
        const getData = await getResponse.json();
        
        // Actualizar archivo
        const content = btoa(JSON.stringify(matchesData, null, 2));
        
        await fetch(
            `https://api.github.com/repos/${username}/${repo}/contents/app/data.json`,
            {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/vnd.github.v3+json',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    message: `Update tournaments data - ${new Date().toLocaleString()}`,
                    content: content,
                    sha: getData.sha
                })
            }
        );
        
        console.log('✅ Sincronizado con GitHub');
    } catch (error) {
        console.error('Error sincronizando con GitHub:', error);
    }
}

// Mostrar indicador de sincronización
function showSyncIndicator() {
    const indicator = document.getElementById('syncIndicator');
    if (indicator) {
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
}

// Renderizar estadísticas globales
function renderStats() {
    const stats = calculateGlobalStats();
    const container = document.getElementById('statsOverview');
    
    if (!container) return;
    
    container.innerHTML = `
        <div class="stat-card-tournament">
            <div class="stat-icon">🏆</div>
            <div class="stat-number">${stats.totalTournaments}</div>
            <div class="stat-label">Torneos</div>
        </div>
        
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
            <div class="stat-icon">📊</div>
            <div class="stat-number">${stats.winRate}%</div>
            <div class="stat-label">Win Rate</div>
        </div>
        
        <div class="stat-card-tournament">
            <div class="stat-icon">🔄</div>
            <div class="stat-number">${matchesData.circuits.length}</div>
            <div class="stat-label">Circuitos</div>
        </div>
    `;
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
function renderTournaments() {
    const container = document.getElementById('tournamentsGrid');
    const empty = document.getElementById('emptyTournaments');
    
    if (!container || !empty) return;
    
    if (filteredTournaments.length === 0) {
        container.style.display = 'none';
        empty.style.display = 'block';
        return;
    }
    
    container.style.display = 'grid';
    empty.style.display = 'none';
    
    // Ordenar por fecha (más reciente primero)
    const sorted = [...filteredTournaments].sort((a, b) => 
        new Date(b.date) - new Date(a.date)
    );
    
    container.innerHTML = sorted.map(tournament => {
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
                            🔄 ${circuit.name}
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
                        ✏️ Editar
                    </button>
                    <button class="tournament-action-btn delete" onclick="event.stopPropagation(); deleteTournament('${tournament.id}')">
                        🗑️ Eliminar
                    </button>
                </div>
            </div>
        `;
    }).join('');
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
                        ✏️ Editar
                    </button>
                    <button class="tournament-action-btn delete" onclick="deleteCircuit('${circuit.id}')">
                        🗑️ Eliminar
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
        titleElement.textContent = '✏️ Editar Torneo';
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
    // Por implementar
    showMessage('⚠️ Función de edición en desarrollo', 'info');
}

// ============================================================
// FILTROS
// ============================================================

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
    
    renderTournaments();
}

function resetFilters() {
    document.getElementById('filterYear').value = '';
    document.getElementById('filterModality').value = '';
    document.getElementById('filterCircuit').value = '';
    document.getElementById('filterResult').value = '';
    
    filteredTournaments = matchesData.tournaments;
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
        submitBtn.innerHTML = '💾 Guardar Torneo';
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
    
    // Mostrar sección actual
    if (section === 'tournaments') {
        document.getElementById('tournamentsSection').style.display = 'block';
        renderTournaments();
    } else if (section === 'circuits') {
        document.getElementById('circuitsSection').style.display = 'block';
        renderCircuits();
    } else if (section === 'add') {
        document.getElementById('addTournamentSection').style.display = 'block';
        // Establecer fecha de hoy por defecto solo si no estamos editando
        if (editingTournamentId === null) {
            document.getElementById('tournamentDate').value = new Date().toISOString().split('T')[0];
        }
    }
    
    // Actualizar botones activos
    document.querySelectorAll('.button-group .btn').forEach(btn => {
        btn.classList.remove('btn-primary');
        btn.classList.add('btn-secondary');
    });
    
    const activeBtn = document.querySelector(`.button-group .btn[onclick="showSection('${section}')"]`);
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
