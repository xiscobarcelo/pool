// ============================================================
// HISTORIAL AVANZADO CON ESTADÍSTICAS UNIFICADAS
// Incluye: Partidos registrados + Stats manuales
// ============================================================

let allMatches = [];
let filteredMatches = [];
let currentPage = 1;
let matchesPerPage = 20;
let winsChart = null;

// ============================================================
// INICIALIZACIÓN
// ============================================================

document.addEventListener('DOMContentLoaded', async () => {
    console.log('🎯 Iniciando historial...');
    
    const data = CloudSync.getData();
    allMatches = data.matches || [];
    
    console.log('📦 Partidos cargados:', allMatches.length);
    
    // Cargar datos y mostrar
    initializeFilters();
    applyFilters();
    
    // Ocultar loading, mostrar contenido
    document.getElementById('loading').style.display = 'none';
    document.getElementById('content').style.display = 'block';
    
    // Sincronizar con GitHub si está configurado
    if (CloudSync.config && CloudSync.config.token) {
        setTimeout(async () => {
            const githubData = await CloudSync.pullFromGitHub();
            if (githubData && githubData.matches) {
                allMatches = githubData.matches;
                applyFilters();
            }
        }, 500);
    }
});

// ============================================================
// CALCULAR ESTADÍSTICAS UNIFICADAS
// ============================================================

function calculateUnifiedStats() {
    const data = CloudSync.getData();
    
    // 1. Stats desde partidos registrados
    const matchStats = calculateStatsFromMatches(data.matches);
    
    // 2. Stats manuales
    const modalityStats = data.modalityStats || {};
    
    // 3. Unificar
    const unified = {
        bola8: {
            matchesPlayed: matchStats.bola8.matchesPlayed + (modalityStats.bola8?.matchesPlayed || 0),
            matchesWon: matchStats.bola8.matchesWon + (modalityStats.bola8?.matchesWon || 0)
        },
        bola9: {
            matchesPlayed: matchStats.bola9.matchesPlayed + (modalityStats.bola9?.matchesPlayed || 0),
            matchesWon: matchStats.bola9.matchesWon + (modalityStats.bola9?.matchesWon || 0)
        },
        bola10: {
            matchesPlayed: matchStats.bola10.matchesPlayed + (modalityStats.bola10?.matchesPlayed || 0),
            matchesWon: matchStats.bola10.matchesWon + (modalityStats.bola10?.matchesWon || 0)
        }
    };
    
    // 4. Calcular totales
    let totalMatches = 0;
    let totalWins = 0;
    
    ['bola8', 'bola9', 'bola10'].forEach(mod => {
        totalMatches += unified[mod].matchesPlayed || 0;
        totalWins += unified[mod].matchesWon || 0;
    });
    
    const totalLosses = totalMatches - totalWins;
    const winRate = totalMatches > 0 ? ((totalWins / totalMatches) * 100).toFixed(1) : 0;
    
    return {
        totalMatches,
        totalWins,
        totalLosses,
        winRate
    };
}

function calculateStatsFromMatches(matches) {
    const stats = {
        bola8: { matchesPlayed: 0, matchesWon: 0 },
        bola9: { matchesPlayed: 0, matchesWon: 0 },
        bola10: { matchesPlayed: 0, matchesWon: 0 }
    };

    if (!matches || matches.length === 0) return stats;

    matches.forEach(match => {
        const modality = match.modality?.toLowerCase().replace(/\s+/g, '') || '';
        const isXiscoP1 = match.player1?.toLowerCase() === 'xisco';
        const isXiscoP2 = match.player2?.toLowerCase() === 'xisco';
        
        if (!isXiscoP1 && !isXiscoP2) return;

        const xiscoScore = isXiscoP1 ? parseInt(match.score1) : parseInt(match.score2);
        const opponentScore = isXiscoP1 ? parseInt(match.score2) : parseInt(match.score1);
        const xiscoWon = xiscoScore > opponentScore;

        let key = null;
        if (modality.includes('8') || modality.includes('bola8')) key = 'bola8';
        else if (modality.includes('9') || modality.includes('bola9')) key = 'bola9';
        else if (modality.includes('10') || modality.includes('bola10')) key = 'bola10';

        if (key) {
            stats[key].matchesPlayed += 1;
            if (xiscoWon) stats[key].matchesWon += 1;
        }
    });

    return stats;
}

// ============================================================
// ACTUALIZAR CARDS DE TOTALES
// ============================================================

function updateStatsCards() {
    const totals = calculateUnifiedStats();
    
    console.log('📊 Totales unificados:', totals);
    
    document.getElementById('totalMatches').textContent = totals.totalMatches;
    document.getElementById('totalWins').textContent = totals.totalWins;
    document.getElementById('totalLosses').textContent = totals.totalLosses;
    document.getElementById('winRate').textContent = totals.winRate + '%';
    
    updateChart(totals.totalWins, totals.totalLosses);
}

// ============================================================
// INICIALIZAR FILTROS
// ============================================================

function initializeFilters() {
    // Años únicos
    const years = [...new Set(allMatches.map(m => {
        const date = new Date(m.date);
        return date.getFullYear();
    }))].sort((a, b) => b - a);
    
    const yearSelect = document.getElementById('filterYear');
    years.forEach(year => {
        const option = document.createElement('option');
        option.value = year;
        option.textContent = year;
        yearSelect.appendChild(option);
    });
    
    // Modalidades únicas
    const modalities = [...new Set(allMatches.map(m => m.modality))].filter(Boolean).sort();
    const modalitySelect = document.getElementById('filterModality');
    modalities.forEach(mod => {
        const option = document.createElement('option');
        option.value = mod;
        option.textContent = mod;
        modalitySelect.appendChild(option);
    });
    
    // Materiales únicos (de Xisco)
    const materials = [...new Set(allMatches.map(m => {
        const isXiscoP1 = m.player1?.toLowerCase() === 'xisco';
        return isXiscoP1 ? m.material1 : m.material2;
    }))].filter(Boolean).sort();
    
    const materialSelect = document.getElementById('filterMaterial');
    materials.forEach(mat => {
        const option = document.createElement('option');
        option.value = mat;
        option.textContent = mat;
        materialSelect.appendChild(option);
    });
}

// ============================================================
// APLICAR FILTROS
// ============================================================

function applyFilters() {
    const year = document.getElementById('filterYear').value;
    const modality = document.getElementById('filterModality').value;
    const material = document.getElementById('filterMaterial').value;
    const player = document.getElementById('filterPlayer').value.toLowerCase();
    
    filteredMatches = allMatches.filter(match => {
        const matchDate = new Date(match.date);
        const matchYear = matchDate.getFullYear().toString();
        
        const isXiscoP1 = match.player1?.toLowerCase() === 'xisco';
        const opponent = isXiscoP1 ? match.player2 : match.player1;
        const xiscoMaterial = isXiscoP1 ? match.material1 : match.material2;
        
        const yearMatch = !year || matchYear === year;
        const modalityMatch = !modality || match.modality === modality;
        const materialMatch = !material || xiscoMaterial === material;
        const playerMatch = !player || opponent?.toLowerCase().includes(player);
        
        return yearMatch && modalityMatch && materialMatch && playerMatch;
    });
    
    currentPage = 1;
    updateStatsCards();
    renderTable();
    
    // Mostrar/ocultar estados
    if (filteredMatches.length === 0) {
        document.getElementById('emptyState').style.display = 'block';
        document.getElementById('tableContainer').innerHTML = '';
        document.getElementById('pagination').style.display = 'none';
    } else {
        document.getElementById('emptyState').style.display = 'none';
    }
}

function clearFilters() {
    document.getElementById('filterYear').value = '';
    document.getElementById('filterModality').value = '';
    document.getElementById('filterMaterial').value = '';
    document.getElementById('filterPlayer').value = '';
    applyFilters();
}

// ============================================================
// RENDERIZAR TABLA
// ============================================================

function renderTable() {
    const start = (currentPage - 1) * matchesPerPage;
    const end = start + matchesPerPage;
    const pageMatches = filteredMatches.slice(start, end);
    
    const tableHtml = `
        <table class="matches-table">
            <thead>
                <tr>
                    <th>Fecha</th>
                    <th>Modalidad</th>
                    <th>Jugador 1</th>
                    <th>Resultado</th>
                    <th>Jugador 2</th>
                    <th>Material</th>
                </tr>
            </thead>
            <tbody>
                ${pageMatches.map(match => {
                    const isXiscoP1 = match.player1?.toLowerCase() === 'xisco';
                    const xiscoScore = isXiscoP1 ? match.score1 : match.score2;
                    const opponentScore = isXiscoP1 ? match.score2 : match.score1;
                    const xiscoWon = xiscoScore > opponentScore;
                    
                    const p1Class = (isXiscoP1 && xiscoWon) || (!isXiscoP1 && !xiscoWon) ? 'winner' : 'loser';
                    const p2Class = (!isXiscoP1 && xiscoWon) || (isXiscoP1 && !xiscoWon) ? 'winner' : 'loser';
                    
                    const date = new Date(match.date);
                    const dateStr = date.toLocaleDateString('es-ES', { 
                        day: '2-digit', 
                        month: '2-digit', 
                        year: 'numeric' 
                    });
                    
                    return `
                        <tr>
                            <td data-label="Fecha" class="date-cell">${dateStr}</td>
                            <td data-label="Modalidad">${match.modality || '-'}</td>
                            <td data-label="Jugador 1" class="${p1Class}">${match.player1 || '-'}</td>
                            <td data-label="Resultado" class="score-cell">${match.score1} - ${match.score2}</td>
                            <td data-label="Jugador 2" class="${p2Class}">${match.player2 || '-'}</td>
                            <td data-label="Material">${(isXiscoP1 ? match.material1 : match.material2) || '-'}</td>
                        </tr>
                    `;
                }).join('')}
            </tbody>
        </table>
    `;
    
    document.getElementById('tableContainer').innerHTML = tableHtml;
    document.getElementById('resultsCount').textContent = `${filteredMatches.length} partidos`;
    
    renderPagination();
}

// ============================================================
// PAGINACIÓN
// ============================================================

function renderPagination() {
    const totalPages = Math.ceil(filteredMatches.length / matchesPerPage);
    
    if (totalPages <= 1) {
        document.getElementById('pagination').style.display = 'none';
        return;
    }
    
    document.getElementById('pagination').style.display = 'flex';
    
    const start = (currentPage - 1) * matchesPerPage + 1;
    const end = Math.min(currentPage * matchesPerPage, filteredMatches.length);
    
    document.getElementById('paginationInfo').textContent = 
        `Mostrando ${start}-${end} de ${filteredMatches.length}`;
    
    const buttonsHtml = `
        <button class="pagination-btn" onclick="goToPage(1)" ${currentPage === 1 ? 'disabled' : ''}>
            ⏮ Primero
        </button>
        <button class="pagination-btn" onclick="goToPage(${currentPage - 1})" ${currentPage === 1 ? 'disabled' : ''}>
            ◀ Anterior
        </button>
        <span style="padding: 10px 20px; font-weight: 600; color: var(--dark);">
            ${currentPage} / ${totalPages}
        </span>
        <button class="pagination-btn" onclick="goToPage(${currentPage + 1})" ${currentPage === totalPages ? 'disabled' : ''}>
            Siguiente ▶
        </button>
        <button class="pagination-btn" onclick="goToPage(${totalPages})" ${currentPage === totalPages ? 'disabled' : ''}>
            Último ⏭
        </button>
    `;
    
    document.getElementById('paginationButtons').innerHTML = buttonsHtml;
}

function goToPage(page) {
    const totalPages = Math.ceil(filteredMatches.length / matchesPerPage);
    if (page < 1 || page > totalPages) return;
    
    currentPage = page;
    renderTable();
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ============================================================
// GRÁFICO
// ============================================================

function updateChart(wins, losses) {
    const ctx = document.getElementById('winsChart');
    if (!ctx) return;
    
    if (winsChart) {
        winsChart.destroy();
    }
    
    winsChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Victorias', 'Derrotas'],
            datasets: [{
                data: [wins, losses],
                backgroundColor: [
                    'rgba(0, 217, 255, 0.8)',
                    'rgba(22, 35, 129, 0.8)'
                ],
                borderColor: [
                    'rgba(0, 217, 255, 1)',
                    'rgba(22, 35, 129, 1)'
                ],
                borderWidth: 3
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        font: {
                            size: 14,
                            weight: '600'
                        }
                    }
                }
            }
        }
    });
}

console.log('✅ Historial avanzado con stats unificadas cargado');
