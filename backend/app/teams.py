"""
Team management schemas and CRUD operations
"""
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
from sqlalchemy.orm import Session
from fastapi import HTTPException

from database import Team as DBTeam, TeamInvite as DBTeamInvite, Scrim as DBScrim, JoinRequest as DBJoinRequest, team_members, User as DBUser


# ==================== SCHEMAS ====================

class TeamCreate(BaseModel):
    name: str
    tag: Optional[str] = None
    description: Optional[str] = None
    team_color: Optional[str] = "#3D7A5F"


class TeamUpdate(BaseModel):
    name: Optional[str] = None
    tag: Optional[str] = None
    description: Optional[str] = None
    team_color: Optional[str] = None
    is_locked: Optional[bool] = None


class TeamMember(BaseModel):
    id: str
    username: str
    email: str
    riot_game_name: Optional[str] = None
    riot_tag_line: Optional[str] = None
    discord: Optional[str] = None
    role: str
    joined_at: datetime
    # Summoner data fields
    summoner_level: Optional[str] = None
    profile_icon_id: Optional[str] = None
    solo_tier: Optional[str] = None
    solo_rank: Optional[str] = None
    solo_lp: Optional[str] = None
    preferred_lane: Optional[str] = None
    top_champions: Optional[List[dict]] = []

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
    is_locked: bool = False

    class Config:
        from_attributes = True


class InviteCreate(BaseModel):
    username: str
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


class JoinRequestCreate(BaseModel):
    message: Optional[str] = None


class JoinRequestResponse(BaseModel):
    id: str
    team_id: str
    team_name: str
    user_id: str
    username: str
    user_email: str
    riot_game_name: Optional[str] = None
    riot_tag_line: Optional[str] = None
    message: Optional[str]
    status: str
    created_at: datetime

    class Config:
        from_attributes = True


# ==================== CRUD OPERATIONS ====================

def create_team(db: Session, team_data: TeamCreate, owner_id: str) -> DBTeam:
    """Create a new team"""
    # Check if owner is already in a team (prevent multi-team)
    owner = db.query(DBUser).filter(DBUser.id == owner_id).first()
    if owner and len(owner.teams) > 0:
        raise HTTPException(status_code=400, detail="You can only be in one team at a time. Leave your current team first.")

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


def update_team(db: Session, team_id: str, team_data: TeamUpdate) -> DBTeam:
    """Update team information"""
    team = db.query(DBTeam).filter(DBTeam.id == team_id).first()
    if not team:
        raise HTTPException(status_code=404, detail="Team not found")

    # Check if new name is taken by another team
    if team_data.name is not None and team_data.name != team.name:
        existing = db.query(DBTeam).filter(DBTeam.name == team_data.name).first()
        if existing:
            raise HTTPException(status_code=400, detail="Team name already taken")
        team.name = team_data.name

    # Check if new tag is taken by another team
    if team_data.tag is not None and team_data.tag != team.tag:
        existing_tag = db.query(DBTeam).filter(DBTeam.tag == team_data.tag).first()
        if existing_tag:
            raise HTTPException(status_code=400, detail="Team tag already taken")
        team.tag = team_data.tag

    # Update description
    if team_data.description is not None:
        team.description = team_data.description

    # Update color
    if team_data.team_color is not None:
        team.team_color = team_data.team_color

    # Update is_locked
    if team_data.is_locked is not None:
        team.is_locked = team_data.is_locked

    db.commit()
    db.refresh(team)
    return team


def get_team_members_with_roles(db: Session, team_id: str) -> List[dict]:
    """Get team members with their roles and summoner data"""
    from sqlalchemy import text
    from database import SummonerData

    result = db.execute(
        text("""
        SELECT u.id, u.username, u.email, u.riot_game_name, u.riot_tag_line,
               u.discord, tm.role, tm.joined_at
        FROM users u
        JOIN team_members tm ON u.id = tm.user_id
        WHERE tm.team_id = :team_id
        ORDER BY tm.joined_at
        """),
        {"team_id": team_id}
    ).fetchall()

    members = []
    for row in result:
        member_data = {
            "id": row[0],
            "username": row[1],
            "email": row[2],
            "riot_game_name": row[3],
            "riot_tag_line": row[4],
            "discord": row[5],
            "role": row[6],
            "joined_at": row[7],
            # Add summoner data fields
            "summoner_level": None,
            "profile_icon_id": None,
            "solo_tier": None,
            "solo_rank": None,
            "solo_lp": None,
            "preferred_lane": None,
            "top_champions": []
        }

        # Fetch summoner data if exists
        summoner = db.query(SummonerData).filter(SummonerData.user_id == row[0]).first()
        if summoner:
            member_data.update({
                "summoner_level": summoner.summoner_level,
                "profile_icon_id": summoner.profile_icon_id,
                "solo_tier": summoner.solo_tier,
                "solo_rank": summoner.solo_rank,
                "solo_lp": summoner.solo_lp,
                "preferred_lane": summoner.preferred_lane,
                "top_champions": summoner.top_champions or []
            })

        members.append(member_data)

    return members


def create_team_invite(db: Session, team_id: str, invite_data: InviteCreate, invited_by_id: str) -> DBTeamInvite:
    """Create a team invitation"""
    # Check if user exists by username
    user = db.query(DBUser).filter(DBUser.username == invite_data.username).first()
    if not user:
        raise HTTPException(status_code=404, detail=f"User '{invite_data.username}' not found")

    # Check if already a member
    team = db.query(DBTeam).filter(DBTeam.id == team_id).first()
    if not team:
        raise HTTPException(status_code=404, detail="Team not found")

    if user in team.members:
        raise HTTPException(status_code=400, detail="User is already a team member")

    # Check for pending invite
    existing_invite = db.query(DBTeamInvite).filter(
        DBTeamInvite.team_id == team_id,
        DBTeamInvite.invited_user_id == user.id,
        DBTeamInvite.status == "pending"
    ).first()

    if existing_invite:
        raise HTTPException(status_code=400, detail="User already has a pending invite")

    # Create invite
    db_invite = DBTeamInvite(
        team_id=team_id,
        invited_user_id=user.id,
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

    # Check if user is already in a team (prevent multi-team)
    user = db.query(DBUser).filter(DBUser.id == user_id).first()
    if user and len(user.teams) > 0:
        raise HTTPException(status_code=400, detail="You can only be in one team at a time. Leave your current team first.")

    # Add user to team
    team = db.query(DBTeam).filter(DBTeam.id == invite.team_id).first()

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


def create_join_request(db: Session, team_id: str, user_id: str, message: Optional[str] = None) -> DBJoinRequest:
    """Create a join request from a user to a team"""
    # Check if team exists
    team = db.query(DBTeam).filter(DBTeam.id == team_id).first()
    if not team:
        raise HTTPException(status_code=404, detail="Team not found")

    # Check if user exists
    user = db.query(DBUser).filter(DBUser.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Check if user is already a member of this team
    if user in team.members:
        raise HTTPException(status_code=400, detail="You are already a member of this team")

    # Check if user is the owner of this team
    if team.owner_id == user_id:
        raise HTTPException(status_code=400, detail="You are the owner of this team")

    # Check if user is already in another team (member or owner)
    user_teams = db.query(DBTeam).filter(
        (DBTeam.members.contains(user)) | (DBTeam.owner_id == user_id)
    ).all()
    if user_teams:
        raise HTTPException(status_code=400, detail="You are already in another team. Leave your current team first.")

    # Check if team is full
    current_member_count = len(team.members)
    max_members = int(team.max_members) if team.max_members else 5
    if current_member_count >= max_members:
        raise HTTPException(status_code=400, detail="This team is already full")

    # Check for existing pending request to this team
    existing_request = db.query(DBJoinRequest).filter(
        DBJoinRequest.team_id == team_id,
        DBJoinRequest.user_id == user_id,
        DBJoinRequest.status == "pending"
    ).first()

    if existing_request:
        raise HTTPException(status_code=400, detail="You already have a pending request for this team")

    # Check for any pending request to any team
    any_pending_request = db.query(DBJoinRequest).filter(
        DBJoinRequest.user_id == user_id,
        DBJoinRequest.status == "pending"
    ).first()

    if any_pending_request:
        other_team = db.query(DBTeam).filter(DBTeam.id == any_pending_request.team_id).first()
        team_name = other_team.name if other_team else "another team"
        raise HTTPException(status_code=400, detail=f"You already have a pending request to {team_name}. Cancel it first.")

    # Create join request
    join_request = DBJoinRequest(
        team_id=team_id,
        user_id=user_id,
        message=message
    )
    db.add(join_request)
    db.commit()
    db.refresh(join_request)

    return join_request


def get_team_join_requests(db: Session, team_id: str) -> List[DBJoinRequest]:
    """Get all pending join requests for a team"""
    return db.query(DBJoinRequest).filter(
        DBJoinRequest.team_id == team_id,
        DBJoinRequest.status == "pending"
    ).order_by(DBJoinRequest.created_at.desc()).all()


def accept_join_request(db: Session, request_id: str, owner_id: str) -> DBTeam:
    """Accept a join request (owner only)"""
    join_request = db.query(DBJoinRequest).filter(DBJoinRequest.id == request_id).first()

    if not join_request:
        raise HTTPException(status_code=404, detail="Request not found")

    if join_request.status != "pending":
        raise HTTPException(status_code=400, detail="This request has already been processed")

    # Get team and verify ownership
    team = db.query(DBTeam).filter(DBTeam.id == join_request.team_id).first()
    if not team:
        raise HTTPException(status_code=404, detail="Team not found")

    if team.owner_id != owner_id:
        raise HTTPException(status_code=403, detail="Only the owner can accept requests")

    # Get user
    user = db.query(DBUser).filter(DBUser.id == join_request.user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Check if user is already in a team (prevent multi-team)
    if len(user.teams) > 0:
        raise HTTPException(status_code=400, detail="User is already in a team. They must leave it first.")

    # Check if user is already a member (safety check)
    if user in team.members:
        join_request.status = "accepted"
        db.commit()
        return team

    # Check if team is full
    current_member_count = len(team.members)
    max_members = int(team.max_members) if team.max_members else 5
    if current_member_count >= max_members:
        raise HTTPException(status_code=400, detail="Team is full")

    # Add user to team with player role
    team.members.append(user)
    db.execute(
        team_members.update()
        .where(team_members.c.team_id == team.id)
        .where(team_members.c.user_id == user.id)
        .values(role="player")
    )

    # Update request status
    join_request.status = "accepted"
    db.commit()
    db.refresh(team)

    return team


def reject_join_request(db: Session, request_id: str, owner_id: str) -> bool:
    """Reject a join request (owner only)"""
    join_request = db.query(DBJoinRequest).filter(DBJoinRequest.id == request_id).first()

    if not join_request:
        raise HTTPException(status_code=404, detail="Request not found")

    if join_request.status != "pending":
        raise HTTPException(status_code=400, detail="This request has already been processed")

    # Get team and verify ownership
    team = db.query(DBTeam).filter(DBTeam.id == join_request.team_id).first()
    if not team:
        raise HTTPException(status_code=404, detail="Team not found")

    if team.owner_id != owner_id:
        raise HTTPException(status_code=403, detail="Only the owner can reject requests")

    # Update request status
    join_request.status = "rejected"
    db.commit()

    return True
