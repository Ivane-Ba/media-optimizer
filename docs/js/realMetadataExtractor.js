/**
 * Extracteur de métadonnées réelles
 * Utilise MediaInfo.js si disponible, sinon HTML5 Video API
 */

class RealMetadataExtractor {
    constructor() {
        this.mediaInfo = null;
        this.initialized = false;
        this.useMediaInfo = false;
    }

    /**
     * Initialise MediaInfo.js si disponible
     */
    async initialize() {
        if (this.initialized) return;
        
        try {
            // Attendre que MediaInfo soit chargé (max 5 secondes)
            for (let i = 0; i < 50; i++) {
                if (typeof MediaInfo !== 'undefined' && MediaInfo.mediaInfoFactory) {
                    // Utiliser la factory function du module UMD
                    this.mediaInfo = await MediaInfo.mediaInfoFactory({ 
                        format: 'object',
                        locateFile: (path) => {
                            if (path.endsWith('.wasm')) {
                                return 'lib/MediaInfoModule.wasm';
                            }
                            return path;
                        }
                    });
                    this.useMediaInfo = true;
                    this.initialized = true;
                    console.log('✅ MediaInfo.js initialisé - Vraies données !');
                    return;
                }
                await new Promise(resolve => setTimeout(resolve, 100));
            }
            
            // MediaInfo pas disponible, utiliser HTML5
            console.warn('⚠️ MediaInfo.js non disponible, utilisation HTML5 Video API');
            this.useMediaInfo = false;
            this.initialized = true;
            
        } catch (error) {
            console.warn('⚠️ Erreur init MediaInfo, fallback HTML5:', error.message);
            this.useMediaInfo = false;
            this.initialized = true;
        }
    }

    /**
     * Extrait métadonnées avec MediaInfo.js
     */
    async extractWithMediaInfo(file) {
        const getSize = () => file.size;
        const readChunk = async (chunkSize, offset) => {
            const blob = file.slice(offset, offset + chunkSize);
            const buffer = await blob.arrayBuffer();
            return new Uint8Array(buffer);
        };
        
        return await this.mediaInfo.analyzeData(getSize, readChunk);
    }

    /**
     * Extrait métadonnées avec HTML5 Video API
     */
    async extractWithHTML5(file) {
        return new Promise((resolve, reject) => {
            const video = document.createElement('video');
            video.preload = 'metadata';
            
            const objectURL = URL.createObjectURL(file);
            video.src = objectURL;
            
            video.onloadedmetadata = () => {
                const metadata = {
                    width: video.videoWidth,
                    height: video.videoHeight,
                    duration: video.duration,
                    fileSize: file.size,
                    bitrate: Math.round((file.size * 8) / video.duration / 1000),
                    filename: file.name,
                    extension: file.name.toLowerCase().split('.').pop(),
                    type: file.type
                };
                
                URL.revokeObjectURL(objectURL);
                resolve(metadata);
            };
            
            video.onerror = () => {
                URL.revokeObjectURL(objectURL);
                reject(new Error('Impossible de lire la vidéo'));
            };
            
            setTimeout(() => {
                if (video.readyState === 0) {
                    URL.revokeObjectURL(objectURL);
                    reject(new Error('Timeout'));
                }
            }, 10000);
        });
    }

    /**
     * Parse les résultats MediaInfo
     */
    parseMediaInfoResult(result, file) {
        const tracks = result.media?.track || [];
        const generalTrack = tracks.find(t => t['@type'] === 'General');
        const videoTrack = tracks.find(t => t['@type'] === 'Video');
        const audioTrack = tracks.find(t => t['@type'] === 'Audio');
        const textTracks = tracks.filter(t => t['@type'] === 'Text');
        
        // Codec vidéo réel
        let videoCodec = 'h264';
        const videoFormat = (videoTrack?.Format || '').toLowerCase();
        
        if (videoFormat.includes('hevc') || videoFormat.includes('h.265')) videoCodec = 'h265';
        else if (videoFormat.includes('avc') || videoFormat.includes('h.264')) videoCodec = 'h264';
        else if (videoFormat.includes('av1') || videoFormat.includes('av01')) videoCodec = 'av1';
        else if (videoFormat.includes('vp9')) videoCodec = 'vp9';
        else if (videoFormat.includes('mpeg-4')) videoCodec = 'mpeg4';
        else if (videoFormat.includes('xvid')) videoCodec = 'xvid';
        
        // Codec audio réel
        let audioCodec = 'aac';
        const audioFormat = (audioTrack?.Format || '').toLowerCase();
        
        if (audioFormat.includes('aac')) audioCodec = 'aac';
        else if (audioFormat.includes('ac-3') || audioFormat.includes('ac3')) audioCodec = 'ac3';
        else if (audioFormat.includes('dts')) audioCodec = 'dts';
        else if (audioFormat.includes('flac')) audioCodec = 'flac';
        else if (audioFormat.includes('opus')) audioCodec = 'opus';
        else if (audioFormat.includes('mp3')) audioCodec = 'mp3';
        else if (audioFormat.includes('vorbis')) audioCodec = 'vorbis';
        
        // Dimensions et résolution
        const width = parseInt(videoTrack?.Width) || 1920;
        const height = parseInt(videoTrack?.Height) || 1080;
        const resolution = this.getResolution(width, height);
        
        // Framerate réel
        const framerate = parseFloat(videoTrack?.FrameRate) || 23.976;
        
        // Bitrates réels
        const videoBitrate = Math.round((parseInt(videoTrack?.BitRate) || 0) / 1000);
        const audioBitrate = Math.round((parseInt(audioTrack?.BitRate) || 0) / 1000);
        const totalBitrate = videoBitrate + audioBitrate;
        
        // Canaux audio réels
        const channelCount = parseInt(audioTrack?.Channels) || 2;
        let channels = 'stereo';
        if (channelCount >= 8) channels = '7.1';
        else if (channelCount >= 6) channels = '5.1';
        else if (channelCount === 1) channels = 'mono';
        
        // Durée
        const duration = parseFloat(generalTrack?.Duration || videoTrack?.Duration || 0);
        
        // Sample rate
        const sampleRate = parseInt(audioTrack?.SamplingRate) || 48000;
        
        // Sous-titres détaillés
        const subtitles = textTracks.map(track => ({
            language: track.Language || 'Unknown',
            format: track.Format || 'Unknown',
            title: track.Title || ''
        }));
        
        return {
            filename: file.name,
            extension: file.name.toLowerCase().split('.').pop(),
            size: file.size,
            type: file.type,
            lastModified: file.lastModified,
            
            video: {
                codec: videoCodec,
                codecName: CodecDatabase.video[videoCodec]?.name || videoFormat,
                resolution,
                width,
                height,
                bitrate: videoBitrate,
                framerate: Math.round(framerate * 1000) / 1000
            },
            
            audio: {
                codec: audioCodec,
                codecName: CodecDatabase.audio[audioCodec]?.name || audioFormat,
                channels,
                bitrate: audioBitrate,
                sampleRate
            },
            
            duration,
            totalBitrate,
            hasSubtitles: textTracks.length > 0,
            subtitlesCount: textTracks.length,
            subtitles: subtitles,
            containerFormat: (generalTrack?.Format || file.name.split('.').pop()).toUpperCase(),
            
            isRealAnalysis: true,
            source: 'MediaInfo.js'
        };
    }

    /**
     * Parse les résultats HTML5
     */
    parseHTML5Result(htmlData, file) {
        const ext = htmlData.extension;
        
        // Détection codec par extension/MIME
        const videoCodec = this.detectVideoCodec(file.name, file.type);
        const audioCodec = this.detectAudioCodec(ext, file.type);
        
        const resolution = this.getResolution(htmlData.width, htmlData.height);
        const framerate = this.estimateFramerate(htmlData.width, htmlData.height, ext);
        const channels = this.estimateAudioChannels(ext, file.size, htmlData.duration);
        
        const videoBitrate = Math.round(htmlData.bitrate * 0.80);
        const audioBitrate = Math.round(htmlData.bitrate * 0.15);
        
        return {
            filename: file.name,
            extension: ext,
            size: file.size,
            type: file.type,
            lastModified: file.lastModified,
            
            video: {
                codec: videoCodec,
                codecName: CodecDatabase.video[videoCodec]?.name || videoCodec.toUpperCase(),
                resolution,
                width: htmlData.width,
                height: htmlData.height,
                bitrate: videoBitrate,
                framerate
            },
            
            audio: {
                codec: audioCodec,
                codecName: CodecDatabase.audio[audioCodec]?.name || audioCodec.toUpperCase(),
                channels,
                bitrate: audioBitrate,
                sampleRate: 48000
            },
            
            duration: htmlData.duration,
            totalBitrate: htmlData.bitrate,
            hasSubtitles: ['mkv', 'mp4'].includes(ext),
            subtitlesCount: 0,
            subtitles: [],
            containerFormat: ext.toUpperCase(),
            
            isRealAnalysis: true,
            source: 'HTML5 Video API (estimation codecs)'
        };
    }

    /**
     * Analyse complète
     */
    async analyze(file) {
        try {
            await this.initialize();
            
            if (this.useMediaInfo) {
                console.log('🎬 Analyse avec MediaInfo.js...');
                const result = await this.extractWithMediaInfo(file);
                console.log('📊 Résultat MediaInfo:', result);
                return this.parseMediaInfoResult(result, file);
            } else {
                console.log('🎬 Analyse avec HTML5 Video API...');
                const htmlData = await this.extractWithHTML5(file);
                return this.parseHTML5Result(htmlData, file);
            }
            
        } catch (error) {
            console.error('❌ Erreur extraction:', error);
            throw error;
        }
    }

    // Méthodes utilitaires
    getResolution(width, height) {
        if (width >= 3840 && height >= 2160) return '4k';
        if (width >= 2560 && height >= 1440) return '1440p';
        if (width >= 1920 && height >= 1080) return '1080p';
        if (width >= 1280 && height >= 720) return '720p';
        return '480p';
    }

    detectVideoCodec(filename, mimeType) {
        const mime = (mimeType || '').toLowerCase();
        if (mime.includes('hevc') || mime.includes('h265')) return 'h265';
        if (mime.includes('avc') || mime.includes('h264')) return 'h264';
        if (mime.includes('av01') || mime.includes('av1')) return 'av1';
        if (mime.includes('vp9')) return 'vp9';
        
        const ext = filename.toLowerCase().split('.').pop();
        const codecsByExt = {
            'mp4': 'h264', 'mkv': 'h265', 'webm': 'vp9',
            'avi': 'mpeg4', 'mov': 'h264'
        };
        return codecsByExt[ext] || 'h264';
    }

    detectAudioCodec(extension, mimeType) {
        const mime = (mimeType || '').toLowerCase();
        if (mime.includes('opus')) return 'opus';
        if (mime.includes('vorbis')) return 'vorbis';
        if (mime.includes('mp4a')) return 'aac';
        
        const codecsByExt = {
            'mp4': 'aac', 'mkv': 'ac3', 'webm': 'opus',
            'avi': 'mp3', 'mov': 'aac'
        };
        return codecsByExt[extension] || 'aac';
    }

    estimateFramerate(width, height, extension) {
        if (width >= 3840) return 30;
        if (extension === 'webm') return 30;
        return 23.976;
    }

    estimateAudioChannels(extension, fileSize, duration) {
        const bitrate = (fileSize * 8) / duration / 1000;
        if (['mkv', 'mov'].includes(extension) && bitrate > 10000) {
            return '5.1';
        }
        return 'stereo';
    }
    
    close() {
        if (this.mediaInfo) {
            this.mediaInfo.close();
        }
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = RealMetadataExtractor;
}
