#!/usr/bin/env python3
"""
Add Sample Doctors and Patients to MongoDB

This script adds 15 doctors and 15 patients directly to MongoDB
bypassing SQLite database lock issues.
"""

import sys
import os
from pymongo import MongoClient
from flask_bcrypt import Bcrypt
from datetime import datetime

# MongoDB connection
MONGO_URI = "mongodb://localhost:27017/"
DB_NAME = "stroke_care"

bcrypt = Bcrypt()

def add_sample_users_to_mongodb():
    """Add 15 doctors and 15 patients to MongoDB users collection"""
    
    try:
        # Connect to MongoDB
        client = MongoClient(MONGO_URI)
        db = client[DB_NAME]
        users_collection = db['users']
        
        print("🔧 Adding sample doctors and patients to MongoDB...")
        print(f"📊 Current users in MongoDB: {users_collection.count_documents({})}")
        
        # Sample doctor data
        doctors_data = [
            {"username": "dr_smith", "email": "john.smith@strokecare.com", "first_name": "John", "last_name": "Smith", "specialization": "Neurology"},
            {"username": "dr_johnson", "email": "emily.johnson@strokecare.com", "first_name": "Emily", "last_name": "Johnson", "specialization": "Cardiology"},
            {"username": "dr_williams", "email": "michael.williams@strokecare.com", "first_name": "Michael", "last_name": "Williams", "specialization": "Internal Medicine"},
            {"username": "dr_brown", "email": "sarah.brown@strokecare.com", "first_name": "Sarah", "last_name": "Brown", "specialization": "Emergency Medicine"},
            {"username": "dr_jones", "email": "david.jones@strokecare.com", "first_name": "David", "last_name": "Jones", "specialization": "Neurology"},
            {"username": "dr_garcia", "email": "maria.garcia@strokecare.com", "first_name": "Maria", "last_name": "Garcia", "specialization": "Radiology"},
            {"username": "dr_martinez", "email": "james.martinez@strokecare.com", "first_name": "James", "last_name": "Martinez", "specialization": "Neurosurgery"},
            {"username": "dr_rodriguez", "email": "linda.rodriguez@strokecare.com", "first_name": "Linda", "last_name": "Rodriguez", "specialization": "Physical Medicine"},
            {"username": "dr_wilson", "email": "robert.wilson@strokecare.com", "first_name": "Robert", "last_name": "Wilson", "specialization": "Neurology"},
            {"username": "dr_anderson", "email": "jennifer.anderson@strokecare.com", "first_name": "Jennifer", "last_name": "Anderson", "specialization": "Rehabilitation"},
            {"username": "dr_taylor", "email": "william.taylor@strokecare.com", "first_name": "William", "last_name": "Taylor", "specialization": "Cardiology"},
            {"username": "dr_thomas", "email": "patricia.thomas@strokecare.com", "first_name": "Patricia", "last_name": "Thomas", "specialization": "Internal Medicine"},
            {"username": "dr_moore", "email": "charles.moore@strokecare.com", "first_name": "Charles", "last_name": "Moore", "specialization": "Neurology"},
            {"username": "dr_jackson", "email": "barbara.jackson@strokecare.com", "first_name": "Barbara", "last_name": "Jackson", "specialization": "Emergency Medicine"},
            {"username": "dr_white", "email": "richard.white@strokecare.com", "first_name": "Richard", "last_name": "White", "specialization": "Vascular Surgery"},
        ]
        
        # Sample patient data
        patients_data = [
            {"username": "john_doe", "email": "john.doe@email.com", "first_name": "John", "last_name": "Doe"},
            {"username": "jane_smith", "email": "jane.smith@email.com", "first_name": "Jane", "last_name": "Smith"},
            {"username": "bob_johnson", "email": "bob.johnson@email.com", "first_name": "Bob", "last_name": "Johnson"},
            {"username": "alice_williams", "email": "alice.williams@email.com", "first_name": "Alice", "last_name": "Williams"},
            {"username": "tom_brown", "email": "tom.brown@email.com", "first_name": "Tom", "last_name": "Brown"},
            {"username": "mary_jones", "email": "mary.jones@email.com", "first_name": "Mary", "last_name": "Jones"},
            {"username": "peter_garcia", "email": "peter.garcia@email.com", "first_name": "Peter", "last_name": "Garcia"},
            {"username": "susan_martinez", "email": "susan.martinez@email.com", "first_name": "Susan", "last_name": "Martinez"},
            {"username": "mark_rodriguez", "email": "mark.rodriguez@email.com", "first_name": "Mark", "last_name": "Rodriguez"},
            {"username": "lisa_wilson", "email": "lisa.wilson@email.com", "first_name": "Lisa", "last_name": "Wilson"},
            {"username": "paul_anderson", "email": "paul.anderson@email.com", "first_name": "Paul", "last_name": "Anderson"},
            {"username": "nancy_taylor", "email": "nancy.taylor@email.com", "first_name": "Nancy", "last_name": "Taylor"},
            {"username": "kevin_thomas", "email": "kevin.thomas@email.com", "first_name": "Kevin", "last_name": "Thomas"},
            {"username": "karen_moore", "email": "karen.moore@email.com", "first_name": "Karen", "last_name": "Moore"},
            {"username": "steven_jackson", "email": "steven.jackson@email.com", "first_name": "Steven", "last_name": "Jackson"},
        ]
        
        # Hash password for all users
        doctor_password_hash = bcrypt.generate_password_hash('doctor123').decode('utf-8')
        patient_password_hash = bcrypt.generate_password_hash('patient123').decode('utf-8')
        
        # Add doctors
        print("\n👨‍⚕️ Adding doctors...")
        doctors_created = 0
        for doc in doctors_data:
            # Check if doctor already exists
            existing = users_collection.find_one({"username": doc['username']})
            if not existing:
                doctor_doc = {
                    "username": doc['username'],
                    "email": doc['email'],
                    "password_hash": doctor_password_hash,
                    "role": "doctor",
                    "first_name": doc['first_name'],
                    "last_name": doc['last_name'],
                    "phone": None,
                    "specialization": doc['specialization'],
                    "license_number": f"LIC{1000 + doctors_created}",
                    "is_active": True,
                    "created_at": datetime.utcnow(),
                    "last_login": None
                }
                users_collection.insert_one(doctor_doc)
                doctors_created += 1
                print(f"   ✅ Added doctor: Dr. {doc['first_name']} {doc['last_name']} - {doc['specialization']} (username: {doc['username']})")
            else:
                print(f"   ⚠️  Doctor {doc['username']} already exists, skipping...")
        
        # Add patients
        print("\n🏥 Adding patients...")
        patients_created = 0
        for pat in patients_data:
            # Check if patient already exists
            existing = users_collection.find_one({"username": pat['username']})
            if not existing:
                patient_doc = {
                    "username": pat['username'],
                    "email": pat['email'],
                    "password_hash": patient_password_hash,
                    "role": "patient",
                    "first_name": pat['first_name'],
                    "last_name": pat['last_name'],
                    "phone": None,
                    "specialization": None,
                    "license_number": None,
                    "is_active": True,
                    "created_at": datetime.utcnow(),
                    "last_login": None
                }
                users_collection.insert_one(patient_doc)
                patients_created += 1
                print(f"   ✅ Added patient: {pat['first_name']} {pat['last_name']} (username: {pat['username']})")
            else:
                print(f"   ⚠️  Patient {pat['username']} already exists, skipping...")
        
        # Show summary
        print("\n" + "="*60)
        print("📊 Summary:")
        print(f"   Doctors created: {doctors_created}")
        print(f"   Patients created: {patients_created}")
        print(f"   Total users in MongoDB: {users_collection.count_documents({})}")
        print(f"   - Admins: {users_collection.count_documents({'role': 'admin'})}")
        print(f"   - Doctors: {users_collection.count_documents({'role': 'doctor'})}")
        print(f"   - Patients: {users_collection.count_documents({'role': 'patient'})}")
        print("="*60)
        
        print("\n✅ Sample users added successfully to MongoDB!")
        print("\n🔑 Default credentials:")
        print("   - All doctors: password 'doctor123'")
        print("   - All patients: password 'patient123'")
        
        client.close()
        
    except Exception as e:
        print(f"❌ Error adding sample users to MongoDB: {e}")
        import traceback
        traceback.print_exc()

if __name__ == '__main__':
    add_sample_users_to_mongodb()
