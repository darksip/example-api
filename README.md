# Halapi Demo

Application React de démonstration pour l'API Halapi - un assistant conversationnel spécialisé dans les recommandations de livres et de musique.

## Fonctionnalités

- **Chat en temps réel** avec streaming SSE (Server-Sent Events)
- **Recommandations de livres** avec couvertures, auteurs, descriptions et sujets
- **Recommandations musicales** avec albums, pistes, pochettes et métadonnées complètes
- **Suggestions interactives** sous forme de boutons pour continuer la conversation
- **Indicateurs d'outils** affichant le statut des appels d'outils en temps réel
- **Rendu Markdown** avec support GitHub Flavored Markdown (GFM)
- **Historique des conversations** avec possibilité de reprendre une discussion
- **Métadonnées détaillées** : agent utilisé, modèle, temps d'exécution, tokens consommés

## Prérequis

- Node.js 18+
- npm ou pnpm
- Un token API Halapi (`hap_sk_live_...`)

## Installation

```bash
# Cloner le repository
git clone <repository-url>
cd example-halapi

# Installer les dépendances
npm install

# Configurer l'environnement
cp .env.example .env
```

Éditer le fichier `.env` avec votre token API :

```env
VITE_HALAPI_PROXY_TARGET=https://haldev.cybermeet.fr
VITE_HALAPI_TOKEN=hap_sk_live_votre_token_ici
```

## Démarrage

```bash
# Mode développement avec hot reload
npm run dev

# Build de production
npm run build

# Prévisualisation du build
npm run preview
```

L'application sera accessible sur `http://localhost:5173`.

## Scripts disponibles

| Script | Description |
|--------|-------------|
| `npm run dev` | Serveur de développement Vite |
| `npm run build` | Vérification TypeScript + build production |
| `npm run preview` | Prévisualisation du build de production |
| `npm run lint` | Vérification du code avec Biome |
| `npm run lint:fix` | Correction automatique des erreurs de lint |
| `npm run format` | Formatage du code avec Biome |
| `npm run check` | Vérification complète Biome (lint + format) |
| `npm run check:fix` | Correction automatique complète |
| `npm run typecheck` | Vérification des types TypeScript |

## Structure du projet

```
src/
├── components/
│   ├── BookCard.tsx          # Carte de recommandation de livre
│   ├── ChatInput.tsx         # Zone de saisie du chat
│   ├── ChatMessage.tsx       # Message avec markdown et artifacts
│   ├── ConversationItem.tsx  # Élément de liste des conversations
│   ├── Layout.tsx            # Layout principal avec navigation
│   └── MusicCard.tsx         # Carte album ou piste musicale
├── config/
│   └── api.ts                # Configuration API depuis les variables d'env
├── hooks/
│   ├── useChat.ts            # Gestion du chat avec streaming
│   └── useConversations.ts   # Récupération des conversations
├── pages/
│   ├── ChatPage.tsx          # Page principale de chat
│   └── ConversationsPage.tsx # Liste des conversations passées
├── services/
│   └── halapi.ts             # Client API avec streaming SSE
├── types/
│   └── halapi.ts             # Types TypeScript pour l'API
├── App.tsx                   # Composant racine avec routing
├── main.tsx                  # Point d'entrée React
└── index.css                 # Styles globaux (thème sombre)
```

## Architecture

### Flux de données

```
┌─────────────────┐     ┌──────────────┐     ┌─────────────┐
│    ChatPage     │────▶│   useChat    │────▶│   halapi    │
│                 │◀────│    hook      │◀────│   service   │
└─────────────────┘     └──────────────┘     └─────────────┘
         │                     │                    │
         │                     │                    ▼
         │                     │            ┌─────────────┐
         │                     │            │  API Halapi │
         │                     │            │   (SSE)     │
         │                     │            └─────────────┘
         ▼                     ▼
┌─────────────────┐     ┌──────────────┐
│  ChatMessage    │     │   Artifacts  │
│  - Markdown     │     │   - Books    │
│  - ToolCalls    │     │   - Music    │
│  - Suggestions  │     │   - Suggest. │
└─────────────────┘     └──────────────┘
```

### Événements SSE

L'API utilise Server-Sent Events pour le streaming. Types d'événements :

| Événement | Description |
|-----------|-------------|
| `text-delta` | Fragment de texte de la réponse |
| `tool-call` | Début d'exécution d'un outil |
| `tool-result` | Résultat de l'exécution d'un outil |
| `artifacts` | Livres, musiques et suggestions |
| `cost` | Résumé des coûts |
| `done` | Fin du message avec statistiques |
| `error` | Erreur serveur |

### Indicateurs d'outils

Les appels d'outils sont représentés par des points colorés :
- 🔵 **Bleu** (pulsant) : En cours d'exécution
- 🟢 **Vert** : Succès
- 🔴 **Rouge** : Erreur

## Configuration

### Variables d'environnement

| Variable | Description | Requis |
|----------|-------------|--------|
| `VITE_HALAPI_TOKEN` | Token d'authentification API | ✅ Oui |
| `VITE_HALAPI_PROXY_TARGET` | URL cible du proxy en dev | Non (défaut: `https://haldev.cybermeet.fr`) |
| `VITE_HALAPI_URL` | URL API en production | En prod uniquement |

### Proxy de développement

En développement, Vite proxy les requêtes `/api/halap/*` vers `VITE_HALAPI_PROXY_TARGET`. Cela évite les problèmes CORS et permet de déboguer les requêtes.

## Types principaux

### Message

```typescript
interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  artifacts?: Artifacts
  toolCalls?: ToolCall[]
  isStreaming?: boolean
  // Métadonnées (réponses assistant uniquement)
  agentUsed?: string
  modelUsed?: string
  executionTimeMs?: number
  inputTokens?: number
  outputTokens?: number
}
```

### Artifacts

```typescript
interface Artifacts {
  books: Book[]
  music: Music[]
  suggestions?: Suggestion[]
}
```

### Book

```typescript
interface Book {
  title: string
  author: string
  year?: number
  isbn?: string
  description?: string
  coverUrl?: string
  subjects?: string[]
}
```

### Music

> **Note** : L'API peut renvoyer les données avec différents noms de champs. Les types incluent des fallbacks pour gérer ces variations.

```typescript
// Album
interface MusicAlbum {
  type: 'album'
  cb?: string
  // Titre (champs alternatifs)
  title?: string
  album?: string
  // Artiste (champs alternatifs)
  artist?: string
  artist_name?: string
  artiste?: string
  year?: number
  label?: string
  street_date?: string
  // Cover (champs alternatifs)
  coverUrl?: string
  imageUrl?: string
  albumImageUrl?: string
  tracks?: MusicTrack[]
  genres?: string[]
}

// Piste
interface MusicTrackItem {
  type: 'track'
  cb?: string
  cb_track_id?: string
  // Titre (champs alternatifs)
  title: string
  track?: string
  // Artiste (champs alternatifs)
  artist: string
  artist_name?: string
  artiste?: string
  // Album (champs alternatifs)
  album?: string
  album_name?: string
  year?: number
  duration?: number
  timing?: number
  num_disc?: number
  num_track?: number
  label?: string
  street_date?: string
  // Cover (champs alternatifs)
  coverUrl?: string
  imageUrl?: string
  albumImageUrl?: string
}
```

## Stack technique

| Technologie | Version | Usage |
|-------------|---------|-------|
| React | 18.3 | Bibliothèque UI |
| TypeScript | 5.6 | Typage statique |
| Vite | 6.0 | Build et dev server |
| Biome | 2.3 | Linting et formatage |
| react-markdown | 10.1 | Rendu Markdown |
| remark-gfm | 4.0 | Support GFM |

## Qualité du code

Le projet utilise une configuration stricte :

- **TypeScript strict** : Toutes les options strictes activées
- **Biome** : Linting et formatage automatiques
- **Pas de `any`** : Types explicites partout
- **Type guards** : Discrimination des unions pour les types Music

## Licence

MIT
