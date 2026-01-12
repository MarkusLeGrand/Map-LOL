"""
Background task scheduler for automatic data syncing
"""
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.interval import IntervalTrigger
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from typing import Optional
import logging

from app.database import User, SessionLocal
from app.services.riot_api import riot_api_service

logger = logging.getLogger(__name__)

scheduler: Optional[AsyncIOScheduler] = None


async def auto_sync_stale_data():
    """
    Automatically sync summoner data for users whose data is older than 48 hours
    """
    db: Session = SessionLocal()
    try:
        # Get all users with verified Riot accounts
        users = db.query(User).filter(
            User.riot_puuid.isnot(None),
            User.riot_platform.isnot(None)
        ).all()

        now = datetime.utcnow()
        synced_count = 0

        for user in users:
            # Skip if no last_synced or if synced within last 48 hours
            if user.last_synced:
                hours_since_sync = (now - user.last_synced).total_seconds() / 3600
                if hours_since_sync < 48:
                    continue

            try:
                logger.info(f"Auto-syncing data for user {user.username} (ID: {user.id})")

                # Detect region from platform
                platform_to_region = {
                    "EUW1": "europe", "EUN1": "europe", "TR1": "europe", "RU": "europe",
                    "NA1": "americas", "BR1": "americas", "LA1": "americas", "LA2": "americas",
                    "KR": "asia", "JP1": "asia",
                    "OC1": "sea", "PH2": "sea", "SG2": "sea", "TH2": "sea", "TW2": "sea", "VN2": "sea"
                }
                region = platform_to_region.get(user.riot_platform, "europe")

                # Get summoner data
                summoner_data = await riot_api_service.get_summoner_by_puuid(
                    user.riot_puuid,
                    platform=user.riot_platform
                )

                # Get ranked stats
                ranked_data = await riot_api_service.get_ranked_stats(
                    summoner_data["id"],
                    platform=user.riot_platform
                )

                # Get champion mastery
                champion_mastery = await riot_api_service.get_champion_mastery(
                    user.riot_puuid,
                    platform=user.riot_platform
                )

                # Auto-detect preferred role from matches
                preferred_role = await riot_api_service.detect_preferred_role_from_matches(
                    user.riot_puuid,
                    region=region,
                    platform=user.riot_platform
                )

                # Fallback to champion mastery if no matches found
                if not preferred_role and champion_mastery:
                    from app.routes.riot_routes import detect_preferred_role
                    preferred_role = detect_preferred_role(champion_mastery[:3])

                # Update user record
                user.summoner_id = summoner_data["id"]
                user.summoner_name = summoner_data["name"]
                user.summoner_level = str(summoner_data["summonerLevel"])
                user.profile_icon_id = str(summoner_data["profileIconId"])

                # Update ranked stats
                solo_queue = next((q for q in ranked_data if q["queueType"] == "RANKED_SOLO_5x5"), None)
                if solo_queue:
                    user.solo_tier = solo_queue.get("tier")
                    user.solo_rank = solo_queue.get("rank")
                    user.solo_lp = str(solo_queue.get("leaguePoints", 0))
                    user.solo_wins = str(solo_queue.get("wins", 0))
                    user.solo_losses = str(solo_queue.get("losses", 0))

                # Update champion mastery
                if champion_mastery:
                    user.top_champions = champion_mastery[:3]

                # Update preferred lane
                if preferred_role:
                    user.preferred_lane = preferred_role

                user.last_synced = now
                db.commit()
                synced_count += 1

                logger.info(f"Successfully synced data for user {user.username}")

            except Exception as e:
                logger.error(f"Failed to sync data for user {user.username}: {str(e)}")
                continue

        logger.info(f"Auto-sync completed: {synced_count} users updated")

    except Exception as e:
        logger.error(f"Error in auto_sync_stale_data: {str(e)}")
    finally:
        db.close()


def start_scheduler():
    """
    Start the background scheduler
    """
    global scheduler

    if scheduler is not None:
        logger.warning("Scheduler already running")
        return

    scheduler = AsyncIOScheduler()

    # Run auto-sync every 6 hours
    scheduler.add_job(
        auto_sync_stale_data,
        trigger=IntervalTrigger(hours=6),
        id="auto_sync_stale_data",
        name="Auto-sync stale summoner data",
        replace_existing=True
    )

    scheduler.start()
    logger.info("Background scheduler started - auto-sync will run every 6 hours")


def shutdown_scheduler():
    """
    Shutdown the background scheduler
    """
    global scheduler

    if scheduler is not None:
        scheduler.shutdown()
        scheduler = None
        logger.info("Background scheduler shut down")
