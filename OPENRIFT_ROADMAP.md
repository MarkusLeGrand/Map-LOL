# 🎮 OpenRift - Roadmap des Nouvelles Fonctionnalités

## Vue d'Ensemble

Ce document présente les prochaines fonctionnalités à développer pour OpenRift, organisées par module avec des todo lists détaillées pour chaque feature.

---

## 1. 🤝 Système de Booking entre Équipes

### Description
Un outil de matchmaking permettant aux équipes de trouver des adversaires pour leurs scrims. Le système affiche les équipes ayant des créneaux de scrim disponibles au même moment et permet d'envoyer/recevoir des propositions de scrim.

### Flux Utilisateur
```
1. L'équipe définit ses créneaux de disponibilité scrim
2. Le système affiche les équipes avec des créneaux compatibles
3. Une équipe peut envoyer une proposition de scrim
4. L'équipe adverse accepte ou refuse
5. Si accepté → Le créneau est mis à jour avec l'adversaire
6. Si refusé → Le créneau reste ouvert pour d'autres propositions
```

> **Note:** L'utilisation de cet outil est optionnelle. Une équipe peut définir ses créneaux sans passer par le booking (organisation externe).

### Todo List

#### Backend
- [ ] **Modèle de données**
  - [ ] Créer `ScrimSlot` (team_id, date, start_time, end_time, status: open/pending/booked)
  - [ ] Créer `ScrimProposal` (from_team_id, to_team_id, slot_id, status: pending/accepted/rejected, message)
  - [ ] Ajouter relation avec `Scrim` existant si accepté

- [ ] **API Endpoints**
  - [ ] `GET /api/scrim-slots/available` - Slots compatibles avec mes créneaux
  - [ ] `POST /api/scrim-slots` - Créer un créneau
  - [ ] `PUT /api/scrim-slots/{id}` - Modifier un créneau
  - [ ] `DELETE /api/scrim-slots/{id}` - Supprimer un créneau
  - [ ] `POST /api/scrim-proposals` - Envoyer une proposition
  - [ ] `POST /api/scrim-proposals/{id}/accept` - Accepter
  - [ ] `POST /api/scrim-proposals/{id}/reject` - Refuser
  - [ ] `GET /api/scrim-proposals/incoming` - Propositions reçues
  - [ ] `GET /api/scrim-proposals/outgoing` - Propositions envoyées

- [ ] **Logique métier**
  - [ ] Algorithme de matching horaire (overlap de créneaux)
  - [ ] Filtre par tier/rank (optionnel)
  - [ ] Notifications lors de réception/réponse proposition
  - [ ] Auto-création du Scrim lors de l'acceptation

#### Frontend
- [ ] **Page Booking** (`/booking` ou intégré dans `/scheduler`)
  - [ ] Vue calendrier des créneaux disponibles
  - [ ] Liste des équipes matchées avec leurs infos (nom, tag, rank moyen)
  - [ ] Bouton "Proposer un scrim" avec message optionnel
  - [ ] Section "Propositions reçues" avec accept/reject
  - [ ] Section "Propositions envoyées" avec statut
  - [ ] Indicateur visuel du statut des créneaux (open/pending/booked)

- [ ] **Composants UI**
  - [ ] `ScrimSlotCard.tsx` - Affichage d'un créneau
  - [ ] `TeamMatchCard.tsx` - Équipe compatible avec actions
  - [ ] `ProposalModal.tsx` - Modal d'envoi de proposition
  - [ ] `ProposalList.tsx` - Liste des propositions (in/out)

---

## 2. 💾 Scrims Sauvegardés (Entité Scrim Complète)

### Description
Chaque scrim devient une entité complète contenant les deux équipes, la date, et les games jouées. Limite de 10 scrims sauvegardés par équipe pour encourager le nettoyage et la maintenance.

### Structure de l'Entité Scrim
```
Scrim {
  id
  team_a_id (notre équipe)
  team_b_id (adversaire) ou opponent_name (si externe)
  date
  games[] {
    game_number
    result (win/loss)
    duration
    draft_id (lien vers draft)
    rofl_file_id (lien vers replay)
    notes
  }
  overall_score (ex: "2-1")
  notes_globales
  created_at
}
```

### Todo List

#### Backend
- [ ] **Modèle de données**
  - [ ] Refactorer `Scrim` existant pour supporter la nouvelle structure
  - [ ] Créer `ScrimGame` (scrim_id, game_number, result, duration, notes)
  - [ ] Ajouter `opponent_team_id` ou `opponent_name` (flexible)
  - [ ] Ajouter relation `draft_id` (optionnel)
  - [ ] Ajouter relation `rofl_file_id` (optionnel)
  - [ ] Ajouter contrainte: max 10 scrims par équipe

- [ ] **API Endpoints**
  - [ ] `POST /api/scrims/full` - Créer un scrim complet avec games
  - [ ] `GET /api/scrims/team/{team_id}/full` - Liste scrims avec détails
  - [ ] `PUT /api/scrims/{id}/games` - Modifier les games d'un scrim
  - [ ] `POST /api/scrims/{id}/games` - Ajouter une game
  - [ ] `DELETE /api/scrims/{id}/games/{game_id}` - Supprimer une game
  - [ ] `POST /api/scrims/{id}/link-draft` - Associer une draft
  - [ ] `POST /api/scrims/{id}/link-replay` - Associer un replay

- [ ] **Validation**
  - [ ] Vérifier limite de 10 scrims avant création
  - [ ] Message d'erreur clair si limite atteinte
  - [ ] Option de suppression automatique du plus ancien (optionnel)

#### Frontend
- [ ] **Page Scrims** (refonte de la section existante)
  - [ ] Liste des scrims avec score global et date
  - [ ] Vue détaillée d'un scrim avec toutes les games
  - [ ] Formulaire création scrim (adversaire, date, games)
  - [ ] Indicateur "X/10 scrims utilisés"
  - [ ] Modal de confirmation si suppression nécessaire

- [ ] **Composants UI**
  - [ ] `ScrimCard.tsx` - Carte résumé d'un scrim
  - [ ] `ScrimDetailView.tsx` - Vue détaillée
  - [ ] `GameRow.tsx` - Ligne d'une game avec résultat
  - [ ] `ScrimForm.tsx` - Formulaire de création/édition
  - [ ] `StorageIndicator.tsx` - Jauge "X/10"

---

## 3. 📊 Scrim Data Analytics Dashboard (Refonte Modulaire)

### Description
Un dashboard d'analytics entièrement modulaire permettant de sélectionner précisément quels scrims analyser, avec deux modes: analyse d'équipe ou analyse personnelle avec comparaisons.

### Modes d'Analyse

#### Mode Équipe
- Analyse des performances collectives
- Compositions gagnantes/perdantes
- Synergies de picks
- Évolution au fil des scrims

#### Mode Personnel
- Stats du joueur sur les scrims sélectionnés
- Comparaison avec sa performance en SoloQ
- Comparaison avec les joueurs de même elo
- Comparaison avec les joueurs pro (si data disponible)

### Todo List

#### Backend
- [ ] **API Améliorée**
  - [ ] `POST /api/analytics/custom` - Analyse sur sélection personnalisée de scrims
  - [ ] `GET /api/analytics/team/{team_id}/compositions` - Stats par compo
  - [ ] `GET /api/analytics/team/{team_id}/picks` - Stats par pick
  - [ ] `GET /api/analytics/player/{player_id}/scrims` - Stats perso scrims
  - [ ] `GET /api/analytics/player/{player_id}/soloq` - Stats SoloQ (via Riot API)
  - [ ] `GET /api/analytics/benchmarks/{elo}` - Moyennes par elo
  - [ ] `GET /api/analytics/benchmarks/pro` - Stats pro (data externe)

- [ ] **Logique métier**
  - [ ] Agrégation flexible par sélection de scrims
  - [ ] Calcul stats compositions (winrate par comp)
  - [ ] Calcul synergies picks (duo/trio winrates)
  - [ ] Service de fetch SoloQ data via Riot API
  - [ ] Cache des benchmarks elo (refresh hebdo)

#### Frontend
- [ ] **Sélecteur de Scrims**
  - [ ] Checkbox multi-sélection de scrims
  - [ ] Raccourcis: "3 derniers", "5 derniers", "10 derniers", "Tous"
  - [ ] Filtre par date (range picker)
  - [ ] Filtre par adversaire
  - [ ] Sauvegarde des présets de sélection

- [ ] **Mode Équipe**
  - [ ] Dashboard stats globales sur la sélection
  - [ ] Graphique winrate par composition
  - [ ] Tableau des picks les plus efficaces
  - [ ] Heatmap synergies (qui joue bien ensemble)
  - [ ] Évolution temporelle (trend charts)

- [ ] **Mode Personnel**
  - [ ] Sélecteur de joueur
  - [ ] Stats du joueur sur les scrims
  - [ ] Graphique comparatif: Scrims vs SoloQ
  - [ ] Graphique comparatif: Joueur vs Elo moyen
  - [ ] Graphique comparatif: Joueur vs Pros (optionnel)
  - [ ] Radar chart multi-dimensionnel

- [ ] **Composants UI**
  - [ ] `ScrimSelector.tsx` - Multi-select avec présets
  - [ ] `AnalyticsModeToggle.tsx` - Switch Équipe/Personnel
  - [ ] `ComparisonChart.tsx` - Graphique comparatif
  - [ ] `CompositionStats.tsx` - Stats par composition
  - [ ] `PickAnalysis.tsx` - Analyse des picks
  - [ ] `PlayerBenchmark.tsx` - Comparaison joueur

---

## 4. 🎯 Outil Drafter

### Description
Un outil complet de draft comprenant: un simulateur de draft classique, un sandbox pour théorycraft, et un historique des drafts avec statistiques.

### Fonctionnalités

#### Draft Simulator
- Interface identique au client LoL
- Picks et bans en temps réel
- Sauvegarde automatique à la fin

#### Draft Sandbox
- Mode libre pour tester des compositions
- Pas de contraintes de tour
- Similaire à drafting.gg

#### Draft Analytics
- Historique des drafts sauvegardées
- Association possible avec un scrim/game
- Stats sur les drafts (winrate par first pick, etc.)

### Todo List

#### Backend
- [ ] **Modèle de données**
  - [ ] Créer `Draft` (team_id, type: simulation/sandbox, picks, bans, result, created_at)
  - [ ] Créer `DraftPick` (draft_id, team: blue/red, position: 1-5, champion_id, is_ban)
  - [ ] Ajouter relation optionnelle `scrim_id`, `game_id`

- [ ] **API Endpoints**
  - [ ] `POST /api/drafts` - Sauvegarder une draft
  - [ ] `GET /api/drafts/team/{team_id}` - Historique drafts équipe
  - [ ] `GET /api/drafts/{id}` - Détail d'une draft
  - [ ] `PUT /api/drafts/{id}` - Modifier (ajouter résultat)
  - [ ] `DELETE /api/drafts/{id}` - Supprimer
  - [ ] `POST /api/drafts/{id}/link-scrim` - Associer à un scrim
  - [ ] `GET /api/drafts/stats` - Statistiques globales

- [ ] **Data Champions**
  - [ ] Endpoint champions avec images (Data Dragon)
  - [ ] Cache local des assets champions

#### Frontend
- [ ] **Page Draft** (`/draft`)
  - [ ] Onglets: Simulator / Sandbox / Historique

- [ ] **Draft Simulator**
  - [ ] Interface fidèle au client LoL
  - [ ] Grille de sélection champions (filtrable)
  - [ ] Barre de recherche champion
  - [ ] Timer par phase (optionnel)
  - [ ] Affichage équipes Blue/Red
  - [ ] Bouton sauvegarde à la fin

- [ ] **Draft Sandbox**
  - [ ] Mode libre sans contraintes
  - [ ] Drag & drop champions
  - [ ] Reset rapide
  - [ ] Sauvegarde optionnelle

- [ ] **Draft History**
  - [ ] Liste des drafts passées
  - [ ] Filtres: date, résultat, adversaire
  - [ ] Vue détaillée d'une draft
  - [ ] Option d'association à un scrim
  - [ ] Stats agrégées (si résultats renseignés)

- [ ] **Composants UI**
  - [ ] `DraftBoard.tsx` - Plateau de draft
  - [ ] `ChampionGrid.tsx` - Grille de sélection
  - [ ] `ChampionCard.tsx` - Carte champion
  - [ ] `BanSlot.tsx` - Emplacement ban
  - [ ] `PickSlot.tsx` - Emplacement pick
  - [ ] `DraftHistoryCard.tsx` - Carte historique

---

## 5. 🏆 Champion Pool & Tier List

### Description
Un outil simple et visuel pour définir le champion pool de chaque joueur avec un système de tier list (S/A/B/C ou personnalisé).

### Todo List

#### Backend
- [ ] **Modèle de données**
  - [ ] Créer `ChampionPool` (user_id, team_id, position)
  - [ ] Créer `ChampionPoolEntry` (pool_id, champion_id, tier: S/A/B/C, notes)

- [ ] **API Endpoints**
  - [ ] `GET /api/champion-pool/{user_id}` - Pool d'un joueur
  - [ ] `GET /api/champion-pool/team/{team_id}` - Pools de l'équipe
  - [ ] `PUT /api/champion-pool` - Mettre à jour son pool
  - [ ] `POST /api/champion-pool/entry` - Ajouter un champion
  - [ ] `DELETE /api/champion-pool/entry/{id}` - Retirer un champion

#### Frontend
- [ ] **Page Champion Pool** (ou section dans profil/équipe)
  - [ ] Vue personnelle: éditer son pool
  - [ ] Vue équipe: voir les pools de tous les membres
  - [ ] Drag & drop entre tiers
  - [ ] Filtrage par position

- [ ] **Composants UI**
  - [ ] `TierList.tsx` - Container tier list
  - [ ] `TierRow.tsx` - Une ligne de tier (S/A/B/C)
  - [ ] `PoolChampion.tsx` - Champion dans le pool (draggable)
  - [ ] `ChampionPoolEditor.tsx` - Éditeur complet
  - [ ] `TeamPoolOverview.tsx` - Vue agrégée équipe

---

## 6. 👥 Module Social

### Description
Enrichir l'aspect social de la plateforme avec des profils publics, un système d'amis, et la possibilité de parcourir et consulter les autres équipes.

### Fonctionnalités

#### Profils Publics
- Page profil simple et efficace (pas une page entière, plutôt une modale ou sidebar)
- Infos: pseudo, Riot account, rang, équipe(s), champions préférés
- Lien vers l'équipe

#### Système d'Amis
- Envoyer/recevoir demandes d'amis
- Liste d'amis
- Voir le statut (en ligne/hors ligne - optionnel)

#### Parcourir les Équipes
- Explorer les équipes publiques
- Cliquer sur une équipe → voir ses membres et infos
- Design clean et efficace

### Todo List

#### Backend
- [ ] **Modèle de données**
  - [ ] Créer `Friendship` (user_a_id, user_b_id, status: pending/accepted, created_at)
  - [ ] Ajouter champs profil public sur `User` (bio, is_public)

- [ ] **API Endpoints**
  - [ ] `GET /api/users/{id}/profile` - Profil public d'un user
  - [ ] `GET /api/friends` - Ma liste d'amis
  - [ ] `GET /api/friends/requests` - Demandes reçues
  - [ ] `POST /api/friends/request/{user_id}` - Envoyer demande
  - [ ] `POST /api/friends/accept/{user_id}` - Accepter
  - [ ] `POST /api/friends/reject/{user_id}` - Refuser
  - [ ] `DELETE /api/friends/{user_id}` - Supprimer ami
  - [ ] `GET /api/teams/{id}/public` - Vue publique équipe

- [ ] **Logique**
  - [ ] Vérification de visibilité (profil public/privé)
  - [ ] Notifications pour demandes d'amis

#### Frontend
- [ ] **Profil Public**
  - [ ] Modal ou panel de profil (pas une page complète)
  - [ ] Avatar, pseudo, rang
  - [ ] Champions principaux (top 3)
  - [ ] Équipe(s) avec lien
  - [ ] Bouton "Ajouter en ami"
  - [ ] Indicateur si déjà ami

- [ ] **Système d'Amis**
  - [ ] Section "Amis" dans le dashboard ou settings
  - [ ] Liste des amis avec profil cliquable
  - [ ] Badge notification demandes en attente
  - [ ] Modal de confirmation suppression

- [ ] **Explorer Équipes**
  - [ ] Améliorer `/teams` existant
  - [ ] Clic sur équipe → Panel détaillé (pas navigation)
  - [ ] Affichage membres avec leur rang
  - [ ] Bouton "Demander à rejoindre" (si public)
  - [ ] Recherche/filtres améliorés

- [ ] **Composants UI**
  - [ ] `UserProfileCard.tsx` - Carte profil utilisateur
  - [ ] `UserProfileModal.tsx` - Modal profil détaillé
  - [ ] `FriendsList.tsx` - Liste d'amis
  - [ ] `FriendRequestBadge.tsx` - Badge notifications
  - [ ] `TeamPreviewPanel.tsx` - Panel aperçu équipe
  - [ ] `MemberList.tsx` - Liste membres équipe

---

## 📋 Récapitulatif des Priorités

| Module | Complexité | Priorité Suggérée |
|--------|------------|-------------------|
| Champion Pool & Tier List | ⭐⭐ | 🥇 Haute (quick win) |
| Scrims Sauvegardés | ⭐⭐⭐ | 🥇 Haute (fondation) |
| Module Social | ⭐⭐⭐ | 🥈 Moyenne |
| Booking entre Équipes | ⭐⭐⭐⭐ | 🥈 Moyenne |
| Analytics Dashboard (refonte) | ⭐⭐⭐⭐⭐ | 🥉 Basse (complexe) |
| Outil Drafter | ⭐⭐⭐⭐ | 🥉 Basse (standalone) |

---

## 🔗 Dépendances entre Modules

```
Scrims Sauvegardés ──┬──> Analytics Dashboard (utilise les scrims)
                     │
                     └──> Outil Drafter (association draft → scrim)

Booking entre Équipes ───> Scrims Sauvegardés (crée des scrims)

Module Social ───> Existant (Teams, Users déjà en place)

Champion Pool ───> Standalone (peut être fait indépendamment)
```

---

*Document généré pour OpenRift - Roadmap v1.0*
