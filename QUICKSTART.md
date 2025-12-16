# 🚀 Quick Start Guide - LeagueHub Data Analytics

## Architecture

```
┌─────────────────────┐         ┌──────────────────────┐
│   React Frontend    │────────>│  FastAPI Backend     │
│  (Port 5173)        │  HTTP   │  (Port 8000)         │
│                     │<────────│                      │
└─────────────────────┘         └──────────────────────┘
         │                               │
         │                               │
         v                               v
   User Interface              Python Analytics Engine
   - Upload JSON                - Process data (pandas)
   - View charts                - Generate charts (matplotlib)
   - Display stats              - Return JSON results
```

## 📦 Installation

### 1. Backend Setup (Python)

```bash
# Navigate to backend directory
cd backend

# Create virtual environment (recommended)
python -m venv venv

# Activate virtual environment
# Windows:
venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt
```

### 2. Frontend Setup (React)

```bash
# Navigate to frontend directory
cd tactical-board

# Install dependencies (if not already done)
npm install
```

## ▶️ Running the Application

### Step 1: Start the Backend (Terminal 1)

```bash
cd backend/app
python main.py
```

You should see:
```
INFO:     Uvicorn running on http://0.0.0.0:8000
INFO:     Application startup complete.
```

**API Documentation available at:**
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

### Step 2: Start the Frontend (Terminal 2)

```bash
cd tactical-board
npm run dev
```

You should see:
```
VITE ready in XXX ms
➜  Local:   http://localhost:5173/
```

### Step 3: Access the Application

1. Open your browser to: **http://localhost:5173**
2. Navigate to **Tools** page
3. Click on **"Data Analytics"** card
4. Upload your `analytics_data.json` file
5. View the generated statistics and charts!

## 📊 Data Format

Your `analytics_data.json` should follow this structure:

```json
{
  "generated_at": "2025-01-15T10:30:00",
  "team": "Your Team Name",
  "players": [
    {
      "name": "PlayerName",
      "position": "TOP",
      "games_played": 10,
      "wins": 6,
      "losses": 4,
      "winrate": 60.0,
      "kda": 3.5,
      "totals": {
        "kills": 45,
        "deaths": 20,
        "assists": 60
      },
      "averages": {
        "kill_participation": 65.5
      },
      "per_minute": {
        "damage": 450.2,
        "gold": 385.5,
        "cs": 7.2
      }
    }
  ]
}
```

## 🔧 Troubleshooting

### Backend won't start?

**Issue:** `ModuleNotFoundError: No module named 'fastapi'`

**Solution:**
```bash
cd backend
pip install -r requirements.txt
```

---

**Issue:** `Port 8000 already in use`

**Solution:**
```bash
# Find and kill process using port 8000
# Windows:
netstat -ano | findstr :8000
taskkill /PID <PID> /F

# Mac/Linux:
lsof -ti:8000 | xargs kill -9
```

### Frontend won't connect to backend?

**Issue:** `Failed to fetch` or CORS errors

**Solution:**
1. Make sure backend is running on port 8000
2. Check browser console for specific error
3. Verify CORS settings in `backend/app/main.py`

---

**Issue:** Charts not displaying

**Solution:**
1. Check backend logs for errors
2. Verify the `exports/charts/` directory exists
3. Try refreshing the page after upload

### JSON upload fails?

**Issue:** `Invalid JSON structure`

**Solution:**
1. Validate your JSON at https://jsonlint.com
2. Ensure it has a `"players"` array
3. Check that player objects have required fields

## 🎯 Testing the API Directly

You can test the backend API using the interactive docs:

1. Open http://localhost:8000/docs
2. Try the `/api/upload-scrim-data` endpoint
3. Upload your JSON file
4. View the response

Or use curl:

```bash
curl -X POST "http://localhost:8000/api/upload-scrim-data" \
  -H "accept: application/json" \
  -H "Content-Type: multipart/form-data" \
  -F "file=@analytics_data.json"
```

## 📁 Project Structure

```
Map-LOL/
├── backend/                    # Python FastAPI backend
│   ├── app/
│   │   ├── main.py            # API endpoints
│   │   └── analytics.py       # Data processing logic
│   ├── uploads/               # Uploaded JSON files
│   ├── exports/               # Generated charts
│   ├── requirements.txt       # Python dependencies
│   └── README.md
│
├── tactical-board/            # React frontend
│   ├── src/
│   │   ├── pages/
│   │   │   └── site/
│   │   │       └── DataAnalyticsPage.tsx
│   │   └── App.tsx
│   └── package.json
│
└── QUICKSTART.md              # This file
```

## 🎨 Features

✅ **Upload JSON data** - Drag & drop or browse
✅ **Automatic analysis** - Processes data instantly
✅ **Team overview** - Key metrics at a glance
✅ **Performance charts** - Visual insights
✅ **Player statistics** - Detailed breakdown
✅ **Interactive UI** - Clean, modern design

## 🚀 Next Steps

1. Upload your scrim data
2. Explore the analytics
3. Share insights with your team
4. Track improvement over time

## 💡 Tips

- Keep your JSON files for historical comparison
- Upload new data after each scrim session
- Look for trends in player performance
- Identify strengths and weaknesses

## 🆘 Need Help?

- Check the API docs: http://localhost:8000/docs
- Review backend logs for errors
- Verify your JSON structure
- Ensure both servers are running

---

**Happy analyzing! 📊🎮**
