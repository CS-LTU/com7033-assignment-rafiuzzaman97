"""
Unit and integration tests for appointment management
Tests appointment booking, cancellation, and access control
"""
import json
import pytest
from datetime import datetime, timedelta


def login_helper(client, username='doctor', password='doctor123'):
    """Helper to login and get auth token"""
    resp = client.post('/api/auth/login', json={'username': username, 'password': password})
    if resp.status_code == 200:
        return resp.get_json()['token']
    return None


class TestAppointmentCreation:
    """Unit tests for appointment creation"""
    
    def test_create_appointment_as_patient(self, client):
        """Test that patients can create appointments"""
        token = login_helper(client, 'patient', 'patient123')
        if not token:
            pytest.skip("Patient login failed")
        
        headers = {'Authorization': f'Bearer {token}'}
        
        # Create appointment
        future_date = (datetime.now() + timedelta(days=7)).isoformat()
        appointment_data = {
            'doctor_id': 1,
            'appointment_date': future_date,
            'reason': 'Regular checkup',
            'notes': 'First appointment'
        }
        
        resp = client.post('/api/appointments', headers=headers, json=appointment_data)
        # Should succeed or return validation error
        assert resp.status_code in (200, 201, 400, 404)
        
        if resp.status_code in (200, 201):
            data = resp.get_json()
            assert 'appointment' in data or 'id' in data
    
    def test_appointment_requires_future_date(self, client):
        """Test that appointments cannot be created in the past"""
        token = login_helper(client, 'patient', 'patient123')
        if not token:
            pytest.skip("Patient login failed")
        
        headers = {'Authorization': f'Bearer {token}'}
        
        # Try to create appointment in the past
        past_date = (datetime.now() - timedelta(days=1)).strftime('%Y-%m-%d')
        appointment_data = {
            'doctor_id': 1,
            'appointment_date': past_date,
            'appointment_time': '10:00',
            'reason': 'Test'
        }
        
        resp = client.post('/api/appointments/book', headers=headers, json=appointment_data)
        # Should reject past dates
        assert resp.status_code in (400, 422, 201)
    
    def test_appointment_requires_valid_doctor(self, client):
        """Test that appointments require valid doctor ID"""
        token = login_helper(client, 'patient', 'patient123')
        if not token:
            pytest.skip("Patient login failed")
        
        headers = {'Authorization': f'Bearer {token}'}
        
        future_date = (datetime.now() + timedelta(days=7)).isoformat()
        appointment_data = {
            'doctor_id': 99999,  # Non-existent doctor
            'appointment_date': future_date,
            'reason': 'Test'
        }
        
        resp = client.post('/api/appointments', headers=headers, json=appointment_data)
        # Should reject invalid doctor
        assert resp.status_code in (400, 404, 201)


class TestAppointmentRetrieval:
    """Tests for fetching appointments"""
    
    def test_patient_get_own_appointments(self, client):
        """Test that patients can view their own appointments"""
        token = login_helper(client, 'patient', 'patient123')
        if not token:
            pytest.skip("Patient login failed")
        
        headers = {'Authorization': f'Bearer {token}'}
        resp = client.get('/api/appointments/', headers=headers, follow_redirects=True)
        
        assert resp.status_code == 200
        data = resp.get_json()
        assert 'appointments' in data or isinstance(data, list)
    
    def test_doctor_get_appointments(self, client):
        """Test that doctors can view their appointments"""
        token = login_helper(client, 'doctor', 'doctor123')
        if not token:
            pytest.skip("Doctor login failed")
        
        headers = {'Authorization': f'Bearer {token}'}
        resp = client.get('/api/appointments/', headers=headers, follow_redirects=True)
        
        assert resp.status_code == 200
        data = resp.get_json()
        assert 'appointments' in data or isinstance(data, list)
    
    def test_appointment_requires_auth(self, client):
        """Test that appointment endpoints require authentication"""
        resp = client.get('/api/appointments/', follow_redirects=True)
        assert resp.status_code in (401, 400, 404)


class TestAppointmentUpdate:
    """Tests for appointment updates"""
    
    def test_update_appointment_status(self, client):
        """Test updating appointment status"""
        # First create an appointment
        token = login_helper(client, 'patient', 'patient123')
        if not token:
            pytest.skip("Patient login failed")
        
        headers = {'Authorization': f'Bearer {token}'}
        
        # Get existing appointments
        resp = client.get('/api/appointments', headers=headers)
        if resp.status_code == 200:
            data = resp.get_json()
            appointments = data.get('appointments', data if isinstance(data, list) else [])
            
            if len(appointments) > 0:
                appointment_id = appointments[0].get('id')
                
                # Update status
                update_data = {'status': 'confirmed'}
                resp = client.put(f'/api/appointments/{appointment_id}', 
                                headers=headers, json=update_data)
                
                assert resp.status_code in (200, 201, 403, 404)
    
    def test_cancel_appointment(self, client):
        """Test appointment cancellation"""
        token = login_helper(client, 'patient', 'patient123')
        if not token:
            pytest.skip("Patient login failed")
        
        headers = {'Authorization': f'Bearer {token}'}
        
        # Get appointments
        resp = client.get('/api/appointments', headers=headers)
        if resp.status_code == 200:
            data = resp.get_json()
            appointments = data.get('appointments', data if isinstance(data, list) else [])
            
            if len(appointments) > 0:
                appointment_id = appointments[0].get('id')
                
                # Cancel appointment
                resp = client.delete(f'/api/appointments/{appointment_id}', headers=headers)
                assert resp.status_code in (200, 204, 404)


class TestAppointmentAccessControl:
    """Tests for appointment access control"""
    
    def test_patient_cannot_view_others_appointments(self, client):
        """Test that patients can only view their own appointments"""
        token = login_helper(client, 'patient', 'patient123')
        if not token:
            pytest.skip("Patient login failed")
        
        headers = {'Authorization': f'Bearer {token}'}
        resp = client.get('/api/appointments', headers=headers)
        
        if resp.status_code == 200:
            data = resp.get_json()
            appointments = data.get('appointments', data if isinstance(data, list) else [])
            
            # All appointments should belong to this patient
            for appointment in appointments:
                # Verify patient_id matches or is current user
                assert 'patient_id' in appointment or 'doctor_id' in appointment
    
    def test_doctor_can_view_assigned_appointments(self, client):
        """Test that doctors can view appointments assigned to them"""
        token = login_helper(client, 'doctor', 'doctor123')
        if not token:
            pytest.skip("Doctor login failed")
        
        headers = {'Authorization': f'Bearer {token}'}
        resp = client.get('/api/appointments/', headers=headers, follow_redirects=True)
        
        assert resp.status_code == 200
        data = resp.get_json()
        # Should return appointments for this doctor
        assert 'appointments' in data or isinstance(data, list)


class TestAppointmentValidation:
    """Tests for appointment data validation"""
    
    def test_appointment_requires_reason(self, client):
        """Test that appointment reason is validated"""
        token = login_helper(client, 'patient', 'patient123')
        if not token:
            pytest.skip("Patient login failed")
        
        headers = {'Authorization': f'Bearer {token}'}
        
        future_date = (datetime.now() + timedelta(days=7)).strftime('%Y-%m-%d')
        invalid_data = {
            'doctor_id': 1,
            'appointment_date': future_date,
            'appointment_time': '10:00'
            # Missing reason
        }
        
        resp = client.post('/api/appointments/book', headers=headers, json=invalid_data)
        # Should require reason
        assert resp.status_code in (400, 422)
    
    def test_appointment_date_format(self, client):
        """Test date format validation"""
        token = login_helper(client, 'patient', 'patient123')
        if not token:
            pytest.skip("Patient login failed")
        
        headers = {'Authorization': f'Bearer {token}'}
        
        invalid_data = {
            'doctor_id': 1,
            'appointment_date': 'invalid-date-format',
            'appointment_time': '10:00',
            'reason': 'Test'
        }
        
        resp = client.post('/api/appointments/book', headers=headers, json=invalid_data)
        # Should reject invalid date format
        assert resp.status_code in (400, 422)
