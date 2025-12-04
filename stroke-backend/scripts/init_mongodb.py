# scripts/init_mongodb.py
import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from pymongo import MongoClient
from app.config import Config
import datetime

def init_mongodb():
    print("🚀 Initializing MongoDB Database...")
    config = Config()
    
    try:
        client = MongoClient(config.MONGO_URI)
        
        # Create database by using it
        db = client[config.MONGO_DB_NAME]
        print(f"✅ Database '{config.MONGO_DB_NAME}' created/accessed")
        
        # Create sample data
        users_collection = db['users']
        patients_collection = db['patients']
        
        # Sample users
        sample_users = [
            {
                "username": "admin",
                "email": "admin@strokecare.com",
                "password_hash": "hashed_password_here",  # In real app, use proper hashing
                "role": "admin",
                "created_at": datetime.datetime.utcnow()
            },
            {
                "username": "doctor1",
                "email": "doctor@strokecare.com", 
                "password_hash": "hashed_password_here",
                "role": "doctor",
                "created_at": datetime.datetime.utcnow()
            }
        ]
        
        # Sample patients
        sample_patients = [
            {
                "name": "MongoDB Test Patient 1",
                "email": "mongo.patient1@example.com",
                "age": 65,
                "gender": "male",
                "medical_data": {
                    "blood_pressure": "140/90",
                    "cholesterol_level": 220,
                    "glucose_level": 110,
                    "bmi": 28.5
                },
                "lifestyle_factors": {
                    "smoking_status": "former",
                    "physical_activity": "moderate"
                },
                "medical_history": {
                    "previous_stroke": False,
                    "family_history_stroke": True
                },
                "stroke_risk": 35.5,
                "risk_level": "medium",
                "created_at": datetime.datetime.utcnow()
            },
            {
                "name": "MongoDB Test Patient 2", 
                "email": "mongo.patient2@example.com",
                "age": 72,
                "gender": "female",
                "medical_data": {
                    "blood_pressure": "160/95",
                    "cholesterol_level": 280,
                    "glucose_level": 130,
                    "bmi": 32.1
                },
                "lifestyle_factors": {
                    "smoking_status": "current",
                    "physical_activity": "sedentary"
                },
                "medical_history": {
                    "previous_stroke": True,
                    "family_history_stroke": True
                },
                "stroke_risk": 68.2,
                "risk_level": "high",
                "created_at": datetime.datetime.utcnow()
            }
        ]
        
        # Insert sample data
        users_result = users_collection.insert_many(sample_users)
        patients_result = patients_collection.insert_many(sample_patients)
        
        print(f"✅ Inserted {len(users_result.inserted_ids)} users")
        print(f"✅ Inserted {len(patients_result.inserted_ids)} patients")
        
        # Verify data
        user_count = users_collection.count_documents({})
        patient_count = patients_collection.count_documents({})
        
        print(f"📊 Total users: {user_count}")
        print(f"📊 Total patients: {patient_count}")
        
        client.close()
        print("🎉 MongoDB initialization completed!")
        
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    init_mongodb()