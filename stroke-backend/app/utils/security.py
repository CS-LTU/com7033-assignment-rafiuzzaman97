import re
from functools import wraps
from flask import request, jsonify, current_app
import jwt
from app.utils.database import UserOperations

def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = None
        
        # DEBUG: Log all headers to see what's coming in
        current_app.logger.info(f'🔍 ALL HEADERS: {dict(request.headers)}')
        current_app.logger.info(f'🔍 Authorization header present: {"Authorization" in request.headers}')
        
        # Get token from header
        if 'Authorization' in request.headers:
            auth_header = request.headers['Authorization']
            current_app.logger.info(f'🔍 Authorization header value: {auth_header}')
            try:
                token = auth_header.split(' ')[1]  # Bearer <token>
                current_app.logger.info(f'🔍 Extracted token: {token[:20]}...')
            except IndexError:
                current_app.logger.error('🔍 Token format error - could not split Authorization header')
                return jsonify({'message': 'Invalid token format'}), 401
        
        if not token:
            current_app.logger.error('🔍 NO TOKEN FOUND in request')
            return jsonify({'message': 'Token is missing'}), 401
        
        try:
            # Decode the token
            data = jwt.decode(token, current_app.config['SECRET_KEY'], algorithms=['HS256'])
            current_app.logger.info(f'🔍 Decoded token data: {data}')
            
            # Get user from database
            user = UserOperations.find_by_id(data['user_id'])
            if not user:
                current_app.logger.error('🔍 User not found in database')
                return jsonify({'message': 'User not found'}), 401
            
            current_user = user
            current_app.logger.info(f'🔍 Current user: {current_user.username}, Role: {current_user.role}')
            
        except jwt.ExpiredSignatureError:
            current_app.logger.error('🔍 Token expired')
            return jsonify({'message': 'Token has expired'}), 401
        except jwt.InvalidTokenError:
            current_app.logger.error('🔍 Invalid token')
            return jsonify({'message': 'Token is invalid'}), 401
        except Exception as e:
            current_app.logger.error(f'🔍 Token decoding error: {str(e)}')
            return jsonify({'message': 'Token is invalid'}), 401
        
        return f(current_user, *args, **kwargs)
    
    return decorated

def role_required(required_roles):
    """Decorator to require specific role(s)"""
    def decorator(f):
        @wraps(f)
        def decorated_function(current_user, *args, **kwargs):
            # current_user is passed from token_required decorator
            if not current_user:
                return jsonify({'message': 'User not found'}), 401
            
            # Handle both dict and object user types
            user_role = current_user.get('role') if isinstance(current_user, dict) else current_user.role
            
            if user_role not in required_roles:
                return jsonify({'message': 'Insufficient permissions'}), 403
            
            return f(current_user, *args, **kwargs)
        return decorated_function
    return decorator

def validate_email(email):
    """Validate email format"""
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return re.match(pattern, email) is not None

def validate_password(password):
    """Validate password strength"""
    if len(password) < 8:
        return False, 'Password must be at least 8 characters long'
    
    if not re.search(r'[A-Z]', password):
        return False, 'Password must contain at least one uppercase letter'
    
    if not re.search(r'[a-z]', password):
        return False, 'Password must contain at least one lowercase letter'
    
    if not re.search(r'[0-9]', password):
        return False, 'Password must contain at least one number'
    
    return True, 'Password is valid'

def sanitize_input(input_string):
    """Sanitize user input to prevent XSS"""
    if not input_string:
        return input_string
    
    # Remove potentially dangerous characters
    sanitized = re.sub(r'[<>]', '', str(input_string))
    sanitized = re.sub(r'javascript:', '', sanitized, flags=re.IGNORECASE)
    sanitized = re.sub(r'on\w+=', '', sanitized, flags=re.IGNORECASE)
    
    return sanitized.strip()

def log_security_event(user_id, event_type, description, ip_address=None):
    """Log security events"""
    current_app.logger.info(f'Security Event - User: {user_id}, Type: {event_type}, Description: {description}, IP: {ip_address}')