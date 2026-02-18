/**
 * Base de connaissance des codecs et standards d'encodage
 */

const CodecDatabase = {
    video: {
        h264: {
            name: 'H.264 (AVC)',
            efficiency: 1.0,
            quality: 'Bonne',
            compatibility: 'Universelle',
            gpuSupport: true,
            plexCompatible: true,
            avgBitrate: {
                '480p': 1500,
                '720p': 3000,
                '1080p': 5000,
                '1440p': 9000,
                '4k': 18000
            }
        },
        h265: {
            name: 'H.265 (HEVC)',
            efficiency: 1.8,
            quality: 'Excellente',
            compatibility: 'Moderne',
            gpuSupport: true,
            plexCompatible: true,
            avgBitrate: {
                '480p': 800,
                '720p': 1800,
                '1080p': 3000,
                '1440p': 5500,
                '4k': 10000
            }
        },
        vp9: {
            name: 'VP9',
            efficiency: 1.7,
            quality: 'Excellente',
            compatibility: 'Web',
            gpuSupport: false,
            plexCompatible: true,
            avgBitrate: {
                '480p': 900,
                '720p': 2000,
                '1080p': 3500,
                '1440p': 6000,
                '4k': 11000
            }
        },
        av1: {
            name: 'AV1',
            efficiency: 2.2,
            quality: 'Optimale',
            compatibility: 'Très récente',
            gpuSupport: false,
            plexCompatible: false,
            avgBitrate: {
                '480p': 700,
                '720p': 1500,
                '1080p': 2500,
                '1440p': 4500,
                '4k': 8000
            }
        },
        mpeg2: {
            name: 'MPEG-2',
            efficiency: 0.5,
            quality: 'Moyenne',
            compatibility: 'Ancienne',
            gpuSupport: false,
            plexCompatible: true,
            avgBitrate: {
                '480p': 3000,
                '720p': 6000,
                '1080p': 10000,
                '1440p': 18000,
                '4k': 35000
            }
        },
        mpeg4: {
            name: 'MPEG-4',
            efficiency: 0.8,
            quality: 'Correcte',
            compatibility: 'Standard',
            gpuSupport: false,
            plexCompatible: true,
            avgBitrate: {
                '480p': 2000,
                '720p': 4000,
                '1080p': 7000,
                '1440p': 12000,
                '4k': 25000
            }
        },
        xvid: {
            name: 'Xvid',
            efficiency: 0.8,
            quality: 'Correcte',
            compatibility: 'Ancienne',
            gpuSupport: false,
            plexCompatible: true,
            avgBitrate: {
                '480p': 2000,
                '720p': 4000,
                '1080p': 7000,
                '1440p': 12000,
                '4k': 25000
            }
        }
    },

    audio: {
        aac: {
            name: 'AAC',
            efficiency: 1.0,
            quality: 'Bonne',
            plexCompatible: true,
            recommendedBitrate: {
                stereo: 128,
                '5.1': 384,
                '7.1': 512
            }
        },
        ac3: {
            name: 'AC-3 (Dolby Digital)',
            efficiency: 0.8,
            quality: 'Bonne',
            plexCompatible: true,
            recommendedBitrate: {
                stereo: 192,
                '5.1': 448,
                '7.1': 640
            }
        },
        eac3: {
            name: 'E-AC-3 (Dolby Digital Plus)',
            efficiency: 1.2,
            quality: 'Excellente',
            plexCompatible: true,
            recommendedBitrate: {
                stereo: 128,
                '5.1': 384,
                '7.1': 512
            }
        },
        dts: {
            name: 'DTS',
            efficiency: 0.7,
            quality: 'Excellente',
            plexCompatible: true,
            recommendedBitrate: {
                stereo: 768,
                '5.1': 1536,
                '7.1': 2048
            }
        },
        flac: {
            name: 'FLAC (Lossless)',
            efficiency: 0.5,
            quality: 'Parfaite',
            plexCompatible: true,
            lossless: true,
            recommendedBitrate: null
        },
        opus: {
            name: 'Opus',
            efficiency: 1.5,
            quality: 'Excellente',
            plexCompatible: false,
            recommendedBitrate: {
                stereo: 96,
                '5.1': 256,
                '7.1': 384
            }
        },
        mp3: {
            name: 'MP3',
            efficiency: 0.7,
            quality: 'Moyenne',
            plexCompatible: true,
            recommendedBitrate: {
                stereo: 192,
                '5.1': null,
                '7.1': null
            }
        },
        vorbis: {
            name: 'Vorbis',
            efficiency: 1.3,
            quality: 'Bonne',
            plexCompatible: false,
            recommendedBitrate: {
                stereo: 128,
                '5.1': 320,
                '7.1': 448
            }
        }
    },

    subtitles: {
        srt: {
            name: 'SubRip (SRT)',
            type: 'text',
            plexCompatible: true,
            size: 'minimal'
        },
        ass: {
            name: 'Advanced SubStation Alpha',
            type: 'text',
            plexCompatible: true,
            size: 'minimal'
        },
        pgs: {
            name: 'PGS (Blu-ray)',
            type: 'image',
            plexCompatible: true,
            size: 'large'
        },
        vobsub: {
            name: 'VobSub (DVD)',
            type: 'image',
            plexCompatible: true,
            size: 'medium'
        }
    },

    // Profils d'optimisation (appareil + usage)
    deviceProfiles: {
        // Profils appareil
        'plex-4k': {
            name: 'Plex 4K HDR',
            icon: 'fa-server',
            description: 'Lecture directe 4K',
            category: 'device',
            videoCodec: 'h265',
            videoCRF: 20,
            videoPreset: 'slow',
            audioCodec: 'eac3',
            audioBitrate: 640,
            container: 'mkv',
            maxBitrate: 15000,
            targetEfficiency: 0.65
        },
        'plex-1080p': {
            name: 'Plex 1080p',
            icon: 'fa-tv',
            description: 'Équilibré Plex',
            category: 'device',
            videoCodec: 'h265',
            videoCRF: 22,
            videoPreset: 'medium',
            audioCodec: 'ac3',
            audioBitrate: 448,
            container: 'mkv',
            maxBitrate: 8000,
            targetEfficiency: 0.5
        },
        'mobile': {
            name: 'Mobile',
            icon: 'fa-mobile-screen',
            description: 'Streaming mobile',
            category: 'device',
            videoCodec: 'h264',
            videoCRF: 24,
            videoPreset: 'fast',
            audioCodec: 'aac',
            audioBitrate: 128,
            container: 'mp4',
            maxBitrate: 3000,
            targetEfficiency: 0.3
        },
        'nas': {
            name: 'NAS',
            icon: 'fa-hard-drive',
            description: 'Stockage compact',
            category: 'device',
            videoCodec: 'h265',
            videoCRF: 26,
            videoPreset: 'slow',
            audioCodec: 'aac',
            audioBitrate: 128,
            container: 'mkv',
            maxBitrate: 5000,
            targetEfficiency: 0.35
        },
        'youtube': {
            name: 'YouTube',
            icon: 'fa-youtube',
            description: 'Upload optimisé',
            category: 'device',
            videoCodec: 'h264',
            videoCRF: 21,
            videoPreset: 'slow',
            audioCodec: 'aac',
            audioBitrate: 192,
            container: 'mp4',
            maxBitrate: 10000,
            targetEfficiency: 0.6
        },
        'appletv': {
            name: 'Apple TV',
            icon: 'fa-apple',
            description: 'Apple devices',
            category: 'device',
            videoCodec: 'h264',
            videoCRF: 20,
            videoPreset: 'medium',
            audioCodec: 'aac',
            audioBitrate: 256,
            container: 'mp4',
            maxBitrate: 12000,
            targetEfficiency: 0.6
        },
        // Profils usage (anciens presets)
        'balanced': {
            name: 'Équilibré',
            icon: 'fa-balance-scale',
            description: 'Qualité/Taille',
            category: 'usage',
            videoCodec: 'h265',
            videoCRF: 23,
            videoPreset: 'medium',
            audioCodec: 'aac',
            audioBitrate: null,
            container: 'mkv',
            targetEfficiency: 0.5
        },
        'quality': {
            name: 'Qualité Max',
            icon: 'fa-star',
            description: 'Perte minimale',
            category: 'usage',
            videoCodec: 'h265',
            videoCRF: 18,
            videoPreset: 'slow',
            audioCodec: 'eac3',
            audioBitrate: null,
            container: 'mkv',
            targetEfficiency: 0.7
        },
        'compression': {
            name: 'Compression Max',
            icon: 'fa-compress',
            description: 'Économie max',
            category: 'usage',
            videoCodec: 'h265',
            videoCRF: 28,
            videoPreset: 'medium',
            audioCodec: 'aac',
            audioBitrate: 128,
            container: 'mkv',
            targetEfficiency: 0.3
        },
        'anime': {
            name: 'Anime',
            icon: 'fa-dragon',
            description: 'Animation 2D',
            category: 'usage',
            videoCodec: 'h265',
            videoCRF: 20,
            videoPreset: 'slow',
            audioCodec: 'aac',
            audioBitrate: 192,
            container: 'mkv',
            targetEfficiency: 0.4
        }
    },

    // Alias pour compatibilité (pointe vers deviceProfiles)
    get presets() {
        return {
            balanced: this.deviceProfiles.balanced,
            quality: this.deviceProfiles.quality,
            compression: this.deviceProfiles.compression,
            anime: this.deviceProfiles.anime
        };
    },

    /**
     * Détecte le codec depuis l'extension ou le nom
     */
    detectVideoCodec(filename, mimeType) {
        const ext = filename.toLowerCase().split('.').pop();
        
        // Détection basique par extension
        if (ext === 'mp4' || ext === 'm4v') return 'h264';
        if (ext === 'mkv') return 'h265'; // Souvent HEVC dans MKV
        if (ext === 'webm') return 'vp9';
        if (ext === 'avi') return 'mpeg4';
        if (ext === 'mpg' || ext === 'mpeg') return 'mpeg2';
        
        return 'h264'; // Défaut
    },

    /**
     * Résolution basée sur la taille du fichier
     */
    estimateResolution(fileSize, duration) {
        if (!duration) duration = 3600; // 1h par défaut
        
        const bitrate = (fileSize * 8) / duration / 1000; // kbps
        
        if (bitrate > 15000) return '4k';
        if (bitrate > 8000) return '1440p';
        if (bitrate > 4000) return '1080p';
        if (bitrate > 2000) return '720p';
        return '480p';
    },

    /**
     * Calcule le bitrate moyen
     */
    calculateBitrate(fileSize, duration) {
        if (!duration) duration = 3600;
        return Math.round((fileSize * 8) / duration / 1000); // kbps
    },

    /**
     * Récupère la configuration (preset ou profil d'appareil)
     */
    getConfig(preset) {
        // Vérifier si c'est un profil d'appareil
        if (this.deviceProfiles[preset]) {
            return this.deviceProfiles[preset];
        }
        // Sinon, retourner le preset classique
        return this.presets[preset] || this.presets.balanced;
    },

    /**
     * Recommande un codec cible
     */
    recommendVideoCodec(currentCodec, resolution, preset = 'balanced') {
        // Si déjà en H.265/HEVC avec bon CRF, pas besoin de re-encoder
        if (currentCodec === 'h265' && preset === 'balanced') {
            return currentCodec;
        }
        
        // Pour 4K, privilégier H.265
        if (resolution === '4k' || resolution === '1440p') {
            return 'h265';
        }
        
        // Pour le reste, utiliser le codec de la config
        const config = this.getConfig(preset);
        return config.videoCodec;
    },

    /**
     * Recommande un codec audio
     */
    recommendAudioCodec(currentCodec, channels, preset = 'balanced') {
        const config = this.getConfig(preset);
        
        // Si FLAC (lossless), convertir en lossy
        if (currentCodec === 'flac') {
            return config.audioCodec;
        }
        
        // Si DTS (très gourmand), convertir
        if (currentCodec === 'dts') {
            return 'ac3';
        }
        
        // Sinon garder si compatible
        if (this.audio[currentCodec] && this.audio[currentCodec].plexCompatible) {
            return currentCodec;
        }
        
        return config.audioCodec;
    }
};

// Export pour utilisation dans d'autres modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CodecDatabase;
}
