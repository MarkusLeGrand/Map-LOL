# Development Setup Guide

## Port Configuration

**IMPORTANT**: Development and Production use different ports!

- **Port 8000**: Production backend (Docker)
- **Port 8001**: Development backend (local)
- **Port 80**: Production frontend (Docker)
- **Port 5173**: Development frontend (Vite)

## Running Development Environment

### 1. Start Backend Dev (Port 8001)

```bash
cd backend
run_dev.bat
```

Or manually:
```bash
cd backend/app
uvicorn main:app --reload --host 0.0.0.0 --port 8001
```

### 2. Start Frontend Dev (Port 5173)

```bash
cd frontend
npm run dev
```

Frontend will connect to `http://localhost:8001` (backend dev)

## Running Production Environment

### Start Docker Containers

```bash
docker-compose up -d
```

- Backend: `http://localhost:8000`
- Frontend: `http://localhost:80`

## Switching Environments

Edit `frontend/.env` to change the API URL:

```env
# Local Dev Backend (Port 8001)
VITE_API_URL=http://localhost:8001

# Production Backend Docker (Port 8000)
# VITE_API_URL=http://localhost:8000

# VPS Production
# VITE_API_URL=https://openrift.cloud
```

**Remember to restart the frontend after changing `.env`!**

## Database Locations

- **Dev**: `backend/app/openrift.db`
- **Prod (Docker)**: Docker volume `backend-data`

## Common Issues

### "Port 8000 already in use"
Docker is running. Use port 8001 for dev or stop Docker:
```bash
docker-compose down
```

### Frontend connects to wrong backend
Check `frontend/.env` and restart frontend dev server.

### Database schema mismatch
Run migrations or add missing columns:
```bash
cd backend/app
sqlite3 openrift.db "ALTER TABLE teams ADD COLUMN is_locked BOOLEAN DEFAULT 0;"
```
