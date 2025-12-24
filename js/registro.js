// ========================================
// REGISTRO DE PARTIDOS CON CloudSync
// ========================================

const STORAGE_KEY = 'xisco_matches_data';

// 🎯 MATERIALES POR DEFECTO
let materials = [
    'Velasco+Revo12.9',
    'Lucasi+Revo12.9',
    'Bear+Centro'
];

let selectedMaterial = null;
let matchesData = null;
let editingMatchId = null;

// Variables de paginación
let currentPage = 1;
const itemsPerPage = 30;

// Configuración de GitHub
const GITHUB_CONFIG_KEY = 'xisco_github_config';

// ========================================
// INICIALIZACIÓN
// ========================================

document.addEventListener('DOMContentLoaded', async () => {
    // Cargar datos con CloudSync
    matchesData = await loadData();
    
    document.getElementById('matchDate').valueAsDate = new Date();
    renderMaterialChips();
    renderHistory();
    updateModalityStats();
    
    // Configurar input de Excel
    document.getElementById('excelFileInput').addEventListener('change', handleExcelImport);
});

// ========================================
// CARGAR DATOS CON CloudSync
// ========================================

async function loadData() {
    try {
        // ✅ Cargar desde CloudSync (GitHub + localStorage)
        const data = await CloudSync.getData();
        
        if (data.materials) materials = data.materials;
        
        // Asegurar que modalityStats existe
        if (!data.modalityStats) {
            data.modalityStats = {
                bola8: { matchesPlayed: 0, matchesWon: 0, gamesPlayed: 0, gamesWon: 0 },
                bola9: { matchesPlayed: 0, matchesWon: 0, gamesPlayed: 0, gamesWon: 0 },
                bola10: { matchesPlayed: 0, matchesWon: 0, gamesPlayed: 0, gamesWon: 0 }
            };
        }
        
        return data;
    } catch (error) {
        console.error('Error cargando datos:', error);
        
        // Retornar estructura vacía si falla
        return {
            matches: [],
            players: ['Xisco'],
            materials: materials,
            modalityStats: {
                bola8: { matchesPlayed: 0, matchesWon: 0, gamesPlayed: 0, gamesWon: 0 },
                bola9: { matchesPlayed: 0, matchesWon: 0, gamesPlayed: 0, gamesWon: 0 },
                bola10: { matchesPlayed: 0, matchesWon: 0, gamesPlayed: 0, gamesWon: 0 }
            }
        };
    }
}

// ========================================
// GUARDAR DATOS (Ya no necesario, CloudSync lo hace)
// ========================================

function saveData() {
    // Mantener por compatibilidad, pero CloudSync maneja la sincronización
    matchesData.materials = materials;
    if (!matchesData.modalityStats) {
        matchesData.modalityStats = {
            bola8: { matchesPlayed: 0, matchesWon: 0, gamesPlayed: 0, gamesWon: 0 },
            bola9: { matchesPlayed: 0, matchesWon: 0, gamesPlayed: 0, gamesWon: 0 },
            bola10: { matchesPlayed: 0, matchesWon: 0, gamesPlayed: 0, gamesWon: 0 }
        };
    }
    matchesData.modalityStats.lastUpdated = new Date().toISOString();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(matchesData));
}

// ========================================
// ESTADÍSTICAS
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
        
        if (modality?.includes('8') || modality?.includes('bola8')) modalityKey = 'bola8';
        else if (modality?.includes('9') || modality?.includes('bola9')) modalityKey = 'bola9';
        else if (modality?.includes('10') || modality?.includes('bola10')) modalityKey = 'bola10';

        if (modalityKey && autoStats[modalityKey]) {
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
        saveModalityStats();
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
            
            ${!editMode && (current.matchesPlayed > auto.matchesPlayed || current.gamesPlayed > auto.gamesPlayed) ? 
                `<div style="margin-top: 12px; padding: 8px; background: rgba(255, 149, 0, 0.1); border-radius: 6px; font-size: 0.8rem; color: #ff9500; text-align: center;">
                    ⚠️ Incluye datos manuales
                </div>` : ''}
        `;
        
        container.appendChild(section);
    });
}

function updateStat(modality, field, value) {
    matchesData.modalityStats[modality][field] = parseInt(value) || 0;
}

async function saveModalityStats() {
    await CloudSync.updateModalityStats(matchesData.modalityStats);
    matchesData = await CloudSync.getData();
    showSuccess('💾 Estadísticas guardadas y sincronizadas');
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
    renderMaterialChips();
    input.value = '';
    saveData();
    showSuccess(`✅ Material "${newMaterial}" añadido`);
}

document.getElementById('newMaterial').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        e.preventDefault();
        addMaterial();
    }
});

// ========================================
// FORMULARIO DE PARTIDO
// ========================================

document.getElementById('matchForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    if (!selectedMaterial) {
        alert('⚠️ Por favor, selecciona un material');
        return;
    }

    const player2 = document.getElementById('player2').value.trim();
    const score1 = document.getElementById('score1').value;
    const score2 = document.getElementById('score2').value;
    const modality = document.getElementById('modality').value;
    const matchDate = document.getElementById('matchDate').value;

    // Deshabilitar botón mientras guarda
    const submitBtn = document.querySelector('.btn-primary');
    const originalText = submitBtn.textContent;
    submitBtn.disabled = true;
    submitBtn.textContent = '⏳ Guardando...';

    try {
        if (editingMatchId) {
            // MODO EDICIÓN
            const updatedMatch = {
                player2,
                score1,
                score2,
                material1: selectedMaterial,
                modality,
                date: matchDate
            };
            
            await CloudSync.updateMatch(editingMatchId, updatedMatch);
            showSuccess('✅ Partido actualizado y sincronizado');
        } else {
            // MODO CREACIÓN
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

            // ✅ Guardar con CloudSync (automático)
            await CloudSync.addMatch(match);
            showSuccess('✅ Partido guardado y sincronizado');
        }

        // Recargar datos
        matchesData = await CloudSync.getData();
        if (matchesData.materials) materials = matchesData.materials;

        // Limpiar formulario
        resetForm();

        // Actualizar UI
        renderHistory();
        updateModalityStats();
        
    } catch (error) {
        console.error('Error guardando partido:', error);
        alert('❌ Error al guardar el partido');
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
    }
});

function resetForm() {
    document.getElementById('matchForm').reset();
    document.getElementById('matchDate').valueAsDate = new Date();
    selectedMaterial = null;
    editingMatchId = null;
    renderMaterialChips();
    
    document.getElementById('formTitle').textContent = 'Registrar Nuevo Partido';
    const submitBtn = document.querySelector('.btn-primary');
    submitBtn.textContent = '💾 Guardar Partido';
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
    const submitBtn = document.querySelector('.btn-primary');
    submitBtn.textContent = '✅ Actualizar Partido';
    
    window.scrollTo({ top: 0, behavior: 'smooth' });
    
    showSuccess('✏️ Modo edición activado');
}

// ========================================
// ELIMINAR PARTIDO
// ========================================

async function deleteMatch(id) {
    if (!confirm('¿Estás seguro de eliminar este partido?')) return;
    
    try {
        // ✅ Eliminar con CloudSync (automático)
        await CloudSync.deleteMatch(id);
        
        // Recargar datos
        matchesData = await CloudSync.getData();
        if (matchesData.materials) materials = matchesData.materials;
        
        renderHistory();
        updateModalityStats();
        showSuccess('🗑️ Partido eliminado y sincronizado');
        
    } catch (error) {
        console.error('Error eliminando partido:', error);
        alert('❌ Error al eliminar el partido');
    }
}

// ========================================
// HISTORIAL
// ========================================

function renderHistory() {
    const container = document.getElementById('matchHistory');
    const matches = [...matchesData.matches].reverse();

    if (matches.length === 0) {
        container.innerHTML = '<div class="empty-state">No hay partidos registrados aún</div>';
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
            <button class="pagination-btn" onclick="goToPage(${currentPage - 1})" ${currentPage === 1 ? 'disabled' : ''} title="Anterior">
                ‹
            </button>
            <div class="page-numbers">
                ${generatePageNumbers(totalPages)}
            </div>
            <button class="pagination-btn" onclick="goToPage(${currentPage + 1})" ${currentPage === totalPages ? 'disabled' : ''} title="Siguiente">
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
    
    document.getElementById('matchHistory').scrollIntoView({ behavior: 'smooth', block: 'start' });
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

// ========================================
// SINCRONIZACIÓN LEGACY (Mantener por compatibilidad)
// ========================================

async function syncToGitHub() {
    // Ahora CloudSync maneja esto automáticamente
    showSuccess('☁️ La sincronización es automática con cada cambio');
}

function syncWithDashboard() {
    localStorage.setItem('shared_matches_data', JSON.stringify(matchesData));
    saveData();
    showSuccess('🔄 Datos sincronizados con el dashboard');
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
    
    showSuccess('📥 Archivo descargado');
}

async function loadFromGitHub() {
    try {
        matchesData = await CloudSync.getData();
        if (matchesData.materials) materials = matchesData.materials;
        
        renderMaterialChips();
        renderHistory();
        updateModalityStats();
        
        showSuccess('☁️ Datos actualizados desde GitHub');
    } catch (error) {
        alert('❌ Error al cargar desde GitHub');
        console.error(error);
    }
}

// ========================================
// IMPORTACIÓN EXCEL
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
                alert('❌ El archivo está vacío');
                return;
            }

            const processedMatches = processExcelData(jsonData);
            showImportPreview(processedMatches);
            
        } catch (error) {
            alert('❌ Error al leer el archivo: ' + error.message);
            console.error(error);
        }
    };
    reader.readAsArrayBuffer(file);
}

function processExcelData(jsonData) {
    const processed = [];
    
    jsonData.forEach((row, index) => {
        try {
            const rival = row['Rival'] || row['Jugador 2'] || row['jugador2'] || row['Player2'];
            const score1 = row['Partidas Xisco'] || row['Score1'] || row['score1'] || row['Xisco'];
            const score2 = row['Partidas Rival'] || row['Score2'] || row['score2'] || row['Rival Score'];
            const material = row['Material'] || row['material'] || 'Material por defecto';
            const modality = row['Modalidad'] || row['modality'] || row['Modo'];
            const dateStr = row['Fecha'] || row['Date'] || row['fecha'];

            if (!rival || score1 === undefined || score2 === undefined) {
                console.warn(`Fila ${index + 1}: Datos incompletos, omitida`);
                return;
            }

            let normalizedModality = 'Bola 8';
            if (modality) {
                const mod = modality.toString().toLowerCase();
                if (mod.includes('9')) normalizedModality = 'Bola 9';
                else if (mod.includes('10')) normalizedModality = 'Bola 10';
            }

            let matchDate = new Date().toISOString().split('T')[0];
            if (dateStr !== undefined && dateStr !== null && dateStr !== '') {
                try {
                    let dateObj;
                    
                    if (typeof dateStr === 'number') {
                        const excelEpoch = new Date(1899, 11, 30);
                        dateObj = new Date(excelEpoch.getTime() + dateStr * 86400000);
                    } 
                    else if (typeof dateStr === 'string' && dateStr.includes('/')) {
                        const parts = dateStr.split('/');
                        if (parts.length === 3) {
                            const day = parseInt(parts[0]);
                            const month = parseInt(parts[1]) - 1;
                            const year = parseInt(parts[2]);
                            dateObj = new Date(year, month, day);
                        }
                    }
                    else if (typeof dateStr === 'string') {
                        dateObj = new Date(dateStr);
                    }
                    else if (dateStr instanceof Date) {
                        dateObj = dateStr;
                    }
                    
                    if (dateObj && !isNaN(dateObj.getTime())) {
                        const year = dateObj.getFullYear();
                        const month = String(dateObj.getMonth() + 1).padStart(2, '0');
                        const day = String(dateObj.getDate()).padStart(2, '0');
                        matchDate = `${year}-${month}-${day}`;
                    }
                } catch (e) {
                    console.warn(`Fila ${index + 1}: Error al parsear fecha`);
                }
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
        } catch (error) {
            console.error(`Error procesando fila ${index + 1}:`, error);
        }
    });

    return processed;
}

function showImportPreview(matches) {
    const preview = document.getElementById('importPreview');
    preview.style.display = 'block';
    
    preview.innerHTML = `
        <div style="background: #f3f3f3; border: 1px solid rgba(52, 199, 89, 0.3); border-radius: 12px; padding: 20px;">
            <h3 style="color: #0a0a2e; margin-bottom: 16px;">✅ Archivo procesado correctamente</h3>
            <p style="color: #0a0a2e; margin-bottom: 20px;">
                Se encontraron <strong>${matches.length} partidos</strong> para importar
            </p>
            
            <div style="max-height: 300px; overflow-y: auto; background: white; border-radius: 8px; padding: 16px; margin-bottom: 20px;">
                <table style="width: 100%; font-size: 0.9rem; border-collapse: collapse;">
                    <thead>
                        <tr style="border-bottom: 2px solid #e0e0e0;">
                            <th style="padding: 8px; text-align: left;">Rival</th>
                            <th style="padding: 8px; text-align: center;">Resultado</th>
                            <th style="padding: 8px; text-align: left;">Modalidad</th>
                            <th style="padding: 8px; text-align: left;">Fecha</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${matches.map(m => `
                            <tr style="border-bottom: 1px solid #f0f0f0;">
                                <td style="padding: 8px;">${m.player2}</td>
                                <td style="padding: 8px; text-align: center; font-weight: 600;">
                                    ${m.score1} - ${m.score2}
                                </td>
                                <td style="padding: 8px;">${m.modality}</td>
                                <td style="padding: 8px;">${formatDate(m.date)}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
            
            <div style="display: flex; gap: 12px; justify-content: center;">
                <button onclick="confirmImport()" class="btn btn-primary">
                    ✅ Importar ${matches.length} partidos
                </button>
                <button onclick="cancelImport()" class="btn btn-secondary">
                    ❌ Cancelar
                </button>
            </div>
        </div>
    `;
    
    window.pendingImport = matches;
}

async function confirmImport() {
    if (!window.pendingImport || window.pendingImport.length === 0) {
        alert('⚠️ No hay partidos para importar');
        return;
    }

    try {
        // Importar cada partido con CloudSync
        for (const match of window.pendingImport) {
            await CloudSync.addMatch(match);
        }
        
        // Recargar datos
        matchesData = await CloudSync.getData();
        if (matchesData.materials) materials = matchesData.materials;
        
        renderMaterialChips();
        renderHistory();
        updateModalityStats();
        
        showSuccess(`✅ ${window.pendingImport.length} partidos importados y sincronizados`);
        
        window.pendingImport = null;
        document.getElementById('importPreview').style.display = 'none';
        document.getElementById('excelFileInput').value = '';
    } catch (error) {
        alert('❌ Error al importar partidos');
        console.error(error);
    }
}

function cancelImport() {
    window.pendingImport = null;
    document.getElementById('importPreview').style.display = 'none';
    document.getElementById('excelFileInput').value = '';
}

// ========================================
// REINICIAR DATOS
// ========================================

function resetAllData() {
    const confirmMessage = `⚠️ ADVERTENCIA IMPORTANTE ⚠️

¿Estás seguro de que quieres BORRAR TODOS LOS DATOS?

Esta acción NO se puede deshacer.

Escribe "BORRAR" para confirmar:`;

    const userInput = prompt(confirmMessage);
    
    if (userInput === 'BORRAR') {
        localStorage.removeItem(STORAGE_KEY);
        localStorage.removeItem('shared_matches_data');
        localStorage.clear();
        
        alert('✅ Todos los datos han sido eliminados');
        location.reload();
    } else if (userInput !== null) {
        alert('❌ Reinicio cancelado.');
    }
}

function logout() {
    if (confirm('¿Cerrar sesión?')) {
        sessionStorage.removeItem('xisco_session_active');
        window.location.href = 'index.html';
    }
}
