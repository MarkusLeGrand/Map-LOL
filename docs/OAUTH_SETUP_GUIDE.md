# Guide de Configuration OAuth - Riot & Discord

## Ce qui a été fait

### Discord OAuth - COMPLÈTEMENT IMPLÉMENTÉ ✅

**Backend:**
- `backend/app/services/discord_auth.py` - Service OAuth2 Discord
- `backend/app/routes/discord_routes.py` - Routes API Discord
- Table `DiscordOAuth` ajoutée dans `database.py`
- Champs Discord ajoutés au modèle `User` (discord, discord_id, discord_verified)

**Frontend:**
- `frontend/src/pages/auth/DiscordCallbackPage.tsx` - Page de callback
- Route `/auth/discord/callback` ajoutée dans App.tsx

**Configuration:**
- Variables Discord ajoutées dans `.env.example`
- Routes Discord enregistrées dans `main.py`

### Riot OAuth - DÉJÀ IMPLÉMENTÉ (EN ATTENTE D'APPROBATION) ⏳

**Backend:**
- `backend/app/services/riot_auth.py` - Service OAuth2 Riot
- `backend/app/routes/riot_routes.py` - Routes API Riot
- Table `RiotOAuth` déjà dans `database.py`

**Frontend:**
- `frontend/src/pages/auth/RiotCallbackPage.tsx` - Page de callback
- Route `/auth/riot/callback` déjà dans App.tsx

**Statut:**
- Application Riot App ID: **788778**
- Statut: **Pending Review** (En attente d'approbation)

---

## Étapes pour activer Discord OAuth

### 1. Créer l'application Discord

1. Allez sur https://discord.com/developers/applications
2. Cliquez sur **"New Application"**
3. Nom: **OpenRift**
4. Allez dans **OAuth2** → **General**
5. Copiez votre **Client ID** et **Client Secret**
6. Dans **Redirects**, ajoutez:
   - `http://localhost:3000/auth/discord/callback` (développement)
   - `https://openrift.cloud/auth/discord/callback` (production)
7. Sauvegardez

### 2. Configurer le .env

Ajoutez dans `backend/.env`:

```bash
DISCORD_CLIENT_ID=votre_client_id_discord
DISCORD_CLIENT_SECRET=votre_client_secret_discord
DISCORD_REDIRECT_URI=http://localhost:3000/auth/discord/callback
```

### 3. Migrer la base de données

La nouvelle table `DiscordOAuth` a été ajoutée. Si vous utilisez SQLite:

```bash
cd backend
# La table sera créée automatiquement au démarrage
python -m app.main
```

Si vous devez créer la table manuellement:
```python
from app.database import init_db
init_db()
```

### 4. Ajouter le bouton dans l'interface

Dans votre page de profil ou settings (`SettingsPage.tsx` ou `DashboardPage.tsx`):

```typescript
const handleDiscordConnect = async () => {
  try {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_BASE_URL}/api/discord/auth/authorize`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    const data = await response.json();

    // Rediriger vers Discord OAuth
    window.location.href = data.authorization_url;
  } catch (error) {
    console.error('Failed to start Discord OAuth:', error);
    toast?.error('Failed to connect to Discord');
  }
};

// Dans votre JSX:
<button onClick={handleDiscordConnect}>
  <svg>...</svg> {/* Logo Discord */}
  Connect Discord
</button>
```

### 5. Tester

1. Démarrez le backend: `python -m app.main`
2. Démarrez le frontend: `npm run dev`
3. Cliquez sur "Connect Discord"
4. Autorisez l'application Discord
5. Vous serez redirigé vers `/auth/discord/callback`
6. Votre compte Discord sera lié!

---

## Étapes pour activer Riot OAuth

### 1. Attendre l'approbation

Votre application (App ID: 788778) est **en attente d'approbation**.
- Délai: quelques jours à 2 semaines
- Vous recevrez un email de Riot Games

### 2. Une fois approuvé

1. Retournez sur https://developer.riotgames.com/
2. Cliquez sur votre application "OPENRIFT"
3. Cliquez sur **"EDIT APP"**
4. Copiez votre **Client ID** et **Client Secret**

### 3. Configurer le .env

Ajoutez dans `backend/.env`:

```bash
RIOT_CLIENT_ID=votre_client_id_riot
RIOT_CLIENT_SECRET=votre_client_secret_riot
RIOT_REDIRECT_URI=http://localhost:3000/auth/riot/callback
```

### 4. Ajouter le bouton dans l'interface

Dans votre page de profil/settings:

```typescript
const handleRiotConnect = async () => {
  try {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_BASE_URL}/api/riot/auth/authorize`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    const data = await response.json();

    // Rediriger vers Riot OAuth
    window.location.href = data.authorization_url;
  } catch (error) {
    console.error('Failed to start Riot OAuth:', error);
    toast?.error('Failed to connect to Riot');
  }
};

// Dans votre JSX:
<button onClick={handleRiotConnect}>
  <svg>...</svg> {/* Logo Riot */}
  Connect Riot Account
</button>
```

### 5. Tester

Même processus que Discord!

---

## Flux OAuth (Comment ça marche)

### Diagramme du flux:

```
1. User clique "Connect Discord/Riot"
   ↓
2. Frontend appelle /api/discord/auth/authorize
   ↓
3. Backend génère URL d'autorisation + state (CSRF protection)
   ↓
4. Frontend redirige vers Discord/Riot
   ↓
5. User se connecte et accepte les permissions
   ↓
6. Discord/Riot redirige vers /auth/discord/callback?code=ABC&state=XYZ
   ↓
7. Frontend (CallbackPage) appelle /api/discord/auth/callback?code=ABC&state=XYZ
   ↓
8. Backend échange le code contre un access_token
   ↓
9. Backend utilise l'access_token pour récupérer les infos utilisateur
   ↓
10. Backend stocke les infos + tokens dans la DB
    ↓
11. Frontend redirige vers le dashboard avec succès!
```

---

## API Endpoints disponibles

### Discord:

- `GET /api/discord/auth/authorize` - Obtenir l'URL d'autorisation
- `GET /api/discord/auth/callback?code=&state=` - Callback après OAuth
- `POST /api/discord/unlink` - Délier le compte Discord
- `GET /api/discord/status` - Obtenir le statut de connexion

### Riot:

- `GET /api/riot/auth/authorize` - Obtenir l'URL d'autorisation
- `GET /api/riot/auth/callback?code=&state=` - Callback après OAuth
- `POST /api/riot/verify` - Vérification manuelle (sans OAuth)
- `POST /api/riot/sync` - Synchroniser les données Riot
- `GET /api/riot/summoner` - Obtenir les données invocateur

---

## Tables de base de données

### DiscordOAuth (nouvelle):
```python
- id: String (UUID)
- user_id: String (Foreign Key → users.id)
- access_token: String
- refresh_token: String
- token_type: String
- expires_at: DateTime
- state: String (CSRF protection)
- discord_id: String
- discord_username: String
- discord_discriminator: String
- created_at: DateTime
- updated_at: DateTime
```

### RiotOAuth (existante):
```python
- id: String (UUID)
- user_id: String (Foreign Key → users.id)
- access_token: String
- refresh_token: String
- token_type: String
- expires_at: DateTime
- state: String (CSRF protection)
- created_at: DateTime
- updated_at: DateTime
```

### User (mis à jour):
```python
# Nouveaux champs Discord:
- discord: String (username tag)
- discord_id: String (Discord user ID)
- discord_verified: Boolean

# Champs Riot existants:
- riot_game_name: String
- riot_tag_line: String
- riot_puuid: String
- riot_region: String
- riot_platform: String
- riot_verified: Boolean
```

---

## Sécurité

### CSRF Protection:
- Paramètre `state` généré aléatoirement à chaque requête
- Vérifié lors du callback

### Tokens OAuth:
- Stockés de manière sécurisée en base de données
- Expiration gérée automatiquement
- Refresh tokens disponibles pour renouvellement

### Rate Limiting:
- Déjà configuré dans main.py
- Protection contre les abus

---

## Troubleshooting

### Discord OAuth ne fonctionne pas:

1. Vérifiez que `DISCORD_CLIENT_ID` et `DISCORD_CLIENT_SECRET` sont corrects
2. Vérifiez que l'URL de callback est exactement la même dans:
   - `.env` (DISCORD_REDIRECT_URI)
   - Discord Developer Portal (Redirects)
3. Vérifiez les logs du backend pour les erreurs

### Riot OAuth ne fonctionne pas:

1. Vérifiez que votre application est **approuvée** (pas "Pending Review")
2. Vérifiez que les credentials sont corrects
3. Vérifiez l'URL de callback

### Erreur "Invalid redirect_uri":

- L'URL dans `.env` doit correspondre EXACTEMENT à celle configurée sur Discord/Riot
- Incluez le protocole: `http://` ou `https://`
- Pas de trailing slash: `/callback` pas `/callback/`

---

## Production

Pour la production, changez les redirect URIs dans:

1. **Discord Developer Portal**:
   - `https://openrift.cloud/auth/discord/callback`

2. **Riot Developer Portal**:
   - `https://openrift.cloud/auth/riot/callback`

3. **Backend .env**:
   ```bash
   DISCORD_REDIRECT_URI=https://openrift.cloud/auth/discord/callback
   RIOT_REDIRECT_URI=https://openrift.cloud/auth/riot/callback
   ```

---

## Prochaines étapes

1. ✅ Créer l'application Discord → Obtenir Client ID/Secret
2. ✅ Configurer `.env` avec les credentials Discord
3. ⏳ Attendre l'approbation Riot (App ID: 788778)
4. ⏳ Configurer `.env` avec les credentials Riot (une fois approuvé)
5. 🔲 Ajouter les boutons "Connect Discord" et "Connect Riot" dans l'UI
6. 🔲 Tester le flux complet en développement
7. 🔲 Déployer en production avec les bonnes redirect URIs

---

## Support

Si vous avez des questions:
- Discord: https://discord.com/developers/docs/topics/oauth2
- Riot: https://developer.riotgames.com/docs/lol
