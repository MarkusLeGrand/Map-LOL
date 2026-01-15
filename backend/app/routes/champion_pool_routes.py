"""
Champion Pool routes - Manage player champion pools and tier lists
One tier list per user (no position separation)
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

from database import get_db, ChampionPool, ChampionPoolEntry
from auth import get_current_user

router = APIRouter()


# Pydantic schemas
class ChampionEntryCreate(BaseModel):
    champion_id: str
    champion_name: str
    tier: str = "B"  # S, A, B, C
    position: int = 0
    notes: Optional[str] = None


class ChampionEntryUpdate(BaseModel):
    tier: Optional[str] = None
    notes: Optional[str] = None


class ReorderRequest(BaseModel):
    tier: str
    ordered_ids: List[str]


class ChampionEntryResponse(BaseModel):
    id: str
    champion_id: str
    champion_name: str
    tier: str
    position: int = 0
    notes: Optional[str]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class ChampionPoolResponse(BaseModel):
    id: str
    user_id: str
    entries: List[ChampionEntryResponse]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class UserPoolResponse(BaseModel):
    user_id: str
    username: str
    pool: Optional[ChampionPoolResponse]


# ============ Pool Endpoints ============

@router.get("/api/champion-pool/me", response_model=Optional[ChampionPoolResponse])
async def get_my_pool(
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get current user's champion pool"""
    pool = db.query(ChampionPool).filter(ChampionPool.user_id == current_user.id).first()
    return pool


@router.post("/api/champion-pool", response_model=ChampionPoolResponse)
async def create_or_get_pool(
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a new champion pool or return existing one"""
    # Check if pool already exists
    existing = db.query(ChampionPool).filter(
        ChampionPool.user_id == current_user.id
    ).first()

    if existing:
        return existing

    pool = ChampionPool(user_id=current_user.id)

    db.add(pool)
    db.commit()
    db.refresh(pool)

    return pool


@router.get("/api/champion-pool/team/{team_id}", response_model=List[UserPoolResponse])
async def get_team_pools(
    team_id: str,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all champion pools for a team (all members)"""
    # Verify user is in team
    is_member = db.execute(
        text("SELECT 1 FROM team_members WHERE team_id = :team_id AND user_id = :user_id"),
        {"team_id": team_id, "user_id": current_user.id}
    ).fetchone()

    if not is_member:
        raise HTTPException(status_code=403, detail="Not a member of this team")

    # Get all team members with their pools
    members = db.execute(
        text("""
        SELECT u.id, u.username
        FROM users u
        JOIN team_members tm ON u.id = tm.user_id
        WHERE tm.team_id = :team_id
        ORDER BY u.username
        """),
        {"team_id": team_id}
    ).fetchall()

    result = []
    for member in members:
        pool = db.query(ChampionPool).filter(
            ChampionPool.user_id == member[0]
        ).first()

        result.append({
            "user_id": member[0],
            "username": member[1],
            "pool": pool
        })

    return result


@router.delete("/api/champion-pool")
async def delete_pool(
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete user's champion pool"""
    pool = db.query(ChampionPool).filter(
        ChampionPool.user_id == current_user.id
    ).first()

    if not pool:
        raise HTTPException(status_code=404, detail="Pool not found")

    db.delete(pool)
    db.commit()

    return {"message": "Pool deleted"}


# ============ Entry Endpoints ============

@router.post("/api/champion-pool/entry", response_model=ChampionEntryResponse)
async def add_champion_to_pool(
    entry_data: ChampionEntryCreate,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Add a champion to pool (creates pool if needed)"""
    # Get or create pool
    pool = db.query(ChampionPool).filter(
        ChampionPool.user_id == current_user.id
    ).first()

    if not pool:
        pool = ChampionPool(user_id=current_user.id)
        db.add(pool)
        db.commit()
        db.refresh(pool)

    # Check if champion already in pool
    existing = db.query(ChampionPoolEntry).filter(
        ChampionPoolEntry.pool_id == pool.id,
        ChampionPoolEntry.champion_id == entry_data.champion_id
    ).first()

    if existing:
        raise HTTPException(status_code=400, detail="Champion already in pool")

    # Validate tier
    valid_tiers = ["S", "A", "B", "C"]
    if entry_data.tier.upper() not in valid_tiers:
        raise HTTPException(status_code=400, detail=f"Invalid tier. Must be one of: {', '.join(valid_tiers)}")

    # Get max position in this tier to add at the end
    max_pos = db.query(ChampionPoolEntry).filter(
        ChampionPoolEntry.pool_id == pool.id,
        ChampionPoolEntry.tier == entry_data.tier.upper()
    ).count()

    entry = ChampionPoolEntry(
        pool_id=pool.id,
        champion_id=entry_data.champion_id,
        champion_name=entry_data.champion_name,
        tier=entry_data.tier.upper(),
        position=max_pos,
        notes=entry_data.notes
    )

    db.add(entry)
    db.commit()
    db.refresh(entry)

    # Update pool's updated_at
    pool.updated_at = datetime.utcnow()
    db.commit()

    return entry


@router.put("/api/champion-pool/entry/{entry_id}", response_model=ChampionEntryResponse)
async def update_champion_entry(
    entry_id: str,
    entry_data: ChampionEntryUpdate,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update a champion entry (tier, notes)"""
    # Get entry and verify ownership through pool
    entry = db.query(ChampionPoolEntry).join(ChampionPool).filter(
        ChampionPoolEntry.id == entry_id,
        ChampionPool.user_id == current_user.id
    ).first()

    if not entry:
        raise HTTPException(status_code=404, detail="Entry not found")

    if entry_data.tier:
        valid_tiers = ["S", "A", "B", "C"]
        if entry_data.tier.upper() not in valid_tiers:
            raise HTTPException(status_code=400, detail=f"Invalid tier. Must be one of: {', '.join(valid_tiers)}")

        # If tier is changing, update position to be at the end of new tier
        if entry.tier != entry_data.tier.upper():
            max_pos = db.query(ChampionPoolEntry).filter(
                ChampionPoolEntry.pool_id == entry.pool_id,
                ChampionPoolEntry.tier == entry_data.tier.upper()
            ).count()
            entry.position = max_pos

        entry.tier = entry_data.tier.upper()

    if entry_data.notes is not None:
        entry.notes = entry_data.notes

    entry.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(entry)

    return entry


@router.delete("/api/champion-pool/entry/{entry_id}")
async def remove_champion_from_pool(
    entry_id: str,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Remove a champion from pool"""
    # Get entry and verify ownership through pool
    entry = db.query(ChampionPoolEntry).join(ChampionPool).filter(
        ChampionPoolEntry.id == entry_id,
        ChampionPool.user_id == current_user.id
    ).first()

    if not entry:
        raise HTTPException(status_code=404, detail="Entry not found")

    db.delete(entry)
    db.commit()

    return {"message": "Champion removed from pool"}


# ============ Bulk Operations ============

@router.put("/api/champion-pool/bulk-update")
async def bulk_update_pool(
    entries: List[ChampionEntryCreate],
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Bulk update pool (replace all entries)"""
    # Get or create pool
    pool = db.query(ChampionPool).filter(
        ChampionPool.user_id == current_user.id
    ).first()

    if not pool:
        pool = ChampionPool(user_id=current_user.id)
        db.add(pool)
        db.commit()
        db.refresh(pool)

    # Delete all existing entries
    db.query(ChampionPoolEntry).filter(ChampionPoolEntry.pool_id == pool.id).delete()

    # Add new entries
    valid_tiers = ["S", "A", "B", "C"]
    for entry_data in entries:
        tier = entry_data.tier.upper() if entry_data.tier.upper() in valid_tiers else "B"

        entry = ChampionPoolEntry(
            pool_id=pool.id,
            champion_id=entry_data.champion_id,
            champion_name=entry_data.champion_name,
            tier=tier,
            position=entry_data.position,
            notes=entry_data.notes
        )
        db.add(entry)

    pool.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(pool)

    return {"message": f"Pool updated with {len(entries)} champions", "pool": pool}


@router.put("/api/champion-pool/reorder")
async def reorder_champions_in_tier(
    reorder_data: ReorderRequest,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Reorder champions within a tier"""
    # Get user's pool
    pool = db.query(ChampionPool).filter(
        ChampionPool.user_id == current_user.id
    ).first()

    if not pool:
        raise HTTPException(status_code=404, detail="Pool not found")

    # Update position for each entry
    for idx, entry_id in enumerate(reorder_data.ordered_ids):
        entry = db.query(ChampionPoolEntry).filter(
            ChampionPoolEntry.id == entry_id,
            ChampionPoolEntry.pool_id == pool.id,
            ChampionPoolEntry.tier == reorder_data.tier.upper()
        ).first()

        if entry:
            entry.position = idx
            entry.updated_at = datetime.utcnow()

    pool.updated_at = datetime.utcnow()
    db.commit()

    return {"message": "Champions reordered successfully"}
