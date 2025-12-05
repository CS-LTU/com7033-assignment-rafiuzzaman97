# app/routes/security.py
# Security Routes - API endpoints for security log management and monitoring

from flask import Blueprint, request, jsonify
from app.utils.security import token_required, admin_required
from app.models.security_log import SecurityLog
from datetime import datetime, timedelta

# Create security blueprint
security_bp = Blueprint('security', __name__)

@security_bp.route('/logs', methods=['GET'])
@token_required
@admin_required
def get_security_logs(current_user):
    """
    Get Security Logs
    
    Retrieves security logs with optional filtering.
    Admin access required.
    
    GET /api/security/logs
    
    Query Parameters:
    - limit: Maximum number of logs to return (default: 100, max: 1000)
    - event_type: Filter by event type (login, logout, user_created, etc.)
    - user_id: Filter by specific user ID
    - severity: Filter by severity (info, warning, error, critical)
    - hours: Time window in hours (default: 168 = 7 days)
    - status: Filter by status (success, failure, warning, error)
    
    Returns:
    - 200: List of security logs
    - 403: Access denied (not admin)
    """
    try:
        # Get query parameters with defaults
        limit = min(int(request.args.get('limit', 100)), 1000)
        event_type = request.args.get('event_type')
        user_id = request.args.get('user_id')
        severity = request.args.get('severity')
        status = request.args.get('status')
        hours = int(request.args.get('hours', 168))  # Default 7 days
        
        # Build query
        query = SecurityLog.query
        
        # Apply time filter
        time_threshold = datetime.utcnow() - timedelta(hours=hours)
        query = query.filter(SecurityLog.created_at >= time_threshold)
        
        # Apply optional filters
        if event_type:
            query = query.filter(SecurityLog.event_type == event_type)
        
        if user_id:
            query = query.filter(SecurityLog.user_id == int(user_id))
        
        if severity:
            query = query.filter(SecurityLog.severity == severity)
        
        if status:
            query = query.filter(SecurityLog.status == status)
        
        # Execute query
        logs = query.order_by(SecurityLog.created_at.desc()).limit(limit).all()
        
        # Convert to dict
        logs_data = [log.to_dict() for log in logs]
        
        return jsonify({
            'logs': logs_data,
            'total': len(logs_data)
        }), 200
        
    except Exception as e:
        return jsonify({'message': f'Failed to retrieve security logs: {str(e)}'}), 500

@security_bp.route('/logs/failed-logins', methods=['GET'])
@token_required
@admin_required
def get_failed_logins(current_user):
    """
    Get Failed Login Attempts
    
    Retrieves failed login attempts for security monitoring.
    Admin access required.
    
    GET /api/security/logs/failed-logins
    
    Query Parameters:
    - username: Filter by specific username
    - hours: Time window in hours (default: 24)
    - limit: Maximum number of logs to return (default: 100)
    
    Returns:
    - 200: List of failed login attempts
    - 403: Access denied (not admin)
    """
    try:
        username = request.args.get('username')
        hours = int(request.args.get('hours', 24))
        limit = min(int(request.args.get('limit', 100)), 1000)
        
        # Get failed login attempts
        time_threshold = datetime.utcnow() - timedelta(hours=hours)
        query = SecurityLog.query.filter(
            SecurityLog.event_type == 'failed_login',
            SecurityLog.created_at >= time_threshold
        )
        
        if username:
            query = query.filter(SecurityLog.username == username)
        
        logs = query.order_by(SecurityLog.created_at.desc()).limit(limit).all()
        
        # Group by IP address to detect patterns
        ip_attempts = {}
        for log in logs:
            ip = log.ip_address or 'unknown'
            if ip not in ip_attempts:
                ip_attempts[ip] = []
            ip_attempts[ip].append(log.to_dict())
        
        return jsonify({
            'failed_logins': [log.to_dict() for log in logs],
            'total': len(logs),
            'by_ip': {ip: len(attempts) for ip, attempts in ip_attempts.items()},
            'suspicious_ips': [ip for ip, attempts in ip_attempts.items() if len(attempts) >= 5]
        }), 200
        
    except Exception as e:
        return jsonify({'message': f'Failed to retrieve failed logins: {str(e)}'}), 500

@security_bp.route('/logs/user-activity/<int:user_id>', methods=['GET'])
@token_required
def get_user_activity(current_user, user_id):
    """
    Get User Activity Logs
    
    Retrieves activity logs for a specific user.
    Users can view their own logs, admins can view any user's logs.
    
    GET /api/security/logs/user-activity/<user_id>
    
    Query Parameters:
    - limit: Maximum number of logs to return (default: 100)
    
    Returns:
    - 200: List of user activity logs
    - 403: Access denied (not admin and not own account)
    """
    try:
        # Check authorization (user viewing own logs or admin)
        if current_user.id != user_id and current_user.role != 'admin':
            return jsonify({'message': 'Access denied'}), 403
        
        limit = min(int(request.args.get('limit', 100)), 1000)
        
        # Get user activity
        logs = SecurityLog.query.filter(
            SecurityLog.user_id == user_id
        ).order_by(SecurityLog.created_at.desc()).limit(limit).all()
        
        return jsonify({
            'logs': [log.to_dict() for log in logs],
            'total': len(logs)
        }), 200
        
    except Exception as e:
        return jsonify({'message': f'Failed to retrieve user activity: {str(e)}'}), 500

@security_bp.route('/logs/stats', methods=['GET'])
@token_required
@admin_required
def get_security_stats(current_user):
    """
    Get Security Statistics
    
    Provides overview of security events for dashboard.
    Admin access required.
    
    GET /api/security/logs/stats
    
    Query Parameters:
    - hours: Time window in hours (default: 24)
    
    Returns:
    - 200: Security statistics including:
        - Total events
        - Events by type
        - Events by severity
        - Failed login count
        - Suspicious activity indicators
    """
    try:
        hours = int(request.args.get('hours', 24))
        time_threshold = datetime.utcnow() - timedelta(hours=hours)
        
        # Get all logs in time window
        logs = SecurityLog.query.filter(
            SecurityLog.created_at >= time_threshold
        ).all()
        
        # Calculate statistics
        total_events = len(logs)
        
        # Events by type
        events_by_type = {}
        for log in logs:
            events_by_type[log.event_type] = events_by_type.get(log.event_type, 0) + 1
        
        # Events by severity
        events_by_severity = {}
        for log in logs:
            events_by_severity[log.severity] = events_by_severity.get(log.severity, 0) + 1
        
        # Failed logins
        failed_logins = sum(1 for log in logs if log.event_type == 'failed_login')
        
        # Suspicious IPs (5+ failed logins)
        failed_login_ips = {}
        for log in logs:
            if log.event_type == 'failed_login' and log.ip_address:
                failed_login_ips[log.ip_address] = failed_login_ips.get(log.ip_address, 0) + 1
        
        suspicious_ips = [ip for ip, count in failed_login_ips.items() if count >= 5]
        
        # Recent critical events
        critical_events = [
            log.to_dict() for log in logs 
            if log.severity == 'critical'
        ][:10]
        
        return jsonify({
            'time_window_hours': hours,
            'total_events': total_events,
            'events_by_type': events_by_type,
            'events_by_severity': events_by_severity,
            'failed_logins': failed_logins,
            'suspicious_ips': suspicious_ips,
            'suspicious_ip_count': len(suspicious_ips),
            'critical_events': critical_events
        }), 200
        
    except Exception as e:
        return jsonify({'message': f'Failed to retrieve security stats: {str(e)}'}), 500
