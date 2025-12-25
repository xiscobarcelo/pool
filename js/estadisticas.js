// ============================================================
// ESTADISTICAS - VERSION UNIFICADA
// Suma: Importados + Manuales + Stats Manuales
// ============================================================

let matchesData = null;
let unifiedStats = null;
let charts = {};

// ============================================================
// INICIALIZACION
// ============================================================

document.addEventListener(‘DOMContentLoaded’, async () => {
console.log(‘Inicializando estadisticas…’);

```
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

renderStats(totals, unifiedStats);

if (CloudSync.config && CloudSync.config.token) {
    setTimeout(async () => {
        const githubData = await CloudSync.pullFromGitHub();
        if (githubData) {
            matchesData = githubData;
            const newUnified = calculateUnifiedStats(matchesData.matches, matchesData.modalityStats);
            const newTotals = calculateTotalStats(newUnified);
            renderStats(newTotals, newUnified);
        }
    }, 500);
}
```

});

// ============================================================
// CALCULO UNIFICADO
// ============================================================

function calculateUnifiedStats(matches, modalityStats) {
console.log(‘Calculando stats unificadas…’);

```
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
```

}

function calculateStatsFromMatches(matches) {
const stats = {
bola8: { matchesPlayed: 0, matchesWon: 0, gamesPlayed: 0, gamesWon: 0 },
bola9: { matchesPlayed: 0, matchesWon: 0, gamesPlayed: 0, gamesWon: 0 },
bola10: { matchesPlayed: 0, matchesWon: 0, gamesPlayed: 0, gamesWon: 0 }
};

```
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
```

}

function calculateTotalStats(unified) {
let totalMatches = 0;
let totalMatchesWon = 0;
let totalGames = 0;
let totalGamesWon = 0;

```
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
```

}

// ============================================================
// RENDERIZAR
// ============================================================

function renderStats(totals, unified) {
console.log(‘Renderizando stats…’);

```
updateElementById('totalMatches', totals.totalMatches);
updateElementById('totalMatchesWon', totals.totalMatchesWon);
updateElementById('totalMatchesLost', totals.totalMatchesLost);
updateElementById('totalGames', totals.totalGames);
updateElementById('totalGamesWon', totals.totalGamesWon);
updateElementById('totalGamesLost', totals.totalGamesLost);
updateElementById('winRate', totals.winRate + '%');
updateElementById('gameWinRate', totals.gameWinRate + '%');
updateElementById('matchWinRate', totals.winRate + '%');

['bola8', 'bola9', 'bola10'].forEach(mod => {
    const data = unified[mod];
    const wr = data.matchesPlayed > 0 ? ((data.matchesWon / data.matchesPlayed) * 100).toFixed(1) : 0;
    
    updateElementById(mod + 'Matches', data.matchesPlayed);
    updateElementById(mod + 'MatchesWon', data.matchesWon);
    updateElementById(mod + 'Games', data.gamesPlayed);
    updateElementById(mod + 'GamesWon', data.gamesWon);
    updateElementById(mod + 'WinRate', wr + '%');
});

if (typeof Chart !== 'undefined') {
    renderCharts(unified, totals);
}
```

}

function updateElementById(id, value) {
const el = document.getElementById(id);
if (el) {
el.textContent = value;
}
}

function renderCharts(unified, totals) {
const wrChart = document.getElementById(‘winRateChart’);
if (wrChart) {
if (charts.winRate) charts.winRate.destroy();

```
    charts.winRate = new Chart(wrChart, {
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
                backgroundColor: ['rgba(102, 126, 234, 0.8)', 'rgba(118, 75, 162, 0.8)', 'rgba(240, 147, 251, 0.8)'],
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: { y: { beginAtZero: true, max: 100, ticks: { callback: function(v) { return v + '%'; } } } }
        }
    });
}

const distChart = document.getElementById('gamesDistributionChart');
if (distChart) {
    if (charts.distribution) charts.distribution.destroy();
    
    charts.distribution = new Chart(distChart, {
        type: 'doughnut',
        data: {
            labels: ['Bola 8', 'Bola 9', 'Bola 10'],
            datasets: [{
                data: [unified.bola8.gamesPlayed, unified.bola9.gamesPlayed, unified.bola10.gamesPlayed],
                backgroundColor: ['rgba(102, 126, 234, 0.8)', 'rgba(118, 75, 162, 0.8)', 'rgba(240, 147, 251, 0.8)'],
                borderColor: '#fff',
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
```

}

function calcularEstadisticas() {
console.log(‘Funcion obsoleta - calculo automatico’);
}

function guardarJSON() {
console.log(‘Funcion obsoleta - usa CloudSync’);
}

function logout() {
if (confirm(‘Cerrar sesion?’)) {
sessionStorage.removeItem(‘xisco_session_active’);
window.location.href = ‘index.html’;
}
}

console.log(‘estadisticas.js cargado’);