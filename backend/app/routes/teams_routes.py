"""
Team management endpoints
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database import (
    get_db, User as DBUser, TeamInvite as DBInvite, Scrim as DBScrim,
    team_members as team_members_table
)
from auth import get_current_user
from teams import (
    TeamCreate, TeamUpdate, TeamResponse, InviteCreate, InviteResponse,
    JoinRequestCreate, JoinRequestResponse,
    create_team, get_user_teams, get_team_by_id, get_team_members_with_roles,
    create_team_invite, accept_team_invite, get_user_invites, update_team,
    create_join_request, get_team_join_requests, accept_join_request, reject_join_request
)

router = APIRouter(prefix="/api/teams", tags=["teams"])


@router.get("/all", response_model=list[TeamResponse])
async def get_all_teams(
    current_user: DBUser = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all teams (public listing)"""
    try:
        from database import Team as DBTeam
        teams = db.query(DBTeam).all()
        print(f"[DEBUG] Found {len(teams)} teams in database")
        result = []
        for team in teams:
            print(f"[DEBUG] Processing team: {team.name} (ID: {team.id})")
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
        print(f"[DEBUG] Returning {len(result)} teams")
        return result
    except Exception as e:
        print(f"[ERROR] Failed to get teams: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to get teams: {str(e)}")


@router.post("/create", response_model=TeamResponse)
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


@router.get("/my-teams", response_model=list[TeamResponse])
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


@router.get("/invites", response_model=list[InviteResponse])
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


@router.get("/{team_id}", response_model=TeamResponse)
async def get_team(
    team_id: str,
    current_user: DBUser = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get team details by ID"""
    team = get_team_by_id(db, team_id)
    if not team:
        raise HTTPException(status_code=404, detail="Team not found")

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


@router.put("/{team_id}", response_model=TeamResponse)
async def update_team_endpoint(
    team_id: str,
    team_data: TeamUpdate,
    current_user: DBUser = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update team information (owner only)"""
    team = get_team_by_id(db, team_id)
    if not team:
        raise HTTPException(status_code=404, detail="Team not found")

    if team.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Only team owner can update team information")

    try:
        updated_team = update_team(db, team_id, team_data)
        members = get_team_members_with_roles(db, updated_team.id)
        return TeamResponse(
            id=updated_team.id,
            name=updated_team.name,
            tag=updated_team.tag,
            description=updated_team.description,
            owner_id=updated_team.owner_id,
            created_at=updated_team.created_at,
            team_color=updated_team.team_color,
            max_members=updated_team.max_members,
            member_count=len(members),
            members=members
        )
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to update team: {str(e)}")


@router.delete("/{team_id}")
async def delete_team(
    team_id: str,
    current_user: DBUser = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete a team (owner only)"""
    team = get_team_by_id(db, team_id)
    if not team:
        raise HTTPException(status_code=404, detail="Team not found")

    if team.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Only the team owner can delete the team")

    try:
        db.query(team_members_table).filter(team_members_table.c.team_id == team_id).delete()
        db.query(DBInvite).filter(DBInvite.team_id == team_id).delete()
        db.query(DBScrim).filter(DBScrim.team_id == team_id).delete()
        db.delete(team)
        db.commit()

        return {"message": "Team deleted successfully"}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to delete team: {str(e)}")


@router.post("/{team_id}/leave")
async def leave_team(
    team_id: str,
    current_user: DBUser = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Leave a team (members only, owner cannot leave)"""
    team = get_team_by_id(db, team_id)
    if not team:
        raise HTTPException(status_code=404, detail="Team not found")

    if current_user not in team.members:
        raise HTTPException(status_code=403, detail="Not a team member")

    if team.owner_id == current_user.id:
        raise HTTPException(status_code=403, detail="Team owner cannot leave. Delete the team instead.")

    try:
        db.query(team_members_table).filter(
            team_members_table.c.team_id == team_id,
            team_members_table.c.user_id == current_user.id
        ).delete()
        db.commit()

        return {"message": "Successfully left the team"}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to leave team: {str(e)}")


@router.post("/{team_id}/kick/{user_id}")
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

    if team.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Only the team owner can kick members")

    if user_id == current_user.id:
        raise HTTPException(status_code=400, detail="You cannot kick yourself")

    user_to_kick = db.query(DBUser).filter(DBUser.id == user_id).first()
    if not user_to_kick:
        raise HTTPException(status_code=404, detail="User not found")

    if user_to_kick not in team.members:
        raise HTTPException(status_code=400, detail="User is not a team member")

    try:
        db.query(team_members_table).filter(
            team_members_table.c.team_id == team_id,
            team_members_table.c.user_id == user_id
        ).delete()
        db.commit()

        return {"message": f"{user_to_kick.username} has been kicked from the team"}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to kick member: {str(e)}")


@router.post("/{team_id}/promote/{user_id}")
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

    if team.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Only the team owner can promote members")

    if user_id == current_user.id:
        raise HTTPException(status_code=400, detail="You are already the owner")

    user_to_promote = db.query(DBUser).filter(DBUser.id == user_id).first()
    if not user_to_promote:
        raise HTTPException(status_code=404, detail="User not found")

    if user_to_promote not in team.members:
        raise HTTPException(status_code=400, detail="User is not a team member")

    try:
        team.owner_id = user_id
        db.commit()
        db.refresh(team)

        return {"message": f"{user_to_promote.username} is now the team owner"}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to promote member: {str(e)}")


@router.post("/{team_id}/invite", response_model=InviteResponse)
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


@router.post("/invites/{invite_id}/accept", response_model=TeamResponse)
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


@router.post("/{team_id}/request-join")
async def request_join_team(
    team_id: str,
    request_data: JoinRequestCreate,
    current_user: DBUser = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Request to join a team"""
    try:
        join_request = create_join_request(db, team_id, current_user.id, request_data.message)
        return {"message": "Request sent successfully", "request_id": join_request.id}
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to send request: {str(e)}")


@router.get("/join-requests/mine", response_model=list[JoinRequestResponse])
async def get_my_join_requests(
    current_user: DBUser = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all pending join requests for teams owned by the current user"""
    try:
        from database import JoinRequest as DBJoinRequest, Team as DBTeam

        # Get all teams owned by current user
        owned_teams = db.query(DBTeam).filter(DBTeam.owner_id == current_user.id).all()

        result = []
        for team in owned_teams:
            # Get all pending join requests for this team
            requests = db.query(DBJoinRequest).filter(
                DBJoinRequest.team_id == team.id,
                DBJoinRequest.status == "pending"
            ).all()

            for req in requests:
                user = db.query(DBUser).filter(DBUser.id == req.user_id).first()
                if user:
                    result.append(JoinRequestResponse(
                        id=req.id,
                        team_id=req.team_id,
                        team_name=team.name,
                        user_id=user.id,
                        username=user.username,
                        user_email=user.email,
                        riot_game_name=user.riot_game_name,
                        riot_tag_line=user.riot_tag_line,
                        message=req.message,
                        status=req.status,
                        created_at=req.created_at
                    ))

        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get join requests: {str(e)}")


@router.get("/{team_id}/join-requests", response_model=list[JoinRequestResponse])
async def get_join_requests(
    team_id: str,
    current_user: DBUser = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all pending join requests for a team (owner only)"""
    team = get_team_by_id(db, team_id)
    if not team:
        raise HTTPException(status_code=404, detail="Team not found")

    if team.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Only the owner can view join requests")

    try:
        from database import JoinRequest as DBJoinRequest, User as DBUser
        requests = get_team_join_requests(db, team_id)
        result = []
        for req in requests:
            user = db.query(DBUser).filter(DBUser.id == req.user_id).first()
            if user:
                result.append(JoinRequestResponse(
                    id=req.id,
                    team_id=req.team_id,
                    team_name=team.name,
                    user_id=user.id,
                    username=user.username,
                    user_email=user.email,
                    riot_game_name=user.riot_game_name,
                    riot_tag_line=user.riot_tag_line,
                    message=req.message,
                    status=req.status,
                    created_at=req.created_at
                ))
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to retrieve join requests: {str(e)}")


@router.post("/join-requests/{request_id}/accept", response_model=TeamResponse)
async def accept_join_request_endpoint(
    request_id: str,
    current_user: DBUser = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Accept a join request (owner only)"""
    try:
        team = accept_join_request(db, request_id, current_user.id)
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
        raise HTTPException(status_code=500, detail=f"Failed to accept request: {str(e)}")


@router.post("/join-requests/{request_id}/reject")
async def reject_join_request_endpoint(
    request_id: str,
    current_user: DBUser = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Reject a join request (owner only)"""
    try:
        reject_join_request(db, request_id, current_user.id)
        return {"message": "Request rejected"}
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to reject request: {str(e)}")


@router.delete("/join-requests/{request_id}/cancel")
async def cancel_join_request_endpoint(
    request_id: str,
    current_user: DBUser = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Cancel your own pending join request"""
    from database import JoinRequest as DBJoinRequest

    join_request = db.query(DBJoinRequest).filter(DBJoinRequest.id == request_id).first()

    if not join_request:
        raise HTTPException(status_code=404, detail="Request not found")

    if join_request.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="You can only cancel your own requests")

    if join_request.status != "pending":
        raise HTTPException(status_code=400, detail="Request has already been processed")

    db.delete(join_request)
    db.commit()

    return {"message": "Request cancelled"}
