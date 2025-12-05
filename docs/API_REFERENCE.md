# StrokeCare Portal - API Reference

Complete API documentation for the StrokeCare backend REST API.

**Base URL**: `http://localhost:5000/api`

---

## Table of Contents
1. [Authentication](#authentication)
2. [Patients](#patients)
3. [Doctors](#doctors)
4. [Appointments](#appointments)
5. [Admin](#admin)
6. [Analytics](#analytics)
7. [Security Logs](#security-logs)
8. [Error Responses](#error-responses)

---

## Authentication

### Register New User
**POST** `/auth/register`

Creates a new user account with specified role.

**Request Body:**
```json
{
  "username": "john_doe",
  "email": "john@example.com",
  "password": "SecurePass123",
  "first_name": "John",
  "last_name": "Doe",
  "role": "patient",
  "phone": "+1234567890",
  "specialization": "Cardiology"  // Required if role=doctor
}
```

**Response:** `201 Created`
```json
{
  "message": "User registered successfully",
  "user": {
    "id": 1,
    "username": "john_doe",
    "email": "john@example.com",
    "role": "patient",
    "created_at": "2025-12-04T10:30:00"
  }
}
```

**Security:** 
- Password hashed with bcrypt
- Input sanitization applied
- Email format validation
- Password strength validation (min 8 chars, uppercase, lowercase, number)
- Event logged to security_logs table

---

### User Login
**POST** `/auth/login`

Authenticates user and returns JWT token.

**Request Body:**
```json
{
  "username": "john_doe",
  "password": "SecurePass123"
}
```

**Response:** `200 OK`
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "username": "john_doe",
    "role": "patient",
    "email": "john@example.com"
  }
}
```

**Security:**
- Failed login attempts logged
- Account deactivation check
- JWT token expires in 24 hours
- Timing-attack safe password comparison

---

### Get Current User
**GET** `/auth/me`

Returns currently authenticated user's information.

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Response:** `200 OK`
```json
{
  "user": {
    "id": 1,
    "username": "john_doe",
    "role": "patient",
    "email": "john@example.com"
  }
}
```

---

## Patients

### Patient Self-Registration
**POST** `/patients/self-register`

Public endpoint for patients to register themselves (creates both user account and patient record).

**Request Body:**
```json
{
  "username": "jane_patient",
  "password": "SecurePass123",
  "email": "jane@example.com",
  "first_name": "Jane",
  "last_name": "Smith",
  "phone": "+1234567890",
  "age": 45,
  "gender": "Female",
  "hypertension": 1,
  "heart_disease": 0,
  "ever_married": "Yes",
  "work_type": "Private",
  "residence_type": "Urban",
  "avg_glucose_level": 95.5,
  "bmi": 28.3,
  "smoking_status": "never smoked"
}
```

**Response:** `201 Created`
```json
{
  "message": "Patient registered successfully",
  "user_id": 5,
  "patient_id": 3
}
```

**Security:**
- Public access (no authentication required)
- Automatically creates role=patient user
- Input validation and sanitization
- Stroke risk automatically calculated

---

### List All Patients
**GET** `/patients`

Retrieves list of all patients (doctor/admin only).

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Query Parameters:**
- `risk_level` (optional): Filter by risk level (High, Medium, Low)
- `gender` (optional): Filter by gender
- `limit` (optional): Max results to return
- `offset` (optional): Pagination offset

**Response:** `200 OK`
```json
{
  "patients": [
    {
      "id": "674f5e8a9c123abc456def01",
      "first_name": "Jane",
      "last_name": "Smith",
      "age": 45,
      "gender": "Female",
      "stroke_risk": 45,
      "risk_level": "Medium",
      "assigned_doctor_id": 2,
      "created_at": "2025-12-04T10:00:00"
    }
  ],
  "total": 1
}
```

**Access:** Doctor, Admin only

---

### Get Patient by ID
**GET** `/patients/<patient_id>`

Retrieves detailed information for specific patient.

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Response:** `200 OK`
```json
{
  "id": "674f5e8a9c123abc456def01",
  "first_name": "Jane",
  "last_name": "Smith",
  "email": "jane@example.com",
  "age": 45,
  "gender": "Female",
  "hypertension": 1,
  "heart_disease": 0,
  "ever_married": "Yes",
  "work_type": "Private",
  "residence_type": "Urban",
  "avg_glucose_level": 95.5,
  "bmi": 28.3,
  "smoking_status": "never smoked",
  "stroke_risk": 45,
  "risk_level": "Medium",
  "assigned_doctor_id": 2,
  "created_at": "2025-12-04T10:00:00",
  "updated_at": "2025-12-04T11:30:00"
}
```

**Access:** Doctor (assigned), Admin, Patient (own record)

---

### Update Patient
**PUT** `/patients/<patient_id>`

Updates patient medical information.

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Request Body:**
```json
{
  "age": 46,
  "avg_glucose_level": 98.2,
  "bmi": 27.5,
  "hypertension": 1
}
```

**Response:** `200 OK`
```json
{
  "message": "Patient updated successfully",
  "patient": { /* updated patient object */ }
}
```

**Security:**
- Stroke risk automatically recalculated
- Input validation applied
- Access control enforced

**Access:** Doctor (assigned), Admin

---

### Delete Patient
**DELETE** `/patients/<patient_id>`

Permanently deletes patient record.

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Response:** `200 OK`
```json
{
  "message": "Patient deleted successfully"
}
```

**Access:** Admin only

---

## Doctors

### List All Doctors
**GET** `/doctors`

Retrieves list of all doctors with their specializations.

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Response:** `200 OK`
```json
{
  "doctors": [
    {
      "id": 2,
      "username": "dr_smith",
      "first_name": "John",
      "last_name": "Smith",
      "email": "dr.smith@hospital.com",
      "specialization": "Neurology",
      "patient_count": 15
    }
  ]
}
```

**Access:** All authenticated users

---

### Get Doctor's Patients
**GET** `/doctors/<doctor_id>/patients`

Retrieves all patients assigned to specific doctor.

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Query Parameters:**
- `risk_level` (optional): Filter by risk level
- `gender` (optional): Filter by gender

**Response:** `200 OK`
```json
{
  "patients": [ /* array of patient objects */ ],
  "total": 10
}
```

**Access:** Doctor (own patients), Admin

---

## Appointments

### Book Appointment
**POST** `/appointments`

Creates new appointment.

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Request Body:**
```json
{
  "doctor_id": 2,
  "appointment_date": "2025-12-10",
  "appointment_time": "14:30",
  "reason": "Routine checkup",
  "notes": "Follow-up on blood pressure"
}
```

**Response:** `201 Created`
```json
{
  "message": "Appointment booked successfully",
  "appointment": {
    "id": 5,
    "patient_id": 3,
    "doctor_id": 2,
    "appointment_date": "2025-12-10",
    "appointment_time": "14:30",
    "status": "scheduled",
    "created_at": "2025-12-04T12:00:00"
  }
}
```

**Access:** Patient (for self), Doctor, Admin

---

### Get User's Appointments
**GET** `/appointments`

Retrieves appointments for current user.

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Query Parameters:**
- `status` (optional): Filter by status (scheduled, completed, cancelled)
- `limit` (optional): Max results

**Response:** `200 OK`
```json
{
  "appointments": [
    {
      "id": 5,
      "patient_name": "Jane Smith",
      "doctor_name": "Dr. John Smith",
      "appointment_date": "2025-12-10",
      "appointment_time": "14:30",
      "status": "scheduled",
      "reason": "Routine checkup"
    }
  ],
  "total": 1
}
```

**Access:** Patient (own), Doctor (assigned), Admin (all)

---

### Reschedule Appointment
**PUT** `/appointments/<appointment_id>/reschedule`

Changes appointment date and time.

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Request Body:**
```json
{
  "new_date": "2025-12-12",
  "new_time": "15:00"
}
```

**Response:** `200 OK`
```json
{
  "message": "Appointment rescheduled successfully",
  "appointment": { /* updated appointment */ }
}
```

**Access:** Patient (own), Doctor (assigned), Admin

---

### Cancel Appointment
**PUT** `/appointments/<appointment_id>/cancel`

Cancels scheduled appointment.

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Response:** `200 OK`
```json
{
  "message": "Appointment cancelled successfully"
}
```

**Access:** Patient (own), Doctor (assigned), Admin

---

## Admin

### Get System Statistics
**GET** `/admin/stats`

Retrieves system-wide statistics for dashboard.

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Response:** `200 OK`
```json
{
  "stats": {
    "total_patients": 150,
    "total_doctors": 12,
    "today_appointments": 8,
    "high_risk_patients": 23,
    "total_users": 165,
    "active_sessions": 15
  }
}
```

**Access:** Admin only

---

### List All Users
**GET** `/admin/users`

Retrieves all system users with optional role filter.

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Query Parameters:**
- `role` (optional): Filter by role (patient, doctor, admin)

**Response:** `200 OK`
```json
{
  "users": [
    {
      "id": 1,
      "username": "admin",
      "email": "admin@hospital.com",
      "role": "admin",
      "is_active": true,
      "created_at": "2025-01-01T00:00:00"
    }
  ]
}
```

**Access:** Admin only

---

### Create User
**POST** `/admin/users`

Creates new user with specified role (admin function).

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Request Body:**
```json
{
  "username": "new_doctor",
  "email": "newdoc@hospital.com",
  "password": "SecurePass123",
  "first_name": "Alice",
  "last_name": "Johnson",
  "role": "doctor",
  "specialization": "Cardiology"
}
```

**Response:** `201 Created`
```json
{
  "message": "User created successfully",
  "user": { /* new user object */ }
}
```

**Access:** Admin only

---

### Update User
**PUT** `/admin/users/<user_id>`

Updates user information or status.

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Request Body:**
```json
{
  "is_active": false,
  "email": "newemail@hospital.com"
}
```

**Response:** `200 OK`
```json
{
  "message": "User updated successfully"
}
```

**Access:** Admin only

---

## Analytics

### Get Risk Analytics
**GET** `/analytics/risk-distribution`

Retrieves patient distribution by risk level.

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Response:** `200 OK`
```json
{
  "risk_distribution": {
    "High": 23,
    "Medium": 67,
    "Low": 60
  },
  "total_patients": 150
}
```

**Access:** Doctor, Admin

---

### Get Demographics Analytics
**GET** `/analytics/demographics`

Retrieves patient demographics breakdown.

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Response:** `200 OK`
```json
{
  "age_groups": {
    "18-30": 15,
    "31-45": 45,
    "46-60": 60,
    "61+": 30
  },
  "gender_distribution": {
    "Male": 75,
    "Female": 70,
    "Other": 5
  },
  "smoking_status": {
    "never smoked": 80,
    "formerly smoked": 40,
    "smokes": 30
  }
}
```

**Access:** Doctor, Admin

---

## Security Logs

### Get Security Logs
**GET** `/security/logs`

Retrieves security event logs with filtering.

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Query Parameters:**
- `limit` (optional): Max logs to return (default: 100, max: 1000)
- `event_type` (optional): Filter by event type (login, failed_login, user_created, etc.)
- `user_id` (optional): Filter by specific user
- `severity` (optional): Filter by severity (info, warning, error, critical)
- `hours` (optional): Time window in hours (default: 168 = 7 days)
- `status` (optional): Filter by status (success, failure, warning, error)

**Response:** `200 OK`
```json
{
  "logs": [
    {
      "id": 1,
      "event_type": "login",
      "event_description": "User admin logged in successfully",
      "username": "admin",
      "user_role": "admin",
      "ip_address": "192.168.1.100",
      "status": "success",
      "severity": "info",
      "created_at": "2025-12-04T10:00:00"
    }
  ],
  "total": 1
}
```

**Access:** Admin only

---

### Get Failed Login Attempts
**GET** `/security/logs/failed-logins`

Retrieves failed login attempts for security monitoring.

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Query Parameters:**
- `username` (optional): Filter by username
- `hours` (optional): Time window (default: 24)
- `limit` (optional): Max results (default: 100)

**Response:** `200 OK`
```json
{
  "failed_logins": [ /* array of failed login logs */ ],
  "total": 5,
  "by_ip": {
    "192.168.1.100": 3,
    "203.0.113.42": 2
  },
  "suspicious_ips": ["203.0.113.42"]
}
```

**Access:** Admin only

---

### Get User Activity
**GET** `/security/logs/user-activity/<user_id>`

Retrieves activity logs for specific user.

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Query Parameters:**
- `limit` (optional): Max logs to return (default: 100)

**Response:** `200 OK`
```json
{
  "logs": [ /* array of activity logs */ ],
  "total": 25
}
```

**Access:** User (own logs), Admin (any user)

---

### Get Security Statistics
**GET** `/security/logs/stats`

Provides overview of security events for dashboard.

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Query Parameters:**
- `hours` (optional): Time window (default: 24)

**Response:** `200 OK`
```json
{
  "time_window_hours": 24,
  "total_events": 150,
  "events_by_type": {
    "login": 45,
    "logout": 40,
    "failed_login": 5,
    "user_created": 2
  },
  "events_by_severity": {
    "info": 140,
    "warning": 8,
    "error": 2
  },
  "failed_logins": 5,
  "suspicious_ips": ["203.0.113.42"],
  "suspicious_ip_count": 1,
  "critical_events": []
}
```

**Access:** Admin only

---

## Error Responses

All endpoints may return the following error responses:

### 400 Bad Request
```json
{
  "message": "Invalid request parameters",
  "errors": ["Field 'email' is required", "Age must be a positive number"]
}
```

### 401 Unauthorized
```json
{
  "message": "Token is missing or invalid"
}
```

### 403 Forbidden
```json
{
  "message": "Insufficient permissions"
}
```

### 404 Not Found
```json
{
  "message": "Resource not found"
}
```

### 409 Conflict
```json
{
  "message": "Username already exists"
}
```

### 500 Internal Server Error
```json
{
  "message": "Internal server error"
}
```

---

## Authentication Flow

1. **Register** or **Login** to receive JWT token
2. **Store token** securely (session storage in frontend)
3. **Include token** in `Authorization` header for all protected endpoints:
   ```
   Authorization: Bearer <your_jwt_token>
   ```
4. **Token expires** after 24 hours - user must login again

---

## Security Features

- **Password Hashing**: Bcrypt with salt
- **JWT Tokens**: 24-hour expiration
- **Input Validation**: All inputs sanitized and validated
- **Role-Based Access Control**: Enforced on all protected routes
- **Security Logging**: All authentication events logged
- **CSRF Protection**: Token-based (JWT)
- **SQL Injection Prevention**: Parameterized queries
- **XSS Prevention**: Input sanitization

---

## Database Architecture

### SQLite (Primary)
- **Users**: Authentication credentials, user profiles
- **Appointments**: Appointment scheduling data
- **Security Logs**: Audit trail of security events

### MongoDB (Optional - when `USE_MONGODB=true`)
- **Patients**: Patient medical records (flexible schema)
- **Medical History**: Timeline of patient medical events

This hybrid approach provides:
- **ACID transactions** for critical data (users, appointments)
- **Flexible schema** for evolving medical records
- **Scalability** for large patient datasets
- **Polyglot persistence** best practices

---

## Rate Limiting & Performance

**Current Implementation:**
- No rate limiting (recommended for production)
- SQLite connection pooling enabled
- MongoDB connection reuse
- JWT token validation cached

**Recommendations for Production:**
- Implement Flask-Limiter for rate limiting
- Add Redis caching for frequently accessed data
- Enable database query logging and optimization
- Configure proper CORS headers for production domains

---

## API Versioning

Current version: **v1** (implicit)

Future versions should use URL versioning:
- `/api/v1/patients`
- `/api/v2/patients`

---

## Support & Contact

For API support or bug reports:
- Email: support@strokecare.hospital
- GitHub Issues: https://github.com/CS-LTU/com7033-assignment-rafiuzzaman97/issues

---

**Last Updated**: December 4, 2025  
**API Version**: 1.0.0  
**Documentation Version**: 1.0
