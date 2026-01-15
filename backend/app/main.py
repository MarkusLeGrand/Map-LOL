"""
OpenRift Analytics API - Main Application

Clean architecture with separated route modules
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from pathlib import Path
import os
import sys
from dotenv import load_dotenv

# Add app directory to path for imports
sys.path.append(str(Path(__file__).parent))

# Load environment variables
load_dotenv()

# Import database initialization
from database import init_db

# Import routers
from routes.health import router as health_router
from routes.auth_routes import router as auth_router
from routes.teams_routes import router as teams_router
from routes.scrims_routes import router as scrims_router
from routes.availability_routes import router as availability_router
from routes.team_events_routes import router as team_events_router
from routes.riot_routes import router as riot_router
from routes.discord_routes import router as discord_router
from routes.champion_pool_routes import router as champion_pool_router

# Initialize rate limiter
limiter = Limiter(key_func=get_remote_address)

# Get environment
ENVIRONMENT = os.getenv("ENVIRONMENT", "development")

# Create FastAPI app
app = FastAPI(
    title="OpenRift Analytics API",
    description="Backend API for League of Legends scrim data analytics",
    version="1.0.0",
    docs_url="/docs" if ENVIRONMENT == "development" else None,
    redoc_url="/redoc" if ENVIRONMENT == "development" else None,
    openapi_url="/openapi.json" if ENVIRONMENT == "development" else None
)

# Add rate limiter state and exception handler
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# CORS configuration
CORS_ORIGINS = os.getenv("CORS_ORIGINS", "http://localhost:5173,http://localhost:3000,http://localhost").split(",")

# Stricter CORS for production
if ENVIRONMENT == "production":
    app.add_middleware(
        CORSMiddleware,
        allow_origins=CORS_ORIGINS,
        allow_credentials=True,
        allow_methods=["GET", "POST", "PUT", "DELETE", "PATCH"],
        allow_headers=["Content-Type", "Authorization"],
    )
else:
    # More permissive for development
    app.add_middleware(
        CORSMiddleware,
        allow_origins=CORS_ORIGINS,
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

# Initialize database on startup
@app.on_event("startup")
async def startup_event():
    init_db()

    # Start background scheduler for auto-syncing
    from services.scheduler import start_scheduler
    start_scheduler()

# ==================== INCLUDE ROUTERS ====================

# Health check routes (no prefix, at root level)
app.include_router(health_router)

# Auth routes (includes /api/auth prefix)
app.include_router(auth_router)

# Teams routes (includes /api/teams prefix)
app.include_router(teams_router)

# Scrims routes (includes /api/scrims prefix)
app.include_router(scrims_router)

# Availability routes (includes /api/availability prefix)
app.include_router(availability_router)

# Team Events routes (includes /api/team-events prefix)
app.include_router(team_events_router)

# Riot API routes (includes /api/riot prefix)
app.include_router(riot_router)

# Discord API routes (includes /api/discord prefix)
app.include_router(discord_router)

# Champion Pool routes (includes /api/champion-pool prefix)
app.include_router(champion_pool_router)


# ==================== ANALYTICS ENDPOINTS (TODO: Extract to routes/analytics_routes.py) ====================
# For now, keeping analytics endpoints here to avoid breaking the app
# These should be extracted to a separate router module

from fastapi import UploadFile, File, Request
from fastapi.responses import JSONResponse, FileResponse
from pydantic import BaseModel
from datetime import datetime, timedelta
from typing import Optional
import json
import shutil
import sys

# Add parent directory to path
sys.path.append(str(Path(__file__).parent))

from analytics import ScrimAnalytics
from database import (
    get_db, User as DBUser, Scrim as DBScrim, Team as DBTeam,
    TeamInvite as DBInvite, UserAnalytics as DBUserAnalytics,
    TeamAnalytics as DBTeamAnalytics, team_members as team_members_table,
    BugTicket as DBBugTicket, Notification as DBNotification
)
from auth import get_current_user, ACCESS_TOKEN_EXPIRE_MINUTES
from teams import get_team_by_id, get_team_members_with_roles, get_user_teams
from sqlalchemy.orm import Session
from sqlalchemy import func
from fastapi import Depends, HTTPException

# Copy all analytics endpoints from main_old.py starting at line 817
# (This is temporary - should be refactored into routes/analytics_routes.py)

# ==================== ANALYTICS ENDPOINTS ====================

@app.post("/api/upload-scrim-data")
async def upload_scrim_data(
    file: UploadFile = File(...),
    current_user: DBUser = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Upload and validate a scrim data JSON file
    Expected format: Riot API matches format with "matches" array
    """
    try:
        # Validate user has at least one team with RIOT IDs
        user_teams = get_user_teams(db, current_user.id)
        if not user_teams:
            raise HTTPException(
                status_code=400,
                detail="You must be part of a team to analyze scrim data"
            )

        # Check if any team member has a RIOT ID
        has_riot_id = False
        team_members_riot_ids = []
        selected_team = None

        for team in user_teams:
            members = get_team_members_with_roles(db, team.id)
            for member in members:
                # member dict has "id", not "user_id"
                riot_game_name = member.get("riot_game_name")
                riot_tag_line = member.get("riot_tag_line")

                if riot_game_name and riot_tag_line:
                    riot_id = f"{riot_game_name}#{riot_tag_line}"
                    team_members_riot_ids.append({
                        "riot_id": riot_id,
                        "game_name": riot_game_name,
                        "tag_line": riot_tag_line,
                        "team_id": team.id,
                        "team_name": team.name
                    })
                    has_riot_id = True

        if not has_riot_id:
            raise HTTPException(
                status_code=400,
                detail="No team member has configured their Riot ID. Please add your Riot ID in your profile settings."
            )

        # Validate file type
        if not file.filename.endswith('.json'):
            raise HTTPException(status_code=400, detail="File must be in JSON format")

        # Save uploaded file
        file_path = UPLOAD_DIR / f"analytics_data_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"

        with file_path.open("wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        # Validate JSON structure
        with open(file_path, 'r', encoding='utf-8') as f:
            data = json.load(f)

        # Validate format: must have "matches" array (Riot API format)
        if "matches" not in data:
            raise HTTPException(
                status_code=400,
                detail="Invalid JSON format: file must contain a 'matches' array"
            )

        matches = data.get("matches", [])
        if not matches:
            raise HTTPException(status_code=400, detail="No matches found in file")

        # Find which team members are in the matches
        found_players = []
        team_id_found = None
        match_date = None

        for match in matches:
            if "info" not in match or "participants" not in match["info"]:
                continue

            # Get match date from first match
            if not match_date and "gameCreation" in match["info"]:
                match_date = datetime.fromtimestamp(match["info"]["gameCreation"] / 1000)

            participants = match["info"]["participants"]

            for participant in participants:
                summoner_name = participant.get("summonerName", "")
                riot_game_name = participant.get("riotIdGameName", "")
                riot_tagline = participant.get("riotIdTagline", "")

                # Check if this participant matches any team member
                for member_info in team_members_riot_ids:
                    if (riot_game_name and riot_tagline and
                        riot_game_name.lower() == member_info["game_name"].lower() and
                        riot_tagline.lower() == member_info["tag_line"].lower()):

                        if member_info not in found_players:
                            found_players.append(member_info)
                            team_id_found = member_info["team_id"]
                        break

        if not found_players:
            raise HTTPException(
                status_code=400,
                detail="No team members were found in the matches. Please verify that Riot IDs are correct."
            )

        # Determine analysis name based on filename
        filename_lower = file.filename.lower()
        if "scrim" in filename_lower:
            if match_date:
                analysis_name = f"Scrim Analysis - {match_date.strftime('%m/%d/%Y')}"
            else:
                analysis_name = "Scrim Analysis"
        elif "global" in filename_lower:
            analysis_name = "Global Team Analysis"
        else:
            analysis_name = "Analysis"

        return {
            "success": True,
            "message": "File uploaded successfully",
            "file_path": str(file_path),
            "analysis_name": analysis_name,
            "matches_count": len(matches),
            "found_players": [p["riot_id"] for p in found_players],
            "team_id": team_id_found,
            "uploaded_at": datetime.now().isoformat()
        }

    except json.JSONDecodeError:
        raise HTTPException(status_code=400, detail="Invalid JSON format")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error during upload: {str(e)}")

class AnalyzeRequest(BaseModel):
    file_path: str
    team_riot_ids: list[str] = []  # RIOT IDs of team members to analyze

@app.post("/api/analyze-scrim")
async def analyze_scrim(
    request: AnalyzeRequest,
    current_user: DBUser = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Analyze uploaded scrim data and generate statistics
    Returns processed data and generates visualization charts
    """
    try:
        path = Path(request.file_path)
        if not path.exists():
            raise HTTPException(status_code=404, detail="File not found")

        # Initialize analytics processor with team filter
        analytics = ScrimAnalytics(path, team_riot_ids=request.team_riot_ids)

        # Process data
        result = analytics.process()

        return JSONResponse(content=result)

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")

@app.get("/api/players-stats")
async def get_players_stats(
    file_path: Optional[str] = None,
    current_user: DBUser = Depends(get_current_user)
):
    """Get player statistics from the most recent upload or specified file (requires auth)"""
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
async def list_uploads(current_user: DBUser = Depends(get_current_user)):
    """List all uploaded data files (requires auth)"""
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


@app.get("/api/download/{filename}")
async def download_file(filename: str):
    """Download script files (e.g., parse_rofl_direct.py)"""
    try:
        # Security: Only allow downloading specific whitelisted files
        ALLOWED_FILES = ["parse_rofl_direct.py"]

        if filename not in ALLOWED_FILES:
            raise HTTPException(status_code=403, detail="File not allowed for download")

        # Look for the file in the backend directory
        file_path = BASE_DIR / filename

        if not file_path.exists():
            raise HTTPException(status_code=404, detail="File not found")

        return FileResponse(
            path=str(file_path),
            filename=filename,
            media_type="text/x-python"
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to download file: {str(e)}")


# ===== Analytics Saving/Loading Endpoints =====

# Constants for save limits
MAX_PERSONAL_ANALYTICS = 5  # Max saves per user
MAX_TEAM_ANALYTICS = 10     # Max saves per team

class SaveAnalyticsRequest(BaseModel):
    name: str
    file_path: str
    analysis_results: dict
    save_to_team: bool = False
    team_id: Optional[str] = None


@app.post("/api/analytics/save")
async def save_analytics(
    request: SaveAnalyticsRequest,
    current_user: DBUser = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Save analytics data to personal or team storage"""
    try:
        if request.save_to_team:
            # Save to team
            if not request.team_id:
                raise HTTPException(status_code=400, detail="Team ID required for team saves")

            # Verify user is member of team
            team = get_team_by_id(db, request.team_id)
            if not team or current_user not in team.members:
                raise HTTPException(status_code=403, detail="Not a team member")

            # Check team save limit
            team_saves_count = db.query(DBTeamAnalytics).filter(
                DBTeamAnalytics.team_id == request.team_id
            ).count()

            if team_saves_count >= MAX_TEAM_ANALYTICS:
                raise HTTPException(
                    status_code=400,
                    detail=f"Team has reached the maximum of {MAX_TEAM_ANALYTICS} saved analyses"
                )

            # Create team analytics record
            file_path = Path(request.file_path)
            team_analytics = DBTeamAnalytics(
                team_id=request.team_id,
                created_by_id=current_user.id,
                name=request.name,
                file_name=file_path.name,
                players_count=str(len(request.analysis_results.get("players", []))),
                data_path=request.file_path,
                analysis_results=request.analysis_results
            )
            db.add(team_analytics)
            db.commit()
            db.refresh(team_analytics)

            return {
                "success": True,
                "id": team_analytics.id,
                "type": "team",
                "message": f"Analytics saved to team (using {team_saves_count + 1}/{MAX_TEAM_ANALYTICS} slots)"
            }
        else:
            # Save to personal
            # Check personal save limit
            personal_saves_count = db.query(DBUserAnalytics).filter(
                DBUserAnalytics.user_id == current_user.id
            ).count()

            if personal_saves_count >= MAX_PERSONAL_ANALYTICS:
                raise HTTPException(
                    status_code=400,
                    detail=f"You have reached the maximum of {MAX_PERSONAL_ANALYTICS} personal saved analyses"
                )

            # Create user analytics record
            file_path = Path(request.file_path)
            user_analytics = DBUserAnalytics(
                user_id=current_user.id,
                name=request.name,
                file_name=file_path.name,
                players_count=str(len(request.analysis_results.get("players", []))),
                data_path=request.file_path,
                analysis_results=request.analysis_results
            )
            db.add(user_analytics)
            db.commit()
            db.refresh(user_analytics)

            return {
                "success": True,
                "id": user_analytics.id,
                "type": "personal",
                "message": f"Analytics saved personally (using {personal_saves_count + 1}/{MAX_PERSONAL_ANALYTICS} slots)"
            }

    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to save analytics: {str(e)}")


@app.get("/api/analytics/personal")
async def get_personal_analytics(
    current_user: DBUser = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get user's saved personal analytics"""
    try:
        analytics = db.query(DBUserAnalytics).filter(
            DBUserAnalytics.user_id == current_user.id
        ).order_by(DBUserAnalytics.uploaded_at.desc()).all()

        return {
            "analytics": [
                {
                    "id": a.id,
                    "name": a.name,
                    "file_name": a.file_name,
                    "players_count": a.players_count,
                    "uploaded_at": a.uploaded_at.isoformat(),
                    "data_path": a.data_path,
                    "analysis_results": a.analysis_results
                }
                for a in analytics
            ],
            "count": len(analytics),
            "limit": MAX_PERSONAL_ANALYTICS
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get personal analytics: {str(e)}")


@app.get("/api/analytics/team/{team_id}")
async def get_team_analytics(
    team_id: str,
    current_user: DBUser = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get team's saved analytics"""
    try:
        # Verify user is member of team
        team = get_team_by_id(db, team_id)
        if not team or current_user not in team.members:
            raise HTTPException(status_code=403, detail="Not a team member")

        analytics = db.query(DBTeamAnalytics).filter(
            DBTeamAnalytics.team_id == team_id
        ).order_by(DBTeamAnalytics.uploaded_at.desc()).all()

        # Get creator names
        creator_ids = [a.created_by_id for a in analytics]
        creators = {u.id: u.username for u in db.query(DBUser).filter(DBUser.id.in_(creator_ids)).all()}

        return {
            "analytics": [
                {
                    "id": a.id,
                    "name": a.name,
                    "file_name": a.file_name,
                    "players_count": a.players_count,
                    "uploaded_at": a.uploaded_at.isoformat(),
                    "created_by": creators.get(a.created_by_id, "Unknown"),
                    "data_path": a.data_path,
                    "analysis_results": a.analysis_results
                }
                for a in analytics
            ],
            "count": len(analytics),
            "limit": MAX_TEAM_ANALYTICS
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get team analytics: {str(e)}")


@app.delete("/api/analytics/personal/{analytics_id}")
async def delete_personal_analytics(
    analytics_id: str,
    current_user: DBUser = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete a personal saved analytics"""
    try:
        analytics = db.query(DBUserAnalytics).filter(
            DBUserAnalytics.id == analytics_id,
            DBUserAnalytics.user_id == current_user.id
        ).first()

        if not analytics:
            raise HTTPException(status_code=404, detail="Analytics not found")

        db.delete(analytics)
        db.commit()

        return {"success": True, "message": "Analytics deleted"}
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to delete analytics: {str(e)}")


@app.delete("/api/analytics/team/{analytics_id}")
async def delete_team_analytics(
    analytics_id: str,
    current_user: DBUser = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete a team saved analytics (creator or team owner only)"""
    try:
        analytics = db.query(DBTeamAnalytics).filter(
            DBTeamAnalytics.id == analytics_id
        ).first()

        if not analytics:
            raise HTTPException(status_code=404, detail="Analytics not found")

        team = get_team_by_id(db, analytics.team_id)
        if not team:
            raise HTTPException(status_code=404, detail="Team not found")

        # Check if user is creator or team owner
        if analytics.created_by_id != current_user.id and team.owner_id != current_user.id:
            raise HTTPException(status_code=403, detail="Only the creator or team owner can delete this")

        db.delete(analytics)
        db.commit()

        return {"success": True, "message": "Analytics deleted"}
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to delete analytics: {str(e)}")


# ==================== ADMIN ENDPOINTS ====================

def get_admin_user(current_user: DBUser = Depends(get_current_user)):
    """Verify user is an admin"""
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Admin access required")
    return current_user


@app.get("/api/admin/stats")
async def get_admin_stats(
    admin: DBUser = Depends(get_admin_user),
    db: Session = Depends(get_db)
):
    """Get global platform statistics (admin only)"""
    from sqlalchemy import func, distinct
    from datetime import datetime, timedelta

    try:
        # Total counts
        total_users = db.query(func.count(DBUser.id)).scalar()
        total_teams = db.query(func.count(DBTeam.id)).scalar()
        total_scrims = db.query(func.count(DBScrim.id)).scalar()

        # Active users (logged in last 7 days)
        week_ago = datetime.utcnow() - timedelta(days=7)
        active_users = db.query(func.count(DBUser.id)).filter(
            DBUser.last_login >= week_ago
        ).scalar()

        # New users (created last 7 days)
        new_users = db.query(func.count(DBUser.id)).filter(
            DBUser.created_at >= week_ago
        ).scalar()

        # Tool usage stats
        all_users = db.query(DBUser).all()
        tool_usage = {}
        for user in all_users:
            for tool in user.favorite_tools:
                tool_usage[tool] = tool_usage.get(tool, 0) + 1

        # Most popular tools (sorted)
        popular_tools = sorted(tool_usage.items(), key=lambda x: x[1], reverse=True)[:10]

        # Users by creation date (last 30 days)
        thirty_days_ago = datetime.utcnow() - timedelta(days=30)
        users_by_date = db.query(
            func.date(DBUser.created_at).label('date'),
            func.count(DBUser.id).label('count')
        ).filter(
            DBUser.created_at >= thirty_days_ago
        ).group_by(func.date(DBUser.created_at)).all()

        return {
            "total_users": total_users,
            "total_teams": total_teams,
            "total_scrims": total_scrims,
            "active_users_7d": active_users,
            "new_users_7d": new_users,
            "tool_usage": dict(popular_tools),
            "users_by_date": [{"date": str(date), "count": count} for date, count in users_by_date]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get stats: {str(e)}")


@app.get("/api/admin/users")
async def get_all_users(
    admin: DBUser = Depends(get_admin_user),
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 100,
    search: Optional[str] = None
):
    """Get all users with optional search (admin only)"""
    try:
        query = db.query(DBUser)

        # Search by username or email
        if search:
            query = query.filter(
                (DBUser.username.contains(search)) |
                (DBUser.email.contains(search))
            )

        total = query.count()
        users = query.order_by(DBUser.created_at.desc()).offset(skip).limit(limit).all()

        return {
            "total": total,
            "users": [
                {
                    "id": user.id,
                    "email": user.email,
                    "username": user.username,
                    "riot_game_name": user.riot_game_name,
                    "riot_tag_line": user.riot_tag_line,
                    "created_at": user.created_at.isoformat(),
                    "last_login": user.last_login.isoformat() if user.last_login else None,
                    "is_active": user.is_active,
                    "is_admin": user.is_admin,
                    "favorite_tools": user.favorite_tools,
                    "teams_count": len(user.teams)
                }
                for user in users
            ]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get users: {str(e)}")


@app.get("/api/admin/users/{user_id}")
async def get_user_details(
    user_id: str,
    admin: DBUser = Depends(get_admin_user),
    db: Session = Depends(get_db)
):
    """Get detailed user information (admin only)"""
    user = db.query(DBUser).filter(DBUser.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    return {
        "id": user.id,
        "email": user.email,
        "username": user.username,
        "riot_game_name": user.riot_game_name,
        "riot_tag_line": user.riot_tag_line,
        "riot_puuid": user.riot_puuid,
        "riot_region": user.riot_region,
        "created_at": user.created_at.isoformat(),
        "last_login": user.last_login.isoformat() if user.last_login else None,
        "is_active": user.is_active,
        "is_verified": user.is_verified,
        "is_admin": user.is_admin,
        "favorite_tools": user.favorite_tools,
        "theme": user.theme,
        "teams": [
            {
                "id": team.id,
                "name": team.name,
                "tag": team.tag
            }
            for team in user.teams
        ]
    }


@app.delete("/api/admin/users/{user_id}")
async def delete_user(
    user_id: str,
    admin: DBUser = Depends(get_admin_user),
    db: Session = Depends(get_db)
):
    """Delete a user (admin only)"""
    if user_id == admin.id:
        raise HTTPException(status_code=400, detail="Cannot delete yourself")

    user = db.query(DBUser).filter(DBUser.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    try:
        # Delete user (cascades will handle related data)
        db.delete(user)
        db.commit()
        return {"message": f"User {user.username} deleted successfully"}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to delete user: {str(e)}")


@app.patch("/api/admin/users/{user_id}/toggle-active")
async def toggle_user_active(
    user_id: str,
    admin: DBUser = Depends(get_admin_user),
    db: Session = Depends(get_db)
):
    """Toggle user active status (ban/unban) (admin only)"""
    if user_id == admin.id:
        raise HTTPException(status_code=400, detail="Cannot ban yourself")

    user = db.query(DBUser).filter(DBUser.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    try:
        user.is_active = not user.is_active
        db.commit()

        status = "unbanned" if user.is_active else "banned"
        return {"message": f"User {user.username} {status} successfully", "is_active": user.is_active}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to update user: {str(e)}")


@app.get("/api/admin/teams")
async def get_all_teams(
    admin: DBUser = Depends(get_admin_user),
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 100
):
    """Get all teams (admin only)"""
    try:
        total = db.query(func.count(DBTeam.id)).scalar()
        teams = db.query(DBTeam).order_by(DBTeam.created_at.desc()).offset(skip).limit(limit).all()

        return {
            "total": total,
            "teams": [
                {
                    "id": team.id,
                    "name": team.name,
                    "tag": team.tag,
                    "description": team.description,
                    "team_color": team.team_color,
                    "created_at": team.created_at.isoformat(),
                    "owner_id": team.owner_id,
                    "member_count": len(team.members),
                    "scrim_count": len(team.scrims)
                }
                for team in teams
            ]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get teams: {str(e)}")


@app.delete("/api/admin/teams/{team_id}")
async def admin_delete_team(
    team_id: str,
    admin: DBUser = Depends(get_admin_user),
    db: Session = Depends(get_db)
):
    """Delete any team (admin only)"""
    team = db.query(DBTeam).filter(DBTeam.id == team_id).first()
    if not team:
        raise HTTPException(status_code=404, detail="Team not found")

    try:
        # Delete all team associations
        db.query(team_members_table).filter(team_members_table.c.team_id == team_id).delete()
        db.query(DBInvite).filter(DBInvite.team_id == team_id).delete()
        db.query(DBScrim).filter(DBScrim.team_id == team_id).delete()

        db.delete(team)
        db.commit()

        return {"message": f"Team {team.name} deleted successfully"}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to delete team: {str(e)}")


@app.patch("/api/admin/users/{user_id}/toggle-admin")
async def toggle_user_admin(
    user_id: str,
    admin: DBUser = Depends(get_admin_user),
    db: Session = Depends(get_db)
):
    """Toggle user admin status (promote/demote) (admin only)"""
    if user_id == admin.id:
        raise HTTPException(status_code=400, detail="Cannot change your own admin status")

    user = db.query(DBUser).filter(DBUser.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    try:
        user.is_admin = not user.is_admin
        db.commit()

        status = "promoted to admin" if user.is_admin else "demoted from admin"
        return {"message": f"User {user.username} {status}", "is_admin": user.is_admin}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to update user: {str(e)}")


# ==================== TICKET ENDPOINTS ====================

@app.post("/api/tickets/submit")
async def submit_ticket(
    request: Request,
    current_user: DBUser = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a bug report ticket via JSON (requires authentication)"""
    try:
        data = await request.json()
        title = data.get("title")
        description = data.get("description")
        category = data.get("category", "bug")
        page_url = data.get("page_url")
        user_agent = data.get("user_agent")

        if not title or not description:
            raise HTTPException(status_code=400, detail="Title and description are required")

        ticket = DBBugTicket(
            user_id=current_user.id,
            title=title,
            description=description,
            category=category,
            page_url=page_url,
            user_agent=user_agent
        )
        db.add(ticket)
        db.commit()
        db.refresh(ticket)

        return {"message": "Ticket submitted successfully", "ticket_id": ticket.id}
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to create ticket: {str(e)}")


@app.get("/api/admin/tickets")
async def get_all_tickets(
    admin: DBUser = Depends(get_admin_user),
    db: Session = Depends(get_db),
    status: Optional[str] = None,
    skip: int = 0,
    limit: int = 50
):
    """Get all tickets (admin only)"""
    try:
        query = db.query(DBBugTicket)

        if status:
            query = query.filter(DBBugTicket.status == status)

        total = query.count()
        tickets = query.order_by(DBBugTicket.created_at.desc()).offset(skip).limit(limit).all()

        # Get usernames for tickets with user_id
        result = []
        for ticket in tickets:
            ticket_data = {
                "id": ticket.id,
                "title": ticket.title,
                "description": ticket.description,
                "category": ticket.category,
                "status": ticket.status,
                "priority": ticket.priority,
                "admin_response": ticket.admin_response,
                "created_at": ticket.created_at.isoformat(),
                "updated_at": ticket.updated_at.isoformat() if ticket.updated_at else None,
                "resolved_at": ticket.resolved_at.isoformat() if ticket.resolved_at else None,
                "page_url": ticket.page_url,
                "user_id": ticket.user_id,
                "username": None
            }
            if ticket.user_id:
                user = db.query(DBUser).filter(DBUser.id == ticket.user_id).first()
                if user:
                    ticket_data["username"] = user.username
            result.append(ticket_data)

        return {
            "total": total,
            "tickets": result
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get tickets: {str(e)}")


@app.patch("/api/admin/tickets/{ticket_id}")
async def update_ticket(
    ticket_id: str,
    request: Request,
    admin: DBUser = Depends(get_admin_user),
    db: Session = Depends(get_db)
):
    """Update ticket status/response (admin only)"""
    ticket = db.query(DBBugTicket).filter(DBBugTicket.id == ticket_id).first()
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")

    try:
        data = await request.json()
        should_notify = False

        if "status" in data:
            ticket.status = data["status"]
            if data["status"] in ["resolved", "closed"]:
                ticket.resolved_at = datetime.utcnow()
                ticket.resolved_by_id = admin.id
                should_notify = True

        if "priority" in data:
            ticket.priority = data["priority"]

        if "admin_response" in data and data["admin_response"]:
            ticket.admin_response = data["admin_response"]
            should_notify = True

        # Create notification for the user if ticket has a user
        if should_notify and ticket.user_id:
            notification = DBNotification(
                user_id=ticket.user_id,
                type="ticket_response",
                title="Ticket Update",
                message=f"Your ticket '{ticket.title}' has been updated by an admin.",
                reference_id=ticket.id,
                reference_type="ticket"
            )
            db.add(notification)

        db.commit()
        return {"message": "Ticket updated successfully"}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to update ticket: {str(e)}")


@app.delete("/api/admin/tickets/{ticket_id}")
async def delete_ticket(
    ticket_id: str,
    admin: DBUser = Depends(get_admin_user),
    db: Session = Depends(get_db)
):
    """Delete a ticket (admin only)"""
    ticket = db.query(DBBugTicket).filter(DBBugTicket.id == ticket_id).first()
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")

    try:
        db.delete(ticket)
        db.commit()
        return {"message": "Ticket deleted successfully"}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to delete ticket: {str(e)}")


@app.get("/api/admin/tickets/stats")
async def get_ticket_stats(
    admin: DBUser = Depends(get_admin_user),
    db: Session = Depends(get_db)
):
    """Get ticket statistics (admin only)"""
    try:
        total = db.query(func.count(DBBugTicket.id)).scalar()
        open_count = db.query(func.count(DBBugTicket.id)).filter(DBBugTicket.status == "open").scalar()
        in_progress = db.query(func.count(DBBugTicket.id)).filter(DBBugTicket.status == "in_progress").scalar()
        resolved = db.query(func.count(DBBugTicket.id)).filter(DBBugTicket.status == "resolved").scalar()
        closed = db.query(func.count(DBBugTicket.id)).filter(DBBugTicket.status == "closed").scalar()

        # By category
        by_category = db.query(
            DBBugTicket.category,
            func.count(DBBugTicket.id)
        ).group_by(DBBugTicket.category).all()

        return {
            "total": total,
            "open": open_count,
            "in_progress": in_progress,
            "resolved": resolved,
            "closed": closed,
            "by_category": {cat: count for cat, count in by_category}
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get ticket stats: {str(e)}")


# ==================== NOTIFICATION ENDPOINTS ====================

@app.get("/api/notifications")
async def get_my_notifications(
    current_user: DBUser = Depends(get_current_user),
    db: Session = Depends(get_db),
    unread_only: bool = False
):
    """Get current user's notifications"""
    try:
        query = db.query(DBNotification).filter(DBNotification.user_id == current_user.id)

        if unread_only:
            query = query.filter(DBNotification.is_read == False)

        notifications = query.order_by(DBNotification.created_at.desc()).limit(50).all()

        return {
            "notifications": [
                {
                    "id": n.id,
                    "type": n.type,
                    "title": n.title,
                    "message": n.message,
                    "reference_id": n.reference_id,
                    "reference_type": n.reference_type,
                    "is_read": n.is_read,
                    "created_at": n.created_at.isoformat()
                }
                for n in notifications
            ],
            "unread_count": db.query(func.count(DBNotification.id)).filter(
                DBNotification.user_id == current_user.id,
                DBNotification.is_read == False
            ).scalar()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get notifications: {str(e)}")


@app.patch("/api/notifications/{notification_id}/read")
async def mark_notification_read(
    notification_id: str,
    current_user: DBUser = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Mark a notification as read"""
    notification = db.query(DBNotification).filter(
        DBNotification.id == notification_id,
        DBNotification.user_id == current_user.id
    ).first()

    if not notification:
        raise HTTPException(status_code=404, detail="Notification not found")

    notification.is_read = True
    db.commit()
    return {"message": "Notification marked as read"}


@app.patch("/api/notifications/read-all")
async def mark_all_notifications_read(
    current_user: DBUser = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Mark all notifications as read"""
    db.query(DBNotification).filter(
        DBNotification.user_id == current_user.id,
        DBNotification.is_read == False
    ).update({"is_read": True})
    db.commit()
    return {"message": "All notifications marked as read"}


@app.delete("/api/notifications/{notification_id}")
async def delete_notification(
    notification_id: str,
    current_user: DBUser = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete a notification"""
    notification = db.query(DBNotification).filter(
        DBNotification.id == notification_id,
        DBNotification.user_id == current_user.id
    ).first()

    if not notification:
        raise HTTPException(status_code=404, detail="Notification not found")

    db.delete(notification)
    db.commit()
    return {"message": "Notification deleted"}


@app.on_event("shutdown")
async def shutdown_event():
    """Cleanup on app shutdown"""
    from services.scheduler import shutdown_scheduler
    shutdown_scheduler()

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
