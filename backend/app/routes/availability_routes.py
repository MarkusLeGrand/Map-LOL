"""
Availability slots routes - Handle user availability for scheduling
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import text
from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime, timedelta
import sys
from pathlib import Path

# Add parent directory to path for imports
sys.path.append(str(Path(__file__).parent.parent))

from database import get_db, AvailabilitySlot
from auth import get_current_user

router = APIRouter()


# Pydantic schemas
class AvailabilitySlotCreate(BaseModel):
    team_id: Optional[str] = None
    start_time: datetime
    end_time: datetime
    is_recurring: bool = False
    recurrence_pattern: Optional[str] = None  # 'weekly_thursday', 'daily', etc.
    recurrence_end_date: Optional[datetime] = None
    notes: Optional[str] = None


class AvailabilitySlotUpdate(BaseModel):
    start_time: Optional[datetime] = None
    end_time: Optional[datetime] = None
    notes: Optional[str] = None


class AvailabilitySlotResponse(BaseModel):
    id: str
    user_id: str
    team_id: Optional[str]
    start_time: datetime
    end_time: datetime
    is_recurring: bool
    recurrence_pattern: Optional[str]
    recurrence_end_date: Optional[datetime]
    notes: Optional[str]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class TeamAvailabilityResponse(BaseModel):
    """Aggregated team availability showing overlap"""
    user_id: str
    username: str
    slots: List[AvailabilitySlotResponse]


@router.post("/api/availability/slots", response_model=AvailabilitySlotResponse)
async def create_availability_slot(
    slot: AvailabilitySlotCreate,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a new availability slot"""
    # Validate time range
    if slot.end_time <= slot.start_time:
        raise HTTPException(status_code=400, detail="End time must be after start time")

    # Create slot
    db_slot = AvailabilitySlot(
        user_id=current_user.id,
        team_id=slot.team_id,
        start_time=slot.start_time,
        end_time=slot.end_time,
        is_recurring=slot.is_recurring,
        recurrence_pattern=slot.recurrence_pattern,
        recurrence_end_date=slot.recurrence_end_date,
        notes=slot.notes
    )

    db.add(db_slot)
    db.commit()
    db.refresh(db_slot)

    return db_slot


@router.get("/api/availability/slots/me", response_model=List[AvailabilitySlotResponse])
async def get_my_availability_slots(
    team_id: Optional[str] = None,
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get current user's availability slots, optionally filtered by team and date range"""
    query = db.query(AvailabilitySlot).filter(AvailabilitySlot.user_id == current_user.id)

    if team_id:
        query = query.filter(AvailabilitySlot.team_id == team_id)

    if start_date:
        query = query.filter(AvailabilitySlot.start_time >= start_date)

    if end_date:
        query = query.filter(AvailabilitySlot.end_time <= end_date)

    slots = query.order_by(AvailabilitySlot.start_time).all()
    return slots


@router.get("/api/availability/team/{team_id}", response_model=List[TeamAvailabilityResponse])
async def get_team_availability(
    team_id: str,
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get availability for all team members"""
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

    # Get all team members with their availability
    members_query = text("""
        SELECT DISTINCT u.id, u.username
        FROM users u
        JOIN team_members tm ON u.id = tm.user_id
        WHERE tm.team_id = :team_id
        ORDER BY u.username
    """)

    members = db.execute(members_query, {"team_id": team_id}).fetchall()

    result = []
    for member in members:
        # Get member's slots
        slots_query = db.query(AvailabilitySlot).filter(
            AvailabilitySlot.user_id == member[0]
        )

        if start_date:
            slots_query = slots_query.filter(AvailabilitySlot.start_time >= start_date)
        if end_date:
            slots_query = slots_query.filter(AvailabilitySlot.end_time <= end_date)

        # Filter by team_id or global slots (team_id is None)
        slots_query = slots_query.filter(
            (AvailabilitySlot.team_id == team_id) | (AvailabilitySlot.team_id == None)
        )

        slots = slots_query.order_by(AvailabilitySlot.start_time).all()

        result.append({
            "user_id": member[0],
            "username": member[1],
            "slots": slots
        })

    return result


@router.put("/api/availability/slots/{slot_id}", response_model=AvailabilitySlotResponse)
async def update_availability_slot(
    slot_id: str,
    slot_update: AvailabilitySlotUpdate,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update an availability slot (for drag & drop)"""
    db_slot = db.query(AvailabilitySlot).filter(
        AvailabilitySlot.id == slot_id,
        AvailabilitySlot.user_id == current_user.id
    ).first()

    if not db_slot:
        raise HTTPException(status_code=404, detail="Slot not found")

    # Update fields
    if slot_update.start_time:
        db_slot.start_time = slot_update.start_time
    if slot_update.end_time:
        db_slot.end_time = slot_update.end_time
    if slot_update.notes is not None:
        db_slot.notes = slot_update.notes

    # Validate time range
    if db_slot.end_time <= db_slot.start_time:
        raise HTTPException(status_code=400, detail="End time must be after start time")

    db_slot.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(db_slot)

    return db_slot


@router.delete("/api/availability/slots/{slot_id}")
async def delete_availability_slot(
    slot_id: str,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete an availability slot"""
    db_slot = db.query(AvailabilitySlot).filter(
        AvailabilitySlot.id == slot_id,
        AvailabilitySlot.user_id == current_user.id
    ).first()

    if not db_slot:
        raise HTTPException(status_code=404, detail="Slot not found")

    db.delete(db_slot)
    db.commit()

    return {"message": "Slot deleted successfully"}


@router.get("/api/availability/team/{team_id}/overlap")
async def get_team_availability_overlap(
    team_id: str,
    start_date: datetime,
    end_date: datetime,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Find time slots where ALL team members are available"""
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

    # Get all team member IDs
    members_result = db.execute(
        text("SELECT user_id FROM team_members WHERE team_id = :team_id"),
        {"team_id": team_id}
    ).fetchall()

    member_ids = [row[0] for row in members_result]
    total_members = len(member_ids)

    if total_members == 0:
        return {"overlap_slots": []}

    # Find overlapping time slots
    # This is a simplified version - in production you'd use a more sophisticated algorithm
    all_slots = []
    for member_id in member_ids:
        slots = db.query(AvailabilitySlot).filter(
            AvailabilitySlot.user_id == member_id,
            AvailabilitySlot.start_time >= start_date,
            AvailabilitySlot.end_time <= end_date
        ).filter(
            (AvailabilitySlot.team_id == team_id) | (AvailabilitySlot.team_id == None)
        ).all()
        all_slots.extend([(slot.start_time, slot.end_time, member_id) for slot in slots])

    # Find overlaps (this is a basic implementation)
    # In production, use an interval tree or sweep line algorithm
    overlap_slots = []

    # Group by time ranges and count how many members are available
    # For now, return slots where at least all members have availability
    # This is a placeholder - you'd implement proper interval overlap detection

    return {
        "overlap_slots": overlap_slots,
        "total_members": total_members,
        "note": "Overlap detection coming soon - showing individual availabilities for now"
    }
