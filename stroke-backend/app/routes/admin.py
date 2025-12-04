from flask import Blueprint, request, jsonify, current_app
from datetime import date
from app.models.user import db, Appointment
from app.utils.database import UserOperations
from app.utils.security import token_required, role_required

admin_bp = Blueprint('admin', __name__)

@admin_bp.route('/stats', methods=['GET'])
@token_required
@role_required(['admin'])
def get_system_stats(current_user):
    try:
        from app.services.patient_service import PatientService
        patient_service = PatientService()
        all_patients = patient_service.get_all_patients()
        total_patients = len(all_patients)

        all_users = UserOperations.find_all()
        total_doctors = len([u for u in all_users if u.role == 'doctor'])
        total_admins = len([u for u in all_users if u.role == 'admin'])
        high_risk_patients = len([p for p in all_patients if p.get('risk_level') == 'high'])
        
        today = date.today()
        today_appointments = Appointment.query.filter_by(appointment_date=today).count()
        
        return jsonify({
            'stats': {
                'total_patients': total_patients,
                'total_doctors': total_doctors,
                'total_admins': total_admins,
                'high_risk_patients': high_risk_patients,
                'today_appointments': today_appointments,
                'total_users': total_patients + total_doctors + total_admins
            }
        }), 200
        
    except Exception as e:
        current_app.logger.error(f'Get system stats error: {str(e)}')
        return jsonify({'message': 'Internal server error'}), 500

@admin_bp.route('/users', methods=['GET'])
@token_required
@role_required(['admin'])
def get_all_users(current_user):
    try:
        role = request.args.get('role')
        users = UserOperations.find_all(role=role)
        
        # Sort by created_at if available
        try:
            users = sorted(users, key=lambda u: u.created_at if hasattr(u, 'created_at') and u.created_at else '', reverse=True)
        except:
            pass
        
        return jsonify({'users': [user.to_dict() for user in users]}), 200
        
    except Exception as e:
        current_app.logger.error(f'Get all users error: {str(e)}')
        return jsonify({'message': 'Internal server error'}), 500

@admin_bp.route('/users', methods=['POST'])
@token_required
@role_required(['admin'])
def create_user(current_user):
    try:
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['username', 'email', 'password', 'first_name', 'last_name', 'role']
        for field in required_fields:
            if field not in data:
                return jsonify({'message': f'Missing required field: {field}'}), 400
        
        # Check if username already exists
        if UserOperations.find_by_username(data['username']):
            return jsonify({'message': 'Username already exists'}), 409
        
        # Check if email already exists
        if UserOperations.find_by_email(data['email']):
            return jsonify({'message': 'Email already exists'}), 409
        
        # Create new user
        new_user = UserOperations.create_user(
            username=data['username'],
            email=data['email'],
            password=data['password'],
            first_name=data['first_name'],
            last_name=data['last_name'],
            role=data['role'],
            phone=data.get('phone', ''),
            specialization=data.get('specialization', '') if data['role'] == 'doctor' else None,
            license_number=data.get('license_number', '') if data['role'] == 'doctor' else None
        )
        
        if not new_user:
            return jsonify({'message': 'Failed to create user'}), 500
        
        return jsonify({
            'message': 'User created successfully',
            'user': new_user.to_dict()
        }), 201
        
    except Exception as e:
        current_app.logger.error(f'Create user error: {str(e)}')
        return jsonify({'message': 'Internal server error'}), 500

@admin_bp.route('/users/<user_id>', methods=['PUT'])
@token_required
@role_required(['admin'])
def update_user(current_user, user_id):
    try:
        user = UserOperations.find_by_id(user_id)
        if not user:
            return jsonify({'message': 'User not found'}), 404
            
        data = request.get_json()
        
        # Update user fields
        if 'is_active' in data:
            user.is_active = data['is_active']
        
        if 'role' in data and data['role'] in ['patient', 'doctor', 'admin']:
            user.role = data['role']
        
        if 'first_name' in data:
            user.first_name = data['first_name']
        
        if 'last_name' in data:
            user.last_name = data['last_name']
        
        if 'email' in data:
            user.email = data['email']
        
        if 'phone' in data:
            user.phone = data['phone']
        
        if 'specialization' in data:
            user.specialization = data['specialization']
        
        if 'license_number' in data:
            user.license_number = data['license_number']
        
        if 'password' in data and data['password']:
            user.set_password(data['password'])
        
        # Save the updated user
        if not UserOperations.update_user(user):
            return jsonify({'message': 'Failed to update user'}), 500
        
        return jsonify({
            'message': 'User updated successfully',
            'user': user.to_dict()
        }), 200
        
    except Exception as e:
        current_app.logger.error(f'Update user error: {str(e)}')
        return jsonify({'message': 'Internal server error'}), 500
