"""
Scrim Hub routes - Centralized scrim management
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

import sys
from pathlib import Path
sys.path.append(str(Path(__file__).parent.parent))

from database import get_db, Scrim, ScrimGame, Draft, TeamAnalytics, User as DBUser, Team as DBTeam
from auth import get_current_user

router = APIRouter(prefix="/api/scrim-hub", tags=["scrim-hub"])

# Pydantic models
class ScrimCreate(BaseModel):
    opponent_name: str
    scheduled_at: datetime
    duration_minutes: str = "60"
    notes: Optional[str] = None

class ScrimUpdate(BaseModel):
    opponent_name: Optional[str] = None
    scheduled_at: Optional[datetime] = None
    duration_minutes: Optional[str] = None
    notes: Optional[str] = None
    status: Optional[str] = None

class ScrimGameCreate(BaseModel):
    game_number: int
    result: Optional[str] = None  # 'win', 'lose', null
    coach_notes: Optional[str] = None
    draft_id: Optional[str] = None

class ScrimGameUpdate(BaseModel):
    result: Optional[str] = None
    coach_notes: Optional[str] = None
    improvement_notes: Optional[str] = None
    draft_id: Optional[str] = None


def get_user_team(user: DBUser, db: Session) -> DBTeam:
    """Get user's team or raise 403"""
    # Refresh user to ensure teams relationship is loaded
    db.refresh(user)
    if not user.teams:
        raise HTTPException(status_code=403, detail="You must be part of a team to access scrims")
    return user.teams[0]


def verify_team_member(user: DBUser, team_id: str, db: Session) -> DBTeam:
    """Verify user is member of the specified team"""
    team = db.query(DBTeam).filter(DBTeam.id == team_id).first()
    if not team:
        raise HTTPException(status_code=404, detail="Team not found")
    # Refresh to ensure members relationship is loaded
    db.refresh(team)
    if user not in team.members:
        raise HTTPException(status_code=403, detail="Not a team member")
    return team


# ==================== SCRIM ENDPOINTS ====================

@router.post("/scrims")
async def create_scrim(
    request: ScrimCreate,
    current_user: DBUser = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a new scrim for the user's team"""
    try:
        team = get_user_team(current_user, db)

        scrim = Scrim(
            team_id=team.id,
            opponent_name=request.opponent_name,
            scheduled_at=request.scheduled_at,
            duration_minutes=request.duration_minutes,
            notes=request.notes,
            status="scheduled",
            total_games=0,
            wins=0,
            losses=0
        )

        db.add(scrim)
        db.commit()
        db.refresh(scrim)

        return {
            "success": True,
            "id": scrim.id,
            "message": "Scrim created successfully"
        }
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to create scrim: {str(e)}")


@router.get("/scrims/team/{team_id}")
async def get_team_scrims(
    team_id: str,
    status: Optional[str] = None,
    current_user: DBUser = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all scrims for a team"""
    try:
        verify_team_member(current_user, team_id, db)

        query = db.query(Scrim).filter(Scrim.team_id == team_id)

        if status:
            query = query.filter(Scrim.status == status)

        scrims = query.order_by(Scrim.scheduled_at.desc()).all()

        return {
            "scrims": [
                {
                    "id": s.id,
                    "opponent_name": s.opponent_name,
                    "scheduled_at": s.scheduled_at.isoformat(),
                    "duration_minutes": s.duration_minutes,
                    "notes": s.notes,
                    "status": s.status,
                    "total_games": s.total_games,
                    "wins": s.wins,
                    "losses": s.losses,
                    "created_at": s.created_at.isoformat()
                }
                for s in scrims
            ],
            "count": len(scrims)
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get scrims: {str(e)}")


@router.get("/scrims/{scrim_id}")
async def get_scrim(
    scrim_id: str,
    current_user: DBUser = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get a scrim with all its games"""
    try:
        scrim = db.query(Scrim).filter(Scrim.id == scrim_id).first()
        if not scrim:
            raise HTTPException(status_code=404, detail="Scrim not found")

        verify_team_member(current_user, scrim.team_id, db)

        # Get games with draft info
        games_data = []
        for game in sorted(scrim.games, key=lambda g: g.game_number):
            game_info = {
                "id": game.id,
                "game_number": game.game_number,
                "result": game.result,
                "coach_notes": game.coach_notes,
                "improvement_notes": game.improvement_notes,
                "draft_id": game.draft_id,
                "analytics_id": game.analytics_id,
                "created_at": game.created_at.isoformat(),
                "draft": None
            }

            # Include draft summary if linked
            if game.draft:
                game_info["draft"] = {
                    "id": game.draft.id,
                    "name": game.draft.name,
                    "blue_team_name": game.draft.blue_team_name,
                    "red_team_name": game.draft.red_team_name
                }

            games_data.append(game_info)

        return {
            "id": scrim.id,
            "team_id": scrim.team_id,
            "opponent_name": scrim.opponent_name,
            "scheduled_at": scrim.scheduled_at.isoformat(),
            "duration_minutes": scrim.duration_minutes,
            "notes": scrim.notes,
            "status": scrim.status,
            "total_games": scrim.total_games,
            "wins": scrim.wins,
            "losses": scrim.losses,
            "games": games_data,
            "created_at": scrim.created_at.isoformat()
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get scrim: {str(e)}")


@router.patch("/scrims/{scrim_id}")
async def update_scrim(
    scrim_id: str,
    request: ScrimUpdate,
    current_user: DBUser = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update a scrim"""
    try:
        scrim = db.query(Scrim).filter(Scrim.id == scrim_id).first()
        if not scrim:
            raise HTTPException(status_code=404, detail="Scrim not found")

        verify_team_member(current_user, scrim.team_id, db)

        if request.opponent_name is not None:
            scrim.opponent_name = request.opponent_name
        if request.scheduled_at is not None:
            scrim.scheduled_at = request.scheduled_at
        if request.duration_minutes is not None:
            scrim.duration_minutes = request.duration_minutes
        if request.notes is not None:
            scrim.notes = request.notes
        if request.status is not None:
            scrim.status = request.status

        db.commit()

        return {"success": True, "message": "Scrim updated successfully"}
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to update scrim: {str(e)}")


@router.delete("/scrims/{scrim_id}")
async def delete_scrim(
    scrim_id: str,
    current_user: DBUser = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete a scrim and all its games"""
    try:
        scrim = db.query(Scrim).filter(Scrim.id == scrim_id).first()
        if not scrim:
            raise HTTPException(status_code=404, detail="Scrim not found")

        verify_team_member(current_user, scrim.team_id, db)

        db.delete(scrim)
        db.commit()

        return {"success": True, "message": "Scrim deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to delete scrim: {str(e)}")


# ==================== SCRIM GAME ENDPOINTS ====================

@router.post("/scrims/{scrim_id}/games")
async def add_game(
    scrim_id: str,
    request: ScrimGameCreate,
    current_user: DBUser = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Add a game to a scrim (max 5 games)"""
    try:
        scrim = db.query(Scrim).filter(Scrim.id == scrim_id).first()
        if not scrim:
            raise HTTPException(status_code=404, detail="Scrim not found")

        verify_team_member(current_user, scrim.team_id, db)

        # Check max 5 games
        if len(scrim.games) >= 5:
            raise HTTPException(status_code=400, detail="Maximum 5 games per scrim (Bo5)")

        # Check game number doesn't exist
        existing = db.query(ScrimGame).filter(
            ScrimGame.scrim_id == scrim_id,
            ScrimGame.game_number == request.game_number
        ).first()
        if existing:
            raise HTTPException(status_code=400, detail=f"Game {request.game_number} already exists")

        game = ScrimGame(
            scrim_id=scrim_id,
            game_number=request.game_number,
            result=request.result,
            coach_notes=request.coach_notes,
            draft_id=request.draft_id
        )

        db.add(game)

        # Update scrim totals
        scrim.total_games += 1
        if request.result == 'win':
            scrim.wins += 1
        elif request.result == 'lose':
            scrim.losses += 1

        db.commit()
        db.refresh(game)

        return {
            "success": True,
            "id": game.id,
            "message": "Game added successfully"
        }
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to add game: {str(e)}")


@router.patch("/games/{game_id}")
async def update_game(
    game_id: str,
    request: ScrimGameUpdate,
    current_user: DBUser = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update a game (result, notes, draft link)"""
    try:
        game = db.query(ScrimGame).filter(ScrimGame.id == game_id).first()
        if not game:
            raise HTTPException(status_code=404, detail="Game not found")

        scrim = game.scrim
        verify_team_member(current_user, scrim.team_id, db)

        # Track result changes for scrim totals
        old_result = game.result

        if request.result is not None:
            game.result = request.result
        if request.coach_notes is not None:
            game.coach_notes = request.coach_notes
        if request.improvement_notes is not None:
            game.improvement_notes = request.improvement_notes
        if request.draft_id is not None:
            # Verify draft exists and belongs to team
            if request.draft_id:
                draft = db.query(Draft).filter(Draft.id == request.draft_id).first()
                if not draft:
                    raise HTTPException(status_code=404, detail="Draft not found")
                # Link draft to this scrim
                draft.scrim_id = scrim.id
            game.draft_id = request.draft_id

        game.updated_at = datetime.utcnow()

        # Update scrim win/loss totals if result changed
        if request.result is not None and request.result != old_result:
            # Remove old result count
            if old_result == 'win':
                scrim.wins = max(0, scrim.wins - 1)
            elif old_result == 'lose':
                scrim.losses = max(0, scrim.losses - 1)

            # Add new result count
            if request.result == 'win':
                scrim.wins += 1
            elif request.result == 'lose':
                scrim.losses += 1

        db.commit()

        return {"success": True, "message": "Game updated successfully"}
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to update game: {str(e)}")


@router.delete("/games/{game_id}")
async def delete_game(
    game_id: str,
    current_user: DBUser = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete a game from a scrim"""
    try:
        game = db.query(ScrimGame).filter(ScrimGame.id == game_id).first()
        if not game:
            raise HTTPException(status_code=404, detail="Game not found")

        scrim = game.scrim
        verify_team_member(current_user, scrim.team_id, db)

        # Update scrim totals
        scrim.total_games = max(0, scrim.total_games - 1)
        if game.result == 'win':
            scrim.wins = max(0, scrim.wins - 1)
        elif game.result == 'lose':
            scrim.losses = max(0, scrim.losses - 1)

        db.delete(game)
        db.commit()

        return {"success": True, "message": "Game deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to delete game: {str(e)}")


# ==================== DRAFT INTEGRATION ====================

@router.get("/scrims/{scrim_id}/drafts")
async def get_scrim_drafts(
    scrim_id: str,
    current_user: DBUser = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all drafts associated with a scrim"""
    try:
        scrim = db.query(Scrim).filter(Scrim.id == scrim_id).first()
        if not scrim:
            raise HTTPException(status_code=404, detail="Scrim not found")

        verify_team_member(current_user, scrim.team_id, db)

        drafts = db.query(Draft).filter(Draft.scrim_id == scrim_id).all()

        return {
            "drafts": [
                {
                    "id": d.id,
                    "name": d.name,
                    "blue_team_name": d.blue_team_name,
                    "red_team_name": d.red_team_name,
                    "created_at": d.created_at.isoformat()
                }
                for d in drafts
            ]
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get drafts: {str(e)}")


# ==================== ANALYTICS INTEGRATION ====================

class ScrimAnalyticsLink(BaseModel):
    analytics_id: str
    file_path: Optional[str] = None

@router.post("/scrims/{scrim_id}/analytics")
async def link_analytics_to_scrim(
    scrim_id: str,
    request: ScrimAnalyticsLink,
    current_user: DBUser = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Link an analytics entry to a scrim"""
    try:
        scrim = db.query(Scrim).filter(Scrim.id == scrim_id).first()
        if not scrim:
            raise HTTPException(status_code=404, detail="Scrim not found")

        verify_team_member(current_user, scrim.team_id, db)

        # Verify analytics exists
        analytics = db.query(TeamAnalytics).filter(TeamAnalytics.id == request.analytics_id).first()
        if not analytics:
            raise HTTPException(status_code=404, detail="Analytics not found")

        # Link analytics to scrim by storing scrim_id in analytics
        analytics.scrim_id = scrim_id
        db.commit()

        return {"success": True, "message": "Analytics linked to scrim successfully"}
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to link analytics: {str(e)}")


@router.get("/scrims/{scrim_id}/analytics")
async def get_scrim_analytics(
    scrim_id: str,
    current_user: DBUser = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all analytics linked to a scrim"""
    try:
        scrim = db.query(Scrim).filter(Scrim.id == scrim_id).first()
        if not scrim:
            raise HTTPException(status_code=404, detail="Scrim not found")

        verify_team_member(current_user, scrim.team_id, db)

        # Get analytics where scrim_id matches
        analytics = db.query(TeamAnalytics).filter(TeamAnalytics.scrim_id == scrim_id).all()

        return {
            "analytics": [
                {
                    "id": a.id,
                    "name": a.name,
                    "players_count": a.players_count,
                    "uploaded_at": a.uploaded_at.isoformat() if a.uploaded_at else None
                }
                for a in analytics
            ]
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get analytics: {str(e)}")


# ==================== JSON UPLOAD ====================

from fastapi import UploadFile, File
import json
import os

@router.post("/scrims/{scrim_id}/upload")
async def upload_scrim_json(
    scrim_id: str,
    file: UploadFile = File(...),
    current_user: DBUser = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Upload a JSON file for scrim analytics"""
    try:
        scrim = db.query(Scrim).filter(Scrim.id == scrim_id).first()
        if not scrim:
            raise HTTPException(status_code=404, detail="Scrim not found")

        verify_team_member(current_user, scrim.team_id, db)

        # Read and parse JSON
        content = await file.read()
        try:
            json_data = json.loads(content.decode('utf-8'))
        except json.JSONDecodeError:
            raise HTTPException(status_code=400, detail="Invalid JSON file")

        # Create analytics entry linked to scrim
        analytics = TeamAnalytics(
            team_id=scrim.team_id,
            created_by_id=current_user.id,
            name=f"{scrim.opponent_name} - Analytics",
            file_name=file.filename,
            players_count=len(json_data.get('players', [])) if isinstance(json_data, dict) else 0,
            analysis_results=json.dumps(json_data),
            scrim_id=scrim_id
        )

        db.add(analytics)
        db.commit()
        db.refresh(analytics)

        return {
            "success": True,
            "analytics_id": analytics.id,
            "message": "JSON uploaded successfully"
        }
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to upload JSON: {str(e)}")
