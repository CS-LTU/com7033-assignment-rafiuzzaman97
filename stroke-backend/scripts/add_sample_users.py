#!/usr/bin/env python3
"""
Add Sample Doctors and Patients

This script adds 15 doctors and 15 patients to the database
with realistic names and credentials.
"""

import sys
import os

# Add parent directory to path to import app modules
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app import create_app
from app.models.user import User, db
from datetime import datetime
import random

def add_sample_users():
    """Add 15 doctors and 15 patients to the database"""
    app = create_app()
    
    with app.app_context():
        print("🔧 Adding sample doctors and patients...")
        
        try:
            # Sample doctor data
            doctors_data = [
                {"username": "dr_smith", "email": "john.smith@strokecare.com", "full_name": "Dr. John Smith"},
                {"username": "dr_johnson", "email": "emily.johnson@strokecare.com", "full_name": "Dr. Emily Johnson"},
                {"username": "dr_williams", "email": "michael.williams@strokecare.com", "full_name": "Dr. Michael Williams"},
                {"username": "dr_brown", "email": "sarah.brown@strokecare.com", "full_name": "Dr. Sarah Brown"},
                {"username": "dr_jones", "email": "david.jones@strokecare.com", "full_name": "Dr. David Jones"},
                {"username": "dr_garcia", "email": "maria.garcia@strokecare.com", "full_name": "Dr. Maria Garcia"},
                {"username": "dr_martinez", "email": "james.martinez@strokecare.com", "full_name": "Dr. James Martinez"},
                {"username": "dr_rodriguez", "email": "linda.rodriguez@strokecare.com", "full_name": "Dr. Linda Rodriguez"},
                {"username": "dr_wilson", "email": "robert.wilson@strokecare.com", "full_name": "Dr. Robert Wilson"},
                {"username": "dr_anderson", "email": "jennifer.anderson@strokecare.com", "full_name": "Dr. Jennifer Anderson"},
                {"username": "dr_taylor", "email": "william.taylor@strokecare.com", "full_name": "Dr. William Taylor"},
                {"username": "dr_thomas", "email": "patricia.thomas@strokecare.com", "full_name": "Dr. Patricia Thomas"},
                {"username": "dr_moore", "email": "charles.moore@strokecare.com", "full_name": "Dr. Charles Moore"},
                {"username": "dr_jackson", "email": "barbara.jackson@strokecare.com", "full_name": "Dr. Barbara Jackson"},
                {"username": "dr_white", "email": "richard.white@strokecare.com", "full_name": "Dr. Richard White"},
            ]
            
            # Sample patient data
            patients_data = [
                {"username": "john_doe", "email": "john.doe@email.com", "full_name": "John Doe"},
                {"username": "jane_smith", "email": "jane.smith@email.com", "full_name": "Jane Smith"},
                {"username": "bob_johnson", "email": "bob.johnson@email.com", "full_name": "Bob Johnson"},
                {"username": "alice_williams", "email": "alice.williams@email.com", "full_name": "Alice Williams"},
                {"username": "tom_brown", "email": "tom.brown@email.com", "full_name": "Tom Brown"},
                {"username": "mary_jones", "email": "mary.jones@email.com", "full_name": "Mary Jones"},
                {"username": "peter_garcia", "email": "peter.garcia@email.com", "full_name": "Peter Garcia"},
                {"username": "susan_martinez", "email": "susan.martinez@email.com", "full_name": "Susan Martinez"},
                {"username": "mark_rodriguez", "email": "mark.rodriguez@email.com", "full_name": "Mark Rodriguez"},
                {"username": "lisa_wilson", "email": "lisa.wilson@email.com", "full_name": "Lisa Wilson"},
                {"username": "paul_anderson", "email": "paul.anderson@email.com", "full_name": "Paul Anderson"},
                {"username": "nancy_taylor", "email": "nancy.taylor@email.com", "full_name": "Nancy Taylor"},
                {"username": "kevin_thomas", "email": "kevin.thomas@email.com", "full_name": "Kevin Thomas"},
                {"username": "karen_moore", "email": "karen.moore@email.com", "full_name": "Karen Moore"},
                {"username": "steven_jackson", "email": "steven.jackson@email.com", "full_name": "Steven Jackson"},
            ]
            
            # Add doctors
            print("\n👨‍⚕️ Adding doctors...")
            doctors_created = 0
            for doc in doctors_data:
                # Check if doctor already exists
                existing = User.query.filter_by(username=doc['username']).first()
                if not existing:
                    doctor = User(
                        username=doc['username'],
                        email=doc['email'],
                        role='doctor'
                    )
                    doctor.set_password('doctor123')  # Default password
                    db.session.add(doctor)
                    doctors_created += 1
                    print(f"   ✅ Added doctor: {doc['full_name']} (username: {doc['username']})")
                else:
                    print(f"   ⚠️  Doctor {doc['username']} already exists, skipping...")
            
            # Add patients
            print("\n🏥 Adding patients...")
            patients_created = 0
            for pat in patients_data:
                # Check if patient already exists
                existing = User.query.filter_by(username=pat['username']).first()
                if not existing:
                    patient = User(
                        username=pat['username'],
                        email=pat['email'],
                        role='patient'
                    )
                    patient.set_password('patient123')  # Default password
                    db.session.add(patient)
                    patients_created += 1
                    print(f"   ✅ Added patient: {pat['full_name']} (username: {pat['username']})")
                else:
                    print(f"   ⚠️  Patient {pat['username']} already exists, skipping...")
            
            # Commit all changes
            db.session.commit()
            
            # Show summary
            print("\n" + "="*60)
            print("📊 Summary:")
            print(f"   Doctors created: {doctors_created}")
            print(f"   Patients created: {patients_created}")
            print(f"   Total users in database: {User.query.count()}")
            print(f"   - Admins: {User.query.filter_by(role='admin').count()}")
            print(f"   - Doctors: {User.query.filter_by(role='doctor').count()}")
            print(f"   - Patients: {User.query.filter_by(role='patient').count()}")
            print("="*60)
            
            print("\n✅ Sample users added successfully!")
            print("\n🔑 Default credentials:")
            print("   - All doctors: password 'doctor123'")
            print("   - All patients: password 'patient123'")
            
        except Exception as e:
            print(f"❌ Error adding sample users: {e}")
            import traceback
            traceback.print_exc()

if __name__ == '__main__':
    add_sample_users()
