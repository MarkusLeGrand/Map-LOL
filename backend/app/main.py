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
CORS_ORIGINS = os.getenv("CORS_ORIGINS", "http://localhost:5173,http://localhost:3000").split(",")

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
    print("OpenRift API started successfully!")


# ==================== INCLUDE ROUTERS ====================

# Health check routes (no prefix, at root level)
app.include_router(health_router)

# Auth routes (includes /api/auth prefix)
app.include_router(auth_router)

# Teams routes (includes /api/teams prefix)
app.include_router(teams_router)

# Scrims routes (includes /api/scrims prefix)
app.include_router(scrims_router)


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
    TeamAnalytics as DBTeamAnalytics, team_members as team_members_table
)
from auth import get_current_user, ACCESS_TOKEN_EXPIRE_MINUTES
from teams import get_team_by_id, get_team_members_with_roles, get_user_teams
from sqlalchemy.orm import Session
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
                detail="Vous devez faire partie d'une équipe pour analyser des données"
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
                detail="Aucun membre de vos équipes n'a configuré son RIOT ID. Ajoutez votre RIOT ID dans votre profil."
            )

        # Validate file type
        if not file.filename.endswith('.json'):
            raise HTTPException(status_code=400, detail="Le fichier doit être au format JSON")

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
                detail="Format JSON invalide: le fichier doit contenir un tableau 'matches'"
            )

        matches = data.get("matches", [])
        if not matches:
            raise HTTPException(status_code=400, detail="Aucun match trouvé dans le fichier")

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
                detail="Aucun membre de vos équipes n'a été trouvé dans les matchs. Vérifiez que les RIOT IDs sont corrects."
            )

        # Determine analysis name based on filename
        filename_lower = file.filename.lower()
        if "scrim" in filename_lower:
            if match_date:
                analysis_name = f"Analyse du Scrim - {match_date.strftime('%d/%m/%Y')}"
            else:
                analysis_name = "Analyse du Scrim"
        elif "global" in filename_lower:
            analysis_name = "Analyse Globale de l'Équipe"
        else:
            analysis_name = "Analyse"

        return {
            "success": True,
            "message": "Fichier uploadé avec succès",
            "file_path": str(file_path),
            "analysis_name": analysis_name,
            "matches_count": len(matches),
            "found_players": [p["riot_id"] for p in found_players],
            "team_id": team_id_found,
            "uploaded_at": datetime.now().isoformat()
        }

    except json.JSONDecodeError:
        raise HTTPException(status_code=400, detail="Format JSON invalide")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erreur lors de l'upload: {str(e)}")

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


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
