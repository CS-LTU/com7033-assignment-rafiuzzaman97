from app.models.user import db
from datetime import datetime

class PatientSQLite(db.Model):
    __tablename__ = 'patients'
    
    id = db.Column(db.Integer, primary_key=True)
    gender = db.Column(db.String(10), nullable=False)
    age = db.Column(db.Integer, nullable=False)
    hypertension = db.Column(db.Integer, nullable=False)
    heart_disease = db.Column(db.Integer, nullable=False)
    ever_married = db.Column(db.String(3), nullable=False)
    work_type = db.Column(db.String(20), nullable=False)
    Residence_type = db.Column(db.String(10), nullable=False)
    avg_glucose_level = db.Column(db.Float, nullable=False)
    bmi = db.Column(db.Float, nullable=False)
    smoking_status = db.Column(db.String(20), nullable=False)
    stroke = db.Column(db.Integer, nullable=False)
    stroke_risk = db.Column(db.Float)
    risk_level = db.Column(db.String(10))
    created_by = db.Column(db.Integer, db.ForeignKey('users.id'))
    assigned_doctor_id = db.Column(db.Integer, db.ForeignKey('users.id'))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def to_dict(self):
        return {
            'id': self.id,
            'gender': self.gender,
            'age': self.age,
            'hypertension': self.hypertension,
            'heart_disease': self.heart_disease,
            'ever_married': self.ever_married,
            'work_type': self.work_type,
            'Residence_type': self.Residence_type,
            'avg_glucose_level': self.avg_glucose_level,
            'bmi': self.bmi,
            'smoking_status': self.smoking_status,
            'stroke': self.stroke,
            'stroke_risk': self.stroke_risk,
            'risk_level': self.risk_level,
            'created_by': self.created_by,
            'assigned_doctor_id': self.assigned_doctor_id,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat()
        }

class MedicalHistorySQLite(db.Model):
    __tablename__ = 'medical_history'
    
    id = db.Column(db.Integer, primary_key=True)
    patient_id = db.Column(db.Integer, db.ForeignKey('patients.id'), nullable=False)
    record_type = db.Column(db.String(50), nullable=False)
    description = db.Column(db.Text, nullable=False)
    doctor_id = db.Column(db.Integer, db.ForeignKey('users.id'))
    doctor_name = db.Column(db.String(100))
    medications = db.Column(db.Text)
    notes = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    def to_dict(self):
        return {
            'id': self.id,
            'patient_id': self.patient_id,
            'record_type': self.record_type,
            'description': self.description,
            'doctor_id': self.doctor_id,
            'doctor_name': self.doctor_name,
            'medications': self.medications,
            'notes': self.notes,
            'created_at': self.created_at.isoformat()
        }