// ========================================
// REGISTRO DE PARTIDOS - FINAL VERSION
// ========================================

const STORAGE_KEY = 'xisco_matches_data';

let materials = ['Velasco+Revo12.9', 'Lucasi+Revo12.9', 'Bear+Centro'];
let selectedMaterial = null;
let matchesData = null;
let editingMatchId = null;
let currentPage = 1;
const itemsPerPage = 30;

// ========================================
// INICIALIZACIÓN CON SYNC
// ========================================

document.addEventListener('DOMContentLoaded', async () => {
    console.log('🚀 Inicializando página de registro...');
    
    // 1. Cargar datos locales INMEDIATAMENTE
    matchesData = CloudSync.getData();
    if (matchesData.materials) materials = matchesData.materials;
    
    // 2. Renderizar UI con datos locales
    document.getElementById('matchDate').valueAsDate = new Date();
    renderMaterialChips();
    renderHistory();
    updateModalityStats();
    
    document.getElementById('excelFileInput').addEventListener('change', handleExcelImport);
    
    console.log('✅ UI renderizada con', matchesData.matches.length, 'partidos');
    
    // 3. Bajar datos de GitHub en segundo plano y actualizar UI
    if (CloudSync.config && CloudSync.config.token) {
        setTimeout(async () => {
            console.log('🔄 Sincronizando con GitHub...');
            const githubData = await CloudSync.pullFromGitHub();
            
            if (githubData) {
                // Recargar datos y actualizar UI
                matchesData = CloudSync.getData();
                if (matchesData.materials) materials = matchesData.materials;
                
                renderMaterialChips();
                renderHistory();
                updateModalityStats();
                
                console.log('✅ UI actualizada con datos de GitHub');
            }
        }, 500);
    }
});

// ========================================
// FORMULARIO DE PARTIDO
// ========================================

document.getElementById('matchForm').addEventListener('submit', (e) => {
    e.preventDefault();
    
    if (!selectedMaterial) {
        alert('⚠️ Selecciona un material');
        return;
    }

    const player2 = document.getElementById('player2').value.trim();
    const score1 = document.getElementById('score1').value;
    const score2 = document.getElementById('score2').value;
    const modality = document.getElementById('modality').value;
    const matchDate = document.getElementById('matchDate').value;

    if (editingMatchId) {
        // EDITAR
        const updatedMatch = {
            player2, score1, score2,
            material1: selectedMaterial,
            modality, date: matchDate
        };
        
        matchesData = CloudSync.updateMatch(editingMatchId, updatedMatch);
        showSuccess('✅ Partido actualizado');
    } else {
        // CREAR NUEVO
        const match = {
            player1: 'Xisco',
            player2: player2,
            score1: score1,
            score2: score2,
            material1: selectedMaterial,
            material2: 'rival',
            modality: modality,
            date: matchDate
        };

        matchesData = CloudSync.addMatch(match);
        showSuccess('✅ Partido guardado');
    }

    // Actualizar materials
    if (matchesData.materials) materials = matchesData.materials;

    // Limpiar y actualizar UI INMEDIATAMENTE
    resetForm();
    renderMaterialChips();
    renderHistory();
    updateModalityStats();
});

function resetForm() {
    document.getElementById('matchForm').reset();
    document.getElementById('matchDate').valueAsDate = new Date();
    selectedMaterial = null;
    editingMatchId = null;
    renderMaterialChips();
    
    document.getElementById('formTitle').textContent = 'Registrar Nuevo Partido';
    document.querySelector('.btn-primary').textContent = '💾 Guardar Partido';
}

// ========================================
// EDITAR PARTIDO
// ========================================

function editMatch(id) {
    const match = matchesData.matches.find(m => m.id === id);
    if (!match) return;

    document.getElementById('player2').value = match.player2;
    document.getElementById('score1').value = match.score1;
    document.getElementById('score2').value = match.score2;
    document.getElementById('modality').value = match.modality;
    document.getElementById('matchDate').value = match.date;
    
    selectedMaterial = match.material1;
    renderMaterialChips();
    
    editingMatchId = id;
    
    document.getElementById('formTitle').textContent = 'Editar Partido';
    document.querySelector('.btn-primary').textContent = '✅ Actualizar Partido';
    
    window.scrollTo({ top: 0, behavior: 'smooth' });
    showSuccess('✏️ Modo edición');
}

// ========================================
// ELIMINAR PARTIDO
// ========================================

function deleteMatch(id) {
    if (!confirm('¿Eliminar este partido?')) return;
    
    console.log('🗑️ Eliminando partido ID:', id);
    
    // Eliminar INMEDIATAMENTE
    matchesData = CloudSync.deleteMatch(id);
    
    console.log('✅ Partido eliminado. Total:', matchesData.matches.length);
    
    // Actualizar materials
    if (matchesData.materials) materials = matchesData.materials;
    
    // Actualizar UI INMEDIATAMENTE
    renderMaterialChips();
    renderHistory();
    updateModalityStats();
    showSuccess('🗑️ Partido eliminado');
}

// ========================================
// MATERIALES
// ========================================

function renderMaterialChips() {
    const container = document.getElementById('materialChips');
    container.innerHTML = '';
    
    materials.forEach(material => {
        const chip = document.createElement('div');
        chip.className = 'material-chip' + (selectedMaterial === material ? ' selected' : '');
        chip.textContent = material;
        chip.onclick = () => selectMaterial(material);
        container.appendChild(chip);
    });
}

function selectMaterial(material) {
    selectedMaterial = material;
    renderMaterialChips();
}

function addMaterial() {
    const input = document.getElementById('newMaterial');
    const newMaterial = input.value.trim();
    
    if (!newMaterial) {
        alert('⚠️ Escribe el nombre del material');
        return;
    }
    
    if (materials.includes(newMaterial)) {
        alert('⚠️ Este material ya existe');
        return;
    }
    
    materials.push(newMaterial);
    matchesData.materials = materials;
    CloudSync.saveData(matchesData);
    
    renderMaterialChips();
    input.value = '';
    showSuccess(`✅ Material "${newMaterial}" añadido`);
}

document.getElementById('newMaterial').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        e.preventDefault();
        addMaterial();
    }
});

// ========================================
// HISTORIAL
// ========================================

function renderHistory() {
    const container = document.getElementById('matchHistory');
    const matches = [...matchesData.matches].reverse();

    console.log('📋 Renderizando historial:', matches.length, 'partidos');

    if (matches.length === 0) {
        container.innerHTML = '<div class="empty-state">No hay partidos registrados</div>';
        document.getElementById('paginationTop').style.display = 'none';
        document.getElementById('paginationBottom').style.display = 'none';
        return;
    }

    const totalPages = Math.ceil(matches.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const currentMatches = matches.slice(startIndex, endIndex);

    container.innerHTML = '';
    currentMatches.forEach(match => {
        const item = document.createElement('div');
        item.className = 'match-item';
        
        const winner = parseInt(match.score1) > parseInt(match.score2) ? match.player1 : match.player2;
        const isXiscoWinner = winner === 'Xisco';
        
        item.innerHTML = `
            <div class="match-date">${formatDate(match.date)}</div>
            <div class="match-info">
                <div class="match-players">
                    <span style="color: ${isXiscoWinner ? '#00d9ff' : '#86868b'}">${match.player1}</span>
                    vs
                    <span style="color: ${!isXiscoWinner ? '#00d9ff' : '#86868b'}">${match.player2}</span>
                </div>
                <div class="match-score">${match.score1} - ${match.score2}</div>
                <div class="match-details">${match.modality} • ${match.material1}</div>
            </div>
            <div style="display: flex; gap: 8px;">
                <button class="btn-edit" onclick="editMatch(${match.id})">Editar</button>
                <button class="btn-delete" onclick="deleteMatch(${match.id})">Eliminar</button>
            </div>
        `;
        
        container.appendChild(item);
    });

    if (matches.length > itemsPerPage) {
        renderPagination(totalPages, matches.length);
    } else {
        document.getElementById('paginationTop').style.display = 'none';
        document.getElementById('paginationBottom').style.display = 'none';
    }
}

function renderPagination(totalPages, totalMatches) {
    const paginationHTML = `
        <div class="pagination-info">
            ${(currentPage - 1) * itemsPerPage + 1}-${Math.min(currentPage * itemsPerPage, totalMatches)} de ${totalMatches}
        </div>
        <div class="pagination-buttons">
            <button class="pagination-btn" onclick="goToPage(${currentPage - 1})" ${currentPage === 1 ? 'disabled' : ''}>
                ‹
            </button>
            <div class="page-numbers">
                ${generatePageNumbers(totalPages)}
            </div>
            <button class="pagination-btn" onclick="goToPage(${currentPage + 1})" ${currentPage === totalPages ? 'disabled' : ''}>
                ›
            </button>
        </div>
    `;

    document.getElementById('paginationTop').innerHTML = paginationHTML;
    document.getElementById('paginationBottom').innerHTML = paginationHTML;
    document.getElementById('paginationTop').style.display = 'flex';
    document.getElementById('paginationBottom').style.display = 'flex';
}

function generatePageNumbers(totalPages) {
    let pages = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible) {
        for (let i = 1; i <= totalPages; i++) {
            pages.push(`<div class="page-number ${i === currentPage ? 'active' : ''}" onclick="goToPage(${i})">${i}</div>`);
        }
    } else {
        if (currentPage <= 3) {
            for (let i = 1; i <= 4; i++) {
                pages.push(`<div class="page-number ${i === currentPage ? 'active' : ''}" onclick="goToPage(${i})">${i}</div>`);
            }
            pages.push(`<div class="page-number ellipsis">...</div>`);
            pages.push(`<div class="page-number" onclick="goToPage(${totalPages})">${totalPages}</div>`);
        } else if (currentPage >= totalPages - 2) {
            pages.push(`<div class="page-number" onclick="goToPage(1)">1</div>`);
            pages.push(`<div class="page-number ellipsis">...</div>`);
            for (let i = totalPages - 3; i <= totalPages; i++) {
                pages.push(`<div class="page-number ${i === currentPage ? 'active' : ''}" onclick="goToPage(${i})">${i}</div>`);
            }
        } else {
            pages.push(`<div class="page-number" onclick="goToPage(1)">1</div>`);
            pages.push(`<div class="page-number ellipsis">...</div>`);
            for (let i = currentPage - 1; i <= currentPage + 1; i++) {
                pages.push(`<div class="page-number ${i === currentPage ? 'active' : ''}" onclick="goToPage(${i})">${i}</div>`);
            }
            pages.push(`<div class="page-number ellipsis">...</div>`);
            pages.push(`<div class="page-number" onclick="goToPage(${totalPages})">${totalPages}</div>`);
        }
    }

    return pages.join('');
}

function goToPage(page) {
    const totalPages = Math.ceil(matchesData.matches.length / itemsPerPage);
    if (page < 1 || page > totalPages) return;
    
    currentPage = page;
    renderHistory();
    document.getElementById('matchHistory').scrollIntoView({ behavior: 'smooth' });
}

function formatDate(dateStr) {
    const date = new Date(dateStr + 'T00:00:00');
    return date.toLocaleDateString('es-ES', { 
        day: '2-digit', 
        month: 'short', 
        year: 'numeric' 
    });
}

// ========================================
// ESTADÍSTICAS DE MODALIDAD
// ========================================

function calculateAutoStats() {
    const autoStats = {
        bola8: { matchesPlayed: 0, matchesWon: 0, gamesPlayed: 0, gamesWon: 0 },
        bola9: { matchesPlayed: 0, matchesWon: 0, gamesPlayed: 0, gamesWon: 0 },
        bola10: { matchesPlayed: 0, matchesWon: 0, gamesPlayed: 0, gamesWon: 0 }
    };

    matchesData.matches.forEach(match => {
        const modality = match.modality?.toLowerCase().replace(/\s+/g, '');
        let modalityKey = null;
        
        if (modality?.includes('8')) modalityKey = 'bola8';
        else if (modality?.includes('9')) modalityKey = 'bola9';
        else if (modality?.includes('10')) modalityKey = 'bola10';

        if (modalityKey) {
            const score1 = parseInt(match.score1);
            const score2 = parseInt(match.score2);
            
            autoStats[modalityKey].matchesPlayed += 1;
            if (score1 > score2) autoStats[modalityKey].matchesWon += 1;
            autoStats[modalityKey].gamesPlayed += score1 + score2;
            autoStats[modalityKey].gamesWon += score1;
        }
    });

    return autoStats;
}

function updateModalityStats() {
    const autoStats = calculateAutoStats();
    renderModalityStats(autoStats);
}

let editMode = false;

function toggleModalityEdit() {
    editMode = !editMode;
    document.getElementById('editBtnText').textContent = editMode ? 'Guardar' : 'Editar';
    
    if (!editMode) {
        // ✅ Usar updateModalityStats de CloudSync
        CloudSync.updateModalityStats(matchesData.modalityStats);
        matchesData = CloudSync.getData();
        showSuccess('💾 Estadísticas guardadas y sincronizadas');
    }
    
    renderModalityStats(calculateAutoStats());
}

function renderModalityStats(autoStats) {
    const container = document.getElementById('modalityStatsSection');
    container.innerHTML = '';

    const modalities = [
        { key: 'bola8', title: 'Bola 8', color: '#000000' },
        { key: 'bola9', title: 'Bola 9', color: '#5856d6' },
        { key: 'bola10', title: 'Bola 10', color: '#af52de' }
    ];

    modalities.forEach(mod => {
        const section = document.createElement('div');
        section.className = 'modality-stat-section';
        
        const current = matchesData.modalityStats[mod.key];
        const auto = autoStats[mod.key];
        
        section.innerHTML = `
            <div class="modality-stat-title" style="color: ${mod.color}">${mod.title}</div>
            
            <div class="stat-input-row">
                <span class="stat-input-label">Partidos Jugados</span>
                <input type="number" 
                       class="stat-input-value ${!editMode && current.matchesPlayed === auto.matchesPlayed ? 'auto-calculated' : ''}" 
                       value="${current.matchesPlayed}" 
                       ${!editMode ? 'disabled' : ''}
                       onchange="updateStat('${mod.key}', 'matchesPlayed', this.value)">
            </div>
            
            <div class="stat-input-row">
                <span class="stat-input-label">Partidos Ganados</span>
                <input type="number" 
                       class="stat-input-value ${!editMode && current.matchesWon === auto.matchesWon ? 'auto-calculated' : ''}" 
                       value="${current.matchesWon}" 
                       ${!editMode ? 'disabled' : ''}
                       onchange="updateStat('${mod.key}', 'matchesWon', this.value)">
            </div>
            
            <div class="stat-input-row">
                <span class="stat-input-label">Partidas Jugadas</span>
                <input type="number" 
                       class="stat-input-value ${!editMode && current.gamesPlayed === auto.gamesPlayed ? 'auto-calculated' : ''}" 
                       value="${current.gamesPlayed}" 
                       ${!editMode ? 'disabled' : ''}
                       onchange="updateStat('${mod.key}', 'gamesPlayed', this.value)">
            </div>
            
            <div class="stat-input-row">
                <span class="stat-input-label">Partidas Ganadas</span>
                <input type="number" 
                       class="stat-input-value ${!editMode && current.gamesWon === auto.gamesWon ? 'auto-calculated' : ''}" 
                       value="${current.gamesWon}" 
                       ${!editMode ? 'disabled' : ''}
                       onchange="updateStat('${mod.key}', 'gamesWon', this.value)">
            </div>
        `;
        
        container.appendChild(section);
    });
}

function updateStat(modality, field, value) {
    matchesData.modalityStats[modality][field] = parseInt(value) || 0;
}

// ========================================
// UTILIDADES
// ========================================

function showSuccess(message) {
    const msgDiv = document.getElementById('successMessage');
    msgDiv.className = 'success-message';
    msgDiv.textContent = message;
    msgDiv.style.display = 'block';
    
    setTimeout(() => {
        msgDiv.style.display = 'none';
    }, 3000);
}

function syncWithDashboard() {
    showSuccess('🔄 Sincronización automática activa');
}

function downloadData() {
    const dataStr = JSON.stringify(matchesData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'data.json';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showSuccess('📥 Descargado');
}

async function loadFromGitHub() {
    const githubData = await CloudSync.pullFromGitHub();
    if (githubData) {
        matchesData = CloudSync.getData();
        if (matchesData.materials) materials = matchesData.materials;
        renderMaterialChips();
        renderHistory();
        updateModalityStats();
    }
}

function syncToGitHub() {
    CloudSync.pushToGitHub(matchesData);
}

// ========================================
// EXCEL IMPORT (abreviado, mantener del original)
// ========================================

function handleExcelImport(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const data = new Uint8Array(e.target.result);
            const workbook = XLSX.read(data, { type: 'array' });
            const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
            const jsonData = XLSX.utils.sheet_to_json(firstSheet);
            
            if (jsonData.length === 0) {
                alert('❌ Archivo vacío');
                return;
            }

            const processedMatches = processExcelData(jsonData);
            showImportPreview(processedMatches);
            
        } catch (error) {
            alert('❌ Error: ' + error.message);
        }
    };
    reader.readAsArrayBuffer(file);
}

function processExcelData(jsonData) {
    const processed = [];
    
    jsonData.forEach((row, index) => {
        try {
            const rival = row['Rival'] || row['Jugador 2'];
            const score1 = row['Partidas Xisco'] || row['Score1'];
            const score2 = row['Partidas Rival'] || row['Score2'];
            const material = row['Material'] || 'Material por defecto';
            const modality = row['Modalidad'] || 'Bola 8';
            const dateStr = row['Fecha'] || row['Date'];

            if (!rival || score1 === undefined || score2 === undefined) return;

            let normalizedModality = 'Bola 8';
            if (modality) {
                const mod = modality.toString().toLowerCase();
                if (mod.includes('9')) normalizedModality = 'Bola 9';
                else if (mod.includes('10')) normalizedModality = 'Bola 10';
            }

            let matchDate = new Date().toISOString().split('T')[0];
            if (dateStr) {
                try {
                    let dateObj;
                    if (typeof dateStr === 'number') {
                        const excelEpoch = new Date(1899, 11, 30);
                        dateObj = new Date(excelEpoch.getTime() + dateStr * 86400000);
                    } else {
                        dateObj = new Date(dateStr);
                    }
                    
                    if (dateObj && !isNaN(dateObj.getTime())) {
                        const year = dateObj.getFullYear();
                        const month = String(dateObj.getMonth() + 1).padStart(2, '0');
                        const day = String(dateObj.getDate()).padStart(2, '0');
                        matchDate = `${year}-${month}-${day}`;
                    }
                } catch (e) {}
            }

            processed.push({
                player1: 'Xisco',
                player2: rival.toString().trim(),
                score1: score1.toString(),
                score2: score2.toString(),
                material1: material.toString().trim(),
                material2: 'rival',
                modality: normalizedModality,
                date: matchDate
            });
        } catch (error) {}
    });

    return processed;
}

function showImportPreview(matches) {
    const preview = document.getElementById('importPreview');
    preview.style.display = 'block';
    
    preview.innerHTML = `
        <div style="background: #f3f3f3; border-radius: 12px; padding: 20px;">
            <h3 style="color: #0a0a2e;">✅ ${matches.length} partidos listos</h3>
            <button onclick="confirmImport()" class="btn btn-primary">Importar</button>
            <button onclick="cancelImport()" class="btn btn-secondary">Cancelar</button>
        </div>
    `;
    
    window.pendingImport = matches;
}

function confirmImport() {
    if (!window.pendingImport) return;

    window.pendingImport.forEach(match => {
        matchesData = CloudSync.addMatch(match);
    });
    
    if (matchesData.materials) materials = matchesData.materials;
    
    renderMaterialChips();
    renderHistory();
    updateModalityStats();
    
    showSuccess(`✅ ${window.pendingImport.length} partidos importados`);
    
    window.pendingImport = null;
    document.getElementById('importPreview').style.display = 'none';
    document.getElementById('excelFileInput').value = '';
}

function cancelImport() {
    window.pendingImport = null;
    document.getElementById('importPreview').style.display = 'none';
    document.getElementById('excelFileInput').value = '';
}

// ========================================
// OTRAS FUNCIONES
// ========================================

function resetAllData() {
    if (prompt('Escribe "BORRAR"') === 'BORRAR') {
        localStorage.clear();
        location.reload();
    }
}

function logout() {
    if (confirm('¿Cerrar sesión?')) {
        sessionStorage.removeItem('xisco_session_active');
        window.location.href = 'index.html';
    }
}
