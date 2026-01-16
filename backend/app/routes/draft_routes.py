"""
Draft routes - Save and load draft compositions
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

import sys
from pathlib import Path
sys.path.append(str(Path(__file__).parent.parent))

from database import get_db, Draft as DBDraft, User as DBUser, Team as DBTeam
from auth import get_current_user

router = APIRouter(prefix="/api/drafts", tags=["drafts"])

# Pydantic models
class DraftSlot(BaseModel):
    champion_id: Optional[str] = None
    champion_name: Optional[str] = None

class DraftData(BaseModel):
    blue_picks: List[DraftSlot]
    red_picks: List[DraftSlot]
    blue_bans: List[DraftSlot]
    red_bans: List[DraftSlot]

class CreateDraftRequest(BaseModel):
    name: str
    blue_team_name: str = "Blue Team"
    red_team_name: str = "Red Team"
    draft_data: DraftData
    notes: Optional[str] = None
    external_url: Optional[str] = None
    team_id: Optional[str] = None

class UpdateDraftRequest(BaseModel):
    name: Optional[str] = None
    blue_team_name: Optional[str] = None
    red_team_name: Optional[str] = None
    draft_data: Optional[DraftData] = None
    notes: Optional[str] = None
    external_url: Optional[str] = None


@router.post("")
async def create_draft(
    request: CreateDraftRequest,
    current_user: DBUser = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a new saved draft"""
    try:
        # If team_id provided, verify user is member
        if request.team_id:
            team = db.query(DBTeam).filter(DBTeam.id == request.team_id).first()
            if not team or current_user not in team.members:
                raise HTTPException(status_code=403, detail="Not a team member")

        # Convert draft_data to dict
        draft_data_dict = {
            "blue_picks": [slot.dict() for slot in request.draft_data.blue_picks],
            "red_picks": [slot.dict() for slot in request.draft_data.red_picks],
            "blue_bans": [slot.dict() for slot in request.draft_data.blue_bans],
            "red_bans": [slot.dict() for slot in request.draft_data.red_bans],
        }

        draft = DBDraft(
            user_id=current_user.id,
            team_id=request.team_id,
            name=request.name,
            blue_team_name=request.blue_team_name,
            red_team_name=request.red_team_name,
            draft_data=draft_data_dict,
            notes=request.notes,
            external_url=request.external_url
        )

        db.add(draft)
        db.commit()
        db.refresh(draft)

        return {
            "success": True,
            "id": draft.id,
            "message": "Draft saved successfully"
        }
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to save draft: {str(e)}")


@router.get("")
async def get_my_drafts(
    current_user: DBUser = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get current user's saved drafts"""
    try:
        drafts = db.query(DBDraft).filter(
            DBDraft.user_id == current_user.id
        ).order_by(DBDraft.updated_at.desc()).all()

        return {
            "drafts": [
                {
                    "id": d.id,
                    "name": d.name,
                    "blue_team_name": d.blue_team_name,
                    "red_team_name": d.red_team_name,
                    "draft_data": d.draft_data,
                    "notes": d.notes,
                    "external_url": d.external_url,
                    "team_id": d.team_id,
                    "created_at": d.created_at.isoformat(),
                    "updated_at": d.updated_at.isoformat()
                }
                for d in drafts
            ],
            "count": len(drafts)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get drafts: {str(e)}")


@router.get("/team/{team_id}")
async def get_team_drafts(
    team_id: str,
    current_user: DBUser = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get drafts for a specific team"""
    try:
        # Verify user is member of team
        team = db.query(DBTeam).filter(DBTeam.id == team_id).first()
        if not team or current_user not in team.members:
            raise HTTPException(status_code=403, detail="Not a team member")

        drafts = db.query(DBDraft).filter(
            DBDraft.team_id == team_id
        ).order_by(DBDraft.updated_at.desc()).all()

        # Get creator usernames
        creator_ids = [d.user_id for d in drafts]
        creators = {u.id: u.username for u in db.query(DBUser).filter(DBUser.id.in_(creator_ids)).all()}

        return {
            "drafts": [
                {
                    "id": d.id,
                    "name": d.name,
                    "blue_team_name": d.blue_team_name,
                    "red_team_name": d.red_team_name,
                    "draft_data": d.draft_data,
                    "notes": d.notes,
                    "external_url": d.external_url,
                    "created_by": creators.get(d.user_id, "Unknown"),
                    "created_at": d.created_at.isoformat(),
                    "updated_at": d.updated_at.isoformat()
                }
                for d in drafts
            ],
            "count": len(drafts)
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get team drafts: {str(e)}")


@router.get("/{draft_id}")
async def get_draft(
    draft_id: str,
    current_user: DBUser = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get a specific draft"""
    try:
        draft = db.query(DBDraft).filter(DBDraft.id == draft_id).first()

        if not draft:
            raise HTTPException(status_code=404, detail="Draft not found")

        # Check access - owner or team member
        has_access = draft.user_id == current_user.id
        if not has_access and draft.team_id:
            team = db.query(DBTeam).filter(DBTeam.id == draft.team_id).first()
            has_access = team and current_user in team.members

        if not has_access:
            raise HTTPException(status_code=403, detail="Access denied")

        return {
            "id": draft.id,
            "name": draft.name,
            "blue_team_name": draft.blue_team_name,
            "red_team_name": draft.red_team_name,
            "draft_data": draft.draft_data,
            "notes": draft.notes,
            "external_url": draft.external_url,
            "team_id": draft.team_id,
            "created_at": draft.created_at.isoformat(),
            "updated_at": draft.updated_at.isoformat()
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get draft: {str(e)}")


@router.put("/{draft_id}")
async def update_draft(
    draft_id: str,
    request: UpdateDraftRequest,
    current_user: DBUser = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update a draft"""
    try:
        draft = db.query(DBDraft).filter(DBDraft.id == draft_id).first()

        if not draft:
            raise HTTPException(status_code=404, detail="Draft not found")

        # Only owner can update
        if draft.user_id != current_user.id:
            raise HTTPException(status_code=403, detail="Only the creator can update this draft")

        # Update fields
        if request.name is not None:
            draft.name = request.name
        if request.blue_team_name is not None:
            draft.blue_team_name = request.blue_team_name
        if request.red_team_name is not None:
            draft.red_team_name = request.red_team_name
        if request.notes is not None:
            draft.notes = request.notes
        if request.external_url is not None:
            draft.external_url = request.external_url
        if request.draft_data is not None:
            draft.draft_data = {
                "blue_picks": [slot.dict() for slot in request.draft_data.blue_picks],
                "red_picks": [slot.dict() for slot in request.draft_data.red_picks],
                "blue_bans": [slot.dict() for slot in request.draft_data.blue_bans],
                "red_bans": [slot.dict() for slot in request.draft_data.red_bans],
            }

        draft.updated_at = datetime.utcnow()
        db.commit()

        return {"success": True, "message": "Draft updated successfully"}
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to update draft: {str(e)}")


@router.delete("/{draft_id}")
async def delete_draft(
    draft_id: str,
    current_user: DBUser = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete a draft"""
    try:
        draft = db.query(DBDraft).filter(DBDraft.id == draft_id).first()

        if not draft:
            raise HTTPException(status_code=404, detail="Draft not found")

        # Check permission - owner or team owner
        can_delete = draft.user_id == current_user.id
        if not can_delete and draft.team_id:
            team = db.query(DBTeam).filter(DBTeam.id == draft.team_id).first()
            can_delete = team and team.owner_id == current_user.id

        if not can_delete:
            raise HTTPException(status_code=403, detail="Permission denied")

        db.delete(draft)
        db.commit()

        return {"success": True, "message": "Draft deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to delete draft: {str(e)}")
