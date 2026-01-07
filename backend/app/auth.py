"""
Authentication utilities - JWT, password hashing, etc.
"""
from datetime import datetime, timedelta
from typing import Optional
from jose import JWTError, jwt
import bcrypt
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from pydantic import BaseModel, EmailStr

from database import get_db, User
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Security config
SECRET_KEY = os.getenv("SECRET_KEY", "fallback-key-for-dev-only-change-this")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24  # 24 hours

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/auth/login")


# Pydantic models
class UserCreate(BaseModel):
    email: EmailStr
    username: str
    password: str
    riot_game_name: Optional[str] = None
    riot_tag_line: Optional[str] = None
    discord: Optional[str] = None


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class Token(BaseModel):
    access_token: str
    token_type: str


class TokenData(BaseModel):
    email: Optional[str] = None


class UserResponse(BaseModel):
    id: str
    email: str
    username: str
    riot_game_name: Optional[str]
    riot_tag_line: Optional[str]
    discord: Optional[str]
    created_at: datetime
    favorite_tools: list
    theme: str
    is_admin: bool

    class Config:
        from_attributes = True


# Password utilities
def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a password against a hash"""
    # Truncate password to 72 bytes for bcrypt
    password_bytes = plain_password.encode('utf-8')
    if len(password_bytes) > 72:
        password_bytes = password_bytes[:72]

    return bcrypt.checkpw(password_bytes, hashed_password.encode('utf-8'))


def get_password_hash(password: str) -> str:
    """Hash a password (bcrypt limit: 72 bytes)"""
    # Truncate password to 72 bytes for bcrypt
    password_bytes = password.encode('utf-8')
    if len(password_bytes) > 72:
        password_bytes = password_bytes[:72]

    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(password_bytes, salt)
    return hashed.decode('utf-8')


# JWT utilities
def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    """Create a JWT access token"""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)

    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


def verify_token(token: str) -> TokenData:
    """Verify and decode a JWT token"""
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Could not validate credentials"
            )
        return TokenData(email=email)
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials"
        )


# User utilities
def get_user_by_email(db: Session, email: str) -> Optional[User]:
    """Get user by email"""
    return db.query(User).filter(User.email == email).first()


def get_user_by_username(db: Session, username: str) -> Optional[User]:
    """Get user by username"""
    return db.query(User).filter(User.username == username).first()


def authenticate_user(db: Session, email_or_username: str, password: str) -> Optional[User]:
    """Authenticate a user with email OR username"""
    # Try to find user by email first
    user = get_user_by_email(db, email_or_username)

    # If not found by email, try username
    if not user:
        user = get_user_by_username(db, email_or_username)

    # If still not found, authentication failed
    if not user:
        return None

    # Verify password
    if not verify_password(password, user.hashed_password):
        return None

    return user


def create_user(db: Session, user_data: UserCreate) -> User:
    """Create a new user"""
    # Check if user exists
    if get_user_by_email(db, user_data.email):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )

    if get_user_by_username(db, user_data.username):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username already taken"
        )

    # Create user
    hashed_password = get_password_hash(user_data.password)
    db_user = User(
        email=user_data.email,
        username=user_data.username,
        hashed_password=hashed_password,
        riot_game_name=user_data.riot_game_name,
        riot_tag_line=user_data.riot_tag_line,
        discord=user_data.discord,
    )

    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user


async def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
) -> User:
    """Get current authenticated user"""
    token_data = verify_token(token)
    user = get_user_by_email(db, email=token_data.email)

    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials"
        )

    return user
