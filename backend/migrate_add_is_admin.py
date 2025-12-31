"""
Migration script to add is_admin column to existing database
Usage: python migrate_add_is_admin.py
"""
import sqlite3
import os

DB_PATH = "app/openrift.db"

def add_is_admin_column():
    """Add is_admin column to users table"""
    if not os.path.exists(DB_PATH):
        print(f"❌ Database not found at {DB_PATH}")
        return False

    try:
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()

        # Check if column already exists
        cursor.execute("PRAGMA table_info(users)")
        columns = [col[1] for col in cursor.fetchall()]

        if 'is_admin' in columns:
            print("✅ Column 'is_admin' already exists!")
            conn.close()
            return True

        # Add the column
        print("Adding is_admin column to users table...")
        cursor.execute("ALTER TABLE users ADD COLUMN is_admin BOOLEAN DEFAULT 0")
        conn.commit()

        print("✅ Successfully added is_admin column!")
        print("All existing users have is_admin = False by default")

        conn.close()
        return True

    except Exception as e:
        print(f"❌ Error: {str(e)}")
        return False


if __name__ == "__main__":
    print("🔄 Database Migration: Adding is_admin column")
    print("=" * 50)
    success = add_is_admin_column()
    print("=" * 50)

    if success:
        print("\n✅ Migration completed successfully!")
        print("\nNext steps:")
        print("  1. python make_admin.py <your_username>")
        print("  2. Restart the backend server")
    else:
        print("\n❌ Migration failed!")
