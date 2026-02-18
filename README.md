# Media Optimizer

Outil web pour analyser et optimiser des fichiers vidéo. Génère des commandes FFmpeg prêtes à l'emploi.

## Fonctionnalités

- **Analyse précise** : Utilise MediaInfo.js pour extraire les métadonnées réelles (codecs, bitrate, résolution, pistes audio/sous-titres)
- **Profils d'optimisation** : 10 profils préconfigurés (Plex 4K/1080p, Mobile, NAS, YouTube, Apple TV, Équilibré, Qualité Max, Compression Max, Anime)
- **Comparaison** : Compare jusqu'à 3 profils côte à côte pour choisir le meilleur compromis
- **Mode batch** : Traite plusieurs fichiers en une fois, génère des scripts .sh/.ps1 et exports CSV
- **100% frontend** : Aucun serveur requis, déployable sur GitHub Pages

## Utilisation

1. Glisser-déposer un ou plusieurs fichiers vidéo
2. Choisir un profil d'optimisation
3. Copier la commande FFmpeg générée
4. Lancer l'encodage avec FFmpeg

### Comparaison de profils

Après avoir uploadé un fichier, cliquez sur "Comparer d'autres profils" pour voir les différences de taille, codec et qualité entre plusieurs profils.

### Mode batch

Pour plusieurs fichiers :
- Sélectionnez plusieurs vidéos d'un coup
- Consultez le tableau récapitulatif
- Téléchargez le script bash/PowerShell ou l'export CSV

## Installation locale

```bash
git clone https://github.com/Ivane-Ba/media-optimizer.git
cd media-optimizer
python3 -m http.server 8000
```

Ouvrez `http://localhost:8000`

## Technologies

- **MediaInfo.js** (WebAssembly) : Extraction des métadonnées
- **Chart.js** : Visualisation des bitrates
- Vanilla JavaScript (ES6+)
- CSS moderne (variables CSS, grid, flexbox)

## Structure des profils

Chaque profil définit :
- Codec vidéo (H.264, H.265, AV1)
- CRF et preset d'encodage
- Codec audio et bitrate
- Container (MKV, MP4)
- Optimisations sous-titres (conversion SRT)

## Compatibilité

- Plex Media Server
- Serveurs NAS (Synology, QNAP)
- Plateformes de streaming (YouTube, Vimeo)
- Appareils mobiles (iOS, Android)
- Apple TV, lecteurs web

## Développement

Fichiers principaux :
- `js/mediaAnalyzer.js` : Orchestration de l'analyse
- `js/realMetadataExtractor.js` : Extraction via MediaInfo.js
- `js/optimizationEngine.js` : Génération des recommandations
- `js/codecDatabase.js` : Base de données des codecs et profils
- `js/batchManager.js` : Gestion du mode batch
- `js/app.js` : Interface utilisateur

## Déploiement

Compatible avec :
- GitHub Pages
- Netlify
- Vercel
- N'importe quel hébergement statique

Aucune configuration serveur nécessaire. Les fichiers MediaInfo.js sont inclus localement (`lib/`).

## Licence

MIT

## Auteur

Développé par [Ivane-Ba](https://github.com/Ivane-Ba)
