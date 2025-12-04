from datetime import datetime

from app.config import Config
from app.models.patient_mongodb import PatientRecordMongo
from app.models.patient_sqllite import PatientSQLite, MedicalHistorySQLite
from app.models.user import db


class PatientService:
    def __init__(self):
        self.mongo_service = PatientRecordMongo()
        self.use_mongodb = Config.USE_MONGODB and self.mongo_service.is_connected()

        if self.use_mongodb:
            print("dYs? Using MongoDB for patient data")
        else:
            self.use_mongodb = False
            print("dY'_ Using SQLite for patient data")

    # ------------------------------------------------------------------ #
    # Public API
    # ------------------------------------------------------------------ #
    def create_patient(self, patient_data):
        if self.use_mongodb:
            return self.mongo_service.create_patient(patient_data)
        return self._create_patient_sqlite(patient_data)

    def get_patient(self, patient_id):
        if self.use_mongodb:
            return self.mongo_service.get_patient(patient_id)
        return self._get_patient_sqlite(patient_id)

    def get_patients_by_doctor(self, doctor_id=None, filters=None):
        if self.use_mongodb:
            return self.mongo_service.get_patients_by_doctor(doctor_id, filters)
        return self._get_patients_by_doctor_sqlite(doctor_id, filters)

    def get_all_patients(self, filters=None):
        if self.use_mongodb:
            return self.mongo_service.get_all_patients(filters)
        return self._get_all_patients_sqlite(filters)

    def update_patient(self, patient_id, update_data):
        if self.use_mongodb:
            return self.mongo_service.update_patient(patient_id, update_data)
        return self._update_patient_sqlite(patient_id, update_data)

    def delete_patient(self, patient_id):
        if self.use_mongodb:
            return self.mongo_service.delete_patient(patient_id)
        return self._delete_patient_sqlite(patient_id)

    def add_medical_record(self, patient_id, record_data):
        if self.use_mongodb:
            return self.mongo_service.add_medical_record(patient_id, record_data)
        return self._add_medical_record_sqlite(patient_id, record_data)

    def get_medical_history(self, patient_id):
        if self.use_mongodb:
            return self.mongo_service.get_medical_history(patient_id)
        return self._get_medical_history_sqlite(patient_id)

    # ------------------------------------------------------------------ #
    # SQLite helpers
    # ------------------------------------------------------------------ #
    @staticmethod
    def _coerce_sqlite_id(patient_id):
        try:
            return int(patient_id)
        except (TypeError, ValueError):
            return patient_id

    def _create_patient_sqlite(self, patient_data):
        stroke_risk = self.calculate_stroke_risk(patient_data)
        risk_level = self.get_risk_level(stroke_risk)

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

        db.session.add(patient)
        db.session.commit()
        return patient.id

    def _get_patient_sqlite(self, patient_id):
        patient_id = self._coerce_sqlite_id(patient_id)
        patient = PatientSQLite.query.get(patient_id)
        return patient.to_dict() if patient else None

    def _get_patients_by_doctor_sqlite(self, doctor_id=None, filters=None):
        query = PatientSQLite.query

        if doctor_id:
            query = query.filter(PatientSQLite.assigned_doctor_id == doctor_id)

        if filters:
            if 'risk_level' in filters:
                query = query.filter(PatientSQLite.risk_level == filters['risk_level'])
            if 'gender' in filters:
                query = query.filter(PatientSQLite.gender == filters['gender'])

        patients = query.order_by(PatientSQLite.created_at.desc()).all()
        return [patient.to_dict() for patient in patients]

    def _get_all_patients_sqlite(self, filters=None):
        query = PatientSQLite.query

        if filters:
            if 'risk_level' in filters:
                query = query.filter(PatientSQLite.risk_level == filters['risk_level'])
            if 'gender' in filters:
                query = query.filter(PatientSQLite.gender == filters['gender'])

        patients = query.order_by(PatientSQLite.created_at.desc()).all()
        return [patient.to_dict() for patient in patients]

    def _update_patient_sqlite(self, patient_id, update_data):
        patient_id = self._coerce_sqlite_id(patient_id)
        patient = PatientSQLite.query.get(patient_id)
        if not patient:
            return False

        for key, value in update_data.items():
            if hasattr(patient, key):
                setattr(patient, key, value)

        if any(
            field in update_data
            for field in ['age', 'hypertension', 'heart_disease', 'avg_glucose_level', 'bmi', 'smoking_status']
        ):
            patient_data = patient.to_dict()
            patient_data.update(update_data)
            patient.stroke_risk = self.calculate_stroke_risk(patient_data)
            patient.risk_level = self.get_risk_level(patient.stroke_risk)

        patient.updated_at = datetime.utcnow()
        db.session.commit()
        return True

    def _delete_patient_sqlite(self, patient_id):
        patient_id = self._coerce_sqlite_id(patient_id)
        patient = PatientSQLite.query.get(patient_id)
        if not patient:
            return False

        db.session.delete(patient)
        db.session.commit()
        return True

    def _add_medical_record_sqlite(self, patient_id, record_data):
        patient_id = self._coerce_sqlite_id(patient_id)
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

    def _get_medical_history_sqlite(self, patient_id):
        patient_id = self._coerce_sqlite_id(patient_id)
        records = (
            MedicalHistorySQLite.query.filter_by(patient_id=patient_id)
            .order_by(MedicalHistorySQLite.created_at.desc())
            .all()
        )
        return [record.to_dict() for record in records]

    # ------------------------------------------------------------------ #
    # Risk helpers
    # ------------------------------------------------------------------ #
    def calculate_stroke_risk(self, patient_data):
        risk_score = 0
        age = patient_data.get('age', 0)
        if age > 60:
            risk_score += 30
        elif age > 45:
            risk_score += 15
        if patient_data.get('hypertension', 0) == 1:
            risk_score += 25
        if patient_data.get('heart_disease', 0) == 1:
            risk_score += 20
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
        if patient_data.get('stroke', 0) == 1:
            risk_score += 30
        return min(risk_score, 100)

    def get_risk_level(self, risk_score):
        if risk_score >= 50:
            return 'high'
        elif risk_score >= 25:
            return 'medium'
        else:
            return 'low'
