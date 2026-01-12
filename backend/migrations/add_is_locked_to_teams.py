"""
Migration: Add is_locked column to teams table
Date: 2026-01-12
"""
import sqlite3
import os

def migrate():
    db_path = os.environ.get('DATABASE_PATH', './data/openrift.db')

    print(f"🔄 Running migration: add is_locked to teams...")
    print(f"📂 Database path: {db_path}")

    if not os.path.exists(db_path):
        print(f"❌ Database not found at {db_path}")
        return

    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    try:
        # Check if column already exists
        cursor.execute("PRAGMA table_info(teams)")
        columns = [row[1] for row in cursor.fetchall()]

        if 'is_locked' in columns:
            print("✅ Column 'is_locked' already exists. Skipping migration.")
        else:
            # Add is_locked column with default value False
            cursor.execute("""
                ALTER TABLE teams
                ADD COLUMN is_locked BOOLEAN DEFAULT 0
            """)
            conn.commit()
            print("✅ Added 'is_locked' column to teams table")

    except Exception as e:
        print(f"❌ Migration failed: {e}")
        conn.rollback()
    finally:
        conn.close()

    print("✅ Migration complete!")

if __name__ == "__main__":
    migrate()
