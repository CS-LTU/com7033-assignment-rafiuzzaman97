"""
Appointment Service - services/appointment_service.py

Unified service for appointment operations using MongoDB for storage.
This eliminates SQLite locking issues by using MongoDB which handles concurrent writes better.
"""

from flask import current_app
from pymongo import MongoClient
from bson.objectid import ObjectId
from datetime import datetime
import json


class AppointmentMongoDB:
    """MongoDB-based appointment management"""
    
    def __init__(self, mongo_uri, db_name):
        """Initialize MongoDB connection"""
        try:
            self.client = MongoClient(mongo_uri, serverSelectionTimeoutMS=5000)
            self.db = self.client[db_name]
            self.collection = self.db['appointments']
            
            # Test connection
            self.client.admin.command('ping')
            
            # Create indexes for fast queries
            try:
                self.collection.create_index('patient_id')
                self.collection.create_index('doctor_id')
                self.collection.create_index('appointment_date')
            except:
                pass  # Indexes may already exist
        except Exception as e:
            print(f"Warning: Could not connect to MongoDB: {e}. Appointments will fail.")
            self.collection = None
    
    def is_connected(self):
        """Check if MongoDB is connected"""
        return self.collection is not None
    
    def create_appointment(self, patient_id, doctor_id, appointment_date, appointment_time, 
                          reason, urgency='routine', status='scheduled', notes=None):
        """
        Create new appointment in MongoDB
        
        @param patient_id: Patient user ID (string)
        @param doctor_id: Doctor user ID (string)
        @param appointment_date: Date string (YYYY-MM-DD)
        @param appointment_time: Time string (HH:MM)
        @param reason: Reason for appointment
        @param urgency: Urgency level (routine/urgent/emergency)
        @param status: Appointment status (scheduled/completed/cancelled)
        @param notes: Optional notes
        @return: Created appointment dict with ID
        """
        if not self.is_connected():
            raise Exception("MongoDB not connected")
        
        try:
            appointment = {
                'patient_id': str(patient_id),
                'doctor_id': str(doctor_id),
                'appointment_date': appointment_date,  # Store as string YYYY-MM-DD
                'appointment_time': appointment_time,  # Store as string HH:MM
                'reason': reason,
                'urgency': urgency,
                'status': status,
                'notes': notes,
                'created_at': datetime.utcnow(),
                'updated_at': datetime.utcnow()
            }
            
            result = self.collection.insert_one(appointment)
            appointment['id'] = str(result.inserted_id)
            appointment['_id'] = str(result.inserted_id)
            
            return appointment
        except Exception as e:
            current_app.logger.error(f"Error creating appointment in MongoDB: {str(e)}")
            raise
    
    def create_appointment(self, patient_id, doctor_id, appointment_date, appointment_time, 
                          reason, urgency='routine', status='scheduled', notes=None):
        """
        Create new appointment in MongoDB
        
        @param patient_id: Patient user ID (string)
        @param doctor_id: Doctor user ID (string)
        @param appointment_date: Date string (YYYY-MM-DD)
        @param appointment_time: Time string (HH:MM)
        @param reason: Reason for appointment
        @param urgency: Urgency level (routine/urgent/emergency)
        @param status: Appointment status (scheduled/completed/cancelled)
        @param notes: Optional notes
        @return: Created appointment dict with ID
        """
        try:
            appointment = {
                'patient_id': str(patient_id),
                'doctor_id': str(doctor_id),
                'appointment_date': appointment_date,  # Store as string YYYY-MM-DD
                'appointment_time': appointment_time,  # Store as string HH:MM
                'reason': reason,
                'urgency': urgency,
                'status': status,
                'notes': notes,
                'created_at': datetime.utcnow(),
                'updated_at': datetime.utcnow()
            }
            
            result = self.collection.insert_one(appointment)
            appointment['id'] = str(result.inserted_id)
            appointment['_id'] = str(result.inserted_id)
            
            return appointment
        except Exception as e:
            current_app.logger.error(f"Error creating appointment in MongoDB: {str(e)}")
            raise
    
    def get_appointment(self, appointment_id):
        """Get appointment by ID"""
        try:
            appointment = self.collection.find_one({'_id': ObjectId(appointment_id)})
            if appointment:
                appointment['id'] = str(appointment['_id'])
            return appointment
        except Exception as e:
            current_app.logger.error(f"Error getting appointment: {str(e)}")
            return None
    
    def get_patient_appointments(self, patient_id):
        """Get all appointments for a patient"""
        try:
            appointments = list(self.collection.find(
                {'patient_id': str(patient_id)}
            ).sort('appointment_date', -1))
            
            for apt in appointments:
                apt['id'] = str(apt['_id'])
            return appointments
        except Exception as e:
            current_app.logger.error(f"Error getting patient appointments: {str(e)}")
            return []
    
    def get_doctor_appointments(self, doctor_id):
        """Get all appointments for a doctor"""
        try:
            appointments = list(self.collection.find(
                {'doctor_id': str(doctor_id)}
            ).sort('appointment_date', -1))
            
            for apt in appointments:
                apt['id'] = str(apt['_id'])
            return appointments
        except Exception as e:
            current_app.logger.error(f"Error getting doctor appointments: {str(e)}")
            return []
    
    def get_all_appointments(self):
        """Get all appointments"""
        try:
            appointments = list(self.collection.find().sort('appointment_date', -1))
            
            for apt in appointments:
                apt['id'] = str(apt['_id'])
            return appointments
        except Exception as e:
            current_app.logger.error(f"Error getting all appointments: {str(e)}")
            return []
    
    def update_appointment(self, appointment_id, update_data):
        """Update appointment"""
        try:
            update_data['updated_at'] = datetime.utcnow()
            result = self.collection.update_one(
                {'_id': ObjectId(appointment_id)},
                {'$set': update_data}
            )
            return result.modified_count > 0
        except Exception as e:
            current_app.logger.error(f"Error updating appointment: {str(e)}")
            return False
    
    def cancel_appointment(self, appointment_id):
        """Cancel appointment"""
        return self.update_appointment(appointment_id, {'status': 'cancelled'})
    
    def complete_appointment(self, appointment_id, notes=None):
        """Mark appointment as completed"""
        update_data = {'status': 'completed'}
        if notes:
            update_data['notes'] = notes
        return self.update_appointment(appointment_id, update_data)


# Global appointment service instance
_appointment_service = None


def get_appointment_service():
    """Get or create appointment service instance (lazy initialization)"""
    global _appointment_service
    
    if _appointment_service is None:
        try:
            mongo_uri = current_app.config.get('MONGO_URI', 'mongodb://localhost:27017/')
            db_name = current_app.config.get('MONGO_DB_NAME', 'stroke_care')
            _appointment_service = AppointmentMongoDB(mongo_uri, db_name)
        except Exception as e:
            print(f"Error initializing appointment service: {e}")
            _appointment_service = AppointmentMongoDB('mongodb://localhost:27017/', 'stroke_care')
    
    return _appointment_service
