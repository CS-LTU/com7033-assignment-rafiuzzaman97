# Simple MongoDB fallback that always uses SQLite
class PatientRecordMongo:
    def __init__(self):
        # Placeholder: never connects, forces SQLite fallback
        pass
    
    def is_connected(self):
        # Always return false to use SQLite instead of Mongo
        return False
    
    def create_patient(self, patient_data):
        # No-op when Mongo is disabled
        return None
    
    def get_patient(self, patient_id):
        # No-op when Mongo is disabled
        return None
    
    def get_patients_by_doctor(self, doctor_id=None, filters=None):
        # No-op when Mongo is disabled
        return []
    
    def get_all_patients(self, filters=None):
        # No-op when Mongo is disabled
        return []
    
    def update_patient(self, patient_id, update_data):
        # No-op when Mongo is disabled
        return False
    
    def delete_patient(self, patient_id):
        # No-op when Mongo is disabled
        return False
    
    def calculate_stroke_risk(self, patient_data):
        # Compute a basic stroke risk score
        risk_score = 0
        age = patient_data.get('age', 0)
        if age > 60: risk_score += 30
        elif age > 45: risk_score += 15
        if patient_data.get('hypertension', 0) == 1: risk_score += 25
        if patient_data.get('heart_disease', 0) == 1: risk_score += 20
        glucose_level = patient_data.get('avg_glucose_level', 0)
        if glucose_level > 150: risk_score += 15
        elif glucose_level > 120: risk_score += 8
        bmi = patient_data.get('bmi', 0)
        if bmi > 30: risk_score += 10
        elif bmi > 25: risk_score += 5
        smoking_status = patient_data.get('smoking_status', 'Unknown')
        if smoking_status == 'Smokes': risk_score += 10
        elif smoking_status == 'Formerly smoked': risk_score += 5
        if patient_data.get('stroke', 0) == 1: risk_score += 30
        return min(risk_score, 100)
    
    def get_risk_level(self, risk_score):
        # Map numeric risk score to level
        if risk_score >= 50: return 'high'
        elif risk_score >= 25: return 'medium'
        else: return 'low'
    
    def add_medical_record(self, patient_id, record_data):
        # No-op when Mongo is disabled
        return None
    
    def get_medical_history(self, patient_id):
        # No-op when Mongo is disabled
        return []
