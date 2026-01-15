# OpenRift - Documentation Technique Complète

## 1. Présentation du Projet

**OpenRift** est une plateforme d'outils professionnels pour les équipes esport League of Legends. Elle permet la gestion d'équipe, l'analyse de scrims, la planification tactique et la synchronisation avec l'API Riot.

### Stack Technique
- **Frontend:** React 19 + TypeScript + Tailwind CSS + Vite
- **Backend:** FastAPI + Python + SQLite/PostgreSQL
- **Auth:** JWT + OAuth2 (Riot Games & Discord)
- **ORM:** SQLAlchemy

---

## 2. Architecture du Projet

```
Map-LOL/
├── frontend/                    # Application React
│   ├── src/
│   │   ├── pages/              # Pages/Routes
│   │   ├── components/         # Composants réutilisables
│   │   ├── contexts/           # État global (Auth, Team, Toast)
│   │   ├── hooks/              # Hooks personnalisés
│   │   ├── services/           # Appels API
│   │   ├── constants/          # Thème, constantes
│   │   └── types/              # Types TypeScript
│   ├── public/                 # Assets statiques
│   └── dist/                   # Build production
│
├── backend/
│   ├── app/
│   │   ├── main.py             # Point d'entrée FastAPI
│   │   ├── database.py         # Modèles SQLAlchemy
│   │   ├── auth.py             # JWT & authentification
│   │   ├── analytics.py        # Analyse des scrims
│   │   ├── teams.py            # Logique équipes
│   │   ├── routes/             # Endpoints API
│   │   └── services/           # Services externes (Riot, Discord)
│   ├── uploads/                # Fichiers uploadés
│   ├── exports/charts/         # Graphiques générés
│   └── data/                   # Base de données SQLite
│
└── docker-compose.yml          # Configuration Docker
```

---

## 3. Frontend - Structure Détaillée

### 3.1 Pages (Routes)

| Route | Fichier | Description |
|-------|---------|-------------|
| `/` | HomePage.tsx | Landing page |
| `/login` | LoginPage.tsx | Connexion email/password |
| `/signup` | SignupPage.tsx | Inscription |
| `/dashboard` | DashboardPage.tsx | Tableau de bord utilisateur |
| `/settings` | SettingsPage.tsx | Paramètres du compte |
| `/teams` | TeamsPage.tsx | Découverte d'équipes |
| `/team-manager` | TeamManagerPage.tsx | Gestion d'équipe |
| `/scheduler` | ScrimSchedulerPage.tsx | Planification scrims |
| `/tools` | ToolsPage.tsx | Liste des outils |
| `/tactical-map` | TacticalMapPage.tsx | Carte tactique |
| `/data-analytics` | DataAnalyticsPage.tsx | Analyse de données |
| `/admin` | AdminPage.tsx | Dashboard admin |
| `/about` | AboutPage.tsx | À propos |
| `/privacy` | PrivacyPage.tsx | Politique de confidentialité |
| `/terms` | TermsPage.tsx | Conditions d'utilisation |

### 3.2 Composants

#### UI Components (`components/ui/`)
```
Button.tsx          - Bouton avec variantes (primary, danger, etc.)
ConfirmDialog.tsx   - Modal de confirmation
Toast.tsx           - Notifications toast
TeamCard.tsx        - Carte d'équipe
ToolCard.tsx        - Carte d'outil
TabPanel.tsx        - Interface à onglets
RangeSlider.tsx     - Slider numérique
ColorGradientPicker - Sélecteur de couleur
ImageWithFallback   - Image avec fallback erreur
```

#### Layout Components (`components/layout/`)
```
Header.tsx          - Navigation + branding
Footer.tsx          - Pied de page
```

#### Map Components (`components/map/`)
```
MapCanvas.tsx       - Canvas principal de la carte
GridOverlay.tsx     - Grille superposée
TokenElement.tsx    - Tokens joueurs (déplaçables)
TowerElement.tsx    - Tours
InhibitorElement.tsx - Inhibiteurs
WardElement.tsx     - Wards
JungleCamp.tsx      - Camps jungle
FaelightElement.tsx - Indicateurs de vision
DrawingLayer.tsx    - Couche de dessin libre
FogOfWar.tsx        - Brouillard de guerre
```

### 3.3 Contexts (État Global)

```typescript
// AuthContext - Authentification
{
  user: User | null,
  isLoading: boolean,
  login: (email, password) => Promise,
  logout: () => void,
  updateUser: (data) => void
}

// TeamContext - Équipes
{
  teams: Team[],
  invites: Invite[],
  joinRequests: JoinRequest[],
  refreshTeams: () => Promise,
  refreshInvites: () => Promise
}

// ToastContext - Notifications
{
  showToast: (message, type) => void
}
```

### 3.4 Hooks Personnalisés

| Hook | Description |
|------|-------------|
| `useGameState` | État de la carte/game |
| `useImage` | Chargement d'images avec cache |
| `useTokenHandlers` | Placement/déplacement tokens |
| `useTowerHandlers` | Gestion des tours |
| `useWardHandlers` | Placement des wards |
| `useDrawingHandlers` | Outils de dessin |
| `useFaelightActivations` | Calcul vision |
| `useVisibleEntities` | Entités visibles (fog) |
| `useAutoRefresh` | Rafraîchissement automatique |

### 3.5 Design System

```typescript
// constants/theme.ts
COLORS = {
  primary: '#3D7A5F',      // Vert principal
  danger: '#A85C5C',       // Rouge (alertes)
  blue: '#5F7A8E',
  purple: '#7A5F8E',
  gold: '#B8945E',
  pink: '#D97FB4',
  orange: '#FF7F00',
  background: '#0E0E0E',   // Fond sombre
  text: '#F5F5F5',         // Texte clair
}

OPACITY = {
  border: 10,
  hover: 20,
  disabled: 30,
  secondary: 40,
  tertiary: 50,
  subtle: 60
}
```

**Police:** Inter (sans-serif via Tailwind)
**Theme:** Dark mode uniquement

---

## 4. Backend - Structure Détaillée

### 4.1 Fichiers Principaux

| Fichier | Description |
|---------|-------------|
| `main.py` | Point d'entrée, configuration CORS, routes |
| `database.py` | Modèles SQLAlchemy, session DB |
| `auth.py` | JWT, hashing passwords, middleware auth |
| `analytics.py` | Traitement données scrims, graphiques |
| `teams.py` | Logique métier équipes |

### 4.2 Routes API

#### Auth (`/api/auth`)
```
POST /register              - Inscription (rate limit: 5/min)
POST /login                 - Connexion (rate limit: 5/min)
GET  /me                    - Utilisateur courant
PUT  /me                    - Mise à jour compte Riot
PUT  /profile               - Mise à jour profil
PUT  /password              - Changement mot de passe (rate limit: 3/min)
PUT  /favorite-tools        - Outils favoris
GET  /has-password          - Vérifier si password défini
POST /set-password          - Définir password (comptes OAuth)
DELETE /me                  - Supprimer compte
```

#### Teams (`/api/teams`)
```
GET    /all                 - Toutes les équipes publiques
POST   /create              - Créer équipe
GET    /my-teams            - Mes équipes
GET    /invites             - Invitations reçues
GET    /{id}                - Détails équipe
PUT    /{id}                - Modifier équipe (owner)
DELETE /{id}                - Supprimer équipe
POST   /{id}/leave          - Quitter équipe
POST   /{id}/kick/{user}    - Exclure membre
POST   /{id}/promote/{user} - Promouvoir owner
POST   /{id}/invite         - Inviter utilisateur
POST   /{id}/request-join   - Demander à rejoindre
GET    /{id}/join-requests  - Voir demandes
POST   /invites/{id}/accept - Accepter invitation
POST   /join-requests/{id}/accept  - Accepter demande
POST   /join-requests/{id}/reject  - Refuser demande
DELETE /join-requests/{id}/cancel  - Annuler demande
```

#### Scrims (`/api/scrims`)
```
POST   /create              - Créer scrim
GET    /team/{team_id}      - Scrims de l'équipe
PATCH  /{id}                - Modifier scrim
DELETE /{id}                - Supprimer scrim
```

#### Riot (`/api/riot`)
```
GET  /auth/authorize        - URL OAuth Riot
GET  /auth/callback         - Callback OAuth
POST /verify                - Vérification manuelle
POST /sync                  - Sync données Riot
GET  /summoner              - Données summoner
POST /summoner/update-lane  - Modifier rôle préféré
```

#### Discord (`/api/discord`)
```
GET  /auth/authorize        - URL OAuth Discord
GET  /auth/callback         - Callback OAuth
GET  /login/authorize       - Auth connexion Discord
GET  /login/callback        - Callback connexion
POST /unlink                - Délier compte
GET  /status                - Statut connexion
```

#### Analytics
```
POST /api/upload-scrim-data - Upload JSON match
POST /api/analyze-scrim     - Analyser données
GET  /api/players-stats     - Stats joueurs
GET  /api/charts/{name}     - Récupérer graphique
GET  /api/list-uploads      - Lister uploads
POST /api/analytics/save    - Sauvegarder analyse
GET  /api/analytics/personal - Analyses personnelles
GET  /api/analytics/team/{id} - Analyses équipe
DELETE /api/analytics/...   - Supprimer analyse
```

#### Admin (`/api/admin`)
```
GET    /stats               - Statistiques plateforme
GET    /users               - Liste utilisateurs
GET    /users/{id}          - Détails utilisateur
DELETE /users/{id}          - Supprimer utilisateur
PATCH  /users/{id}/toggle-active - Ban/unban
PATCH  /users/{id}/toggle-admin  - Admin on/off
GET    /teams               - Liste équipes
DELETE /teams/{id}          - Supprimer équipe
GET    /tickets             - Tickets support
PATCH  /tickets/{id}        - Modifier ticket
DELETE /tickets/{id}        - Supprimer ticket
GET    /tickets/stats       - Stats tickets
```

#### Autres
```
POST /api/tickets/submit    - Signaler bug
GET  /api/notifications     - Notifications
PATCH /api/notifications/{id}/read - Marquer lu
DELETE /api/notifications/{id} - Supprimer
```

### 4.3 Services

| Service | Description |
|---------|-------------|
| `riot_auth.py` | OAuth2 Riot Games |
| `riot_api.py` | API Riot (summoner, ranked, mastery) |
| `discord_auth.py` | OAuth2 Discord |
| `scheduler.py` | Tâches en arrière-plan (sync auto) |

---

## 5. Base de Données

### 5.1 Schéma

```
┌─────────────────┐     ┌─────────────────┐
│      User       │     │      Team       │
├─────────────────┤     ├─────────────────┤
│ id (PK)         │     │ id (PK)         │
│ email           │     │ name            │
│ username        │     │ tag             │
│ hashed_password │     │ description     │
│ game_name       │◄────│ owner_id (FK)   │
│ tag_line        │     │ team_color      │
│ puuid           │     │ max_members     │
│ region          │     │ is_active       │
│ discord         │     │ is_locked       │
│ discord_id      │     │ created_at      │
│ favorite_tools  │     └─────────────────┘
│ is_admin        │              │
│ is_active       │              │
│ created_at      │              ▼
└─────────────────┘     ┌─────────────────┐
        │               │  team_members   │
        │               ├─────────────────┤
        │               │ team_id (FK)    │
        ▼               │ user_id (FK)    │
┌─────────────────┐     │ role            │
│  SummonerData   │     │ joined_at       │
├─────────────────┤     └─────────────────┘
│ id (PK)         │
│ user_id (FK)    │     ┌─────────────────┐
│ summoner_id     │     │   TeamInvite    │
│ solo_tier/rank  │     ├─────────────────┤
│ flex_tier/rank  │     │ id (PK)         │
│ top_champions   │     │ team_id (FK)    │
│ preferred_lane  │     │ invited_user_id │
│ last_synced     │     │ invited_by_id   │
└─────────────────┘     │ role            │
                        │ status          │
┌─────────────────┐     │ expires_at      │
│    RiotOAuth    │     └─────────────────┘
├─────────────────┤
│ user_id (FK)    │     ┌─────────────────┐
│ access_token    │     │   JoinRequest   │
│ refresh_token   │     ├─────────────────┤
│ expires_at      │     │ id (PK)         │
│ state           │     │ team_id (FK)    │
└─────────────────┘     │ user_id (FK)    │
                        │ message         │
┌─────────────────┐     │ status          │
│  DiscordOAuth   │     │ created_at      │
├─────────────────┤     └─────────────────┘
│ user_id (FK)    │
│ access_token    │     ┌─────────────────┐
│ refresh_token   │     │    TeamEvent    │
│ discord_id      │     ├─────────────────┤
│ discord_username│     │ id (PK)         │
└─────────────────┘     │ team_id (FK)    │
                        │ created_by_id   │
┌─────────────────┐     │ title           │
│AvailabilitySlot │     │ event_type      │
├─────────────────┤     │ start/end_time  │
│ id (PK)         │     │ is_recurring    │
│ user_id (FK)    │     │ opponent_name   │
│ team_id (FK)    │     │ notes           │
│ start_time      │     └─────────────────┘
│ end_time        │
│ is_recurring    │     ┌─────────────────┐
│ recurrence_...  │     │      Scrim      │
└─────────────────┘     ├─────────────────┤
                        │ id (PK)         │
┌─────────────────┐     │ team_id (FK)    │
│  UserAnalytics  │     │ opponent_name   │
├─────────────────┤     │ scheduled_at    │
│ id (PK)         │     │ duration_minutes│
│ user_id (FK)    │     │ notes           │
│ name            │     │ status          │
│ file_name       │     │ created_at      │
│ data_path       │     └─────────────────┘
│ analysis_results│
│ uploaded_at     │     ┌─────────────────┐
└─────────────────┘     │   BugTicket     │
                        ├─────────────────┤
┌─────────────────┐     │ id (PK)         │
│  TeamAnalytics  │     │ user_id (FK)    │
├─────────────────┤     │ title           │
│ id (PK)         │     │ description     │
│ team_id (FK)    │     │ category        │
│ created_by_id   │     │ status          │
│ name            │     │ priority        │
│ file_name       │     │ admin_response  │
│ data_path       │     │ page_url        │
│ analysis_results│     │ created_at      │
│ uploaded_at     │     └─────────────────┘
└─────────────────┘
                        ┌─────────────────┐
                        │  Notification   │
                        ├─────────────────┤
                        │ id (PK)         │
                        │ user_id (FK)    │
                        │ type            │
                        │ title           │
                        │ message         │
                        │ reference_id    │
                        │ is_read         │
                        │ created_at      │
                        └─────────────────┘
```

### 5.2 Rôles Équipe

| Rôle | Permissions |
|------|-------------|
| `owner` | Tout (modifier, supprimer équipe, kick, promouvoir) |
| `coach` | Gestion événements, analytics |
| `player` | Voir, participer |
| `analyst` | Analytics, lecture seule |

---

## 6. Fonctionnalités Actuelles

### 6.1 Authentification
- ✅ Inscription/Connexion email + password
- ✅ OAuth Riot Games (liaison compte)
- ✅ OAuth Discord (liaison + connexion)
- ✅ Fusion auto des comptes (même email Discord)
- ✅ Comptes Discord-only (sans password)
- ✅ JWT tokens (24h)
- ✅ Rate limiting (5/min login, 3/min password)

### 6.2 Gestion Utilisateurs
- ✅ Profil avec Riot & Discord
- ✅ Outils favoris personnalisables
- ✅ Suppression de compte
- ✅ Changement mot de passe

### 6.3 Équipes
- ✅ Création d'équipe (couleur, tag)
- ✅ Découverte équipes publiques
- ✅ Système de rôles (owner, coach, player, analyst)
- ✅ Invitations avec rôle
- ✅ Demandes d'adhésion
- ✅ Gestion membres (kick, promotion)
- ✅ Verrouillage équipe (privé/public)

### 6.4 Intégration Riot
- ✅ Liaison compte via OAuth
- ✅ Sync données summoner
- ✅ Tier/LP ranked (Solo & Flex)
- ✅ Top 3 champions mastery
- ✅ Détection auto du rôle préféré
- ✅ Sync automatique en arrière-plan

### 6.5 Analytics Scrims
- ✅ Upload JSON (format Riot API)
- ✅ Filtrage par membres équipe
- ✅ Statistiques: winrate, KDA, damage, gold, CS, vision
- ✅ Stats par champion
- ✅ Graphiques: barres, scatter, radar
- ✅ Export PNG
- ✅ Sauvegarde/chargement analyses (5 perso, 10 équipe)

### 6.6 Carte Tactique
- ✅ Canvas interactif
- ✅ Tokens joueurs (déplaçables)
- ✅ Tours, inhibiteurs, camps jungle
- ✅ Système de wards
- ✅ Brouillard de guerre
- ✅ Vision (facelight)
- ✅ Dessin libre
- ✅ Grille configurable

### 6.7 Planification
- ✅ Disponibilités personnelles
- ✅ Vue équipe agrégée
- ✅ Événements (scrims, training, meeting, soloq)
- ✅ Événements récurrents

### 6.8 Admin
- ✅ Stats plateforme
- ✅ Gestion utilisateurs (ban, admin)
- ✅ Gestion équipes
- ✅ Tickets support

### 6.9 Support
- ✅ Signalement bugs
- ✅ Suivi tickets
- ✅ Notifications

---

## 7. Système de Fichiers ROFL

### 7.1 Parser ROFL (`parse_rofl_direct.py`)

Convertit les fichiers replay `.rofl` en JSON format Riot match-v5.

```python
# Utilisation
python parse_rofl_direct.py input.rofl output.json
```

### 7.2 Flow Upload

```
1. Utilisateur upload JSON → POST /api/upload-scrim-data
2. Validation (format JSON, array "matches")
3. Vérification RIOT ID des membres
4. Stockage dans /backend/uploads/
5. Retour: nombre matches, joueurs trouvés
```

### 7.3 Flow Analyse

```
1. POST /api/analyze-scrim avec chemin fichier
2. ScrimAnalytics traite les données
3. Calcul stats par joueur
4. Génération graphiques (matplotlib)
5. Sauvegarde charts dans /backend/exports/charts/
6. Retour JSON structuré
```

### 7.4 Format Données

```json
{
  "players": [{
    "summoner_name": "PlayerName",
    "position": "TOP|JUNGLE|MIDDLE|BOTTOM|UTILITY",
    "games": 5,
    "wins": 3,
    "winrate": 60.0,
    "totals": {
      "kills": 25, "deaths": 8, "assists": 15,
      "damage": 50000, "gold": 75000, "cs": 500,
      "vision_score": 25, "wards_placed": 50
    },
    "averages": {
      "kills": 5.0, "kda": 5.0,
      "damage_per_min": 200, "gold_per_min": 300,
      "cs_per_min": 6.5, "kill_participation": 64.5
    },
    "champions": [
      { "name": "Garen", "games": 3, "wins": 2, "winrate": 66.7 }
    ]
  }]
}
```

---

## 8. Sécurité

| Aspect | Implémentation |
|--------|----------------|
| Auth | JWT 24h, bcrypt hashing |
| Autorisation | Vérification rôle (owner, admin) |
| Rate Limiting | 5/min login, 3/min password |
| CORS | Strict en prod, permissif en dev |
| OAuth | State parameter (CSRF) |
| Isolation | Users voient uniquement leurs données |
| Validation | Pydantic models sur tous les inputs |

---

## 9. Variables d'Environnement

### Frontend (`.env`)
```
VITE_API_URL=http://localhost:8000
```

### Backend (`.env`)
```
DATABASE_URL=sqlite:///./data/openrift.db
SECRET_KEY=your-secret-key
ALGORITHM=HS256

# Riot API
RIOT_API_KEY=RGAPI-xxx
RIOT_CLIENT_ID=xxx
RIOT_CLIENT_SECRET=xxx
RIOT_REDIRECT_URI=http://localhost:8000/api/riot/auth/callback

# Discord
DISCORD_CLIENT_ID=xxx
DISCORD_CLIENT_SECRET=xxx
DISCORD_REDIRECT_URI=http://localhost:8000/api/discord/auth/callback
```

---

## 10. Commandes

### Frontend
```bash
cd frontend
npm install          # Installation
npm run dev          # Dev server (http://localhost:5173)
npm run build        # Build production
npm run preview      # Preview build
```

### Backend
```bash
cd backend
pip install -r requirements.txt    # Installation
uvicorn app.main:app --reload      # Dev server (http://localhost:8000)
```

### Docker
```bash
docker-compose up -d               # Lancer tout
docker-compose down                # Arrêter
docker-compose logs -f             # Logs
```

---

## 11. Prochaines Fonctionnalités (Vision)

### Système de Scrims Complet
- [ ] Booking entre équipes (proposition/acceptation)
- [ ] Scrims comme entité (2 équipes, date, games)
- [ ] Association ROFL au scrim

### Analytics Avancés
- [ ] Stats équipe (tous scrims, 5 derniers, custom)
- [ ] Notes collaboratives par game
- [ ] Points à travailler (avant/pendant/après)
- [ ] Comparaison: scrim vs soloQ vs mondial vs pro

### Système de Draft
- [ ] Draft saver (associé aux games)
- [ ] Draft sandbox (théorycraft)
- [ ] Champion pool tier list par joueur

### Social
- [ ] Profils publics enrichis
- [ ] Système d'amis
- [ ] Voir équipe des autres

---

*Documentation générée le 15/01/2026*
