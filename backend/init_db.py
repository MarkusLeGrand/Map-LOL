"""
Script to initialize the database with all tables
"""
from app.database import init_db

if __name__ == "__main__":
    init_db()
    print("Database initialized successfully!")
