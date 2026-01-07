# 👑 Admin Guide - OpenRift

## Devenir Admin

### En Production (VPS)

```bash
# 1. Se connecter au VPS
ssh root@openrift.cloud

# 2. Accéder au répertoire
cd /var/www/openrift/Map-LOL

# 3. Ouvrir un shell Python dans le container
docker compose exec backend python

# 4. Exécuter les commandes Python
from app.database import SessionLocal, User
db = SessionLocal()
user = db.query(User).filter(User.email == "TON_EMAIL@example.com").first()
user.is_admin = True
db.commit()
print(f"{user.username} is now admin!")
exit()
```

### En Local (Dev)

```bash
cd backend
python

>>> from app.database import SessionLocal, User
>>> db = SessionLocal()
>>> user = db.query(User).filter(User.email == "TON_EMAIL").first()
>>> user.is_admin = True
>>> db.commit()
>>> exit()
```

---

## Endpoints Admin

Une fois admin, tu as accès à:

### 📊 Statistiques Globales
- **GET** `/api/admin/stats` - Stats de la plateforme
  - Nombre total d'utilisateurs, équipes, scrims
  - Utilisateurs actifs (7 derniers jours)
  - Nouveaux utilisateurs
  - Usage des outils
  - Graphique d'inscription

### 👥 Gestion Utilisateurs
- **GET** `/api/admin/users` - Liste tous les utilisateurs
  - Paramètres: `skip`, `limit`, `search`
- **GET** `/api/admin/users/{user_id}` - Détails d'un utilisateur
- **DELETE** `/api/admin/users/{user_id}` - Supprimer un utilisateur
- **PATCH** `/api/admin/users/{user_id}/toggle-active` - Ban/Unban

### 🏆 Gestion Équipes
- **GET** `/api/admin/teams` - Liste toutes les équipes
- **DELETE** `/api/admin/teams/{team_id}` - Supprimer une équipe

---

## Vérifier si Admin

```bash
# Via API
curl -H "Authorization: Bearer YOUR_TOKEN" https://openrift.cloud/api/auth/me

# Regarde le champ "is_admin": true
```

---

## Notes de Sécurité

⚠️ **IMPORTANT:**
- Ne pas partager ton compte admin
- Utiliser un mot de passe fort (min 12 caractères)
- Activer 2FA si implémenté
- Les actions admin sont loggées (à implémenter)

---

## TODO Admin Features

- [ ] Page admin dans le frontend
- [ ] Logs des actions admin
- [ ] Dashboard admin avec charts
- [ ] Export des données utilisateurs (RGPD)
- [ ] Modération de contenu
