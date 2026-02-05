# Halapi Demo

> **:warning: AVERTISSEMENT / DISCLAIMER**
>
> Ce projet est une **DEMONSTRATION** et n'est **PAS destiné à un usage en production**.
>
> - Intentionnellement ouvert et permissif pour faciliter l'expérimentation
> - Les fonctionnalités de sécurité sont minimales par conception
> - Ne pas utiliser avec des tokens de production ou des données sensibles

Application React de démonstration pour l'API Halapi - un assistant conversationnel spécialisé dans les recommandations de livres et de musique.

## Fonctionnalités

- **Chat en temps réel** avec streaming SSE (Server-Sent Events)
- **Recommandations de livres** avec couvertures, auteurs, descriptions et sujets
- **Recommandations musicales** avec albums, pistes, pochettes et métadonnées complètes
- **Suggestions interactives** sous forme de boutons pour continuer la conversation
- **Gestion des tokens via UI** : enregistrez votre token API depuis la page Settings
- **Stockage sécurisé** : tokens stockés côté serveur en SQLite, seul un hash est gardé côté client
- **Proxy API** : les requêtes passent par un serveur Hono qui injecte le vrai token
- **Indicateurs d'outils** affichant le statut des appels d'outils en temps réel
- **Rendu Markdown** avec support GitHub Flavored Markdown (GFM)
- **Historique des conversations** avec possibilité de reprendre une discussion
- **Métadonnées détaillées** : agent utilisé, modèle, temps d'exécution, tokens consommés

## Architecture

### Submodule halapi-js

Le projet utilise le SDK [halapi-js](https://github.com/darksip/halapi-js) comme **git submodule**. Ce SDK fournit :

- Client API type-safe pour communiquer avec le backend Halapi
- Types TypeScript pour toutes les structures de données (messages, livres, musique, etc.)
- Utilitaires partagés (génération UUID, etc.)

```
example-halapi/
├── halapi-js/              # Submodule SDK (git submodule)
│   └── src/
│       ├── index.ts        # Exports publics
│       ├── client.ts       # Client API avec streaming
│       └── types.ts        # Types TypeScript
├── server/                 # Serveur Hono (proxy API + gestion tokens)
│   └── index.ts            # Point d'entrée du serveur
├── src/
│   ├── config/
│   │   └── api.ts          # Configuration API
│   ├── components/         # Composants React
│   ├── pages/
│   │   ├── ChatPage.tsx    # Page principale de chat
│   │   ├── ConversationsPage.tsx # Liste des conversations
│   │   └── SettingsPage.tsx # Page d'enregistrement du token
│   └── ...
└── ...
```

### Gestion des tokens

L'architecture utilise un système de proxy pour sécuriser les tokens API :

1. **Enregistrement** : L'utilisateur saisit son token API sur la page Settings
2. **Stockage serveur** : Le token est stocké dans une base SQLite côté serveur
3. **Hash client** : Un hash du token est retourné et stocké dans localStorage
4. **Requêtes proxy** : Les appels API passent par le serveur Hono qui :
   - Identifie l'utilisateur via le hash
   - Récupère le vrai token depuis SQLite
   - Injecte le token dans les requêtes vers l'API Halapi

```
┌─────────────┐     ┌──────────────┐     ┌─────────────┐     ┌─────────────┐
│   Browser   │────▶│ Hono Server  │────▶│ halapiClient│────▶│  API Halapi │
│ (hash only) │◀────│ (SQLite +    │◀────│  (SDK)      │◀────│   (SSE)     │
│             │     │  real token) │     │             │     │             │
└─────────────┘     └──────────────┘     └─────────────┘     └─────────────┘
```

### Flux de données

```
┌─────────────────┐     ┌──────────────┐     ┌─────────────┐
│    ChatPage     │────▶│   useChat    │────▶│ Hono Proxy  │
│                 │◀────│    hook      │◀────│  + halapi   │
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

## Prérequis

- Node.js 20+
- npm ou pnpm
- Un token API Halapi (`hap_sk_live_...`)
- Git (pour cloner avec submodules)

## Installation

```bash
# Cloner le repository avec les submodules
git clone --recurse-submodules https://github.com/darksip/example-api.git
cd example-api

# Si déjà cloné sans submodules
git submodule update --init --recursive

# Installer les dépendances
npm install
```

## Développement

```bash
# Mode développement avec hot reload
npm run dev
```

Cette commande lance simultanément :
- **Vite** (port 5174) : serveur de développement frontend avec HMR
- **Hono** (port 3333) : serveur backend (proxy API + gestion tokens)

**Accédez à l'application sur `http://localhost:3333`**

### Premier lancement

Lors de la première visite, vous serez automatiquement redirigé vers la page **Settings** pour enregistrer votre token API Halapi. Une fois le token enregistré, vous pourrez accéder au chat.

### Autres commandes

```bash
# Build de production
npm run build

# Prévisualisation du build
npm run preview
```

## Déploiement Docker

### Docker Compose (recommandé)

Le projet inclut un fichier `docker-compose.yaml` pour un déploiement simple :

```bash
# Lancer l'application
docker compose up -d
```

L'application sera accessible sur `http://localhost:8080`.

### Configuration Docker Compose

```yaml
services:
  app:
    image: ghcr.io/darksip/example-api:main
    ports:
      - "8080:3333"
    volumes:
      - halapi-data:/app/data  # Persistance SQLite
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "wget", "-q", "--spider", "http://localhost:3333/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 10s

volumes:
  halapi-data:
```

### Variables d'environnement Docker

| Variable | Description | Défaut |
|----------|-------------|--------|
| `VITE_HALAPI_URL` | URL de l'API Halapi | `https://haldev.cybermeet.fr` |
| `PORT` | Port du serveur Hono | `3333` |

**Note** : Le token API n'est plus passé en variable d'environnement. Il est enregistré via l'interface Settings et stocké dans SQLite.

## CI/CD - GitHub Actions

### Workflow de build Docker

Le projet utilise GitHub Actions pour builder et publier automatiquement l'image Docker sur GitHub Container Registry (ghcr.io).

**Fichier** : `.github/workflows/docker-publish.yml`

**Déclencheurs** :
- Push sur la branche `main`
- Push d'un tag `v*` (ex: `v1.0.0`)
- Pull requests vers `main` (build sans push)

**Étapes du workflow** :

1. **Checkout** avec submodules récursifs
2. **Setup Docker Buildx** pour le cache multi-plateforme
3. **Login** au GitHub Container Registry
4. **Build & Push** de l'image avec cache GitHub Actions

**Tags générés** :

| Événement | Tags |
|-----------|------|
| Push sur `main` | `ghcr.io/darksip/example-api:main` |
| Tag `v1.2.3` | `ghcr.io/darksip/example-api:1.2.3`, `ghcr.io/darksip/example-api:1.2` |
| Pull Request #42 | `ghcr.io/darksip/example-api:pr-42` (non publié) |
| Tout push | `ghcr.io/darksip/example-api:<sha>` |

### Submodule dans le CI

Le workflow clone automatiquement les submodules grâce à l'option :

```yaml
- uses: actions/checkout@v4
  with:
    submodules: recursive
```

Cela garantit que `halapi-js/` est disponible lors du build Docker.

## Scripts disponibles

| Script | Description |
|--------|-------------|
| `npm run dev` | Lance Vite (5174) + Hono (3333) en parallèle |
| `npm run dev:client` | Serveur de développement Vite seul |
| `npm run dev:server` | Serveur Hono seul |
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
example-halapi/
├── .github/
│   └── workflows/
│       └── docker-publish.yml  # CI/CD GitHub Actions
├── halapi-js/                  # Submodule SDK
├── server/
│   └── index.ts                # Serveur Hono (proxy + SQLite)
├── src/
│   ├── components/
│   │   ├── BookCard.tsx        # Carte de recommandation de livre
│   │   ├── ChatInput.tsx       # Zone de saisie du chat
│   │   ├── ChatMessage.tsx     # Message avec markdown et artifacts
│   │   ├── ConversationItem.tsx# Élément de liste des conversations
│   │   ├── Layout.tsx          # Layout principal avec navigation
│   │   └── MusicCard.tsx       # Carte album ou piste musicale
│   ├── config/
│   │   └── api.ts              # Configuration API
│   ├── hooks/
│   │   ├── useChat.ts          # Gestion du chat avec streaming
│   │   └── useConversations.ts # Récupération des conversations
│   ├── pages/
│   │   ├── ChatPage.tsx        # Page principale de chat
│   │   ├── ConversationsPage.tsx # Liste des conversations passées
│   │   └── SettingsPage.tsx    # Enregistrement du token API
│   ├── App.tsx                 # Composant racine avec routing
│   ├── main.tsx                # Point d'entrée React
│   └── index.css               # Styles globaux (thème sombre)
├── docker-compose.yaml         # Configuration Docker Compose
├── Dockerfile                  # Build multi-stage (Node)
└── tsconfig.server.json        # Config TypeScript serveur
```

## Événements SSE

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

## Indicateurs d'outils

Les appels d'outils sont représentés par des points colorés :
- **Bleu** (pulsant) : En cours d'exécution
- **Vert** : Succès
- **Rouge** : Erreur

## Stack technique

| Technologie | Version | Usage |
|-------------|---------|-------|
| React | 18.3 | Bibliothèque UI |
| TypeScript | 5.6 | Typage statique |
| Vite | 6.0 | Build et dev server |
| Hono | 4.x | Serveur backend / proxy |
| better-sqlite3 | - | Stockage tokens |
| Biome | 2.3 | Linting et formatage |
| react-markdown | 10.1 | Rendu Markdown |
| remark-gfm | 4.0 | Support GFM |
| halapi-js | submodule | SDK API client |

## Qualité du code

Le projet utilise une configuration stricte :

- **TypeScript strict** : Toutes les options strictes activées
- **Biome** : Linting et formatage automatiques
- **Pas de `any`** : Types explicites partout
- **Type guards** : Discrimination des unions pour les types Music

## Licence

MIT
