
    
        const GITHUB_CONFIG_KEY = 'xisco_github_config';

        // ⚙️ CONFIGURACIÓN HARDCODEADA DE GITHUB
        // Rellena estos datos con tus credenciales para no tener que configurar cada vez
        const HARDCODED_GITHUB_CONFIG = {
            username: 'xiscobarcelo',
            repo: 'xisco-pool',
            token: ''
        };
        
        // Función para obtener la URL del data.json
        function getDataURL() {
            // Primero intentar usar config hardcodeada
            if (HARDCODED_GITHUB_CONFIG.username && 
                HARDCODED_GITHUB_CONFIG.repo) {
                return `https://raw.githubusercontent.com/${HARDCODED_GITHUB_CONFIG.username}/${HARDCODED_GITHUB_CONFIG.repo}/main/appx/data.json`;
            }
            
            // Si no, intentar localStorage
            const config = localStorage.getItem(GITHUB_CONFIG_KEY);
            if (config) {
                const data = JSON.parse(config);
                return `https://raw.githubusercontent.com/${data.username}/${data.repo}/main/appx/data.json`;
            }
            
            // Fallback a la URL por defecto si no hay configuración
            return 'https://www.xiscobarcelo.com/pool/data.json';
        }

        const API_URL = getDataURL();
        let currentData = null;
        
        // Variables de paginación
        let currentPageStats = 1;
        const itemsPerPageStats = 100;

        window.addEventListener('DOMContentLoaded', loadData);

        // Configurar el input de archivo
        document.addEventListener('DOMContentLoaded', () => {
            const fileInput = document.getElementById('jsonFileInput');
            if (fileInput) {
                fileInput.addEventListener('change', handleFileUpload);
            }
        });

        async function loadData() {
            const config = localStorage.getItem('xisco_github_config');
            
            // Primero intentar cargar desde GitHub si está configurado
            if (config) {
                try {
                    const data = JSON.parse(config);
                    const githubUrl = `https://raw.githubusercontent.com/${data.username}/${data.repo}/main/appx/data.json`;
                    
                    console.log('🔄 Cargando desde GitHub:', githubUrl);
                    
                    const response = await fetch(githubUrl, {
                        cache: 'no-cache', // Siempre obtener la versión más reciente
                        headers: {
                            'Accept': 'application/json'
                        }
                    });
                    
                    if (response.ok) {
                        const githubData = await response.json();
                        currentData = githubData;
                        
                        // Guardar en localStorage como backup
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
            
            // Si GitHub falla, intentar localStorage compartido
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

            // Fallback: intentar cargar desde servidor original
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
            banner.style.cssText = 'background: linear-gradient(135deg, #00d9ff, #00fff2); color: dark; padding: 16px; text-align: center; border-radius: 12px; margin: 0 auto 20px; max-width: 1400px; font-weight: 600; box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);';
            banner.innerHTML = '☁️ Datos sincronizados desde GitHub (Cloud)';
            
            const container = document.querySelector('.container');
            const header = container.querySelector('header');
            header.insertAdjacentElement('afterend', banner);
            
            setTimeout(() => {
                banner.style.opacity = '0';
                banner.style.transition = 'opacity 0.5s';
                setTimeout(() => banner.remove(), 500);
            }, 5000);
        }

        function showSharedDataBanner() {
            const banner = document.createElement('div');
            banner.style.cssText = 'background: linear-gradient(135deg, #00d9ff, #00fff2); color: dark; padding: 16px; text-align: center; border-radius: 12px; margin: 0 auto 20px; max-width: 1400px; font-weight: 600; box-shadow: 0 4px 12px rgba(52, 199, 89, 0.3);';
            banner.innerHTML = '✅ Datos sincronizados desde el registro de partidos';
            
            const container = document.querySelector('.container');
            const header = container.querySelector('header');
            header.insertAdjacentElement('afterend', banner);
            
            setTimeout(() => {
                banner.style.opacity = '0';
                banner.style.transition = 'opacity 0.5s';
                setTimeout(() => banner.remove(), 500);
            }, 5000);
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
                    },
                    {
                        "player1": "Xisco",
                        "player2": "Pedro",
                        "score1": "4",
                        "score2": "1",
                        "material1": "Raqueta A",
                        "material2": "Raqueta C",
                        "modality": "Bola 9",
                        "date": "2025-12-11",
                        "id": 2
                    },
                    {
                        "player1": "Xisco",
                        "player2": "Juan",
                        "score1": "2",
                        "score2": "3",
                        "material1": "Pelota Pro",
                        "material2": "Raqueta B",
                        "modality": "Bola 10",
                        "date": "2025-12-12",
                        "id": 3
                    },
                    {
                        "player1": "Juan",
                        "player2": "Xisco",
                        "score1": "1",
                        "score2": "4",
                        "material1": "Raqueta B",
                        "material2": "Pelota Pro",
                        "modality": "Bola 8",
                        "date": "2025-12-13",
                        "id": 4
                    },
                    {
                        "player1": "Pedro",
                        "player2": "Xisco",
                        "score1": "2",
                        "score2": "5",
                        "material1": "Raqueta C",
                        "material2": "Raqueta A",
                        "modality": "Bola 9",
                        "date": "2025-12-14",
                        "id": 5
                    }
                ],
                "players": ["Xisco", "Juan", "Pedro"],
                "materials": ["Raqueta A", "Raqueta B", "Raqueta C", "Pelota Pro", "Pelota Standard"],
                "modalityStats": {
                    "bola8": {
                        "matchesPlayed": 10,
                        "matchesWon": 7,
                        "gamesPlayed": 42,
                        "gamesWon": 28
                    },
                    "bola9": {
                        "matchesPlayed": 8,
                        "matchesWon": 5,
                        "gamesPlayed": 35,
                        "gamesWon": 22
                    },
                    "bola10": {
                        "matchesPlayed": 6,
                        "matchesWon": 4,
                        "gamesPlayed": 28,
                        "gamesWon": 18
                    }
                }
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

Esto eliminará:
• Todos los partidos registrados
• Todas las estadísticas de modalidad
• Todo el historial
• Datos en ambas páginas (registro y estadísticas)

Esta acción NO se puede deshacer.

Escribe "BORRAR" para confirmar:`;

            const userInput = prompt(confirmMessage);
            
            if (userInput === 'BORRAR') {
                // Limpiar todos los localStorage
                localStorage.removeItem('xisco_matches_data');
                localStorage.removeItem('shared_matches_data');
                localStorage.clear();
                
                alert('✅ Todos los datos han sido eliminados');
                
                // Recargar página
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



        function displayModalityStats(totals, modalities) {
            const statsSection = document.getElementById('modalityStats');
            const statsGrid = document.getElementById('modalityStatsGrid');
            const chartsGrid = document.getElementById('modalityChartsGrid');

            statsSection.style.display = 'block';
            statsGrid.innerHTML = '';
            chartsGrid.innerHTML = '';

            // Añadir indicador de sincronización
            const syncBadge = document.createElement('div');
            syncBadge.style.cssText = 'text-align: center; margin-bottom: 20px; padding: 12px; background: linear-gradient(62deg,rgba(0, 255, 242, 0.49) 0%, rgba(0, 217, 255, 0.27) 100%); border-radius: 8px;';
            syncBadge.innerHTML = '<p style="color: #34c759; font-weight: 600; font-size: 0.9rem;">✅ Estadísticas Totales (Partidos Registrados + Datos Manuales)</p>';
            
            statsGrid.parentElement.insertBefore(syncBadge, statsGrid);

            // Tarjetas de estadísticas totales
            const stats = [
                { label: 'Total Partidos', value: totals.matchesPlayed },
                { label: 'Partidos Ganados', value: totals.matchesWon },
                { label: 'Win Rate Partidos', value: totals.matchWinRate.toFixed(1) + '%' },
                { label: 'Total Partidas', value: totals.gamesPlayed },
                { label: 'Partidas Ganadas', value: totals.gamesWon },
                { label: 'Win Rate Partidas', value: totals.gameWinRate.toFixed(1) + '%' }
            ];

            stats.forEach(stat => {
                const card = document.createElement('div');
                card.className = 'modality-stat-card';
                card.innerHTML = `
                    <div class="modality-stat-label">${stat.label}</div>
                    <div class="modality-stat-value">${stat.value}</div>
                `;
                statsGrid.appendChild(card);
            });

            // Gráfico de comparación de modalidades - Partidos
            createModalityComparisonChart(modalities, chartsGrid);

            // Gráfico de win rates
            createWinRateChart(modalities, chartsGrid);

            // Gráfico de distribución
            createModalityDistributionChart(modalities, chartsGrid);
        }

        function createModalityComparisonChart(modalities, container) {
            const chartDiv = document.createElement('div');
            chartDiv.className = 'chart-card1';
            chartDiv.innerHTML = '<h3 class="chart-title">Partidos por Modalidad</h3><canvas></canvas>';
            container.appendChild(chartDiv);

            new Chart(chartDiv.querySelector('canvas'), {
                type: 'bar',
                data: {
                    labels: ['Bola 8', 'Bola 9', 'Bola 10'],
                    datasets: [{
                        label: 'Jugados',
                        data: [modalities.bola8.played, modalities.bola9.played, modalities.bola10.played],
                        backgroundColor: 'rgba(59, 130, 246, 0.8)',
                        borderRadius: 8
                    }, {
                        label: 'Ganados',
                        data: [modalities.bola8.won, modalities.bola9.won, modalities.bola10.won],
                        backgroundColor: 'rgba(52, 199, 89, 0.8)',
                        borderRadius: 8
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: true,
                    plugins: {
                        legend: {
                            display: true,
                            position: 'top',
                            labels: {
                                color: '#1d1d1f',
                                font: { size: 12, weight: '500' },
                                padding: 16,
                                usePointStyle: true
                            }
                        }
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            grid: { color: 'rgba(0, 0, 0, 0.05)', drawBorder: false },
                            ticks: { color: '#86868b', font: { size: 12, weight: '500' } }
                        },
                        x: {
                            grid: { display: false },
                            ticks: { color: '#1d1d1f', font: { size: 12, weight: '500' } }
                        }
                    }
                }
            });
        }






        function displayDashboard(data) {
            document.getElementById('loading').style.display = 'none';
            document.getElementById('content').style.display = 'block';

            const matches = data.matches || [];
            const players = data.players || [];
            const materials = data.materials || [];
            
// Sincronizar estadísticas: combinar partidos registrados con modalityStats
            const combinedStats = combineMatchesWithModalityStats(matches, data.modalityStats);

            generateHeroStats(matches, players, materials, combinedStats);
            generateCharts(matches, players, materials);
            setupPlayerComparison(matches, players);
            setupModalityCalculator();



            



            
        }

        function combineMatchesWithModalityStats(matches, modalityStats) {
       // Calcular estadísticas de los partidos registrados
            const matchStats = calculateStatsFromMatches(matches);
            
            // Si no hay modalityStats, retornar solo las de partidos
            if (!modalityStats) {
                return matchStats;
            }

            
            // Combinar ambas fuentes de datos
            const combined = {
                bola8: {
                    matchesPlayed: (matchStats.bola8?.matchesPlayed || 0) + (modalityStats.bola8?.matchesPlayed || 0),
                    matchesWon: (matchStats.bola8?.matchesWon || 0) + (modalityStats.bola8?.matchesWon || 0),
                    gamesPlayed: (matchStats.bola8?.gamesPlayed || 0) + (modalityStats.bola8?.gamesPlayed || 0),
                    gamesWon: (matchStats.bola8?.gamesWon || 0) + (modalityStats.bola8?.gamesWon || 0)
                },
                bola9: {
                    matchesPlayed: (matchStats.bola9?.matchesPlayed || 0) + (modalityStats.bola9?.matchesPlayed || 0),
                    matchesWon: (matchStats.bola9?.matchesWon || 0) + (modalityStats.bola9?.matchesWon || 0),
                    gamesPlayed: (matchStats.bola9?.gamesPlayed || 0) + (modalityStats.bola9?.gamesPlayed || 0),
                    gamesWon: (matchStats.bola9?.gamesWon || 0) + (modalityStats.bola9?.gamesWon || 0)
                },
                bola10: {
                    matchesPlayed: (matchStats.bola10?.matchesPlayed || 0) + (modalityStats.bola10?.matchesPlayed || 0),
                    matchesWon: (matchStats.bola10?.matchesWon || 0) + (modalityStats.bola10?.matchesWon || 0),
                    gamesPlayed: (matchStats.bola10?.gamesPlayed || 0) + (modalityStats.bola10?.gamesPlayed || 0),
                    gamesWon: (matchStats.bola10?.gamesWon || 0) + (modalityStats.bola10?.gamesWon || 0)
                }
            };

            return combined;
        }

        function calculateStatsFromMatches(matches) {
            const stats = {
                bola8: { matchesPlayed: 0, matchesWon: 0, gamesPlayed: 0, gamesWon: 0 },
                bola9: { matchesPlayed: 0, matchesWon: 0, gamesPlayed: 0, gamesWon: 0 },
                bola10: { matchesPlayed: 0, matchesWon: 0, gamesPlayed: 0, gamesWon: 0 }
            };

            matches.forEach(match => {
                const modality = match.modality?.toLowerCase().replace(/\s+/g, '') || '';
                const isXiscoPlayer1 = match.player1?.toLowerCase() === 'xisco';
                const isXiscoPlayer2 = match.player2?.toLowerCase() === 'xisco';
                
                // Solo contar partidos donde Xisco participa
                if (!isXiscoPlayer1 && !isXiscoPlayer2) return;

                const xiscoScore = isXiscoPlayer1 ? parseInt(match.score1) : parseInt(match.score2);
                const opponentScore = isXiscoPlayer1 ? parseInt(match.score2) : parseInt(match.score1);
                const xiscoWon = xiscoScore > opponentScore;

                // Determinar la modalidad
                let modalityKey = null;
                if (modality.includes('8') || modality.includes('bola8')) modalityKey = 'bola8';
                else if (modality.includes('9') || modality.includes('bola9')) modalityKey = 'bola9';
                else if (modality.includes('10') || modality.includes('bola10')) modalityKey = 'bola10';

                if (modalityKey && stats[modalityKey]) {
                    stats[modalityKey].matchesPlayed += 1;
                    if (xiscoWon) stats[modalityKey].matchesWon += 1;
                    stats[modalityKey].gamesPlayed += xiscoScore + opponentScore;
                    stats[modalityKey].gamesWon += xiscoScore;
                }
            });

            return stats;
        }

        function loadModalityData(modalityStats, matches) {
            // Calcular datos de partidos registrados (solo para mostrar info)
            const matchStats = calculateStatsFromMatches(matches || []);

            // Mostrar indicadores de sincronización
            const syncInfo = document.createElement('div');
            syncInfo.style.cssText = 'background: linear-gradient(62deg,rgba(0, 255, 242, 0.49) 0%, rgba(0, 217, 255, 0.27) 100%); border: 1px solid rgba(52, 199, 89, 0.3); border-radius: 12px; padding: 16px; margin-bottom: 24px; text-align: center;';
            syncInfo.innerHTML = `
                <p style="color: #0a0a2e; font-weight: 600; margin-bottom: 8px;">✅ Datos Sincronizados</p>
                <p style="color: #0a0a2e; font-size: 0.9rem;">
                    Los valores mostrados en los formularios ya incluyen los partidos registrados automáticamente
                </p>
            `;

            const modalitySection = document.querySelector('.modality-inputs-grid').parentElement;
            if (!modalitySection.querySelector('[style*="background: rgba(52, 199, 89"]')) {
                modalitySection.insertBefore(syncInfo, modalitySection.querySelector('.modality-inputs-grid'));
            }

            // Los valores en modalityStats YA son el total combinado (automático + manual)
            // No los sumamos de nuevo, solo los mostramos
            if (modalityStats.bola8) {
                document.getElementById('bola8_played').value = modalityStats.bola8.matchesPlayed || 0;
                document.getElementById('bola8_won').value = modalityStats.bola8.matchesWon || 0;
                document.getElementById('bola8_games_played').value = modalityStats.bola8.gamesPlayed || 0;
                document.getElementById('bola8_games_won').value = modalityStats.bola8.gamesWon || 0;
            }
            
            if (modalityStats.bola9) {
                document.getElementById('bola9_played').value = modalityStats.bola9.matchesPlayed || 0;
                document.getElementById('bola9_won').value = modalityStats.bola9.matchesWon || 0;
                document.getElementById('bola9_games_played').value = modalityStats.bola9.gamesPlayed || 0;
                document.getElementById('bola9_games_won').value = modalityStats.bola9.gamesWon || 0;
            }
            
            if (modalityStats.bola10) {
                document.getElementById('bola10_played').value = modalityStats.bola10.matchesPlayed || 0;
                document.getElementById('bola10_won').value = modalityStats.bola10.matchesWon || 0;
                document.getElementById('bola10_games_played').value = modalityStats.bola10.gamesPlayed || 0;
                document.getElementById('bola10_games_won').value = modalityStats.bola10.gamesWon || 0;
            }

            // Mostrar info de partidos detectados automáticamente (solo informativo)
            const autoDetectedInfo = document.createElement('div');
            const totalAutoMatches = 
                (matchStats.bola8?.matchesPlayed || 0) +
                (matchStats.bola9?.matchesPlayed || 0) +
                (matchStats.bola10?.matchesPlayed || 0);
            
            const totalAutoGames = 
                (matchStats.bola8?.gamesPlayed || 0) +
                (matchStats.bola9?.gamesPlayed || 0) +
                (matchStats.bola10?.gamesPlayed || 0);

            if (totalAutoMatches > 0) {
                autoDetectedInfo.style.cssText = 'background: rgb(0,0,0,0); border: 1px solid rgba(0, 0, 0, 0); border-radius: 12px; padding: 16px; margin-bottom: 36px; margin-top:20px;';
                autoDetectedInfo.innerHTML = `
                    <p style="color: #000; font-weight: 600; margin-bottom: 8px;">Partidos en el Sistema (ya incluidos arriba)</p>
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 12px; margin-top: 32px;">
                        <div style="text-align: center;">
                            <div style="font-size: 0.75rem; color: #000; text-transform: uppercase; letter-spacing: 0.05em;">Bola 8</div>
                            <div style="font-size: 1.25rem; font-weight: 700; color: #000;">${matchStats.bola8?.matchesPlayed || 0} partidos</div>
                            <div style="font-size: 0.9rem; color: #86868b;">${matchStats.bola8?.gamesPlayed || 0} partidas</div>
                        </div>
                        <div style="text-align: center;">
                            <div style="font-size: 0.75rem; color: #000; text-transform: uppercase; letter-spacing: 0.05em;">Bola 9</div>
                            <div style="font-size: 1.25rem; font-weight: 700; color: #000;">${matchStats.bola9?.matchesPlayed || 0} partidos</div>
                            <div style="font-size: 0.9rem; color: #86868b;">${matchStats.bola9?.gamesPlayed || 0} partidas</div>
                        </div>
                        <div style="text-align: center;">
                            <div style="font-size: 0.75rem; color: #000; text-transform: uppercase; letter-spacing: 0.05em;">Bola 10</div>
                            <div style="font-size: 1.25rem; font-weight: 700; color: #000;">${matchStats.bola10?.matchesPlayed || 0} partidos</div>
                            <div style="font-size: 0.9rem; color: #86868b;">${matchStats.bola10?.gamesPlayed || 0} partidas</div>
                        </div>
                    </div>
                `;
                
                const inputsGrid = modalitySection.querySelector('.modality-inputs-grid');
                if (!modalitySection.querySelector('[style*="background: rgba(0, 122, 255"]')) {
                    inputsGrid.parentElement.insertBefore(autoDetectedInfo, inputsGrid);
                }
            }

            // Calcular automáticamente las estadísticas combinadas
            const hasData = (modalityStats.bola8 && modalityStats.bola8.matchesPlayed > 0) ||
                           (modalityStats.bola9 && modalityStats.bola9.matchesPlayed > 0) ||
                           (modalityStats.bola10 && modalityStats.bola10.matchesPlayed > 0);
            
            if (hasData || totalAutoMatches > 0) {
                calculateModalityStats();
            }
        }

        function setupModalityCalculator() {
            const calculateBtn = document.getElementById('calculateModalityBtn');
            const saveBtn = document.getElementById('saveModalityBtn');

            calculateBtn.addEventListener('click', calculateModalityStats);
            saveBtn.addEventListener('click', saveModalityData);
        }

        function calculateModalityStats() {
            // Obtener valores de los inputs (datos manuales adicionales, no automáticos)
            const manualBola8 = {
                played: parseInt(document.getElementById('bola8_played').value) || 0,
                won: parseInt(document.getElementById('bola8_won').value) || 0,
                gamesPlayed: parseInt(document.getElementById('bola8_games_played').value) || 0,
                gamesWon: parseInt(document.getElementById('bola8_games_won').value) || 0
            };

            const manualBola9 = {
                played: parseInt(document.getElementById('bola9_played').value) || 0,
                won: parseInt(document.getElementById('bola9_won').value) || 0,
                gamesPlayed: parseInt(document.getElementById('bola9_games_played').value) || 0,
                gamesWon: parseInt(document.getElementById('bola9_games_won').value) || 0
            };

            const manualBola10 = {
                played: parseInt(document.getElementById('bola10_played').value) || 0,
                won: parseInt(document.getElementById('bola10_won').value) || 0,
                gamesPlayed: parseInt(document.getElementById('bola10_games_played').value) || 0,
                gamesWon: parseInt(document.getElementById('bola10_games_won').value) || 0
            };

            // Obtener estadísticas de partidos registrados
            const matchStats = calculateStatsFromMatches(currentData?.matches || []);

            // Los datos de modalityStats YA incluyen los partidos registrados
            // Solo necesitamos sumarlos una vez, no duplicar
            // Los inputs manuales SON el total (incluyen automáticos + manuales)
            const bola8 = {
                played: manualBola8.played,
                won: manualBola8.won,
                gamesPlayed: manualBola8.gamesPlayed,
                gamesWon: manualBola8.gamesWon
            };

            const bola9 = {
                played: manualBola9.played,
                won: manualBola9.won,
                gamesPlayed: manualBola9.gamesPlayed,
                gamesWon: manualBola9.gamesWon
            };

            const bola10 = {
                played: manualBola10.played,
                won: manualBola10.won,
                gamesPlayed: manualBola10.gamesPlayed,
                gamesWon: manualBola10.gamesWon
            };

            // Calcular totales (sin duplicar, ya que los inputs contienen el total)
            const totals = {
                matchesPlayed: bola8.played + bola9.played + bola10.played,
                matchesWon: bola8.won + bola9.won + bola10.won,
                gamesPlayed: bola8.gamesPlayed + bola9.gamesPlayed + bola10.gamesPlayed,
                gamesWon: bola8.gamesWon + bola9.gamesWon + bola10.gamesWon
            };

            totals.matchWinRate = totals.matchesPlayed > 0 ? (totals.matchesWon / totals.matchesPlayed * 100) : 0;
            totals.gameWinRate = totals.gamesPlayed > 0 ? (totals.gamesWon / totals.gamesPlayed * 100) : 0;

            // Calcular win rates por modalidad
            bola8.matchWinRate = bola8.played > 0 ? (bola8.won / bola8.played * 100) : 0;
            bola8.gameWinRate = bola8.gamesPlayed > 0 ? (bola8.gamesWon / bola8.gamesPlayed * 100) : 0;
            
            bola9.matchWinRate = bola9.played > 0 ? (bola9.won / bola9.played * 100) : 0;
            bola9.gameWinRate = bola9.gamesPlayed > 0 ? (bola9.gamesWon / bola9.gamesPlayed * 100) : 0;
            
            bola10.matchWinRate = bola10.played > 0 ? (bola10.won / bola10.played * 100) : 0;
            bola10.gameWinRate = bola10.gamesPlayed > 0 ? (bola10.gamesWon / bola10.gamesPlayed * 100) : 0;

            // Mostrar estadísticas
            displayModalityStats(totals, { bola8, bola9, bola10 });
        }

        function displayModalityStats(totals, modalities) {
            const statsSection = document.getElementById('modalityStats');
            const statsGrid = document.getElementById('modalityStatsGrid');
            const chartsGrid = document.getElementById('modalityChartsGrid');

            statsSection.style.display = 'block';
            statsGrid.innerHTML = '';
            chartsGrid.innerHTML = '';

            // Añadir indicador de sincronización
            const syncBadge = document.createElement('div');
            syncBadge.style.cssText = 'text-align: center; margin-bottom: 20px; padding: 12px; background: linear-gradient(62deg,rgba(0, 255, 242, 0.49) 0%, rgba(0, 217, 255, 0.27) 100%); border-radius: 8px;';
            syncBadge.innerHTML = '<p style="color: #34c759; font-weight: 600; font-size: 0.9rem;">✅ Estadísticas Totales (Partidos Registrados + Datos Manuales)</p>';
            
            statsGrid.parentElement.insertBefore(syncBadge, statsGrid);

            // Tarjetas de estadísticas totales
            const stats = [
                { label: 'Total Partidos', value: totals.matchesPlayed },
                { label: 'Partidos Ganados', value: totals.matchesWon },
                { label: 'Win Rate Partidos', value: totals.matchWinRate.toFixed(1) + '%' },
                { label: 'Total Partidas', value: totals.gamesPlayed },
                { label: 'Partidas Ganadas', value: totals.gamesWon },
                { label: 'Win Rate Partidas', value: totals.gameWinRate.toFixed(1) + '%' }
            ];

            stats.forEach(stat => {
                const card = document.createElement('div');
                card.className = 'modality-stat-card';
                card.innerHTML = `
                    <div class="modality-stat-label">${stat.label}</div>
                    <div class="modality-stat-value">${stat.value}</div>
                `;
                statsGrid.appendChild(card);
            });

            // Gráfico de comparación de modalidades - Partidos
            createModalityComparisonChart(modalities, chartsGrid);

            // Gráfico de win rates
            createWinRateChart(modalities, chartsGrid);

            // Gráfico de distribución
            createModalityDistributionChart(modalities, chartsGrid);
        }

        function createModalityComparisonChart(modalities, container) {
            const chartDiv = document.createElement('div');
            chartDiv.className = 'chart-card1';
            chartDiv.innerHTML = '<h3 class="chart-title">Partidos por Modalidad</h3><canvas></canvas>';
            container.appendChild(chartDiv);

            new Chart(chartDiv.querySelector('canvas'), {
                type: 'bar',
                data: {
                    labels: ['Bola 8', 'Bola 9', 'Bola 10'],
                    datasets: [{
                        label: 'Jugados',
                        data: [modalities.bola8.played, modalities.bola9.played, modalities.bola10.played],
                        backgroundColor: 'rgba(59, 130, 246, 0.8)',
                        borderRadius: 8
                    }, {
                        label: 'Ganados',
                        data: [modalities.bola8.won, modalities.bola9.won, modalities.bola10.won],
                        backgroundColor: 'rgba(52, 199, 89, 0.8)',
                        borderRadius: 8
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: true,
                    plugins: {
                        legend: {
                            display: true,
                            position: 'top',
                            labels: {
                                color: '#1d1d1f',
                                font: { size: 12, weight: '500' },
                                padding: 16,
                                usePointStyle: true
                            }
                        }
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            grid: { color: 'rgba(0, 0, 0, 0.05)', drawBorder: false },
                            ticks: { color: '#86868b', font: { size: 12, weight: '500' } }
                        },
                        x: {
                            grid: { display: false },
                            ticks: { color: '#1d1d1f', font: { size: 12, weight: '500' } }
                        }
                    }
                }
            });
        }

        function createWinRateChart(modalities, container) {
            const chartDiv = document.createElement('div');
            chartDiv.className = 'chart-card1';
            chartDiv.innerHTML = '<h3 class="chart-title">Win Rate por Modalidad</h3><canvas></canvas>';
            container.appendChild(chartDiv);

            new Chart(chartDiv.querySelector('canvas'), {
                type: 'radar',
                data: {
                    labels: ['Bola 8', 'Bola 9', 'Bola 10'],
                    datasets: [{
                        label: 'Win Rate Partidos (%)',
                        data: [
                            modalities.bola8.matchWinRate,
                            modalities.bola9.matchWinRate,
                            modalities.bola10.matchWinRate
                        ],
                        backgroundColor: 'rgba(59, 130, 246, 0.2)',
                        borderColor: 'rgba(0, 0, 0, 1)',
                        borderWidth: 2,
                        pointBackgroundColor: '#3b82f6',
                        pointBorderColor: '#fff',
                        pointBorderWidth: 2
                    }, {
                        label: 'Win Rate Partidas (%)',
                        data: [
                            modalities.bola8.gameWinRate,
                            modalities.bola9.gameWinRate,
                            modalities.bola10.gameWinRate
                        ],
                        backgroundColor: 'rgba(52, 199, 89, 0.2)',
                        borderColor: 'rgba(52, 199, 89, 1)',
                        borderWidth: 2,
                        pointBackgroundColor: '#34c759',
                        pointBorderColor: '#fff',
                        pointBorderWidth: 2
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: true,
                    plugins: {
                        legend: {
                            display: true,
                            position: 'bottom',
                            labels: { color: '#1d1d1f', font: { size: 12, weight: '500' }, padding: 16 }
                        }
                    },
                    scales: {
                        r: {
                            beginAtZero: true,
                            max: 100,
                            grid: { color: 'rgba(0, 0, 0, 0.06)' },
                            ticks: { 
                                color: '#86868b',
                                backdropColor: 'transparent',
                                font: { size: 11 },
                                callback: value => value + '%'
                            },
                            pointLabels: { color: '#1d1d1f', font: { size: 12, weight: '500' } }
                        }
                    }
                }
            });
        }

        function createModalityDistributionChart(modalities, container) {
            const chartDiv = document.createElement('div');
            chartDiv.className = 'chart-card1';
            chartDiv.innerHTML = '<h3 class="chart-title">Distribución de Partidas</h3><canvas></canvas>';
            container.appendChild(chartDiv);

            new Chart(chartDiv.querySelector('canvas'), {
                type: 'doughnut',
                data: {
                    labels: ['Bola 8', 'Bola 9', 'Bola 10'],
                    datasets: [{
                        data: [
                            modalities.bola8.gamesPlayed,
                            modalities.bola9.gamesPlayed,
                            modalities.bola10.gamesPlayed
                        ],
                        backgroundColor: [
                            'rgba(59, 130, 246, 0.9)',   // Azul vibrante
                            'rgba(16, 185, 129, 0.9)',   // Verde esmeralda
                            'rgba(249, 115, 22, 0.9)'    // Naranja cálido
                        ],
                        borderWidth: 0,
                        spacing: 2
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: true,
                    plugins: {
                        legend: {
                            position: 'bottom',
                            labels: {
                                color: '#1d1d1f',
                                font: { size: 12, weight: '500' },
                                padding: 16,
                                usePointStyle: true,
                                pointStyle: 'circle'
                            }
                        }
                    }
                }
            });
        }

        function saveModalityData() {
            // Obtener valores de los inputs
            const modalityData = {
                bola8: {
                    matchesPlayed: parseInt(document.getElementById('bola8_played').value) || 0,
                    matchesWon: parseInt(document.getElementById('bola8_won').value) || 0,
                    gamesPlayed: parseInt(document.getElementById('bola8_games_played').value) || 0,
                    gamesWon: parseInt(document.getElementById('bola8_games_won').value) || 0
                },
                bola9: {
                    matchesPlayed: parseInt(document.getElementById('bola9_played').value) || 0,
                    matchesWon: parseInt(document.getElementById('bola9_won').value) || 0,
                    gamesPlayed: parseInt(document.getElementById('bola9_games_played').value) || 0,
                    gamesWon: parseInt(document.getElementById('bola9_games_won').value) || 0
                },
                bola10: {
                    matchesPlayed: parseInt(document.getElementById('bola10_played').value) || 0,
                    matchesWon: parseInt(document.getElementById('bola10_won').value) || 0,
                    gamesPlayed: parseInt(document.getElementById('bola10_games_played').value) || 0,
                    gamesWon: parseInt(document.getElementById('bola10_games_won').value) || 0
                },
                lastUpdated: new Date().toISOString()
            };

            // Crear estructura completa para data.json usando los datos actuales
            const fullData = {
                matches: currentData?.matches || [],
                players: currentData?.players || ["Xisco"],
                materials: currentData?.materials || ["Raqueta A", "Raqueta B", "Raqueta C", "Pelota Pro", "Pelota Standard"],
                modalityStats: modalityData
            };

            // Crear JSON y descargar
            const dataStr = JSON.stringify(fullData, null, 2);
            const dataBlob = new Blob([dataStr], { type: 'application/json' });
            const url = URL.createObjectURL(dataBlob);
            const link = document.createElement('a');
            link.href = url;
            link.download = 'data.json';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);

            // Mostrar confirmación
            alert('✅ Archivo data.json descargado correctamente. Súbelo a tu servidor para actualizar las estadísticas.');
        }

        function generateHeroStats(matches, players, materials, combinedStats) {
            const statsHero = document.getElementById('statsGrid');
            
            const totalMatches = matches.length;

            // Filtrar partidos de Xisco
            const xiscoMatches = matches.filter(m => 
                m.player1.toLowerCase() === 'xisco' || m.player2.toLowerCase() === 'xisco'
            );

            // Calcular puntuación total y promedio de Xisco
            let xiscoTotalScore = 0;
            xiscoMatches.forEach(m => {
                const isPlayer1 = m.player1.toLowerCase() === 'xisco';
                xiscoTotalScore += parseInt(isPlayer1 ? m.score1 : m.score2);
            });
            const xiscoAvgScore = xiscoMatches.length > 0 ? (xiscoTotalScore / xiscoMatches.length).toFixed(1) : 0;

            // Material más usado por Xisco
            const xiscoMaterials = {};
            xiscoMatches.forEach(m => {
                const isPlayer1 = m.player1.toLowerCase() === 'xisco';
                const material = isPlayer1 ? m.material1 : m.material2;
                xiscoMaterials[material] = (xiscoMaterials[material] || 0) + 1;
            });
            const topXiscoMaterial = Object.entries(xiscoMaterials).sort((a, b) => b[1] - a[1])[0];

            const stats = [
                { label: 'Total Partidos', value: totalMatches },
           
                { label: 'Material Popular Xisco', value: topXiscoMaterial ? topXiscoMaterial[0] : 'N/A', smallText: true }
            ];

            // Si hay estadísticas combinadas, mostrar totales sincronizados
            if (combinedStats) {
                const totalCombinedMatches = 
                    (combinedStats.bola8?.matchesPlayed || 0) +
                    (combinedStats.bola9?.matchesPlayed || 0) +
                    (combinedStats.bola10?.matchesPlayed || 0);
                
                const totalCombinedGames = 
                    (combinedStats.bola8?.gamesPlayed || 0) +
                    (combinedStats.bola9?.gamesPlayed || 0) +
                    (combinedStats.bola10?.gamesPlayed || 0);

                if (totalCombinedMatches > 0 || totalCombinedGames > 0) {
                    stats.push(
                        { label: 'Total Partidos (Global)', value: totalCombinedMatches },
                        { label: 'Total Partidas (Global)', value: totalCombinedGames }
                    );
                }
            }

            statsHero.innerHTML = '';
            stats.forEach((stat, index) => {
                const box = document.createElement('div');
                box.className = 'stat-card fade-in';
                box.innerHTML = `
                    <div class="stat-label">${stat.label}</div>
                    <div class="stat-value ${stat.smallText ? 'small-text' : ''}">${stat.value}</div>
                `;
                statsHero.appendChild(box);
            });
        }

        function generateCharts(matches, players, materials) {
            createPlayerWinsChart(matches);
            createScoreDistributionChart(matches);
            createModalityChart(matches);
            createMaterialUsageChart(matches);
            createTimelineChart(matches);
            createPlayerPerformanceChart(matches);
        }

        function createPlayerWinsChart(matches) {
            const playerWins = {};
            
            matches.forEach(m => {
                const winner = parseInt(m.score1) > parseInt(m.score2) ? m.player1 : m.player2;
                playerWins[winner] = (playerWins[winner] || 0) + 1;
            });

            const container = createChartContainer('Victorias por Jugador');
            const canvas = container.querySelector('canvas');

            new Chart(canvas, {
                type: 'bar',
                data: {
                    labels: Object.keys(playerWins),
                    datasets: [{
                        label: 'Victorias',
                        data: Object.values(playerWins),
                        backgroundColor: 'rgba(59, 130, 246, 0.8)',
                        borderRadius: 8,
                        borderSkipped: false
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: true,
                    plugins: {
                        legend: { display: false },
                        tooltip: {
                            backgroundColor: 'rgba(29, 29, 31, 0.95)',
                            titleColor: '#fff',
                            bodyColor: '#fff',
                            padding: 12,
                            borderRadius: 8,
                            titleFont: { size: 13, weight: '600' },
                            bodyFont: { size: 13 }
                        }
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            grid: { 
                                color: 'rgba(0, 0, 0, 0.05)',
                                drawBorder: false
                            },
                            ticks: { 
                                color: '#86868b',
                                font: { size: 12, weight: '500' }
                            }
                        },
                        x: {
                            grid: { display: false },
                            ticks: { 
                                color: '#1d1d1f',
                                font: { size: 12, weight: '500' }
                            }
                        }
                    }
                }
            });
        }

        function createScoreDistributionChart(matches) {
            const scoreDiffs = matches.map(m => Math.abs(parseInt(m.score1) - parseInt(m.score2)));
            const distribution = {};
            
            scoreDiffs.forEach(diff => {
                distribution[diff] = (distribution[diff] || 0) + 1;
            });

            const container = createChartContainer('Diferencia de Partidas');
            const canvas = container.querySelector('canvas');

            new Chart(canvas, {
                type: 'doughnut',
                data: {
                    labels: Object.keys(distribution).map(k => `${k} partida${k > 1 ? 's' : ''}`),
                    datasets: [{
                        data: Object.values(distribution),
                        backgroundColor: [
                            'rgba(59, 130, 246, 0.9)',   // Azul vibrante
                            'rgba(16, 185, 129, 0.9)',   // Verde esmeralda
                            'rgba(249, 115, 22, 0.9)',   // Naranja cálido
                            'rgba(236, 72, 153, 0.9)',   // Rosa fucsia
                            'rgba(168, 85, 247, 0.9)'    // Púrpura
                        ],
                        borderWidth: 0,
                        spacing: 2
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: true,
                    plugins: {
                        legend: {
                            position: 'bottom',
                            labels: { 
                                color: '#1d1d1f',
                                font: { size: 12, weight: '500' },
                                padding: 16,
                                usePointStyle: true,
                                pointStyle: 'circle'
                            }
                        },
                        tooltip: {
                            backgroundColor: 'rgba(29, 29, 31, 0.95)',
                            titleColor: '#fff',
                            bodyColor: '#fff',
                            padding: 12,
                            borderRadius: 8
                        }
                    }
                }
            });
        }

        function createModalityChart(matches) {
            const modalities = {};
            matches.forEach(m => {
                modalities[m.modality] = (modalities[m.modality] || 0) + 1;
            });

            const container = createChartContainer('Modalidades');
            const canvas = container.querySelector('canvas');

            new Chart(canvas, {
                type: 'polarArea',
                data: {
                    labels: Object.keys(modalities),
                    datasets: [{
                        data: Object.values(modalities),
                        backgroundColor: [
                            'rgba(59, 130, 246, 0.7)',   // Azul vibrante
                            'rgba(16, 185, 129, 0.7)',   // Verde esmeralda
                            'rgba(249, 115, 22, 0.7)'    // Naranja cálido
                        ],
                        borderWidth: 0
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: true,
                    plugins: {
                        legend: {
                            position: 'bottom',
                            labels: { 
                                color: '#1d1d1f',
                                font: { size: 12, weight: '500' },
                                padding: 16
                            }
                        }
                    },
                    scales: {
                        r: {
                            grid: { color: 'rgba(0, 0, 0, 0.06)' },
                            ticks: { 
                                color: '#86868b',
                                backdropColor: 'transparent',
                                font: { size: 11 }
                            }
                        }
                    }
                }
            });
        }

        function createMaterialUsageChart(matches) {
            const materials = {};
            matches.forEach(m => {
                materials[m.material1] = (materials[m.material1] || 0) + 1;
                materials[m.material2] = (materials[m.material2] || 0) + 1;
            });

            const container = createChartContainer('Uso de Materiales');
            const canvas = container.querySelector('canvas');

            new Chart(canvas, {
                type: 'bar',
                data: {
                    labels: Object.keys(materials),
                    datasets: [{
                        label: 'Usos',
                        data: Object.values(materials),
                        backgroundColor: 'rgba(88, 86, 214, 0.8)',
                        borderRadius: 8,
                        borderSkipped: false
                    }]
                },
                options: {
                    indexAxis: 'y',
                    responsive: true,
                    maintainAspectRatio: true,
                    plugins: {
                        legend: { display: false },
                        tooltip: {
                            backgroundColor: 'rgba(29, 29, 31, 0.95)',
                            titleColor: '#fff',
                            bodyColor: '#fff',
                            padding: 12,
                            borderRadius: 8
                        }
                    },
                    scales: {
                        x: {
                            beginAtZero: true,
                            grid: { 
                                color: 'rgba(0, 0, 0, 0.05)',
                                drawBorder: false
                            },
                            ticks: { 
                                color: '#86868b',
                                font: { size: 12, weight: '500' }
                            }
                        },
                        y: {
                            grid: { display: false },
                            ticks: { 
                                color: '#1d1d1f',
                                font: { size: 12, weight: '500' }
                            }
                        }
                    }
                }
            });
        }

        function createTimelineChart(matches) {
            const sortedMatches = [...matches].sort((a, b) => new Date(a.date) - new Date(b.date));
            
            const container = createChartContainer('Evolución de Partidas', true);
            const canvas = container.querySelector('canvas');

            new Chart(canvas, {
                type: 'line',
                data: {
                    labels: sortedMatches.map((m, i) => `Partido ${i + 1}`),
                    datasets: [{
                        label: 'Total Partidas',
                        data: sortedMatches.map(m => parseInt(m.score1) + parseInt(m.score2)),
                        borderColor: 'rgba(0, 0, 0, 1)',
                        backgroundColor: 'rgba(59, 130, 246, 0.1)',
                        tension: 0.4,
                        fill: true,
                        pointRadius: 4,
                        pointBackgroundColor: '#3b82f6',
                        pointBorderColor: '#fff',
                        pointBorderWidth: 2,
                        pointHoverRadius: 6
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: true,
                    plugins: {
                        legend: { display: false },
                        tooltip: {
                            backgroundColor: 'rgba(29, 29, 31, 0.95)',
                            titleColor: '#fff',
                            bodyColor: '#fff',
                            padding: 12,
                            borderRadius: 8
                        }
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            grid: { 
                                color: 'rgba(0, 0, 0, 0.05)',
                                drawBorder: false
                            },
                            ticks: { 
                                color: '#86868b',
                                font: { size: 12, weight: '500' }
                            }
                        },
                        x: {
                            grid: { display: false },
                            ticks: { 
                                color: '#86868b',
                                font: { size: 11, weight: '500' }
                            }
                        }
                    }
                }
            });
        }

        function createPlayerPerformanceChart(matches) {
            const playerStats = {};
            
            matches.forEach(m => {
                const p1 = m.player1;
                const p2 = m.player2;
                const s1 = parseInt(m.score1);
                const s2 = parseInt(m.score2);
                
                if (!playerStats[p1]) playerStats[p1] = { score: 0, matches: 0 };
                if (!playerStats[p2]) playerStats[p2] = { score: 0, matches: 0 };
                
                playerStats[p1].score += s1;
                playerStats[p1].matches += 1;
                playerStats[p2].score += s2;
                playerStats[p2].matches += 1;
            });

            const avgScore = Object.entries(playerStats).map(([player, stats]) => ({
                player,
                avg: (stats.score / stats.matches).toFixed(2)
            }));

            const container = createChartContainer('Rendimiento Promedio', true);
            const canvas = container.querySelector('canvas');

            new Chart(canvas, {
                type: 'radar',
                data: {
                    labels: avgScore.map(p => p.player),
                    datasets: [{
                        label: 'Partidas Promedio',
                        data: avgScore.map(p => p.avg),
                        backgroundColor: 'rgba(59, 130, 246, 0.2)',
                        borderColor: 'rgba(0, 0, 0, 1)',
                        borderWidth: 2,
                        pointBackgroundColor: '#3b82f6',
                        pointBorderColor: '#fff',
                        pointBorderWidth: 2,
                        pointRadius: 4,
                        pointHoverRadius: 6
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: true,
                    plugins: {
                        legend: { display: false }
                    },
                    scales: {
                        r: {
                            beginAtZero: true,
                            grid: { color: 'rgba(0, 0, 0, 0.06)' },
                            ticks: { 
                                color: '#86868b',
                                backdropColor: 'transparent',
                                font: { size: 11 }
                            },
                            pointLabels: { 
                                color: '#1d1d1f',
                                font: { size: 12, weight: '500' }
                            }
                        }
                    }
                }
            });
        }

        function setupPlayerComparison(matches, players) {
            if (players.length < 2) return;

            const comparisonSection = document.getElementById('comparisonSection');
            comparisonSection.style.display = 'block';

            const player1Select = document.getElementById('player1Select');
            const player2Select = document.getElementById('player2Select');

            // Obtener jugadores únicos de los partidos
            const playersInMatches = new Set();
            matches.forEach(m => {
                playersInMatches.add(m.player1);
                playersInMatches.add(m.player2);
            });
            const activePlayers = Array.from(playersInMatches);

            // Poblar select de jugador 1 solo con Xisco
            const xiscoOption = document.createElement('option');
            xiscoOption.value = 'Xisco';
            xiscoOption.textContent = 'Xisco';
            player1Select.appendChild(xiscoOption);
            player1Select.value = 'Xisco';
            player1Select.disabled = true; // Deshabilitar para que siempre sea Xisco

            // Poblar select de jugador 2 con todos los demás jugadores
            activePlayers.forEach((player) => {
                if (player.toLowerCase() !== 'xisco') {
                    const option2 = document.createElement('option');
                    option2.value = player;
                    option2.textContent = player;
                    player2Select.appendChild(option2);
                }
            });

            // Seleccionar el primer rival disponible
            const rivals = activePlayers.filter(p => p.toLowerCase() !== 'xisco');
            if (rivals.length > 0) {
                player2Select.value = rivals[0];
            }

            // Event listener solo para jugador 2
            player2Select.addEventListener('change', () => updateComparison(matches));

            // Mostrar comparación inicial
            updateComparison(matches);
        }

        function updateComparison(matches) {
            const player1 = document.getElementById('player1Select').value;
            const player2 = document.getElementById('player2Select').value;
            const content = document.getElementById('comparisonContent');

            if (!player1 || !player2) {
                content.innerHTML = '<div class="no-comparison">Selecciona un rival para comparar con Xisco</div>';
                return;
            }

            // Calcular estadísticas
            const stats1 = calculatePlayerStats(matches, player1);
            const stats2 = calculatePlayerStats(matches, player2);

            // Mostrar estadísticas comparativas
            let html = '<div class="comparison-stats">';

            const comparisons = [
                { label: 'Partidos Jugados', key: 'totalMatches', format: 'number' },
                { label: 'Victorias', key: 'wins', format: 'number' },
                { label: 'Partidas Anotadas', key: 'scoreGained', format: 'number' },
                { label: 'Partidas Recibidas', key: 'scoreConceded', format: 'number' },
                { label: 'Partidas Promedio', key: 'avgScore', format: 'decimal' },
                { label: 'Win Rate', key: 'winRate', format: 'percentage' }
            ];

            comparisons.forEach(comp => {
                const val1 = stats1[comp.key];
                const val2 = stats2[comp.key];
                const isWinner1 = val1 > val2;
                const isWinner2 = val2 > val1;

                let displayVal1 = val1;
                let displayVal2 = val2;

                if (comp.format === 'decimal') {
                    displayVal1 = val1.toFixed(1);
                    displayVal2 = val2.toFixed(1);
                } else if (comp.format === 'percentage') {
                    displayVal1 = val1.toFixed(1) + '%';
                    displayVal2 = val2.toFixed(1) + '%';
                }

                html += `
                    <div class="comparison-stat">
                        <div class="comparison-stat-label">${comp.label}</div>
                        <div class="comparison-stat-values">
                            <div class="comparison-value player1 ${isWinner1 && val1 !== val2 ? 'comparison-winner' : ''}">${displayVal1}</div>
                            <div class="comparison-separator">·</div>
                            <div class="comparison-value player2 ${isWinner2 && val1 !== val2 ? 'comparison-winner' : ''}">${displayVal2}</div>
                        </div>
                    </div>
                `;
            });

            html += '</div>';

            // Añadir gráficos comparativos
            html += '<div class="charts-grid" id="comparisonCharts"></div>';

            content.innerHTML = html;

            // Crear gráficos de comparación
            setTimeout(() => {
                createComparisonCharts(stats1, stats2, player1, player2);
            }, 100);
        }

        function calculatePlayerStats(matches, player) {
            const playerMatches = matches.filter(m => m.player1 === player || m.player2 === player);
            
            let wins = 0;
            let scoreGained = 0;
            let scoreConceded = 0;

            playerMatches.forEach(m => {
                const isPlayer1 = m.player1 === player;
                const myScore = parseInt(isPlayer1 ? m.score1 : m.score2);
                const opponentScore = parseInt(isPlayer1 ? m.score2 : m.score1);

                scoreGained += myScore;
                scoreConceded += opponentScore;

                if (myScore > opponentScore) wins++;
            });

            return {
                totalMatches: playerMatches.length,
                wins: wins,
                losses: playerMatches.length - wins,
                scoreGained: scoreGained,
                scoreConceded: scoreConceded,
                avgScore: playerMatches.length > 0 ? scoreGained / playerMatches.length : 0,
                winRate: playerMatches.length > 0 ? (wins / playerMatches.length) * 100 : 0
            };
        }

        function createComparisonCharts(stats1, stats2, player1, player2) {
            const container = document.getElementById('comparisonCharts');
            if (!container) return;

            // Gráfico de barras comparativo
            const barChartDiv = document.createElement('div');
            barChartDiv.className = 'chart-card1';
            barChartDiv.innerHTML = '<h3 class="chart-title">Victorias y Derrotas</h3><canvas></canvas>';
            container.appendChild(barChartDiv);

            new Chart(barChartDiv.querySelector('canvas'), {
                type: 'bar',
                data: {
                    labels: [player1, player2],
                    datasets: [{
                        label: 'Victorias',
                        data: [stats1.wins, stats2.wins],
                        backgroundColor: 'rgba(59, 130, 246, 0.8)',
                        borderRadius: 8
                    }, {
                        label: 'Derrotas',
                        data: [stats1.losses, stats2.losses],
                        backgroundColor: 'rgba(255, 59, 48, 0.8)',
                        borderRadius: 8
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: true,
                    plugins: {
                        legend: {
                            display: true,
                            position: 'bottom',
                            labels: {
                                color: '#1d1d1f',
                                font: { size: 12, weight: '500' },
                                padding: 16,
                                usePointStyle: true,
                                pointStyle: 'circle'
                            }
                        },
                        tooltip: {
                            backgroundColor: 'rgba(29, 29, 31, 0.95)',
                            titleColor: '#fff',
                            bodyColor: '#fff',
                            padding: 12,
                            borderRadius: 8
                        }
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            grid: { color: 'rgba(0, 0, 0, 0.05)', drawBorder: false },
                            ticks: { color: '#86868b', font: { size: 12, weight: '500' } }
                        },
                        x: {
                            grid: { display: false },
                            ticks: { color: '#1d1d1f', font: { size: 12, weight: '500' } }
                        }
                    }
                }
            });

            // Gráfico de radar comparativo
            const radarChartDiv = document.createElement('div');
            radarChartDiv.className = 'chart-card1';
            radarChartDiv.innerHTML = '<h3 class="chart-title">Perfil de Rendimiento</h3><canvas></canvas>';
            container.appendChild(radarChartDiv);

            new Chart(radarChartDiv.querySelector('canvas'), {
                type: 'radar',
                data: {
                    labels: ['Partidos', 'Victorias', 'Partidas Anotadas', 'Win Rate %', 'Partidas Promedio'],
                    datasets: [{
                        label: player1,
                        data: [
                            stats1.totalMatches,
                            stats1.wins,
                            stats1.scoreGained,
                            stats1.winRate,
                            stats1.avgScore * 10
                        ],
                        backgroundColor: 'rgba(59, 130, 246, 0.2)',
                        borderColor: 'rgba(0, 0, 0, 1)',
                        borderWidth: 2,
                        pointBackgroundColor: '#3b82f6',
                        pointBorderColor: '#fff',
                        pointBorderWidth: 2
                    }, {
                        label: player2,
                        data: [
                            stats2.totalMatches,
                            stats2.wins,
                            stats2.scoreGained,
                            stats2.winRate,
                            stats2.avgScore * 10
                        ],
                        backgroundColor: 'rgba(88, 86, 214, 0.2)',
                        borderColor: 'rgba(88, 86, 214, 1)',
                        borderWidth: 2,
                        pointBackgroundColor: '#0000ff',
                        pointBorderColor: '#fff',
                        pointBorderWidth: 2
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: true,
                    plugins: {
                        legend: {
                            display: true,
                            position: 'bottom',
                            labels: {
                                color: '#1d1d1f',
                                font: { size: 12, weight: '500' },
                                padding: 16
                            }
                        }
                    },
                    scales: {
                        r: {
                            beginAtZero: true,
                            grid: { color: 'rgba(0, 0, 0, 0.06)' },
                            ticks: {
                                color: '#86868b',
                                backdropColor: 'transparent',
                                font: { size: 11 }
                            },
                            pointLabels: {
                                color: '#1d1d1f',
                                font: { size: 11, weight: '500' }
                            }
                        }
                    }
                }
            });

            // Gráfico de partidas
            const scoresChartDiv = document.createElement('div');
            scoresChartDiv.className = 'chart-card1 full-width';
            scoresChartDiv.innerHTML = '<h3 class="chart-title">Comparativa de Partidas</h3><canvas></canvas>';
            container.appendChild(scoresChartDiv);

            new Chart(scoresChartDiv.querySelector('canvas'), {
                type: 'bar',
                data: {
                    labels: ['Partidas Anotadas', 'Partidas Recibidas', 'Diferencia'],
                    datasets: [{
                        label: player1,
                        data: [stats1.scoreGained, stats1.scoreConceded, stats1.scoreGained - stats1.scoreConceded],
                        backgroundColor: 'rgba(59, 130, 246, 0.8)',
                        borderRadius: 8
                    }, {
                        label: player2,
                        data: [stats2.scoreGained, stats2.scoreConceded, stats2.scoreGained - stats2.scoreConceded],
                        backgroundColor: 'rgba(88, 86, 214, 0.8)',
                        borderRadius: 8
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: true,
                    plugins: {
                        legend: {
                            display: true,
                            position: 'top',
                            labels: {
                                color: '#1d1d1f',
                                font: { size: 12, weight: '500' },
                                padding: 16,
                                usePointStyle: true,
                                pointStyle: 'circle'
                            }
                        },
                        tooltip: {
                            backgroundColor: 'rgba(29, 29, 31, 0.95)',
                            titleColor: '#fff',
                            bodyColor: '#fff',
                            padding: 12,
                            borderRadius: 8
                        }
                    },
                    scales: {
                        y: {
                            grid: { color: 'rgba(0, 0, 0, 0.05)', drawBorder: false },
                            ticks: { color: '#86868b', font: { size: 12, weight: '500' } }
                        },
                        x: {
                            grid: { display: false },
                            ticks: { color: '#1d1d1f', font: { size: 12, weight: '500' } }
                        }
                    }
                }
            });
        }

        function generateMatchesTable(matches) {
            const table = document.getElementById('matchesTable');
            const sortedMatches = [...matches].sort((a, b) => new Date(b.date) - new Date(a.date));

            // Si no hay partidos
            if (sortedMatches.length === 0) {
                table.innerHTML = '<tbody><tr><td colspan="7" style="text-align: center; padding: 40px; color: #86868b;">No hay partidos registrados</td></tr></tbody>';
                document.getElementById('paginationTopStats').style.display = 'none';
                document.getElementById('paginationBottomStats').style.display = 'none';
                return;
            }

            // Calcular paginación
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
                        <th>Material 1</th>
                    
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

            // Mostrar controles de paginación si hay más de 100 partidos
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
                // Mostrar todas las páginas
                for (let i = 1; i <= totalPages; i++) {
                    pages.push(`<div class="page-number-stats ${i === currentPageStats ? 'active' : ''}" onclick="goToPageStats(${i})">${i}</div>`);
                }
            } else {
                // Mostrar páginas con elipsis
                if (currentPageStats <= 3) {
                    // Inicio
                    for (let i = 1; i <= 4; i++) {
                        pages.push(`<div class="page-number-stats ${i === currentPageStats ? 'active' : ''}" onclick="goToPageStats(${i})">${i}</div>`);
                    }
                    pages.push(`<div class="page-number-stats ellipsis">...</div>`);
                    pages.push(`<div class="page-number-stats" onclick="goToPageStats(${totalPages})">${totalPages}</div>`);
                } else if (currentPageStats >= totalPages - 2) {
                    // Final
                    pages.push(`<div class="page-number-stats" onclick="goToPageStats(1)">1</div>`);
                    pages.push(`<div class="page-number-stats ellipsis">...</div>`);
                    for (let i = totalPages - 3; i <= totalPages; i++) {
                        pages.push(`<div class="page-number-stats ${i === currentPageStats ? 'active' : ''}" onclick="goToPageStats(${i})">${i}</div>`);
                    }
                } else {
                    // Medio
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
            
            // Scroll suave al inicio de la tabla
            document.getElementById('matchesTable').scrollIntoView({ behavior: 'smooth', block: 'start' });
        }

        function createChartContainer(title, fullWidth = false) {
            const container = document.createElement('div');
            container.className = `chart-card ${fullWidth ? 'full-width' : ''}`;
            container.innerHTML = `
                <h3 class="chart-title">${title}</h3>
                <canvas></canvas>
            `;
            document.getElementById('chartsGrid').appendChild(container);
            return container;
        }








