// ============================================================
// COMPARATIVA HISTÓRICA DE TORNEOS PARA ANALISIS.HTML
// Versión optimizada con IDs específicos para evitar conflictos
// ============================================================

let tournamentComparisonChartsAnalysis = {
    position: null,
    winRate: null
};

// ============================================================
// INICIALIZACIÓN
// ============================================================

function initTournamentComparisonAnalysis() {
    console.log('🏆 [ANÁLISIS] Inicializando comparativa de torneos...');
    
    const data = CloudSync.getData();
    const tournaments = data.tournaments || [];
    
    if (tournaments.length === 0) {
        console.log('⚠️ No hay torneos en data.json');
        return;
    }
    
    populateTournamentSelectorAnalysis(tournaments);
    
    // Event listener para el selector
    const selector = document.getElementById('tournamentSelectorAnalysis');
    if (selector) {
        selector.addEventListener('change', handleTournamentSelectionAnalysis);
    }
    
    // Mostrar estado inicial
    showComparisonStateAnalysis('empty');
}

// ============================================================
// POBLAR SELECTOR
// ============================================================

function populateTournamentSelectorAnalysis(tournaments) {
    const selector = document.getElementById('tournamentSelectorAnalysis');
    if (!selector) {
        console.warn('⚠️ Selector tournamentSelectorAnalysis no encontrado');
        return;
    }
    
    // Extraer nombres únicos de torneos
    const tournamentNames = [...new Set(tournaments.map(t => t.name))].sort();
    
    console.log('📋 Torneos únicos:', tournamentNames);
    
    // Limpiar opciones existentes
    selector.innerHTML = '<option value="">-- Elige un torneo para comparar --</option>';
    
    // Añadir opciones
    tournamentNames.forEach(name => {
        const option = document.createElement('option');
        option.value = name;
        option.textContent = name;
        selector.appendChild(option);
    });
}

// ============================================================
// MANEJAR SELECCIÓN
// ============================================================

function handleTournamentSelectionAnalysis(event) {
    const tournamentName = event.target.value;
    
    if (!tournamentName) {
        showComparisonStateAnalysis('empty');
        return;
    }
    
    console.log('🔍 [ANÁLISIS] Torneo seleccionado:', tournamentName);
    showComparisonStateAnalysis('loading');
    
    setTimeout(() => {
        loadTournamentComparisonAnalysis(tournamentName);
    }, 300);
}

// ============================================================
// CARGAR DATOS DE COMPARATIVA
// ============================================================

function loadTournamentComparisonAnalysis(tournamentName) {
    const data = CloudSync.getData();
    const tournaments = data.tournaments || [];
    
    // Filtrar todas las ediciones del torneo seleccionado
    const editions = tournaments
        .filter(t => t.name === tournamentName)
        .sort((a, b) => a.year - b.year);
    
    console.log('📊 Ediciones encontradas:', editions.length);
    
    if (editions.length < 2) {
        showComparisonStateAnalysis('noData');
        return;
    }
    
    // Calcular estadísticas
    const comparisonData = calculateComparisonStatsAnalysis(editions);
    
    // Renderizar
    renderComparisonAnalysis(comparisonData);
    showComparisonStateAnalysis('content');
}

// ============================================================
// CALCULAR ESTADÍSTICAS
// ============================================================

function calculateComparisonStatsAnalysis(editions) {
    const stats = {
        editions: [],
        totalEditions: editions.length,
        bestPosition: Infinity,
        worstPosition: 0,
        totalMatches: 0,
        totalWins: 0
    };
    
    const data = CloudSync.getData();
    const allMatches = data.matches || [];
    
    editions.forEach(tournament => {
        console.log('📊 Procesando torneo:', tournament.name, tournament.year);
        
        // Buscar partidos que pertenecen a este torneo
        const tournamentMatches = allMatches.filter(match => {
            // Opción 1: Por tournamentId
            if (match.tournamentId === tournament.id) return true;
            
            // Opción 2: Por nombre y año del torneo
            if (match.tournament === tournament.name && 
                new Date(match.date).getFullYear() === tournament.year) return true;
            
            // Opción 3: Si el torneo tiene array de matches
            if (tournament.matches && tournament.matches.length > 0) {
                return tournament.matches.some(m => m.id === match.id);
            }
            
            return false;
        });
        
        console.log('  Partidos encontrados:', tournamentMatches.length);
        
        // Calcular stats de partidos
        let wins = 0;
        let losses = 0;
        
        tournamentMatches.forEach(match => {
            const isXiscoP1 = match.player1?.toLowerCase() === 'xisco';
            const isXiscoP2 = match.player2?.toLowerCase() === 'xisco';
            
            if (!isXiscoP1 && !isXiscoP2) return;
            
            const xiscoScore = isXiscoP1 ? parseInt(match.score1) : parseInt(match.score2);
            const opponentScore = isXiscoP1 ? parseInt(match.score2) : parseInt(match.score1);
            
            if (xiscoScore > opponentScore) {
                wins++;
            } else {
                losses++;
            }
        });
        
        const totalMatches = wins + losses;
        const winRate = totalMatches > 0 ? ((wins / totalMatches) * 100).toFixed(1) : 0;
        
        console.log(`  Stats: ${wins}W / ${losses}L = ${winRate}%`);
        
        // Guardar stats de esta edición
        const editionStats = {
            year: tournament.year,
            position: tournament.position || '-',
            matches: totalMatches,
            wins: wins,
            losses: losses,
            winRate: parseFloat(winRate),
            notes: tournament.notes || '-'
        };
        
        stats.editions.push(editionStats);
        
        // Actualizar best/worst position
        const pos = parseInt(tournament.position);
        if (!isNaN(pos)) {
            if (pos < stats.bestPosition) stats.bestPosition = pos;
            if (pos > stats.worstPosition) stats.worstPosition = pos;
        }
        
        // Totales
        stats.totalMatches += totalMatches;
        stats.totalWins += wins;
    });
    
    // Calcular posición media
    const validPositions = stats.editions
        .map(e => parseInt(e.position))
        .filter(p => !isNaN(p));
    
    stats.avgPosition = validPositions.length > 0
        ? (validPositions.reduce((a, b) => a + b, 0) / validPositions.length).toFixed(1)
        : '-';
    
    // Win rate total
    stats.totalWinRate = stats.totalMatches > 0
        ? ((stats.totalWins / stats.totalMatches) * 100).toFixed(1)
        : 0;
    
    console.log('📈 Stats finales:', stats);
    
    return stats;
}

// ============================================================
// RENDERIZAR COMPARATIVA
// ============================================================

function renderComparisonAnalysis(data) {
    // KPI Cards
    document.getElementById('totalEditionsAnalysis').textContent = data.totalEditions;
    document.getElementById('bestPositionAnalysis').textContent = 
        data.bestPosition !== Infinity ? `${data.bestPosition}º` : '-';
    document.getElementById('avgPositionAnalysis').textContent = 
        data.avgPosition !== '-' ? `${data.avgPosition}º` : '-';
    document.getElementById('totalWinRateAnalysis').textContent = `${data.totalWinRate}%`;
    
    // Gráficos
    renderPositionChartAnalysis(data.editions);
    renderWinRateChartAnalysis(data.editions);
    
    // Tabla
    renderComparisonTableAnalysis(data.editions);
}

// ============================================================
// GRÁFICO: EVOLUCIÓN DE POSICIÓN
// ============================================================

function renderPositionChartAnalysis(editions) {
    const ctx = document.getElementById('positionEvolutionChartAnalysis');
    if (!ctx) return;
    
    if (tournamentComparisonChartsAnalysis.position) {
        tournamentComparisonChartsAnalysis.position.destroy();
    }
    
    const years = editions.map(e => e.year);
    const positions = editions.map(e => {
        const pos = parseInt(e.position);
        return isNaN(pos) ? null : pos;
    });
    
    tournamentComparisonChartsAnalysis.position = new Chart(ctx, {
        type: 'line',
        data: {
            labels: years,
            datasets: [{
                label: 'Posición',
                data: positions,
                borderColor: 'rgba(0, 217, 255, 1)',
                backgroundColor: 'rgba(0, 217, 255, 0.1)',
                borderWidth: 3,
                tension: 0.4,
                fill: true,
                pointRadius: 6,
                pointBackgroundColor: 'rgba(0, 217, 255, 1)',
                pointBorderColor: '#fff',
                pointBorderWidth: 2,
                pointHoverRadius: 8
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
                    callbacks: {
                        label: function(context) {
                            return `Posición: ${context.parsed.y}º`;
                        }
                    }
                }
            },
            scales: {
                y: {
                    reverse: true,
                    beginAtZero: false,
                    ticks: {
                        callback: function(value) {
                            return value + 'º';
                        },
                        stepSize: 1
                    },
                    title: {
                        display: true,
                        text: 'Posición (1º = mejor)'
                    }
                },
                x: {
                    title: {
                        display: true,
                        text: 'Año'
                    }
                }
            }
        }
    });
}

// ============================================================
// GRÁFICO: WIN RATE POR AÑO
// ============================================================

function renderWinRateChartAnalysis(editions) {
    const ctx = document.getElementById('winRateEvolutionChartAnalysis');
    if (!ctx) return;
    
    if (tournamentComparisonChartsAnalysis.winRate) {
        tournamentComparisonChartsAnalysis.winRate.destroy();
    }
    
    const years = editions.map(e => e.year);
    const winRates = editions.map(e => e.winRate);
    
    // Colores según win rate (corporativos)
    const backgroundColors = winRates.map(wr => {
        if (wr >= 70) return 'rgba(0, 255, 242, 0.8)'; // Cyan
        if (wr >= 50) return 'rgba(0, 217, 255, 0.8)'; // Azul
        return 'rgba(22, 35, 129, 0.8)'; // Azul oscuro
    });
    
    const borderColors = backgroundColors.map(c => c.replace('0.8', '1'));
    
    tournamentComparisonChartsAnalysis.winRate = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: years,
            datasets: [{
                label: 'Win Rate (%)',
                data: winRates,
                backgroundColor: backgroundColors,
                borderColor: borderColors,
                borderWidth: 2
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
                    callbacks: {
                        label: function(context) {
                            const edition = editions[context.dataIndex];
                            return [
                                `Win Rate: ${context.parsed.y.toFixed(1)}%`,
                                `Partidos: ${edition.wins}/${edition.matches}`
                            ];
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    max: 100,
                    ticks: {
                        callback: function(value) {
                            return value + '%';
                        }
                    },
                    title: {
                        display: true,
                        text: 'Win Rate (%)'
                    }
                },
                x: {
                    title: {
                        display: true,
                        text: 'Año'
                    }
                }
            }
        }
    });
}

// ============================================================
// TABLA DETALLADA
// ============================================================

function renderComparisonTableAnalysis(editions) {
    const tbody = document.getElementById('comparisonTableBodyAnalysis');
    if (!tbody) return;
    
    tbody.innerHTML = editions.map(edition => {
        const positionClass = getPositionClassAnalysis(edition.position);
        const winRateClass = getWinRateClassAnalysis(edition.winRate);
        
        return `
            <tr>
                <td class="year-cell">${edition.year}</td>
                <td class="position-cell ${positionClass}">${edition.position}º</td>
                <td>${edition.matches}</td>
                <td>${edition.wins}</td>
                <td>${edition.losses}</td>
                <td class="${winRateClass}">${edition.winRate}%</td>
                <td>${edition.notes}</td>
            </tr>
        `;
    }).join('');
}

function getPositionClassAnalysis(position) {
    const pos = parseInt(position);
    if (isNaN(pos)) return '';
    if (pos === 1) return 'position-1';
    if (pos === 2) return 'position-2';
    if (pos === 3) return 'position-3';
    return '';
}

function getWinRateClassAnalysis(winRate) {
    if (winRate >= 70) return 'winrate-high';
    if (winRate >= 50) return 'winrate-medium';
    return 'winrate-low';
}

// ============================================================
// ESTADOS DE VISUALIZACIÓN
// ============================================================

function showComparisonStateAnalysis(state) {
    const states = {
        empty: document.getElementById('comparisonEmptyAnalysis'),
        loading: document.getElementById('comparisonLoadingAnalysis'),
        noData: document.getElementById('comparisonNoDataAnalysis'),
        content: document.getElementById('comparisonContentAnalysis')
    };
    
    // Ocultar todos
    Object.values(states).forEach(el => {
        if (el) el.style.display = 'none';
    });
    
    // Mostrar el seleccionado
    if (states[state]) {
        states[state].style.display = 'block';
    }
}

console.log('✅ [ANÁLISIS] Tournament comparison module loaded');
