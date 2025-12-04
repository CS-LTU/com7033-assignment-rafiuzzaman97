"""
Application Entry Point - run.py

This script starts the Flask backend server for the StrokeCare healthcare system.
Initializes the Flask application and starts the development server.

Usage:
    python run.py
    
The server will start on http://0.0.0.0:5000 in debug mode
"""

from app import create_app

# Create Flask application instance with all configuration, blueprints, and middleware
app = create_app()

# Note: analytics_bp is already registered in create_app()
# No need to manually register it here - uncomment if you want to override the prefix
# app.register_blueprint(analytics_bp, url_prefix='/api/analytics')

if __name__ == '__main__':
    """
    Start Development Server
    
    Parameters:
    - debug=True: Enable debug mode (without reloader to prevent SQLite locking on Windows)
    - use_reloader=False: Disable auto-reload to prevent SQLite connection conflicts
    - host='0.0.0.0': Listen on all network interfaces (allows external access)
    - port=5000: Run on port 5000 (matches frontend API_BASE_URL)
    """
    app.run(debug=True, use_reloader=False, host='0.0.0.0', port=5000)