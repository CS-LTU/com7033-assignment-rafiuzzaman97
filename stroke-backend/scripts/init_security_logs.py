#!/usr/bin/env python3
"""
Initialize Security Logs Table

This script creates the security_logs table in the SQLite database
and optionally backfills some sample security events.

Run this after implementing the SecurityLog model to set up the table.
"""

import sys
import os

# Add parent directory to path to import app modules
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app import create_app
from app.models.security_log import SecurityLog
from app.models.user import User, db
from datetime import datetime, timedelta
import random

def init_security_logs():
    """Initialize security logs table and optionally create sample data"""
    app = create_app()
    
    with app.app_context():
        print("🔧 Initializing Security Logs...")
        
        try:
            # Create security_logs table
            db.create_all()
            print("✅ Security logs table created successfully")
            
            # Check if we should create sample data
            existing_logs = SecurityLog.query.count()
            
            if existing_logs == 0:
                print("\n📝 Creating sample security logs...")
                
                # Get all users for sample data
                users = User.query.all()
                
                if not users:
                    print("⚠️  No users found. Run init_db.py first to create sample users.")
                    return
                
                # Sample event types
                events = [
                    ('login', 'User logged in successfully', 'success', 'info'),
                    ('logout', 'User logged out', 'success', 'info'),
                    ('failed_login', 'Failed login attempt - invalid credentials', 'failure', 'warning'),
                    ('user_created', 'New user account created', 'success', 'info'),
                    ('user_updated', 'User profile updated', 'success', 'info'),
                    ('patient_accessed', 'Patient record accessed', 'success', 'info'),
                    ('patient_updated', 'Patient record updated', 'success', 'info'),
                ]
                
                # Create sample logs for the last 7 days
                sample_count = 50
                created_count = 0
                
                for i in range(sample_count):
                    # Random user
                    user = random.choice(users)
                    
                    # Random event
                    event_type, base_desc, status, severity = random.choice(events)
                    
                    # Customize description with user info
                    description = base_desc
                    if 'User' in base_desc:
                        description = base_desc.replace('User', user.username)
                    
                    # Random timestamp in last 7 days
                    days_ago = random.randint(0, 7)
                    hours_ago = random.randint(0, 23)
                    minutes_ago = random.randint(0, 59)
                    timestamp = datetime.utcnow() - timedelta(days=days_ago, hours=hours_ago, minutes=minutes_ago)
                    
                    # Random IP addresses
                    ip_addresses = [
                        '192.168.1.100',
                        '192.168.1.101',
                        '10.0.0.50',
                        '172.16.0.25',
                        '203.0.113.42'  # Some suspicious IPs for testing
                    ]
                    
                    # Create log entry
                    log = SecurityLog(
                        event_type=event_type,
                        event_description=description,
                        user_id=user.id,
                        username=user.username,
                        user_role=user.role,
                        ip_address=random.choice(ip_addresses),
                        user_agent='Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                        status=status,
                        severity=severity,
                        created_at=timestamp
                    )
                    
                    db.session.add(log)
                    created_count += 1
                
                db.session.commit()
                print(f"✅ Created {created_count} sample security log entries")
                
                # Show some statistics
                print("\n📊 Security Log Statistics:")
                print(f"   Total logs: {SecurityLog.query.count()}")
                print(f"   Login events: {SecurityLog.query.filter_by(event_type='login').count()}")
                print(f"   Failed logins: {SecurityLog.query.filter_by(event_type='failed_login').count()}")
                print(f"   User management: {SecurityLog.query.filter(SecurityLog.event_type.in_(['user_created', 'user_updated'])).count()}")
                print(f"   Patient access: {SecurityLog.query.filter(SecurityLog.event_type.in_(['patient_accessed', 'patient_updated'])).count()}")
                
            else:
                print(f"ℹ️  Security logs table already has {existing_logs} entries")
                print("   Skipping sample data creation")
            
            print("\n✅ Security logs initialization complete!")
            
        except Exception as e:
            print(f"❌ Error initializing security logs: {e}")
            import traceback
            traceback.print_exc()

if __name__ == '__main__':
    init_security_logs()
