// ========================================
// VERSIÓN SOLO HISTORIAL - JavaScript Modificado
// ========================================

const GITHUB_CONFIG_KEY = 'xisco_github_config';

const HARDCODED_GITHUB_CONFIG = {
    username: 'xiscobarcelo',
    repo: 'pool',
    token: ''
};

function getDataURL() {
    if (HARDCODED_GITHUB_CONFIG.username && HARDCODED_GITHUB_CONFIG.repo) {
        return `https://raw.githubusercontent.com/${HARDCODED_GITHUB_CONFIG.username}/${HARDCODED_GITHUB_CONFIG.repo}/main/appx/data.json`;
    }
    
    const config = localStorage.getItem(GITHUB_CONFIG_KEY);
    if (config) {
        const data = JSON.parse(config);
        return `https://raw.githubusercontent.com/${data.username}/${data.repo}/main/appx/data.json`;
    }
    
    return 'https://www.xiscobarcelo.com/pool/data.json';
}

const API_URL = getDataURL();
let currentData = null;

let currentPageStats = 1;
const itemsPerPageStats = 100;

window.addEventListener('DOMContentLoaded', loadData);

document.addEventListener('DOMContentLoaded', () => {
    const fileInput = document.getElementById('jsonFileInput');
    if (fileInput) {
        fileInput.addEventListener('change', handleFileUpload);
    }
});

async function loadData() {
    const config = localStorage.getItem('xisco_github_config');
    
    if (config) {
        try {
            const data = JSON.parse(config);
            const githubUrl = `https://raw.githubusercontent.com/${data.username}/${data.repo}/main/appx/data.json`;
            
            console.log('🔄 Cargando desde GitHub:', githubUrl);
            
            const response = await fetch(githubUrl, {
                cache: 'no-cache',
                headers: {
                    'Accept': 'application/json'
                }
            });
            
            if (response.ok) {
                const githubData = await response.json();
                currentData = githubData;
                localStorage.setItem('shared_matches_data', JSON.stringify(githubData));
                
                document.getElementById('loading').style.display = 'none';
                displayDashboard(githubData);
                showGitHubSyncBanner();
                return;
            }
        } catch (error) {
            console.error('Error cargando desde GitHub:', error);
        }
    }
    
    const sharedData = localStorage.getItem('shared_matches_data');
    if (sharedData) {
        try {
            const data = JSON.parse(sharedData);
            currentData = data;
            document.getElementById('loading').style.display = 'none';
            displayDashboard(data);
            showSharedDataBanner();
            return;
        } catch (error) {
            console.error('Error al cargar datos compartidos:', error);
        }
    }

    try {
        const response = await fetch(API_URL, {
            method: 'GET',
            headers: {
                'Accept': 'application/json'
            },
            mode: 'cors'
        });
        
        if (!response.ok) {
            if (response.status === 404) {
                showFileUploadOption();
                return;
            }
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        currentData = data;
        displayDashboard(data);
    } catch (error) {
        console.error('Error al cargar datos:', error);
        showFileUploadOption();
    }
}

function showGitHubSyncBanner() {
    const banner = document.createElement('div');
    banner.style.cssText = 'background: linear-gradient(62deg,rgba(0, 255, 242, 1) 0%, rgba(0, 217, 255, 1) 100%); color: dark; padding: 16px; text-align: center; border-radius: 12px; margin: 0 auto 20px; max-width: 1400px; font-weight: 600; box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);';
    banner.innerHTML = '☁️ Datos sincronizados desde GitHub (Cloud)';
    
    const container = document.querySelector('.container');
    const header = container.querySelector('header');
    if (header) {
        header.insertAdjacentElement('afterend', banner);
        
        setTimeout(() => {
            banner.style.opacity = '0';
            banner.style.transition = 'opacity 0.5s';
            setTimeout(() => banner.remove(), 500);
        }, 5000);
    }
}

function showSharedDataBanner() {
    const banner = document.createElement('div');
    banner.style.cssText = 'background: linear-gradient(135deg,rgba(245, 247, 250, 0) 0%, rgba(232, 236, 241, 1) 100%); color: dark; padding: 16px; text-align: center; border-radius: 12px; margin: 0 auto 20px; max-width: 1400px; font-weight: 600; box-shadow: 0 4px 12px rgba(52, 199, 89, 0.3);';
    banner.innerHTML = '✅ Datos sincronizados desde el registro de partidos';
    
    const container = document.querySelector('.container');
    const header = container.querySelector('header');
    if (header) {
        header.insertAdjacentElement('afterend', banner);
        
        setTimeout(() => {
            banner.style.opacity = '0';
            banner.style.transition = 'opacity 0.5s';
            setTimeout(() => banner.remove(), 500);
        }, 5000);
    }
}

function showFileUploadOption() {
    document.getElementById('loading').style.display = 'none';
    document.getElementById('fileUploadSection').style.display = 'block';
}

function handleFileUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const data = JSON.parse(e.target.result);
            currentData = data;
            document.getElementById('fileUploadSection').style.display = 'none';
            displayDashboard(data);
        } catch (error) {
            alert('❌ Error al leer el archivo JSON: ' + error.message);
        }
    };
    reader.readAsText(file);
}

function loadDemoData() {
    const demoData = {
        "matches": [
            {
                "player1": "Xisco",
                "player2": "Juan",
                "score1": "3",
                "score2": "2",
                "material1": "Raqueta A",
                "material2": "Raqueta B",
                "modality": "Bola 8",
                "date": "2025-12-10",
                "id": 1
            }
        ],
        "players": ["Xisco", "Juan"],
        "materials": ["Raqueta A", "Raqueta B"]
    };

    currentData = demoData;
    document.getElementById('fileUploadSection').style.display = 'none';
    displayDashboard(demoData);
}

function loadFromRegistration() {
    window.location.href = 'registro-partidos.html';
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
        alert('❌ Reinicio cancelado. Debes escribir exactamente "BORRAR" para confirmar.');
    }
}

function logoutDashboard() {
    if (confirm('¿Cerrar sesión?')) {
        sessionStorage.removeItem('xisco_session_active');
        window.location.href = 'index.html';
    }
}

// ========================================
// FUNCIÓN PRINCIPAL - SOLO HISTORIAL
// ========================================

function displayDashboard(data) {
    console.log('📊 displayDashboard called with data:', data);
    
    document.getElementById('loading').style.display = 'none';
    document.getElementById('content').style.display = 'block';

    const matches = data.matches || [];
    
    // ✅ SOLO GENERAR TABLA DE HISTORIAL
    generateMatchesTable(matches);
    
    // ❌ TODO LO DEMÁS ESTÁ COMENTADO - NO SE GENERA
    // const players = data.players || [];
    // const materials = data.materials || [];
    // const combinedStats = combineMatchesWithModalityStats(matches, data.modalityStats);
    // generateHeroStats(matches, players, materials, combinedStats);
    // generateCharts(matches, players, materials);
    // setupPlayerComparison(matches, players);
    // setupModalityCalculator();
    // if (data.modalityStats) {
    //     loadModalityData(data.modalityStats, matches);
    // }
}

// ========================================
// FUNCIONES DE TABLA DE HISTORIAL
// ========================================

function generateMatchesTable(matches) {
    const table = document.getElementById('matchesTable');
    const sortedMatches = [...matches].sort((a, b) => new Date(b.date) - new Date(a.date));

    if (sortedMatches.length === 0) {
        table.innerHTML = '<tbody><tr><td colspan="6" style="text-align: center; padding: 40px; color: #86868b;">No hay partidos registrados</td></tr></tbody>';
        document.getElementById('paginationTopStats').style.display = 'none';
        document.getElementById('paginationBottomStats').style.display = 'none';
        return;
    }

    const totalPages = Math.ceil(sortedMatches.length / itemsPerPageStats);
    const startIndex = (currentPageStats - 1) * itemsPerPageStats;
    const endIndex = startIndex + itemsPerPageStats;
    const currentMatches = sortedMatches.slice(startIndex, endIndex);

    let html = `
        <thead>
            <tr>
                <th>Fecha</th>
                <th>Jugador 1</th>
                <th>Resultado</th>
                <th>Jugador 2</th>
                <th>Modalidad</th>
                <th>Material</th>
            </tr>
        </thead>
        <tbody>
    `;

    currentMatches.forEach(m => {
        const winner1 = parseInt(m.score1) > parseInt(m.score2);
        const winner2 = parseInt(m.score2) > parseInt(m.score1);
        
        html += `
            <tr>
                <td>${new Date(m.date).toLocaleDateString('es-ES')}</td>
                <td class="${winner1 ? 'winner' : ''}">${m.player1}</td>
                <td class="score-cell">${m.score1} - ${m.score2}</td>
                <td class="${winner2 ? 'winner' : ''}">${m.player2}</td>
                <td>${m.modality}</td>
                <td>${m.material1}</td>
            </tr>
        `;
    });

    html += '</tbody>';
    table.innerHTML = html;

    if (sortedMatches.length > itemsPerPageStats) {
        renderPaginationStats(totalPages, sortedMatches.length);
    } else {
        document.getElementById('paginationTopStats').style.display = 'none';
        document.getElementById('paginationBottomStats').style.display = 'none';
    }
}

function renderPaginationStats(totalPages, totalMatches) {
    const paginationHTML = `
        <div class="pagination-info-stats">
            ${(currentPageStats - 1) * itemsPerPageStats + 1}-${Math.min(currentPageStats * itemsPerPageStats, totalMatches)} de ${totalMatches}
        </div>
        <div class="pagination-buttons-stats">
            <button class="pagination-btn-stats" onclick="goToPageStats(1)" ${currentPageStats === 1 ? 'disabled' : ''} title="Primera página">
                ⟨⟨
            </button>
            <button class="pagination-btn-stats" onclick="goToPageStats(${currentPageStats - 1})" ${currentPageStats === 1 ? 'disabled' : ''} title="Anterior">
                ‹
            </button>
            <div class="page-numbers-stats">
                ${generatePageNumbersStats(totalPages)}
            </div>
            <button class="pagination-btn-stats" onclick="goToPageStats(${currentPageStats + 1})" ${currentPageStats === totalPages ? 'disabled' : ''} title="Siguiente">
                ›
            </button>
            <button class="pagination-btn-stats" onclick="goToPageStats(${totalPages})" ${currentPageStats === totalPages ? 'disabled' : ''} title="Última página">
                ⟩⟩
            </button>
        </div>
    `;

    document.getElementById('paginationTopStats').innerHTML = paginationHTML;
    document.getElementById('paginationBottomStats').innerHTML = paginationHTML;
    document.getElementById('paginationTopStats').style.display = 'flex';
    document.getElementById('paginationBottomStats').style.display = 'flex';
}

function generatePageNumbersStats(totalPages) {
    let pages = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible) {
        for (let i = 1; i <= totalPages; i++) {
            pages.push(`<div class="page-number-stats ${i === currentPageStats ? 'active' : ''}" onclick="goToPageStats(${i})">${i}</div>`);
        }
    } else {
        if (currentPageStats <= 3) {
            for (let i = 1; i <= 4; i++) {
                pages.push(`<div class="page-number-stats ${i === currentPageStats ? 'active' : ''}" onclick="goToPageStats(${i})">${i}</div>`);
            }
            pages.push(`<div class="page-number-stats ellipsis">...</div>`);
            pages.push(`<div class="page-number-stats" onclick="goToPageStats(${totalPages})">${totalPages}</div>`);
        } else if (currentPageStats >= totalPages - 2) {
            pages.push(`<div class="page-number-stats" onclick="goToPageStats(1)">1</div>`);
            pages.push(`<div class="page-number-stats ellipsis">...</div>`);
            for (let i = totalPages - 3; i <= totalPages; i++) {
                pages.push(`<div class="page-number-stats ${i === currentPageStats ? 'active' : ''}" onclick="goToPageStats(${i})">${i}</div>`);
            }
        } else {
            pages.push(`<div class="page-number-stats" onclick="goToPageStats(1)">1</div>`);
            pages.push(`<div class="page-number-stats ellipsis">...</div>`);
            for (let i = currentPageStats - 1; i <= currentPageStats + 1; i++) {
                pages.push(`<div class="page-number-stats ${i === currentPageStats ? 'active' : ''}" onclick="goToPageStats(${i})">${i}</div>`);
            }
            pages.push(`<div class="page-number-stats ellipsis">...</div>`);
            pages.push(`<div class="page-number-stats" onclick="goToPageStats(${totalPages})">${totalPages}</div>`);
        }
    }

    return pages.join('');
}

function goToPageStats(page) {
    if (!currentData || !currentData.matches) return;
    
    const totalPages = Math.ceil(currentData.matches.length / itemsPerPageStats);
    if (page < 1 || page > totalPages) return;
    
    currentPageStats = page;
    generateMatchesTable(currentData.matches);
    
    document.getElementById('matchesTable').scrollIntoView({ behavior: 'smooth', block: 'start' });
}
