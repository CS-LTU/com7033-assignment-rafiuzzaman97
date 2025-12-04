"""
User Migration Script - SQLite to MongoDB

Migrates all users from SQLite database to MongoDB.
Run this script once when switching from SQLite to MongoDB for users.

Usage:
    python scripts/migrate_users_to_mongodb.py
"""

import sys
import os

# Add parent directory to path to import app modules
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app import create_app
from app.models.user import User as SQLUser
from app.models.user_mongodb import UserMongoDB, UserMongoDBManager
from pymongo import MongoClient

def migrate_users():
    """Migrate all users from SQLite to MongoDB"""
    
    print("=" * 60)
    print("User Migration: SQLite → MongoDB")
    print("=" * 60)
    
    # Create Flask app context
    app = create_app()
    
    with app.app_context():
        # Get MongoDB connection
        mongo_uri = app.config['MONGO_URI']
        db_name = app.config['MONGO_DB_NAME']
        
        print(f"\n📁 Connecting to MongoDB: {mongo_uri}")
        print(f"📁 Database: {db_name}")
        
        try:
            client = MongoClient(mongo_uri)
            manager = UserMongoDBManager(client, db_name)
            
            # Test connection
            client.admin.command('ping')
            print("✅ MongoDB connection successful")
            
        except Exception as e:
            print(f"❌ MongoDB connection failed: {e}")
            return
        
        # Fetch all users from SQLite
        print("\n📊 Fetching users from SQLite...")
        sql_users = SQLUser.query.all()
        
        if not sql_users:
            print("⚠️  No users found in SQLite database")
            return
        
        print(f"✅ Found {len(sql_users)} users in SQLite")
        
        # Migrate each user
        migrated_count = 0
        skipped_count = 0
        
        print("\n🔄 Starting migration...")
        print("-" * 60)
        
        for sql_user in sql_users:
            # Check if user already exists in MongoDB
            existing = manager.find_by_username(sql_user.username)
            
            if existing:
                print(f"⏭️  Skipping {sql_user.username} (already exists in MongoDB)")
                skipped_count += 1
                continue
            
            # Create MongoDB user from SQLite user
            mongo_user = UserMongoDB()
            mongo_user.username = sql_user.username
            mongo_user.email = sql_user.email
            mongo_user.password_hash = sql_user.password_hash  # Copy hash directly
            mongo_user.role = sql_user.role
            mongo_user.first_name = sql_user.first_name
            mongo_user.last_name = sql_user.last_name
            mongo_user.phone = sql_user.phone
            mongo_user.specialization = sql_user.specialization
            mongo_user.license_number = sql_user.license_number
            mongo_user.is_active = sql_user.is_active
            mongo_user.created_at = sql_user.created_at
            mongo_user.last_login = sql_user.last_login
            
            try:
                manager.create_user(mongo_user)
                print(f"✅ Migrated: {sql_user.username} ({sql_user.role})")
                migrated_count += 1
            except Exception as e:
                print(f"❌ Failed to migrate {sql_user.username}: {e}")
        
        print("-" * 60)
        print(f"\n📊 Migration Summary:")
        print(f"   ✅ Migrated: {migrated_count}")
        print(f"   ⏭️  Skipped: {skipped_count}")
        print(f"   📝 Total: {len(sql_users)}")
        
        if migrated_count > 0:
            print("\n🎉 Migration completed successfully!")
            print("\n⚙️  Next steps:")
            print("   1. Update .env file: USE_MONGODB_USERS=true")
            print("   2. Restart Flask backend")
            print("   3. Test login with migrated users")
        else:
            print("\n⚠️  No users were migrated")


if __name__ == '__main__':
    migrate_users()
