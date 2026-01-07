# 🔐 Authentication System Setup Guide

## ✅ Ce qui a été créé

### **Backend (FastAPI)**

1. **Database Models** - [`backend/app/database.py`](backend/app/database.py)
   - User model avec email, username, password hash
   - Riot integration (game_name, tag_line, puuid, region)
   - UserAnalytics model pour sauvegarder les analyses
   - SQLAlchemy + SQLite (facile à migrer vers PostgreSQL)

2. **Auth Utilities** - [`backend/app/auth.py`](backend/app/auth.py)
   - Password hashing avec bcrypt
   - JWT token generation & validation
   - User creation & authentication
   - Protected route dependencies

3. **API Endpoints** - [`backend/app/main.py`](backend/app/main.py)
   - `POST /api/auth/register` - Créer un compte
   - `POST /api/auth/login` - Se connecter (retourne JWT)
   - `GET /api/auth/me` - Obtenir l'utilisateur connecté
   - `PUT /api/auth/me` - Mettre à jour le profil

### **Frontend (React + TypeScript)**

4. **Auth Context** - [`tactical-board/src/contexts/AuthContext.tsx`](tactical-board/src/contexts/AuthContext.tsx)
   - Gestion globale de l'état d'authentification
   - Fonctions: login, register, logout
   - Auto-load du token depuis localStorage

5. **Pages d'authentification**
   - [`tactical-board/src/pages/auth/LoginPage.tsx`](tactical-board/src/pages/auth/LoginPage.tsx)
   - [`tactical-board/src/pages/auth/SignupPage.tsx`](tactical-board/src/pages/auth/SignupPage.tsx)
   - [`tactical-board/src/pages/auth/DashboardPage.tsx`](tactical-board/src/pages/auth/DashboardPage.tsx)

6. **Header mis à jour** - [`tactical-board/src/components/layout/Header.tsx`](tactical-board/src/components/layout/Header.tsx)
   - Affiche Login/Signup si non connecté
   - Affiche Dashboard/Logout si connecté
   - Nom d'utilisateur visible

7. **Routes ajoutées** - [`tactical-board/src/App.tsx`](tactical-board/src/App.tsx)
   - `/login` → LoginPage
   - `/signup` → SignupPage
   - `/dashboard` → DashboardPage

---

## 🚀 Installation

### **1. Installer les dépendances Python**

```bash
cd backend
pip install -r requirements.txt
```

Nouvelles dépendances ajoutées :
- `passlib[bcrypt]` - Hash passwords
- `python-jose[cryptography]` - JWT tokens
- `sqlalchemy` - ORM database
- `email-validator` - Validation email

### **2. Lancer le backend**

```bash
cd backend
run.bat
```

Au démarrage, la base de données SQLite sera créée automatiquement : `backend/leaguehub.db`

### **3. Lancer le frontend**

```bash
cd tactical-board
npm run dev
```

---

## 🎯 Comment tester

### **1. Créer un compte**

1. Aller sur http://localhost:5173
2. Cliquer sur "Sign Up" dans le header
3. Remplir le formulaire :
   - Email: `test@example.com`
   - Username: `TestUser`
   - Password: `password123`
   - Riot ID (optionnel): `Faker` / `KR1`
4. Cliquer "Create Account"
5. → Redirection automatique vers `/dashboard`

### **2. Se connecter**

1. Cliquer sur "Login"
2. Entrer email + password
3. → Redirection vers `/dashboard`

### **3. Tester le Dashboard**

- Voir vos infos (username, Riot ID, date de création)
- Accéder aux outils favoris
- Se déconnecter

### **4. Tester avec Swagger UI**

Aller sur http://localhost:8000/docs pour tester l'API directement :

1. **Register** → `POST /api/auth/register`
2. **Login** → `POST /api/auth/login` (copier le token)
3. **Authorize** → Cliquer sur le cadenas, coller `Bearer <token>`
4. **Get Me** → `GET /api/auth/me`

---

## 📊 Structure de la base de données

### **Table: users**

| Colonne | Type | Description |
|---------|------|-------------|
| id | UUID | ID unique |
| email | String | Email (unique, indexé) |
| username | String | Username (unique, indexé) |
| hashed_password | String | Password hashé (bcrypt) |
| riot_game_name | String | Riot ID (ex: "Faker") |
| riot_tag_line | String | Tag (ex: "KR1") |
| riot_puuid | String | ID universel Riot |
| riot_region | String | Région (EUW1, NA1, etc.) |
| created_at | DateTime | Date de création |
| last_login | DateTime | Dernière connexion |
| is_active | Boolean | Compte actif |
| is_verified | Boolean | Email vérifié |
| favorite_tools | JSON | Liste des outils favoris |
| theme | String | Thème (dark/light) |

### **Table: user_analytics**

| Colonne | Type | Description |
|---------|------|-------------|
| id | UUID | ID unique |
| user_id | UUID | FK vers users |
| uploaded_at | DateTime | Date d'upload |
| file_name | String | Nom du fichier |
| players_count | String | Nombre de joueurs |
| data_path | String | Chemin du fichier |
| analysis_results | JSON | Résultats d'analyse (cache) |

---

## 🔐 Sécurité implémentée

✅ **Passwords hashés** avec bcrypt (JAMAIS stockés en clair)
✅ **JWT tokens** avec expiration (24h)
✅ **Email validation** côté backend
✅ **Protected routes** avec dependency injection
✅ **CORS configuré** pour le frontend
✅ **Unique constraints** sur email et username

---

## 🛠 Prochaines étapes possibles

### **Phase 1 : Riot API Integration**
- Vérifier le Riot ID lors de l'inscription
- Fetch automatique du rank, winrate, etc.
- Afficher les stats sur le dashboard

### **Phase 2 : User Analytics Persistence**
- Sauvegarder les analyses uploadées par utilisateur
- Historique des analyses
- Comparaison entre analyses

### **Phase 3 : Features avancées**
- Email verification
- Password reset
- OAuth (Google, Discord)
- Teams & invitations

---

## 🐛 Troubleshooting

### **Problème : "Module not found: passlib"**

**Solution :**
```bash
cd backend
pip install -r requirements.txt
```

### **Problème : "CORS error" dans le navigateur**

**Solution :** Vérifier que le backend tourne sur port 8000 et le frontend sur 5173

### **Problème : "Cannot find name 'useAuth'"**

**Solution :** Le AuthContext est importé dans App.tsx. Redémarrer le dev server React.

### **Problème : "Token expired"**

**Solution :** Re-login. Les tokens expirent après 24h.

---

## 📝 Notes importantes

1. **SECRET_KEY** : Changer la clé secrète dans `backend/app/auth.py` en production
2. **Database** : SQLite pour dev, PostgreSQL recommandé pour production
3. **HTTPS** : Utiliser HTTPS en production (obligatoire pour les tokens)
4. **Rate limiting** : À implémenter pour éviter brute force sur login

---

**Tout est prêt ! 🎉**

L'authentification complète est fonctionnelle. Les utilisateurs peuvent :
- ✅ S'inscrire avec email + username + password
- ✅ Ajouter leur Riot ID (optionnel)
- ✅ Se connecter et obtenir un JWT token
- ✅ Accéder à leur dashboard personnel
- ✅ Se déconnecter

Le système est prêt pour être étendu avec la persistence des analytics, l'intégration Riot API, et plus encore !
