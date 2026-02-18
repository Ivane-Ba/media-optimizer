/**
 * Moteur d'optimisation
 * Génère les recommandations et commandes ffmpeg
 */

class OptimizationEngine {
    constructor(metadata, preset = 'balanced', isProfile = false) {
        this.metadata = metadata;
        this.preset = preset;
        this.isProfile = isProfile; // true si c'est un profil d'appareil
        this.recommendations = [];
        this.ffmpegCommand = '';
        this.estimatedSize = 0;
    }
    
    /**
     * Définit un profil d'appareil
     */
    setProfile(profile) {
        this.preset = profile;
        this.isProfile = true;
    }
    
    /**
     * Définit un preset classique
     */
    setPreset(preset) {
        this.preset = preset;
        this.isProfile = false;
    }
    
    /**
     * Récupère la configuration (preset ou profil)
     */
    getConfig() {
        if (this.isProfile) {
            const profile = CodecDatabase.deviceProfiles[this.preset];
            if (!profile) return CodecDatabase.presets.balanced;
            return profile;
        }
        return CodecDatabase.presets[this.preset] || CodecDatabase.presets.balanced;
    }

    /**
     * Génère toutes les recommandations
     */
    generateRecommendations() {
        this.recommendations = [];
        
        // Recommandation vidéo
        this.analyzeVideoOptimization();
        
        // Recommandation audio
        this.analyzeAudioOptimization();
        
        // Recommandation sous-titres
        if (this.metadata.hasSubtitles) {
            this.analyzeSubtitleOptimization();
        }
        
        return this.recommendations;
    }

    /**
     * Analyse l'optimisation vidéo
     */
    analyzeVideoOptimization() {
        const currentCodec = this.metadata.video.codec;
        const resolution = this.metadata.video.resolution;
        
        const targetCodec = CodecDatabase.recommendVideoCodec(
            currentCodec,
            resolution,
            this.preset
        );
        
        const presetConfig = this.getConfig();
        
        // Si changement de codec nécessaire
        if (currentCodec !== targetCodec) {
            const currentInfo = CodecDatabase.video[currentCodec];
            const targetInfo = CodecDatabase.video[targetCodec];
            
            this.recommendations.push({
                type: 'video',
                category: 'Codec Vidéo',
                description: `Passer de ${currentInfo.name} à ${targetInfo.name} pour meilleure efficacité`,
                from: currentInfo.name,
                to: targetInfo.name,
                impact: 'high',
                reason: `${targetInfo.name} offre ${Math.round((targetInfo.efficiency / currentInfo.efficiency - 1) * 100)}% de compression en plus`
            });
        }
        
        // Recommandation CRF
        this.recommendations.push({
            type: 'video',
            category: 'Qualité (CRF)',
            description: 'Constant Rate Factor pour contrôle qualité',
            from: 'Variable',
            to: `CRF ${presetConfig.videoCRF}`,
            impact: 'medium',
            reason: `CRF ${presetConfig.videoCRF} = ${this.getCRFDescription(presetConfig.videoCRF)}`
        });
        
        // Recommandation preset
        this.recommendations.push({
            type: 'video',
            category: 'Preset d\'encodage',
            description: 'Balance entre vitesse et compression',
            from: 'Non spécifié',
            to: presetConfig.videoPreset,
            impact: 'low',
            reason: `Preset "${presetConfig.videoPreset}" offre un bon compromis`
        });
    }

    /**
     * Analyse l'optimisation audio
     */
    analyzeAudioOptimization() {
        const currentCodec = this.metadata.audio.codec;
        const channels = this.metadata.audio.channels;
        
        const targetCodec = CodecDatabase.recommendAudioCodec(
            currentCodec,
            channels,
            this.preset
        );
        
        const presetConfig = this.getConfig();
        
        // Si changement de codec nécessaire
        if (currentCodec !== targetCodec) {
            const currentInfo = CodecDatabase.audio[currentCodec];
            const targetInfo = CodecDatabase.audio[targetCodec];
            
            this.recommendations.push({
                type: 'audio',
                category: 'Codec Audio',
                description: `Conversion ${currentInfo.name} → ${targetInfo.name}`,
                from: currentInfo.name,
                to: targetInfo.name,
                impact: currentCodec === 'flac' ? 'high' : 'medium',
                reason: currentCodec === 'flac' 
                    ? 'FLAC est lossless, conversion en lossy économise beaucoup d\'espace'
                    : `${targetInfo.name} offre meilleure efficacité`
            });
        }
        
        // Recommandation bitrate audio
        const targetBitrate = this.getTargetAudioBitrate(targetCodec, channels, presetConfig);
        
        if (targetBitrate && this.metadata.audio.bitrate !== targetBitrate) {
            this.recommendations.push({
                type: 'audio',
                category: 'Bitrate Audio',
                description: 'Optimisation du bitrate audio',
                from: `${this.metadata.audio.bitrate} kbps`,
                to: `${targetBitrate} kbps`,
                impact: 'low',
                reason: `Bitrate optimal pour ${channels}`
            });
        }
    }

    /**
     * Analyse l'optimisation des sous-titres
     */
    analyzeSubtitleOptimization() {
        // Vérifier s'il y a des sous-titres
        if (!this.metadata.subtitles || this.metadata.subtitles.length === 0) {
            return; // Pas de sous-titres, pas de recommandation
        }
        
        // Vérifier si tous les sous-titres sont déjà en SRT
        const allSRT = this.metadata.subtitles.every(sub => 
            sub.format.toLowerCase().includes('srt') || sub.format.toLowerCase().includes('subrip')
        );
        
        if (allSRT) {
            // Déjà tout en SRT, rien à faire
            this.recommendations.push({
                type: 'subtitle',
                category: 'Sous-titres',
                description: `${this.metadata.subtitlesCount} piste${this.metadata.subtitlesCount > 1 ? 's' : ''} déjà optimisée${this.metadata.subtitlesCount > 1 ? 's' : ''}`,
                from: 'SRT',
                to: 'Conserver',
                impact: 'low',
                reason: 'Format universel déjà utilisé'
            });
        } else {
            // Convertir tout en SRT pour compatibilité universelle
            const formats = [...new Set(this.metadata.subtitles.map(s => s.format))].join(', ');
            const count = this.metadata.subtitlesCount;
            
            this.recommendations.push({
                type: 'subtitle',
                category: 'Sous-titres',
                description: `Conversion ${count} piste${count > 1 ? 's' : ''} en SRT`,
                from: formats,
                to: 'SRT',
                impact: 'low',
                reason: 'Compatibilité universelle (Plex, TV, Mobile, Chromecast)'
            });
        }
    }

    /**
     * Génère la commande ffmpeg
     */
    generateFFmpegCommand() {
        const presetConfig = this.getConfig();
        const input = this.metadata.filename;
        const output = this.generateOutputFilename(input);
        
        let command = 'ffmpeg -i "' + input + '"';
        
        // Options vidéo
        const targetVideoCodec = CodecDatabase.recommendVideoCodec(
            this.metadata.video.codec,
            this.metadata.video.resolution,
            this.preset
        );
        
        if (targetVideoCodec === 'h265') {
            command += ` -c:v libx265`;
            command += ` -crf ${presetConfig.videoCRF}`;
            command += ` -preset ${presetConfig.videoPreset}`;
            
            if (presetConfig.tuning) {
                command += ` -tune ${presetConfig.tuning}`;
            }
            
            // HDR metadata preservation si 4K
            if (this.metadata.video.resolution === '4k') {
                command += ` -x265-params "hdr-opt=1:repeat-headers=1"`;
            }
        } else if (targetVideoCodec === 'h264') {
            command += ` -c:v libx264`;
            command += ` -crf ${presetConfig.videoCRF}`;
            command += ` -preset ${presetConfig.videoPreset}`;
        }
        
        // Options audio
        const targetAudioCodec = CodecDatabase.recommendAudioCodec(
            this.metadata.audio.codec,
            this.metadata.audio.channels,
            this.preset
        );
        
        if (targetAudioCodec === 'aac') {
            command += ` -c:a aac`;
            const bitrate = this.getTargetAudioBitrate(
                targetAudioCodec,
                this.metadata.audio.channels,
                presetConfig
            );
            if (bitrate) {
                command += ` -b:a ${bitrate}k`;
            }
        } else if (targetAudioCodec === 'ac3') {
            command += ` -c:a ac3`;
            command += ` -b:a 640k`;
        } else if (targetAudioCodec === 'eac3') {
            command += ` -c:a eac3`;
            command += ` -b:a 384k`;
        }
        
        // Gestion des sous-titres pour compatibilité universelle
        if (this.metadata.subtitles && this.metadata.subtitles.length > 0) {
            // Vérifier si tous les sous-titres sont déjà en SRT
            const allSRT = this.metadata.subtitles.every(sub => 
                sub.format.toLowerCase().includes('srt') || sub.format.toLowerCase().includes('subrip')
            );
            
            if (allSRT) {
                // Déjà SRT, juste copier
                command += ` -c:s copy`;
            } else {
                // Convertir en SRT pour compatibilité universelle
                command += ` -c:s srt`;
            }
        }
        
        // Options générales
        command += ` -movflags +faststart`; // Optimisation streaming
        
        command += ` "${output}"`;
        
        this.ffmpegCommand = command;
        return command;
    }

    /**
     * Génère le nom du fichier de sortie
     */
    generateOutputFilename(input) {
        const parts = input.split('.');
        const ext = parts.pop();
        const name = parts.join('.');
        
        // Container optimal selon config
        const presetConfig = this.getConfig();
        const container = presetConfig.container || (presetConfig.videoCodec === 'h265' ? 'mkv' : 'mp4');
        
        return `${name}_optimized.${container}`;
    }

    /**
     * Génère l'explication de la commande
     */
    generateCommandExplanation() {
        const explanations = [];
        
        explanations.push({
            param: '-i "input"',
            description: 'Fichier d\'entrée'
        });
        
        // Explications vidéo
        const targetVideoCodec = CodecDatabase.recommendVideoCodec(
            this.metadata.video.codec,
            this.metadata.video.resolution,
            this.preset
        );
        
        if (targetVideoCodec === 'h265') {
            explanations.push({
                param: '-c:v libx265',
                description: 'Encodage vidéo en H.265/HEVC'
            });
        } else {
            explanations.push({
                param: '-c:v libx264',
                description: 'Encodage vidéo en H.264/AVC'
            });
        }
        
        const presetConfig = this.getConfig();
        
        explanations.push({
            param: `-crf ${presetConfig.videoCRF}`,
            description: `Qualité constante: ${this.getCRFDescription(presetConfig.videoCRF)}`
        });
        
        explanations.push({
            param: `-preset ${presetConfig.videoPreset}`,
            description: `Vitesse d'encodage: ${presetConfig.videoPreset}`
        });
        
        // Explications audio
        const targetAudioCodec = CodecDatabase.recommendAudioCodec(
            this.metadata.audio.codec,
            this.metadata.audio.channels,
            this.preset
        );
        
        explanations.push({
            param: `-c:a ${targetAudioCodec}`,
            description: `Encodage audio en ${CodecDatabase.audio[targetAudioCodec].name}`
        });
        
        explanations.push({
            param: '-movflags +faststart',
            description: 'Optimisation pour streaming web'
        });
        
        return explanations;
    }

    /**
     * Estime la taille du fichier final
     */
    estimateOutputSize() {
        const presetConfig = this.getConfig();
        const originalSize = this.metadata.size;
        
        // Application du facteur d'efficacité du preset
        this.estimatedSize = Math.round(originalSize * presetConfig.targetEfficiency);
        
        return {
            original: originalSize,
            optimized: this.estimatedSize,
            saved: originalSize - this.estimatedSize,
            percentage: Math.round((1 - presetConfig.targetEfficiency) * 100)
        };
    }

    /**
     * Vérifie la compatibilité Plex
     */
    checkPlexCompatibility() {
        const targetVideoCodec = CodecDatabase.recommendVideoCodec(
            this.metadata.video.codec,
            this.metadata.video.resolution,
            this.preset
        );
        
        const targetAudioCodec = CodecDatabase.recommendAudioCodec(
            this.metadata.audio.codec,
            this.metadata.audio.channels,
            this.preset
        );
        
        const videoCompatible = CodecDatabase.video[targetVideoCodec]?.plexCompatible;
        const audioCompatible = CodecDatabase.audio[targetAudioCodec]?.plexCompatible;
        
        return videoCompatible && audioCompatible;
    }

    /**
     * Vérifie si l'accélération GPU est disponible
     */
    checkGPUAcceleration() {
        const targetVideoCodec = CodecDatabase.recommendVideoCodec(
            this.metadata.video.codec,
            this.metadata.video.resolution,
            this.preset
        );
        
        return CodecDatabase.video[targetVideoCodec]?.gpuSupport || false;
    }

    /**
     * Obtient le bitrate audio cible
     */
    getTargetAudioBitrate(codec, channels, presetConfig) {
        const codecInfo = CodecDatabase.audio[codec];
        
        if (!codecInfo || !codecInfo.recommendedBitrate) {
            return null;
        }
        
        // Si preset compression, utiliser bitrate spécifié
        if (presetConfig.audioBitrate) {
            return presetConfig.audioBitrate;
        }
        
        return codecInfo.recommendedBitrate[channels] || 128;
    }

    /**
     * Description d'une valeur CRF
     */
    getCRFDescription(crf) {
        if (crf <= 18) return 'Qualité visuelle quasi-identique';
        if (crf <= 23) return 'Qualité excellente (recommandé)';
        if (crf <= 28) return 'Qualité bonne';
        return 'Qualité acceptable';
    }

    /**
     * Change le preset et recalcule
     */
    setPreset(preset) {
        this.preset = preset;
        this.generateRecommendations();
        this.generateFFmpegCommand();
    }
}

// Export pour utilisation dans d'autres modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = OptimizationEngine;
}
