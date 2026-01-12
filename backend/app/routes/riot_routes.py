"""
Riot API routes - OAuth and summoner data
"""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from typing import Optional
from pydantic import BaseModel

from database import get_db, User, RiotOAuth, SummonerData
from auth import get_current_user, create_access_token, get_password_hash, ACCESS_TOKEN_EXPIRE_MINUTES
from services.riot_auth import riot_auth_service
from services.riot_api import riot_api_service
import uuid


router = APIRouter(prefix="/api/riot", tags=["riot"])


# Request models
class VerifyRiotAccountRequest(BaseModel):
    game_name: str
    tag_line: str
    platform: str = "EUW1"
    region: str = "europe"


@router.get("/auth/authorize")
async def riot_oauth_authorize(current_user: Optional[User] = Depends(get_current_user)):
    """
    Get the Riot OAuth authorization URL
    Returns the URL to redirect the user to for Riot login
    Can be used with or without being logged in (for login/signup via Riot)
    """
    auth_data = riot_auth_service.get_authorization_url()

    return {
        "authorization_url": auth_data["authorization_url"],
        "state": auth_data["state"]
    }


@router.get("/auth/callback")
async def riot_oauth_callback(
    code: str = Query(..., description="Authorization code from Riot"),
    state: str = Query(..., description="State parameter for CSRF protection"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Handle the OAuth callback from Riot
    Exchange the code for tokens and fetch user data
    """
    try:
        # Step 1: Exchange code for token
        token_data = await riot_auth_service.exchange_code_for_token(code)

        # Step 2: Get user info from Riot
        user_info = await riot_auth_service.get_user_info(token_data["access_token"])

        # Step 3: Store OAuth tokens
        existing_oauth = db.query(RiotOAuth).filter(RiotOAuth.user_id == current_user.id).first()

        expires_at = datetime.utcnow() + timedelta(seconds=token_data.get("expires_in", 3600))

        if existing_oauth:
            # Update existing OAuth record
            existing_oauth.access_token = token_data["access_token"]
            existing_oauth.refresh_token = token_data.get("refresh_token", existing_oauth.refresh_token)
            existing_oauth.expires_at = expires_at
            existing_oauth.state = state
            existing_oauth.updated_at = datetime.utcnow()
        else:
            # Create new OAuth record
            new_oauth = RiotOAuth(
                user_id=current_user.id,
                access_token=token_data["access_token"],
                refresh_token=token_data.get("refresh_token", ""),
                expires_at=expires_at,
                state=state
            )
            db.add(new_oauth)

        # Step 4: Update user's Riot account info
        current_user.riot_puuid = user_info.get("puuid")
        current_user.riot_game_name = user_info.get("game_name")
        current_user.riot_tag_line = user_info.get("tag_line")
        current_user.riot_verified = True

        db.commit()

        # Step 5: Fetch and store summoner data
        await sync_summoner_data(current_user.id, db)

        return {
            "success": True,
            "message": "Riot account successfully linked",
            "riot_account": {
                "game_name": current_user.riot_game_name,
                "tag_line": current_user.riot_tag_line,
                "puuid": current_user.riot_puuid
            }
        }

    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"OAuth callback failed: {str(e)}")


@router.post("/verify")
async def verify_riot_account(
    request: VerifyRiotAccountRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Verify a Riot account exists without OAuth
    Used for manual account verification
    """
    try:
        # Verify the account exists via Riot API
        print(f"🎯 Starting verification for {request.game_name}#{request.tag_line}")
        verification_data = await riot_api_service.verify_summoner_exists(
            game_name=request.game_name,
            tag_line=request.tag_line,
            region=request.region,
            platform=request.platform
        )

        print(f"✅ Verification data received")
        account = verification_data["account"]
        summoner = verification_data["summoner"]
        print(f"📦 Account PUUID: {account.get('puuid')}")
        print(f"📦 Summoner ID: {summoner.get('id')}")

        # Update user's Riot info
        current_user.riot_puuid = account["puuid"]
        current_user.riot_game_name = account["gameName"]
        current_user.riot_tag_line = account["tagLine"]
        current_user.riot_platform = request.platform
        current_user.riot_region = request.region
        current_user.riot_verified = False  # Not OAuth verified, just API verified

        # Store/update summoner data
        existing_summoner = db.query(SummonerData).filter(
            SummonerData.user_id == current_user.id
        ).first()

        # Process ranked info
        solo_rank = None
        flex_rank = None
        for entry in verification_data["ranked"]:
            if entry["queueType"] == "RANKED_SOLO_5x5":
                solo_rank = entry
            elif entry["queueType"] == "RANKED_FLEX_SR":
                flex_rank = entry

        # Auto-detect preferred role from ACTUAL MATCHES (more accurate!)
        print(f"🎯 Detecting role from recent ranked matches...")
        preferred_role = await riot_api_service.detect_preferred_role_from_matches(
            account["puuid"],
            region=request.region,
            platform=request.platform
        )

        # Fallback to champion mastery if no matches found
        if not preferred_role:
            print(f"⚠️ No matches found, falling back to champion mastery detection")
            preferred_role = detect_preferred_role(verification_data["top_champions"])

        summoner_data_dict = {
            "summoner_id": summoner.get("id", ""),
            "account_id": summoner.get("accountId", ""),
            "profile_icon_id": str(summoner.get("profileIconId", 0)),
            "summoner_level": str(summoner.get("summonerLevel", 0)),
            "solo_tier": solo_rank["tier"] if solo_rank else None,
            "solo_rank": solo_rank["rank"] if solo_rank else None,
            "solo_lp": str(solo_rank["leaguePoints"]) if solo_rank else None,
            "solo_wins": str(solo_rank["wins"]) if solo_rank else None,
            "solo_losses": str(solo_rank["losses"]) if solo_rank else None,
            "flex_tier": flex_rank["tier"] if flex_rank else None,
            "flex_rank": flex_rank["rank"] if flex_rank else None,
            "flex_lp": str(flex_rank["leaguePoints"]) if flex_rank else None,
            "flex_wins": str(flex_rank["wins"]) if flex_rank else None,
            "flex_losses": str(flex_rank["losses"]) if flex_rank else None,
            "top_champions": verification_data["top_champions"],
            "preferred_lane": preferred_role,
            "last_synced": datetime.utcnow()
        }

        if existing_summoner:
            for key, value in summoner_data_dict.items():
                setattr(existing_summoner, key, value)
            existing_summoner.updated_at = datetime.utcnow()
        else:
            new_summoner = SummonerData(
                user_id=current_user.id,
                **summoner_data_dict
            )
            db.add(new_summoner)

        db.commit()
        db.refresh(current_user)

        return {
            "success": True,
            "message": "Riot account verified and linked",
            "summoner": summoner_data_dict
        }

    except HTTPException as e:
        db.rollback()
        print(f"❌ HTTPException: {e.detail}")
        raise e
    except Exception as e:
        db.rollback()
        print(f"❌ Exception during verification: {type(e).__name__}: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Verification failed: {str(e)}")


@router.post("/sync")
async def sync_riot_data(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Manually sync summoner data from Riot API
    Refreshes rank, level, top champions, etc.
    """
    if not current_user.riot_puuid:
        raise HTTPException(status_code=400, detail="No Riot account linked")

    try:
        await sync_summoner_data(current_user.id, db)

        return {
            "success": True,
            "message": "Summoner data synced successfully"
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Sync failed: {str(e)}")


@router.get("/summoner")
async def get_summoner_data(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get the current user's summoner data
    """
    summoner = db.query(SummonerData).filter(
        SummonerData.user_id == current_user.id
    ).first()

    if not summoner:
        return {
            "summoner": None,
            "riot_account": {
                "game_name": current_user.riot_game_name,
                "tag_line": current_user.riot_tag_line,
                "verified": current_user.riot_verified
            }
        }

    return {
        "summoner": {
            "profile_icon_id": summoner.profile_icon_id,
            "summoner_level": summoner.summoner_level,
            "solo_tier": summoner.solo_tier,
            "solo_rank": summoner.solo_rank,
            "solo_lp": summoner.solo_lp,
            "solo_wins": summoner.solo_wins,
            "solo_losses": summoner.solo_losses,
            "flex_tier": summoner.flex_tier,
            "flex_rank": summoner.flex_rank,
            "top_champions": summoner.top_champions,
            "preferred_lane": summoner.preferred_lane,
            "last_synced": summoner.last_synced
        },
        "riot_account": {
            "game_name": current_user.riot_game_name,
            "tag_line": current_user.riot_tag_line,
            "verified": current_user.riot_verified
        }
    }


@router.post("/summoner/update-lane")
async def update_preferred_lane(
    lane: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Update the user's preferred lane/role
    """
    valid_lanes = ["TOP", "JUNGLE", "MID", "BOT", "SUPPORT"]

    if lane not in valid_lanes:
        raise HTTPException(status_code=400, detail=f"Invalid lane. Must be one of: {valid_lanes}")

    summoner = db.query(SummonerData).filter(
        SummonerData.user_id == current_user.id
    ).first()

    if not summoner:
        raise HTTPException(status_code=404, detail="No summoner data found")

    summoner.preferred_lane = lane
    summoner.updated_at = datetime.utcnow()

    db.commit()

    return {
        "success": True,
        "message": "Preferred lane updated",
        "preferred_lane": lane
    }


# Helper function to detect most played role from champion mastery
def detect_preferred_role(top_champions: list) -> Optional[str]:
    """
    Detect the most played role based on champion mastery
    Returns the role with highest total mastery points
    """
    # Simplified champion to primary role mapping (based on common roles)
    champion_roles = {
        # Top laners
        1: "TOP", 2: "TOP", 6: "TOP", 14: "TOP", 23: "TOP", 24: "TOP", 31: "TOP",
        36: "TOP", 48: "TOP", 54: "TOP", 58: "TOP", 75: "TOP", 78: "TOP", 79: "TOP",
        80: "TOP", 82: "TOP", 85: "TOP", 86: "TOP", 92: "TOP", 98: "TOP", 106: "TOP",
        114: "TOP", 122: "TOP", 126: "TOP", 150: "TOP", 164: "TOP", 240: "TOP",
        266: "TOP", 420: "TOP", 516: "TOP", 875: "TOP", 897: "TOP",
        # Junglers
        5: "JUNGLE", 9: "JUNGLE", 11: "JUNGLE", 19: "JUNGLE", 28: "JUNGLE", 32: "JUNGLE",
        33: "JUNGLE", 56: "JUNGLE", 57: "JUNGLE", 59: "JUNGLE", 60: "JUNGLE", 62: "JUNGLE",
        64: "JUNGLE", 72: "JUNGLE", 76: "JUNGLE", 77: "JUNGLE", 102: "JUNGLE", 104: "JUNGLE",
        107: "JUNGLE", 113: "JUNGLE", 120: "JUNGLE", 121: "JUNGLE", 127: "JUNGLE", 131: "JUNGLE",
        141: "JUNGLE", 154: "JUNGLE", 200: "JUNGLE", 203: "JUNGLE", 234: "JUNGLE", 427: "JUNGLE",
        421: "JUNGLE", 876: "JUNGLE", 887: "JUNGLE", 950: "JUNGLE",
        # Mid laners
        3: "MID", 4: "MID", 7: "MID", 8: "MID", 13: "MID", 34: "MID", 38: "MID",
        43: "MID", 45: "MID", 50: "MID", 55: "MID", 61: "MID", 63: "MID", 68: "MID",
        69: "MID", 84: "MID", 90: "MID", 91: "MID", 99: "MID", 101: "MID", 103: "MID",
        105: "MID", 112: "MID", 115: "MID", 117: "MID", 127: "MID", 134: "MID",
        136: "MID", 142: "MID", 157: "MID", 161: "MID", 163: "MID", 238: "MID",
        245: "MID", 246: "MID", 268: "MID", 517: "MID", 518: "MID", 777: "MID",
        910: "MID",
        # ADC (Bot)
        15: "BOT", 18: "BOT", 21: "BOT", 22: "BOT", 29: "BOT", 40: "BOT", 42: "BOT",
        51: "BOT", 67: "BOT", 81: "BOT", 96: "BOT", 110: "BOT", 119: "BOT", 145: "BOT",
        202: "BOT", 222: "BOT", 236: "BOT", 221: "BOT", 360: "BOT", 429: "BOT",
        498: "BOT", 523: "BOT", 895: "BOT", 901: "BOT",
        # Support
        12: "SUPPORT", 16: "SUPPORT", 25: "SUPPORT", 26: "SUPPORT", 37: "SUPPORT",
        40: "SUPPORT", 44: "SUPPORT", 53: "SUPPORT", 89: "SUPPORT", 111: "SUPPORT",
        143: "SUPPORT", 147: "SUPPORT", 201: "SUPPORT", 223: "SUPPORT", 235: "SUPPORT",
        254: "SUPPORT", 267: "SUPPORT", 350: "SUPPORT", 412: "SUPPORT", 432: "SUPPORT",
        497: "SUPPORT", 526: "SUPPORT", 555: "SUPPORT", 888: "SUPPORT", 902: "SUPPORT",
    }

    if not top_champions:
        return None

    # Count mastery points by role
    role_points = {}
    for champ in top_champions:
        champ_id = champ.get("championId")
        points = champ.get("championPoints", 0)
        role = champion_roles.get(champ_id, "MID")  # Default to MID if unknown

        if role not in role_points:
            role_points[role] = 0
        role_points[role] += points

    # Return role with most mastery points
    if role_points:
        return max(role_points, key=role_points.get)
    return None


# Helper function
async def sync_summoner_data(user_id: str, db: Session):
    """
    Helper function to sync summoner data from Riot API
    """
    user = db.query(User).filter(User.id == user_id).first()

    if not user or not user.riot_puuid:
        raise HTTPException(status_code=400, detail="No Riot account linked")

    # Fetch fresh data from Riot API
    summoner = await riot_api_service.get_summoner_by_puuid(
        user.riot_puuid,
        user.riot_platform or "EUW1"
    )

    # Get ranked info using PUUID (new method)
    ranked_info = await riot_api_service.get_league_entries_by_puuid(
        user.riot_puuid,
        user.riot_platform or "EUW1"
    )

    top_champions = await riot_api_service.get_champion_mastery(
        user.riot_puuid,
        user.riot_platform or "EUW1",
        top=3
    )

    # Process ranked info
    solo_rank = None
    flex_rank = None
    for entry in ranked_info:
        if entry["queueType"] == "RANKED_SOLO_5x5":
            solo_rank = entry
        elif entry["queueType"] == "RANKED_FLEX_SR":
            flex_rank = entry

    # Detect region from platform
    platform_to_region = {
        "EUW1": "europe", "EUN1": "europe", "TR1": "europe", "RU": "europe",
        "NA1": "americas", "BR1": "americas", "LA1": "americas", "LA2": "americas",
        "KR": "asia", "JP1": "asia",
        "OC1": "sea", "PH2": "sea", "SG2": "sea", "TH2": "sea", "TW2": "sea", "VN2": "sea"
    }
    region = platform_to_region.get(user.riot_platform or "EUW1", "europe")

    # Auto-detect preferred role from ACTUAL MATCHES (more accurate!)
    print(f"🎯 Detecting role from recent ranked matches...")
    preferred_role = await riot_api_service.detect_preferred_role_from_matches(
        user.riot_puuid,
        region=region,
        platform=user.riot_platform or "EUW1"
    )

    # Fallback to champion mastery if no matches found
    if not preferred_role:
        print(f"⚠️ No matches found, falling back to champion mastery detection")
        preferred_role = detect_preferred_role(top_champions)

    # Update or create summoner data
    existing_summoner = db.query(SummonerData).filter(
        SummonerData.user_id == user_id
    ).first()

    summoner_data_dict = {
        "summoner_id": summoner.get("id", ""),
        "account_id": summoner.get("accountId", ""),
        "profile_icon_id": str(summoner.get("profileIconId", 0)),
        "summoner_level": str(summoner.get("summonerLevel", 0)),
        "solo_tier": solo_rank["tier"] if solo_rank else None,
        "solo_rank": solo_rank["rank"] if solo_rank else None,
        "solo_lp": str(solo_rank["leaguePoints"]) if solo_rank else None,
        "solo_wins": str(solo_rank["wins"]) if solo_rank else None,
        "solo_losses": str(solo_rank["losses"]) if solo_rank else None,
        "flex_tier": flex_rank["tier"] if flex_rank else None,
        "flex_rank": flex_rank["rank"] if flex_rank else None,
        "flex_lp": str(flex_rank["leaguePoints"]) if flex_rank else None,
        "flex_wins": str(flex_rank["wins"]) if flex_rank else None,
        "flex_losses": str(flex_rank["losses"]) if flex_rank else None,
        "top_champions": top_champions,
        "preferred_lane": preferred_role,
        "last_synced": datetime.utcnow()
    }

    if existing_summoner:
        for key, value in summoner_data_dict.items():
            setattr(existing_summoner, key, value)
        existing_summoner.updated_at = datetime.utcnow()
    else:
        new_summoner = SummonerData(
            user_id=user_id,
            **summoner_data_dict
        )
        db.add(new_summoner)

    db.commit()
