# app/models/security_log.py
# Security Log Model - tracks all security-related events in the system
# Stores authentication events, user management actions, and data access logs

from datetime import datetime
from app.utils.database import db

class SecurityLog(db.Model):
    """
    Security Log Model
    
    Tracks all security-related events including:
    - User authentication (login, logout, failed attempts)
    - User management (creation, updates, deletions, role changes)
    - Data access (patient record views, modifications)
    - System events (configuration changes, security settings)
    
    Used for:
    - Audit trails for compliance
    - Security monitoring and threat detection
    - Troubleshooting user access issues
    - Forensic analysis after security incidents
    """
    
    __tablename__ = 'security_logs'
    
    # Primary key
    id = db.Column(db.Integer, primary_key=True)
    
    # Event information
    event_type = db.Column(db.String(50), nullable=False, index=True)
    # Event types: 'login', 'logout', 'failed_login', 'user_created', 'user_updated', 
    # 'user_deleted', 'password_changed', 'role_changed', 'patient_accessed', 
    # 'patient_updated', 'appointment_created', 'appointment_cancelled', 'data_export'
    
    event_description = db.Column(db.String(500), nullable=False)
    # Human-readable description of what happened
    
    # User information
    user_id = db.Column(db.Integer, nullable=True)
    # ID of user who performed the action (null for system events or failed logins)
    # Note: No foreign key constraint - allows logs to persist even if user is deleted
    
    username = db.Column(db.String(100), nullable=True)
    # Username stored separately in case user is deleted
    
    user_role = db.Column(db.String(20), nullable=True)
    # Role of user at time of event: 'admin', 'doctor', 'patient'
    
    # Target information (for actions on other entities)
    target_user_id = db.Column(db.Integer, nullable=True)
    # ID of user being affected (for user management actions)
    
    target_username = db.Column(db.String(100), nullable=True)
    # Username of affected user
    
    target_type = db.Column(db.String(50), nullable=True)
    # Type of entity affected: 'user', 'patient', 'appointment', 'system'
    
    target_id = db.Column(db.String(100), nullable=True)
    # ID of affected entity (stored as string to handle both SQLite int and MongoDB ObjectId)
    
    # Request metadata
    ip_address = db.Column(db.String(45), nullable=True)
    # IP address of request (supports IPv4 and IPv6)
    
    user_agent = db.Column(db.String(500), nullable=True)
    # Browser/client user agent string
    
    # Status and severity
    status = db.Column(db.String(20), nullable=False, default='success')
    # Status: 'success', 'failure', 'warning', 'error'
    
    severity = db.Column(db.String(20), nullable=False, default='info')
    # Severity: 'info', 'warning', 'error', 'critical'
    
    # Additional data (JSON string for flexibility)
    additional_data = db.Column(db.Text, nullable=True)
    # JSON string with extra context (e.g., changed fields, error details)
    
    # Timestamps
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow, index=True)
    # When the event occurred (indexed for efficient queries)
    
    def __repr__(self):
        return f'<SecurityLog {self.id}: {self.event_type} by {self.username} at {self.created_at}>'
    
    def to_dict(self):
        """Convert security log to dictionary for JSON serialization"""
        return {
            'id': self.id,
            'event_type': self.event_type,
            'event_description': self.event_description,
            'user_id': self.user_id,
            'username': self.username,
            'user_role': self.user_role,
            'target_user_id': self.target_user_id,
            'target_username': self.target_username,
            'target_type': self.target_type,
            'target_id': self.target_id,
            'ip_address': self.ip_address,
            'user_agent': self.user_agent,
            'status': self.status,
            'severity': self.severity,
            'additional_data': self.additional_data,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }
    
    @staticmethod
    def log_event(event_type, description, user_id=None, username=None, user_role=None,
                  target_user_id=None, target_username=None, target_type=None, target_id=None,
                  ip_address=None, user_agent=None, status='success', severity='info', 
                  additional_data=None):
        """
        Create a new security log entry
        
        @param event_type: Type of event (login, logout, user_created, etc.)
        @param description: Human-readable description
        @param user_id: ID of user performing action
        @param username: Username of user performing action
        @param user_role: Role of user performing action
        @param target_user_id: ID of affected user (for user management)
        @param target_username: Username of affected user
        @param target_type: Type of affected entity
        @param target_id: ID of affected entity
        @param ip_address: Client IP address
        @param user_agent: Client user agent
        @param status: Event status (success, failure, warning, error)
        @param severity: Event severity (info, warning, error, critical)
        @param additional_data: JSON string with extra context
        @return: Created SecurityLog instance
        """
        log = SecurityLog(
            event_type=event_type,
            event_description=description,
            user_id=user_id,
            username=username,
            user_role=user_role,
            target_user_id=target_user_id,
            target_username=target_username,
            target_type=target_type,
            target_id=target_id,
            ip_address=ip_address,
            user_agent=user_agent,
            status=status,
            severity=severity,
            additional_data=additional_data
        )
        
        db.session.add(log)
        db.session.commit()
        
        return log
    
    @staticmethod
    def get_recent_logs(limit=50, event_type=None, user_id=None, severity=None):
        """
        Retrieve recent security logs with optional filters
        
        @param limit: Maximum number of logs to return
        @param event_type: Filter by specific event type
        @param user_id: Filter by specific user
        @param severity: Filter by severity level
        @return: List of SecurityLog instances
        """
        query = SecurityLog.query
        
        if event_type:
            query = query.filter(SecurityLog.event_type == event_type)
        
        if user_id:
            query = query.filter(SecurityLog.user_id == user_id)
        
        if severity:
            query = query.filter(SecurityLog.severity == severity)
        
        return query.order_by(SecurityLog.created_at.desc()).limit(limit).all()
    
    @staticmethod
    def get_failed_login_attempts(username=None, hours=24):
        """
        Get failed login attempts within specified time period
        
        @param username: Filter by specific username
        @param hours: Time window in hours (default 24)
        @return: List of failed login SecurityLog instances
        """
        from datetime import timedelta
        time_threshold = datetime.utcnow() - timedelta(hours=hours)
        
        query = SecurityLog.query.filter(
            SecurityLog.event_type == 'failed_login',
            SecurityLog.created_at >= time_threshold
        )
        
        if username:
            query = query.filter(SecurityLog.username == username)
        
        return query.order_by(SecurityLog.created_at.desc()).all()
    
    @staticmethod
    def get_user_activity(user_id, limit=100):
        """
        Get all activity for a specific user
        
        @param user_id: User ID to retrieve activity for
        @param limit: Maximum number of logs to return
        @return: List of SecurityLog instances
        """
        return SecurityLog.query.filter(
            SecurityLog.user_id == user_id
        ).order_by(SecurityLog.created_at.desc()).limit(limit).all()
