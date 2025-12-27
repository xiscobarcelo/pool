// ============================================================
// COMPARATIVA HISTÓRICA DE TORNEOS PARA ANALISIS.HTML
// Versión optimizada con IDs específicos para evitar conflictos
// ============================================================

let tournamentComparisonChartsAnalysis = {
    position: null
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
        bestResult: null,
        totalPrizes: 0,
        avgPlayers: 0
    };
    
    let totalPlayers = 0;
    let countWithPlayers = 0;
    
    editions.forEach(tournament => {
        console.log('📊 Procesando torneo:', tournament.name, new Date(tournament.date).getFullYear());
        
        // Extraer el año de la fecha
        const year = new Date(tournament.date).getFullYear();
        
        // Procesar la posición o resultado
        let position = '-';
        let positionNumber = null;
        
        // Intentar extraer posición del campo result
        if (tournament.result) {
            const resultLower = tournament.result.toLowerCase().trim();
            
            console.log(`  Result original: "${tournament.result}"`);
            console.log(`  Result lowercase: "${resultLower}"`);
            
            // Casos especiales - ORDEN IMPORTA
            if (resultLower.includes('subcampeón') || resultLower.includes('subcampeon') || 
                resultLower === 'subcampeon' || resultLower === 'subcampeón' ||
                resultLower.includes('finalista') || resultLower.includes('2º') || 
                resultLower === '2' || resultLower === '2º puesto' || resultLower === 'segundo') {
                position = '2º';
                positionNumber = 2;
                console.log('  → Detectado como 2º (Subcampeón)');
            } 
            else if (resultLower.includes('campeón') || resultLower.includes('campeon') || 
                     resultLower === 'campeon' || resultLower === 'campeón' ||
                     resultLower === '1' || resultLower === '1º' || resultLower === 'primero' ||
                     resultLower === 'ganador' || resultLower === 'winner') {
                position = '1º';
                positionNumber = 1;
                console.log('  → Detectado como 1º (Campeón)');
            } 
            else if (resultLower.includes('semifinal') || resultLower === '3' || 
                     resultLower === '3º' || resultLower === '4' || resultLower === '4º') {
                // Extraer número específico
                const match = tournament.result.match(/(\d+)/);
                if (match) {
                    positionNumber = parseInt(match[1]);
                    position = `${positionNumber}º`;
                    console.log(`  → Detectado como ${position}`);
                } else {
                    position = tournament.result;
                    console.log(`  → Usando result como texto: ${position}`);
                }
            }
            else {
                // Intentar extraer cualquier número del string
                const match = tournament.result.match(/(\d+)/);
                if (match) {
                    positionNumber = parseInt(match[1]);
                    position = `${positionNumber}º`;
                    console.log(`  → Número extraído: ${position}`);
                } else {
                    position = tournament.result;
                    console.log(`  → Sin número, usando texto: ${position}`);
                }
            }
        }
        
        // Si tiene position directamente (tiene prioridad)
        if (tournament.position) {
            positionNumber = parseInt(tournament.position);
            position = `${positionNumber}º`;
            console.log(`  → Position field override: ${position}`);
        }
        
        // Contar jugadores
        const players = parseInt(tournament.totalPlayers) || 0;
        if (players > 0) {
            totalPlayers += players;
            countWithPlayers++;
        }
        
        // Contar premio
        const prize = parseFloat(tournament.prize) || 0;
        stats.totalPrizes += prize;
        
        console.log(`  Posición: ${position}, Jugadores: ${players}, Premio: ${prize}`);
        
        // Guardar stats de esta edición
        const editionStats = {
            year: year,
            position: position,
            positionNumber: positionNumber,
            totalPlayers: players,
            prize: prize,
            modality: tournament.modality || '-',
            notes: tournament.notes || '-'
        };
        
        stats.editions.push(editionStats);
        
        // Actualizar mejor posición
        if (positionNumber !== null && positionNumber < stats.bestPosition) {
            stats.bestPosition = positionNumber;
            stats.bestResult = position;
        }
    });
    
    // Calcular posición media (solo de posiciones numéricas)
    const validPositions = stats.editions
        .map(e => e.positionNumber)
        .filter(p => p !== null && !isNaN(p));
    
    stats.avgPosition = validPositions.length > 0
        ? (validPositions.reduce((a, b) => a + b, 0) / validPositions.length).toFixed(1)
        : '-';
    
    // Promedio de jugadores
    stats.avgPlayers = countWithPlayers > 0
        ? Math.round(totalPlayers / countWithPlayers)
        : 0;
    
    // Mejor resultado
    if (stats.bestResult === null) {
        stats.bestResult = '-';
    }
    
    console.log('📈 Stats finales:', stats);
    
    return stats;
}

// ============================================================
// RENDERIZAR COMPARATIVA
// ============================================================

function renderComparisonAnalysis(data) {
    // Solo gráfico y tabla
    renderPositionChartAnalysis(data.editions);
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
// TABLA DETALLADA
// ============================================================

function renderComparisonTableAnalysis(editions) {
    const tbody = document.getElementById('comparisonTableBodyAnalysis');
    if (!tbody) return;
    
    tbody.innerHTML = editions.map(edition => {
        const positionClass = getPositionClassAnalysis(edition.positionNumber);
        const prizeText = edition.prize > 0 ? `${edition.prize}€` : '-';
        
        return `
            <tr>
                <td class="year-cell">${edition.year}</td>
                <td class="position-cell ${positionClass}">${edition.position}</td>
                <td>${edition.totalPlayers || '-'}</td>
                <td>${edition.modality}</td>
                <td>${prizeText}</td>
                <td>${edition.notes}</td>
            </tr>
        `;
    }).join('');
}

function getPositionClassAnalysis(positionNumber) {
    if (!positionNumber) return '';
    if (positionNumber === 1) return 'position-1';
    if (positionNumber === 2) return 'position-2';
    if (positionNumber === 3) return 'position-3';
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
