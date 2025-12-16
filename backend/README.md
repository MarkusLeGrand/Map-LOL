# LeagueHub Analytics Backend

FastAPI backend for League of Legends scrim data analytics.

## 🚀 Quick Start

### 1. Install dependencies

```bash
cd backend
pip install -r requirements.txt
```

### 2. Run the server

```bash
cd app
python main.py
```

Or with uvicorn directly:

```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### 3. Access the API

- **API:** http://localhost:8000
- **Docs (Swagger):** http://localhost:8000/docs
- **ReDoc:** http://localhost:8000/redoc

## 📁 Project Structure

```
backend/
├── app/
│   ├── main.py          # FastAPI application
│   └── analytics.py     # Analytics processing logic
├── uploads/             # Uploaded JSON files
├── exports/             # Generated charts and reports
├── data/                # Static data files
├── requirements.txt     # Python dependencies
└── README.md
```

## 🔌 API Endpoints

### Health Check
```http
GET /
```

### Upload Scrim Data
```http
POST /api/upload-scrim-data
Content-Type: multipart/form-data

file: analytics_data.json
```

### Analyze Scrim
```http
POST /api/analyze-scrim
Content-Type: application/json

{
  "file_path": "path/to/uploaded/file.json"
}
```

### Get Player Stats
```http
GET /api/players-stats?file_path=path/to/file.json
```

### Get Chart
```http
GET /api/charts/{chart_name}
```

### List Uploads
```http
GET /api/list-uploads
```

## 📊 Data Format

Expected JSON format for `analytics_data.json`:

```json
{
  "generated_at": "2025-01-15T10:30:00",
  "team": "Team Name",
  "players": [
    {
      "name": "Player1",
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

## 🔧 Development

### Install dev dependencies
```bash
pip install -r requirements.txt
```

### Run with auto-reload
```bash
uvicorn app.main:app --reload
```

## 🐳 Docker (Optional)

```dockerfile
FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY app/ ./app/

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

## 📝 License

MIT
