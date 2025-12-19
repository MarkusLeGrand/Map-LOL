from fastapi import FastAPI, UploadFile, File, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, FileResponse
from fastapi.staticfiles import StaticFiles
from fastapi.security import OAuth2PasswordRequestForm
from pydantic import BaseModel
import json
import shutil
from pathlib import Path
from datetime import datetime, timedelta
from typing import Optional
import sys

# Add parent directory to path to import analytics
sys.path.append(str(Path(__file__).parent))

from analytics import ScrimAnalytics
from database import (
    init_db, get_db,
    User as DBUser,
    Scrim as DBScrim,
    TeamInvite as DBInvite,
    UserAnalytics as DBUserAnalytics,
    TeamAnalytics as DBTeamAnalytics,
    team_members as team_members_table
)
from auth import (
    UserCreate, UserLogin, Token, UserResponse,
    create_user, authenticate_user, create_access_token,
    get_current_user, ACCESS_TOKEN_EXPIRE_MINUTES
)
from teams import (
    TeamCreate, TeamResponse, InviteCreate, InviteResponse, ScrimCreate, ScrimResponse,
    create_team, get_user_teams, get_team_by_id, get_team_members_with_roles,
    create_team_invite, accept_team_invite, get_user_invites,
    create_scrim, get_team_scrims
)
from sqlalchemy.orm import Session

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

# Initialize database on startup
@app.on_event("startup")
async def startup_event():
    init_db()
    print("LeagueHub API started successfully!")

@app.get("/")
async def root():
    """Health check endpoint"""
    return {
        "status": "online",
        "service": "LeagueHub Analytics API",
        "version": "1.0.0",
        "timestamp": datetime.now().isoformat()
    }


# ==================== AUTH ENDPOINTS ====================

@app.post("/api/auth/register", response_model=UserResponse)
async def register(user_data: UserCreate, db: Session = Depends(get_db)):
    """Register a new user"""
    try:
        user = create_user(db, user_data)
        return user
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Registration failed: {str(e)}")


@app.post("/api/auth/login", response_model=Token)
async def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    """Login with email and password"""
    user = authenticate_user(db, form_data.username, form_data.password)  # username = email

    if not user:
        raise HTTPException(
            status_code=401,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Update last login
    user.last_login = datetime.utcnow()
    db.commit()

    # Create access token
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.email}, expires_delta=access_token_expires
    )

    return {"access_token": access_token, "token_type": "bearer"}


@app.get("/api/auth/me", response_model=UserResponse)
async def get_me(current_user: DBUser = Depends(get_current_user)):
    """Get current user info"""
    return current_user


@app.put("/api/auth/me")
async def update_me(
    riot_game_name: Optional[str] = None,
    riot_tag_line: Optional[str] = None,
    theme: Optional[str] = None,
    current_user: DBUser = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update current user profile"""
    if riot_game_name is not None:
        current_user.riot_game_name = riot_game_name
    if riot_tag_line is not None:
        current_user.riot_tag_line = riot_tag_line
    if theme is not None:
        current_user.theme = theme

    db.commit()
    db.refresh(current_user)

    return current_user


class FavoriteToolsUpdate(BaseModel):
    favorite_tools: list[str]


@app.put("/api/auth/favorite-tools", response_model=UserResponse)
async def update_favorite_tools(
    data: FavoriteToolsUpdate,
    current_user: DBUser = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update user's favorite tools"""
    current_user.favorite_tools = data.favorite_tools
    db.commit()
    db.refresh(current_user)
    return current_user


# ==================== TEAM ENDPOINTS ====================

@app.post("/api/teams/create", response_model=TeamResponse)
async def create_team_endpoint(
    team_data: TeamCreate,
    current_user: DBUser = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a new team"""
    try:
        team = create_team(db, team_data, current_user.id)
        members = get_team_members_with_roles(db, team.id)
        return TeamResponse(
            id=team.id,
            name=team.name,
            tag=team.tag,
            description=team.description,
            owner_id=team.owner_id,
            created_at=team.created_at,
            team_color=team.team_color,
            max_members=team.max_members,
            member_count=len(members),
            members=members
        )
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create team: {str(e)}")


@app.get("/api/teams/my-teams", response_model=list[TeamResponse])
async def get_my_teams(
    current_user: DBUser = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all teams the current user is part of"""
    try:
        teams = get_user_teams(db, current_user.id)
        result = []
        for team in teams:
            members = get_team_members_with_roles(db, team.id)
            result.append(TeamResponse(
                id=team.id,
                name=team.name,
                tag=team.tag,
                description=team.description,
                owner_id=team.owner_id,
                created_at=team.created_at,
                team_color=team.team_color,
                max_members=team.max_members,
                member_count=len(members),
                members=members
            ))
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get teams: {str(e)}")


@app.get("/api/teams/invites", response_model=list[InviteResponse])
async def get_my_invites(
    current_user: DBUser = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all pending invites for the current user"""
    try:
        invites = get_user_invites(db, current_user.id)
        result = []
        for invite in invites:
            team = get_team_by_id(db, invite.team_id)
            result.append(InviteResponse(
                id=invite.id,
                team_id=invite.team_id,
                team_name=team.name if team else "Unknown",
                invited_user_id=invite.invited_user_id,
                invited_by_id=invite.invited_by_id,
                role=invite.role,
                status=invite.status,
                created_at=invite.created_at
            ))
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get invites: {str(e)}")


@app.get("/api/teams/{team_id}", response_model=TeamResponse)
async def get_team(
    team_id: str,
    current_user: DBUser = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get team details by ID"""
    team = get_team_by_id(db, team_id)
    if not team:
        raise HTTPException(status_code=404, detail="Team not found")

    # Check if user is a member
    if current_user not in team.members:
        raise HTTPException(status_code=403, detail="Not a team member")

    members = get_team_members_with_roles(db, team.id)
    return TeamResponse(
        id=team.id,
        name=team.name,
        tag=team.tag,
        description=team.description,
        owner_id=team.owner_id,
        created_at=team.created_at,
        team_color=team.team_color,
        max_members=team.max_members,
        member_count=len(members),
        members=members
    )


@app.delete("/api/teams/{team_id}")
async def delete_team(
    team_id: str,
    current_user: DBUser = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete a team (owner only)"""
    team = get_team_by_id(db, team_id)
    if not team:
        raise HTTPException(status_code=404, detail="Team not found")

    # Check if user is the owner
    if team.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Only the team owner can delete the team")

    try:
        # Delete all team members associations
        db.query(team_members_table).filter(team_members_table.c.team_id == team_id).delete()

        # Delete all invites
        db.query(DBInvite).filter(DBInvite.team_id == team_id).delete()

        # Delete all scrims
        db.query(DBScrim).filter(DBScrim.team_id == team_id).delete()

        # Delete the team
        db.delete(team)
        db.commit()

        return {"message": "Team deleted successfully"}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to delete team: {str(e)}")


@app.post("/api/teams/{team_id}/leave")
async def leave_team(
    team_id: str,
    current_user: DBUser = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Leave a team (members only, owner cannot leave)"""
    team = get_team_by_id(db, team_id)
    if not team:
        raise HTTPException(status_code=404, detail="Team not found")

    # Check if user is a member
    if current_user not in team.members:
        raise HTTPException(status_code=403, detail="Not a team member")

    # Owner cannot leave their own team
    if team.owner_id == current_user.id:
        raise HTTPException(status_code=403, detail="Team owner cannot leave. Delete the team instead.")

    try:
        # Remove user from team members
        db.query(team_members_table).filter(
            team_members_table.c.team_id == team_id,
            team_members_table.c.user_id == current_user.id
        ).delete()
        db.commit()

        return {"message": "Successfully left the team"}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to leave team: {str(e)}")


@app.post("/api/teams/{team_id}/kick/{user_id}")
async def kick_member(
    team_id: str,
    user_id: str,
    current_user: DBUser = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Kick a member from the team (owner only)"""
    team = get_team_by_id(db, team_id)
    if not team:
        raise HTTPException(status_code=404, detail="Team not found")

    # Check if current user is the owner
    if team.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Only the team owner can kick members")

    # Cannot kick yourself
    if user_id == current_user.id:
        raise HTTPException(status_code=400, detail="You cannot kick yourself")

    # Get the user to kick
    user_to_kick = db.query(DBUser).filter(DBUser.id == user_id).first()
    if not user_to_kick:
        raise HTTPException(status_code=404, detail="User not found")

    # Check if user is a member
    if user_to_kick not in team.members:
        raise HTTPException(status_code=400, detail="User is not a team member")

    try:
        # Remove user from team members
        db.query(team_members_table).filter(
            team_members_table.c.team_id == team_id,
            team_members_table.c.user_id == user_id
        ).delete()
        db.commit()

        return {"message": f"{user_to_kick.username} has been kicked from the team"}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to kick member: {str(e)}")


@app.post("/api/teams/{team_id}/promote/{user_id}")
async def promote_to_owner(
    team_id: str,
    user_id: str,
    current_user: DBUser = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Promote a member to team owner (current owner only)"""
    team = get_team_by_id(db, team_id)
    if not team:
        raise HTTPException(status_code=404, detail="Team not found")

    # Check if current user is the owner
    if team.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Only the team owner can promote members")

    # Cannot promote yourself
    if user_id == current_user.id:
        raise HTTPException(status_code=400, detail="You are already the owner")

    # Get the user to promote
    user_to_promote = db.query(DBUser).filter(DBUser.id == user_id).first()
    if not user_to_promote:
        raise HTTPException(status_code=404, detail="User not found")

    # Check if user is a member
    if user_to_promote not in team.members:
        raise HTTPException(status_code=400, detail="User is not a team member")

    try:
        # Transfer ownership
        team.owner_id = user_id
        db.commit()
        db.refresh(team)

        return {"message": f"{user_to_promote.username} is now the team owner"}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to promote member: {str(e)}")


@app.post("/api/teams/{team_id}/invite", response_model=InviteResponse)
async def invite_to_team(
    team_id: str,
    invite_data: InviteCreate,
    current_user: DBUser = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Invite a user to the team"""
    team = get_team_by_id(db, team_id)
    if not team:
        raise HTTPException(status_code=404, detail="Team not found")

    # Only owner can invite
    if team.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Only team owner can invite members")

    try:
        invite = create_team_invite(db, team_id, invite_data, current_user.id)
        return InviteResponse(
            id=invite.id,
            team_id=invite.team_id,
            team_name=team.name,
            invited_user_id=invite.invited_user_id,
            invited_by_id=invite.invited_by_id,
            role=invite.role,
            status=invite.status,
            created_at=invite.created_at
        )
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create invite: {str(e)}")


@app.post("/api/teams/invites/{invite_id}/accept", response_model=TeamResponse)
async def accept_invite(
    invite_id: str,
    current_user: DBUser = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Accept a team invitation"""
    try:
        team = accept_team_invite(db, invite_id, current_user.id)
        members = get_team_members_with_roles(db, team.id)
        return TeamResponse(
            id=team.id,
            name=team.name,
            tag=team.tag,
            description=team.description,
            owner_id=team.owner_id,
            created_at=team.created_at,
            team_color=team.team_color,
            max_members=team.max_members,
            member_count=len(members),
            members=members
        )
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to accept invite: {str(e)}")


@app.post("/api/scrims/create", response_model=ScrimResponse)
async def create_scrim_endpoint(
    team_id: str,
    scrim_data: ScrimCreate,
    current_user: DBUser = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a scrim for a team"""
    team = get_team_by_id(db, team_id)
    if not team:
        raise HTTPException(status_code=404, detail="Team not found")

    # Check if user is a member
    if current_user not in team.members:
        raise HTTPException(status_code=403, detail="Not a team member")

    try:
        scrim = create_scrim(db, team_id, scrim_data)
        return scrim
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create scrim: {str(e)}")


@app.get("/api/scrims/team/{team_id}", response_model=list[ScrimResponse])
async def get_scrims(
    team_id: str,
    current_user: DBUser = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all scrims for a team"""
    team = get_team_by_id(db, team_id)
    if not team:
        raise HTTPException(status_code=404, detail="Team not found")

    # Check if user is a member
    if current_user not in team.members:
        raise HTTPException(status_code=403, detail="Not a team member")

    try:
        scrims = get_team_scrims(db, team_id)
        return scrims
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get scrims: {str(e)}")


@app.patch("/api/scrims/{scrim_id}")
async def update_scrim(
    scrim_id: str,
    update_data: dict,
    current_user: DBUser = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update a scrim (team members only)"""
    # Get the scrim
    scrim = db.query(DBScrim).filter(DBScrim.id == scrim_id).first()
    if not scrim:
        raise HTTPException(status_code=404, detail="Scrim not found")

    # Get the team
    team = get_team_by_id(db, scrim.team_id)
    if not team:
        raise HTTPException(status_code=404, detail="Team not found")

    # Check if user is a member of the team
    if current_user not in team.members:
        raise HTTPException(status_code=403, detail="Only team members can update scrims")

    try:
        # Update allowed fields
        if 'scheduled_at' in update_data:
            scrim.scheduled_at = update_data['scheduled_at']
        if 'opponent_name' in update_data:
            scrim.opponent_name = update_data['opponent_name']
        if 'duration_minutes' in update_data:
            scrim.duration_minutes = update_data['duration_minutes']
        if 'notes' in update_data:
            scrim.notes = update_data['notes']
        if 'status' in update_data:
            scrim.status = update_data['status']

        db.commit()
        db.refresh(scrim)
        return scrim
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to update scrim: {str(e)}")


@app.delete("/api/scrims/{scrim_id}")
async def delete_scrim(
    scrim_id: str,
    current_user: DBUser = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete a scrim (team members only)"""
    # Get the scrim
    scrim = db.query(DBScrim).filter(DBScrim.id == scrim_id).first()
    if not scrim:
        raise HTTPException(status_code=404, detail="Scrim not found")

    # Get the team
    team = get_team_by_id(db, scrim.team_id)
    if not team:
        raise HTTPException(status_code=404, detail="Team not found")

    # Check if user is a member of the team
    if current_user not in team.members:
        raise HTTPException(status_code=403, detail="Only team members can delete scrims")

    try:
        db.delete(scrim)
        db.commit()
        return {"message": "Scrim deleted successfully"}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to delete scrim: {str(e)}")


# ==================== ANALYTICS ENDPOINTS ====================

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


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
