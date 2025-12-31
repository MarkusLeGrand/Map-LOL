"""
Reset and recreate the database from scratch
"""
import os
import sys

# Add app to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'app'))

from database import Base, engine, init_db

def reset_database():
    """Drop all tables and recreate them"""
    print("\n" + "="*80)
    print("DATABASE RESET - This will delete ALL data!")
    print("="*80)

    response = input("\nAre you sure? Type 'yes' to continue: ")
    if response.lower() != 'yes':
        print("❌ Aborted")
        return False

    try:
        print("\n🗑️  Dropping all tables...")
        Base.metadata.drop_all(bind=engine)

        print("✅ All tables dropped")

        print("\n📦 Creating fresh database schema...")
        Base.metadata.create_all(bind=engine)

        print("✅ Database schema created successfully!")
        print("\n" + "="*80)
        print("✅ DATABASE RESET COMPLETE!")
        print("="*80)
        print("\nNext steps:")
        print("  1. Restart the backend server")
        print("  2. Register a new account at /signup")
        print("  3. Run: python make_admin.py <your_username>")
        print("  4. Login and access /admin")

        return True

    except Exception as e:
        print(f"\n❌ Error: {str(e)}")
        return False

if __name__ == "__main__":
    success = reset_database()
    sys.exit(0 if success else 1)
