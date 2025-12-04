import re

def validate_patient_data(patient_data):
    errors = []
    
    # Age validation
    age = patient_data.get('age')
    if age is None or age < 0 or age > 120:
        errors.append('Age must be between 0 and 120')
    
    # BMI validation
    bmi = patient_data.get('bmi')
    if bmi is None or bmi < 10 or bmi > 60:
        errors.append('BMI must be between 10 and 60')
    
    # Glucose level validation
    glucose = patient_data.get('avg_glucose_level')
    if glucose is None or glucose < 50 or glucose > 300:
        errors.append('Glucose level must be between 50 and 300')
    
    # Hypertension and heart disease should be 0 or 1
    hypertension = patient_data.get('hypertension')
    if hypertension not in [0, 1]:
        errors.append('Hypertension must be 0 or 1')
    
    heart_disease = patient_data.get('heart_disease')
    if heart_disease not in [0, 1]:
        errors.append('Heart disease must be 0 or 1')
    
    stroke = patient_data.get('stroke')
    if stroke not in [0, 1]:
        errors.append('Stroke must be 0 or 1')
    
    # Gender validation
    valid_genders = ['Male', 'Female', 'Other']
    gender = patient_data.get('gender')
    if gender not in valid_genders:
        errors.append(f'Gender must be one of: {", ".join(valid_genders)}')
    
    # Work type validation
    valid_work_types = ['Private', 'Self-employed', 'Govt_job', 'Children', 'Never_worked']
    work_type = patient_data.get('work_type')
    if work_type not in valid_work_types:
        errors.append(f'Work type must be one of: {", ".join(valid_work_types)}')
    
    # Smoking status validation
    valid_smoking_status = ['Never smoked', 'Smokes', 'Formerly smoked', 'Unknown']
    smoking_status = patient_data.get('smoking_status')
    if smoking_status not in valid_smoking_status:
        errors.append(f'Smoking status must be one of: {", ".join(valid_smoking_status)}')
    
    return errors