"""
Database configuration and models
"""
from sqlalchemy import create_engine, Column, String, Boolean, DateTime, JSON, ForeignKey, Table, Integer
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, relationship, backref
from datetime import datetime
import uuid

# SQLite database (easy for dev, switch to PostgreSQL for prod)
import os
from pathlib import Path

# Get the backend directory (parent of app/)
BACKEND_DIR = Path(__file__).resolve().parent.parent
DEFAULT_DB_PATH = BACKEND_DIR / "data" / "openrift.db"

# Ensure data directory exists
DEFAULT_DB_PATH.parent.mkdir(parents=True, exist_ok=True)

SQLALCHEMY_DATABASE_URL = os.getenv("DATABASE_URL", f"sqlite:///{DEFAULT_DB_PATH}")

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
    riot_puuid = Column(String, nullable=True, unique=True, index=True)
    riot_region = Column(String, default="EUW1")
    riot_platform = Column(String, default="EUW1")  # Platform for API calls
    riot_verified = Column(Boolean, default=False)  # Whether Riot account is verified via OAuth

    # Discord integration
    discord = Column(String, nullable=True)
    discord_id = Column(String, nullable=True, unique=True, index=True)
    discord_verified = Column(Boolean, default=False)  # Whether Discord account is verified via OAuth

    # Metadata
    created_at = Column(DateTime, default=datetime.utcnow)
    last_login = Column(DateTime, nullable=True)
    is_active = Column(Boolean, default=True)
    is_verified = Column(Boolean, default=False)
    is_admin = Column(Boolean, default=False)

    # Settings
    favorite_tools = Column(JSON, default=list)
    theme = Column(String, default="dark")

    # Relationships
    analytics = relationship("UserAnalytics", back_populates="user", cascade="all, delete-orphan")
    teams = relationship("Team", secondary=team_members, back_populates="members")
    riot_oauth = relationship("RiotOAuth", back_populates="user", uselist=False, cascade="all, delete-orphan")
    discord_oauth = relationship("DiscordOAuth", back_populates="user", uselist=False, cascade="all, delete-orphan")
    summoner_data = relationship("SummonerData", back_populates="user", uselist=False, cascade="all, delete-orphan")


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
    is_locked = Column(Boolean, default=False)  # Owner can lock team to hide from public listing

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


class JoinRequest(Base):
    """Join request model - user requests to join a team"""
    __tablename__ = "join_requests"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    team_id = Column(String, ForeignKey("teams.id"), nullable=False)
    user_id = Column(String, ForeignKey("users.id"), nullable=False)

    # Request details
    message = Column(String, nullable=True)  # Optional message from user
    status = Column(String, default="pending")  # pending, accepted, rejected

    # Metadata
    created_at = Column(DateTime, default=datetime.utcnow)


class AvailabilitySlot(Base):
    """User availability slot model - flexible time slots for scheduling"""
    __tablename__ = "availability_slots"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    team_id = Column(String, ForeignKey("teams.id"), nullable=True)  # Optional: team-specific availability

    # Time slot (custom precision - can be 17:23 to 19:37, not just 30min blocks)
    start_time = Column(DateTime, nullable=False)  # Full datetime with timezone awareness
    end_time = Column(DateTime, nullable=False)

    # Recurrence
    is_recurring = Column(Boolean, default=False)
    recurrence_pattern = Column(String, nullable=True)  # 'weekly_thursday', 'daily', 'weekly_monday', etc.
    recurrence_end_date = Column(DateTime, nullable=True)  # When to stop recurring

    # Metadata
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    notes = Column(String, nullable=True)


class TeamEvent(Base):
    """Team event model - scrims, training, soloq, meetings"""
    __tablename__ = "team_events"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    team_id = Column(String, ForeignKey("teams.id"), nullable=False)
    created_by_id = Column(String, ForeignKey("users.id"), nullable=False)

    # Event details
    title = Column(String, nullable=False)
    event_type = Column(String, nullable=False)  # 'scrim', 'training', 'soloq', 'meeting'
    start_time = Column(DateTime, nullable=False)
    end_time = Column(DateTime, nullable=False)

    # Recurrence
    is_recurring = Column(Boolean, default=False)
    recurrence_pattern = Column(String, nullable=True)  # 'weekly_thursday', etc.
    recurrence_end_date = Column(DateTime, nullable=True)

    # Optional details
    opponent_name = Column(String, nullable=True)  # For scrims
    notes = Column(String, nullable=True)

    # Metadata
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class RiotOAuth(Base):
    """Riot OAuth tokens model"""
    __tablename__ = "riot_oauth"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, ForeignKey("users.id"), nullable=False, unique=True)

    # OAuth tokens
    access_token = Column(String, nullable=False)
    refresh_token = Column(String, nullable=False)
    token_type = Column(String, default="Bearer")
    expires_at = Column(DateTime, nullable=False)

    # OAuth state for CSRF protection
    state = Column(String, nullable=True)

    # Metadata
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationship
    user = relationship("User", back_populates="riot_oauth")


class DiscordOAuth(Base):
    """Discord OAuth tokens model"""
    __tablename__ = "discord_oauth"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, ForeignKey("users.id"), nullable=False, unique=True)

    # OAuth tokens
    access_token = Column(String, nullable=False)
    refresh_token = Column(String, nullable=False)
    token_type = Column(String, default="Bearer")
    expires_at = Column(DateTime, nullable=False)

    # OAuth state for CSRF protection
    state = Column(String, nullable=True)

    # Discord user info
    discord_id = Column(String, nullable=False)
    discord_username = Column(String, nullable=False)
    discord_discriminator = Column(String, nullable=False)

    # Metadata
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationship
    user = relationship("User", back_populates="discord_oauth")


class SummonerData(Base):
    """Summoner data from Riot API"""
    __tablename__ = "summoner_data"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, ForeignKey("users.id"), nullable=False, unique=True)

    # Summoner info
    summoner_id = Column(String, nullable=False)  # Encrypted summoner ID
    account_id = Column(String, nullable=False)  # Encrypted account ID
    profile_icon_id = Column(String, nullable=False)
    summoner_level = Column(String, nullable=False)

    # Ranked info (RANKED_SOLO_5x5)
    solo_tier = Column(String, nullable=True)  # IRON, BRONZE, SILVER, GOLD, PLATINUM, DIAMOND, MASTER, GRANDMASTER, CHALLENGER
    solo_rank = Column(String, nullable=True)  # I, II, III, IV
    solo_lp = Column(String, nullable=True)  # League Points
    solo_wins = Column(String, nullable=True)
    solo_losses = Column(String, nullable=True)

    # Ranked info (RANKED_FLEX_SR)
    flex_tier = Column(String, nullable=True)
    flex_rank = Column(String, nullable=True)
    flex_lp = Column(String, nullable=True)
    flex_wins = Column(String, nullable=True)
    flex_losses = Column(String, nullable=True)

    # Top 3 champions (stored as JSON)
    top_champions = Column(JSON, nullable=True)  # [{"championId": 157, "championLevel": 7, "championPoints": 123456}, ...]

    # Preferred lane/role
    preferred_lane = Column(String, nullable=True)  # TOP, JUNGLE, MID, BOT, SUPPORT

    # Metadata
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    last_synced = Column(DateTime, default=datetime.utcnow)  # Last time we synced with Riot API

    # Relationship
    user = relationship("User", back_populates="summoner_data")


class Notification(Base):
    """User notification model"""
    __tablename__ = "notifications"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, ForeignKey("users.id"), nullable=False)

    # Notification content
    type = Column(String, nullable=False)  # ticket_response, team_invite, join_request, etc.
    title = Column(String, nullable=False)
    message = Column(String, nullable=False)

    # Reference to related entity
    reference_id = Column(String, nullable=True)  # ticket_id, team_id, etc.
    reference_type = Column(String, nullable=True)  # ticket, team, etc.

    # Status
    is_read = Column(Boolean, default=False)

    # Metadata
    created_at = Column(DateTime, default=datetime.utcnow)


class BugTicket(Base):
    """Bug report ticket model"""
    __tablename__ = "bug_tickets"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, ForeignKey("users.id"), nullable=False)  # Required - tickets must be from logged in users

    # Ticket content
    title = Column(String, nullable=False)
    description = Column(String, nullable=False)
    category = Column(String, default="bug")  # bug, feature, feedback, other

    # Status tracking
    status = Column(String, default="open")  # open, in_progress, resolved, closed
    priority = Column(String, default="normal")  # low, normal, high, critical

    # Admin response
    admin_response = Column(String, nullable=True)
    resolved_by_id = Column(String, ForeignKey("users.id"), nullable=True)
    resolved_at = Column(DateTime, nullable=True)

    # Metadata
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Browser/device info for debugging
    user_agent = Column(String, nullable=True)
    page_url = Column(String, nullable=True)


class ChampionPool(Base):
    """Champion pool for a user - single tier list per user"""
    __tablename__ = "champion_pools"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, ForeignKey("users.id"), nullable=False, unique=True)  # One pool per user

    # Metadata
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships - order by tier priority then by position
    entries = relationship("ChampionPoolEntry", back_populates="pool", cascade="all, delete-orphan", order_by="ChampionPoolEntry.position")


class ChampionPoolEntry(Base):
    """Single champion entry in a pool"""
    __tablename__ = "champion_pool_entries"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    pool_id = Column(String, ForeignKey("champion_pools.id"), nullable=False)

    # Champion info
    champion_id = Column(String, nullable=False)  # Riot champion ID
    champion_name = Column(String, nullable=False)  # Champion name for display

    # Tier ranking
    tier = Column(String, default="B")  # S, A, B, C or custom

    # Position within tier for ordering
    position = Column(Integer, default=0)

    # Optional notes
    notes = Column(String, nullable=True)

    # Metadata
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationship
    pool = relationship("ChampionPool", back_populates="entries")


class Draft(Base):
    """Saved draft composition"""
    __tablename__ = "drafts"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    team_id = Column(String, ForeignKey("teams.id"), nullable=True)  # Optional team association

    # Draft metadata
    name = Column(String, nullable=False)
    blue_team_name = Column(String, default="Blue Team")
    red_team_name = Column(String, default="Red Team")

    # Draft data stored as JSON
    # Format: { blue_picks: [...], red_picks: [...], blue_bans: [...], red_bans: [...] }
    draft_data = Column(JSON, nullable=False)

    # Optional notes
    notes = Column(String, nullable=True)

    # External draft URL (from Prodraft, etc.)
    external_url = Column(String, nullable=True)

    # Metadata
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


# Database initialization
def init_db():
    """Create all tables"""
    Base.metadata.create_all(bind=engine)

def get_db():
    """Dependency to get DB session"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
