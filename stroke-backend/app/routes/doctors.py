from flask import Blueprint, request, jsonify, current_app
from app.models.user import User
from app.services.patient_service import PatientService
from app.utils.security import token_required, role_required

# Define the blueprint FIRST
doctors_bp = Blueprint('doctors', __name__)
patient_service = PatientService()

# THEN define the routes
@doctors_bp.route('/', methods=['GET'])
@token_required
def get_doctors(current_user):
    try:
        doctors = User.query.filter_by(role='doctor', is_active=True).all()
        doctors_data = [{
            'id': doctor.id,
            'username': doctor.username,
            'first_name': doctor.first_name,
            'last_name': doctor.last_name,
            'specialization': doctor.specialization,
            'email': doctor.email,
            'phone': doctor.phone
        } for doctor in doctors]
        
        return jsonify({'doctors': doctors_data}), 200
        
    except Exception as e:
        current_app.logger.error(f'Get doctors error: {str(e)}')
        return jsonify({'message': 'Internal server error'}), 500

@doctors_bp.route('/patients', methods=['GET'])
@token_required
@role_required(['doctor'])
def get_doctor_patients(current_user):
    try:
        # Show ALL patients instead of just doctor's assigned patients
        patients = patient_service.get_all_patients()  # Changed from get_patients_by_doctor
        return jsonify({'patients': patients, 'count': len(patients)}), 200
    except Exception as e:
        current_app.logger.error(f'Get doctor patients error: {str(e)}')
        return jsonify({'message': 'Internal server error'}), 500

@doctors_bp.route('/stats', methods=['GET'])
@token_required
@role_required(['doctor'])
def get_doctor_stats(current_user):
    try:
        # Use ALL patients for stats (not just doctor's patients)
        patients = patient_service.get_all_patients()  # Changed from get_patients_by_doctor
        total_patients = len(patients)
        
        # Enhanced risk calculation
        high_risk = len([p for p in patients if p.get('risk_level') == 'high'])
        medium_risk = len([p for p in patients if p.get('risk_level') == 'medium'])
        low_risk = len([p for p in patients if p.get('risk_level') == 'low'])
        
        # Enhanced age groups
        age_groups = {
            'under_40': len([p for p in patients if p.get('age', 0) < 40]),
            '40_59': len([p for p in patients if 40 <= p.get('age', 0) <= 59]),
            'over_60': len([p for p in patients if p.get('age', 0) >= 60])
        }
        
        # Enhanced gender distribution
        gender_dist = {
            'male': len([p for p in patients if p.get('gender') == 'Male']),
            'female': len([p for p in patients if p.get('gender') == 'Female']),
            'other': len([p for p in patients if p.get('gender') not in ['Male', 'Female']])
        }
        
        # Medical conditions
        stroke_cases = len([p for p in patients if p.get('stroke') == 1])
        hypertension_cases = len([p for p in patients if p.get('hypertension') == 1])
        heart_disease_cases = len([p for p in patients if p.get('heart_disease') == 1])
        
        return jsonify({
            'stats': {
                'total_patients': total_patients,
                'risk_distribution': {'high': high_risk, 'medium': medium_risk, 'low': low_risk},
                'age_distribution': age_groups,
                'gender_distribution': gender_dist,
                'average_age': sum(p.get('age', 0) for p in patients) / total_patients if total_patients > 0 else 0,
                'stroke_cases': stroke_cases,
                'hypertension_cases': hypertension_cases,
                'heart_disease_cases': heart_disease_cases
            }
        }), 200
        
    except Exception as e:
        current_app.logger.error(f'Get doctor stats error: {str(e)}')
        return jsonify({'message': 'Internal server error'}), 500