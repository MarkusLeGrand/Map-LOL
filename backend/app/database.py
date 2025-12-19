"""
Database configuration and models
"""
from sqlalchemy import create_engine, Column, String, Boolean, DateTime, JSON, ForeignKey, Table
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, relationship
from datetime import datetime
import uuid

# SQLite database (easy for dev, switch to PostgreSQL for prod)
SQLALCHEMY_DATABASE_URL = "sqlite:///./leaguehub.db"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False}  # Only for SQLite
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


# Association table for team members (many-to-many)
team_members = Table(
    'team_members',
    Base.metadata,
    Column('team_id', String, ForeignKey('teams.id'), primary_key=True),
    Column('user_id', String, ForeignKey('users.id'), primary_key=True),
    Column('role', String, default='player'),  # owner, coach, player, analyst
    Column('joined_at', DateTime, default=datetime.utcnow)
)


# Database Models
class User(Base):
    """User account model"""
    __tablename__ = "users"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    email = Column(String, unique=True, index=True, nullable=False)
    username = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)

    # Riot integration
    riot_game_name = Column(String, nullable=True)
    riot_tag_line = Column(String, nullable=True)
    riot_puuid = Column(String, nullable=True)
    riot_region = Column(String, default="EUW1")

    # Metadata
    created_at = Column(DateTime, default=datetime.utcnow)
    last_login = Column(DateTime, nullable=True)
    is_active = Column(Boolean, default=True)
    is_verified = Column(Boolean, default=False)

    # Settings
    favorite_tools = Column(JSON, default=list)
    theme = Column(String, default="dark")

    # Relationships
    analytics = relationship("UserAnalytics", back_populates="user", cascade="all, delete-orphan")
    teams = relationship("Team", secondary=team_members, back_populates="members")


class UserAnalytics(Base):
    """User's saved analytics data"""
    __tablename__ = "user_analytics"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, ForeignKey("users.id"), nullable=False)

    # Analytics metadata
    name = Column(String, nullable=False)  # User-defined name for this analysis
    uploaded_at = Column(DateTime, default=datetime.utcnow)
    file_name = Column(String)
    players_count = Column(String)

    # Stored data path
    data_path = Column(String, nullable=False)

    # Analysis results (cached)
    analysis_results = Column(JSON, nullable=True)

    # Relationship
    user = relationship("User", back_populates="analytics")


class Team(Base):
    """Team model"""
    __tablename__ = "teams"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String, unique=True, index=True, nullable=False)
    tag = Column(String, unique=True, nullable=True)  # Team tag (e.g., "G2", "T1")
    description = Column(String, nullable=True)

    # Owner
    owner_id = Column(String, ForeignKey("users.id"), nullable=False)

    # Metadata
    created_at = Column(DateTime, default=datetime.utcnow)
    is_active = Column(Boolean, default=True)

    # Settings
    team_color = Column(String, default="#3D7A5F")
    max_members = Column(String, default="10")

    # Relationships
    members = relationship("User", secondary=team_members, back_populates="teams")
    scrims = relationship("Scrim", back_populates="team", cascade="all, delete-orphan")
    analytics = relationship("TeamAnalytics", back_populates="team", cascade="all, delete-orphan")


class Scrim(Base):
    """Scrim/Practice session model"""
    __tablename__ = "scrims"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    team_id = Column(String, ForeignKey("teams.id"), nullable=False)

    # Scrim details
    opponent_name = Column(String, nullable=False)
    scheduled_at = Column(DateTime, nullable=False)
    duration_minutes = Column(String, default="60")
    notes = Column(String, nullable=True)

    # Status
    status = Column(String, default="scheduled")  # scheduled, completed, cancelled
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationship
    team = relationship("Team", back_populates="scrims")


class TeamAnalytics(Base):
    """Team's saved analytics data"""
    __tablename__ = "team_analytics"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    team_id = Column(String, ForeignKey("teams.id"), nullable=False)
    created_by_id = Column(String, ForeignKey("users.id"), nullable=False)

    # Analytics metadata
    name = Column(String, nullable=False)  # User-defined name for this analysis
    uploaded_at = Column(DateTime, default=datetime.utcnow)
    file_name = Column(String)
    players_count = Column(String)

    # Stored data path
    data_path = Column(String, nullable=False)

    # Analysis results (cached)
    analysis_results = Column(JSON, nullable=True)

    # Relationship
    team = relationship("Team", back_populates="analytics")


class TeamInvite(Base):
    """Team invitation model"""
    __tablename__ = "team_invites"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    team_id = Column(String, ForeignKey("teams.id"), nullable=False)
    invited_user_id = Column(String, ForeignKey("users.id"), nullable=False)
    invited_by_id = Column(String, ForeignKey("users.id"), nullable=False)

    # Invite details
    role = Column(String, default="player")  # owner, coach, player, analyst
    status = Column(String, default="pending")  # pending, accepted, declined

    # Metadata
    created_at = Column(DateTime, default=datetime.utcnow)
    expires_at = Column(DateTime, nullable=True)


# Database initialization
def init_db():
    """Create all tables"""
    Base.metadata.create_all(bind=engine)
    print("Database initialized successfully!")


def get_db():
    """Dependency to get DB session"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
