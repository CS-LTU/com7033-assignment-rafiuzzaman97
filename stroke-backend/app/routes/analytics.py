from flask import Blueprint, jsonify
from app.models.patient_sqllite import PatientSQLite, db
from app.utils.security import token_required
from sqlalchemy import func

analytics_bp = Blueprint('analytics', __name__)

@analytics_bp.route('/dashboard-stats', methods=['GET'])
@token_required
def get_dashboard_stats(current_user):
    """Get comprehensive analytics from ALL patients in the database"""
    
    try:
        # Total statistics - ALL patients
        total_patients = PatientSQLite.query.count()
        stroke_cases = PatientSQLite.query.filter_by(stroke=1).count()
        
        # Risk level distribution - ALL patients
        risk_distribution_result = db.session.query(
            PatientSQLite.risk_level,
            func.count(PatientSQLite.id)
        ).group_by(PatientSQLite.risk_level).all()
        risk_distribution = {risk: count for risk, count in risk_distribution_result}
        
        # Gender distribution - ALL patients
        gender_distribution_result = db.session.query(
            PatientSQLite.gender,
            func.count(PatientSQLite.id)
        ).group_by(PatientSQLite.gender).all()
        gender_distribution = {gender: count for gender, count in gender_distribution_result}
        
        # Age statistics - ALL patients
        age_stats = db.session.query(
            func.avg(PatientSQLite.age),
            func.min(PatientSQLite.age),
            func.max(PatientSQLite.age)
        ).first()
        
        # Average metrics - ALL patients
        avg_glucose = db.session.query(func.avg(PatientSQLite.avg_glucose_level)).scalar()
        avg_bmi = db.session.query(func.avg(PatientSQLite.bmi)).scalar()
        
        # Hypertension and heart disease stats - ALL patients
        hypertension_cases = PatientSQLite.query.filter_by(hypertension=1).count()
        heart_disease_cases = PatientSQLite.query.filter_by(heart_disease=1).count()
        
        return jsonify({
            'total_patients': total_patients,
            'stroke_cases': stroke_cases,
            'risk_distribution': risk_distribution,
            'gender_distribution': gender_distribution,
            'age_stats': {
                'average': float(age_stats[0] or 0),
                'min': age_stats[1] or 0,
                'max': age_stats[2] or 0
            },
            'avg_glucose': float(avg_glucose or 0),
            'avg_bmi': float(avg_bmi or 0),
            'hypertension_cases': hypertension_cases,
            'heart_disease_cases': heart_disease_cases
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@analytics_bp.route('/risk-factors', methods=['GET'])
@token_required
def get_risk_factors(current_user):
    """Get risk factor analysis for ALL patients"""
    try:
        # Hypertension analysis - ALL patients
        hypertension_cases = PatientSQLite.query.filter_by(hypertension=1).count()
        
        # Heart disease analysis - ALL patients
        heart_disease_cases = PatientSQLite.query.filter_by(heart_disease=1).count()
        
        # Smoking analysis - ALL patients
        smoking_stats_result = db.session.query(
            PatientSQLite.smoking_status,
            func.count(PatientSQLite.id)
        ).group_by(PatientSQLite.smoking_status).all()
        smoking_distribution = {status: count for status, count in smoking_stats_result}
        
        return jsonify({
            'hypertension_cases': hypertension_cases,
            'heart_disease_cases': heart_disease_cases,
            'smoking_distribution': smoking_distribution
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500