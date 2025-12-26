let matchesData = null;
let unifiedStats = null;
let charts = {};

document.addEventListener('DOMContentLoaded', async () => {
    console.log('Inicializando estadisticas...');
    
    // Ocultar loading y mostrar contenido
    document.getElementById('loading').style.display = 'none';
    document.getElementById('content').style.display = 'block';
    
    matchesData = CloudSync.getData();
    
    console.log('Datos:', {
        partidos: matchesData.matches?.length || 0,
        torneos: matchesData.tournaments?.length || 0,
        modalityStats: matchesData.modalityStats
    });
    
    unifiedStats = calculateUnifiedStats(matchesData.matches, matchesData.modalityStats);
    const totals = calculateTotalStats(unifiedStats);
    
    console.log('Stats unificadas:', unifiedStats);
    console.log('Totales:', totals);
    
    renderStatsGrid(totals, unifiedStats);
    renderCharts(unifiedStats);
    loadModalityInputs();
    
    if (CloudSync.config && CloudSync.config.token) {
        setTimeout(async () => {
            const githubData = await CloudSync.pullFromGitHub();
            if (githubData) {
                matchesData = githubData;
                const newUnified = calculateUnifiedStats(matchesData.matches, matchesData.modalityStats);
                const newTotals = calculateTotalStats(newUnified);
                renderStatsGrid(newTotals, newUnified);
                renderCharts(newUnified);
            }
        }, 500);
    }
});

function calculateUnifiedStats(matches, modalityStats) {
    console.log('Calculando stats unificadas...');
    
    const matchStats = calculateStatsFromMatches(matches);
    
    console.log('  De partidos:', matchStats);
    console.log('  Manuales:', modalityStats);
    
    if (!modalityStats) {
        return matchStats;
    }
    
    const unified = {
        bola8: {
            matchesPlayed: matchStats.bola8.matchesPlayed + (modalityStats.bola8?.matchesPlayed || 0),
            matchesWon: matchStats.bola8.matchesWon + (modalityStats.bola8?.matchesWon || 0),
            gamesPlayed: matchStats.bola8.gamesPlayed + (modalityStats.bola8?.gamesPlayed || 0),
            gamesWon: matchStats.bola8.gamesWon + (modalityStats.bola8?.gamesWon || 0)
        },
        bola9: {
            matchesPlayed: matchStats.bola9.matchesPlayed + (modalityStats.bola9?.matchesPlayed || 0),
            matchesWon: matchStats.bola9.matchesWon + (modalityStats.bola9?.matchesWon || 0),
            gamesPlayed: matchStats.bola9.gamesPlayed + (modalityStats.bola9?.gamesPlayed || 0),
            gamesWon: matchStats.bola9.gamesWon + (modalityStats.bola9?.gamesWon || 0)
        },
        bola10: {
            matchesPlayed: matchStats.bola10.matchesPlayed + (modalityStats.bola10?.matchesPlayed || 0),
            matchesWon: matchStats.bola10.matchesWon + (modalityStats.bola10?.matchesWon || 0),
            gamesPlayed: matchStats.bola10.gamesPlayed + (modalityStats.bola10?.gamesPlayed || 0),
            gamesWon: matchStats.bola10.gamesWon + (modalityStats.bola10?.gamesWon || 0)
        }
    };
    
    console.log('  Unificadas:', unified);
    return unified;
}

function calculateStatsFromMatches(matches) {
    const stats = {
        bola8: { matchesPlayed: 0, matchesWon: 0, gamesPlayed: 0, gamesWon: 0 },
        bola9: { matchesPlayed: 0, matchesWon: 0, gamesPlayed: 0, gamesWon: 0 },
        bola10: { matchesPlayed: 0, matchesWon: 0, gamesPlayed: 0, gamesWon: 0 }
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
            stats[key].gamesPlayed += xiscoScore + opponentScore;
            stats[key].gamesWon += xiscoScore;
        }
    });

    return stats;
}

function calculateTotalStats(unified) {
    let totalMatches = 0;
    let totalMatchesWon = 0;
    let totalGames = 0;
    let totalGamesWon = 0;
    
    ['bola8', 'bola9', 'bola10'].forEach(mod => {
        totalMatches += unified[mod].matchesPlayed || 0;
        totalMatchesWon += unified[mod].matchesWon || 0;
        totalGames += unified[mod].gamesPlayed || 0;
        totalGamesWon += unified[mod].gamesWon || 0;
    });
    
    const winRate = totalMatches > 0 ? ((totalMatchesWon / totalMatches) * 100).toFixed(1) : 0;
    const gameWinRate = totalGames > 0 ? ((totalGamesWon / totalGames) * 100).toFixed(1) : 0;
    
    return {
        totalMatches,
        totalMatchesWon,
        totalMatchesLost: totalMatches - totalMatchesWon,
        totalGames,
        totalGamesWon,
        totalGamesLost: totalGames - totalGamesWon,
        winRate,
        gameWinRate
    };
}

function renderStatsGrid(totals, unified) {
    console.log('Renderizando stats grid...');
    
    const statsGrid = document.getElementById('statsGrid');
    if (!statsGrid) return;
    
    // Calcular material con más victorias
    const bestMaterial = calculateBestMaterial();
    
    // Aplicar estilo de 4 columnas
    statsGrid.style.gridTemplateColumns = 'repeat(4, 1fr)';
    
    statsGrid.innerHTML = `
        <div class="stat-card primary">
            <div class="stat-icon">🎯</div>
            <div class="stat-content">
                <div class="stat-value">${totals.totalMatches}</div>
                <div class="stat-label">Partidos Totales</div>
                <div class="stat-detail">${totals.totalMatchesWon} ganados • ${totals.totalMatchesLost} perdidos</div>
            </div>
        </div>
        
        <div class="stat-card success">
            <div class="stat-icon">🏆</div>
            <div class="stat-content">
                <div class="stat-value">${totals.winRate}%</div>
                <div class="stat-label">Win Rate</div>
                <div class="stat-detail">Partidos ganados</div>
            </div>
        </div>
        
        <div class="stat-card info">
            <div class="stat-icon">🎱</div>
            <div class="stat-content">
                <div class="stat-value">${totals.totalGames}</div>
                <div class="stat-label">Partidas Totales</div>
                <div class="stat-detail">${totals.totalGamesWon} ganadas • ${totals.totalGamesLost} perdidas</div>
            </div>
        </div>
        
        <div class="stat-card warning">
            <div class="stat-icon">📊</div>
            <div class="stat-content">
                <div class="stat-value">${totals.gameWinRate}%</div>
                <div class="stat-label">Game Win Rate</div>
                <div class="stat-detail">Partidas ganadas</div>
            </div>
        </div>
        
        <div class="stat-card modality">
            <div class="stat-icon">🎱</div>
            <div class="stat-content">
                <div class="stat-value">${unified.bola8.matchesWon}/${unified.bola8.matchesPlayed}</div>
                <div class="stat-label">Bola 8</div>
                <div class="stat-detail">${unified.bola8.matchesPlayed > 0 ? ((unified.bola8.matchesWon/unified.bola8.matchesPlayed)*100).toFixed(1) : 0}% win rate</div>
            </div>
        </div>
        
        <div class="stat-card modality">
            <div class="stat-icon">🎯</div>
            <div class="stat-content">
                <div class="stat-value">${unified.bola9.matchesWon}/${unified.bola9.matchesPlayed}</div>
                <div class="stat-label">Bola 9</div>
                <div class="stat-detail">${unified.bola9.matchesPlayed > 0 ? ((unified.bola9.matchesWon/unified.bola9.matchesPlayed)*100).toFixed(1) : 0}% win rate</div>
            </div>
        </div>
        
        <div class="stat-card modality">
            <div class="stat-icon">🎳</div>
            <div class="stat-content">
                <div class="stat-value">${unified.bola10.matchesWon}/${unified.bola10.matchesPlayed}</div>
                <div class="stat-label">Bola 10</div>
                <div class="stat-detail">${unified.bola10.matchesPlayed > 0 ? ((unified.bola10.matchesWon/unified.bola10.matchesPlayed)*100).toFixed(1) : 0}% win rate</div>
            </div>
        </div>
        
        <div class="stat-card special">
            <div class="stat-icon">🎯</div>
            <div class="stat-content">
                <div class="stat-value">${bestMaterial.winRate}%</div>
                <div class="stat-label">Mejor Material</div>
                <div class="stat-detail">${bestMaterial.name}<br>${bestMaterial.wins}/${bestMaterial.total} partidos</div>
            </div>
        </div>
    `;
}

function calculateBestMaterial() {
    if (!matchesData || !matchesData.matches || matchesData.matches.length === 0) {
        return { name: 'N/A', wins: 0, total: 0, winRate: 0 };
    }
    
    const materialStats = {};
    
    matchesData.matches.forEach(match => {
        const isXiscoP1 = match.player1?.toLowerCase() === 'xisco';
        const isXiscoP2 = match.player2?.toLowerCase() === 'xisco';
        
        if (!isXiscoP1 && !isXiscoP2) return;
        
        const material = isXiscoP1 ? match.material1 : match.material2;
        if (!material) return;
        
        const xiscoScore = isXiscoP1 ? parseInt(match.score1) : parseInt(match.score2);
        const opponentScore = isXiscoP1 ? parseInt(match.score2) : parseInt(match.score1);
        const won = xiscoScore > opponentScore;
        
        if (!materialStats[material]) {
            materialStats[material] = { total: 0, wins: 0 };
        }
        
        materialStats[material].total++;
        if (won) materialStats[material].wins++;
    });
    
    let bestMaterial = { name: 'N/A', wins: 0, total: 0, winRate: 0 };
    let bestWinRate = 0;
    
    Object.keys(materialStats).forEach(material => {
        const stats = materialStats[material];
        const winRate = stats.total > 0 ? (stats.wins / stats.total * 100) : 0;
        
        // Solo considerar materiales con al menos 5 partidos
        if (stats.total >= 5 && winRate > bestWinRate) {
            bestWinRate = winRate;
            bestMaterial = {
                name: material,
                wins: stats.wins,
                total: stats.total,
                winRate: winRate.toFixed(1)
            };
        }
    });
    
    return bestMaterial;
}

function renderCharts(unified) {
    const chartsGrid = document.getElementById('chartsGrid');
    if (!chartsGrid) return;
    
    chartsGrid.innerHTML = `
        <div class="chart-card">
            <h3 class="chart-title">Win Rate por Modalidad</h3>
            <div class="chart-wrapper">
                <canvas id="winRateChart"></canvas>
            </div>
        </div>
        
        <div class="chart-card">
            <h3 class="chart-title">Distribución de Partidas</h3>
            <div class="chart-wrapper">
                <canvas id="gamesDistChart"></canvas>
            </div>
        </div>
        
        <div class="chart-card full-width">
            <h3 class="chart-title">Materiales: Uso y Efectividad</h3>
            <div class="chart-wrapper">
                <canvas id="materialsChart"></canvas>
            </div>
        </div>
    `;
    
    setTimeout(() => {
        renderWinRateChart(unified);
        renderGamesDistChart(unified);
        renderMaterialsChart();
    }, 100);
}

function renderWinRateChart(unified) {
    const ctx = document.getElementById('winRateChart');
    if (!ctx) return;
    
    if (charts.winRate) charts.winRate.destroy();
    
    charts.winRate = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['Bola 8', 'Bola 9', 'Bola 10'],
            datasets: [{
                label: 'Win Rate (%)',
                data: [
                    unified.bola8.matchesPlayed > 0 ? (unified.bola8.matchesWon / unified.bola8.matchesPlayed * 100) : 0,
                    unified.bola9.matchesPlayed > 0 ? (unified.bola9.matchesWon / unified.bola9.matchesPlayed * 100) : 0,
                    unified.bola10.matchesPlayed > 0 ? (unified.bola10.matchesWon / unified.bola10.matchesPlayed * 100) : 0
                ],
                backgroundColor: [
                    'rgba(0, 255, 242, 0.8)',
                    'rgba(0, 217, 255, 0.8)',
                    'rgba(22, 35, 129, 0.8)'
                ],
                borderColor: [
                    'rgba(0, 255, 242, 1)',
                    'rgba(0, 217, 255, 1)',
                    'rgba(22, 35, 129, 1)'
                ],
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: { 
                y: { 
                    beginAtZero: true, 
                    max: 100, 
                    ticks: { callback: function(value) { return value + '%'; } } 
                } 
            }
        }
    });
}

function renderGamesDistChart(unified) {
    const ctx = document.getElementById('gamesDistChart');
    if (!ctx) return;
    
    if (charts.gamesDist) charts.gamesDist.destroy();
    
    charts.gamesDist = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Bola 8', 'Bola 9', 'Bola 10'],
            datasets: [{
                data: [unified.bola8.gamesPlayed, unified.bola9.gamesPlayed, unified.bola10.gamesPlayed],
                backgroundColor: [
                    'rgba(0, 255, 242, 0.8)',
                    'rgba(0, 217, 255, 0.8)',
                    'rgba(22, 35, 129, 0.8)'
                ],
                borderColor: [
                    'rgba(0, 255, 242, 1)',
                    'rgba(0, 217, 255, 1)',
                    'rgba(22, 35, 129, 1)'
                ],
                borderWidth: 3
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { position: 'bottom' } }
        }
    });
}

function renderMaterialsChart() {
    const ctx = document.getElementById('materialsChart');
    if (!ctx) return;
    
    if (!matchesData || !matchesData.matches || matchesData.matches.length === 0) {
        ctx.parentElement.innerHTML = '<p style="text-align: center; color: #999; padding: 40px;">No hay datos de materiales</p>';
        return;
    }
    
    // Calcular estadísticas por material
    const materialStats = {};
    
    matchesData.matches.forEach(match => {
        const isXiscoP1 = match.player1?.toLowerCase() === 'xisco';
        const isXiscoP2 = match.player2?.toLowerCase() === 'xisco';
        
        if (!isXiscoP1 && !isXiscoP2) return;
        
        const material = isXiscoP1 ? match.material1 : match.material2;
        if (!material) return;
        
        const xiscoScore = isXiscoP1 ? parseInt(match.score1) : parseInt(match.score2);
        const opponentScore = isXiscoP1 ? parseInt(match.score2) : parseInt(match.score1);
        const won = xiscoScore > opponentScore;
        
        if (!materialStats[material]) {
            materialStats[material] = { total: 0, wins: 0 };
        }
        
        materialStats[material].total++;
        if (won) materialStats[material].wins++;
    });
    
    // Ordenar por número de partidos y tomar los top 5
    const sortedMaterials = Object.keys(materialStats)
        .map(material => ({
            name: material,
            total: materialStats[material].total,
            wins: materialStats[material].wins,
            winRate: (materialStats[material].wins / materialStats[material].total * 100).toFixed(1)
        }))
        .sort((a, b) => b.total - a.total)
        .slice(0, 5);
    
    if (sortedMaterials.length === 0) {
        ctx.parentElement.innerHTML = '<p style="text-align: center; color: #999; padding: 40px;">No hay datos de materiales</p>';
        return;
    }
    
    if (charts.materials) charts.materials.destroy();
    
    // Generar gradiente de colores azules corporativos
    const generateBlueGradient = (index, total) => {
        const colors = [
            'rgba(0, 255, 242, 0.8)',   // Cyan brillante
            'rgba(0, 217, 255, 0.8)',   // Azul cielo
            'rgba(22, 35, 129, 0.8)',   // Azul oscuro
            'rgba(0, 200, 230, 0.8)',   // Azul medio
            'rgba(50, 80, 180, 0.8)'    // Azul profundo
        ];
        return colors[index % colors.length];
    };
    
    const winRateColors = sortedMaterials.map((mat, idx) => generateBlueGradient(idx, sortedMaterials.length));
    
    charts.materials = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: sortedMaterials.map(m => m.name),
            datasets: [
                {
                    label: 'Partidos Jugados',
                    data: sortedMaterials.map(m => m.total),
                    backgroundColor: 'rgba(156, 163, 175, 0.6)',
                    borderColor: 'rgba(156, 163, 175, 1)',
                    borderWidth: 2,
                    yAxisID: 'y'
                },
                {
                    label: 'Win Rate (%)',
                    data: sortedMaterials.map(m => parseFloat(m.winRate)),
                    backgroundColor: winRateColors,
                    borderColor: winRateColors.map(c => c.replace('0.8', '1')),
                    borderWidth: 2,
                    yAxisID: 'y1'
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
                mode: 'index',
                intersect: false
            },
            plugins: {
                legend: {
                    position: 'top'
                },
                tooltip: {
                    callbacks: {
                        afterLabel: function(context) {
                            const index = context.dataIndex;
                            const material = sortedMaterials[index];
                            if (context.dataset.label === 'Win Rate (%)') {
                                return `${material.wins}/${material.total} partidos ganados`;
                            }
                            return '';
                        }
                    }
                }
            },
            scales: {
                y: {
                    type: 'linear',
                    display: true,
                    position: 'left',
                    title: {
                        display: true,
                        text: 'Partidos Jugados'
                    },
                    beginAtZero: true
                },
                y1: {
                    type: 'linear',
                    display: true,
                    position: 'right',
                    title: {
                        display: true,
                        text: 'Win Rate (%)'
                    },
                    beginAtZero: true,
                    max: 100,
                    grid: {
                        drawOnChartArea: false
                    },
                    ticks: {
                        callback: function(value) {
                            return value + '%';
                        }
                    }
                }
            }
        }
    });
}

function loadModalityInputs() {
    if (!matchesData.modalityStats) return;
    
    const stats = matchesData.modalityStats;
    
    document.getElementById('bola8_played').value = stats.bola8?.matchesPlayed || 0;
    document.getElementById('bola8_won').value = stats.bola8?.matchesWon || 0;
    document.getElementById('bola8_games_played').value = stats.bola8?.gamesPlayed || 0;
    document.getElementById('bola8_games_won').value = stats.bola8?.gamesWon || 0;
    
    document.getElementById('bola9_played').value = stats.bola9?.matchesPlayed || 0;
    document.getElementById('bola9_won').value = stats.bola9?.matchesWon || 0;
    document.getElementById('bola9_games_played').value = stats.bola9?.gamesPlayed || 0;
    document.getElementById('bola9_games_won').value = stats.bola9?.gamesWon || 0;
    
    document.getElementById('bola10_played').value = stats.bola10?.matchesPlayed || 0;
    document.getElementById('bola10_won').value = stats.bola10?.matchesWon || 0;
    document.getElementById('bola10_games_played').value = stats.bola10?.gamesPlayed || 0;
    document.getElementById('bola10_games_won').value = stats.bola10?.gamesWon || 0;
}

document.getElementById('saveModalityBtn')?.addEventListener('click', () => {
    const data = CloudSync.getData();
    
    data.modalityStats = {
        bola8: {
            matchesPlayed: parseInt(document.getElementById('bola8_played').value) || 0,
            matchesWon: parseInt(document.getElementById('bola8_won').value) || 0,
            gamesPlayed: parseInt(document.getElementById('bola8_games_played').value) || 0,
            gamesWon: parseInt(document.getElementById('bola8_games_won').value) || 0
        },
        bola9: {
            matchesPlayed: parseInt(document.getElementById('bola9_played').value) || 0,
            matchesWon: parseInt(document.getElementById('bola9_won').value) || 0,
            gamesPlayed: parseInt(document.getElementById('bola9_games_played').value) || 0,
            gamesWon: parseInt(document.getElementById('bola9_games_won').value) || 0
        },
        bola10: {
            matchesPlayed: parseInt(document.getElementById('bola10_played').value) || 0,
            matchesWon: parseInt(document.getElementById('bola10_won').value) || 0,
            gamesPlayed: parseInt(document.getElementById('bola10_games_played').value) || 0,
            gamesWon: parseInt(document.getElementById('bola10_games_won').value) || 0
        }
    };
    
    CloudSync.saveData(data);
    
    matchesData = data;
    unifiedStats = calculateUnifiedStats(matchesData.matches, matchesData.modalityStats);
    const totals = calculateTotalStats(unifiedStats);
    
    renderStatsGrid(totals, unifiedStats);
    renderCharts(unifiedStats);
    
    alert('Estadisticas guardadas exitosamente');
});

function logoutDashboard() {
    if (confirm('Cerrar sesion?')) {
        sessionStorage.removeItem('xisco_session_active');
        window.location.href = 'index.html';
    }
}

function resetAllDataDashboard() {
    if (confirm('Esto borrara TODOS los datos. Continuar?')) {
        localStorage.clear();
        location.reload();
    }
}

console.log('estadisticas.js cargado');
