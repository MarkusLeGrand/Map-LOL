"""
Scrim (practice match) management endpoints
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database import get_db, User as DBUser, Scrim as DBScrim
from auth import get_current_user
from teams import (
    ScrimCreate, ScrimResponse,
    get_team_by_id, create_scrim, get_team_scrims
)

router = APIRouter(prefix="/api/scrims", tags=["scrims"])


@router.post("/create", response_model=ScrimResponse)
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

    if current_user not in team.members:
        raise HTTPException(status_code=403, detail="Not a team member")

    try:
        scrim = create_scrim(db, team_id, scrim_data)
        return scrim
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create scrim: {str(e)}")


@router.get("/team/{team_id}", response_model=list[ScrimResponse])
async def get_scrims(
    team_id: str,
    current_user: DBUser = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all scrims for a team"""
    team = get_team_by_id(db, team_id)
    if not team:
        raise HTTPException(status_code=404, detail="Team not found")

    if current_user not in team.members:
        raise HTTPException(status_code=403, detail="Not a team member")

    try:
        scrims = get_team_scrims(db, team_id)
        return scrims
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get scrims: {str(e)}")


@router.patch("/{scrim_id}")
async def update_scrim(
    scrim_id: str,
    update_data: dict,
    current_user: DBUser = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update a scrim (team members only)"""
    scrim = db.query(DBScrim).filter(DBScrim.id == scrim_id).first()
    if not scrim:
        raise HTTPException(status_code=404, detail="Scrim not found")

    team = get_team_by_id(db, scrim.team_id)
    if not team:
        raise HTTPException(status_code=404, detail="Team not found")

    if current_user not in team.members:
        raise HTTPException(status_code=403, detail="Only team members can update scrims")

    try:
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


@router.delete("/{scrim_id}")
async def delete_scrim(
    scrim_id: str,
    current_user: DBUser = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete a scrim (team members only)"""
    scrim = db.query(DBScrim).filter(DBScrim.id == scrim_id).first()
    if not scrim:
        raise HTTPException(status_code=404, detail="Scrim not found")

    team = get_team_by_id(db, scrim.team_id)
    if not team:
        raise HTTPException(status_code=404, detail="Team not found")

    if current_user not in team.members:
        raise HTTPException(status_code=403, detail="Only team members can delete scrims")

    try:
        db.delete(scrim)
        db.commit()
        return {"message": "Scrim deleted successfully"}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to delete scrim: {str(e)}")
