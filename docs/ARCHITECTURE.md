# StrokeCare Portal - Architecture & Design Rationale

## Table of Contents
1. [System Overview](#system-overview)
2. [Architecture Decisions](#architecture-decisions)
3. [Technology Stack Rationale](#technology-stack-rationale)
4. [Database Design](#database-design)
5. [Security Architecture](#security-architecture)
6. [Design Patterns](#design-patterns)
7. [Scalability Considerations](#scalability-considerations)
8. [Future Enhancements](#future-enhancements)

---

## System Overview

### Project Goal
Build a secure, scalable web application for managing stroke risk assessment and patient care coordination between healthcare providers and patients.

### Core Requirements
- **Multi-role access**: Admin, Doctor, Patient with distinct capabilities
- **Secure authentication**: Industry-standard security practices
- **Data management**: CRUD operations on patient medical records
- **Risk assessment**: Automated stroke risk calculation
- **Audit trail**: Comprehensive security logging

---

## Architecture Decisions

### 1. **Client-Server Architecture**

**Decision**: Separated frontend (React SPA) and backend (Flask REST API)

**Rationale**:
- ✅ **Separation of Concerns**: UI logic independent of business logic
- ✅ **Technology Flexibility**: Can swap frontend/backend independently
- ✅ **Scalability**: Backend can serve multiple clients (web, mobile, API consumers)
- ✅ **Development Efficiency**: Frontend and backend teams can work in parallel
- ✅ **Testability**: API endpoints easily testable with automated tools

**Alternatives Considered**:
- ❌ **Monolithic Flask + Jinja2**: Less flexible, harder to scale UI
- ❌ **Server-Side Rendering (SSR)**: Adds complexity, not needed for dashboard app

---

### 2. **RESTful API Design**

**Decision**: REST architecture with resource-based URLs and HTTP verbs

**Rationale**:
- ✅ **Industry Standard**: Well-understood by developers
- ✅ **Stateless**: Each request contains all necessary information
- ✅ **Cacheable**: HTTP caching can be leveraged
- ✅ **Uniform Interface**: Predictable endpoint patterns

**Endpoint Design Pattern**:
```
GET    /api/patients         → List patients
POST   /api/patients         → Create patient
GET    /api/patients/:id     → Get specific patient
PUT    /api/patients/:id     → Update patient
DELETE /api/patients/:id     → Delete patient
```

**Alternatives Considered**:
- ❌ **GraphQL**: Overkill for straightforward CRUD operations
- ❌ **RPC-style**: Less intuitive than resource-based REST

---

### 3. **Hybrid Database Architecture (Polyglot Persistence)**

**Decision**: SQLite for structured data + MongoDB for flexible patient records

**Rationale**:

#### **SQLite for Users & Appointments**
- ✅ **ACID Transactions**: Critical for authentication and scheduling
- ✅ **No Double-Booking**: Transaction locks prevent appointment conflicts
- ✅ **Referential Integrity**: Foreign keys ensure data consistency
- ✅ **Simplicity**: No separate database server needed
- ✅ **Lightweight**: Perfect for moderate traffic healthcare app

#### **MongoDB for Patient Medical Records**
- ✅ **Flexible Schema**: Medical data fields can evolve over time
- ✅ **Document Model**: Patient record naturally maps to JSON document
- ✅ **Nested Data**: Can store medical history timeline in one document
- ✅ **Scalability**: Easy to shard for millions of patient records
- ✅ **Performance**: Fast reads/writes for patient dashboards

**Data Distribution**:
```
SQLite:
- users (id, username, password_hash, email, role)
- appointments (id, patient_id, doctor_id, date, status)
- security_logs (id, event_type, username, ip_address, timestamp)

MongoDB:
- patients {id, name, age, medical_data, risk_score, history[]}
- medical_history {patient_id, events[], timeline}
```

**Alternatives Considered**:
- ❌ **Single SQLite**: Less flexible for evolving medical schemas
- ❌ **Single MongoDB**: ACID guarantees harder for appointments
- ❌ **PostgreSQL only**: More complex setup, overkill for project scale

---

### 4. **JWT-Based Authentication**

**Decision**: JSON Web Tokens with Bearer authentication scheme

**Rationale**:
- ✅ **Stateless**: No server-side session storage needed
- ✅ **Scalable**: Works across multiple backend servers (future)
- ✅ **Self-Contained**: Token carries user ID and role claims
- ✅ **Industry Standard**: Widely supported by libraries
- ✅ **Mobile-Friendly**: Easy to use in future mobile apps

**Token Structure**:
```json
{
  "user_id": 5,
  "username": "dr_smith",
  "role": "doctor",
  "exp": 1733328000
}
```

**Security Measures**:
- 24-hour token expiration
- Secret key for signature verification
- HTTPS required in production
- Token validation on every request

**Alternatives Considered**:
- ❌ **Session Cookies**: Requires server-side storage, doesn't scale well
- ❌ **OAuth 2.0**: Too complex for single-organization app
- ❌ **Basic Auth**: Less secure, no expiration mechanism

---

### 5. **Role-Based Access Control (RBAC)**

**Decision**: Three-tier role system with decorator-based enforcement

**Roles**:
1. **Patient**: View own records, book appointments, self-register
2. **Doctor**: View assigned patients, update medical records, manage appointments
3. **Admin**: Full system access, user management, security monitoring

**Implementation**:
```python
@app.route('/admin/stats')
@token_required
@admin_required
def get_stats(current_user):
    # Only admins can access
```

**Rationale**:
- ✅ **Principle of Least Privilege**: Users only see what they need
- ✅ **Healthcare Compliance**: HIPAA requires access controls
- ✅ **Maintainable**: Easy to add new roles or permissions
- ✅ **Decorator Pattern**: Clean, reusable authorization logic

---

## Technology Stack Rationale

### Backend: **Flask** (Python 3.10+)

**Why Flask?**
- ✅ **Lightweight**: Minimal boilerplate, fast to set up
- ✅ **Flexible**: Not opinionated, we control architecture
- ✅ **Ecosystem**: SQLAlchemy, PyMongo, JWT extensions readily available
- ✅ **Pythonic**: Clean, readable code for healthcare domain logic
- ✅ **Micro-framework**: Start small, add features as needed

**Alternatives Considered**:
- ❌ **Django**: Too heavyweight, includes features we don't need (built-in admin, ORM restrictions)
- ❌ **FastAPI**: Excellent but async not needed for our use case
- ❌ **Node.js/Express**: Team expertise in Python

---

### Frontend: **React 19** + **Vite**

**Why React?**
- ✅ **Component-Based**: Reusable UI components (StatCard, Modal, etc.)
- ✅ **Declarative**: Easy to reason about UI state
- ✅ **Ecosystem**: Massive library of components and tools
- ✅ **Performance**: Virtual DOM efficient for dynamic dashboards
- ✅ **Industry Standard**: Most widely used modern frontend framework

**Why Vite?**
- ✅ **Fast**: Lightning-fast HMR (Hot Module Replacement)
- ✅ **Modern**: ES modules, optimized builds
- ✅ **Simple Config**: Less boilerplate than Webpack

**Alternatives Considered**:
- ❌ **Vue.js**: Less mature ecosystem for healthcare components
- ❌ **Angular**: Too heavyweight, steep learning curve
- ❌ **jQuery + templates**: Not suitable for complex SPAs

---

### Styling: **Tailwind CSS**

**Why Tailwind?**
- ✅ **Utility-First**: Rapid prototyping without writing custom CSS
- ✅ **Consistent Design**: Built-in design system (spacing, colors)
- ✅ **Dark Mode**: Easy theme switching for user preference
- ✅ **Responsive**: Mobile-first breakpoints built-in
- ✅ **Performance**: Purges unused CSS in production

**Alternatives Considered**:
- ❌ **Bootstrap**: Less flexible, harder to customize
- ❌ **Material-UI**: Opinionated design, larger bundle size
- ❌ **Custom CSS**: Time-consuming, inconsistent

---

### Animation: **Framer Motion**

**Why Framer Motion?**
- ✅ **Declarative Animations**: Easy-to-read animation code
- ✅ **Performance**: Hardware-accelerated, smooth 60fps
- ✅ **Gesture Support**: Touch-friendly interactions
- ✅ **Exit Animations**: Animate components on unmount

**Use Cases**:
- Modal fade-in/fade-out
- Card hover effects
- Page transitions
- Loading states

---

## Database Design

### Entity Relationship Diagram

```
SQLite:
┌─────────────────┐       ┌──────────────────┐
│     users       │       │   appointments   │
├─────────────────┤       ├──────────────────┤
│ id (PK)         │       │ id (PK)          │
│ username        │◄──────┤ patient_id (FK)  │
│ password_hash   │       │ doctor_id (FK)   │
│ email           │       │ date             │
│ role            │       │ time             │
│ first_name      │       │ status           │
│ last_name       │       └──────────────────┘
│ is_active       │
│ created_at      │       ┌──────────────────┐
└─────────────────┘       │  security_logs   │
                          ├──────────────────┤
                          │ id (PK)          │
                          │ event_type       │
                          │ user_id          │
                          │ username         │
                          │ ip_address       │
                          │ timestamp        │
                          │ severity         │
                          └──────────────────┘

MongoDB:
┌─────────────────────────┐
│       patients          │
├─────────────────────────┤
│ _id (ObjectId)          │
│ user_id (ref users.id)  │
│ first_name              │
│ last_name               │
│ age                     │
│ gender                  │
│ medical_data {          │
│   hypertension          │
│   heart_disease         │
│   avg_glucose_level     │
│   bmi                   │
│   smoking_status        │
│ }                       │
│ stroke_risk (computed)  │
│ risk_level              │
│ assigned_doctor_id      │
│ created_at              │
│ updated_at              │
└─────────────────────────┘
```

### Key Design Decisions

#### **1. No Foreign Key in security_logs.user_id**
**Rationale**: Logs must persist even if user is deleted (audit requirement)

#### **2. Password stored as hash**
**Rationale**: Bcrypt with salt, impossible to reverse-engineer

#### **3. Appointments in SQLite, not MongoDB**
**Rationale**: Need ACID transactions to prevent double-booking

#### **4. Computed stroke_risk field**
**Rationale**: Pre-calculate for fast dashboard queries, update on medical data change

---

## Security Architecture

### Defense-in-Depth Strategy

#### **Layer 1: Input Validation**
```python
def sanitize_input(input_string):
    # Remove leading/trailing whitespace
    # Escape HTML characters
    # Validate against expected format
```
**Prevents**: XSS, SQL injection, command injection

#### **Layer 2: Authentication**
```python
@token_required
def protected_route(current_user):
    # Verify JWT signature
    # Check token expiration
    # Load current user from database
```
**Prevents**: Unauthorized access

#### **Layer 3: Authorization**
```python
@admin_required
def admin_only_route(current_user):
    # Verify user role = admin
```
**Prevents**: Privilege escalation

#### **Layer 4: Encryption**
- **Passwords**: Bcrypt hashing (cost factor 12)
- **Tokens**: HMAC-SHA256 signature
- **Transport**: HTTPS in production (recommended)

#### **Layer 5: Audit Logging**
```python
SecurityLog.log_event(
    event_type='login',
    username=user.username,
    ip_address=request.remote_addr,
    status='success'
)
```
**Enables**: Forensics, compliance, intrusion detection

### Security Event Types Logged
- ✅ Successful logins
- ✅ Failed login attempts
- ✅ User account creation
- ✅ Patient record access
- ✅ Patient record modifications
- ✅ Appointment booking/cancellation
- ✅ Password changes
- ✅ Role changes

---

## Design Patterns

### 1. **Blueprint Pattern** (Flask)
```
app/
├── routes/
│   ├── auth.py        → auth_bp
│   ├── patients.py    → patients_bp
│   ├── doctors.py     → doctors_bp
│   └── admin.py       → admin_bp
```
**Benefits**: Modular code, easy testing, team collaboration

### 2. **Repository Pattern** (Database Abstraction)
```python
class PatientRecord:
    def __init__(self):
        if Config.USE_MONGODB:
            self.repo = PatientRecordMongo()
        else:
            self.repo = PatientSQLite()
    
    def create_patient(self, data):
        return self.repo.create(data)
```
**Benefits**: Swap database without changing business logic

### 3. **Decorator Pattern** (Authorization)
```python
@token_required
@admin_required
def protected_route(current_user):
    pass
```
**Benefits**: Reusable, composable, clean separation

### 4. **Factory Pattern** (App Creation)
```python
def create_app():
    app = Flask(__name__)
    # Configure
    # Register blueprints
    # Initialize extensions
    return app
```
**Benefits**: Testable, multiple environments (dev/test/prod)

### 5. **Strategy Pattern** (Risk Calculation)
```python
def calculate_stroke_risk(patient_data):
    # Age strategy
    risk += age_risk_factor(patient_data['age'])
    # Glucose strategy
    risk += glucose_risk_factor(patient_data['glucose'])
    # ... more strategies
    return risk
```
**Benefits**: Easy to adjust risk algorithm

---

## Scalability Considerations

### Current Architecture Limitations
- **SQLite**: Single-process writes (fine for <10K users)
- **No Caching**: Every request hits database
- **No Load Balancing**: Single Flask process

### Path to Scale (100K+ users)

#### **Database**
1. **Migrate SQLite → PostgreSQL** for multi-process writes
2. **MongoDB Sharding** for patient records across regions
3. **Read Replicas** for reporting queries

#### **Application**
1. **Horizontal Scaling**: Multiple Flask instances behind load balancer
2. **Redis Caching**: Cache user sessions, frequent queries
3. **Celery Task Queue**: Async processing for risk calculations, reports

#### **Infrastructure**
```
[Load Balancer]
       ↓
[Flask 1] [Flask 2] [Flask 3]
       ↓         ↓         ↓
[PostgreSQL Primary] ← [Replicas]
       ↓
[MongoDB Cluster] (Sharded)
       ↓
[Redis Cache]
```

---

## Future Enhancements

### Short-Term (3-6 months)
1. **Email Notifications**: Appointment reminders, risk alerts
2. **File Uploads**: Medical documents, test results
3. **Real-time Chat**: Doctor-patient messaging
4. **Mobile App**: React Native version
5. **Reporting**: PDF export of patient history

### Medium-Term (6-12 months)
1. **Machine Learning**: Improved risk prediction models
2. **Telemedicine**: Video consultation integration
3. **EHR Integration**: HL7 FHIR API for existing health records
4. **Multi-language**: i18n support for international deployment
5. **Advanced Analytics**: Tableau/PowerBI dashboards

### Long-Term (12+ months)
1. **Multi-tenant**: Support multiple hospitals/clinics
2. **FHIR Compliance**: Full interoperability standard
3. **AI Assistant**: Chatbot for patient questions
4. **Wearable Integration**: Sync with Fitbit, Apple Health
5. **Blockchain**: Immutable audit trail for compliance

---

## Performance Optimization

### Current Optimizations
- ✅ **SQLite WAL Mode**: Concurrent reads during writes
- ✅ **Database Indexing**: Indexed user lookups, appointment queries
- ✅ **Connection Pooling**: Reuse database connections
- ✅ **React Memoization**: Prevent unnecessary re-renders
- ✅ **Code Splitting**: Lazy load routes with React.lazy()

### Monitoring & Metrics (Recommended)
- Request latency (p50, p95, p99)
- Database query times
- API error rates
- Active user sessions
- Memory/CPU usage

---

## Compliance & Standards

### Healthcare Standards
- **HIPAA-Ready**: Audit logs, access controls, encryption foundations
- **GDPR-Compliant**: User data deletion capability, consent tracking
- **ISO 27001**: Security event logging, incident response preparation

### Software Engineering Standards
- **RESTful API Best Practices**: Resource-based URLs, HTTP verbs, status codes
- **PEP 8**: Python code style
- **ESLint**: JavaScript code quality
- **Semantic Versioning**: API versioning strategy

---

## Testing Strategy

### Test Pyramid

```
         /\
        /E2E\        ← Integration tests (API flows)
       /______\
      /        \     ← Unit tests (business logic)
     /  Unit    \
    /____________\
```

### Test Coverage Goals
- **Backend**: 80%+ code coverage
- **Frontend**: 70%+ component coverage
- **Critical Paths**: 100% (auth, patient creation, appointments)

### Test Types
1. **Unit Tests**: Individual functions, risk calculation
2. **Integration Tests**: API endpoint flows, database operations
3. **Security Tests**: Input validation, authorization checks
4. **Performance Tests**: Load testing, stress testing

---

## Deployment Architecture

### Development
```
Local:
- Flask dev server (port 5000)
- Vite dev server (port 5173)
- SQLite file database
- MongoDB local instance
```

### Production (Recommended)
```
Cloud:
- Gunicorn/uWSGI (Flask)
- Nginx (static files, reverse proxy)
- PostgreSQL (managed service)
- MongoDB Atlas (managed)
- Redis (managed cache)
- SSL/TLS certificates (Let's Encrypt)
```

---

## Lessons Learned

### What Worked Well
✅ **Hybrid Database**: Right tool for each data type  
✅ **JWT Authentication**: Stateless, scalable, standard  
✅ **React Components**: Reusable UI, fast development  
✅ **API-First Design**: Easy to test, flexible clients  

### What Could Be Improved
⚠️ **More Automated Tests**: Need E2E test suite  
⚠️ **CI/CD Pipeline**: Automate testing and deployment  
⚠️ **Performance Monitoring**: Add APM tool  
⚠️ **Error Tracking**: Integrate Sentry or similar  

---

## Conclusion

The StrokeCare Portal demonstrates professional software engineering practices:

1. **Modular Architecture**: Clean separation of concerns
2. **Security-First**: Multiple layers of protection
3. **Scalable Design**: Ready to grow with user base
4. **Industry Standards**: REST, JWT, RBAC, polyglot persistence
5. **Maintainable Code**: Comments, tests, documentation

This architecture balances **simplicity** (appropriate for a university project) with **professional quality** (production-ready patterns and security).

---

**Document Version**: 1.0  
**Last Updated**: December 4, 2025  
**Authors**: Development Team  
**Status**: Living Document
