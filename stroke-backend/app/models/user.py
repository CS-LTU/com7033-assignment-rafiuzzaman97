"""
User and Appointment Models - models/user.py

Defines SQLAlchemy ORM models for:
1. User - System users (patients, doctors, admins)
2. Appointment - Medical appointments between patients and doctors

Models handle:
- User authentication (password hashing with bcrypt)
- JWT token generation and verification
- Role-based access control (admin, doctor, patient)
- Data serialization for API responses
"""

from flask_sqlalchemy import SQLAlchemy
from flask_bcrypt import Bcrypt
from datetime import datetime, timedelta
import jwt
from flask import current_app

# Initialize SQLAlchemy ORM and bcrypt
db = SQLAlchemy()
bcrypt = Bcrypt()

class User(db.Model):
    """
    User Model - System Users
    
    Stores user accounts for patients, doctors, and administrators.
    Handles password security, authentication, and JWT tokens.
    
    Attributes:
        id (int): Primary key - unique user identifier
        username (str): Unique login name (indexed for fast queries)
        email (str): Unique email address for communication
        password_hash (str): Bcrypt-hashed password (never stored plain text)
        role (str): User type - 'admin', 'doctor', or 'patient'
        first_name (str): User's first name
        last_name (str): User's last name
        phone (str): Contact phone number (optional)
        specialization (str): Medical specialty (for doctors only)
        license_number (str): Medical license (for doctors only)
        is_active (bool): Account active status
        created_at (datetime): Account creation timestamp
        last_login (datetime): Most recent login timestamp
    """
    __tablename__ = 'users'
    
    # Primary Key
    id = db.Column(db.Integer, primary_key=True)
    
    # Authentication Fields
    username = db.Column(db.String(80), unique=True, nullable=False, index=True)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    
    # Authorization and Role
    role = db.Column(db.String(20), nullable=False, default='patient')  # admin, doctor, patient
    
    # User Information
    first_name = db.Column(db.String(50), nullable=False)
    last_name = db.Column(db.String(50), nullable=False)
    phone = db.Column(db.String(20))
    
    # Doctor-Specific Information
    specialization = db.Column(db.String(100))  # e.g., 'Neurology', 'Cardiology'
    license_number = db.Column(db.String(50))   # Medical license identifier
    
    # Account Status
    is_active = db.Column(db.Boolean, default=True)
    
    # Timestamps
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    last_login = db.Column(db.DateTime)
    
    def set_password(self, password):
        """
        Hash and store password securely
        
        Uses bcrypt to hash password with configured salt rounds (12 by default).
        Plain text password is never stored.
        
        @param password: Plain text password to hash
        """
        # Generate bcrypt hash and decode bytes to string
        self.password_hash = bcrypt.generate_password_hash(password).decode('utf-8')
    
    def check_password(self, password):
        """
        Verify password against stored hash
        
        Compares provided plain text password with stored bcrypt hash.
        Safe from timing attacks (bcrypt handles this).
        
        @param password: Plain text password to verify
        @return: True if password matches, False otherwise
        """
        return bcrypt.check_password_hash(self.password_hash, password)
    
    def to_dict(self):
        """
        Serialize user to dictionary for JSON API responses
        
        Excludes sensitive data like password_hash.
        Converts datetime objects to ISO format strings.
        
        @return: Dictionary representation of user
        """
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
            'created_at': self.created_at.isoformat(),
            'last_login': self.last_login.isoformat() if self.last_login else None
        }
    
    def generate_auth_token(self, expires_in=86400):
        """
        Generate JWT authentication token
        
        Creates signed JWT token containing user identification and expiration.
        Token used for subsequent API requests (Authorization header).
        
        @param expires_in: Token validity in seconds (default 86400 = 24 hours)
        @return: JWT token string or None if generation fails
        
        Token Payload:
        - user_id: User's database ID
        - username: User's username
        - role: User's role (for permission checks)
        - exp: Token expiration time
        """
        try:
            # Build JWT payload with user info and expiration
            payload = {
                'user_id': self.id,
                'username': self.username,
                'role': self.role,
                'exp': datetime.utcnow() + timedelta(seconds=expires_in)
            }
            
            # Sign JWT with Flask app's secret key
            token = jwt.encode(
                payload, 
                current_app.config['SECRET_KEY'],  # Use Flask app's secret key for consistency
                algorithm='HS256'
            )
            
            # Handle bytes/string conversion (for older PyJWT versions)
            if isinstance(token, bytes):
                token = token.decode('utf-8')
                
            return token
            
        except Exception as e:
            # Log error and return None on failure
            current_app.logger.error(f'Token generation error: {str(e)}')
            return None
    
    @staticmethod
    def verify_auth_token(token):
        """
        Verify JWT token and return associated user
        
        Validates JWT signature, checks expiration, and retrieves user.
        
        @param token: JWT token string from Authorization header
        @return: User object if token valid, None if invalid/expired
        
        Handles:
        - Token expiration
        - Invalid signatures
        - Malformed tokens
        - Token payload errors
        """
        try:
            # Decode and verify JWT signature
            payload = jwt.decode(
                token, 
                current_app.config['SECRET_KEY'],  # Must use same key as encoding
                algorithms=['HS256']
            )
            # Retrieve user from database using ID from token
            return User.query.get(payload['user_id'])
        except jwt.ExpiredSignatureError:
            # Token has expired
            current_app.logger.error('Token expired')
            return None
        except jwt.InvalidTokenError as e:
            # Token signature invalid or malformed
            current_app.logger.error(f'Invalid token: {str(e)}')
            return None
        except Exception as e:
            # Catch unexpected errors
            current_app.logger.error(f'Token verification error: {str(e)}')
            return None


class Appointment(db.Model):
    """
    Appointment Model - Medical Appointments
    
    Stores scheduled appointments between patients and doctors.
    Tracks appointment status, reason, urgency, and notes.
    
    Attributes:
        id (int): Primary key - unique appointment identifier
        patient_id (int): Foreign key to patient user
        doctor_id (int): Foreign key to doctor user
        appointment_date (date): Date of appointment
        appointment_time (time): Time of appointment
        reason (str): Reason for appointment
        urgency (str): Urgency level - 'routine', 'urgent', 'emergency'
        status (str): Appointment status - 'scheduled', 'completed', 'cancelled'
        notes (str): Doctor's notes or additional information
        created_at (datetime): Appointment creation timestamp
        updated_at (datetime): Last modification timestamp
    """
    __tablename__ = 'appointments'
    
    # Primary Key
    id = db.Column(db.Integer, primary_key=True)
    
    # User References (stored as strings to support MongoDB user IDs)
    # When USE_MONGODB_USERS=true, these will be MongoDB ObjectId strings
    # When USE_MONGODB_USERS=false, these will be integer strings
    patient_id = db.Column(db.String(50), nullable=False)  # Changed from Integer to String
    doctor_id = db.Column(db.String(50), nullable=False)   # Changed from Integer to String
    
    # Appointment Details
    appointment_date = db.Column(db.Date, nullable=False)
    appointment_time = db.Column(db.Time, nullable=False)
    reason = db.Column(db.Text, nullable=False)  # Why appointment was booked
    
    # Appointment Metadata
    urgency = db.Column(db.String(20), default='routine')  # routine, urgent, emergency
    status = db.Column(db.String(20), default='scheduled')  # scheduled, completed, cancelled
    notes = db.Column(db.Text)  # Doctor's notes after appointment
    
    # Timestamps
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def to_dict(self):
        """
        Serialize appointment to dictionary for JSON API responses
        
        Includes patient and doctor names for display purposes.
        Converts date/time objects to ISO format strings.
        Fetches user data from appropriate database (MongoDB or SQLite).
        
        @return: Dictionary representation of appointment
        """
        try:
            # Import database utility to fetch users from correct database
            from app.utils.database import get_user_by_id
            
            # Retrieve patient and doctor users from MongoDB or SQLite
            patient = get_user_by_id(self.patient_id)
            doctor = get_user_by_id(self.doctor_id)
            
            patient_name = f"{patient['first_name']} {patient['last_name']}" if patient else 'Unknown'
            doctor_name = f"{doctor['first_name']} {doctor['last_name']}" if doctor else 'Unknown'
        except Exception as e:
            # If user fetch fails, use default names
            current_app.logger.warning(f'Failed to fetch user names for appointment {self.id}: {str(e)}')
            patient_name = 'Unknown'
            doctor_name = 'Unknown'
        
        return {
            'id': self.id,
            'patient_id': self.patient_id,
            'doctor_id': self.doctor_id,
            'appointment_date': self.appointment_date.isoformat(),
            'appointment_time': self.appointment_time.strftime('%H:%M'),
            'reason': self.reason,
            'urgency': self.urgency,
            'status': self.status,
            'notes': self.notes,
            'created_at': self.created_at.isoformat(),
            'patient_name': patient_name,
            'doctor_name': doctor_name
        }