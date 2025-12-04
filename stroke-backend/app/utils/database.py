"""
Database Utility - utils/database.py

Provides unified interface for user operations that works with both SQLite and MongoDB.
Routes calls to appropriate backend based on USE_MONGODB_USERS config flag.

This abstraction layer allows switching between databases without changing route code.
"""

from flask import current_app
from pymongo import MongoClient
from app.models.user import User as SQLUser, db
from app.models.user_mongodb import UserMongoDB, UserMongoDBManager

# Global MongoDB manager instance
_mongo_user_manager = None

def get_mongo_user_manager():
    """
    Get or create MongoDB user manager instance
    
    @return: UserMongoDBManager instance
    """
    global _mongo_user_manager
    
    if _mongo_user_manager is None:
        mongo_uri = current_app.config['MONGO_URI']
        db_name = current_app.config['MONGO_DB_NAME']
        client = MongoClient(mongo_uri)
        _mongo_user_manager = UserMongoDBManager(client, db_name)
    
    return _mongo_user_manager


def use_mongodb_users():
    """Check if MongoDB should be used for users"""
    return current_app.config.get('USE_MONGODB_USERS', False)


class UserOperations:
    """
    Unified User Operations Interface
    
    Provides consistent API for user operations regardless of backend.
    Automatically routes to SQLite or MongoDB based on config.
    """
    
    @staticmethod
    def create_user(username, email, password, role='patient', first_name='', last_name='', 
                   phone=None, specialization=None, license_number=None):
        """
        Create new user
        
        @param username: Unique username
        @param email: Unique email
        @param password: Plain text password (will be hashed)
        @param role: User role (admin/doctor/patient)
        @param first_name: User's first name
        @param last_name: User's last name
        @param phone: Phone number (optional)
        @param specialization: Medical specialty (doctors only)
        @param license_number: Medical license (doctors only)
        @return: User object or None if creation fails
        """
        try:
            if use_mongodb_users():
                # MongoDB implementation
                manager = get_mongo_user_manager()
                user = UserMongoDB()
                user.username = username
                user.email = email
                user.set_password(password)
                user.role = role
                user.first_name = first_name
                user.last_name = last_name
                user.phone = phone
                user.specialization = specialization
                user.license_number = license_number
                return manager.create_user(user)
            else:
                # SQLite implementation
                user = SQLUser()
                user.username = username
                user.email = email
                user.set_password(password)
                user.role = role
                user.first_name = first_name
                user.last_name = last_name
                user.phone = phone
                user.specialization = specialization
                user.license_number = license_number
                db.session.add(user)
                db.session.commit()
                return user
        except Exception as e:
            print(f"Error creating user: {e}")
            if not use_mongodb_users():
                db.session.rollback()
            return None
    
    @staticmethod
    def find_by_username(username):
        """Find user by username"""
        if use_mongodb_users():
            manager = get_mongo_user_manager()
            return manager.find_by_username(username)
        else:
            return SQLUser.query.filter_by(username=username).first()
    
    @staticmethod
    def find_by_email(email):
        """Find user by email"""
        if use_mongodb_users():
            manager = get_mongo_user_manager()
            return manager.find_by_email(email)
        else:
            return SQLUser.query.filter_by(email=email).first()
    
    @staticmethod
    def find_by_id(user_id):
        """Find user by ID"""
        if use_mongodb_users():
            manager = get_mongo_user_manager()
            return manager.find_by_id(user_id)
        else:
            return SQLUser.query.get(user_id)
    
    @staticmethod
    def find_all(role=None):
        """
        Find all users, optionally filtered by role
        
        @param role: Optional role filter
        @return: List of user objects
        """
        if use_mongodb_users():
            manager = get_mongo_user_manager()
            return manager.find_all(role)
        else:
            if role:
                return SQLUser.query.filter_by(role=role).all()
            return SQLUser.query.all()
    
    @staticmethod
    def update_user(user):
        """
        Update existing user
        
        @param user: User object with updated data
        @return: True if successful, False otherwise
        """
        try:
            if use_mongodb_users():
                manager = get_mongo_user_manager()
                return manager.update_user(user)
            else:
                db.session.commit()
                return True
        except Exception as e:
            print(f"Error updating user: {e}")
            if not use_mongodb_users():
                db.session.rollback()
            return False
    
    @staticmethod
    def delete_user(user_id):
        """
        Delete user by ID
        
        @param user_id: User ID
        @return: True if deleted, False otherwise
        """
        try:
            if use_mongodb_users():
                manager = get_mongo_user_manager()
                return manager.delete_user(user_id)
            else:
                user = SQLUser.query.get(user_id)
                if user:
                    db.session.delete(user)
                    db.session.commit()
                    return True
                return False
        except Exception as e:
            print(f"Error deleting user: {e}")
            if not use_mongodb_users():
                db.session.rollback()
            return False
    
    @staticmethod
    def update_last_login(user_id):
        """Update user's last login timestamp"""
        try:
            if use_mongodb_users():
                manager = get_mongo_user_manager()
                manager.update_last_login(user_id)
            else:
                from datetime import datetime
                user = SQLUser.query.get(user_id)
                if user:
                    user.last_login = datetime.utcnow()
                    db.session.commit()
        except Exception as e:
            print(f"Error updating last login: {e}")
            if not use_mongodb_users():
                db.session.rollback()
    
    @staticmethod
    def commit():
        """
        Commit changes (for SQLite compatibility)
        No-op for MongoDB
        """
        if not use_mongodb_users():
            try:
                db.session.commit()
            except Exception as e:
                print(f"Error committing: {e}")
                db.session.rollback()
    
    @staticmethod
    def rollback():
        """
        Rollback changes (for SQLite compatibility)
        No-op for MongoDB
        """
        if not use_mongodb_users():
            db.session.rollback()
