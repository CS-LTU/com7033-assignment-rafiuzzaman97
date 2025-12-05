# Password Reset Routes
# Handles forgot password, token verification, and password reset functionality

from flask import Blueprint, request, jsonify, current_app
from app.models.user import User, db
from datetime import datetime, timedelta
import secrets
import hashlib

# Create password reset blueprint
password_reset_bp = Blueprint('password_reset', __name__)

# In-memory storage for reset tokens (for demonstration)
# In production, store these in database with expiration timestamps
reset_tokens = {}

def generate_reset_token(email):
    """
    Generate a secure random token for password reset
    
    @param email: User's email address
    @return: Reset token string
    """
    # Generate a secure random token (32 bytes = 64 hex characters)
    token = secrets.token_urlsafe(32)
    
    # Store token with email and expiration time (1 hour)
    reset_tokens[token] = {
        'email': email,
        'expires_at': datetime.utcnow() + timedelta(hours=1)
    }
    
    return token

def verify_reset_token(token):
    """
    Verify if a reset token is valid and not expired
    
    @param token: Reset token to verify
    @return: Email if valid, None if invalid or expired
    """
    if token not in reset_tokens:
        return None
    
    token_data = reset_tokens[token]
    
    # Check if token has expired
    if datetime.utcnow() > token_data['expires_at']:
        # Remove expired token
        del reset_tokens[token]
        return None
    
    return token_data['email']

@password_reset_bp.route('/auth/forgot-password', methods=['POST'])
def forgot_password():
    """
    Request password reset email
    
    POST /api/auth/forgot-password
    {
        "email": "user@example.com"
    }
    
    Returns:
    - 200: Reset email sent successfully
    - 404: Email not found
    - 400: Invalid request
    """
    try:
        data = request.get_json()
        
        if not data or 'email' not in data:
            return jsonify({'message': 'Email is required'}), 400
        
        email = data['email'].strip().lower()
        
        # Find user by email
        user = User.query.filter_by(email=email).first()
        
        if not user:
            # For security, don't reveal if email exists
            # Return success message anyway to prevent email enumeration
            return jsonify({
                'message': 'If an account with that email exists, password reset instructions have been sent'
            }), 200
        
        # Generate reset token
        token = generate_reset_token(email)
        
        # In production, send email with reset link
        # For now, we'll log it to console for demonstration
        reset_link = f"http://localhost:5173/reset-password?token={token}"
        
        print("\n" + "="*60)
        print("🔐 PASSWORD RESET REQUEST")
        print("="*60)
        print(f"User: {user.username}")
        print(f"Email: {email}")
        print(f"Reset Link: {reset_link}")
        print(f"Token expires in: 1 hour")
        print("="*60 + "\n")
        
        # Log the request
        current_app.logger.info(f'Password reset requested for email: {email}')
        
        # TODO: In production, send actual email using SMTP
        # Example:
        # send_email(
        #     to=email,
        #     subject="Password Reset Request",
        #     body=f"Click here to reset your password: {reset_link}"
        # )
        
        return jsonify({
            'message': 'If an account with that email exists, password reset instructions have been sent',
            # For development only - remove in production
            'dev_reset_link': reset_link
        }), 200
        
    except Exception as e:
        current_app.logger.error(f'Forgot password error: {str(e)}')
        return jsonify({'message': 'Internal server error'}), 500

@password_reset_bp.route('/auth/verify-reset-token', methods=['POST'])
def verify_token():
    """
    Verify if a reset token is valid
    
    POST /api/auth/verify-reset-token
    {
        "token": "reset-token-string"
    }
    
    Returns:
    - 200: Token is valid
    - 400: Token is invalid or expired
    """
    try:
        data = request.get_json()
        
        if not data or 'token' not in data:
            return jsonify({'message': 'Token is required'}), 400
        
        token = data['token']
        
        # Verify token
        email = verify_reset_token(token)
        
        if not email:
            return jsonify({'message': 'Invalid or expired reset token'}), 400
        
        return jsonify({
            'message': 'Token is valid',
            'email': email
        }), 200
        
    except Exception as e:
        current_app.logger.error(f'Token verification error: {str(e)}')
        return jsonify({'message': 'Internal server error'}), 500

@password_reset_bp.route('/auth/reset-password', methods=['POST'])
def reset_password():
    """
    Reset user password with valid token
    
    POST /api/auth/reset-password
    {
        "token": "reset-token-string",
        "password": "new-password"
    }
    
    Returns:
    - 200: Password reset successfully
    - 400: Invalid token or password
    - 404: User not found
    """
    try:
        data = request.get_json()
        
        if not data or 'token' not in data or 'password' not in data:
            return jsonify({'message': 'Token and password are required'}), 400
        
        token = data['token']
        new_password = data['password']
        
        # Validate password length
        if len(new_password) < 6:
            return jsonify({'message': 'Password must be at least 6 characters long'}), 400
        
        # Verify token and get email
        email = verify_reset_token(token)
        
        if not email:
            return jsonify({'message': 'Invalid or expired reset token'}), 400
        
        # Find user
        user = User.query.filter_by(email=email).first()
        
        if not user:
            return jsonify({'message': 'User not found'}), 404
        
        # Update password
        user.set_password(new_password)
        db.session.commit()
        
        # Remove used token
        if token in reset_tokens:
            del reset_tokens[token]
        
        # Log the password reset
        current_app.logger.info(f'Password reset successful for user: {user.username}')
        
        print(f"\n✅ Password reset successful for user: {user.username}\n")
        
        return jsonify({
            'message': 'Password has been reset successfully. You can now log in with your new password.'
        }), 200
        
    except Exception as e:
        current_app.logger.error(f'Password reset error: {str(e)}')
        db.session.rollback()
        return jsonify({'message': 'Internal server error'}), 500

@password_reset_bp.route('/auth/clear-expired-tokens', methods=['POST'])
def clear_expired_tokens():
    """
    Admin endpoint to manually clear expired tokens
    (In production, this would run as a scheduled task)
    
    POST /api/auth/clear-expired-tokens
    
    Returns:
    - 200: Expired tokens cleared
    """
    try:
        expired_count = 0
        current_time = datetime.utcnow()
        
        # Find and remove expired tokens
        expired_tokens = [
            token for token, data in reset_tokens.items()
            if current_time > data['expires_at']
        ]
        
        for token in expired_tokens:
            del reset_tokens[token]
            expired_count += 1
        
        return jsonify({
            'message': f'Cleared {expired_count} expired tokens',
            'active_tokens': len(reset_tokens)
        }), 200
        
    except Exception as e:
        current_app.logger.error(f'Clear tokens error: {str(e)}')
        return jsonify({'message': 'Internal server error'}), 500
