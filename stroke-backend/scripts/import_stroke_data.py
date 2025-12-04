import pandas as pd
import sys
import os

# Add the parent directory to Python path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app import create_app
from app.models.patient_sqllite import PatientSQLite, db
from app.models.user import User
from datetime import datetime

def calculate_stroke_risk(patient_data):
    """Calculate stroke risk score"""
    risk_score = 0
    age = patient_data.get('age', 0)
    if age > 60: risk_score += 30
    elif age > 45: risk_score += 15
    if patient_data.get('hypertension', 0) == 1: risk_score += 25
    if patient_data.get('heart_disease', 0) == 1: risk_score += 20
    
    glucose_level = patient_data.get('avg_glucose_level', 0)
    if glucose_level > 150: risk_score += 15
    elif glucose_level > 120: risk_score += 8
    
    bmi = patient_data.get('bmi', 0)
    if bmi > 30: risk_score += 10
    elif bmi > 25: risk_score += 5
    
    smoking_status = patient_data.get('smoking_status', 'Unknown')
    if smoking_status == 'smokes': risk_score += 10
    elif smoking_status == 'formerly smoked': risk_score += 5
    
    if patient_data.get('stroke', 0) == 1: risk_score += 30
    
    return min(risk_score, 100)

def get_risk_level(risk_score):
    if risk_score >= 50: return 'high'
    elif risk_score >= 25: return 'medium'
    else: return 'low'

def import_stroke_data(csv_file_path, doctor_id=1):
    """Import stroke data from CSV into database"""
    
    # Create app context
    app = create_app()
    
    with app.app_context():
        try:
            # Read CSV file
            print(f"Reading CSV file: {csv_file_path}")
            df = pd.read_csv(csv_file_path)
            
            # Display basic info
            print(f"Found {len(df)} records in CSV")
            print("Columns:", df.columns.tolist())
            
            # Validate required columns
            required_columns = ['gender', 'age', 'hypertension', 'heart_disease', 'ever_married', 
                              'work_type', 'Residence_type', 'avg_glucose_level', 'bmi', 
                              'smoking_status', 'stroke']
            
            missing_columns = [col for col in required_columns if col not in df.columns]
            if missing_columns:
                print(f"ERROR: Missing columns: {missing_columns}")
                return
            
            # Check if we already have data
            existing_count = PatientSQLite.query.count()
            if existing_count > 0:
                print(f"WARNING: Database already has {existing_count} patients")
                response = input("Continue importing? (y/n): ")
                if response.lower() != 'y':
                    print("Import cancelled")
                    return
            
            # Process each row
            successful_imports = 0
            for index, row in df.iterrows():
                try:
                    # Handle missing BMI values
                    bmi_value = row['bmi']
                    if pd.isna(bmi_value) or bmi_value == 'N/A':
                        bmi_value = 25.0  # Default value
                    
                    # Calculate risk
                    patient_data = row.to_dict()
                    risk_score = calculate_stroke_risk(patient_data)
                    risk_level = get_risk_level(risk_score)
                    
                    # Create patient record
                    patient = PatientSQLite(
                        gender=str(row['gender']),
                        age=int(row['age']),
                        hypertension=int(row['hypertension']),
                        heart_disease=int(row['heart_disease']),
                        ever_married=str(row['ever_married']),
                        work_type=str(row['work_type']),
                        Residence_type=str(row['Residence_type']),
                        avg_glucose_level=float(row['avg_glucose_level']),
                        bmi=float(bmi_value),
                        smoking_status=str(row['smoking_status']),
                        stroke=int(row['stroke']),
                        stroke_risk=risk_score,
                        risk_level=risk_level,
                        created_by=doctor_id,  # Assign to admin/doctor
                        assigned_doctor_id=doctor_id,
                        created_at=datetime.utcnow(),
                        updated_at=datetime.utcnow()
                    )
                    
                    db.session.add(patient)
                    successful_imports += 1
                    
                    # Progress indicator
                    if (index + 1) % 100 == 0:
                        print(f"Processed {index + 1} records...")
                        
                except Exception as e:
                    print(f"Error processing row {index}: {e}")
                    continue
            
            # Commit to database
            db.session.commit()
            
            print(f"\n✅ SUCCESS: Imported {successful_imports} patients into database")
            print(f"📊 Total patients in database: {PatientSQLite.query.count()}")
            
            # Show some statistics
            stroke_cases = PatientSQLite.query.filter_by(stroke=1).count()
            high_risk = PatientSQLite.query.filter_by(risk_level='high').count()
            
            print(f"🩺 Stroke cases: {stroke_cases}")
            print(f"⚠️  High risk patients: {high_risk}")
            
        except Exception as e:
            db.session.rollback()
            print(f"❌ ERROR: {e}")

if __name__ == "__main__":
    # Use your specific file path here
    csv_file_path = r"C:\Users\rafi\Downloads\SSD\Assignment_1_Reactjs\healthcare-dataset-stroke-data.csv"
    
    # Make sure the file exists
    if not os.path.exists(csv_file_path):
        print(f"❌ File not found: {csv_file_path}")
        print("Please check the file path and try again")
    else:
        import_stroke_data(csv_file_path)