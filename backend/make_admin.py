"""
Script to make a user an admin
Usage: python make_admin.py <username_or_email>
"""
import sys
import sqlite3

DB_PATH = "openrift.db"

def make_admin(identifier: str):
    """Make a user an admin by username or email"""
    try:
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()

        # Try to find user by username or email
        cursor.execute(
            "SELECT id, username, email, is_admin FROM users WHERE username = ? OR email = ?",
            (identifier, identifier)
        )
        user = cursor.fetchone()

        if not user:
            print(f"❌ User not found: {identifier}")
            conn.close()
            return False

        user_id, username, email, is_admin = user

        if is_admin:
            print(f"✅ User {username} is already an admin")
            conn.close()
            return True

        # Make user admin
        cursor.execute("UPDATE users SET is_admin = 1 WHERE id = ?", (user_id,))
        conn.commit()

        print(f"✅ User {username} ({email}) is now an admin!")
        conn.close()
        return True

    except Exception as e:
        print(f"❌ Error: {str(e)}")
        return False


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python make_admin.py <username_or_email>")
        sys.exit(1)

    identifier = sys.argv[1]
    success = make_admin(identifier)
    sys.exit(0 if success else 1)
