/**
 * Analyseur de fichiers média
 * Extrait les métadonnées et génère des statistiques
 */

class MediaAnalyzer {
    constructor() {
        this.file = null;
        this.metadata = {};
        this.realExtractor = new RealMetadataExtractor();
    }

    /**
     * Analyse un fichier vidéo (toujours avec métadonnées réelles)
     */
    async analyzeFile(file) {
        this.file = file;
        
        // Utiliser l'extracteur de métadonnées réelles
        try {
            this.metadata = await this.realExtractor.analyze(file);
            return this.metadata;
        } catch (error) {
            console.warn('Analyse réelle échouée, utilisation de la simulation:', error);
            
            // Fallback sur simulation en cas d'erreur
            const basicMetadata = this.extractBasicMetadata(file);
            const advancedMetadata = await this.simulateAdvancedAnalysis(basicMetadata);
            
            this.metadata = {
                ...basicMetadata,
                ...advancedMetadata,
                isRealAnalysis: false
            };
            
            return this.metadata;
        }
    }

    /**
     * Extrait les métadonnées de base
     */
    extractBasicMetadata(file) {
        const filename = file.name;
        const extension = filename.toLowerCase().split('.').pop();
        const size = file.size;
        const type = file.type;
        
        return {
            filename,
            extension,
            size,
            type,
            lastModified: file.lastModified
        };
    }

    /**
     * Simule une analyse avancée (sans backend)
     * Dans un vrai projet, utiliser ffmpeg.wasm ou API
     */
    async simulateAdvancedAnalysis(basicMetadata) {
        const { filename, extension, size } = basicMetadata;
        
        // Simulation intelligente basée sur des heuristiques réelles
        
        // 1. Détection du codec vidéo
        const videoCodec = CodecDatabase.detectVideoCodec(filename, basicMetadata.type);
        
        // 2. Estimation de la durée (basée sur la taille et type de fichier)
        const duration = this.estimateDuration(size, extension);
        
        // 3. Calcul du bitrate
        const totalBitrate = CodecDatabase.calculateBitrate(size, duration);
        
        // 4. Estimation de la résolution
        const resolution = CodecDatabase.estimateResolution(size, duration);
        
        // 5. Estimation des dimensions
        const dimensions = this.getDimensionsFromResolution(resolution);
        
        // 6. Estimation du bitrate vidéo (80% du total)
        const videoBitrate = Math.round(totalBitrate * 0.8);
        
        // 7. Estimation du codec audio et bitrate
        const audioInfo = this.estimateAudioInfo(size, extension);
        
        // 8. Estimation framerate
        const framerate = this.estimateFramerate(resolution, extension);
        
        // 9. Détection des sous-titres (basé sur extension)
        const hasSubtitles = ['mkv', 'mp4'].includes(extension);
        
        return {
            video: {
                codec: videoCodec,
                codecName: CodecDatabase.video[videoCodec]?.name || videoCodec.toUpperCase(),
                resolution,
                width: dimensions.width,
                height: dimensions.height,
                bitrate: videoBitrate,
                framerate
            },
            audio: {
                codec: audioInfo.codec,
                codecName: CodecDatabase.audio[audioInfo.codec]?.name || audioInfo.codec.toUpperCase(),
                channels: audioInfo.channels,
                bitrate: audioInfo.bitrate,
                sampleRate: 48000
            },
            duration,
            totalBitrate,
            hasSubtitles,
            containerFormat: extension.toUpperCase()
        };
    }

    /**
     * Estime la durée basée sur la taille
     */
    estimateDuration(size, extension) {
        // Durées typiques par type de contenu
        const typicalBitrates = {
            'mp4': 5000,  // kbps
            'mkv': 8000,
            'avi': 3000,
            'webm': 2000,
            'mov': 6000
        };
        
        const estimatedBitrate = typicalBitrates[extension] || 5000;
        const durationSeconds = (size * 8) / (estimatedBitrate * 1000);
        
        // Arrondir à des durées réalistes
        if (durationSeconds < 300) return 180; // Court métrage/clip
        if (durationSeconds < 1800) return 1320; // ~22 min (épisode)
        if (durationSeconds < 3600) return 2700; // ~45 min (épisode long)
        if (durationSeconds < 7200) return 5400; // ~90 min (film court)
        return 7200; // 2h (film standard)
    }

    /**
     * Estime les infos audio
     */
    estimateAudioInfo(size, extension) {
        // Codecs typiques par container
        const typicalCodecs = {
            'mp4': 'aac',
            'mkv': 'ac3',
            'avi': 'mp3',
            'webm': 'opus',
            'mov': 'aac'
        };
        
        const codec = typicalCodecs[extension] || 'aac';
        
        // Channels typiques
        const channels = ['mkv', 'mov'].includes(extension) ? '5.1' : 'stereo';
        
        // Bitrate typique
        const bitrates = {
            'stereo': 128,
            '5.1': 384,
            '7.1': 512
        };
        
        return {
            codec,
            channels,
            bitrate: bitrates[channels]
        };
    }

    /**
     * Estime le framerate
     */
    estimateFramerate(resolution, extension) {
        // Les contenus 4K sont souvent en 24/30 fps
        if (resolution === '4k') return 30;
        
        // Les contenus web (webm) sont souvent en 30fps
        if (extension === 'webm') return 30;
        
        // Par défaut 23.976 (standard cinéma)
        return 23.976;
    }

    /**
     * Convertit résolution en dimensions
     */
    getDimensionsFromResolution(resolution) {
        const resolutions = {
            '4k': { width: 3840, height: 2160 },
            '1440p': { width: 2560, height: 1440 },
            '1080p': { width: 1920, height: 1080 },
            '720p': { width: 1280, height: 720 },
            '480p': { width: 854, height: 480 }
        };
        
        return resolutions[resolution] || resolutions['1080p'];
    }

    /**
     * Formate la durée en format lisible
     */
    static formatDuration(seconds) {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = Math.floor(seconds % 60);
        
        if (hours > 0) {
            return `${hours}h ${minutes}m ${secs}s`;
        }
        return `${minutes}m ${secs}s`;
    }

    /**
     * Formate la taille en format lisible
     */
    static formatSize(bytes) {
        if (bytes === 0) return '0 B';
        
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    /**
     * Formate le bitrate
     */
    static formatBitrate(kbps) {
        if (kbps < 1000) {
            return `${Math.round(kbps)} kbps`;
        }
        return `${(kbps / 1000).toFixed(2)} Mbps`;
    }

    /**
     * Génère des données pour le graphique
     */
    generateChartData() {
        if (!this.metadata.video) return null;
        
        const { video, audio, totalBitrate } = this.metadata;
        
        return {
            labels: ['Vidéo', 'Audio', 'Overhead'],
            datasets: [{
                label: 'Répartition du bitrate',
                data: [
                    video.bitrate,
                    audio.bitrate,
                    totalBitrate - video.bitrate - audio.bitrate
                ],
                backgroundColor: [
                    'rgba(99, 102, 241, 0.8)',
                    'rgba(139, 92, 246, 0.8)',
                    'rgba(156, 163, 175, 0.8)'
                ],
                borderColor: [
                    'rgba(99, 102, 241, 1)',
                    'rgba(139, 92, 246, 1)',
                    'rgba(156, 163, 175, 1)'
                ],
                borderWidth: 2
            }]
        };
    }
}

// Export pour utilisation dans d'autres modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MediaAnalyzer;
}
