/**
 * Gestionnaire de mode batch
 * Gère l'analyse de plusieurs fichiers simultanément
 */

class BatchManager {
    constructor() {
        this.files = [];
        this.analyses = [];
        this.currentPreset = 'balanced';
        this.isProfile = false;
    }

    /**
     * Ajoute des fichiers à analyser (toujours en mode précis)
     */
    async addFiles(fileList) {
        this.files = Array.from(fileList);
        this.analyses = [];
        
        // Analyser tous les fichiers
        for (const file of this.files) {
            const analysis = await this.analyzeFile(file);
            this.analyses.push(analysis);
        }
        
        return this.analyses;
    }

    /**
     * Analyse un fichier (toujours avec métadonnées réelles)
     */
    async analyzeFile(file) {
        const analyzer = new MediaAnalyzer();
        const metadata = await analyzer.analyzeFile(file);
        const optimizer = new OptimizationEngine(metadata, this.currentPreset, this.isProfile);
        
        optimizer.generateRecommendations();
        optimizer.generateFFmpegCommand();
        const savings = optimizer.estimateOutputSize();
        
        return {
            file,
            metadata,
            optimizer,
            savings
        };
    }

    /**
     * Change le preset pour tous les fichiers
     */
    async changePreset(preset, isProfile = false) {
        this.currentPreset = preset;
        this.isProfile = isProfile;
        
        // Recalculer pour chaque fichier
        this.analyses = await Promise.all(
            this.files.map(file => this.analyzeFile(file))
        );
        
        return this.analyses;
    }

    /**
     * Calcule les statistiques totales
     */
    getTotalStats() {
        const totalOriginal = this.analyses.reduce((sum, a) => sum + a.savings.original, 0);
        const totalOptimized = this.analyses.reduce((sum, a) => sum + a.savings.optimized, 0);
        const totalSaved = totalOriginal - totalOptimized;
        const percentage = Math.round((totalSaved / totalOriginal) * 100);
        
        return {
            count: this.analyses.length,
            totalOriginal,
            totalOptimized,
            totalSaved,
            percentage
        };
    }

    /**
     * Génère un script batch pour Linux/macOS
     */
    generateBashScript() {
        let script = '#!/bin/bash\n';
        script += '# Script généré par Media Optimizer\n';
        script += `# Date: ${new Date().toISOString().split('T')[0]}\n`;
        script += `# Preset: ${this.currentPreset}\n`;
        script += '# Économie estimée: ' + MediaAnalyzer.formatSize(this.getTotalStats().totalSaved) + '\n\n';
        
        script += 'echo "🎬 Media Optimizer - Encodage Batch"\n';
        script += 'echo "===================================="\n';
        script += `echo "Fichiers à traiter: ${this.analyses.length}"\n`;
        script += 'echo ""\n\n';
        
        this.analyses.forEach((analysis, index) => {
            const filename = analysis.file.name;
            const command = analysis.optimizer.ffmpegCommand.replace(`"${filename}"`, '"$1"');
            
            script += `# Fichier ${index + 1}/${this.analyses.length}: ${filename}\n`;
            script += `echo "📹 Traitement: ${filename}"\n`;
            script += command.replace('"$1"', `"${filename}"`) + '\n';
            script += 'if [ $? -eq 0 ]; then\n';
            script += `    echo "✅ ${filename} - Terminé"\n`;
            script += 'else\n';
            script += `    echo "❌ ${filename} - Erreur"\n`;
            script += 'fi\n';
            script += 'echo ""\n\n';
        });
        
        script += 'echo "🎉 Encodage batch terminé !"\n';
        
        return script;
    }

    /**
     * Génère un script batch pour Windows
     */
    generatePowerShellScript() {
        let script = '# Script généré par Media Optimizer\n';
        script += `# Date: ${new Date().toISOString().split('T')[0]}\n`;
        script += `# Preset: ${this.currentPreset}\n`;
        script += '# Économie estimée: ' + MediaAnalyzer.formatSize(this.getTotalStats().totalSaved) + '\n\n';
        
        script += 'Write-Host "🎬 Media Optimizer - Encodage Batch" -ForegroundColor Cyan\n';
        script += 'Write-Host "====================================" -ForegroundColor Cyan\n';
        script += `Write-Host "Fichiers à traiter: ${this.analyses.length}" -ForegroundColor White\n`;
        script += 'Write-Host ""\n\n';
        
        this.analyses.forEach((analysis, index) => {
            const filename = analysis.file.name;
            const command = analysis.optimizer.ffmpegCommand.replace(`"${filename}"`, '"$file"');
            
            script += `# Fichier ${index + 1}/${this.analyses.length}: ${filename}\n`;
            script += `Write-Host "📹 Traitement: ${filename}" -ForegroundColor Yellow\n`;
            script += command.replace('"$file"', `"${filename}"`) + '\n';
            script += 'if ($LASTEXITCODE -eq 0) {\n';
            script += `    Write-Host "✅ ${filename} - Terminé" -ForegroundColor Green\n`;
            script += '} else {\n';
            script += `    Write-Host "❌ ${filename} - Erreur" -ForegroundColor Red\n`;
            script += '}\n';
            script += 'Write-Host ""\n\n';
        });
        
        script += 'Write-Host "🎉 Encodage batch terminé !" -ForegroundColor Green\n';
        
        return script;
    }

    /**
     * Génère un fichier CSV
     */
    generateCSV() {
        let csv = 'Fichier,Taille Originale,Codec Vidéo,Résolution,Taille Optimisée,Économie (MB),Économie (%)\n';
        
        this.analyses.forEach(analysis => {
            const filename = analysis.file.name;
            const originalSize = (analysis.savings.original / 1024 / 1024).toFixed(2);
            const optimizedSize = (analysis.savings.optimized / 1024 / 1024).toFixed(2);
            const savedSize = (analysis.savings.saved / 1024 / 1024).toFixed(2);
            const percentage = analysis.savings.percentage;
            
            csv += `"${filename}",${originalSize},${analysis.metadata.video.codecName},${analysis.metadata.video.resolution},${optimizedSize},${savedSize},${percentage}\n`;
        });
        
        const stats = this.getTotalStats();
        const totalOriginalMB = (stats.totalOriginal / 1024 / 1024).toFixed(2);
        const totalOptimizedMB = (stats.totalOptimized / 1024 / 1024).toFixed(2);
        const totalSavedMB = (stats.totalSaved / 1024 / 1024).toFixed(2);
        
        csv += `\nTOTAL,${totalOriginalMB},-,-,${totalOptimizedMB},${totalSavedMB},${stats.percentage}\n`;
        
        return csv;
    }

    /**
     * Télécharge un fichier
     */
    downloadFile(content, filename, mimeType) {
        const blob = new Blob([content], { type: mimeType });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    /**
     * Export du script bash
     */
    exportBashScript() {
        const script = this.generateBashScript();
        this.downloadFile(script, 'media-optimizer-batch.sh', 'text/x-shellscript');
    }

    /**
     * Export du script PowerShell
     */
    exportPowerShellScript() {
        const script = this.generatePowerShellScript();
        this.downloadFile(script, 'media-optimizer-batch.ps1', 'text/plain');
    }

    /**
     * Export CSV
     */
    exportCSV() {
        const csv = this.generateCSV();
        this.downloadFile(csv, 'media-optimizer-report.csv', 'text/csv');
    }
}

// Export pour utilisation dans d'autres modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = BatchManager;
}
