"""
Application Configuration - config.py

This module defines all configuration settings for the Flask application.
Settings include database connections, security keys, CORS, JWT, and business logic constants.

Configuration Strategy:
- Environment Variables: Load from .env file for deployment
- Default Values: Provide sensible defaults for development
- Security: Use different keys for development vs production
"""

import os
from datetime import timedelta
from dotenv import load_dotenv
from sqlalchemy.pool import NullPool

# Load environment variables from .env file
load_dotenv()

# Get base directory for constructing relative paths
basedir = os.path.abspath(os.path.dirname(os.path.dirname(__file__)))

class Config:
    """
    Flask Application Configuration
    
    Defines all settings used by the Flask app including:
    - Database connections (SQLite and MongoDB options)
    - Security and authentication (JWT, bcrypt)
    - CORS settings for frontend communication
    - Business logic constants (stroke risk thresholds)
    """
    
    # ========== SECURITY SETTINGS ==========
    # Secret key used for session management and CSRF protection
    # IMPORTANT: Change this in production!
    SECRET_KEY = os.environ.get('SECRET_KEY') or 'dev-secret-key-change-in-production'
    
    # ========== DATABASE SETTINGS ==========
    # SQLite database configuration (default for development)
    database_path = os.path.join(basedir, 'instance', 'stroke_care.db')
    # DATABASE_URL can be overridden via environment variable
    SQLALCHEMY_DATABASE_URI = os.environ.get('DATABASE_URL') or f'sqlite:///{database_path}'
    # Disable modification tracking to improve performance
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    # SQLite-specific settings to prevent database locking
    # Using NullPool to avoid connection reuse issues on Windows
    SQLALCHEMY_ENGINE_OPTIONS = {
        'connect_args': {
            'timeout': 120,  # Wait up to 2 minutes for database lock
            'check_same_thread': False,  # Allow SQLite across threads
        },
        'poolclass': NullPool,  # Create new connection for each request, no pooling
    }
    
    # ========== MONGODB SETTINGS (OPTIONAL) ==========
    # MongoDB connection string (for patient data storage alternative)
    MONGO_URI = os.environ.get('MONGO_URI') or 'mongodb://localhost:27017/'
    # MongoDB database name for stroke care application
    MONGO_DB_NAME = os.environ.get('MONGO_DB_NAME') or 'stroke_care'
    # Flag to enable/disable MongoDB usage for patients (defaults to SQLite)
    USE_MONGODB = os.environ.get('USE_MONGODB', 'false').lower() == 'true'
    # Flag to enable/disable MongoDB for users table (defaults to SQLite)
    USE_MONGODB_USERS = os.environ.get('USE_MONGODB_USERS', 'false').lower() == 'true'
    
    # ========== JWT AUTHENTICATION SETTINGS ==========
    # Secret key for JWT token generation and validation
    # IMPORTANT: Change this in production!
    JWT_SECRET_KEY = os.environ.get('JWT_SECRET_KEY') or 'jwt-secret-key-change-in-production'
    # How long access tokens remain valid before expiration (24 hours)
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(hours=24)
    
    # ========== CORS SETTINGS ==========
    # List of allowed origins for cross-origin requests
    # Allows frontend on localhost:5173 and 5174 (Vite dev server) to make API calls
    CORS_ORIGINS = ["http://localhost:5173", "http://127.0.0.1:5173", "http://localhost:5174", "http://127.0.0.1:5174"]
    # Allow credentials (cookies, authorization headers) in CORS requests
    CORS_SUPPORTS_CREDENTIALS = True
    
    # ========== BCRYPT HASHING SETTINGS ==========
    # Number of salt rounds for password hashing (higher = more secure but slower)
    # 12 is recommended for security vs performance balance
    BCRYPT_LOG_ROUNDS = 12
    
    # ========== STROKE RISK THRESHOLDS ==========
    # Risk score percentages for stroke risk classification
    # Used by analytics to categorize patient risk levels
    STROKE_RISK_THRESHOLD_HIGH = 50      # >= 50% = High Risk
    STROKE_RISK_THRESHOLD_MEDIUM = 25    # >= 25% and < 50% = Medium Risk
    # Otherwise: Low Risk (< 25%)
    
    def __init__(self):
        """
        Constructor - Initialize Configuration
        
        Ensures the instance directory exists for SQLite database storage.
        Creates directory if it doesn't exist.
        """
        # Build path to instance directory (for database and other runtime files)
        instance_dir = os.path.join(basedir, 'instance')
        # Create instance directory if it doesn't exist
        if not os.path.exists(instance_dir):
            os.makedirs(instance_dir)
            print(f"✅ Created instance directory: {instance_dir}")