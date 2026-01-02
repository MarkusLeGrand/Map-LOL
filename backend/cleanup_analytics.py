#!/usr/bin/env python3
"""
OpenRift Analytics Cleanup Script

This script automatically deletes old analytics JSON files that are NOT saved by users.
It prevents the VPS from running out of disk space due to temporary uploads.

HOW IT WORKS:
1. Scans all files in /uploads/ directory
2. Checks if file is referenced in UserAnalytics or TeamAnalytics DB tables
3. If NOT referenced AND older than RETENTION_DAYS → DELETE
4. Logs all actions for audit trail

WHY THIS IS CRITICAL:
- Each analytics file can be 5-50MB
- Without cleanup, 100 users × 10 uploads = 500MB-5GB wasted
- VPS disk space is limited (usually 20-40GB)
- This prevents "disk full" errors that would crash the site

RUNS: Daily via cron at 3 AM
"""

import os
import sys
from pathlib import Path
from datetime import datetime, timedelta
from sqlalchemy import create_engine, or_
from sqlalchemy.orm import sessionmaker

# Add app directory to path
sys.path.append(str(Path(__file__).parent / "app"))

from database import UserAnalytics, TeamAnalytics

# Configuration
UPLOAD_DIR = Path(__file__).parent / "uploads"
RETENTION_DAYS = 7  # Keep unsaved files for 7 days
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./data/openrift.db")

def get_saved_file_paths(db_session):
    """
    Get all file paths that are saved in database

    Returns:
        set: Set of file paths that should NOT be deleted
    """
    saved_paths = set()

    # Get paths from UserAnalytics
    user_analytics = db_session.query(UserAnalytics.data_path).all()
    saved_paths.update(Path(a.data_path) for a in user_analytics)

    # Get paths from TeamAnalytics
    team_analytics = db_session.query(TeamAnalytics.data_path).all()
    saved_paths.update(Path(a.data_path) for a in team_analytics)

    return saved_paths

def cleanup_old_files():
    """
    Main cleanup function

    Process:
    1. Connect to database
    2. Get list of saved files
    3. Scan upload directory
    4. Delete old unsaved files
    """
    print(f"🧹 Starting analytics cleanup at {datetime.now()}")
    print(f"📁 Upload directory: {UPLOAD_DIR}")
    print(f"⏰ Retention: {RETENTION_DAYS} days")
    print("-" * 60)

    # Connect to database
    engine = create_engine(DATABASE_URL)
    Session = sessionmaker(bind=engine)
    db = Session()

    try:
        # Get saved file paths
        saved_paths = get_saved_file_paths(db)
        print(f"✅ Found {len(saved_paths)} saved analytics in database")

        # Scan upload directory
        if not UPLOAD_DIR.exists():
            print(f"⚠️  Upload directory doesn't exist: {UPLOAD_DIR}")
            return

        all_files = list(UPLOAD_DIR.glob("analytics_data_*.json"))
        print(f"📊 Found {len(all_files)} total files in uploads/")

        # Calculate cutoff date
        cutoff_date = datetime.now() - timedelta(days=RETENTION_DAYS)
        print(f"🗓️  Cutoff date: {cutoff_date.strftime('%Y-%m-%d %H:%M:%S')}")
        print("-" * 60)

        deleted_count = 0
        deleted_size = 0
        kept_count = 0

        for file_path in all_files:
            file_stat = file_path.stat()
            file_modified = datetime.fromtimestamp(file_stat.st_mtime)
            file_size = file_stat.st_size

            # Check if file is saved in database
            if file_path in saved_paths:
                kept_count += 1
                print(f"  ✅ KEEP (saved): {file_path.name}")
                continue

            # Check if file is old enough to delete
            if file_modified > cutoff_date:
                kept_count += 1
                days_old = (datetime.now() - file_modified).days
                print(f"  ⏳ KEEP (recent, {days_old}d old): {file_path.name}")
                continue

            # Delete old unsaved file
            try:
                file_path.unlink()
                deleted_count += 1
                deleted_size += file_size
                days_old = (datetime.now() - file_modified).days
                print(f"  🗑️  DELETED ({days_old}d old, {file_size/1024/1024:.1f}MB): {file_path.name}")
            except Exception as e:
                print(f"  ❌ ERROR deleting {file_path.name}: {e}")

        # Summary
        print("-" * 60)
        print(f"✅ Cleanup complete!")
        print(f"   Kept: {kept_count} files")
        print(f"   Deleted: {deleted_count} files ({deleted_size/1024/1024:.1f}MB freed)")

        # Also cleanup export directory (old charts)
        export_dir = UPLOAD_DIR.parent / "exports"
        if export_dir.exists():
            export_files = list(export_dir.glob("*.png"))
            export_deleted = 0
            for exp_file in export_files:
                if datetime.fromtimestamp(exp_file.stat().st_mtime) < cutoff_date:
                    exp_file.unlink()
                    export_deleted += 1
            if export_deleted > 0:
                print(f"   Also deleted {export_deleted} old export charts")

    except Exception as e:
        print(f"❌ Cleanup failed: {e}")
        raise
    finally:
        db.close()

if __name__ == "__main__":
    cleanup_old_files()
