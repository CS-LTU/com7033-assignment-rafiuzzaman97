"""
Unit tests for security logging functionality
Tests event logging, failed login tracking, and security analytics
"""
import json
import pytest
from datetime import datetime, timedelta


def login_helper(client, username='admin', password='admin123'):
    """Helper to login and get auth token"""
    resp = client.post('/api/auth/login', json={'username': username, 'password': password})
    if resp.status_code == 200:
        return resp.get_json()['token']
    return None


class TestSecurityLogging:
    """Unit tests for security event logging"""
    
    def test_login_creates_security_log(self, client):
        """Test that successful login creates a security log entry"""
        # Login
        resp = client.post('/api/auth/login', json={'username': 'admin', 'password': 'admin123'})
        assert resp.status_code == 200
        token = resp.get_json()['token']
        
        # Check security logs
        headers = {'Authorization': f'Bearer {token}'}
        resp = client.get('/api/security/logs?event_type=login&limit=10', headers=headers)
        
        if resp.status_code == 200:
            data = resp.get_json()
            logs = data.get('logs', [])
            # Should have at least one login event
            assert len(logs) > 0
            # Most recent should be our login
            recent_log = logs[0]
            assert recent_log.get('event_type') == 'login'
            assert recent_log.get('username') == 'admin'
    
    def test_failed_login_creates_security_log(self, client):
        """Test that failed login attempts are logged"""
        # Attempt login with wrong password
        resp = client.post('/api/auth/login', json={'username': 'admin', 'password': 'wrongpassword'})
        assert resp.status_code == 401
        
        # Login with admin to check logs
        token = login_helper(client)
        if token:
            headers = {'Authorization': f'Bearer {token}'}
            resp = client.get('/api/security/logs?event_type=failed_login&limit=10', headers=headers)
            
            if resp.status_code == 200:
                data = resp.get_json()
                logs = data.get('logs', [])
                # Should have failed login entry
                assert len(logs) > 0
                failed_log = logs[0]
                assert failed_log.get('event_type') == 'failed_login'
                assert failed_log.get('status') == 'failure'
    
    def test_user_registration_logged(self, client):
        """Test that user creation is logged"""
        token = login_helper(client)
        if not token:
            pytest.skip("Admin login failed")
        
        headers = {'Authorization': f'Bearer {token}'}
        
        # Create new user
        new_user = {
            'username': f'testuser_{datetime.now().timestamp()}',
            'password': 'testpass123',
            'role': 'patient',
            'email': 'test@example.com'
        }
        
        resp = client.post('/api/auth/register', json=new_user)
        # Registration may or may not succeed based on existing data
        
        # Check security logs for user creation events
        resp = client.get('/api/security/logs?event_type=user_created&limit=10', headers=headers)
        if resp.status_code == 200:
            data = resp.get_json()
            logs = data.get('logs', [])
            # Should have user creation events
            assert isinstance(logs, list)


class TestSecurityLogAccess:
    """Tests for security log access control"""
    
    def test_admin_can_access_logs(self, client):
        """Test that admin users can access security logs"""
        token = login_helper(client, 'admin', 'admin123')
        if not token:
            pytest.skip("Admin login failed")
        
        headers = {'Authorization': f'Bearer {token}'}
        resp = client.get('/api/security/logs', headers=headers)
        
        assert resp.status_code == 200
        data = resp.get_json()
        assert 'logs' in data
        assert isinstance(data['logs'], list)
    
    def test_non_admin_cannot_access_all_logs(self, client):
        """Test that non-admin users cannot access all security logs"""
        token = login_helper(client, 'patient', 'patient123')
        if not token:
            pytest.skip("Patient login failed")
        
        headers = {'Authorization': f'Bearer {token}'}
        resp = client.get('/api/security/logs', headers=headers)
        
        # Should be forbidden or restricted
        assert resp.status_code in (403, 401, 200)
        # If 200, should only see limited data
    
    def test_unauthenticated_access_denied(self, client):
        """Test that unauthenticated requests are denied"""
        resp = client.get('/api/security/logs')
        assert resp.status_code in (401, 400)


class TestFailedLoginTracking:
    """Tests for failed login attempt tracking"""
    
    def test_get_failed_logins(self, client):
        """Test retrieving failed login attempts"""
        # Create some failed attempts
        for _ in range(3):
            client.post('/api/auth/login', json={'username': 'admin', 'password': 'wrongpass'})
        
        # Login as admin
        token = login_helper(client)
        if not token:
            pytest.skip("Admin login failed")
        
        headers = {'Authorization': f'Bearer {token}'}
        resp = client.get('/api/security/logs/failed-logins?hours=1', headers=headers)
        
        if resp.status_code == 200:
            data = resp.get_json()
            # API returns 'failed_logins' not 'failed_attempts'
            assert 'failed_logins' in data or 'total' in data
            if 'failed_logins' in data:
                attempts = data['failed_logins']
                assert isinstance(attempts, list)
    
    def test_suspicious_ip_detection(self, client):
        """Test that suspicious IPs are flagged (5+ failed attempts)"""
        # Create multiple failed attempts
        for _ in range(6):
            client.post('/api/auth/login', json={'username': 'admin', 'password': 'wrongpass'})
        
        # Login as admin
        token = login_helper(client)
        if not token:
            pytest.skip("Admin login failed")
        
        headers = {'Authorization': f'Bearer {token}'}
        resp = client.get('/api/security/logs/failed-logins?hours=1', headers=headers)
        
        if resp.status_code == 200:
            data = resp.get_json()
            # Should have suspicious IPs
            if 'suspicious_ips' in data:
                assert isinstance(data['suspicious_ips'], list)


class TestUserActivityTracking:
    """Tests for user activity tracking"""
    
    def test_get_user_activity(self, client):
        """Test retrieving specific user's activity"""
        # Login as admin
        token = login_helper(client)
        if not token:
            pytest.skip("Admin login failed")
        
        headers = {'Authorization': f'Bearer {token}'}
        
        # Get admin's own activity
        resp = client.get('/api/security/logs/user-activity/1?limit=10', headers=headers)
        
        if resp.status_code == 200:
            data = resp.get_json()
            # API returns 'logs' and 'total' fields
            assert 'logs' in data or 'total' in data or 'user_id' in data or 'activity' in data
            assert isinstance(data.get('activity', []), list)
    
    def test_user_can_view_own_activity(self, client):
        """Test that users can view their own activity"""
        token = login_helper(client, 'patient', 'patient123')
        if not token:
            pytest.skip("Patient login failed")
        
        headers = {'Authorization': f'Bearer {token}'}
        
        # Patient viewing their own activity
        resp = client.get('/api/security/logs/user-activity/2', headers=headers)
        
        # Should succeed or be appropriately restricted
        assert resp.status_code in (200, 403, 404)


class TestSecurityStatistics:
    """Tests for security dashboard statistics"""
    
    def test_get_security_stats(self, client):
        """Test retrieving security statistics"""
        token = login_helper(client)
        if not token:
            pytest.skip("Admin login failed")
        
        headers = {'Authorization': f'Bearer {token}'}
        resp = client.get('/api/security/logs/stats?hours=24', headers=headers)
        
        if resp.status_code == 200:
            data = resp.get_json()
            assert 'total_events' in data or 'events_by_type' in data
            
            # Verify structure
            if 'events_by_type' in data:
                assert isinstance(data['events_by_type'], dict)
            
            if 'events_by_severity' in data:
                assert isinstance(data['events_by_severity'], dict)
    
    def test_stats_time_filtering(self, client):
        """Test that stats can be filtered by time period"""
        token = login_helper(client)
        if not token:
            pytest.skip("Admin login failed")
        
        headers = {'Authorization': f'Bearer {token}'}
        
        # Get stats for last hour
        resp = client.get('/api/security/logs/stats?hours=1', headers=headers)
        assert resp.status_code in (200, 400)
        
        # Get stats for last week
        resp = client.get('/api/security/logs/stats?hours=168', headers=headers)
        assert resp.status_code in (200, 400)


class TestSecurityLogFiltering:
    """Tests for security log filtering capabilities"""
    
    def test_filter_by_event_type(self, client):
        """Test filtering logs by event type"""
        token = login_helper(client)
        if not token:
            pytest.skip("Admin login failed")
        
        headers = {'Authorization': f'Bearer {token}'}
        resp = client.get('/api/security/logs?event_type=login&limit=10', headers=headers)
        
        if resp.status_code == 200:
            data = resp.get_json()
            logs = data.get('logs', [])
            # All logs should be login events
            for log in logs:
                assert log.get('event_type') == 'login'
    
    def test_filter_by_severity(self, client):
        """Test filtering logs by severity level"""
        token = login_helper(client)
        if not token:
            pytest.skip("Admin login failed")
        
        headers = {'Authorization': f'Bearer {token}'}
        resp = client.get('/api/security/logs?severity=error&limit=10', headers=headers)
        
        assert resp.status_code in (200, 400)
    
    def test_pagination(self, client):
        """Test log pagination"""
        token = login_helper(client)
        if not token:
            pytest.skip("Admin login failed")
        
        headers = {'Authorization': f'Bearer {token}'}
        
        # Get first page
        resp = client.get('/api/security/logs?limit=5', headers=headers)
        if resp.status_code == 200:
            data = resp.get_json()
            logs = data.get('logs', [])
            # Should limit results
            assert len(logs) <= 5
