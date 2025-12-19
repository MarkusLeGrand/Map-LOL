"""
Team management schemas and CRUD operations
"""
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
from sqlalchemy.orm import Session
from fastapi import HTTPException

from database import Team as DBTeam, TeamInvite as DBTeamInvite, Scrim as DBScrim, team_members, User as DBUser


# ==================== SCHEMAS ====================

class TeamCreate(BaseModel):
    name: str
    tag: Optional[str] = None
    description: Optional[str] = None
    team_color: Optional[str] = "#3D7A5F"


class TeamMember(BaseModel):
    id: str
    username: str
    email: str
    riot_game_name: Optional[str] = None
    riot_tag_line: Optional[str] = None
    role: str
    joined_at: datetime

    class Config:
        from_attributes = True


class TeamResponse(BaseModel):
    id: str
    name: str
    tag: Optional[str]
    description: Optional[str]
    owner_id: str
    created_at: datetime
    team_color: str
    max_members: str
    member_count: int
    members: List[TeamMember] = []

    class Config:
        from_attributes = True


class InviteCreate(BaseModel):
    user_id: str
    role: str = "player"


class InviteResponse(BaseModel):
    id: str
    team_id: str
    team_name: str
    invited_user_id: str
    invited_by_id: str
    role: str
    status: str
    created_at: datetime

    class Config:
        from_attributes = True


class ScrimCreate(BaseModel):
    opponent_name: str
    scheduled_at: datetime
    duration_minutes: str = "60"
    notes: Optional[str] = None


class ScrimResponse(BaseModel):
    id: str
    team_id: str
    opponent_name: str
    scheduled_at: datetime
    duration_minutes: str
    notes: Optional[str]
    status: str
    created_at: datetime

    class Config:
        from_attributes = True


# ==================== CRUD OPERATIONS ====================

def create_team(db: Session, team_data: TeamCreate, owner_id: str) -> DBTeam:
    """Create a new team"""
    # Check if team name already exists
    existing = db.query(DBTeam).filter(DBTeam.name == team_data.name).first()
    if existing:
        raise HTTPException(status_code=400, detail="Team name already taken")

    # Check if tag already exists
    if team_data.tag:
        existing_tag = db.query(DBTeam).filter(DBTeam.tag == team_data.tag).first()
        if existing_tag:
            raise HTTPException(status_code=400, detail="Team tag already taken")

    # Create team
    db_team = DBTeam(
        name=team_data.name,
        tag=team_data.tag,
        description=team_data.description,
        owner_id=owner_id,
        team_color=team_data.team_color
    )
    db.add(db_team)
    db.commit()
    db.refresh(db_team)

    # Add owner as member with 'owner' role
    owner = db.query(DBUser).filter(DBUser.id == owner_id).first()
    if owner:
        db_team.members.append(owner)
        # Update role in association table
        db.execute(
            team_members.update()
            .where(team_members.c.team_id == db_team.id)
            .where(team_members.c.user_id == owner_id)
            .values(role='owner')
        )
        db.commit()

    return db_team


def get_user_teams(db: Session, user_id: str) -> List[DBTeam]:
    """Get all teams a user is part of"""
    user = db.query(DBUser).filter(DBUser.id == user_id).first()
    if not user:
        return []
    return user.teams


def get_team_by_id(db: Session, team_id: str) -> Optional[DBTeam]:
    """Get team by ID"""
    return db.query(DBTeam).filter(DBTeam.id == team_id).first()


def get_team_members_with_roles(db: Session, team_id: str) -> List[dict]:
    """Get team members with their roles"""
    from sqlalchemy import text

    result = db.execute(
        text("""
        SELECT u.id, u.username, u.email, u.riot_game_name, u.riot_tag_line,
               tm.role, tm.joined_at
        FROM users u
        JOIN team_members tm ON u.id = tm.user_id
        WHERE tm.team_id = :team_id
        ORDER BY tm.joined_at
        """),
        {"team_id": team_id}
    ).fetchall()

    return [
        {
            "id": row[0],
            "username": row[1],
            "email": row[2],
            "riot_game_name": row[3],
            "riot_tag_line": row[4],
            "role": row[5],
            "joined_at": row[6]
        }
        for row in result
    ]


def create_team_invite(db: Session, team_id: str, invite_data: InviteCreate, invited_by_id: str) -> DBTeamInvite:
    """Create a team invitation"""
    # Check if user exists
    user = db.query(DBUser).filter(DBUser.id == invite_data.user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Check if already a member
    team = db.query(DBTeam).filter(DBTeam.id == team_id).first()
    if not team:
        raise HTTPException(status_code=404, detail="Team not found")

    if user in team.members:
        raise HTTPException(status_code=400, detail="User is already a team member")

    # Check for pending invite
    existing_invite = db.query(DBTeamInvite).filter(
        DBTeamInvite.team_id == team_id,
        DBTeamInvite.invited_user_id == invite_data.user_id,
        DBTeamInvite.status == "pending"
    ).first()

    if existing_invite:
        raise HTTPException(status_code=400, detail="User already has a pending invite")

    # Create invite
    db_invite = DBTeamInvite(
        team_id=team_id,
        invited_user_id=invite_data.user_id,
        invited_by_id=invited_by_id,
        role=invite_data.role
    )
    db.add(db_invite)
    db.commit()
    db.refresh(db_invite)

    return db_invite


def accept_team_invite(db: Session, invite_id: str, user_id: str) -> DBTeam:
    """Accept a team invitation"""
    invite = db.query(DBTeamInvite).filter(DBTeamInvite.id == invite_id).first()

    if not invite:
        raise HTTPException(status_code=404, detail="Invite not found")

    if invite.invited_user_id != user_id:
        raise HTTPException(status_code=403, detail="Not authorized")

    if invite.status != "pending":
        raise HTTPException(status_code=400, detail="Invite already processed")

    # Add user to team
    team = db.query(DBTeam).filter(DBTeam.id == invite.team_id).first()
    user = db.query(DBUser).filter(DBUser.id == user_id).first()

    if team and user:
        team.members.append(user)
        # Update role
        db.execute(
            team_members.update()
            .where(team_members.c.team_id == team.id)
            .where(team_members.c.user_id == user_id)
            .values(role=invite.role)
        )

    # Update invite status
    invite.status = "accepted"
    db.commit()

    return team


def get_user_invites(db: Session, user_id: str) -> List[DBTeamInvite]:
    """Get all pending invites for a user"""
    return db.query(DBTeamInvite).filter(
        DBTeamInvite.invited_user_id == user_id,
        DBTeamInvite.status == "pending"
    ).all()


def create_scrim(db: Session, team_id: str, scrim_data: ScrimCreate) -> DBScrim:
    """Create a scrim/practice session"""
    db_scrim = DBScrim(
        team_id=team_id,
        opponent_name=scrim_data.opponent_name,
        scheduled_at=scrim_data.scheduled_at,
        duration_minutes=scrim_data.duration_minutes,
        notes=scrim_data.notes
    )
    db.add(db_scrim)
    db.commit()
    db.refresh(db_scrim)

    return db_scrim


def get_team_scrims(db: Session, team_id: str) -> List[DBScrim]:
    """Get all scrims for a team"""
    return db.query(DBScrim).filter(DBScrim.team_id == team_id).order_by(DBScrim.scheduled_at.desc()).all()
