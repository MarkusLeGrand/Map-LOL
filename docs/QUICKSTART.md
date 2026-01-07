# 🚀 OpenRift - Quick Start Guide

Guide ultra-rapide pour démarrer avec OpenRift, localement ou en production.

---

## 🏠 Développement Local

### Backend (FastAPI)

```bash
# 1. Installer les dépendances
cd backend
pip install -r requirements.txt

# 2. Lancer le serveur
uvicorn app.main:app --reload --port 8000

# 3. Vérifier
curl http://localhost:8000/health
# ✅ {"status":"healthy","database":"connected"}

# 4. Accéder à l'API doc
# http://localhost:8000/docs
```

### Frontend (React + Vite)

```bash
# 1. Installer les dépendances
cd tactical-board
npm install

# 2. Créer le fichier .env
echo "VITE_API_URL=http://localhost:8000" > .env

# 3. Lancer le dev server
npm run dev

# 4. Ouvrir le navigateur
# http://localhost:5173
```

---

## 🌐 Production (VPS avec Docker)

### Setup Initial

```bash
# 1. Cloner le repo
git clone https://github.com/yourusername/Map-LOL.git
cd Map-LOL

# 2. Configurer l'environnement
cp .env.example .env
nano .env  # Éditer SECRET_KEY, CORS_ORIGINS, etc.

# 3. Lancer Docker Compose
docker compose up -d

# 4. Vérifier les containers
docker compose ps

# 5. Check les logs
docker compose logs -f
```

### Déploiements Suivants

```bash
# Utilise le script automatique
./deploy.sh

# Ou manuellement
git pull
docker compose down
docker compose build
docker compose up -d
```

---

## 👤 Créer un Compte

### Via Interface Web

1. Aller sur `http://localhost:5173` (ou ton domaine)
2. Cliquer **"Sign Up"**
3. Remplir:
   - Email: `ton.email@example.com`
   - Username: `TonUsername`
   - Password: `motdepasse123`
   - Riot ID (optionnel): `RiotGameName#TAG1`
4. Cliquer **"Create Account"**

### Via API (curl)

```bash
curl -X POST http://localhost:8000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "username": "TestUser",
    "password": "password123",
    "riot_game_name": "Faker",
    "riot_tag_line": "KR1"
  }'
```

---

## 🔑 Se Connecter

### Via Interface

1. Cliquer **"Login"**
2. Email: `ton.email@example.com`
3. Password: `motdepasse123`
4. → Redirection vers Dashboard

### Via API

```bash
# 1. Login pour obtenir le token
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=test@example.com&password=password123"

# Response:
# {"access_token":"eyJ...","token_type":"bearer"}

# 2. Utiliser le token
TOKEN="eyJ..."
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:8000/api/auth/me
```

---

## 👑 Devenir Admin

```bash
# En local
cd backend
python

>>> from app.database import SessionLocal, User
>>> db = SessionLocal()
>>> user = db.query(User).filter(User.email == "ton.email@example.com").first()
>>> user.is_admin = True
>>> db.commit()
>>> exit()
```

```bash
# En production (VPS)
ssh root@openrift.cloud
cd /var/www/openrift/Map-LOL
docker compose exec backend python

>>> from app.database import SessionLocal, User
>>> db = SessionLocal()
>>> user = db.query(User).filter(User.email == "ton.email@example.com").first()
>>> user.is_admin = True
>>> db.commit()
>>> exit()
```

---

## 📊 Tester les Analytics

### 1. Upload un fichier JSON

```bash
# Format attendu: Riot API matches format
# { "matches": [ {...}, {...} ] }

curl -X POST http://localhost:8000/api/upload-scrim-data \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "file=@scrim_data.json"
```

### 2. Analyser les données

```bash
curl -X POST http://localhost:8000/api/analyze-scrim \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "file_path": "/path/to/uploaded/file.json",
    "team_riot_ids": ["Player1#EUW", "Player2#EUW"]
  }'
```

---

## 👥 Créer une Team

### Via Interface

1. Dashboard → **"Create Team"**
2. Name: `OpenRift Academy`
3. Tag: `ORA`
4. Description: `Équipe de scrims`
5. Color: `#3B82F6` (bleu)
6. Submit

### Via API

```bash
curl -X POST http://localhost:8000/api/teams/create \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "OpenRift Academy",
    "tag": "ORA",
    "description": "Équipe de scrims",
    "team_color": "#3B82F6",
    "max_members": 10
  }'
```

---

## 🗺️ Utiliser le Tactical Board

1. Aller sur l'onglet **"Map"**
2. **Placer des champions:**
   - Cliquer sur un token (droite)
   - Cliquer sur la map pour placer
3. **Placer des wards:**
   - Sélectionner "Vision Ward" ou "Control Ward"
   - Cliquer sur la map
4. **Dessiner:**
   - Sélectionner "Pen"
   - Cliquer et glisser pour dessiner
5. **Exporter:**
   - Cliquer "Export to PNG"

---

## 🔧 Troubleshooting Rapide

### Backend ne démarre pas

```bash
# Vérifier les logs
docker compose logs backend

# Ou en local
cd backend
python -c "import app.main"
```

### Frontend ne se connecte pas

```bash
# Vérifier .env
cat tactical-board/.env
# VITE_API_URL=http://localhost:8000

# Rebuild
cd tactical-board
npm run build
```

### Database corrompue

```bash
# Restore depuis backup
docker compose exec backend /app/restore_db.sh

# Ou restart from scratch
docker compose down -v
docker compose up -d
```

### CORS errors

```bash
# Vérifier CORS_ORIGINS dans backend/.env
# Doit inclure ton domaine frontend
CORS_ORIGINS=http://localhost:5173,https://openrift.cloud
```

---

## 📖 Documentation Complète

- **[README.md](README.md)** - Overview complet
- **[ADMIN.md](docs/ADMIN.md)** - Guide admin
- **[AUTH_SETUP.md](docs/AUTH_SETUP.md)** - Setup auth détaillé
- **[BACKUP.md](docs/BACKUP.md)** - Backups & restore

---

## ✅ Checklist Première Utilisation

- [ ] Backend running (`curl localhost:8000/health`)
- [ ] Frontend running (`http://localhost:5173`)
- [ ] Compte créé
- [ ] Login réussi
- [ ] Dashboard accessible
- [ ] Team créée
- [ ] Riot ID configuré
- [ ] Analytics testés
- [ ] Map utilisée

**Tout fonctionne? 🎉 Tu es prêt à utiliser OpenRift!**

---

**Support:** [GitHub Issues](https://github.com/yourusername/Map-LOL/issues)
