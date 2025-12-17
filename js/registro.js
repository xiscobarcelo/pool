
        const STORAGE_KEY = 'xisco_matches_data';
        
        // 🎯 MATERIALES POR DEFECTO - Personaliza esta lista
        // Puedes cambiar estos valores por los materiales que uses:
        // Ejemplos: 'Taco Predator', 'Bolas Aramith', 'Taco McDermott', etc.
        let materials = [
            'Velasco+Revo12.9',
            'Lucasi+Revo12.9',
            'Bear+Centro'
        ];
        
        let selectedMaterial = null;
        let matchesData = loadData();
        let editingMatchId = null; // ID del partido que se está editando
        
        // Variables de paginación
        let currentPage = 1;
        const itemsPerPage = 100;

        // Configuración de GitHub (el usuario la configura)
        const GITHUB_CONFIG_KEY = 'xisco_github_config';

        // ⚙️ CONFIGURACIÓN HARDCODEADA DE GITHUB
        // Rellena estos datos con tus credenciales para no tener que configurar cada vez
        const HARDCODED_GITHUB_CONFIG = {
            username: 'xiscobarcelo',
            repo: 'pool',
            token: ''
        };

        // Si quieres usar configuración hardcodeada, rellena los 3 campos arriba
        // Si están vacíos, usará localStorage (configuración manual en config-github.html)

        function getGitHubConfig() {
            // Primero intentar usar config hardcodeada si existe
     
            // Si no, usar localStorage
            const config = localStorage.getItem(GITHUB_CONFIG_KEY);
            return config ? JSON.parse(config) : null;
        }

        function setGitHubConfig(username, repo, token) {
            const config = { username, repo, token };
            localStorage.setItem(GITHUB_CONFIG_KEY, JSON.stringify(config));
        }

        async function syncToGitHub() {
            let config = getGitHubConfig();

            // Si no hay configuración, pedirla
            if (!config) {
                const username = prompt('🔧 Configuración de GitHub\n\n1️⃣ Introduce tu USUARIO de GitHub:');
                if (!username) return;

                const repo = prompt('2️⃣ Introduce el NOMBRE del repositorio:\n(ejemplo: xisco-stats)');
                if (!repo) return;

                const token = prompt('3️⃣ Pega tu TOKEN de acceso personal:\n(empieza con ghp_...)');
                if (!token) return;

                setGitHubConfig(username, repo, token);
                config = { username, repo, token };
                
                alert('✅ Configuración guardada!\nAhora se subirán los datos...');
            }

            // Mostrar loading
            const btn = event.target;
            const originalText = btn.innerHTML;
            btn.innerHTML = '⏳ Subiendo...';
            btn.disabled = true;

            try {
                // Preparar datos
                const dataToUpload = JSON.stringify(matchesData, null, 2);
                const encodedContent = btoa(unescape(encodeURIComponent(dataToUpload)));

                // Obtener SHA del archivo actual (necesario para actualizar)
                const getUrl = `https://api.github.com/repos/${config.username}/${config.repo}/contents/app/data.json`;
                let sha = null;

                try {
                    const getResponse = await fetch(getUrl, {
                        headers: {
                            'Authorization': `token ${config.token}`,
                            'Accept': 'application/vnd.github.v3+json'
                        }
                    });

                    if (getResponse.ok) {
                        const fileData = await getResponse.json();
                        sha = fileData.sha;
                    }
                } catch (e) {
                    console.log('Archivo no existe, se creará uno nuevo');
                }

                // Subir archivo
                const putUrl = `https://api.github.com/repos/${config.username}/${config.repo}/contents/app/data.json`;
                const response = await fetch(putUrl, {
                    method: 'PUT',
                    headers: {
                        'Authorization': `token ${config.token}`,
                        'Accept': 'application/vnd.github.v3+json',
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        message: `Update data.json - ${new Date().toLocaleString('es-ES')}`,
                        content: encodedContent,
                        sha: sha,
                        branch: 'main'
                    })
                });

                if (response.ok) {
                    btn.innerHTML = '✅ ¡Subido!';
                    showSuccess('☁️ Datos sincronizados con GitHub!');
                    
                    setTimeout(() => {
                        btn.innerHTML = originalText;
                        btn.disabled = false;
                    }, 2000);
                } else {
                    const error = await response.json();
                    throw new Error(error.message || 'Error al subir');
                }

            } catch (error) {
                console.error('Error:', error);
                btn.innerHTML = originalText;
                btn.disabled = false;
                
                alert(`❌ Error al subir a GitHub:\n\n${error.message}\n\nVerifica:\n• Token correcto\n• Permisos del token (scope: repo)\n• Nombre de repositorio correcto`);
                
                // Opción de reconfigurar
                if (confirm('¿Quieres reconfigurar GitHub?')) {
                    localStorage.removeItem(GITHUB_CONFIG_KEY);
                    syncToGitHub();
                }
            }
        }

        function resetGitHubConfig() {
            if (confirm('¿Eliminar configuración de GitHub?')) {
                localStorage.removeItem(GITHUB_CONFIG_KEY);
                alert('✅ Configuración eliminada');
            }
        }

        // Inicializar
        document.addEventListener('DOMContentLoaded', () => {
            document.getElementById('matchDate').valueAsDate = new Date();
            renderMaterialChips();
            renderHistory();
            updateModalityStats();
            
            // Configurar input de Excel
            document.getElementById('excelFileInput').addEventListener('change', handleExcelImport);
        });

        // Cargar datos del localStorage
        function loadData() {
            const stored = localStorage.getItem(STORAGE_KEY);
            if (stored) {
                const data = JSON.parse(stored);
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
            }
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

        // Cargar datos desde GitHub automáticamente
        async function loadFromGitHub() {
            const config = getGitHubConfig();
            if (!config) {
                alert('⚠️ Primero configura GitHub en:\n🔧 Config GitHub');
                return;
            }

            // Mostrar loading si es llamada manual
            let isManualCall = false;
            let btn = null;
            if (event && event.target) {
                isManualCall = true;
                btn = event.target;
                const originalText = btn.innerHTML;
                btn.innerHTML = '⏳ Descargando...';
                btn.disabled = true;
            }

            try {
                const githubUrl = `https://raw.githubusercontent.com/${config.username}/${config.repo}/main/app/data.json`;
                
                console.log('🔄 Cargando desde GitHub:', githubUrl);
                
                const response = await fetch(githubUrl, {
                    cache: 'no-cache',
                    headers: {
                        'Accept': 'application/json'
                    }
                });

                if (response.ok) {
                    const githubData = await response.json();
                    
                    // Validar que tiene la estructura correcta
                    if (!githubData.matches || !Array.isArray(githubData.matches)) {
                        throw new Error('Datos inválidos en GitHub');
                    }
                    
                    // Actualizar datos
                    matchesData = githubData;
                    if (githubData.materials) materials = githubData.materials;
                    
                    saveData();
                    renderMaterialChips();
                    renderHistory();
                    updateModalityStats();
                    
                    const message = `☁️ Datos actualizados desde GitHub\n${githubData.matches.length} partidos sincronizados`;
                    showSuccess(message);
                    console.log('✅ Datos cargados desde GitHub:', githubData.matches.length, 'partidos');
                    
                    if (isManualCall && btn) {
                        btn.innerHTML = '✅ ¡Descargado!';
                        setTimeout(() => {
                            btn.innerHTML = '🔽 Descargar de Cloud';
                            btn.disabled = false;
                        }, 2000);
                    }
                } else {
                    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                }
            } catch (error) {
                console.error('Error cargando desde GitHub:', error);
                
                if (isManualCall) {
                    alert(`❌ Error al descargar de GitHub:\n\n${error.message}\n\nVerifica:\n• Configuración de GitHub\n• El archivo app/data.json existe\n• Conexión a internet`);
                    
                    if (btn) {
                        btn.innerHTML = '🔽 Descargar de Cloud';
                        btn.disabled = false;
                    }
                }
            }
        }

        // Guardar datos en localStorage
        function saveData() {
            matchesData.materials = materials;
            // Añadir timestamp para saber cuál es la versión más reciente
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

        // Calcular estadísticas automáticas desde los partidos
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

        // Actualizar estadísticas de modalidad
        function updateModalityStats() {
            const autoStats = calculateAutoStats();
            console.log('📊 Estadísticas calculadas:', autoStats);
            console.log('📊 Estadísticas guardadas:', matchesData.modalityStats);
            renderModalityStats(autoStats);
        }

        let editMode = false;

        function toggleModalityEdit() {
            editMode = !editMode;
            document.getElementById('editBtnText').textContent = editMode ? 'Guardar' : 'Editar';
            
            if (!editMode) {
                // Guardar cambios
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

        function saveModalityStats() {
            saveData();
            showSuccess('💾 Estadísticas guardadas correctamente');
        }

        // Guardar datos en localStorage
        function saveData() {
            matchesData.materials = materials;
            localStorage.setItem(STORAGE_KEY, JSON.stringify(matchesData));
        }

        // Renderizar chips de materiales
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

        // Seleccionar material
        function selectMaterial(material) {
            selectedMaterial = material;
            renderMaterialChips();
        }

        // Añadir nuevo material
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

        // Enviar formulario
        document.getElementById('matchForm').addEventListener('submit', (e) => {
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

            if (editingMatchId) {
                // MODO EDICIÓN
                updateMatch(editingMatchId, {
                    player2,
                    score1,
                    score2,
                    material1: selectedMaterial,
                    modality,
                    date: matchDate
                });
            } else {
                // MODO CREACIÓN
                const match = {
                    player1: 'Xisco',
                    player2: player2,
                    score1: score1,
                    score2: score2,
                    material1: selectedMaterial,
                    material2: '-',
                    modality: modality,
                    date: matchDate,
                    id: Date.now()
                };

                // Añadir jugador a la lista si es nuevo
                if (!matchesData.players.includes(player2)) {
                    matchesData.players.push(player2);
                }

                // Calcular estadísticas ANTES de añadir
                const statsBefore = calculateAutoStats();
                
                // Añadir partido
                matchesData.matches.push(match);
                
                // Calcular estadísticas DESPUÉS de añadir
                const statsAfter = calculateAutoStats();
                
                // Actualizar modalityStats sumando solo lo nuevo
                ['bola8', 'bola9', 'bola10'].forEach(mod => {
                    const diff = {
                        matchesPlayed: statsAfter[mod].matchesPlayed - statsBefore[mod].matchesPlayed,
                        matchesWon: statsAfter[mod].matchesWon - statsBefore[mod].matchesWon,
                        gamesPlayed: statsAfter[mod].gamesPlayed - statsBefore[mod].gamesPlayed,
                        gamesWon: statsAfter[mod].gamesWon - statsBefore[mod].gamesWon
                    };
                    
                    matchesData.modalityStats[mod].matchesPlayed += diff.matchesPlayed;
                    matchesData.modalityStats[mod].matchesWon += diff.matchesWon;
                    matchesData.modalityStats[mod].gamesPlayed += diff.gamesPlayed;
                    matchesData.modalityStats[mod].gamesWon += diff.gamesWon;
                });
                
                saveData();
                showSuccess('✅ Partido guardado correctamente');
            }

            // Limpiar formulario
            resetForm();

            // Actualizar historial y estadísticas
            renderHistory();
            updateModalityStats();
        });

        // Resetear formulario
        function resetForm() {
            document.getElementById('matchForm').reset();
            document.getElementById('matchDate').valueAsDate = new Date();
            selectedMaterial = null;
            editingMatchId = null;
            renderMaterialChips();
            
            // Cambiar texto del botón y título
            document.getElementById('formTitle').textContent = 'Registrar Nuevo Partido';
            const submitBtn = document.querySelector('.btn-primary');
            submitBtn.textContent = '💾 Guardar Partido';
        }

        // Editar partido
        function editMatch(id) {
            const match = matchesData.matches.find(m => m.id === id);
            if (!match) return;

            // Llenar formulario con datos del partido
            document.getElementById('player2').value = match.player2;
            document.getElementById('score1').value = match.score1;
            document.getElementById('score2').value = match.score2;
            document.getElementById('modality').value = match.modality;
            document.getElementById('matchDate').value = match.date;
            
            // Seleccionar material
            selectedMaterial = match.material1;
            renderMaterialChips();
            
            // Marcar como editando
            editingMatchId = id;
            
            // Cambiar texto del botón y título
            document.getElementById('formTitle').textContent = 'Editar Partido';
            const submitBtn = document.querySelector('.btn-primary');
            submitBtn.textContent = '✅ Actualizar Partido';
            
            // Scroll al formulario
            window.scrollTo({ top: 0, behavior: 'smooth' });
            
            showSuccess('✏️ Modo edición activado');
        }

        // Actualizar partido existente
        function updateMatch(id, newData) {
            const matchIndex = matchesData.matches.findIndex(m => m.id === id);
            if (matchIndex === -1) return;

            const oldMatch = matchesData.matches[matchIndex];
            
            // Calcular estadísticas ANTES de modificar
            const statsBefore = calculateAutoStats();
            
            // Actualizar el partido
            matchesData.matches[matchIndex] = {
                ...oldMatch,
                player2: newData.player2,
                score1: newData.score1,
                score2: newData.score2,
                material1: newData.material1,
                modality: newData.modality,
                date: newData.date
            };
            
            // Añadir jugador si es nuevo
            if (!matchesData.players.includes(newData.player2)) {
                matchesData.players.push(newData.player2);
            }
            
            // Calcular estadísticas DESPUÉS de modificar
            const statsAfter = calculateAutoStats();
            
            // Actualizar modalityStats con la diferencia
            ['bola8', 'bola9', 'bola10'].forEach(mod => {
                const diff = {
                    matchesPlayed: statsAfter[mod].matchesPlayed - statsBefore[mod].matchesPlayed,
                    matchesWon: statsAfter[mod].matchesWon - statsBefore[mod].matchesWon,
                    gamesPlayed: statsAfter[mod].gamesPlayed - statsBefore[mod].gamesPlayed,
                    gamesWon: statsAfter[mod].gamesWon - statsBefore[mod].gamesWon
                };
                
                matchesData.modalityStats[mod].matchesPlayed += diff.matchesPlayed;
                matchesData.modalityStats[mod].matchesWon += diff.matchesWon;
                matchesData.modalityStats[mod].gamesPlayed += diff.gamesPlayed;
                matchesData.modalityStats[mod].gamesWon += diff.gamesWon;
            });
            
            saveData();
            showSuccess('✅ Partido actualizado correctamente');
        }

        // Mostrar mensaje de éxito
        function showSuccess(message) {
            const msgDiv = document.getElementById('successMessage');
            msgDiv.className = 'success-message';
            msgDiv.textContent = message;
            msgDiv.style.display = 'block';
            
            setTimeout(() => {
                msgDiv.style.display = 'none';
            }, 3000);
        }

        // Renderizar historial
        function renderHistory() {
            const container = document.getElementById('matchHistory');
            const matches = [...matchesData.matches].reverse(); // Más recientes primero

            if (matches.length === 0) {
                container.innerHTML = '<div class="empty-state">No hay partidos registrados aún</div>';
                document.getElementById('paginationTop').style.display = 'none';
                document.getElementById('paginationBottom').style.display = 'none';
                return;
            }

            // Calcular paginación
            const totalPages = Math.ceil(matches.length / itemsPerPage);
            const startIndex = (currentPage - 1) * itemsPerPage;
            const endIndex = startIndex + itemsPerPage;
            const currentMatches = matches.slice(startIndex, endIndex);

            // Renderizar partidos de la página actual
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
                            <span style="color: ${isXiscoWinner ? '#619af8' : '#86868b'}">${match.player1}</span>
                            vs
                            <span style="color: ${!isXiscoWinner ? '#619af8' : '#86868b'}">${match.player2}</span>
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

            // Mostrar controles de paginación si hay más de 100 partidos
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
                // Mostrar todas las páginas
                for (let i = 1; i <= totalPages; i++) {
                    pages.push(`<div class="page-number ${i === currentPage ? 'active' : ''}" onclick="goToPage(${i})">${i}</div>`);
                }
            } else {
                // Mostrar páginas con elipsis
                if (currentPage <= 3) {
                    // Inicio
                    for (let i = 1; i <= 4; i++) {
                        pages.push(`<div class="page-number ${i === currentPage ? 'active' : ''}" onclick="goToPage(${i})">${i}</div>`);
                    }
                    pages.push(`<div class="page-number ellipsis">...</div>`);
                    pages.push(`<div class="page-number" onclick="goToPage(${totalPages})">${totalPages}</div>`);
                } else if (currentPage >= totalPages - 2) {
                    // Final
                    pages.push(`<div class="page-number" onclick="goToPage(1)">1</div>`);
                    pages.push(`<div class="page-number ellipsis">...</div>`);
                    for (let i = totalPages - 3; i <= totalPages; i++) {
                        pages.push(`<div class="page-number ${i === currentPage ? 'active' : ''}" onclick="goToPage(${i})">${i}</div>`);
                    }
                } else {
                    // Medio
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
            
            // Scroll suave al inicio del historial
            document.getElementById('matchHistory').scrollIntoView({ behavior: 'smooth', block: 'start' });
        }

        // Formatear fecha
        function formatDate(dateStr) {
            const date = new Date(dateStr + 'T00:00:00');
            return date.toLocaleDateString('es-ES', { 
                day: '2-digit', 
                month: 'short', 
                year: 'numeric' 
            });
        }

        // Eliminar partido
        function deleteMatch(id) {
            if (confirm('¿Estás seguro de eliminar este partido?')) {
                // Calcular estadísticas ANTES de eliminar
                const statsBefore = calculateAutoStats();
                
                // Eliminar el partido
                matchesData.matches = matchesData.matches.filter(m => m.id !== id);
                
                // Calcular estadísticas DESPUÉS de eliminar
                const statsAfter = calculateAutoStats();
                
                // Actualizar modalityStats restando solo lo que se eliminó
                ['bola8', 'bola9', 'bola10'].forEach(mod => {
                    const diff = {
                        matchesPlayed: statsBefore[mod].matchesPlayed - statsAfter[mod].matchesPlayed,
                        matchesWon: statsBefore[mod].matchesWon - statsAfter[mod].matchesWon,
                        gamesPlayed: statsBefore[mod].gamesPlayed - statsAfter[mod].gamesPlayed,
                        gamesWon: statsBefore[mod].gamesWon - statsAfter[mod].gamesWon
                    };
                    
                    // Restar la diferencia (mantiene datos manuales adicionales)
                    matchesData.modalityStats[mod].matchesPlayed = Math.max(0, matchesData.modalityStats[mod].matchesPlayed - diff.matchesPlayed);
                    matchesData.modalityStats[mod].matchesWon = Math.max(0, matchesData.modalityStats[mod].matchesWon - diff.matchesWon);
                    matchesData.modalityStats[mod].gamesPlayed = Math.max(0, matchesData.modalityStats[mod].gamesPlayed - diff.gamesPlayed);
                    matchesData.modalityStats[mod].gamesWon = Math.max(0, matchesData.modalityStats[mod].gamesWon - diff.gamesWon);
                });
                
                saveData();
                renderHistory();
                updateModalityStats();
                showSuccess('🗑️ Partido eliminado');
            }
        }

        // Descargar data.json
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
            
            showSuccess('📥 Archivo descargado. Súbelo a tu servidor para sincronizar.');
        }

        // Sincronizar con el dashboard
        function syncWithDashboard() {
            // Guardar en localStorage con una key compartida
            localStorage.setItem('shared_matches_data', JSON.stringify(matchesData));
            
            // También actualizar la key local
            saveData();
            
            showSuccess('🔄 Datos sincronizados. Abre el dashboard para verlos.');
            
            // Opción de abrir directamente el dashboard
            setTimeout(() => {
                if (confirm('¿Quieres abrir el dashboard ahora?')) {
                    window.open('estadisticas.html', '_blank');
                }
            }, 500);
        }

        // Cargar datos compartidos al iniciar
        function checkSharedData() {
            const sharedData = localStorage.getItem('shared_matches_data');
            if (sharedData) {
                const shared = JSON.parse(sharedData);
                // Combinar datos si existen ambos
                if (matchesData.matches.length === 0 && shared.matches.length > 0) {
                    matchesData = shared;
                    saveData();
                    renderHistory();
                }
            }
        }

        // Verificar datos compartidos al cargar
        checkSharedData();

        // IMPORTACIÓN DESDE EXCEL
        function handleExcelImport(event) {
            const file = event.target.files[0];
            if (!file) return;

            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const data = new Uint8Array(e.target.result);
                    const workbook = XLSX.read(data, { type: 'array' });
                    
                    // Leer la primera hoja
                    const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
                    const jsonData = XLSX.utils.sheet_to_json(firstSheet);
                    
                    if (jsonData.length === 0) {
                        alert('❌ El archivo está vacío');
                        return;
                    }

                    // Procesar y mostrar preview
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
                    // Detectar columnas flexiblemente
                    const rival = row['Rival'] || row['Jugador 2'] || row['jugador2'] || row['Player2'];
                    const score1 = row['Partidas Xisco'] || row['Score1'] || row['score1'] || row['Xisco'];
                    const score2 = row['Partidas Rival'] || row['Score2'] || row['score2'] || row['Rival Score'];
                    const material = row['Material'] || row['material'] || 'Material por defecto';
                    const modality = row['Modalidad'] || row['modality'] || row['Modo'];
                    const dateStr = row['Fecha'] || row['Date'] || row['fecha'];

                    // Validar datos esenciales
                    if (!rival || score1 === undefined || score2 === undefined) {
                        console.warn(`Fila ${index + 1}: Datos incompletos, omitida`);
                        return;
                    }

                    // Normalizar modalidad
                    let normalizedModality = 'Bola 8';
                    if (modality) {
                        const mod = modality.toString().toLowerCase();
                        if (mod.includes('9')) normalizedModality = 'Bola 9';
                        else if (mod.includes('10')) normalizedModality = 'Bola 10';
                    }

                    // Parsear fecha
                    let matchDate = new Date().toISOString().split('T')[0];
                    if (dateStr !== undefined && dateStr !== null && dateStr !== '') {
                        try {
                            let dateObj;
                            
                            // Si es un número (fecha serial de Excel)
                            if (typeof dateStr === 'number') {
                                // Excel fecha serial: días desde 1900-01-01
                                // Ajustar por el bug de Excel (año 1900 bisiesto incorrecto)
                                const excelEpoch = new Date(1899, 11, 30);
                                dateObj = new Date(excelEpoch.getTime() + dateStr * 86400000);
                            } 
                            // Si es un string con formato DD/MM/YYYY
                            else if (typeof dateStr === 'string' && dateStr.includes('/')) {
                                const parts = dateStr.split('/');
                                if (parts.length === 3) {
                                    // Intentar DD/MM/YYYY
                                    const day = parseInt(parts[0]);
                                    const month = parseInt(parts[1]) - 1; // Mes en JS es 0-indexed
                                    const year = parseInt(parts[2]);
                                    dateObj = new Date(year, month, day);
                                }
                            }
                            // Si es un string con formato YYYY-MM-DD o formato Date ISO
                            else if (typeof dateStr === 'string') {
                                dateObj = new Date(dateStr);
                            }
                            // Si es ya un objeto Date
                            else if (dateStr instanceof Date) {
                                dateObj = dateStr;
                            }
                            
                            // Validar que la fecha sea válida
                            if (dateObj && !isNaN(dateObj.getTime())) {
                                // Asegurar que la fecha esté en formato YYYY-MM-DD
                                const year = dateObj.getFullYear();
                                const month = String(dateObj.getMonth() + 1).padStart(2, '0');
                                const day = String(dateObj.getDate()).padStart(2, '0');
                                matchDate = `${year}-${month}-${day}`;
                                
                                console.log(`Fecha procesada: ${dateStr} → ${matchDate}`);
                            } else {
                                console.warn(`Fila ${index + 1}: Fecha inválida "${dateStr}", usando fecha actual`);
                            }
                        } catch (e) {
                            console.warn(`Fila ${index + 1}: Error al parsear fecha "${dateStr}": ${e.message}`);
                        }
                    }

                    processed.push({
                        player1: 'Xisco',
                        player2: rival.toString().trim(),
                        score1: score1.toString(),
                        score2: score2.toString(),
                        material1: material.toString().trim(),
                        material2: '-',
                        modality: normalizedModality,
                        date: matchDate,
                        id: Date.now() + index
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
                <div style="background: rgba(52, 199, 89, 0.1); border: 1px solid rgba(52, 199, 89, 0.3); border-radius: 12px; padding: 20px;">
                    <h3 style="color: #34c759; margin-bottom: 16px;">✅ Archivo procesado correctamente</h3>
                    <p style="color: #86868b; margin-bottom: 20px;">
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
            
            // Guardar temporalmente los partidos para importar
            window.pendingImport = matches;
        }

        function confirmImport() {
            if (!window.pendingImport || window.pendingImport.length === 0) {
                alert('⚠️ No hay partidos para importar');
                return;
            }

            // Calcular estadísticas ANTES de importar
            const statsBefore = calculateAutoStats();
            
            // Añadir todos los partidos
            window.pendingImport.forEach(match => {
                // Añadir jugador si es nuevo
                if (!matchesData.players.includes(match.player2)) {
                    matchesData.players.push(match.player2);
                }
                
                // Añadir material si es nuevo
                if (!materials.includes(match.material1)) {
                    materials.push(match.material1);
                }
                
                matchesData.matches.push(match);
            });
            
            // Calcular estadísticas DESPUÉS de importar
            const statsAfter = calculateAutoStats();
            
            // Actualizar modalityStats con la diferencia
            ['bola8', 'bola9', 'bola10'].forEach(mod => {
                const diff = {
                    matchesPlayed: statsAfter[mod].matchesPlayed - statsBefore[mod].matchesPlayed,
                    matchesWon: statsAfter[mod].matchesWon - statsBefore[mod].matchesWon,
                    gamesPlayed: statsAfter[mod].gamesPlayed - statsBefore[mod].gamesPlayed,
                    gamesWon: statsAfter[mod].gamesWon - statsBefore[mod].gamesWon
                };
                
                matchesData.modalityStats[mod].matchesPlayed += diff.matchesPlayed;
                matchesData.modalityStats[mod].matchesWon += diff.matchesWon;
                matchesData.modalityStats[mod].gamesPlayed += diff.gamesPlayed;
                matchesData.modalityStats[mod].gamesWon += diff.gamesWon;
            });
            
            saveData();
            renderMaterialChips();
            renderHistory();
            updateModalityStats();
            
            showSuccess(`✅ ${window.pendingImport.length} partidos importados correctamente`);
            
            // Limpiar
            window.pendingImport = null;
            document.getElementById('importPreview').style.display = 'none';
            document.getElementById('excelFileInput').value = '';
        }

        function cancelImport() {
            window.pendingImport = null;
            document.getElementById('importPreview').style.display = 'none';
            document.getElementById('excelFileInput').value = '';
        }

        // REINICIAR TODOS LOS DATOS
        function resetAllData() {
            const confirmMessage = `⚠️ ADVERTENCIA IMPORTANTE ⚠️

¿Estás seguro de que quieres BORRAR TODOS LOS DATOS?

Esto eliminará:
• Todos los partidos registrados
• Todas las estadísticas de modalidad
• Todo el historial

Esta acción NO se puede deshacer.

Escribe "BORRAR" para confirmar:`;

            const userInput = prompt(confirmMessage);
            
            if (userInput === 'BORRAR') {
                // Limpiar localStorage
                localStorage.removeItem(STORAGE_KEY);
                localStorage.removeItem('shared_matches_data');
                
                // Reiniciar datos en memoria
                matchesData = {
                    matches: [],
                    players: ['Xisco'],
                    materials: ['Velasco+Revo12.9', 'Lucasi+Revo12.9', 'Bear+Centro'],
                    modalityStats: {
                        bola8: { matchesPlayed: 0, matchesWon: 0, gamesPlayed: 0, gamesWon: 0 },
                        bola9: { matchesPlayed: 0, matchesWon: 0, gamesPlayed: 0, gamesWon: 0 },
                        bola10: { matchesPlayed: 0, matchesWon: 0, gamesPlayed: 0, gamesWon: 0 }
                    }
                };
                
                materials = ['Velasco+Revo12.9', 'Lucasi+Revo12.9', 'Bear+Centro'];
                
                saveData();
                
                // Actualizar UI
                renderMaterialChips();
                renderHistory();
                updateModalityStats();
                
                showSuccess('🗑️ Todos los datos han sido eliminados');
                
                // Recargar página después de 2 segundos
                setTimeout(() => {
                    location.reload();
                }, 2000);
            } else if (userInput !== null) {
                alert('❌ Reinicio cancelado. Debes escribir exactamente "BORRAR" para confirmar.');
            }
        }

        function logout() {
            if (confirm('¿Cerrar sesión?')) {
                sessionStorage.removeItem('xisco_session_active');
                window.location.href = 'index.html';
            }
        }

        // Permitar Enter en el campo de nuevo material
        document.getElementById('newMaterial').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                addMaterial();
            }
        });

        // Cargar desde GitHub después de que la página esté lista (en segundo plano)
        window.addEventListener('load', () => {
            const config = localStorage.getItem(GITHUB_CONFIG_KEY);
            if (config) {
                // Esperar un momento para que la página cargue completamente
                setTimeout(() => {
                    loadFromGitHub();
                }, 1000);
            }
        });
