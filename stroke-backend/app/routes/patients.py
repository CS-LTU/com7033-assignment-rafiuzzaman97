from flask import Blueprint, request, jsonify, current_app
from sqlalchemy.exc import IntegrityError
from app.services.patient_service import PatientService
from app.utils.security import (
    token_required,
    role_required,
    sanitize_input,
    validate_email,
    validate_password,
)
from app.utils.validation import validate_patient_data
from app.models.user import User, db

patients_bp = Blueprint('patients', __name__)
patient_service = PatientService()

PATIENT_FIELDS = [
    'gender',
    'age',
    'hypertension',
    'heart_disease',
    'ever_married',
    'work_type',
    'Residence_type',
    'avg_glucose_level',
    'bmi',
    'smoking_status',
    'stroke'
]

def _convert_patient_numbers(data):
    converted = dict(data)
    int_fields = ['age', 'hypertension', 'heart_disease', 'stroke']
    float_fields = ['avg_glucose_level', 'bmi']
    
    for field in int_fields:
        if field in converted:
            try:
                converted[field] = int(converted[field])
            except (ValueError, TypeError):
                raise ValueError(f'{field} must be a number')
    
    for field in float_fields:
        if field in converted:
            try:
                converted[field] = float(converted[field])
            except (ValueError, TypeError):
                raise ValueError(f'{field} must be a number')
    
    return converted

def _prepare_patient_payload(converted_data):
    payload = {}
    for field in PATIENT_FIELDS:
        if field in converted_data:
            value = converted_data[field]
            if isinstance(value, str):
                payload[field] = sanitize_input(value)
            else:
                payload[field] = value
    return payload

@patients_bp.route('/register', methods=['POST'])
@token_required          # ← This runs first, adds current_user as first param
@role_required(['admin', 'doctor'])  # ← This runs second, receives current_user
def register_patient(current_user):
    try:
        data = request.get_json() or {}
        
        for field in PATIENT_FIELDS:
            if field not in data:
                return jsonify({'message': f'{field} is required'}), 400
        
        try:
            converted_data = _convert_patient_numbers(data)
        except ValueError as conv_error:
            return jsonify({'message': str(conv_error)}), 400
        
        validation_errors = validate_patient_data(converted_data)
        if validation_errors:
            return jsonify({'message': 'Validation errors', 'errors': validation_errors}), 400
        
        sanitized_data = _prepare_patient_payload(converted_data)
        
        sanitized_data['created_by'] = current_user.id
        sanitized_data['assigned_doctor_id'] = current_user.id if current_user.role == 'doctor' else None
        
        patient_id = patient_service.create_patient(sanitized_data)
        
        if patient_id:
            return jsonify({
                'message': 'Patient registered successfully',
                'patient_id': patient_id
            }), 201
        else:
            return jsonify({'message': 'Failed to register patient'}), 500
        
    except Exception as e:
        current_app.logger.error(f'Patient registration error: {str(e)}')
        return jsonify({'message': 'Internal server error'}), 500

@patients_bp.route('/self-register', methods=['POST'])
def self_register_patient():
    """
    Public endpoint so patients can submit their information without logging in.
    Also creates a corresponding user account for the patient.
    """
    try:
        data = request.get_json() or {}
        
        for field in PATIENT_FIELDS:
            if field not in data:
                return jsonify({'message': f"{field} is required"}), 400
        
        credential_fields = ['username', 'password', 'email', 'first_name', 'last_name']
        for field in credential_fields:
            if not data.get(field):
                return jsonify({'message': f'{field} is required'}), 400
        
        username = data.get('username', '').strip()
        if not username:
            return jsonify({'message': 'Username is required'}), 400
        if username != sanitize_input(username) or ' ' in username:
            return jsonify({'message': 'Username cannot contain spaces or invalid characters'}), 400
        if len(username) < 3:
            return jsonify({'message': 'Username must be at least 3 characters'}), 400
        if User.query.filter_by(username=username).first():
            return jsonify({'message': 'Username already exists'}), 409
        
        email = data.get('email', '').strip()
        if not email or not validate_email(email):
            return jsonify({'message': 'Valid email is required'}), 400
        if User.query.filter_by(email=email).first():
            return jsonify({'message': 'Email already exists'}), 409
        
        password = data.get('password', '')
        valid_password, password_message = validate_password(password)
        if not valid_password:
            return jsonify({'message': password_message}), 400
        
        try:
            converted_data = _convert_patient_numbers(data)
        except ValueError as conv_error:
            return jsonify({'message': str(conv_error)}), 400

        validation_errors = validate_patient_data(converted_data)
        if validation_errors:
            return jsonify({'message': 'Validation errors', 'errors': validation_errors}), 400

        sanitized_data = _prepare_patient_payload(converted_data)

        first_name = sanitize_input(data.get('first_name', '').strip())
        last_name = sanitize_input(data.get('last_name', '').strip())
        if not first_name or not last_name:
            return jsonify({'message': 'First name and last name are required'}), 400
        
        phone = data.get('phone')
        phone = sanitize_input(phone) if phone else None
        
        user = User(
            username=username,
            email=email,
            first_name=first_name,
            last_name=last_name,
            role='patient',
            phone=phone
        )
        user.set_password(password)
        
        try:
            db.session.add(user)
            db.session.commit()
        except IntegrityError:
            db.session.rollback()
            return jsonify({'message': 'Username or email already exists'}), 409
        
        sanitized_data['created_by'] = user.id
        sanitized_data['assigned_doctor_id'] = None
        
        try:
            patient_id = patient_service.create_patient(sanitized_data)
        except Exception as patient_error:
            db.session.delete(user)
            db.session.commit()
            current_app.logger.error(f'Patient creation error: {patient_error}')
            return jsonify({'message': 'Failed to register patient'}), 500
        
        if patient_id:
            return jsonify({
                'message': 'Patient self-registration submitted successfully',
                'patient_id': patient_id,
                'status': 'pending_review'
            }), 201
        else:
            db.session.delete(user)
            db.session.commit()
            return jsonify({'message': 'Failed to register patient'}), 500
    except Exception as e:
        current_app.logger.error(f'Self registration error: {str(e)}')
        return jsonify({'message': 'Internal server error'}), 500

@patients_bp.route('/', methods=['GET'])
@token_required
def get_patients(current_user):
    try:
        risk_level = request.args.get('risk_level')
        gender = request.args.get('gender')
        
        filters = {}
        if risk_level:
            filters['risk_level'] = risk_level
        if gender:
            filters['gender'] = gender
        
        if current_user.role == 'doctor':
            patients = patient_service.get_patients_by_doctor(current_user.id, filters)
        elif current_user.role == 'admin':
            patients = patient_service.get_all_patients(filters)
        else:
            return jsonify({'message': 'Insufficient permissions'}), 403
        
        return jsonify({
            'patients': patients,
            'count': len(patients),
            'database': 'mongodb' if patient_service.use_mongodb else 'sqlite'
        }), 200
        
    except Exception as e:
        current_app.logger.error(f'Get patients error: {str(e)}')
        return jsonify({'message': 'Internal server error'}), 500

@patients_bp.route('/<patient_id>', methods=['GET'])
@token_required
def get_patient(current_user, patient_id):
    try:
        patient = patient_service.get_patient(patient_id)
        if not patient:
            return jsonify({'message': 'Patient not found'}), 404
        
        return jsonify({'patient': patient}), 200
        
    except Exception as e:
        current_app.logger.error(f'Get patient error: {str(e)}')
        return jsonify({'message': 'Internal server error'}), 500

@patients_bp.route('/<patient_id>', methods=['PUT'])
@token_required
@role_required(['doctor', 'admin'])
def update_patient(current_user, patient_id):
    try:
        data = request.get_json() or {}
        update_payload = {field: data[field] for field in PATIENT_FIELDS if field in data}
        if not update_payload:
            return jsonify({'message': 'No valid fields provided for update'}), 400

        try:
            converted_data = _convert_patient_numbers(update_payload)
        except ValueError as conv_error:
            return jsonify({'message': str(conv_error)}), 400

        sanitized_data = _prepare_patient_payload(converted_data)

        success = patient_service.update_patient(patient_id, sanitized_data)
        if not success:
            return jsonify({'message': 'Patient not found'}), 404

        updated_patient = patient_service.get_patient(patient_id)
        return jsonify({
            'message': 'Patient updated successfully',
            'patient': updated_patient
        }), 200
    except Exception as e:
        current_app.logger.error(f'Update patient error: {str(e)}')
        return jsonify({'message': 'Internal server error'}), 500

@patients_bp.route('/<patient_id>', methods=['DELETE'])
@token_required
@role_required(['admin'])
def delete_patient(current_user, patient_id):
    try:
        success = patient_service.delete_patient(patient_id)
        if not success:
            return jsonify({'message': 'Patient not found'}), 404
        return jsonify({'message': 'Patient deleted successfully'}), 200
    except Exception as e:
        current_app.logger.error(f'Delete patient error: {str(e)}')
        return jsonify({'message': 'Internal server error'}), 500

@patients_bp.route('/predict/stroke', methods=['POST'])
@token_required
def predict_stroke_risk(current_user):
    try:
        data = request.get_json()
        risk_score = patient_service.calculate_stroke_risk(data)
        risk_level = patient_service.get_risk_level(risk_score)
        
        recommendations = []
        if risk_level == 'high':
            recommendations = [
                "Immediate consultation with neurologist recommended",
                "Regular blood pressure monitoring",
                "Lifestyle modifications advised",
                "Consider medication review"
            ]
        elif risk_level == 'medium':
            recommendations = [
                "Regular follow-up appointments",
                "Monitor risk factors closely",
                "Healthy diet and exercise",
                "Reduce stress levels"
            ]
        else:
            recommendations = [
                "Maintain healthy lifestyle",
                "Regular annual checkups",
                "Continue preventive measures"
            ]
        
        return jsonify({
            'risk_score': risk_score,
            'risk_level': risk_level,
            'recommendations': recommendations
        }), 200
        
    except Exception as e:
        current_app.logger.error(f'Stroke prediction error: {str(e)}')
        return jsonify({'message': 'Internal server error'}), 500
