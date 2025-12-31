"""
Check both database locations
"""
import sqlite3
import os

def check_db(db_path):
    """Check a database"""
    if not os.path.exists(db_path):
        print(f"❌ {db_path} does not exist")
        return

    print(f"\n📁 Checking: {db_path}")
    print("=" * 80)

    try:
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()

        # Check if users table exists
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='users'")
        if not cursor.fetchone():
            print("❌ No 'users' table found")
            conn.close()
            return

        # Count users
        cursor.execute("SELECT COUNT(*) FROM users")
        count = cursor.fetchone()[0]

        if count == 0:
            print(f"⚠️  Users table exists but is EMPTY (0 users)")
        else:
            print(f"✅ Found {count} user(s)")

            # Show users
            cursor.execute("SELECT username, email FROM users LIMIT 5")
            users = cursor.fetchall()
            for username, email in users:
                print(f"   - {username} ({email})")

        conn.close()

    except Exception as e:
        print(f"❌ Error: {str(e)}")

if __name__ == "__main__":
    print("\nSearching for databases...\n")
    check_db("openrift.db")
    check_db("app/openrift.db")

    print("\n" + "=" * 80)
    print("The database with users is the one you should use!")
