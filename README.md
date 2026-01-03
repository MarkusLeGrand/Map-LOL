# 🎮 OpenRift - League of Legends Analytics Platform

**OpenRift** est une plateforme complète d'analyse et de stratégie pour League of Legends, combinant tactical board interactif, analytics de scrims, et gestion d'équipes.

🌐 **Live:** [openrift.cloud](https://openrift.cloud)
📊 **Status:** [UptimeRobot Monitor](https://stats.uptimerobot.com/)

---

## ✨ Features Principales

### 🗺️ Tactical Map
- **Champion Tokens** draggables pour tous les joueurs
- **Système de vision** avancé avec Fog of War
- **Ward placement** (Vision & Control wards)
- **Fae'lights** pour zones stratégiques
- **Drawing tools** (pen, eraser)
- **Export PNG** des setups tactiques

### 📊 Scrim Analytics
- **Upload de données** (format JSON Riot API)
- **Statistiques détaillées** par joueur et match
- **Charts interactifs** (KDA, CS, vision score, etc.)
- **Sauvegarde personnelle** (5 analyses max/user)
- **Partage d'équipe** (10 analyses max/team)

### 👥 Teams & Scrims
- **Création d'équipes** avec tags et couleurs
- **Invitations de membres** (roles: owner, member)
- **Calendrier de scrims** avec adversaires
- **Gestion de permissions** (kick, promote, leave)

### 🔐 Auth & Profil
- **Authentification JWT** sécurisée
- **Riot ID integration** (Game Name + Tag)
- **Favorite tools** customisables
- **Admin dashboard** pour modération

---

## 🚀 Quick Start

### Production (Déploiement VPS)

```bash
# 1. Cloner le repo
git clone https://github.com/yourusername/Map-LOL.git
cd Map-LOL

# 2. Configurer les variables d'environnement
cp .env.example .env
# Éditer .env avec vos valeurs

# 3. Lancer avec Docker
docker compose up -d

# 4. Accéder à l'app
# Frontend: http://your-vps-ip
# Backend: http://your-vps-ip/api
```

### Développement Local

```bash
# Backend
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload

# Frontend
cd tactical-board
npm install
npm run dev
```

---

## 📁 Structure du Projet

```
Map-LOL/
├── backend/                    # FastAPI Backend
│   ├── app/
│   │   ├── main.py            # Application principale
│   │   ├── routes/            # Routes modulaires (NEW!)
│   │   │   ├── health.py      # Health checks
│   │   │   ├── auth_routes.py # Authentification
│   │   │   ├── teams_routes.py # Teams management
│   │   │   └── scrims_routes.py # Scrims
│   │   ├── database.py        # Models SQLAlchemy
│   │   ├── auth.py            # JWT & auth utils
│   │   ├── teams.py           # Teams business logic
│   │   └── analytics.py       # Analytics processing
│   ├── data/                  # SQLite DB (persistent)
│   ├── uploads/               # Fichiers analytics
│   ├── exports/               # Charts générés
│   └── Dockerfile
├── tactical-board/            # React Frontend
│   ├── src/
│   │   ├── components/        # UI components
│   │   ├── contexts/          # React contexts (Auth, etc.)
│   │   ├── pages/             # Pages principales
│   │   ├── utils/             # Helpers
│   │   └── types.ts
│   └── Dockerfile
├── nginx/                     # Reverse proxy
│   └── nginx.conf
├── docs/                      # Documentation (NEW!)
│   ├── ADMIN.md              # Guide admin
│   ├── AUTH_SETUP.md         # Setup authentification
│   └── BACKUP.md             # Backups & maintenance
├── docker-compose.yml
├── deploy.sh                 # Script de déploiement
└── README.md                 # Ce fichier
```

---

## 📚 Documentation

- **[ADMIN.md](docs/ADMIN.md)** - Devenir admin, endpoints admin
- **[AUTH_SETUP.md](docs/AUTH_SETUP.md)** - Configuration authentification
- **[BACKUP.md](docs/BACKUP.md)** - Backups automatiques, restoration
- **[QUICKSTART.md](QUICKSTART.md)** - Guide de démarrage rapide

---

## 🛠️ Tech Stack

### Backend
- **FastAPI** - API REST moderne
- **SQLAlchemy** - ORM Python
- **SQLite** - Base de données (prod-ready)
- **JWT** - Authentification sécurisée
- **Passlib + Bcrypt** - Hash passwords
- **Pandas** - Analytics processing

### Frontend
- **React 19.2** + **TypeScript**
- **Tailwind CSS** - Styling
- **Vite** - Build tool ultra-rapide
- **HTML5 Canvas** - Vision & Fog of War
- **Recharts** - Charts interactifs

### Infrastructure
- **Docker + Docker Compose** - Containerisation
- **Nginx** - Reverse proxy & static files
- **UptimeRobot** - Monitoring gratuit
- **Cron** - Backups automatiques (daily 2 AM)

---

## 🔒 Sécurité & Maintenance

### ✅ Implémenté
- [x] Passwords hashés (bcrypt)
- [x] JWT tokens avec expiration
- [x] CORS configuré
- [x] /docs désactivé en production
- [x] Rate limiting sur auth endpoints
- [x] Health checks pour monitoring
- [x] Backups DB automatiques (daily)
- [x] Cleanup analytics automatique (7 jours)

### 📋 À Faire
- [ ] HTTPS/SSL avec Let's Encrypt
- [ ] Error tracking (Sentry)
- [ ] CI/CD pipeline (GitHub Actions)
- [ ] Email verification
- [ ] Rate limiting global

---

## 📊 Monitoring

- **UptimeRobot:** Vérifie `/api/health` toutes les 5 minutes
- **Health Endpoints:**
  - `GET /health` - Basic health check
  - `GET /api/health` - Health check avec DB test
  - `GET /` - Status de l'API

```bash
# Vérifier manuellement
curl https://openrift.cloud/api/health
```

---

## 🚀 Déploiement

### Déploiement Automatique

```bash
# Sur le VPS
cd /var/www/openrift/Map-LOL
./deploy.sh
```

### Déploiement Manuel

```bash
# Pull latest changes
git pull origin main

# Rebuild & restart
docker compose down
docker compose build
docker compose up -d

# Check logs
docker compose logs -f
```

---

## 🐛 Troubleshooting

### Backend ne démarre pas
```bash
docker compose logs backend
docker compose exec backend python -c "import app.main"
```

### Frontend ne build pas
```bash
cd tactical-board
npm run build
```

### Database reset
```bash
# Restore from backup
docker compose exec backend /app/restore_db.sh
```

### Vérifier disk space
```bash
df -h
du -sh backend/uploads
```

---

## 📝 Variables d'Environnement

### Backend (.env)
```bash
DATABASE_URL=sqlite:///./data/openrift.db
SECRET_KEY=your-secret-key-change-in-production
CORS_ORIGINS=https://openrift.cloud
ENVIRONMENT=production
```

### Frontend (.env)
```bash
VITE_API_URL=https://openrift.cloud/api
```

---

## 🤝 Contributing

Les contributions sont les bienvenues! Ouvre une issue avant de soumettre une PR.

### Workflow
1. Fork le projet
2. Crée une branche (`git checkout -b feature/AmazingFeature`)
3. Commit tes changements (`git commit -m 'Add AmazingFeature'`)
4. Push vers la branche (`git push origin feature/AmazingFeature`)
5. Ouvre une Pull Request

---

## 📄 License

MIT License - Utilise librement pour projets personnels ou commerciaux.

---

## 🙏 Crédits

- **Map data:** Riot Games (League of Legends)
- **Icons:** Heroicons
- **Hosting:** VPS auto-hébergé

---

## 📞 Support

- **Issues:** [GitHub Issues](https://github.com/yourusername/Map-LOL/issues)
- **Email:** support@openrift.cloud
- **Status:** [openrift.cloud/api/health](https://openrift.cloud/api/health)

---

**Made with ❤️ for the League of Legends competitive community**
