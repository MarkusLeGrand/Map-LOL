"""
List all users in the database
"""
import sqlite3

DB_PATH = "app/openrift.db"

def list_users():
    """List all users"""
    try:
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()

        cursor.execute("SELECT id, username, email, is_admin, created_at FROM users")
        users = cursor.fetchall()

        if not users:
            print("❌ No users found in database")
            conn.close()
            return

        print(f"\n📋 Found {len(users)} user(s):")
        print("=" * 80)
        for user in users:
            user_id, username, email, is_admin, created_at = user
            admin_badge = "👑 ADMIN" if is_admin else ""
            print(f"Username: {username}")
            print(f"Email:    {email}")
            print(f"ID:       {user_id}")
            print(f"Admin:    {is_admin} {admin_badge}")
            print(f"Created:  {created_at}")
            print("-" * 80)

        conn.close()

    except Exception as e:
        print(f"❌ Error: {str(e)}")


if __name__ == "__main__":
    list_users()
