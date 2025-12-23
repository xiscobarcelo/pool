// ========================================
// HISTORIAL AVANZADO CON FILTROS
// ========================================

const GITHUB_CONFIG_KEY = 'xisco_github_config';
let allMatches = [];
let filteredMatches = [];
let currentPage = 1;
const itemsPerPage = 50;
let winsChart = null;

// ========================================
// CARGA DE DATOS
// ========================================

window.addEventListener('DOMContentLoaded', loadData);

async function loadData() {
    const config = localStorage.getItem('xisco_github_config');
    
    // Intentar cargar desde GitHub
    if (config) {
        try {
            const data = JSON.parse(config);
            const githubUrl = `https://raw.githubusercontent.com/${data.username}/${data.repo}/main/appx/data.json`;
            
            console.log('🔄 Cargando desde GitHub:', githubUrl);
            
            const response = await fetch(githubUrl, {
                cache: 'no-cache',
                headers: { 'Accept': 'application/json' }
            });
            
            if (response.ok) {
                const githubData = await response.json();
                localStorage.setItem('shared_matches_data', JSON.stringify(githubData));
                initializeHistory(githubData);
                return;
            }
        } catch (error) {
            console.error('Error cargando desde GitHub:', error);
        }
    }
    
    // Intentar localStorage
    const sharedData = localStorage.getItem('shared_matches_data');
    if (sharedData) {
        try {
            const data = JSON.parse(sharedData);
            initializeHistory(data);
            return;
        } catch (error) {
            console.error('Error al cargar datos compartidos:', error);
        }
    }

    // Mostrar mensaje de error
    document.getElementById('loading').style.display = 'none';
    showEmptyState('No se encontraron datos', 'Registra tu primer partido en la sección de Partidos');
}

// ========================================
// INICIALIZACIÓN
// ========================================

function initializeHistory(data) {
    allMatches = data.matches || [];
    
    // Filtrar solo partidos de Xisco
    allMatches = allMatches.filter(m => 
        m.player1.toLowerCase() === 'xisco' || m.player2.toLowerCase() === 'xisco'
    );
    
    // Ordenar por fecha (más reciente primero)
    allMatches.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    filteredMatches = [...allMatches];
    
    document.getElementById('loading').style.display = 'none';
    document.getElementById('content').style.display = 'block';
    
    // Poblar filtros
    populateFilters();
    
    // Actualizar visualización
    updateStats();
    updateChart();
    displayMatches();
}

// ========================================
// FILTROS
// ========================================

function populateFilters() {
    // Años únicos
    const years = [...new Set(allMatches.map(m => new Date(m.date).getFullYear()))].sort((a, b) => b - a);
    const yearSelect = document.getElementById('filterYear');
    years.forEach(year => {
        const option = document.createElement('option');
        option.value = year;
        option.textContent = year;
        yearSelect.appendChild(option);
    });
    
    // Modalidades únicas
    const modalities = [...new Set(allMatches.map(m => m.modality))].sort();
    const modalitySelect = document.getElementById('filterModality');
    modalities.forEach(modality => {
        const option = document.createElement('option');
        option.value = modality;
        option.textContent = modality;
        modalitySelect.appendChild(option);
    });
    
    // Materiales únicos (solo de Xisco)
    const materials = new Set();
    allMatches.forEach(m => {
        const isXiscoPlayer1 = m.player1.toLowerCase() === 'xisco';
        const material = isXiscoPlayer1 ? m.material1 : m.material2;
        materials.add(material);
    });
    const materialSelect = document.getElementById('filterMaterial');
    [...materials].sort().forEach(material => {
        const option = document.createElement('option');
        option.value = material;
        option.textContent = material;
        materialSelect.appendChild(option);
    });
}

function applyFilters() {
    const year = document.getElementById('filterYear').value;
    const modality = document.getElementById('filterModality').value;
    const material = document.getElementById('filterMaterial').value;
    const player = document.getElementById('filterPlayer').value.toLowerCase().trim();
    
    filteredMatches = allMatches.filter(match => {
        // Filtro por año
        if (year && new Date(match.date).getFullYear() !== parseInt(year)) {
            return false;
        }
        
        // Filtro por modalidad
        if (modality && match.modality !== modality) {
            return false;
        }
        
        // Filtro por material (solo el de Xisco)
        if (material) {
            const isXiscoPlayer1 = match.player1.toLowerCase() === 'xisco';
            const xiscoMaterial = isXiscoPlayer1 ? match.material1 : match.material2;
            if (xiscoMaterial !== material) {
                return false;
            }
        }
        
        // Filtro por rival
        if (player) {
            const isXiscoPlayer1 = match.player1.toLowerCase() === 'xisco';
            const rival = isXiscoPlayer1 ? match.player2.toLowerCase() : match.player1.toLowerCase();
            if (!rival.includes(player)) {
                return false;
            }
        }
        
        return true;
    });
    
    currentPage = 1;
    updateStats();
    updateChart();
    displayMatches();
}

function clearFilters() {
    document.getElementById('filterYear').value = '';
    document.getElementById('filterModality').value = '';
    document.getElementById('filterMaterial').value = '';
    document.getElementById('filterPlayer').value = '';
    
    filteredMatches = [...allMatches];
    currentPage = 1;
    
    updateStats();
    updateChart();
    displayMatches();
}

// ========================================
// ESTADÍSTICAS
// ========================================

function updateStats() {
    let wins = 0;
    let losses = 0;
    
    filteredMatches.forEach(match => {
        const isXiscoPlayer1 = match.player1.toLowerCase() === 'xisco';
        const xiscoScore = parseInt(isXiscoPlayer1 ? match.score1 : match.score2);
        const opponentScore = parseInt(isXiscoPlayer1 ? match.score2 : match.score1);
        
        if (xiscoScore > opponentScore) wins++;
        else if (xiscoScore < opponentScore) losses++;
    });
    
    const total = filteredMatches.length;
    const winRate = total > 0 ? ((wins / total) * 100).toFixed(1) : 0;
    
    document.getElementById('totalMatches').textContent = total;
    document.getElementById('totalWins').textContent = wins;
    document.getElementById('totalLosses').textContent = losses;
    document.getElementById('winRate').textContent = winRate + '%';
}

// ========================================
// GRÁFICO
// ========================================

function updateChart() {
    let wins = 0;
    let losses = 0;
    
    filteredMatches.forEach(match => {
        const isXiscoPlayer1 = match.player1.toLowerCase() === 'xisco';
        const xiscoScore = parseInt(isXiscoPlayer1 ? match.score1 : match.score2);
        const opponentScore = parseInt(isXiscoPlayer1 ? match.score2 : match.score1);
        
        if (xiscoScore > opponentScore) wins++;
        else if (xiscoScore < opponentScore) losses++;
    });
    
    const ctx = document.getElementById('winsChart');
    
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
                    'rgba(0, 255, 242, 1)',
                    'rgba(0, 217, 255, 1)'
'
                ],
                borderWidth: 0,
                spacing: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        color: '#0a0a2e',
                        font: { 
                            size: 14, 
                            weight: '600',
                            family: 'DM Sans'
                        },
                        padding: 20,
                        usePointStyle: true,
                        pointStyle: 'circle'
                    }
                },
                tooltip: {
                    backgroundColor: 'rgba(10, 10, 46, 0.95)',
                    titleColor: '#fff',
                    bodyColor: '#fff',
                    padding: 12,
                    borderRadius: 8,
                    titleFont: { size: 14, weight: '600' },
                    bodyFont: { size: 14 }
                }
            }
        }
    });
}

// ========================================
// TABLA DE PARTIDOS
// ========================================

function displayMatches() {
    const container = document.getElementById('tableContainer');
    const emptyState = document.getElementById('emptyState');
    
    if (filteredMatches.length === 0) {
        container.innerHTML = '';
        document.getElementById('pagination').style.display = 'none';
        emptyState.style.display = 'block';
        document.getElementById('resultsCount').textContent = '0 partidos';
        return;
    }
    
    emptyState.style.display = 'none';
    
    // Calcular paginación
    const totalPages = Math.ceil(filteredMatches.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const currentMatches = filteredMatches.slice(startIndex, endIndex);
    
    // Crear tabla
    let html = `
        <table class="matches-table">
            <thead>
                <tr>
                    <th>Fecha</th>
                    <th>Xisco</th>
                    <th>Resultado</th>
                    <th>Rival</th>
                    <th>Modalidad</th>
                    <th>Material</th>
                </tr>
            </thead>
            <tbody>
    `;
    
    currentMatches.forEach(match => {
        const isXiscoPlayer1 = match.player1.toLowerCase() === 'xisco';
        const xiscoScore = parseInt(isXiscoPlayer1 ? match.score1 : match.score2);
        const opponentScore = parseInt(isXiscoPlayer1 ? match.score2 : match.score1);
        const rival = isXiscoPlayer1 ? match.player2 : match.player1;
        const xiscoMaterial = isXiscoPlayer1 ? match.material1 : match.material2;
        
        const xiscoWon = xiscoScore > opponentScore;
        const xiscoClass = xiscoWon ? 'winner' : 'loser';
        const rivalClass = xiscoWon ? 'loser' : 'winner';
        
        const dateObj = new Date(match.date);
        const formattedDate = dateObj.toLocaleDateString('es-ES', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
        
        html += `
            <tr>
                <td class="date-cell" data-label="Fecha">${formattedDate}</td>
                <td class="${xiscoClass}" data-label="Xisco">${xiscoScore} ${xiscoWon ? '✓' : ''}</td>
                <td class="score-cell" data-label="Resultado">${xiscoScore} - ${opponentScore}</td>
                <td class="${rivalClass}" data-label="Rival">${rival} ${!xiscoWon ? '✓' : ''}</td>
                <td data-label="Modalidad">${match.modality}</td>
                <td data-label="Material">${xiscoMaterial}</td>
            </tr>
        `;
    });
    
    html += `
            </tbody>
        </table>
    `;
    
    container.innerHTML = html;
    
    // Actualizar contador
    document.getElementById('resultsCount').textContent = 
        `${filteredMatches.length} ${filteredMatches.length === 1 ? 'partido' : 'partidos'}`;
    
    // Mostrar paginación si hay más de 50 resultados
    if (filteredMatches.length > itemsPerPage) {
        renderPagination(totalPages, startIndex, endIndex);
    } else {
        document.getElementById('pagination').style.display = 'none';
    }
}

// ========================================
// PAGINACIÓN
// ========================================

function renderPagination(totalPages, startIndex, endIndex) {
    const pagination = document.getElementById('pagination');
    const paginationInfo = document.getElementById('paginationInfo');
    const paginationButtons = document.getElementById('paginationButtons');
    
    pagination.style.display = 'flex';
    
    // Info
    paginationInfo.textContent = 
        `${startIndex + 1}-${Math.min(endIndex, filteredMatches.length)} de ${filteredMatches.length}`;
    
    // Botones
    let buttonsHTML = '';
    
    // Primera página
    buttonsHTML += `
        <button class="pagination-btn" onclick="goToPage(1)" ${currentPage === 1 ? 'disabled' : ''}>
            ⟨⟨
        </button>
    `;
    
    // Anterior
    buttonsHTML += `
        <button class="pagination-btn" onclick="goToPage(${currentPage - 1})" ${currentPage === 1 ? 'disabled' : ''}>
            ‹
        </button>
    `;
    
    // Números de página
    const maxVisible = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisible / 2));
    let endPage = Math.min(totalPages, startPage + maxVisible - 1);
    
    if (endPage - startPage < maxVisible - 1) {
        startPage = Math.max(1, endPage - maxVisible + 1);
    }
    
    for (let i = startPage; i <= endPage; i++) {
        buttonsHTML += `
            <button class="pagination-btn ${i === currentPage ? 'active' : ''}" onclick="goToPage(${i})">
                ${i}
            </button>
        `;
    }
    
    // Siguiente
    buttonsHTML += `
        <button class="pagination-btn" onclick="goToPage(${currentPage + 1})" ${currentPage === totalPages ? 'disabled' : ''}>
            ›
        </button>
    `;
    
    // Última página
    buttonsHTML += `
        <button class="pagination-btn" onclick="goToPage(${totalPages})" ${currentPage === totalPages ? 'disabled' : ''}>
            ⟩⟩
        </button>
    `;
    
    paginationButtons.innerHTML = buttonsHTML;
}

function goToPage(page) {
    const totalPages = Math.ceil(filteredMatches.length / itemsPerPage);
    if (page < 1 || page > totalPages) return;
    
    currentPage = page;
    displayMatches();
    
    // Scroll suave al inicio de la tabla
    document.getElementById('tableContainer').scrollIntoView({ 
        behavior: 'smooth', 
        block: 'start' 
    });
}

// ========================================
// UTILIDADES
// ========================================

function showEmptyState(title, message) {
    const emptyState = document.getElementById('emptyState');
    emptyState.innerHTML = `
        <div class="empty-state-icon">🎱</div>
        <h3 class="empty-state-title">${title}</h3>
        <p class="empty-state-text">${message}</p>
    `;
    emptyState.style.display = 'block';
}

function logoutDashboard() {
    if (confirm('¿Cerrar sesión?')) {
        sessionStorage.removeItem('xisco_session_active');
        window.location.href = 'index.html';
    }
}

function resetAllDataDashboard() {
    const confirmMessage = `⚠️ ADVERTENCIA IMPORTANTE ⚠️

¿Estás seguro de que quieres BORRAR TODOS LOS DATOS?

Esta acción NO se puede deshacer.

Escribe "BORRAR" para confirmar:`;

    const userInput = prompt(confirmMessage);
    
    if (userInput === 'BORRAR') {
        localStorage.removeItem('xisco_matches_data');
        localStorage.removeItem('shared_matches_data');
        localStorage.clear();
        alert('✅ Todos los datos han sido eliminados');
        location.reload();
    } else if (userInput !== null) {
        alert('❌ Reinicio cancelado.');
    }
}
