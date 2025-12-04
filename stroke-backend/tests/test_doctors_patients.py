import json


def login_and_get_token(client, username='doctor', password='doctor123'):
    resp = client.post('/api/auth/login', json={'username': username, 'password': password})
    assert resp.status_code == 200
    return resp.get_json()['token']


def test_get_doctor_patients_requires_auth(client):
    resp = client.get('/api/doctors/patients')
    # Expecting 401 or 401-like due to missing token
    assert resp.status_code in (401, 400)


def test_get_doctor_patients_with_token(client):
    token = login_and_get_token(client)
    headers = {'Authorization': f'Bearer {token}'}
    resp = client.get('/api/doctors/patients', headers=headers)
    assert resp.status_code == 200
    data = resp.get_json()
    assert isinstance(data.get('patients', []), list)
