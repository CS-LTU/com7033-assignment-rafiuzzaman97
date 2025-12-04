"""
Flask Application Factory - app/__init__.py

This module initializes the Flask application with all configuration, extensions, 
blueprints, error handlers, and database setup.

Functions:
    create_app(): Creates and configures Flask application instance
    create_initial_data(): Populates database with demo users and sample data
"""

from flask import Flask
from flask_cors import CORS
from flask_bcrypt import Bcrypt
from app.config import Config
from app.models.user import db
from sqlalchemy import event
from sqlalchemy.engine import Engine
import os

# Initialize Flask-Bcrypt extension for password hashing
bcrypt = Bcrypt()

# Set SQLite busy_timeout at connection level to prevent database locks
@event.listens_for(Engine, "connect")
def set_sqlite_busy_timeout(dbapi_conn, connection_record):
    """Set busy_timeout for SQLite connections to prevent 'database is locked' errors"""
    try:
        if 'sqlite' in str(dbapi_conn):
            cursor = dbapi_conn.cursor()
            cursor.execute("PRAGMA busy_timeout = 60000")  # 60 seconds in milliseconds
            cursor.close()
    except Exception as e:
        pass  # Silently ignore pragma errors

def create_app():
    """
    Application Factory Function - Creates and configures Flask app
    
    This factory function:
    1. Creates Flask app instance
    2. Loads configuration from Config class
    3. Initializes all extensions (database, bcrypt, CORS)
    4. Registers all API route blueprints
    5. Creates database tables
    6. Sets up error handlers
    
    @return: Configured Flask application instance
    
    Extension Order (Important):
    1. Database: Manages user and patient data
    2. Bcrypt: Hashes passwords for security
    3. CORS: Allows cross-origin requests from frontend
    
    Blueprints Registered:
    - /api/auth - User authentication (login, logout, registration)
    - /api/patients - Patient management (CRUD operations)
    - /api/doctors - Doctor operations (patient lists, appointments)
    - /api/appointments - Appointment scheduling (book, cancel, reschedule)
    - /api/admin - System administration (stats, user management)
    - /api/analytics - Data analytics and reporting
    """
    app = Flask(__name__)
    # Load configuration from Config class (database, security settings, etc.)
    app.config.from_object(Config)
    
    # ========== INITIALIZE EXTENSIONS ==========
    
    # Initialize SQLAlchemy database (user/appointment/admin data)
    db.init_app(app)
    
    # Initialize Flask-Bcrypt for password hashing and verification
    bcrypt.init_app(app)
    
    # Configure CORS to allow frontend on localhost:5173 to make requests
    CORS(app, 
         origins=app.config['CORS_ORIGINS'],
         supports_credentials=True
    )
    
    # ========== REGISTER BLUEPRINTS ==========
    # Import and register all API route modules
    
    from app.routes.auth import auth_bp
    from app.routes.patients import patients_bp
    from app.routes.doctors import doctors_bp
    from app.routes.appointments import appointments_bp
    from app.routes.admin import admin_bp
    from app.routes.analytics import analytics_bp
    
    # Register each blueprint with /api/ prefix
    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    app.register_blueprint(patients_bp, url_prefix='/api/patients')
    app.register_blueprint(doctors_bp, url_prefix='/api/doctors')
    app.register_blueprint(appointments_bp, url_prefix='/api/appointments')
    app.register_blueprint(admin_bp, url_prefix='/api/admin')
    app.register_blueprint(analytics_bp, url_prefix='/api/analytics')
    
    # ========== DATABASE INITIALIZATION ==========
    
    # Create all database tables and populate with initial data
    with app.app_context():
        try:
            # Create database tables based on model definitions
            db.create_all()
            
            # Note: WAL mode and other optimizations are set via SQLALCHEMY_ENGINE_OPTIONS in config.py
            print("✅ Database initialized successfully")
        except Exception as e:
            print(f"❌ Database initialization error: {e}")
    
    # ========== ROUTE HANDLERS ==========
    
    @app.route('/api/health')
    def health_check():
        """
        Health Check Endpoint
        
        Returns application status and database info
        Used by frontend to verify backend is available
        
        @return: JSON with status, message, and database type
        """
        from app.services.patient_service import PatientService
        patient_service = PatientService()
        return {
            'status': 'healthy', 
            'message': 'Stroke Care API is running',
            'patient_database': 'mongodb' if patient_service.use_mongodb else 'sqlite'
        }
    
    # ========== ERROR HANDLERS ==========
    
    @app.errorhandler(404)
    def not_found(error):
        """Handle 404 Not Found errors"""
        return {'message': 'Resource not found'}, 404
    
    @app.errorhandler(500)
    def internal_error(error):
        """Handle 500 Internal Server Error"""
        return {'message': 'Internal server error'}, 500
    
    return app

def create_initial_data():
    """
    Populate Database with Initial Demo Data
    
    Creates:
    1. Admin user (for system management)
    2. Doctor user (for testing doctor dashboard)
    3. Patient user (for testing patient dashboard)
    4. Sample patient records (for analytics and doctor dashboard)
    
    Demo Credentials:
    - Admin: username='admin', password='admin123'
    - Doctor: username='doctor', password='doctor123'
    - Patient: username='patient', password='patient123'
    
    Note: Only creates data if it doesn't already exist (idempotent)
    """
    from app.models.user import User
    from app.services.patient_service import PatientService
    
    patient_service = PatientService()
    
    # ========== CREATE ADMIN USER ==========
    admin = User.query.filter_by(username='admin').first()
    if not admin:
        # Create system administrator account
        admin = User(
            username='admin', email='admin@strokecare.com',
            first_name='System', last_name='Administrator', role='admin'
        )
        admin.set_password('admin123')
        db.session.add(admin)
        print("✅ Created admin user")
    
    # ========== CREATE DOCTOR USER ==========
    doctor = User.query.filter_by(username='doctor').first()
    if not doctor:
        # Create doctor account with medical credentials
        doctor = User(
            username='doctor', email='doctor@strokecare.com',
            first_name='John', last_name='Smith', role='doctor',
            specialization='Neurology', license_number='MED123456'
        )
        doctor.set_password('doctor123')
        db.session.add(doctor)
        print("✅ Created doctor user")
    
    # ========== CREATE PATIENT USER ==========
    patient_user = User.query.filter_by(username='patient').first()
    if not patient_user:
        # Create patient account
        patient_user = User(
            username='patient', email='patient@strokecare.com',
            first_name='Jane', last_name='Doe', role='patient',
            phone='+1234567890'
        )
        patient_user.set_password('patient123')
        db.session.add(patient_user)
        print("✅ Created patient user")
    
    # ========== CREATE SAMPLE PATIENT RECORDS ==========
    # Only populate if no patient records exist
    if patient_service.get_all_patients() == []:
        # Sample patients with various stroke risk profiles
        sample_patients = [
            {
                # Low-risk patient
                'gender': 'Male', 'age': 45, 'hypertension': 0, 'heart_disease': 0,
                'ever_married': 'Yes', 'work_type': 'Private', 'Residence_type': 'Urban',
                'avg_glucose_level': 95.0, 'bmi': 26.5, 'smoking_status': 'Never smoked', 'stroke': 0,
                'created_by': 1, 'assigned_doctor_id': 2
            },
            {
                # Higher-risk patient (age, hypertension, higher glucose)
                'gender': 'Female', 'age': 67, 'hypertension': 1, 'heart_disease': 0,
                'ever_married': 'Yes', 'work_type': 'Self-employed', 'Residence_type': 'Rural',
                'avg_glucose_level': 145.0, 'bmi': 28.1, 'smoking_status': 'Formerly smoked', 'stroke': 0,
                'created_by': 1, 'assigned_doctor_id': 2
            }
        ]
        
        # Add each sample patient to database
        for patient_data in sample_patients:
            patient_service.create_patient(patient_data)
        
        print("✅ Created sample patient records")
    
    # Commit all changes to database
    db.session.commit()