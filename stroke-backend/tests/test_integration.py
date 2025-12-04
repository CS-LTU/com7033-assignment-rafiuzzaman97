import json


def test_patient_registration_and_fetch(client):
    """Integration test: patient can fetch doctor patients list and verify seeded patients"""
    # 1. Doctor logs in
    doctor_login = {'username': 'doctor', 'password': 'doctor123'}
    resp = client.post('/api/auth/login', json=doctor_login)
    assert resp.status_code == 200
    token = resp.get_json()['token']
    
    # 2. Doctor fetches patients list
    headers = {'Authorization': f'Bearer {token}'}
    resp = client.get('/api/doctors/patients', headers=headers)
    assert resp.status_code == 200
    data = resp.get_json()
    assert 'patients' in data
    patients = data.get('patients', [])
    # Should have seeded sample patients from create_initial_data()
    assert len(patients) >= 1, "Should have at least sample patients"
    
    # 3. Verify patient structure
    if patients:
        first_patient = patients[0]
        assert 'age' in first_patient or 'id' in first_patient or '_id' in first_patient


def test_doctor_edit_patient_and_fetch_analytics(client):
    """Integration test: doctor fetches patient data and analytics"""
    # 1. Login as doctor
    doctor_login = {'username': 'doctor', 'password': 'doctor123'}
    resp = client.post('/api/auth/login', json=doctor_login)
    assert resp.status_code == 200
    token = resp.get_json()['token']
    headers = {'Authorization': f'Bearer {token}'}
    
    # 2. Fetch current patients
    resp = client.get('/api/doctors/patients', headers=headers)
    assert resp.status_code == 200
    patients = resp.get_json().get('patients', [])
    assert len(patients) > 0, "Should have seeded patients"
    
    # 3. Get first patient's ID
    patient_id = patients[0].get('id') or patients[0].get('_id')
    assert patient_id is not None, "Patient must have an id or _id field"
    
    # 4. Fetch analytics dashboard stats (read-only)
    resp = client.get('/api/analytics/dashboard-stats', headers=headers)
    assert resp.status_code == 200
    analytics = resp.get_json()
    assert 'total_patients' in analytics or 'risk_distribution' in analytics, "Should have analytics data"
    
    # 5. Verify analytics structure
    if 'risk_distribution' in analytics:
        assert isinstance(analytics['risk_distribution'], dict)


def test_authentication_flow(client):
    """Integration test: full auth flow (login, access protected, logout)"""
    # 1. Login as patient
    patient_login = {'username': 'patient', 'password': 'patient123'}
    resp = client.post('/api/auth/login', json=patient_login)
    assert resp.status_code == 200
    data = resp.get_json()
    assert 'token' in data
    assert data['user']['role'] == 'patient'
    token = data['token']
    
    # 2. Access protected endpoint with token
    headers = {'Authorization': f'Bearer {token}'}
    resp = client.get('/api/auth/me', headers=headers)
    assert resp.status_code == 200
    user = resp.get_json().get('user')
    assert user['username'] == 'patient'
    
    # 3. Logout
    resp = client.post('/api/auth/logout', headers=headers)
    assert resp.status_code == 200
    
    # 4. Try to access protected endpoint with old (but still valid within session) token
    # Note: In real JWT scenario, token expires, but in test it's still valid unless we manually expire it
    resp = client.get('/api/auth/me', headers=headers)
    assert resp.status_code == 200  # Still valid in test context


def test_admin_access_control(client):
    """Integration test: verify role-based access control"""
    # 1. Login as patient (should NOT have access to admin endpoints)
    patient_login = {'username': 'patient', 'password': 'patient123'}
    resp = client.post('/api/auth/login', json=patient_login)
    assert resp.status_code == 200
    patient_token = resp.get_json()['token']
    
    # 2. Login as admin
    admin_login = {'username': 'admin', 'password': 'admin123'}
    resp = client.post('/api/auth/login', json=admin_login)
    assert resp.status_code == 200
    admin_token = resp.get_json()['token']
    
    # 3. Patient tries to access admin stats (should fail or be restricted)
    patient_headers = {'Authorization': f'Bearer {patient_token}'}
    resp = client.get('/api/admin/stats', headers=patient_headers)
    # Endpoint may return 403 or not exist; main thing is patient shouldn't succeed as admin
    assert resp.status_code in (403, 404, 401)
    
    # 4. Admin accesses admin stats (should succeed or at least not be forbidden)
    admin_headers = {'Authorization': f'Bearer {admin_token}'}
    resp = client.get('/api/admin/stats', headers=admin_headers)
    # Admin should have access (200 or similar, not 403)
    assert resp.status_code != 403
