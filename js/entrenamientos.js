// ========================================
// ENTRENAMIENTOS - MAIN SCRIPT
// ========================================

let errorsDistributionChart = null;
let accuracyEvolutionChart = null;
let modalityComparisonChart = null;

// ========================================
// INICIALIZACIÓN
// ========================================

document.addEventListener('DOMContentLoaded', () => {
    console.log('🎯 Inicializando página de entrenamientos...');
    
    // Establecer fecha actual por defecto
    document.getElementById('trainingDate').valueAsDate = new Date();
    
    // Listeners para el formulario
    setupFormListeners();
    
    // Cargar y mostrar datos
    loadTrainings();
    updateStats();
    renderCharts();
    
    // Sincronización automática al cargar
    setTimeout(() => {
        syncTrainingData();
    }, 1000);
});

// ========================================
// SETUP FORM LISTENERS
// ========================================

function setupFormListeners() {
    const form = document.getElementById('trainingForm');
    form.addEventListener('submit', handleFormSubmit);
    
    // Listener para total de errores
    document.getElementById('totalErrors').addEventListener('input', updateErrorTotal);
    
    // Listeners para cada tipo de error
    ['errorBanda', 'errorCombinacion', 'errorPosicionBlanca', 'errorNoForzado'].forEach(id => {
        document.getElementById(id).addEventListener('input', updateErrorCount);
    });
}

// ========================================
// ACTUALIZAR CONTADOR DE ERRORES
// ========================================

function updateErrorTotal() {
    const totalErrors = parseInt(document.getElementById('totalErrors').value) || 0;
    document.getElementById('errorTotal').textContent = totalErrors;
    updateErrorCount();
}

function updateErrorCount() {
    const banda = parseInt(document.getElementById('errorBanda').value) || 0;
    const combinacion = parseInt(document.getElementById('errorCombinacion').value) || 0;
    const posicionBlanca = parseInt(document.getElementById('errorPosicionBlanca').value) || 0;
    const noForzado = parseInt(document.getElementById('errorNoForzado').value) || 0;
    
    const totalSpecified = banda + combinacion + posicionBlanca + noForzado;
    const totalErrors = parseInt(document.getElementById('totalErrors').value) || 0;
    
    document.getElementById('errorCount').textContent = totalSpecified;
    
    const errorCounter = document.querySelector('.error-counter');
    if (totalSpecified > totalErrors) {
        errorCounter.classList.add('error');
    } else {
        errorCounter.classList.remove('error');
    }
}

// ========================================
// HANDLE FORM SUBMIT
// ========================================

function handleFormSubmit(e) {
    e.preventDefault();
    
    // Validar errores especificados
    const banda = parseInt(document.getElementById('errorBanda').value) || 0;
    const combinacion = parseInt(document.getElementById('errorCombinacion').value) || 0;
    const posicionBlanca = parseInt(document.getElementById('errorPosicionBlanca').value) || 0;
    const noForzado = parseInt(document.getElementById('errorNoForzado').value) || 0;
    const totalSpecified = banda + combinacion + posicionBlanca + noForzado;
    const totalErrors = parseInt(document.getElementById('totalErrors').value) || 0;
    
    if (totalSpecified > totalErrors) {
        alert('⚠️ Los errores especificados no pueden superar el total de errores');
        return;
    }
    
    // Recoger datos del formulario
    const trainingData = {
        date: document.getElementById('trainingDate').value,
        modality: document.getElementById('trainingModality').value,
        totalShots: document.getElementById('totalShots').value,
        totalErrors: totalErrors,
        errors: {
            banda: banda,
            combinacion: combinacion,
            posicionBlanca: posicionBlanca,
            noForzado: noForzado
        },
        notes: document.getElementById('trainingNotes').value
    };
    
    // Verificar si estamos editando
    const editingId = document.getElementById('editingTrainingId').value;
    
    let training;
    if (editingId) {
        // Actualizar entrenamiento existente
        training = updateTraining(editingId, trainingData);
        if (training) {
            showNotification('✅ Entrenamiento actualizado correctamente', 'success');
        } else {
            showNotification('❌ Error al actualizar el entrenamiento', 'error');
            return;
        }
    } else {
        // Crear nuevo entrenamiento
        training = addTraining(trainingData);
        if (training) {
            showNotification('✅ Entrenamiento guardado correctamente', 'success');
        } else {
            showNotification('❌ Error al guardar el entrenamiento', 'error');
            return;
        }
    }
    
    // Resetear formulario
    resetTrainingForm();
    
    // Actualizar vistas
    loadTrainings();
    updateStats();
    renderCharts();
}

// ========================================
// RESET FORM
// ========================================

function resetTrainingForm() {
    document.getElementById('trainingForm').reset();
    document.getElementById('trainingDate').valueAsDate = new Date();
    document.getElementById('editingTrainingId').value = '';
    
    // Reset error counters
    document.getElementById('errorCount').textContent = '0';
    document.getElementById('errorTotal').textContent = '0';
    document.querySelector('.error-counter').classList.remove('error');
    
    // Reset button texts
    document.getElementById('saveBtnText').textContent = 'Guardar Entrenamiento';
    document.getElementById('cancelBtnText').textContent = 'Limpiar';
}

// ========================================
// CANCEL EDIT
// ========================================

function cancelEdit() {
    resetTrainingForm();
}

// ========================================
// EDIT TRAINING
// ========================================

function editTraining(trainingId) {
    const data = TrainingCloudSync.getData();
    const training = data.trainings.find(t => t.id === trainingId);
    
    if (!training) {
        showNotification('❌ Entrenamiento no encontrado', 'error');
        return;
    }
    
    // Llenar formulario
    document.getElementById('trainingDate').value = training.date;
    document.getElementById('trainingModality').value = training.modality;
    document.getElementById('totalShots').value = training.totalShots;
    document.getElementById('totalErrors').value = training.totalErrors;
    document.getElementById('errorBanda').value = training.errors.banda;
    document.getElementById('errorCombinacion').value = training.errors.combinacion;
    document.getElementById('errorPosicionBlanca').value = training.errors.posicionBlanca;
    document.getElementById('errorNoForzado').value = training.errors.noForzado;
    document.getElementById('trainingNotes').value = training.notes || '';
    
    // Establecer modo edición
    document.getElementById('editingTrainingId').value = trainingId;
    
    // Actualizar contadores
    updateErrorTotal();
    updateErrorCount();
    
    // Cambiar textos de botones
    document.getElementById('saveBtnText').textContent = 'Actualizar Entrenamiento';
    document.getElementById('cancelBtnText').textContent = 'Cancelar';
    
    // Scroll al formulario
    document.querySelector('.training-section').scrollIntoView({ behavior: 'smooth' });
    
    showNotification('✏️ Modo edición activado', 'info');
}

// ========================================
// LOAD TRAININGS (HISTORIAL)
// ========================================

function loadTrainings() {
    const data = TrainingCloudSync.getData();
    const trainings = data.trainings || [];
    
    const tbody = document.getElementById('historyTableBody');
    
    if (trainings.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="6" class="no-data">
                    No hay entrenamientos registrados
                </td>
            </tr>
        `;
        return;
    }
    
    tbody.innerHTML = trainings.map(t => {
        const accuracy = parseFloat(t.accuracy);
        let accuracyClass = 'accuracy-poor';
        if (accuracy >= 90) accuracyClass = 'accuracy-excellent';
        else if (accuracy >= 80) accuracyClass = 'accuracy-good';
        else if (accuracy >= 70) accuracyClass = 'accuracy-average';
        
        return `
            <tr>
                <td>${formatDate(t.date)}</td>
                <td><strong>${t.modality}</strong></td>
                <td>${t.totalShots}</td>
                <td>${t.totalErrors}</td>
                <td>
                    <span class="accuracy-badge ${accuracyClass}">
                        ${accuracy}%
                    </span>
                </td>
                <td>
                    <div class="action-buttons">
                        <button class="action-btn edit" onclick="editTraining('${t.id}')">
                            ✏️ Editar
                        </button>
                        <button class="action-btn delete" onclick="confirmDeleteTraining('${t.id}')">
                            🗑️ Eliminar
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

// ========================================
// UPDATE STATS
// ========================================

function updateStats() {
    const stats = getTrainingStats();
    
    document.getElementById('statTotalTrainings').textContent = stats.totalTrainings;
    document.getElementById('statTotalShots').textContent = stats.totalShots.toLocaleString();
    document.getElementById('statTotalErrors').textContent = stats.totalErrors.toLocaleString();
    document.getElementById('statAccuracyRate').textContent = stats.accuracyRate + '%';
}

// ========================================
// RENDER CHARTS
// ========================================

function renderCharts() {
    const stats = getTrainingStats();
    const data = TrainingCloudSync.getData();
    const trainings = data.trainings || [];
    
    renderErrorsDistributionChart(stats);
    renderAccuracyEvolutionChart(trainings);
    renderModalityComparisonChart(stats);
}

// ========================================
// CHART 1: DISTRIBUCIÓN DE ERRORES
// ========================================

function renderErrorsDistributionChart(stats) {
    const ctx = document.getElementById('errorsDistributionChart');
    
    if (errorsDistributionChart) {
        errorsDistributionChart.destroy();
    }
    
    const errorTypes = stats.errorsByType;
    const total = errorTypes.banda + errorTypes.combinacion + errorTypes.posicionBlanca + errorTypes.noForzado;
    
    if (total === 0) {
        ctx.getContext('2d').clearRect(0, 0, ctx.width, ctx.height);
        return;
    }
    
    errorsDistributionChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Por Banda', 'Combinación', 'Posición Blanca', 'No Forzados'],
            datasets: [{
                data: [
                    errorTypes.banda,
                    errorTypes.combinacion,
                    errorTypes.posicionBlanca,
                    errorTypes.noForzado
                ],
                backgroundColor: [
                    'rgba(0, 255, 242, 0.8)',
                    'rgba(0, 217, 255, 0.8)',
                    'rgba(22, 35, 129, 0.8)',
                    'rgba(0, 200, 230, 0.8)'
                ],
                borderColor: [
                    'rgba(0, 255, 242, 1)',
                    'rgba(0, 217, 255, 1)',
                    'rgba(22, 35, 129, 1)',
                    'rgba(0, 200, 230, 1)'
                ],
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        padding: 15,
                        font: {
                            family: 'Syne',
                            size: 12,
                            weight: '600'
                        }
                    }
                },
                tooltip: {
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    padding: 12,
                    titleFont: {
                        size: 14,
                        weight: '600'
                    },
                    bodyFont: {
                        size: 13
                    },
                    callbacks: {
                        label: function(context) {
                            const value = context.parsed;
                            const percentage = ((value / total) * 100).toFixed(1);
                            return `${context.label}: ${value} (${percentage}%)`;
                        }
                    }
                }
            }
        }
    });
}

// ========================================
// CHART 2: EVOLUCIÓN DE PRECISIÓN
// ========================================

function renderAccuracyEvolutionChart(trainings) {
    const ctx = document.getElementById('accuracyEvolutionChart');
    
    if (accuracyEvolutionChart) {
        accuracyEvolutionChart.destroy();
    }
    
    if (trainings.length === 0) {
        ctx.getContext('2d').clearRect(0, 0, ctx.width, ctx.height);
        return;
    }
    
    // Últimos 10 entrenamientos (ordenados cronológicamente)
    const last10 = trainings.slice(0, 10).reverse();
    
    accuracyEvolutionChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: last10.map(t => formatDateShort(t.date)),
            datasets: [{
                label: 'Precisión (%)',
                data: last10.map(t => parseFloat(t.accuracy)),
                borderColor: 'rgba(0, 217, 255, 1)',
                backgroundColor: 'rgba(0, 217, 255, 0.1)',
                borderWidth: 3,
                pointRadius: 6,
                pointBackgroundColor: 'rgba(0, 217, 255, 1)',
                pointBorderColor: '#fff',
                pointBorderWidth: 2,
                pointHoverRadius: 8,
                tension: 0.4,
                fill: true
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
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    padding: 12,
                    callbacks: {
                        label: function(context) {
                            return `Precisión: ${context.parsed.y}%`;
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    max: 100,
                    grid: {
                        color: 'rgba(0, 0, 0, 0.05)'
                    },
                    ticks: {
                        callback: function(value) {
                            return value + '%';
                        },
                        font: {
                            family: 'Syne',
                            size: 11
                        }
                    }
                },
                x: {
                    grid: {
                        display: false
                    },
                    ticks: {
                        font: {
                            family: 'Syne',
                            size: 11
                        }
                    }
                }
            }
        }
    });
}

// ========================================
// CHART 3: COMPARACIÓN POR MODALIDAD
// ========================================

function renderModalityComparisonChart(stats) {
    const ctx = document.getElementById('modalityComparisonChart');
    
    if (modalityComparisonChart) {
        modalityComparisonChart.destroy();
    }
    
    const modalities = Object.keys(stats.byModality);
    
    if (modalities.length === 0) {
        ctx.getContext('2d').clearRect(0, 0, ctx.width, ctx.height);
        return;
    }
    
    modalityComparisonChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: modalities,
            datasets: [{
                label: 'Precisión (%)',
                data: modalities.map(m => parseFloat(stats.byModality[m].accuracy)),
                backgroundColor: 'rgba(0, 217, 255, 0.6)',
                borderColor: 'rgba(0, 217, 255, 1)',
                borderWidth: 2,
                borderRadius: 8
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
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    padding: 12,
                    callbacks: {
                        afterLabel: function(context) {
                            const modality = context.label;
                            const mod = stats.byModality[modality];
                            return [
                                `Entrenamientos: ${mod.trainings}`,
                                `Tiros: ${mod.shots}`,
                                `Errores: ${mod.errors}`
                            ];
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    max: 100,
                    grid: {
                        color: 'rgba(0, 0, 0, 0.05)'
                    },
                    ticks: {
                        callback: function(value) {
                            return value + '%';
                        },
                        font: {
                            family: 'Syne',
                            size: 11
                        }
                    }
                },
                x: {
                    grid: {
                        display: false
                    },
                    ticks: {
                        font: {
                            family: 'Syne',
                            size: 12,
                            weight: '600'
                        }
                    }
                }
            }
        }
    });
}

// ========================================
// FILTER TRAININGS
// ========================================

function filterTrainings() {
    const filterModality = document.getElementById('filterModality').value;
    const data = TrainingCloudSync.getData();
    let trainings = data.trainings || [];
    
    if (filterModality) {
        trainings = trainings.filter(t => t.modality === filterModality);
    }
    
    // Actualizar tabla con filtros
    const tbody = document.getElementById('historyTableBody');
    
    if (trainings.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="6" class="no-data">
                    No hay entrenamientos con ese filtro
                </td>
            </tr>
        `;
        return;
    }
    
    tbody.innerHTML = trainings.map(t => {
        const accuracy = parseFloat(t.accuracy);
        let accuracyClass = 'accuracy-poor';
        if (accuracy >= 90) accuracyClass = 'accuracy-excellent';
        else if (accuracy >= 80) accuracyClass = 'accuracy-good';
        else if (accuracy >= 70) accuracyClass = 'accuracy-average';
        
        return `
            <tr>
                <td>${formatDate(t.date)}</td>
                <td><strong>${t.modality}</strong></td>
                <td>${t.totalShots}</td>
                <td>${t.totalErrors}</td>
                <td>
                    <span class="accuracy-badge ${accuracyClass}">
                        ${accuracy}%
                    </span>
                </td>
                <td>
                    <div class="action-buttons">
                        <button class="action-btn edit" onclick="editTraining('${t.id}')">
                            ✏️ Editar
                        </button>
                        <button class="action-btn delete" onclick="confirmDeleteTraining('${t.id}')">
                            🗑️ Eliminar
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

// ========================================
// DELETE TRAINING
// ========================================

function confirmDeleteTraining(trainingId) {
    if (confirm('¿Estás seguro de que quieres eliminar este entrenamiento?')) {
        const success = deleteTraining(trainingId);
        
        if (success) {
            showNotification('✅ Entrenamiento eliminado', 'success');
            loadTrainings();
            updateStats();
            renderCharts();
        } else {
            showNotification('❌ Error al eliminar', 'error');
        }
    }
}

// ========================================
// SYNC DATA
// ========================================

async function syncTrainingData() {
    const newData = await TrainingCloudSync.pullFromGitHub();
    
    if (newData) {
        loadTrainings();
        updateStats();
        renderCharts();
    }
}

// ========================================
// UTILITIES
// ========================================

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    });
}

function formatDateShort(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
        day: '2-digit',
        month: 'short'
    });
}

function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        top: 80px;
        right: 20px;
        background: ${type === 'success' ? '#34c759' : type === 'error' ? '#ff3b30' : '#007aff'};
        color: white;
        padding: 16px 24px;
        border-radius: 12px;
        font-weight: 600;
        z-index: 1000;
        animation: slideIn 0.3s ease;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// ========================================
// ANIMATIONS
// ========================================

const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(400px);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(400px);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);

console.log('✅ Entrenamientos script cargado');
