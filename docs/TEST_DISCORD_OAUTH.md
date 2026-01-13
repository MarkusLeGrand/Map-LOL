# Test Discord OAuth - Guide rapide

## ✅ Configuration terminée

Vous avez déjà:
- ✅ Créé l'application Discord
- ✅ Configuré le `.env` avec DISCORD_CLIENT_ID et DISCORD_CLIENT_SECRET
- ✅ Ajouté le redirect URI: `http://localhost:3000/auth/discord/callback`
- ✅ Intégré le bouton dans SettingsPage.tsx

## 🚀 Étapes de test

### 1. Redémarrer le backend

```bash
cd backend
python -m app.main
```

**Vérifiez dans les logs:**
- `OpenRift API started successfully!`
- Pas d'erreur d'import pour `discord_routes`
- Table `discord_oauth` créée automatiquement

### 2. Démarrer le frontend

```bash
cd frontend
npm run dev
```

### 3. Tester le flux OAuth

1. **Allez sur:** http://localhost:3000/login
2. **Connectez-vous** avec votre compte
3. **Allez dans Settings:** http://localhost:3000/settings
4. **Cliquez sur "Connect with Discord"** (bouton bleu avec logo Discord)
5. **Vous serez redirigé vers Discord** pour autoriser
6. **Autorisez l'application**
7. **Vous serez redirigé vers** `/auth/discord/callback`
8. **Vous verrez un message de succès** avec votre Discord tag
9. **Vous serez redirigé vers le dashboard**

### 4. Vérifier que ça a marché

**Dans Settings, vous devriez voir:**
- ✅ Votre Discord tag (ex: "username#0000" ou "username")
- ✅ Badge "Verified via OAuth" en vert
- ✅ Bouton "Disconnect" en rouge

**Dans la base de données:**
```bash
cd backend
python
>>> from app.database import SessionLocal, User, DiscordOAuth
>>> db = SessionLocal()
>>> user = db.query(User).first()
>>> print(user.discord)  # Votre Discord tag
>>> print(user.discord_verified)  # True
>>> oauth = db.query(DiscordOAuth).filter_by(user_id=user.id).first()
>>> print(oauth.discord_username)  # Votre username Discord
```

## 🐛 Troubleshooting

### Erreur: "Invalid redirect_uri"

**Problème:** L'URL dans Discord Developer Portal ne correspond pas exactement à celle du `.env`

**Solution:**
1. Vérifiez dans Discord Developer Portal → OAuth2 → Redirects
2. URL exacte: `http://localhost:3000/auth/discord/callback`
3. Vérifiez dans `.env`: `DISCORD_REDIRECT_URI=http://localhost:3000/auth/discord/callback`
4. Pas de trailing slash `/`
5. Protocole `http://` et non `https://` en local

### Erreur: "Failed to get Discord authorization URL"

**Problème:** Le backend ne reçoit pas les credentials Discord

**Solution:**
1. Vérifiez que le `.env` est dans `backend/.env`
2. Redémarrez le backend après avoir modifié `.env`
3. Vérifiez les variables:
   ```bash
   cd backend
   python
   >>> import os
   >>> from dotenv import load_dotenv
   >>> load_dotenv()
   >>> print(os.getenv("DISCORD_CLIENT_ID"))
   >>> print(os.getenv("DISCORD_CLIENT_SECRET"))
   ```

### Erreur: "Token not found" ou "Not authenticated"

**Problème:** Vous n'êtes pas connecté

**Solution:**
1. Connectez-vous d'abord sur `/login`
2. Vérifiez que le token est dans localStorage:
   - Ouvrez DevTools (F12)
   - Application → Local Storage
   - Vérifiez qu'il y a une clé `token`

### Le callback ne fonctionne pas

**Problème:** La route `/auth/discord/callback` n'existe pas

**Solution:**
1. Vérifiez que DiscordCallbackPage.tsx existe
2. Vérifiez que la route est dans App.tsx:
   ```typescript
   <Route path="/auth/discord/callback" element={<DiscordCallbackPage />} />
   ```
3. Redémarrez le frontend

### Erreur dans les logs backend: "ModuleNotFoundError: No module named 'routes.discord_routes'"

**Problème:** Le fichier discord_routes.py n'existe pas ou n'est pas au bon endroit

**Solution:**
1. Vérifiez que le fichier existe: `backend/app/routes/discord_routes.py`
2. Vérifiez qu'il n'y a pas d'erreur de syntaxe dans le fichier
3. Redémarrez le backend

## 📊 Points à tester

### Test complet:

- [ ] Cliquer sur "Connect with Discord"
- [ ] Redirection vers Discord
- [ ] Autoriser l'application
- [ ] Redirection vers callback
- [ ] Message de succès
- [ ] Redirection vers dashboard
- [ ] Discord tag visible dans Settings
- [ ] Badge "Verified via OAuth" présent
- [ ] Bouton "Disconnect" fonctionne
- [ ] Après disconnect, le tag disparaît
- [ ] Peut se reconnecter après disconnect

### Test des cas d'erreur:

- [ ] Refuser l'autorisation Discord → Message d'erreur
- [ ] Mauvais credentials dans `.env` → Message d'erreur
- [ ] Pas de connexion internet → Message d'erreur
- [ ] Token expiré → Message d'erreur

## 🎉 Succès!

Si tout fonctionne, vous devriez voir:
1. ✅ Discord tag affiché dans Settings
2. ✅ Badge "Verified via OAuth"
3. ✅ Données stockées en DB (DiscordOAuth + User.discord)
4. ✅ Peut disconnect/reconnect sans problème

## 📝 Logs à surveiller

### Backend (terminal):
```
OpenRift API started successfully!
Database initialized successfully!
```

### Frontend (console):
```
Successfully linked Discord account: username#0000
```

### Discord Developer Portal:
Allez dans votre app → OAuth2 → Usage Statistics
Vous devriez voir des requêtes dans les graphiques!

## 🔒 Sécurité vérifiée

- ✅ CSRF protection via `state` parameter
- ✅ Tokens stockés de manière sécurisée
- ✅ Refresh tokens pour renouvellement automatique
- ✅ OAuth 2.0 standard
- ✅ HTTPS en production (configurez les redirect URIs)

---

**Besoin d'aide?**
Consultez [OAUTH_SETUP_GUIDE.md](OAUTH_SETUP_GUIDE.md) pour le guide complet.
