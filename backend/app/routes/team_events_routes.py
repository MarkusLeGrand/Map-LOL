"""
Team events routes - Handle team events (scrims, training, soloq, meetings)
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import text
from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime
import sys
from pathlib import Path

# Add parent directory to path for imports
sys.path.append(str(Path(__file__).parent.parent))

from database import get_db, TeamEvent
from auth import get_current_user

router = APIRouter()


# Pydantic schemas
class TeamEventCreate(BaseModel):
    team_id: str
    title: str
    event_type: str  # 'scrim', 'training', 'soloq', 'meeting'
    start_time: datetime
    end_time: datetime
    opponent_name: Optional[str] = None
    notes: Optional[str] = None


class TeamEventResponse(BaseModel):
    id: str
    team_id: str
    created_by_id: str
    title: str
    event_type: str
    start_time: datetime
    end_time: datetime
    opponent_name: Optional[str]
    notes: Optional[str]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


@router.post("/api/team-events", response_model=TeamEventResponse)
async def create_team_event(
    event: TeamEventCreate,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a new team event"""
    # Verify user is in the team
    result = db.execute(
        text("""
        SELECT 1 FROM team_members
        WHERE team_id = :team_id AND user_id = :user_id
        """),
        {"team_id": event.team_id, "user_id": current_user.id}
    ).fetchone()

    if not result:
        raise HTTPException(status_code=403, detail="Not a member of this team")

    # Validate time range
    if event.end_time <= event.start_time:
        raise HTTPException(status_code=400, detail="End time must be after start time")

    # Validate event type
    valid_types = ['scrim', 'training', 'soloq', 'meeting']
    if event.event_type not in valid_types:
        raise HTTPException(status_code=400, detail=f"Invalid event type. Must be one of: {', '.join(valid_types)}")

    # Create event
    db_event = TeamEvent(
        team_id=event.team_id,
        created_by_id=current_user.id,
        title=event.title,
        event_type=event.event_type,
        start_time=event.start_time,
        end_time=event.end_time,
        opponent_name=event.opponent_name,
        notes=event.notes,
        is_recurring=False
    )

    db.add(db_event)
    db.commit()
    db.refresh(db_event)

    return db_event


@router.get("/api/team-events/{team_id}", response_model=List[TeamEventResponse])
async def get_team_events(
    team_id: str,
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all events for a team"""
    # Verify user is in the team
    result = db.execute(
        text("""
        SELECT 1 FROM team_members
        WHERE team_id = :team_id AND user_id = :user_id
        """),
        {"team_id": team_id, "user_id": current_user.id}
    ).fetchone()

    if not result:
        raise HTTPException(status_code=403, detail="Not a member of this team")

    # Get events
    query = db.query(TeamEvent).filter(TeamEvent.team_id == team_id)

    if start_date:
        query = query.filter(TeamEvent.start_time >= start_date)
    if end_date:
        query = query.filter(TeamEvent.end_time <= end_date)

    events = query.order_by(TeamEvent.start_time).all()
    return events


@router.delete("/api/team-events/{event_id}")
async def delete_team_event(
    event_id: str,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete a team event"""
    # Get the event
    db_event = db.query(TeamEvent).filter(TeamEvent.id == event_id).first()

    if not db_event:
        raise HTTPException(status_code=404, detail="Event not found")

    # Verify user is in the team
    result = db.execute(
        text("""
        SELECT 1 FROM team_members
        WHERE team_id = :team_id AND user_id = :user_id
        """),
        {"team_id": db_event.team_id, "user_id": current_user.id}
    ).fetchone()

    if not result:
        raise HTTPException(status_code=403, detail="Not a member of this team")

    db.delete(db_event)
    db.commit()

    return {"message": "Event deleted successfully"}
