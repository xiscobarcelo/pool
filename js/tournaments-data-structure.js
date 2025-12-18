// ============================================================
// ESTRUCTURA DE DATOS PARA TORNEOS
// Integración con data.json existente
// ============================================================

/*
ESTRUCTURA COMPLETA DEL DATA.JSON AMPLIADA:

{
    "matches": [...],  // Partidos regulares (ya existente)
    "players": [...],  // Lista de jugadores (ya existente)
    "materials": [...], // Lista de materiales (ya existente)
    "modalityStats": {...}, // Stats por modalidad (ya existente)
    
    // ========== NUEVA SECCIÓN: TORNEOS ==========
    "tournaments": [
        {
            "id": "tournament_1234567890",
            "name": "Copa Ciudad 2024",
            "date": "2024-12-15",
            "modality": "Bola 9",
            "totalPlayers": 32,
            "result": "Campeón",  // Campeón, Subcampeón, Semifinales, Cuartos, Octavos, etc.
            "circuit": "Circuito Provincial 2024",  // null si no forma parte de circuito
            "cue": "Velasco+Revo12.9",
            "finalRival": "Juan Pérez",
            "notes": "Torneo de navidad",
            "createdAt": "2024-12-15T10:30:00Z",
            
            // Estadísticas detalladas
            "stats": {
                "matchesPlayed": 5,
                "matchesWon": 5,
                "matchesLost": 0,
                "gamesWon": 35,
                "gamesLost": 12,
                "winRate": 100,
                "averageGamesPerMatch": 9.4
            },
            
            // Opcional: Partidos del torneo (si quieres detalle)
            "matches": [
                {
                    "round": "Octavos",
                    "opponent": "Carlos",
                    "score": "7-3",
                    "won": true
                },
                {
                    "round": "Cuartos",
                    "opponent": "Miguel",
                    "score": "7-4",
                    "won": true
                },
                // ... más partidos
            ]
        }
    ],
    
    // ========== NUEVA SECCIÓN: CIRCUITOS ==========
    "circuits": [
        {
            "id": "circuit_1234567890",
            "name": "Circuito Provincial 2024",
            "year": 2024,
            "description": "Serie de torneos provinciales",
            "pointsSystem": {
                "Campeón": 100,
                "Subcampeón": 75,
                "Semifinales": 50,
                "Cuartos": 25,
                "Octavos": 10,
                "Participación": 5
            },
            "tournaments": [
                "tournament_1234567890",
                "tournament_0987654321"
            ],
            "totalPoints": 175,
            "ranking": 2  // Tu posición en el circuito
        }
    ]
}
*/

// ============================================================
// VALORES POR DEFECTO Y CONSTANTES
// ============================================================

const TOURNAMENT_RESULTS = [
    'Campeón',
    'Subcampeón', 
    'Semifinales',
    'Cuartos de Final',
    'Octavos de Final',
    'Dieciseisavos',
    'Fase de Grupos',
    'Eliminado en Ronda 1',
    'Participación'
];

const MODALITIES = [
    'Bola 8',
    'Bola 9',
    'Bola 10',
    '14.1 Continuo',
    'Banco Pool',
    'One Pocket'
];

const DEFAULT_POINTS_SYSTEM = {
    'Campeón': 100,
    'Subcampeón': 75,
    'Semifinales': 50,
    'Cuartos de Final': 25,
    'Octavos de Final': 15,
    'Dieciseisavos': 10,
    'Fase de Grupos': 5,
    'Eliminado en Ronda 1': 3,
    'Participación': 1
};

// ============================================================
// ESTRUCTURA INICIAL PARA NUEVOS USUARIOS
// ============================================================

const INITIAL_TOURNAMENTS_DATA = {
    tournaments: [],
    circuits: []
};

// ============================================================
// FUNCIONES HELPER PARA GESTIONAR TORNEOS
// ============================================================

// Crear nuevo torneo
function createTournament(data) {
    return {
        id: `tournament_${Date.now()}`,
        name: data.name,
        date: data.date,
        modality: data.modality,
        totalPlayers: parseInt(data.totalPlayers) || 0,
        result: data.result,
        circuit: data.circuit || null,
        cue: data.cue,
        finalRival: data.finalRival || '',
        notes: data.notes || '',
        createdAt: new Date().toISOString(),
        stats: data.stats || {
            matchesPlayed: 0,
            matchesWon: 0,
            matchesLost: 0,
            gamesWon: 0,
            gamesLost: 0,
            winRate: 0,
            averageGamesPerMatch: 0
        },
        matches: data.matches || []
    };
}

// Crear nuevo circuito
function createCircuit(data) {
    return {
        id: `circuit_${Date.now()}`,
        name: data.name,
        year: parseInt(data.year) || new Date().getFullYear(),
        description: data.description || '',
        pointsSystem: data.pointsSystem || DEFAULT_POINTS_SYSTEM,
        tournaments: [],
        totalPoints: 0,
        ranking: null
    };
}

// Calcular puntos de un torneo según el resultado
function calculatePoints(result, pointsSystem = DEFAULT_POINTS_SYSTEM) {
    return pointsSystem[result] || 0;
}

// Calcular estadísticas globales de torneos
function calculateTournamentStats(tournaments) {
    const stats = {
        totalTournaments: tournaments.length,
        championships: 0,
        runnerUps: 0,
        semifinals: 0,
        quarters: 0,
        totalMatches: 0,
        totalWins: 0,
        totalLosses: 0,
        winRate: 0,
        averagePosition: 0,
        modalityBreakdown: {},
        yearlyBreakdown: {}
    };
    
    tournaments.forEach(t => {
        // Contar resultados
        if (t.result === 'Campeón') stats.championships++;
        if (t.result === 'Subcampeón') stats.runnerUps++;
        if (t.result === 'Semifinales') stats.semifinals++;
        if (t.result === 'Cuartos de Final') stats.quarters++;
        
        // Sumar partidos
        if (t.stats) {
            stats.totalMatches += t.stats.matchesPlayed || 0;
            stats.totalWins += t.stats.matchesWon || 0;
            stats.totalLosses += t.stats.matchesLost || 0;
        }
        
        // Por modalidad
        if (!stats.modalityBreakdown[t.modality]) {
            stats.modalityBreakdown[t.modality] = {
                count: 0,
                championships: 0
            };
        }
        stats.modalityBreakdown[t.modality].count++;
        if (t.result === 'Campeón') {
            stats.modalityBreakdown[t.modality].championships++;
        }
        
        // Por año
        const year = new Date(t.date).getFullYear();
        if (!stats.yearlyBreakdown[year]) {
            stats.yearlyBreakdown[year] = {
                count: 0,
                championships: 0
            };
        }
        stats.yearlyBreakdown[year].count++;
        if (t.result === 'Campeón') {
            stats.yearlyBreakdown[year].championships++;
        }
    });
    
    // Calcular win rate
    if (stats.totalMatches > 0) {
        stats.winRate = ((stats.totalWins / stats.totalMatches) * 100).toFixed(1);
    }
    
    return stats;
}

// Calcular ranking de un circuito
function calculateCircuitRanking(circuit, tournaments) {
    let totalPoints = 0;
    
    circuit.tournaments.forEach(tournamentId => {
        const tournament = tournaments.find(t => t.id === tournamentId);
        if (tournament) {
            totalPoints += calculatePoints(tournament.result, circuit.pointsSystem);
        }
    });
    
    return totalPoints;
}

// Ordenar torneos por fecha (más reciente primero)
function sortTournamentsByDate(tournaments) {
    return [...tournaments].sort((a, b) => 
        new Date(b.date) - new Date(a.date)
    );
}

// Filtrar torneos por circuito
function filterTournamentsByCircuit(tournaments, circuitId) {
    return tournaments.filter(t => t.circuit === circuitId);
}

// Filtrar torneos por año
function filterTournamentsByYear(tournaments, year) {
    return tournaments.filter(t => 
        new Date(t.date).getFullYear() === year
    );
}

// Filtrar torneos por modalidad
function filterTournamentsByModality(tournaments, modality) {
    return tournaments.filter(t => t.modality === modality);
}

// Exportar torneos a CSV
function exportTournamentsToCSV(tournaments) {
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
    
    const rows = tournaments.map(t => [
        t.name,
        t.date,
        t.modality,
        t.totalPlayers,
        t.result,
        t.circuit || 'N/A',
        t.cue,
        t.finalRival || 'N/A',
        t.stats?.matchesPlayed || 0,
        t.stats?.matchesWon || 0
    ]);
    
    const csv = [
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');
    
    return csv;
}

// ============================================================
// EJEMPLO DE USO
// ============================================================

/*
// Añadir torneo
const newTournament = createTournament({
    name: "Copa Ciudad 2024",
    date: "2024-12-15",
    modality: "Bola 9",
    totalPlayers: 32,
    result: "Campeón",
    circuit: "circuit_123456",
    cue: "Velasco+Revo12.9",
    finalRival: "Juan Pérez",
    stats: {
        matchesPlayed: 5,
        matchesWon: 5,
        matchesLost: 0,
        gamesWon: 35,
        gamesLost: 12
    }
});

matchesData.tournaments.push(newTournament);

// Crear circuito
const newCircuit = createCircuit({
    name: "Circuito Provincial 2024",
    year: 2024,
    description: "Serie de torneos provinciales"
});

matchesData.circuits.push(newCircuit);

// Calcular estadísticas
const stats = calculateTournamentStats(matchesData.tournaments);
console.log(stats);

// Exportar a CSV
const csv = exportTournamentsToCSV(matchesData.tournaments);
console.log(csv);
*/
