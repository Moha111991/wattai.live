"""
Initialize the database schema
Run this script once to create all tables
"""
from database import init_database

if __name__ == "__main__":
    print("Initializing database...")
    init_database()
    print("Database initialization complete!")
