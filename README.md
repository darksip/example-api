# Halapi Demo

Application React de démonstration pour l'API Halapi - un assistant conversationnel spécialisé dans les recommandations de livres et de musique.

## Fonctionnalités

- **Chat en temps réel** avec streaming SSE (Server-Sent Events)
- **Recommandations de livres** avec couvertures, auteurs, descriptions et sujets
- **Recommandations musicales** avec albums, pistes, pochettes et métadonnées complètes
- **Suggestions interactives** sous forme de boutons pour continuer la conversation
- **Authentification par token** pour protéger l'accès à l'application
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
├── src/
│   ├── config/
│   │   └── api.ts          # Adaptateur Vite/Docker pour halapi-js
│   ├── components/         # Composants React
│   ├── hooks/              # Hooks React utilisant halapiClient
│   └── ...
└── ...
```

### Flux de données

```
┌─────────────────┐     ┌──────────────┐     ┌─────────────┐
│    ChatPage     │────▶│   useChat    │────▶│ halapiClient│
│                 │◀────│    hook      │◀────│  (SDK)      │
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

# Configurer l'environnement
cp .env.example .env
```

Éditer le fichier `.env` avec votre token API :

```env
VITE_HALAPI_URL=https://haldev.cybermeet.fr
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

## Déploiement Docker

### Docker Compose (recommandé)

Le projet inclut un fichier `docker-compose.yaml` pour un déploiement simple :

```bash
# Créer le fichier d'environnement
cat > .env << EOF
VITE_HALAPI_URL=https://haldev.cybermeet.fr
VITE_HALAPI_TOKEN=hap_sk_live_votre_token_ici
EOF

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
      - "8080:80"
    environment:
      - VITE_HALAPI_URL=${VITE_HALAPI_URL:-https://haldev.cybermeet.fr}
      - VITE_HALAPI_TOKEN=${VITE_HALAPI_TOKEN:-}
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "wget", "-q", "--spider", "http://localhost/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 10s
```

### Variables d'environnement Docker

| Variable | Description | Requis |
|----------|-------------|--------|
| `VITE_HALAPI_URL` | URL de l'API Halapi | Oui |
| `VITE_HALAPI_TOKEN` | Token d'authentification API | Oui |

Les variables sont injectées au runtime via le script `docker-entrypoint.sh`, permettant de configurer l'application sans rebuild.

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
example-halapi/
├── .github/
│   └── workflows/
│       └── docker-publish.yml  # CI/CD GitHub Actions
├── halapi-js/                  # Submodule SDK
├── src/
│   ├── components/
│   │   ├── AuthGate.tsx        # Gate d'authentification
│   │   ├── BookCard.tsx        # Carte de recommandation de livre
│   │   ├── ChatInput.tsx       # Zone de saisie du chat
│   │   ├── ChatMessage.tsx     # Message avec markdown et artifacts
│   │   ├── ConversationItem.tsx# Élément de liste des conversations
│   │   ├── Layout.tsx          # Layout principal avec navigation
│   │   └── MusicCard.tsx       # Carte album ou piste musicale
│   ├── config/
│   │   └── api.ts              # Adaptateur halapi-js pour Vite/Docker
│   ├── hooks/
│   │   ├── useAuth.ts          # Authentification par token
│   │   ├── useChat.ts          # Gestion du chat avec streaming
│   │   └── useConversations.ts # Récupération des conversations
│   ├── pages/
│   │   ├── ChatPage.tsx        # Page principale de chat
│   │   └── ConversationsPage.tsx # Liste des conversations passées
│   ├── App.tsx                 # Composant racine avec auth gate
│   ├── main.tsx                # Point d'entrée React
│   └── index.css               # Styles globaux (thème sombre)
├── docker-compose.yaml         # Configuration Docker Compose
├── Dockerfile                  # Build multi-stage (Node + Nginx)
├── docker-entrypoint.sh        # Injection config runtime
└── nginx.conf                  # Configuration Nginx
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
- 🔵 **Bleu** (pulsant) : En cours d'exécution
- 🟢 **Vert** : Succès
- 🔴 **Rouge** : Erreur

## Stack technique

| Technologie | Version | Usage |
|-------------|---------|-------|
| React | 18.3 | Bibliothèque UI |
| TypeScript | 5.6 | Typage statique |
| Vite | 6.0 | Build et dev server |
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
