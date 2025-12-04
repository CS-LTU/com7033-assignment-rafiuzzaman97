"""
Patient Record Model - models/patient.py

Abstracts patient data storage using SQLite (primary) or MongoDB (optional).
Provides unified interface for patient CRUD operations, medical history, and stroke risk calculation.

This module:
- Creates, retrieves, updates, and deletes patient records
- Calculates stroke risk scores based on medical factors
- Manages patient medical history
- Filters patients by risk level, doctor assignment, demographics
"""

from app.models.patient_sqllite import PatientSQLite, MedicalHistorySQLite
from app.models.user import db
from datetime import datetime
from app.config import Config

class PatientRecord:
    """
    Patient Record Management Class
    
    Unified interface for patient operations regardless of backend storage.
    Currently uses SQLite; MongoDB support available via configuration.
    
    Responsibilities:
    - Patient CRUD operations (Create, Read, Update, Delete)
    - Stroke risk calculation and assessment
    - Medical history management
    - Patient filtering and querying
    - Patient-doctor relationships
    """
    
    def __init__(self):
        """Initialize patient record manager"""
        # Force SQLite as primary storage (MongoDB available via Config if enabled)
        self.use_sqlite = True
    
    def create_patient(self, patient_data):
        """
        Create New Patient Record
        
        Stores patient information and calculates stroke risk score.
        Automatically assigns risk level based on calculated score.
        
        @param patient_data: Dictionary containing patient information
        @return: Patient ID of created record
        
        Required Fields:
        - gender: 'Male' or 'Female'
        - age: Integer (0-120)
        - hypertension: 0 or 1 (boolean flag)
        - heart_disease: 0 or 1 (boolean flag)
        - ever_married: 'Yes' or 'No'
        - work_type: 'Private', 'Self-employed', 'Govt_job', etc.
        - Residence_type: 'Urban' or 'Rural'
        - avg_glucose_level: Float (50-300)
        - bmi: Float (10-60)
        - smoking_status: 'Never smoked', 'Formerly smoked', 'Smokes'
        - stroke: 0 or 1 (has had stroke)
        - created_by: User ID of creator (optional)
        - assigned_doctor_id: Doctor's user ID (optional)
        """
        # Calculate stroke risk score based on patient medical factors
        stroke_risk = self.calculate_stroke_risk(patient_data)
        # Classify risk into High/Medium/Low based on threshold
        risk_level = self.get_risk_level(stroke_risk)
        
        # Create SQLite patient record with calculated risk
        patient = PatientSQLite(
            gender=patient_data['gender'],
            age=patient_data['age'],
            hypertension=patient_data['hypertension'],
            heart_disease=patient_data['heart_disease'],
            ever_married=patient_data['ever_married'],
            work_type=patient_data['work_type'],
            Residence_type=patient_data['Residence_type'],
            avg_glucose_level=patient_data['avg_glucose_level'],
            bmi=patient_data['bmi'],
            smoking_status=patient_data['smoking_status'],
            stroke=patient_data['stroke'],
            stroke_risk=stroke_risk,
            risk_level=risk_level,
            created_by=patient_data.get('created_by'),
            assigned_doctor_id=patient_data.get('assigned_doctor_id')
        )
        
        # Save to database
        db.session.add(patient)
        db.session.commit()
        
        return patient.id
    
    def get_patient(self, patient_id):
        """
        Retrieve Single Patient Record
        
        @param patient_id: ID of patient to retrieve
        @return: Patient dictionary or None if not found
        """
        # Query patient from database
        patient = PatientSQLite.query.get(patient_id)
        # Return dictionary representation or None
        return patient.to_dict() if patient else None
    
    def get_all_patients(self, filters=None):
        """
        Retrieve All Patient Records with Optional Filters
        
        @param filters: Dictionary of filters to apply
        @return: List of patient dictionaries ordered by newest first
        
        Available Filters:
        - risk_level: 'High', 'Medium', or 'Low'
        - gender: 'Male' or 'Female'
        """
        # Start with base query
        query = PatientSQLite.query
        
        # Apply optional filters
        if filters:
            # Filter by stroke risk level
            if 'risk_level' in filters:
                query = query.filter(PatientSQLite.risk_level == filters['risk_level'])
            # Filter by gender
            if 'gender' in filters:
                query = query.filter(PatientSQLite.gender == filters['gender'])
        
        # Execute query ordered by newest first
        patients = query.order_by(PatientSQLite.created_at.desc()).all()
        return [patient.to_dict() for patient in patients]
    
    def get_patients_by_doctor(self, doctor_id=None, filters=None):
        """
        Retrieve Patients Assigned to Specific Doctor
        
        Used by doctor dashboard to show patient list.
        
        @param doctor_id: ID of doctor (optional, filters by assignment)
        @param filters: Additional filters (risk_level, gender)
        @return: List of patient dictionaries
        
        Available Filters:
        - risk_level: 'High', 'Medium', or 'Low'
        - gender: 'Male' or 'Female'
        """
        # Start with base query
        query = PatientSQLite.query
        
        # Filter by assigned doctor if specified
        if doctor_id:
            query = query.filter(PatientSQLite.assigned_doctor_id == doctor_id)
        
        # Apply additional filters
        if filters:
            # Filter by stroke risk level
            if 'risk_level' in filters:
                query = query.filter(PatientSQLite.risk_level == filters['risk_level'])
            # Filter by gender
            if 'gender' in filters:
                query = query.filter(PatientSQLite.gender == filters['gender'])
        
        # Execute query ordered by newest first
        patients = query.order_by(PatientSQLite.created_at.desc()).all()
        return [patient.to_dict() for patient in patients]
    
    def update_patient(self, patient_id, update_data):
        """
        Update Patient Record
        
        Modifies existing patient information and recalculates risk if needed.
        
        @param patient_id: ID of patient to update
        @param update_data: Dictionary of fields to update
        @return: True if update successful, False if patient not found
        """
        # Retrieve patient from database
        patient = PatientSQLite.query.get(patient_id)
        if not patient:
            return False
        
        # Update fields
        for key, value in update_data.items():
            if hasattr(patient, key):
                setattr(patient, key, value)
        
        # Recalculate stroke risk if medical data changed
        if any(field in update_data for field in ['age', 'hypertension', 'heart_disease', 'avg_glucose_level', 'bmi', 'smoking_status']):
            patient_data = patient.to_dict()
            patient_data.update(update_data)
            patient.stroke_risk = self.calculate_stroke_risk(patient_data)
            patient.risk_level = self.get_risk_level(patient.stroke_risk)
        
        patient.updated_at = datetime.utcnow()
        db.session.commit()
        
        return True
    
    def delete_patient(self, patient_id):
        """Delete patient record"""
        patient = PatientSQLite.query.get(patient_id)
        if not patient:
            return False
        
        db.session.delete(patient)
        db.session.commit()
        return True
    
    def calculate_stroke_risk(self, patient_data):
        """Calculate stroke risk based on patient data"""
        risk_score = 0
        
        # Age factor
        age = patient_data.get('age', 0)
        if age > 60:
            risk_score += 30
        elif age > 45:
            risk_score += 15
        
        # Medical conditions
        if patient_data.get('hypertension', 0) == 1:
            risk_score += 25
        if patient_data.get('heart_disease', 0) == 1:
            risk_score += 20
        
        # Lifestyle factors
        glucose_level = patient_data.get('avg_glucose_level', 0)
        if glucose_level > 150:
            risk_score += 15
        elif glucose_level > 120:
            risk_score += 8
        
        bmi = patient_data.get('bmi', 0)
        if bmi > 30:
            risk_score += 10
        elif bmi > 25:
            risk_score += 5
        
        smoking_status = patient_data.get('smoking_status', 'Unknown')
        if smoking_status == 'Smokes':
            risk_score += 10
        elif smoking_status == 'Formerly smoked':
            risk_score += 5
        
        # Previous stroke
        if patient_data.get('stroke', 0) == 1:
            risk_score += 30
        
        return min(risk_score, 100)  # Cap at 100%
    
    def get_risk_level(self, risk_score):
        """Determine risk level based on score"""
        if risk_score >= Config.STROKE_RISK_THRESHOLD_HIGH:
            return 'high'
        elif risk_score >= Config.STROKE_RISK_THRESHOLD_MEDIUM:
            return 'medium'
        else:
            return 'low'
    
    def add_medical_record(self, patient_id, record_data):
        """Add medical record for patient"""
        record = MedicalHistorySQLite(
            patient_id=patient_id,
            record_type=record_data['record_type'],
            description=record_data['description'],
            doctor_id=record_data.get('doctor_id'),
            doctor_name=record_data.get('doctor_name'),
            medications=record_data.get('medications'),
            notes=record_data.get('notes')
        )
        
        db.session.add(record)
        db.session.commit()
        
        return record.id
    
    def get_medical_history(self, patient_id):
        """Get medical history for patient"""
        records = MedicalHistorySQLite.query.filter_by(patient_id=patient_id)\
            .order_by(MedicalHistorySQLite.created_at.desc())\
            .all()
        
        return [record.to_dict() for record in records]