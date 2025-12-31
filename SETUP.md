# OpenRift - Setup Guide

## Environment Variables Setup

### Backend (.env)

The backend uses environment variables for security and configuration.

1. **Copy the example file:**
   ```bash
   cd backend
   cp .env.example .env
   ```

2. **Generate a secure SECRET_KEY:**
   ```bash
   openssl rand -hex 32
   ```

3. **Update `backend/.env` with your generated key:**
   ```env
   SECRET_KEY=your-generated-key-here
   DATABASE_URL=sqlite:///./app/openrift.db
   CORS_ORIGINS=http://localhost:5173,http://localhost:3000
   ENVIRONMENT=development
   ```

### Frontend (.env)

The frontend uses environment variables to configure the API URL.

1. **Copy the example file:**
   ```bash
   cd frontend
   cp .env.example .env
   ```

2. **The default `.env` should contain:**
   ```env
   VITE_API_URL=http://localhost:8000
   ```

## Development Setup

### Backend

```bash
cd backend
pip install -r requirements.txt
python -m uvicorn app.main:app --reload --port 8000
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

## Production Deployment

### Update Environment Variables

**Backend `.env`:**
```env
SECRET_KEY=<secure-random-key>
DATABASE_URL=sqlite:///./app/openrift.db
CORS_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
ENVIRONMENT=production
```

**Frontend `.env`:**
```env
VITE_API_URL=https://api.yourdomain.com
```

### Build Frontend

```bash
cd frontend
npm run build
```

The built files will be in `frontend/dist/`

## Security Notes

- ✅ SECRET_KEY is now loaded from environment variable
- ✅ .env files are in .gitignore (never commit them!)
- ✅ API URLs are configurable via environment
- ✅ CORS origins are configurable

**IMPORTANT:** Never commit `.env` files to git! Only commit `.env.example` files.

## What Changed?

1. **Backend:**
   - `auth.py`: SECRET_KEY now comes from `.env`
   - `main.py`: CORS origins now come from `.env`

2. **Frontend:**
   - `AuthContext.tsx`: API URL from environment
   - `TeamContext.tsx`: API URL from environment
   - `ProfilePage.tsx`: API URL from environment

3. **Files Added:**
   - `.env` (backend & frontend) - Your actual config (NOT in git)
   - `.env.example` (backend & frontend) - Template (IN git)
   - `.gitignore` - Prevents committing secrets

## Docker Deployment (Future)

When ready for Docker, update docker-compose.yml to use environment variables:

```yaml
services:
  backend:
    environment:
      - SECRET_KEY=${SECRET_KEY}
      - CORS_ORIGINS=${CORS_ORIGINS}
```

## Troubleshooting

**Backend won't start:**
- Make sure `python-dotenv` is installed: `pip install python-dotenv`
- Check that `.env` file exists in `backend/` directory
- Verify SECRET_KEY is set in `.env`

**Frontend can't connect to backend:**
- Check `VITE_API_URL` in `frontend/.env`
- Restart the dev server after changing `.env`: `npm run dev`
- Environment variables in Vite must start with `VITE_`
