# StrokeCare Portal (Flask + React)

Secure web app to manage and analyse stroke risk data. Flask API (SQLite by default, optional MongoDB for patients) + React/Tailwind frontend with role-based dashboards (admin/doctor/patient), JWT auth, and patient self-registration.

## Features
- JWT authentication with bcrypt-hashed passwords
- Role-based access (admin/doctor/patient) and protected routes
- Patient self-registration creates both `users` (credentials) + patient record
- CRUD for patients (view/edit/delete from doctor/admin dashboards)
- Optional MongoDB storage for patient records (`USE_MONGODB=true`)
- Pagination, risk badges, and analytics hooks
- Input validation and sanitisation on all patient fields

## Architecture
- **Backend**: Flask, SQLAlchemy, JWT, Bcrypt
- **Databases**: SQLite (default, users/auth), MongoDB optional for patients/medical history
- **Frontend**: React (Vite), Tailwind CSS, Framer Motion

## Prerequisites
- Python 3.10+ and Node 18+
- MongoDB running locally if `USE_MONGODB=true`

## Backend Setup
```bash
cd stroke-backend
python -m venv .venv
.\.venv\Scripts\activate   # or source .venv/bin/activate
pip install -r requirements.txt
```

Create `stroke-backend/.env`:
```
SECRET_KEY=change-me
JWT_SECRET_KEY=change-me-too
DATABASE_URL=sqlite:///instance/stroke_care.db
USE_MONGODB=false
MONGO_URI=mongodb://localhost:27017/
MONGO_DB_NAME=stroke_care
```

Run backend:
```bash
python run.py
```

## Frontend Setup
```bash
cd stroke-frontend
npm install
npm run dev
# open http://localhost:5173
```

## Seeding Users (admin/doctor/patient)
In a Flask shell:
```python
from app import create_app
from app.models.user import User, db
app = create_app()
app.app_context().push()

def add_user(username, email, role, pwd, first='First', last='Last'):
    u = User(username=username, email=email, role=role, first_name=first, last_name=last, is_active=True)
    u.set_password(pwd)
    db.session.add(u)
    db.session.commit()

add_user('admin', 'admin@example.com', 'admin', 'admin123')
add_user('doctor', 'doctor@example.com', 'doctor', 'doctor123')
add_user('patient', 'patient@example.com', 'patient', 'patient123')
```

## Key Backend Endpoints
- `POST /api/auth/login` – JWT login
- `POST /api/patients/self-register` – public: creates user (role patient) + patient record
- `GET /api/patients` – list patients (doctor/admin)
- `PUT /api/patients/<id>` – update patient (doctor/admin)
- `DELETE /api/patients/<id>` – delete patient (admin)
- `GET /api/admin/stats` – admin stats

## Frontend Flows
- **Login**: stores JWT in session storage; guards routes by role.
- **Patient self-registration**: collects credentials + clinical data, calls `/patients/self-register`.
- **Doctor dashboard**: fetches patients, supports view, inline edit, delete, pagination, risk badges.
- **Admin dashboard**: system stats and recent user activity.

## Security Practices
- Bcrypt password hashing; JWT for protected routes
- Input validation/sanitisation; numeric coercion for clinical fields
- Role checks via `token_required` + `role_required`
- Username whitespace/invalid-char guard on auth
- Recommendation: add CSRF tokens for forms (Flask-WTF or manual token)

## Switching to Mongo for Patients
1) Ensure Mongo is running.  
2) Set `USE_MONGODB=true` in `stroke-backend/.env`.  
3) Restart Flask. Patient CRUD now uses MongoDB (`stroke_care` database) while users/auth stay in SQLite.

## Testing
Add and run tests from `stroke-backend`:
```bash
pytest
```
Include unit/integration tests for auth, patient create/update/delete, and role guards to satisfy assessment criteria.

## Troubleshooting
- **SQLite locked**: stop all processes using the DB, remove `*.db-journal`/`*.db-wal`, restart Flask.
- **Mongo not used**: confirm `USE_MONGODB=true` and Mongo is reachable.
- **Login fails with 500**: clear DB lock; ensure seeded users exist.

## AI Usage Disclosure (per assessment brief)
Include one of:
- “This assignment used generative AI for: brainstorming, research, planning, feedback, editing.”
- or “This assignment did not use generative AI for the purposes of completing the assignment.”

## Additional Documentation

- **Requirements documents:**
    - `docs/requirements/functional_requirements.md`
    - `docs/requirements/non_functional_requirements.md`
    - `docs/requirements/system_requirements.md`

See the files above for detailed feature, quality, and system setup requirements.
