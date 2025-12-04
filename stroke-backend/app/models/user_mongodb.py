"""
MongoDB User Model - models/user_mongodb.py

PyMongo implementation for User model with same interface as SQLAlchemy version.
Provides MongoDB-based storage for user authentication and management.

Features:
- Password hashing with bcrypt
- JWT token generation
- Role-based access control
- Compatible interface with SQLAlchemy User model
"""

from pymongo import MongoClient
from flask_bcrypt import Bcrypt
from datetime import datetime, timedelta
from bson import ObjectId
import jwt
from flask import current_app

bcrypt = Bcrypt()

class UserMongoDB:
    """
    MongoDB User Model
    
    Handles user authentication and management using MongoDB.
    Provides same interface as SQLAlchemy User model for easy migration.
    
    Attributes:
        _id (ObjectId): MongoDB document ID
        id (str): String representation of _id for API compatibility
        username (str): Unique login name
        email (str): Unique email address
        password_hash (str): Bcrypt-hashed password
        role (str): User type - 'admin', 'doctor', or 'patient'
        first_name (str): User's first name
        last_name (str): User's last name
        phone (str): Contact phone number
        specialization (str): Medical specialty (doctors only)
        license_number (str): Medical license (doctors only)
        is_active (bool): Account status
        created_at (datetime): Account creation timestamp
        last_login (datetime): Last login timestamp
    """
    
    def __init__(self, data=None):
        """
        Initialize User from MongoDB document or create new user
        
        @param data: Dictionary from MongoDB or None for new user
        """
        if data:
            self._id = data.get('_id')
            self.id = str(data.get('_id')) if data.get('_id') else None
            self.username = data.get('username')
            self.email = data.get('email')
            self.password_hash = data.get('password_hash')
            self.role = data.get('role', 'patient')
            self.first_name = data.get('first_name')
            self.last_name = data.get('last_name')
            self.phone = data.get('phone')
            self.specialization = data.get('specialization')
            self.license_number = data.get('license_number')
            self.is_active = data.get('is_active', True)
            self.created_at = data.get('created_at', datetime.utcnow())
            self.last_login = data.get('last_login')
        else:
            # New user defaults
            self._id = None
            self.id = None
            self.username = None
            self.email = None
            self.password_hash = None
            self.role = 'patient'
            self.first_name = None
            self.last_name = None
            self.phone = None
            self.specialization = None
            self.license_number = None
            self.is_active = True
            self.created_at = datetime.utcnow()
            self.last_login = None
    
    def set_password(self, password):
        """Hash and store password securely using bcrypt"""
        self.password_hash = bcrypt.generate_password_hash(password).decode('utf-8')
    
    def check_password(self, password):
        """Verify password against stored hash"""
        return bcrypt.check_password_hash(self.password_hash, password)
    
    def to_dict(self):
        """Serialize user to dictionary for JSON responses"""
        return {
            'id': self.id,
            'username': self.username,
            'email': self.email,
            'role': self.role,
            'first_name': self.first_name,
            'last_name': self.last_name,
            'phone': self.phone,
            'specialization': self.specialization,
            'is_active': self.is_active,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'last_login': self.last_login.isoformat() if self.last_login else None
        }
    
    def to_mongo_dict(self):
        """Convert user to MongoDB document format"""
        doc = {
            'username': self.username,
            'email': self.email,
            'password_hash': self.password_hash,
            'role': self.role,
            'first_name': self.first_name,
            'last_name': self.last_name,
            'phone': self.phone,
            'specialization': self.specialization,
            'license_number': self.license_number,
            'is_active': self.is_active,
            'created_at': self.created_at,
            'last_login': self.last_login
        }
        if self._id:
            doc['_id'] = self._id
        return doc
    
    def generate_auth_token(self, expires_in=86400):
        """Generate JWT authentication token"""
        try:
            payload = {
                'user_id': self.id,
                'username': self.username,
                'role': self.role,
                'exp': datetime.utcnow() + timedelta(seconds=expires_in)
            }
            token = jwt.encode(
                payload,
                current_app.config['SECRET_KEY'],
                algorithm='HS256'
            )
            return token
        except Exception as e:
            print(f"Token generation error: {e}")
            return None
    
    @staticmethod
    def verify_auth_token(token):
        """Verify and decode JWT token"""
        try:
            payload = jwt.decode(
                token,
                current_app.config['SECRET_KEY'],
                algorithms=['HS256']
            )
            return payload
        except jwt.ExpiredSignatureError:
            return None
        except jwt.InvalidTokenError:
            return None


class UserMongoDBManager:
    """
    Manager class for MongoDB User operations
    
    Provides static methods for querying and manipulating users in MongoDB.
    Similar interface to SQLAlchemy query operations.
    """
    
    def __init__(self, mongo_client, db_name):
        """
        Initialize MongoDB manager
        
        @param mongo_client: PyMongo MongoClient instance
        @param db_name: Database name
        """
        self.db = mongo_client[db_name]
        self.users = self.db.users
        
        # Create unique indexes
        self.users.create_index('username', unique=True)
        self.users.create_index('email', unique=True)
    
    def create_user(self, user):
        """
        Insert new user into MongoDB
        
        @param user: UserMongoDB instance
        @return: UserMongoDB with assigned _id
        """
        doc = user.to_mongo_dict()
        result = self.users.insert_one(doc)
        user._id = result.inserted_id
        user.id = str(result.inserted_id)
        return user
    
    def find_by_username(self, username):
        """Find user by username"""
        doc = self.users.find_one({'username': username})
        return UserMongoDB(doc) if doc else None
    
    def find_by_email(self, email):
        """Find user by email"""
        doc = self.users.find_one({'email': email})
        return UserMongoDB(doc) if doc else None
    
    def find_by_id(self, user_id):
        """Find user by ID"""
        try:
            if isinstance(user_id, str):
                user_id = ObjectId(user_id)
            doc = self.users.find_one({'_id': user_id})
            return UserMongoDB(doc) if doc else None
        except Exception:
            return None
    
    def find_all(self, role=None):
        """
        Find all users, optionally filtered by role
        
        @param role: Optional role filter ('admin', 'doctor', 'patient')
        @return: List of UserMongoDB instances
        """
        query = {'role': role} if role else {}
        docs = self.users.find(query)
        return [UserMongoDB(doc) for doc in docs]
    
    def update_user(self, user):
        """
        Update existing user
        
        @param user: UserMongoDB instance with updated data
        @return: True if updated, False otherwise
        """
        if not user._id:
            return False
        
        doc = user.to_mongo_dict()
        doc.pop('_id', None)  # Don't update _id
        
        result = self.users.update_one(
            {'_id': user._id},
            {'$set': doc}
        )
        return result.modified_count > 0
    
    def delete_user(self, user_id):
        """
        Delete user by ID
        
        @param user_id: User ID (string or ObjectId)
        @return: True if deleted, False otherwise
        """
        try:
            if isinstance(user_id, str):
                user_id = ObjectId(user_id)
            result = self.users.delete_one({'_id': user_id})
            return result.deleted_count > 0
        except Exception:
            return False
    
    def update_last_login(self, user_id):
        """Update user's last login timestamp"""
        try:
            if isinstance(user_id, str):
                user_id = ObjectId(user_id)
            self.users.update_one(
                {'_id': user_id},
                {'$set': {'last_login': datetime.utcnow()}}
            )
        except Exception:
            pass
