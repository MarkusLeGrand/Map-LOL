# OpenRift Analytics Backend

FastAPI backend for League of Legends scrim data analytics.

## 🚀 Quick Start

### 1. Install dependencies

```bash
cd backend
pip install -r requirements.txt
```

### 2. Configure environment

```bash
# Copy example env file
cp .env.example .env

# Generate SECRET_KEY
openssl rand -hex 32

# Edit .env and set your SECRET_KEY
```

### 3. Run the server

```bash
python -m uvicorn app.main:app --reload --port 8000
```

### 4. Access the API

- **API:** http://localhost:8000
- **Docs (Swagger):** http://localhost:8000/docs
- **ReDoc:** http://localhost:8000/redoc

## 📁 Project Structure

```
backend/
├── app/
│   ├── main.py          # FastAPI application
│   ├── auth.py          # Authentication & JWT
│   ├── database.py      # Database models
│   ├── teams.py         # Team management
│   └── analytics.py     # Analytics processing logic
├── uploads/             # Uploaded JSON files
├── exports/             # Generated charts and reports
├── data/                # Static data files
├── requirements.txt     # Python dependencies
├── .env                 # Environment variables (not in git)
└── README.md
```

## 🔐 Security Features

- ✅ JWT Authentication with bcrypt password hashing
- ✅ Rate limiting on auth endpoints (5 requests/minute)
- ✅ Environment-based configuration
- ✅ CORS protection
- ✅ Secure SECRET_KEY from environment

## 🔌 API Endpoints

### Authentication
```http
POST /api/auth/register     # Register new user (rate limited)
POST /api/auth/login        # Login (rate limited)
GET  /api/auth/me           # Get current user
PUT  /api/auth/profile      # Update profile
PUT  /api/auth/password     # Change password
```

### Teams
```http
POST /api/teams             # Create team
GET  /api/teams             # List user teams
GET  /api/teams/{id}        # Get team details
PUT  /api/teams/{id}        # Update team
POST /api/teams/invites     # Create invite
GET  /api/teams/invites     # List invites
POST /api/teams/invites/{id}/accept  # Accept invite
```

### Analytics
```http
POST /api/upload-scrim-data # Upload scrim data
POST /api/analyze-scrim     # Analyze scrim
GET  /api/players-stats     # Get player stats
GET  /api/charts/{name}     # Get chart
```

## 🔧 Development

### Environment Variables

Required in `.env`:
```env
SECRET_KEY=<generated-with-openssl-rand-hex-32>
DATABASE_URL=sqlite:///./app/openrift.db
CORS_ORIGINS=http://localhost:5173,http://localhost:3000
ENVIRONMENT=development
```

### Run with auto-reload
```bash
uvicorn app.main:app --reload --port 8000
```

## 🐳 Docker (Future)

```dockerfile
FROM python:3.12-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY app/ ./app/

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

## 📝 License

MIT
