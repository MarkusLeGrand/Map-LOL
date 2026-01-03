"""
Authentication and user profile endpoints
"""
from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from pydantic import BaseModel
from datetime import datetime, timedelta
from typing import Optional

from database import get_db, User as DBUser
from auth import (
    UserCreate, UserResponse, Token,
    create_user, authenticate_user, create_access_token,
    get_current_user, ACCESS_TOKEN_EXPIRE_MINUTES,
    verify_password, get_password_hash,
    get_user_by_email, get_user_by_username
)

router = APIRouter(prefix="/api/auth", tags=["auth"])


# ==================== PYDANTIC SCHEMAS ====================

class RiotAccountUpdate(BaseModel):
    riot_game_name: Optional[str] = None
    riot_tag_line: Optional[str] = None


class FavoriteToolsUpdate(BaseModel):
    favorite_tools: list[str]


class ProfileUpdate(BaseModel):
    username: Optional[str] = None
    email: Optional[str] = None


class PasswordChange(BaseModel):
    current_password: str
    new_password: str


# ==================== ENDPOINTS ====================

@router.post("/register", response_model=UserResponse)
async def register(request: Request, user_data: UserCreate, db: Session = Depends(get_db)):
    """Register a new user (rate limited: 5 per minute)"""
    try:
        user = create_user(db, user_data)
        return user
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Registration failed: {str(e)}")


@router.post("/login", response_model=Token)
async def login(request: Request, form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    """Login with email/username and password (rate limited: 5 per minute)"""
    user = authenticate_user(db, form_data.username, form_data.password)

    if not user:
        raise HTTPException(
            status_code=401,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Update last login
    user.last_login = datetime.utcnow()
    db.commit()

    # Create access token
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.email}, expires_delta=access_token_expires
    )

    return {"access_token": access_token, "token_type": "bearer"}


@router.get("/me", response_model=UserResponse)
async def get_me(current_user: DBUser = Depends(get_current_user)):
    """Get current user info"""
    return current_user


@router.put("/me", response_model=UserResponse)
async def update_me(
    data: RiotAccountUpdate,
    current_user: DBUser = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update Riot account information"""
    if data.riot_game_name is not None:
        current_user.riot_game_name = data.riot_game_name
    if data.riot_tag_line is not None:
        current_user.riot_tag_line = data.riot_tag_line

    db.commit()
    db.refresh(current_user)

    return current_user


@router.put("/favorite-tools", response_model=UserResponse)
async def update_favorite_tools(
    data: FavoriteToolsUpdate,
    current_user: DBUser = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update user's favorite tools"""
    current_user.favorite_tools = data.favorite_tools
    db.commit()
    db.refresh(current_user)
    return current_user


@router.put("/profile", response_model=UserResponse)
async def update_profile(
    data: ProfileUpdate,
    current_user: DBUser = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update user profile (username and/or email)"""
    # Check if username is taken by another user
    if data.username is not None and data.username != current_user.username:
        existing_user = get_user_by_username(db, data.username)
        if existing_user and existing_user.id != current_user.id:
            raise HTTPException(
                status_code=400,
                detail="Username already taken"
            )
        current_user.username = data.username

    # Check if email is taken by another user
    if data.email is not None and data.email != current_user.email:
        existing_user = get_user_by_email(db, data.email)
        if existing_user and existing_user.id != current_user.id:
            raise HTTPException(
                status_code=400,
                detail="Email already registered"
            )
        current_user.email = data.email

    db.commit()
    db.refresh(current_user)
    return current_user


@router.put("/password")
async def change_password(
    data: PasswordChange,
    current_user: DBUser = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Change user password"""
    # Verify current password
    if not verify_password(data.current_password, current_user.hashed_password):
        raise HTTPException(
            status_code=400,
            detail="Current password is incorrect"
        )

    # Hash and update new password
    current_user.hashed_password = get_password_hash(data.new_password)
    db.commit()

    return {"message": "Password changed successfully"}
