/**
 * Application principale
 * Gère l'interface utilisateur et l'orchestration
 */

class MediaOptimizerApp {
    constructor() {
        this.currentPreset = 'balanced';
        this.currentProfile = null; // Profil d'appareil actif
        this.chart = null;
        this.comparisonProfiles = []; // Profils sélectionnés pour comparaison
        
        // Analyse avec métadonnées réelles
        this.analyzer = new MediaAnalyzer();
        this.optimizer = null;
        this.batchManager = new BatchManager();
        
        this.init();
    }

    /**
     * Initialise l'application
     */
    init() {
        this.setupEventListeners();
        this.setupDropzone();
        this.setupThemeToggle();
    }
    
    /**
     * Configure le toggle de thème
     */
    setupThemeToggle() {
        const toggle = document.getElementById('themeToggle');
        if (!toggle) return;
        
        const savedTheme = localStorage.getItem('theme') || 'dark';
        
        // Appliquer le thème sauvegardé
        document.documentElement.setAttribute('data-theme', savedTheme);
        
        toggle.addEventListener('click', () => {
            const currentTheme = document.documentElement.getAttribute('data-theme');
            const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
            
            document.documentElement.setAttribute('data-theme', newTheme);
            localStorage.setItem('theme', newTheme);
        });
    }

    /**
     * Configure les écouteurs d'événements
     */
    setupEventListeners() {
        // Upload de fichier
        const fileInput = document.getElementById('fileInput');
        const dropzone = document.getElementById('dropzone');
        
        dropzone.addEventListener('click', () => fileInput.click());
        fileInput.addEventListener('change', (e) => this.handleFileSelect(e));
        
        // Suppression de fichier
        const removeBtn = document.getElementById('removeFile');
        removeBtn?.addEventListener('click', () => this.resetApp());
        
        // Tous les profils (appareil + usage) utilisent maintenant la même classe
        const profileButtons = document.querySelectorAll('.device-profile-btn');
        profileButtons.forEach(btn => {
            btn.addEventListener('click', (e) => this.handleProfileChange(e));
        });
        
        // Copy command button
        const copyBtn = document.getElementById('copyCommand');
        copyBtn?.addEventListener('click', () => this.copyCommand());
        
        // Bouton de comparaison
        const compareBtn = document.getElementById('compareProfilesBtn');
        compareBtn?.addEventListener('click', () => this.showProfileComparison());
        
        // Bouton de fermeture de comparaison
        const closeComparisonBtn = document.getElementById('closeComparison');
        closeComparisonBtn?.addEventListener('click', () => this.hideProfileComparison());
        
        // Batch actions
        const generateBatchBtn = document.getElementById('generateBatchScript');
        generateBatchBtn?.addEventListener('click', () => this.showBatchScriptOptions());
        
        const exportCSVBtn = document.getElementById('exportBatchCSV');
        exportCSVBtn?.addEventListener('click', () => this.batchManager.exportCSV());
    }

    /**
     * Configure la dropzone
     */
    setupDropzone() {
        const dropzone = document.getElementById('dropzone');
        
        dropzone.addEventListener('dragover', (e) => {
            e.preventDefault();
            dropzone.classList.add('dragover');
        });
        
        dropzone.addEventListener('dragleave', () => {
            dropzone.classList.remove('dragover');
        });
        
        dropzone.addEventListener('drop', (e) => {
            e.preventDefault();
            dropzone.classList.remove('dragover');
            
            const files = e.dataTransfer.files;
            if (files.length > 0) {
                this.handleFiles(files);
            }
        });
    }

    /**
     * Gère la sélection de fichier(s) - détection automatique
     */
    handleFileSelect(event) {
        const files = event.target.files;
        
        if (files.length === 0) return;
        
        this.handleFiles(files);
    }

    /**
     * Gère les fichiers uploadés (détection automatique single vs batch)
     */
    handleFiles(files) {
        const fileArray = Array.from(files);
        
        // Détection automatique : 1 fichier = single, 2+ = batch
        if (fileArray.length === 1) {
            this.handleFile(fileArray[0]);
        } else {
            this.handleBatchFiles(files);
        }
    }

    /**
     * Traite le fichier uploadé (mode simple)
     */
    async handleFile(file) {
        // Vérifier que c'est un fichier vidéo
        if (!file.type.startsWith('video/') && !this.isVideoFile(file.name)) {
            alert('⚠️ Veuillez sélectionner un fichier vidéo valide');
            return;
        }
        
        // Afficher les infos du fichier
        this.displayFileInfo(file);
        
        // Analyser le fichier
        await this.analyzeFile(file);
        
        // Générer les recommandations
        this.generateRecommendations();
        
        // Afficher toutes les sections
        this.showAllSections();
    }

    /**
     * Traite plusieurs fichiers (mode batch avec métadonnées réelles)
     */
    async handleBatchFiles(files) {
        // Filtrer uniquement les vidéos
        const videoFiles = Array.from(files).filter(file => 
            file.type.startsWith('video/') || this.isVideoFile(file.name)
        );
        
        if (videoFiles.length === 0) {
            alert('⚠️ Aucun fichier vidéo valide trouvé');
            return;
        }
        
        // Afficher un loader
        this.showBatchLoader(videoFiles.length);
        
        // Analyser tous les fichiers
        await this.batchManager.addFiles(videoFiles);
        
        // Afficher le tableau batch
        this.displayBatchResults();
    }

    /**
     * Vérifie si le fichier est une vidéo (par extension)
     */
    isVideoFile(filename) {
        const videoExtensions = ['mp4', 'mkv', 'avi', 'mov', 'webm', 'flv', 'wmv', 'mpg', 'mpeg', 'm4v'];
        const ext = filename.toLowerCase().split('.').pop();
        return videoExtensions.includes(ext);
    }

    /**
     * Affiche les informations du fichier
     */
    displayFileInfo(file) {
        const dropzone = document.getElementById('dropzone');
        const fileInfo = document.getElementById('fileInfo');
        const fileName = document.getElementById('fileName');
        const fileSize = document.getElementById('fileSize');
        
        dropzone.style.display = 'none';
        fileInfo.style.display = 'flex';
        
        fileName.textContent = file.name;
        fileSize.textContent = MediaAnalyzer.formatSize(file.size);
    }

    /**
     * Analyse le fichier (avec métadonnées réelles)
     */
    async analyzeFile(file) {
        const metadata = await this.analyzer.analyzeFile(file);
        
        // Afficher les métadonnées
        this.displayMetadata(metadata);
        
        // Afficher le graphique
        this.displayChart();
    }

    /**
     * Affiche les métadonnées
     */
    displayMetadata(metadata) {
        const grid = document.getElementById('metadataGrid');
        
        const items = [
            {
                label: 'Résolution',
                value: `${metadata.video.width} × ${metadata.video.height}`,
                subvalue: metadata.video.resolution.toUpperCase()
            },
            {
                label: 'Codec Vidéo',
                value: metadata.video.codecName,
                subvalue: `${MediaAnalyzer.formatBitrate(metadata.video.bitrate)}`
            },
            {
                label: 'Codec Audio',
                value: metadata.audio.codecName,
                subvalue: `${metadata.audio.channels} • ${metadata.audio.bitrate} kbps`
            },
            {
                label: 'Durée',
                value: MediaAnalyzer.formatDuration(metadata.duration),
                subvalue: `${metadata.video.framerate} fps`
            },
            {
                label: 'Bitrate Total',
                value: MediaAnalyzer.formatBitrate(metadata.totalBitrate),
                subvalue: `Container: ${metadata.containerFormat}`
            },
            {
                label: 'Taille Fichier',
                value: MediaAnalyzer.formatSize(metadata.size),
                subvalue: metadata.subtitlesCount > 0 
                    ? `${metadata.subtitlesCount} piste${metadata.subtitlesCount > 1 ? 's' : ''} sous-titres` 
                    : 'Sans sous-titres'
            }
        ];
        
        grid.innerHTML = items.map(item => `
            <div class="metadata-item">
                <div class="metadata-label">${item.label}</div>
                <div class="metadata-value">${item.value}</div>
                <div class="metadata-subvalue">${item.subvalue}</div>
            </div>
        `).join('');
        
        // Afficher les détails des sous-titres si présents
        if (metadata.subtitles && metadata.subtitles.length > 0) {
            const subtitlesDetail = document.createElement('div');
            subtitlesDetail.className = 'metadata-item';
            subtitlesDetail.style.gridColumn = '1 / -1';
            subtitlesDetail.innerHTML = `
                <div class="metadata-label">Pistes Sous-titres</div>
                <div class="metadata-value" style="font-size: 0.9em; color: var(--text-secondary);">
                    ${metadata.subtitles.map((sub, i) => 
                        `<div style="margin: 4px 0;">
                            <strong>${i + 1}.</strong> ${sub.format}${sub.language !== 'Unknown' ? ` (${sub.language})` : ''}${sub.title ? ` - ${sub.title}` : ''}
                        </div>`
                    ).join('')}
                </div>
            `;
            grid.appendChild(subtitlesDetail);
        }
    }

    /**
     * Affiche le graphique de répartition
     */
    displayChart() {
        const canvas = document.getElementById('bitrateChart');
        const ctx = canvas.getContext('2d');
        
        // Détruire l'ancien graphique si existe
        if (this.chart) {
            this.chart.destroy();
        }
        
        const chartData = this.analyzer.generateChartData();
        
        this.chart = new Chart(ctx, {
            type: 'doughnut',
            data: chartData,
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            color: '#e5e7eb',
                            font: {
                                size: 14
                            },
                            padding: 20
                        }
                    },
                    title: {
                        display: true,
                        text: 'Répartition du Bitrate (kbps)',
                        color: '#e5e7eb',
                        font: {
                            size: 16,
                            weight: 'bold'
                        },
                        padding: 20
                    }
                }
            }
        });
    }

    /**
     * Génère les recommandations
     */
    generateRecommendations() {
        // Utiliser le profil actif (qui inclut maintenant tout)
        const profile = this.currentProfile || this.currentPreset || 'balanced';
        
        this.optimizer = new OptimizationEngine(this.analyzer.metadata, profile, true);
        
        const recommendations = this.optimizer.generateRecommendations();
        this.displayRecommendations(recommendations);
        
        // Générer la commande ffmpeg
        const command = this.optimizer.generateFFmpegCommand();
        this.displayCommand(command);
        
        // Afficher les estimations
        const savings = this.optimizer.estimateOutputSize();
        this.displaySavings(savings);
        
        // Mettre à jour les badges
        this.updateBadges();
    }

    /**
     * Affiche les recommandations
     */
    displayRecommendations(recommendations) {
        const grid = document.getElementById('recommendationsGrid');
        
        const impactColors = {
            high: '#ef4444',
            medium: '#f59e0b',
            low: '#10b981'
        };
        
        grid.innerHTML = recommendations.map(rec => `
            <div class="recommendation-item">
                <div class="recommendation-info">
                    <h4>${rec.category}</h4>
                    <p>${rec.reason}</p>
                </div>
                <div class="recommendation-change">
                    <span class="change-from">${rec.from}</span>
                    <span class="change-arrow">→</span>
                    <span class="change-to">${rec.to}</span>
                </div>
            </div>
        `).join('');
    }

    /**
     * Affiche la commande ffmpeg
     */
    displayCommand(command) {
        const commandElement = document.getElementById('ffmpegCommand');
        commandElement.textContent = command;
        
        // Afficher l'explication
        const explanations = this.optimizer.generateCommandExplanation();
        const explanationElement = document.getElementById('commandExplanation');
        
        explanationElement.innerHTML = `
            <h4>📖 Explication de la commande</h4>
            <ul class="explanation-list">
                ${explanations.map(exp => `
                    <li><code>${exp.param}</code> : ${exp.description}</li>
                `).join('')}
            </ul>
        `;
    }

    /**
     * Affiche les économies estimées
     */
    displaySavings(savings) {
        const originalBar = document.getElementById('originalBar');
        const optimizedBar = document.getElementById('optimizedBar');
        const originalSize = document.getElementById('originalSize');
        const optimizedSize = document.getElementById('optimizedSize');
        const savingsPercent = document.getElementById('savingsPercent');
        const savedSpace = document.getElementById('savedSpace');
        
        // Barres de progression
        originalBar.style.width = '100%';
        optimizedBar.style.width = `${100 - savings.percentage}%`;
        
        // Valeurs
        originalSize.textContent = MediaAnalyzer.formatSize(savings.original);
        optimizedSize.textContent = MediaAnalyzer.formatSize(savings.optimized);
        savingsPercent.textContent = `${savings.percentage}%`;
        savedSpace.textContent = MediaAnalyzer.formatSize(savings.saved);
    }

    /**
     * Met à jour les badges de compatibilité
     */
    updateBadges() {
        const plexBadge = document.getElementById('plexBadge');
        const gpuBadge = document.getElementById('gpuBadge');
        const nasBadge = document.getElementById('nasBadge');
        
        // Compatibilité Plex
        const plexCompatible = this.optimizer.checkPlexCompatibility();
        if (!plexCompatible) {
            plexBadge.classList.remove('badge-success');
            plexBadge.classList.add('badge-warning');
            plexBadge.innerHTML = '<i class="fas fa-exclamation-circle"></i> Transcodage Plex possible';
        }
        
        // GPU Acceleration
        const gpuSupport = this.optimizer.checkGPUAcceleration();
        if (!gpuSupport) {
            gpuBadge.style.display = 'none';
        } else {
            gpuBadge.style.display = 'flex';
        }
        
        // Badge NAS toujours affiché
        nasBadge.style.display = 'flex';
    }

    /**
     * Gère le changement de profil d'appareil
     */
    async handleProfileChange(event) {
        const button = event.currentTarget;
        const profile = button.dataset.profile;
        
        // Désactiver tous les profils et presets
        document.querySelectorAll('.device-profile-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelectorAll('.preset-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        
        // Activer le profil sélectionné
        button.classList.add('active');
        
        // Mettre à jour le profil actif
        this.currentProfile = profile;
        this.currentPreset = null; // Désactiver les presets classiques
        
        // Régénérer selon ce qui est affiché
        const batchSection = document.getElementById('batch-section');
        const isBatchVisible = batchSection && batchSection.style.display !== 'none';
        
        if (isBatchVisible && this.batchManager.analyses.length > 0) {
            // Mode batch : recalculer avec profil d'appareil
            await this.batchManager.changePreset(profile, true); // true = utiliser comme profil
            this.fillBatchTable();
            this.updateBatchTotal(this.batchManager.getTotalStats());
        } else if (this.optimizer) {
            // Mode single : régénérer avec profil
            this.generateRecommendations();
        }
    }

    /**
     * Affiche la section de comparaison de profils
     */
    showProfileComparison() {
        const section = document.getElementById('comparison-section');
        section.style.display = 'block';
        
        // Générer les chips de sélection
        this.renderProfileSelector();
        
        // Scroll vers la section
        section.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
    
    /**
     * Masque la section de comparaison
     */
    hideProfileComparison() {
        document.getElementById('comparison-section').style.display = 'none';
        this.comparisonProfiles = [];
    }
    
    /**
     * Génère les chips de sélection de profils
     */
    renderProfileSelector() {
        const container = document.getElementById('comparisonProfileSelector');
        const profiles = CodecDatabase.deviceProfiles;
        
        container.innerHTML = '';
        
        Object.entries(profiles).forEach(([key, profile]) => {
            const chip = document.createElement('button');
            chip.className = 'profile-chip';
            chip.dataset.profile = key;
            
            // Désactiver si déjà 3 profils sélectionnés et celui-ci n'en fait pas partie
            if (this.comparisonProfiles.length >= 3 && !this.comparisonProfiles.includes(key)) {
                chip.classList.add('disabled');
                chip.disabled = true;
            }
            
            if (this.comparisonProfiles.includes(key)) {
                chip.classList.add('selected');
            }
            
            chip.innerHTML = `
                <i class="fas ${profile.icon}"></i>
                ${profile.name}
            `;
            
            chip.addEventListener('click', () => this.toggleProfileForComparison(key));
            container.appendChild(chip);
        });
    }
    
    /**
     * Toggle un profil dans la comparaison
     */
    toggleProfileForComparison(profileKey) {
        const index = this.comparisonProfiles.indexOf(profileKey);
        
        if (index > -1) {
            // Retirer
            this.comparisonProfiles.splice(index, 1);
        } else {
            // Ajouter (max 3)
            if (this.comparisonProfiles.length < 3) {
                this.comparisonProfiles.push(profileKey);
            }
        }
        
        // Re-render
        this.renderProfileSelector();
        
        // Si au moins 2 profils, afficher le tableau
        if (this.comparisonProfiles.length >= 2) {
            this.renderComparisonTable();
        } else {
            document.getElementById('comparisonTableContainer').innerHTML = '';
        }
    }
    
    /**
     * Génère le tableau de comparaison
     */
    renderComparisonTable() {
        const container = document.getElementById('comparisonTableContainer');
        const metadata = this.analyzer.metadata;
        
        // Calculer les stats pour chaque profil
        const comparisons = this.comparisonProfiles.map(profileKey => {
            const optimizer = new OptimizationEngine(metadata, profileKey, true);
            optimizer.generateRecommendations();
            const savings = optimizer.estimateOutputSize();
            
            return {
                key: profileKey,
                profile: CodecDatabase.deviceProfiles[profileKey],
                optimizer: optimizer,
                savings: savings
            };
        });
        
        // Trouver le meilleur (plus petit)
        const bestIndex = comparisons.reduce((best, curr, idx) => 
            curr.savings.optimized < comparisons[best].savings.optimized ? idx : best, 0
        );
        
        // Générer le HTML du tableau
        let html = `
            <table class="comparison-table">
                <thead>
                    <tr>
                        <th class="label"></th>
                        ${comparisons.map((c, idx) => `
                            <th>
                                <div style="display: flex; align-items: center; gap: 8px;">
                                    <i class="fas ${c.profile.icon}"></i>
                                    ${c.profile.name}
                                </div>
                                ${idx === bestIndex ? '<div class="comparison-best"><i class="fas fa-crown"></i> Plus compact</div>' : ''}
                            </th>
                        `).join('')}
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td class="label">📦 Taille finale</td>
                        ${comparisons.map(c => `
                            <td class="value">
                                <strong style="font-size: 18px; color: var(--primary);">
                                    ${MediaAnalyzer.formatSize(c.savings.optimized)}
                                </strong>
                            </td>
                        `).join('')}
                    </tr>
                    <tr>
                        <td class="label">💾 Économie</td>
                        ${comparisons.map(c => `
                            <td class="value">
                                <span style="color: var(--success);">
                                    -${MediaAnalyzer.formatSize(c.savings.saved)} (${c.savings.percentage}%)
                                </span>
                            </td>
                        `).join('')}
                    </tr>
                    <tr>
                        <td class="label">🎬 Codec vidéo</td>
                        ${comparisons.map(c => `
                            <td class="value">
                                <span class="comparison-codec">${c.profile.videoCodec.toUpperCase()}</span>
                            </td>
                        `).join('')}
                    </tr>
                    <tr>
                        <td class="label">🎯 CRF</td>
                        ${comparisons.map(c => `
                            <td class="value">${c.profile.videoCRF}</td>
                        `).join('')}
                    </tr>
                    <tr>
                        <td class="label">⚙️ Preset</td>
                        ${comparisons.map(c => `
                            <td class="value">${c.profile.videoPreset}</td>
                        `).join('')}
                    </tr>
                    <tr>
                        <td class="label">🔊 Codec audio</td>
                        ${comparisons.map(c => `
                            <td class="value">
                                <span class="comparison-codec">${c.profile.audioCodec.toUpperCase()}</span>
                            </td>
                        `).join('')}
                    </tr>
                    <tr>
                        <td class="label">📻 Bitrate audio</td>
                        ${comparisons.map(c => `
                            <td class="value">${c.profile.audioBitrate ? c.profile.audioBitrate + ' kbps' : 'Auto'}</td>
                        `).join('')}
                    </tr>
                    <tr>
                        <td class="label">📦 Container</td>
                        ${comparisons.map(c => `
                            <td class="value">.${c.profile.container || 'mkv'}</td>
                        `).join('')}
                    </tr>
                    <tr>
                        <td class="label">💡 Description</td>
                        ${comparisons.map(c => `
                            <td class="value" style="font-size: 13px; color: var(--text-secondary);">
                                ${c.profile.description}
                            </td>
                        `).join('')}
                    </tr>
                </tbody>
            </table>
        `;
        
        container.innerHTML = html;
    }

    /**
     * Copie la commande dans le presse-papiers
     */
    async copyCommand() {
        const command = this.optimizer.ffmpegCommand;
        const button = document.getElementById('copyCommand');
        
        try {
            await navigator.clipboard.writeText(command);
            
            // Feedback visuel
            const originalHTML = button.innerHTML;
            button.innerHTML = '<i class="fas fa-check"></i> Copié !';
            button.classList.add('copied');
            
            setTimeout(() => {
                button.innerHTML = originalHTML;
                button.classList.remove('copied');
            }, 2000);
        } catch (err) {
            alert('❌ Impossible de copier la commande');
        }
    }

    /**
     * Affiche toutes les sections
     */
    showAllSections() {
        const sections = [
            'analysis-section',
            'recommendations-section',
            'command-section',
            'savings-section'
        ];
        
        sections.forEach((id, index) => {
            setTimeout(() => {
                const section = document.getElementById(id);
                section.style.display = 'block';
                // Pas de scroll automatique - l'utilisateur reste en haut
            }, index * 200);
        });
    }

    /**
     * Affiche un loader pendant l'analyse batch
     */
    showBatchLoader(count) {
        const dropzone = document.getElementById('dropzone');
        const fileInfo = document.getElementById('fileInfo');
        
        dropzone.style.display = 'none';
        fileInfo.style.display = 'flex';
        
        document.getElementById('fileName').textContent = `Analyse de ${count} fichiers en cours...`;
        document.getElementById('fileSize').innerHTML = '<i class="fas fa-spinner fa-spin"></i> Traitement...';
    }

    /**
     * Affiche les résultats du mode batch
     */
    displayBatchResults() {
        // Cacher les sections single mode
        document.getElementById('analysis-section').style.display = 'none';
        document.getElementById('recommendations-section').style.display = 'none';
        document.getElementById('command-section').style.display = 'none';
        document.getElementById('savings-section').style.display = 'none';
        
        // Afficher la section batch
        const batchSection = document.getElementById('batch-section');
        batchSection.style.display = 'block';
        
        // Mettre à jour le compteur
        const stats = this.batchManager.getTotalStats();
        document.getElementById('batchCount').textContent = `${stats.count} fichiers`;
        
        // Remplir le tableau
        this.fillBatchTable();
        
        // Mettre à jour le total
        this.updateBatchTotal(stats);
        
        // Mettre à jour fileInfo
        document.getElementById('fileName').textContent = `${stats.count} fichiers analysés`;
        document.getElementById('fileSize').textContent = MediaAnalyzer.formatSize(stats.totalOriginal);
    }

    /**
     * Remplit le tableau batch
     */
    fillBatchTable() {
        const tbody = document.getElementById('batchTableBody');
        
        tbody.innerHTML = this.batchManager.analyses.map((analysis, index) => {
            const filename = analysis.file.name;
            const originalSize = MediaAnalyzer.formatSize(analysis.savings.original);
            const codecName = analysis.metadata.video.codecName;
            const resolution = analysis.metadata.video.resolution.toUpperCase();
            const optimizedSize = MediaAnalyzer.formatSize(analysis.savings.optimized);
            const savedSize = MediaAnalyzer.formatSize(analysis.savings.saved);
            const percentage = analysis.savings.percentage;
            
            return `
                <tr>
                    <td class="file-name-cell" title="${filename}">${filename}</td>
                    <td>${originalSize}</td>
                    <td>${codecName}</td>
                    <td>${resolution}</td>
                    <td>${optimizedSize}</td>
                    <td class="savings-positive">-${savedSize} (${percentage}%)</td>
                    <td>
                        <button class="btn-view" onclick="app.viewFileDetails(${index})">
                            <i class="fas fa-eye"></i> Voir
                        </button>
                    </td>
                </tr>
            `;
        }).join('');
    }

    /**
     * Met à jour le total du tableau
     */
    updateBatchTotal(stats) {
        document.getElementById('batchTotalOptimized').textContent = MediaAnalyzer.formatSize(stats.totalOptimized);
        document.getElementById('batchTotalSaved').innerHTML = `<span class="savings-positive">-${MediaAnalyzer.formatSize(stats.totalSaved)} (${stats.percentage}%)</span>`;
    }

    /**
     * Affiche les détails d'un fichier spécifique
     */
    viewFileDetails(index) {
        const analysis = this.batchManager.analyses[index];
        
        // Créer un nouvel optimizer avec le profil ACTUEL
        this.analyzer.metadata = analysis.metadata;
        const profile = this.currentProfile || this.currentPreset || 'balanced';
        this.optimizer = new OptimizationEngine(analysis.metadata, profile, true);
        
        // Cacher batch, afficher single
        document.getElementById('batch-section').style.display = 'none';
        
        // Afficher avec le preset actuel
        this.displayMetadata(analysis.metadata);
        this.displayChart();
        
        // Générer les recommandations avec le preset actuel
        const recommendations = this.optimizer.generateRecommendations();
        this.displayRecommendations(recommendations);
        
        // Générer la commande avec le preset actuel
        const command = this.optimizer.generateFFmpegCommand();
        this.displayCommand(command);
        
        // Calculer les économies avec le preset actuel
        const savings = this.optimizer.estimateOutputSize();
        this.displaySavings(savings);
        
        this.updateBadges();
        
        // Afficher sections single
        document.getElementById('analysis-section').style.display = 'block';
        document.getElementById('recommendations-section').style.display = 'block';
        document.getElementById('command-section').style.display = 'block';
        document.getElementById('savings-section').style.display = 'block';
        
        // Ajouter un bouton retour
        this.addBackToBatchButton();
    }

    /**
     * Ajoute un bouton retour au batch
     */
    addBackToBatchButton() {
        const analysisHeader = document.querySelector('#analysis-section .card-header');
        
        // Vérifier si le bouton existe déjà
        if (document.getElementById('backToBatch')) return;
        
        const backBtn = document.createElement('button');
        backBtn.id = 'backToBatch';
        backBtn.className = 'btn-secondary';
        backBtn.style.marginLeft = 'auto';
        backBtn.innerHTML = '<i class="fas fa-arrow-left"></i> Retour au Batch';
        backBtn.addEventListener('click', () => this.returnToBatch());
        
        analysisHeader.appendChild(backBtn);
    }

    /**
     * Retour au mode batch
     */
    returnToBatch() {
        // Cacher sections single
        document.getElementById('analysis-section').style.display = 'none';
        document.getElementById('recommendations-section').style.display = 'none';
        document.getElementById('command-section').style.display = 'none';
        document.getElementById('savings-section').style.display = 'none';
        
        // Afficher section batch
        document.getElementById('batch-section').style.display = 'block';
        
        // Supprimer le bouton retour
        const backBtn = document.getElementById('backToBatch');
        if (backBtn) backBtn.remove();
    }

    /**
     * Affiche les options de script batch
     */
    showBatchScriptOptions() {
        const options = confirm(
            '🖥️ Quel système utilisez-vous ?\n\n' +
            'OK = Linux/macOS (Bash)\n' +
            'Annuler = Windows (PowerShell)'
        );
        
        if (options) {
            this.batchManager.exportBashScript();
        } else {
            this.batchManager.exportPowerShellScript();
        }
    }

    /**
     * Réinitialise l'application
     */
    resetApp() {
        // Cacher toutes les sections
        const sections = [
            'analysis-section',
            'recommendations-section',
            'command-section',
            'savings-section',
            'batch-section'
        ];
        
        sections.forEach(id => {
            document.getElementById(id).style.display = 'none';
        });
        
        // Supprimer le bouton retour si existe
        const backBtn = document.getElementById('backToBatch');
        if (backBtn) backBtn.remove();
        
        // Réinitialiser l'upload
        const dropzone = document.getElementById('dropzone');
        const fileInfo = document.getElementById('fileInfo');
        const fileInput = document.getElementById('fileInput');
        
        dropzone.style.display = 'block';
        fileInfo.style.display = 'none';
        fileInput.value = '';
        
        // Détruire le graphique
        if (this.chart) {
            this.chart.destroy();
            this.chart = null;
        }
        
        // Réinitialiser les objets
        this.analyzer = new MediaAnalyzer();
        this.optimizer = null;
        this.batchManager = new BatchManager();
        this.currentPreset = 'balanced';
        
        // Réinitialiser les presets
        document.querySelectorAll('.preset-btn').forEach(btn => {
            btn.classList.remove('active');
            if (btn.dataset.preset === 'balanced') {
                btn.classList.add('active');
            }
        });
        
        // Scroll vers le haut
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
}

// Initialiser l'application au chargement de la page
let app; // Instance globale pour les callbacks

document.addEventListener('DOMContentLoaded', () => {
    // Petit délai pour laisser MediaInfo.js s'initialiser
    setTimeout(() => {
        app = new MediaOptimizerApp();
        
        // Vérifier si MediaInfo est disponible
        if (typeof MediaInfo !== 'undefined' && MediaInfo.mediaInfoFactory) {
            console.log('✅ Application prête avec MediaInfo.js - Données 100% réelles !');
        } else {
            console.warn('⚠️ Application prête - MediaInfo non disponible, estimation intelligente');
        }
    }, 1000);
});
