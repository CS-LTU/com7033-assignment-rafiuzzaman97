"""
Authentication Routes - routes/auth.py

API endpoints for user authentication and authorization including:
- User registration (create new accounts)
- User login (verify credentials, issue JWT token)
- Get current user information
- Logout
- Change password
- Refresh authentication token

All sensitive operations are logged for security audit trail.
"""

from flask import Blueprint, request, jsonify, current_app
from app.utils.database import UserOperations
from app.utils.security import token_required, validate_email, validate_password, sanitize_input, log_security_event
from datetime import datetime

# Create authentication blueprint
auth_bp = Blueprint('auth', __name__)

@auth_bp.route('/register', methods=['POST'])
def register():
    """
    User Registration Endpoint
    
    Creates new user account with validation and security checks.
    
    POST /api/auth/register
    
    Request Body (JSON):
    {
        "username": "john_doe",
        "email": "john@example.com",
        "password": "securepassword",
        "first_name": "John",
        "last_name": "Doe",
        "role": "patient",  // or "doctor" or "admin"
        "phone": "+1234567890",  // optional
        "specialization": "Neurology"  // optional, required if role=doctor
    }
    
    Returns:
    - 201: User created successfully with user object
    - 400: Missing required field or validation error
    - 409: Username or email already exists
    
    Security Measures:
    - Input sanitization to prevent XSS
    - Email format validation
    - Password strength validation
    - Unique username and email constraints
    - Role validation (only valid roles allowed)
    - Password hashing with bcrypt
    """
    try:
        data = request.get_json()
        
        # Validate required fields are present
        required_fields = ['username', 'email', 'password', 'first_name', 'last_name', 'role']
        for field in required_fields:
            if not data.get(field):
                return jsonify({'message': f'{field} is required'}), 400
        
        # Sanitize all string inputs to prevent XSS attacks
        username = sanitize_input(data['username'])
        email = sanitize_input(data['email'])
        first_name = sanitize_input(data['first_name'])
        last_name = sanitize_input(data['last_name'])
        role = sanitize_input(data['role'])
        
        # Validate email format
        if not validate_email(email):
            return jsonify({'message': 'Invalid email format'}), 400
        
        # Validate password strength
        is_valid_password, password_msg = validate_password(data['password'])
        if not is_valid_password:
            return jsonify({'message': password_msg}), 400
        
        # Check if username already exists (prevent duplicates)
        if UserOperations.find_by_username(username):
            return jsonify({'message': 'Username already exists'}), 409
        
        # Check if email already exists (prevent duplicates)
        if UserOperations.find_by_email(email):
            return jsonify({'message': 'Email already exists'}), 409
        
        # Validate role is in allowed list
        valid_roles = ['patient', 'doctor', 'admin']
        if role not in valid_roles:
            return jsonify({'message': 'Invalid role'}), 400
        
        # Create new user with validated data
        new_user = UserOperations.create_user(
            username=username,
            email=email,
            password=data['password'],
            role=role,
            first_name=first_name,
            last_name=last_name,
            phone=sanitize_input(data.get('phone', '')),
            # Only set doctor-specific fields if role is doctor
            specialization=sanitize_input(data.get('specialization', '')) if role == 'doctor' else None,
            license_number=sanitize_input(data.get('license_number', '')) if role == 'doctor' else None
        )
        
        if not new_user:
            return jsonify({'message': 'Failed to create user'}), 500
        
        # Log registration event for audit trail
        log_security_event(new_user.id, 'USER_REGISTER', f'User {username} registered successfully', request.remote_addr)
        
        return jsonify({
            'message': 'User registered successfully',
            'user': new_user.to_dict()
        }), 201
        
    except Exception as e:
        # Log error and rollback transaction
        current_app.logger.error(f'Registration error: {str(e)}')
        UserOperations.rollback()
        return jsonify({'message': 'Internal server error'}), 500

@auth_bp.route('/login', methods=['POST'])
def login():
    """
    User Login Endpoint
    
    Authenticates user with credentials and returns JWT token.
    
    POST /api/auth/login
    
    Request Body (JSON):
    {
        "username": "john_doe",
        "password": "securepassword"
    }
    
    Returns:
    - 200: Login successful with token and user object
    - 400: Missing username or password
    - 401: Invalid credentials or account deactivated
    
    Security Measures:
    - Input sanitization
    - Failed login attempt logging
    - Account deactivation check
    - JWT token generation (24 hour expiration)
    - Password comparison using bcrypt (timing-attack safe)
    """
    try:
        # Handle cases where Content-Type might not be set
        if request.content_type != 'application/json':
            # Try to parse as JSON anyway
            try:
                data = request.get_json(force=True)
            except:
                return jsonify({'message': 'Content-Type must be application/json'}), 415
        else:
            data = request.get_json()
        
        # Ensure JSON data was provided
        if not data:
            return jsonify({'message': 'No JSON data provided'}), 400
            
        # Validate required fields
        if not data.get('username') or not data.get('password'):
            return jsonify({'message': 'Username and password are required'}), 400
        
        # Sanitize username input
        original_username = data['username']
        username = sanitize_input(original_username)
        if username != original_username:
            return jsonify({'message': 'Username contains invalid whitespace or characters'}), 400
        password = data['password']
        
        # Look up user in database
        user = UserOperations.find_by_username(username)
        
        # Verify user exists and password matches
        if not user or not user.check_password(password):
            # Log failed login attempt for security audit
            log_security_event(None, 'LOGIN_FAILED', f'Failed login attempt for username: {username}', request.remote_addr)
            return jsonify({'message': 'Invalid username or password'}), 401
        
        # Check if user account is active
        if not user.is_active:
            return jsonify({'message': 'Account is deactivated'}), 401
        
        # Update last login timestamp
        UserOperations.update_last_login(user.id)
        
        # Generate JWT authentication token
        token = user.generate_auth_token()
        
        # Log successful login event for audit trail
        log_security_event(user.id, 'LOGIN_SUCCESS', f'User {username} logged in successfully', request.remote_addr)
        
        return jsonify({
            'message': 'Login successful',
            'token': token,
            'user': user.to_dict()
        }), 200
        
    except Exception as e:
        current_app.logger.error(f'Login error: {str(e)}')
        return jsonify({'message': 'Internal server error'}), 500

@auth_bp.route('/me', methods=['GET'])
@token_required
def get_current_user(current_user):
    """
    Get Current User Information
    
    Returns authenticated user's profile information.
    
    GET /api/auth/me
    Headers: Authorization: Bearer <token>
    
    Returns:
    - 200: User object with current user information
    - 401: Invalid or expired token
    """
    return jsonify({'user': current_user.to_dict()}), 200

@auth_bp.route('/logout', methods=['POST'])
@token_required
def logout(current_user):
    """
    User Logout Endpoint
    
    Logs out authenticated user. Token-based auth means no server-side
    session to invalidate, but logout is logged for audit trail.
    
    POST /api/auth/logout
    Headers: Authorization: Bearer <token>
    
    Returns:
    - 200: Logout successful
    """
    # Log logout event for security audit
    log_security_event(current_user.id, 'LOGOUT', f'User {current_user.username} logged out', request.remote_addr)
    return jsonify({'message': 'Logout successful'}), 200

@auth_bp.route('/change-password', methods=['POST'])
@token_required
def change_password(current_user):
    """
    Change Password Endpoint
    
    Allows authenticated user to change their password.
    Requires current password verification for security.
    
    POST /api/auth/change-password
    Headers: Authorization: Bearer <token>
    
    Request Body (JSON):
    {
        "current_password": "oldpassword",
        "new_password": "newstrongpassword"
    }
    
    Returns:
    - 200: Password changed successfully
    - 400: Missing fields or password validation error
    - 401: Current password is incorrect
    
    Security Measures:
    - Requires current password verification
    - New password validation (strength check)
    - Bcrypt hashing for new password
    - Audit logging of password change
    """
    try:
        data = request.get_json()
        
        # Validate required fields
        if not data.get('current_password') or not data.get('new_password'):
            return jsonify({'message': 'Current password and new password are required'}), 400
        
        # Verify current password is correct
        if not current_user.check_password(data['current_password']):
            return jsonify({'message': 'Current password is incorrect'}), 401
        
        # Validate new password strength
        is_valid_password, password_msg = validate_password(data['new_password'])
        if not is_valid_password:
            return jsonify({'message': password_msg}), 400
        
        # Set new password (will be hashed by set_password method)
        current_user.set_password(data['new_password'])
        UserOperations.update_user(current_user)
        
        # Log password change for security audit
        log_security_event(current_user.id, 'PASSWORD_CHANGE', 'Password changed successfully', request.remote_addr)
        
        return jsonify({'message': 'Password changed successfully'}), 200
        
    except Exception as e:
        current_app.logger.error(f'Password change error: {str(e)}')
        UserOperations.rollback()
        return jsonify({'message': 'Internal server error'}), 500

@auth_bp.route('/refresh', methods=['POST'])
@token_required
def refresh_token(current_user):
    """
    Refresh Authentication Token
    
    Issues new JWT token with extended expiration.
    Used to refresh session before token expires.
    
    POST /api/auth/refresh
    Headers: Authorization: Bearer <token>
    
    Returns:
    - 200: New token with current user information
    - 401: Invalid or expired token
    """
    try:
        # Generate new token with fresh 24-hour expiration
        new_token = current_user.generate_auth_token()
        return jsonify({'token': new_token, 'user': current_user.to_dict()}), 200
    except Exception as e:
        current_app.logger.error(f'Token refresh error: {str(e)}')
        return jsonify({'message': 'Internal server error'}), 500
