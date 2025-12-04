from flask import Blueprint, request, jsonify, current_app
from app.models.user import db, User, Appointment
from app.utils.security import token_required, role_required, sanitize_input
from datetime import datetime, date, time

appointments_bp = Blueprint('appointments', __name__)

@appointments_bp.route('/book', methods=['POST'])
@token_required
def book_appointment(current_user):
    """Book appointment using MongoDB (avoids SQLite locking)"""
    try:
        from app.services.appointment_service import get_appointment_service
        
        data = request.get_json()
        required_fields = ['doctor_id', 'appointment_date', 'appointment_time', 'reason']
        for field in required_fields:
            if not data.get(field):
                return jsonify({'message': f'{field} is required'}), 400
        
        # Parse date and time first
        try:
            appointment_date = datetime.strptime(data['appointment_date'], '%Y-%m-%d').date()
            appointment_time = datetime.strptime(data['appointment_time'], '%H:%M').time()
        except ValueError:
            return jsonify({'message': 'Invalid date or time format. Use YYYY-MM-DD for date and HH:MM for time'}), 400
        
        # Check if date is in the future
        if appointment_date < date.today():
            return jsonify({'message': 'Cannot book appointments in the past'}), 400
        
        # Create appointment in MongoDB (no SQLite locking)
        appointment_service = get_appointment_service()
        appointment = appointment_service.create_appointment(
            patient_id=current_user.id,
            doctor_id=data['doctor_id'],
            appointment_date=data['appointment_date'],  # Keep as YYYY-MM-DD string
            appointment_time=data['appointment_time'],  # Keep as HH:MM string
            reason=sanitize_input(data['reason']),
            urgency=data.get('urgency', 'routine'),
            status='scheduled'
        )
        
        return jsonify({
            'message': 'Appointment booked successfully',
            'appointment': {
                'id': appointment['id'],
                'patient_id': appointment['patient_id'],
                'doctor_id': appointment['doctor_id'],
                'appointment_date': appointment['appointment_date'],
                'appointment_time': appointment['appointment_time'],
                'reason': appointment['reason'],
                'urgency': appointment['urgency'],
                'status': appointment['status']
            }
        }), 201
        
    except Exception as e:
        current_app.logger.error(f'Book appointment error: {str(e)}')
        return jsonify({'message': 'Internal server error'}), 500

@appointments_bp.route('/', methods=['GET'])
@token_required
def get_appointments(current_user):
    """Get appointments from MongoDB"""
    try:
        from app.services.appointment_service import get_appointment_service
        
        appointment_service = get_appointment_service()
        
        if current_user.role == 'patient':
            appointments = appointment_service.get_patient_appointments(current_user.id)
        elif current_user.role == 'doctor':
            appointments = appointment_service.get_doctor_appointments(current_user.id)
        else:  # admin
            appointments = appointment_service.get_all_appointments()
        
        # Convert MongoDB format to API format
        formatted_appointments = []
        for apt in appointments:
            formatted_appointments.append({
                'id': apt.get('id') or str(apt.get('_id')),
                'patient_id': apt['patient_id'],
                'doctor_id': apt['doctor_id'],
                'appointment_date': apt['appointment_date'],
                'appointment_time': apt['appointment_time'],
                'reason': apt['reason'],
                'urgency': apt['urgency'],
                'status': apt['status'],
                'notes': apt.get('notes'),
                'created_at': apt.get('created_at'),
                'updated_at': apt.get('updated_at')
            })
        
        return jsonify({'appointments': formatted_appointments}), 200
        
    except Exception as e:
        current_app.logger.error(f'Get appointments error: {str(e)}')
        return jsonify({'message': 'Internal server error'}), 500

@appointments_bp.route('/<appointment_id>/cancel', methods=['POST'])
@token_required
def cancel_appointment(current_user, appointment_id):
    """Cancel appointment in MongoDB"""
    try:
        from app.services.appointment_service import get_appointment_service
        
        appointment_service = get_appointment_service()
        appointment = appointment_service.get_appointment(appointment_id)
        if not appointment:
            return jsonify({'message': 'Appointment not found'}), 404
        
        # Check permissions
        if current_user.role == 'patient' and appointment['patient_id'] != str(current_user.id):
            return jsonify({'message': 'Access denied'}), 403
        if current_user.role == 'doctor' and appointment['doctor_id'] != str(current_user.id):
            return jsonify({'message': 'Access denied'}), 403
        
        appointment_service.cancel_appointment(appointment_id)
        
        return jsonify({'message': 'Appointment cancelled successfully'}), 200
        
    except Exception as e:
        current_app.logger.error(f'Cancel appointment error: {str(e)}')
        return jsonify({'message': 'Internal server error'}), 500

@appointments_bp.route('/<appointment_id>/reschedule', methods=['POST'])
@token_required
def reschedule_appointment(current_user, appointment_id):
    """Reschedule appointment in MongoDB"""
    try:
        from app.services.appointment_service import get_appointment_service
        
        data = request.get_json()
        if not data.get('appointment_date') or not data.get('appointment_time'):
            return jsonify({'message': 'New date and time are required'}), 400
        
        # Validate date and time format
        try:
            appointment_date = datetime.strptime(data['appointment_date'], '%Y-%m-%d').date()
            appointment_time = datetime.strptime(data['appointment_time'], '%H:%M').time()
        except ValueError:
            return jsonify({'message': 'Invalid date or time format. Use YYYY-MM-DD for date and HH:MM for time'}), 400
        
        # Check if date is in the future
        if appointment_date < date.today():
            return jsonify({'message': 'Cannot reschedule to a past date'}), 400
        
        appointment_service = get_appointment_service()
        appointment = appointment_service.get_appointment(appointment_id)
        if not appointment:
            return jsonify({'message': 'Appointment not found'}), 404
        
        # Check permissions
        if current_user.role == 'patient' and appointment['patient_id'] != str(current_user.id):
            return jsonify({'message': 'Access denied'}), 403
        if current_user.role == 'doctor' and appointment['doctor_id'] != str(current_user.id):
            return jsonify({'message': 'Access denied'}), 403
        
        # Update appointment
        update_data = {
            'appointment_date': data['appointment_date'],
            'appointment_time': data['appointment_time']
        }
        
        success = appointment_service.update_appointment(appointment_id, update_data)
        
        if success:
            return jsonify({'message': 'Appointment rescheduled successfully'}), 200
        else:
            return jsonify({'message': 'Failed to reschedule appointment'}), 500
        
    except Exception as e:
        current_app.logger.error(f'Reschedule appointment error: {str(e)}')
        return jsonify({'message': 'Internal server error'}), 500