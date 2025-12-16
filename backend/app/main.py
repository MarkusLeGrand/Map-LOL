from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, FileResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
import json
import shutil
from pathlib import Path
from datetime import datetime
from typing import Optional
import sys

# Add parent directory to path to import analytics
sys.path.append(str(Path(__file__).parent))

from analytics import ScrimAnalytics

app = FastAPI(
    title="LeagueHub Analytics API",
    description="Backend API for League of Legends scrim data analytics",
    version="1.0.0"
)

# CORS configuration for React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",  # Vite dev server
        "http://localhost:3000",  # Alternative dev port
        "http://127.0.0.1:5173",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Directories
BASE_DIR = Path(__file__).parent.parent
UPLOAD_DIR = BASE_DIR / "uploads"
EXPORT_DIR = BASE_DIR / "exports"
DATA_DIR = BASE_DIR / "data"

# Create directories if they don't exist
for directory in [UPLOAD_DIR, EXPORT_DIR, DATA_DIR]:
    directory.mkdir(parents=True, exist_ok=True)

# Mount static files for generated images
app.mount("/exports", StaticFiles(directory=str(EXPORT_DIR)), name="exports")

@app.get("/")
async def root():
    """Health check endpoint"""
    return {
        "status": "online",
        "service": "LeagueHub Analytics API",
        "version": "1.0.0",
        "timestamp": datetime.now().isoformat()
    }

@app.post("/api/upload-scrim-data")
async def upload_scrim_data(file: UploadFile = File(...)):
    """
    Upload and validate a scrim data JSON file
    Expected format: analytics_data.json with players array
    """
    try:
        # Validate file type
        if not file.filename.endswith('.json'):
            raise HTTPException(status_code=400, detail="File must be a JSON file")

        # Save uploaded file
        file_path = UPLOAD_DIR / f"analytics_data_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"

        with file_path.open("wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        # Validate JSON structure
        with open(file_path, 'r', encoding='utf-8') as f:
            data = json.load(f)

        # Basic validation
        if "players" not in data:
            raise HTTPException(status_code=400, detail="Invalid JSON structure: missing 'players' field")

        players_count = len(data.get("players", []))

        return {
            "success": True,
            "message": "File uploaded successfully",
            "file_path": str(file_path),
            "players_count": players_count,
            "uploaded_at": datetime.now().isoformat()
        }

    except json.JSONDecodeError:
        raise HTTPException(status_code=400, detail="Invalid JSON format")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Upload failed: {str(e)}")

class AnalyzeRequest(BaseModel):
    file_path: str

@app.post("/api/analyze-scrim")
async def analyze_scrim(request: AnalyzeRequest):
    """
    Analyze uploaded scrim data and generate statistics
    Returns processed data and generates visualization charts
    """
    try:
        path = Path(request.file_path)
        if not path.exists():
            raise HTTPException(status_code=404, detail="File not found")

        # Initialize analytics processor
        analytics = ScrimAnalytics(path)

        # Process data
        result = analytics.process()

        return JSONResponse(content=result)

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")

@app.get("/api/players-stats")
async def get_players_stats(file_path: Optional[str] = None):
    """Get player statistics from the most recent upload or specified file"""
    try:
        if file_path:
            path = Path(file_path)
        else:
            # Get most recent file
            files = sorted(UPLOAD_DIR.glob("analytics_data_*.json"), key=lambda x: x.stat().st_mtime, reverse=True)
            if not files:
                raise HTTPException(status_code=404, detail="No data files found")
            path = files[0]

        analytics = ScrimAnalytics(path)
        players_data = analytics.get_players_overview()

        return JSONResponse(content=players_data)

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get player stats: {str(e)}")

@app.get("/api/charts/{chart_name}")
async def get_chart(chart_name: str):
    """Serve generated chart images"""
    chart_path = EXPORT_DIR / "charts" / f"{chart_name}.png"

    if not chart_path.exists():
        raise HTTPException(status_code=404, detail="Chart not found")

    return FileResponse(chart_path)

@app.get("/api/list-uploads")
async def list_uploads():
    """List all uploaded data files"""
    try:
        files = []
        for file_path in sorted(UPLOAD_DIR.glob("analytics_data_*.json"), key=lambda x: x.stat().st_mtime, reverse=True):
            stat = file_path.stat()
            files.append({
                "filename": file_path.name,
                "path": str(file_path),
                "size": stat.st_size,
                "uploaded_at": datetime.fromtimestamp(stat.st_mtime).isoformat()
            })

        return {"files": files, "count": len(files)}

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to list uploads: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
