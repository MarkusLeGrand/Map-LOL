"""
Discord API routes - OAuth authentication
"""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from typing import Optional
import random

from database import get_db, User, DiscordOAuth
from auth import get_current_user, create_access_token, ACCESS_TOKEN_EXPIRE_MINUTES
from services.discord_auth import discord_auth_service


router = APIRouter(prefix="/api/discord", tags=["discord"])


@router.get("/auth/authorize")
async def discord_oauth_authorize(current_user: Optional[User] = Depends(get_current_user)):
    """
    Get the Discord OAuth authorization URL
    Returns the URL to redirect the user to for Discord login
    Can be used with or without being logged in (for login/signup via Discord)
    """
    auth_data = discord_auth_service.get_authorization_url()

    return {
        "authorization_url": auth_data["authorization_url"],
        "state": auth_data["state"]
    }


@router.get("/auth/callback")
async def discord_oauth_callback(
    code: str = Query(..., description="Authorization code from Discord"),
    state: str = Query(..., description="State parameter for CSRF protection"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Handle the OAuth callback from Discord
    Exchange the code for tokens and fetch user data
    """
    try:
        # Step 1: Exchange code for token
        token_data = await discord_auth_service.exchange_code_for_token(code)

        # Step 2: Get user info from Discord
        user_info = await discord_auth_service.get_user_info(token_data["access_token"])

        # Step 3: Store OAuth tokens
        existing_oauth = db.query(DiscordOAuth).filter(DiscordOAuth.user_id == current_user.id).first()

        expires_at = datetime.utcnow() + timedelta(seconds=token_data.get("expires_in", 604800))

        # Format Discord tag (username only, as discriminator is being phased out)
        discord_username = user_info.get("username", "")
        discord_id = user_info.get("id", "")
        discord_discriminator = user_info.get("discriminator", "0")

        # New Discord usernames don't have discriminators (or have "0")
        if discord_discriminator == "0":
            discord_tag = discord_username
        else:
            discord_tag = f"{discord_username}#{discord_discriminator}"

        if existing_oauth:
            # Update existing OAuth record
            existing_oauth.access_token = token_data["access_token"]
            existing_oauth.refresh_token = token_data.get("refresh_token", existing_oauth.refresh_token)
            existing_oauth.expires_at = expires_at
            existing_oauth.state = state
            existing_oauth.discord_id = discord_id
            existing_oauth.discord_username = discord_username
            existing_oauth.discord_discriminator = discord_discriminator
            existing_oauth.updated_at = datetime.utcnow()
        else:
            # Create new OAuth record
            new_oauth = DiscordOAuth(
                user_id=current_user.id,
                access_token=token_data["access_token"],
                refresh_token=token_data.get("refresh_token", ""),
                expires_at=expires_at,
                state=state,
                discord_id=discord_id,
                discord_username=discord_username,
                discord_discriminator=discord_discriminator
            )
            db.add(new_oauth)

        # Step 4: Update user's Discord info
        current_user.discord = discord_tag
        current_user.discord_id = discord_id
        current_user.discord_verified = True

        db.commit()

        return {
            "success": True,
            "message": "Discord account successfully linked",
            "discord": {
                "username": discord_username,
                "tag": discord_tag,
                "id": discord_id
            }
        }

    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"OAuth callback failed: {str(e)}")


@router.post("/unlink")
async def unlink_discord(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Unlink Discord account from user
    """
    try:
        # Check if user has a password - if not, they can't unlink Discord (it's their only login method)
        if not current_user.hashed_password or current_user.hashed_password == "":
            raise HTTPException(
                status_code=400,
                detail="Cannot unlink Discord: you must set a password first. Discord is your only login method."
            )

        # Remove OAuth tokens
        existing_oauth = db.query(DiscordOAuth).filter(DiscordOAuth.user_id == current_user.id).first()
        if existing_oauth:
            db.delete(existing_oauth)

        # Clear Discord info from user
        current_user.discord = None
        current_user.discord_id = None
        current_user.discord_verified = False

        db.commit()

        return {
            "success": True,
            "message": "Discord account unlinked successfully"
        }

    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to unlink Discord: {str(e)}")


@router.get("/status")
async def get_discord_status(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get the current user's Discord connection status
    """
    return {
        "connected": current_user.discord is not None,
        "verified": current_user.discord_verified,
        "discord_tag": current_user.discord,
        "discord_id": current_user.discord_id
    }


@router.get("/login/authorize")
async def discord_login_authorize():
    """
    Get the Discord OAuth authorization URL for login/signup
    This endpoint doesn't require authentication
    """
    auth_data = discord_auth_service.get_authorization_url(use_login_redirect=True)

    return {
        "authorization_url": auth_data["authorization_url"],
        "state": auth_data["state"]
    }


@router.get("/login/callback")
async def discord_login_callback(
    code: str = Query(..., description="Authorization code from Discord"),
    state: str = Query(..., description="State parameter for CSRF protection"),
    db: Session = Depends(get_db)
):
    """
    Handle the OAuth callback from Discord for login/signup
    If user exists with this Discord ID, log them in
    If user doesn't exist, create a new account
    """
    try:
        # Step 1: Exchange code for token
        token_data = await discord_auth_service.exchange_code_for_token(code, use_login_redirect=True)

        # Step 2: Get user info from Discord
        user_info = await discord_auth_service.get_user_info(token_data["access_token"])

        # Extract Discord info
        discord_username = user_info.get("username", "")  # Unique handle (e.g., omotesanto444)
        discord_global_name = user_info.get("global_name", "")  # Display name (e.g., Ryzeri)
        discord_id = user_info.get("id", "")
        discord_discriminator = user_info.get("discriminator", "0")
        discord_email = user_info.get("email")

        if not discord_id:
            raise HTTPException(status_code=400, detail="Failed to get Discord ID")

        # Format Discord tag - use the unique username handle
        if discord_discriminator == "0":
            discord_tag = discord_username
        else:
            discord_tag = f"{discord_username}#{discord_discriminator}"

        # Step 3: Check if user already exists with this Discord ID
        existing_user = db.query(User).filter(User.discord_id == discord_id).first()

        if existing_user:
            # User exists - log them in
            user = existing_user

            # Update Discord info in case it changed
            user.discord = discord_tag
            user.discord_verified = True

            # Update OAuth tokens
            existing_oauth = db.query(DiscordOAuth).filter(DiscordOAuth.user_id == user.id).first()
            expires_at = datetime.utcnow() + timedelta(seconds=token_data.get("expires_in", 604800))

            if existing_oauth:
                existing_oauth.access_token = token_data["access_token"]
                existing_oauth.refresh_token = token_data.get("refresh_token", existing_oauth.refresh_token)
                existing_oauth.expires_at = expires_at
                existing_oauth.state = state
                existing_oauth.discord_username = discord_username
                existing_oauth.discord_discriminator = discord_discriminator
                existing_oauth.updated_at = datetime.utcnow()
            else:
                new_oauth = DiscordOAuth(
                    user_id=user.id,
                    access_token=token_data["access_token"],
                    refresh_token=token_data.get("refresh_token", ""),
                    expires_at=expires_at,
                    state=state,
                    discord_id=discord_id,
                    discord_username=discord_username,
                    discord_discriminator=discord_discriminator
                )
                db.add(new_oauth)

            # Update last login
            user.last_login = datetime.utcnow()
            db.commit()

            # Create access token
            access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
            access_token = create_access_token(
                data={"sub": user.email}, expires_delta=access_token_expires
            )

            return {
                "access_token": access_token,
                "token_type": "bearer",
                "user": {
                    "id": user.id,
                    "email": user.email,
                    "username": user.username,
                    "discord": user.discord,
                    "discord_id": user.discord_id,
                    "discord_verified": user.discord_verified
                },
                "is_new_user": False
            }

        else:
            # User doesn't exist - create new account
            if not discord_email:
                raise HTTPException(
                    status_code=400,
                    detail="Discord email not provided. Please ensure your Discord account has a verified email."
                )

            # Check if email is already used
            existing_email_user = db.query(User).filter(User.email == discord_email).first()
            if existing_email_user:
                # MERGE ACCOUNTS: Link Discord to existing account
                user = existing_email_user
                user.discord = discord_tag
                user.discord_id = discord_id
                user.discord_verified = True

                # Create OAuth tokens
                expires_at = datetime.utcnow() + timedelta(seconds=token_data.get("expires_in", 604800))
                new_oauth = DiscordOAuth(
                    user_id=user.id,
                    access_token=token_data["access_token"],
                    refresh_token=token_data.get("refresh_token", ""),
                    expires_at=expires_at,
                    state=state,
                    discord_id=discord_id,
                    discord_username=discord_username,
                    discord_discriminator=discord_discriminator
                )
                db.add(new_oauth)

                # Update last login
                user.last_login = datetime.utcnow()
                db.commit()

                # Create access token
                access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
                access_token = create_access_token(
                    data={"sub": user.email}, expires_delta=access_token_expires
                )

                return {
                    "access_token": access_token,
                    "token_type": "bearer",
                    "user": {
                        "id": user.id,
                        "email": user.email,
                        "username": user.username,
                        "discord": user.discord,
                        "discord_id": user.discord_id,
                        "discord_verified": user.discord_verified
                    },
                    "is_new_user": False,
                    "account_merged": True
                }

            # Check if username is already taken - add random suffix if needed
            # Use Discord display name (global_name) for OpenRift username, fallback to unique username
            base_username = discord_global_name if discord_global_name else discord_username
            username_to_use = base_username
            attempts = 0
            while db.query(User).filter(User.username == username_to_use).first() and attempts < 10:
                suffix = random.randint(1000, 9999)
                username_to_use = f"{base_username}_{suffix}"
                attempts += 1

            # If still taken after 10 attempts, use Discord ID
            if db.query(User).filter(User.username == username_to_use).first():
                username_to_use = f"discord_{discord_id[:8]}"

            # Create new user
            new_user = User(
                email=discord_email,
                username=username_to_use,
                hashed_password="",  # No password for Discord-only accounts
                discord=discord_tag,
                discord_id=discord_id,
                discord_verified=True
            )
            db.add(new_user)
            db.flush()  # Get the user ID

            # Create OAuth record
            expires_at = datetime.utcnow() + timedelta(seconds=token_data.get("expires_in", 604800))
            new_oauth = DiscordOAuth(
                user_id=new_user.id,
                access_token=token_data["access_token"],
                refresh_token=token_data.get("refresh_token", ""),
                expires_at=expires_at,
                state=state,
                discord_id=discord_id,
                discord_username=discord_username,
                discord_discriminator=discord_discriminator
            )
            db.add(new_oauth)

            db.commit()
            db.refresh(new_user)

            # Create access token
            access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
            access_token = create_access_token(
                data={"sub": new_user.email}, expires_delta=access_token_expires
            )

            return {
                "access_token": access_token,
                "token_type": "bearer",
                "user": {
                    "id": new_user.id,
                    "email": new_user.email,
                    "username": new_user.username,
                    "discord": new_user.discord,
                    "discord_id": new_user.discord_id,
                    "discord_verified": new_user.discord_verified
                },
                "is_new_user": True
            }

    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Discord login failed: {str(e)}")
