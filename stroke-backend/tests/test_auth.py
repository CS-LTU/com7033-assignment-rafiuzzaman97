import json


def test_login_success(client):
    # Use seeded doctor credentials created by create_initial_data
    payload = {'username': 'doctor', 'password': 'doctor123'}
    resp = client.post('/api/auth/login', json=payload)
    assert resp.status_code == 200
    data = resp.get_json()
    assert 'token' in data
    assert data['user']['username'] == 'doctor'


def test_login_bad_credentials(client):
    payload = {'username': 'doctor', 'password': 'wrongpassword'}
    resp = client.post('/api/auth/login', json=payload)
    assert resp.status_code == 401
    data = resp.get_json()
    assert 'Invalid' in data['message'] or 'invalid' in data['message'].lower()
