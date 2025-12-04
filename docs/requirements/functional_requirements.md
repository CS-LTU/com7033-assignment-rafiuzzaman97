# Functional Requirements

This document specifies the functional (feature-level) requirements for the StrokeCare Portal project. Each requirement includes a short description and acceptance criteria.

FR-001 — User Authentication
- Description: Users must be able to register (patients), log in, and receive a JWT for authenticated requests.
- Actors: Patient, Doctor, Admin
- Acceptance Criteria: POST `/api/auth/login` returns JWT and user role; session storage contains JWT after login; password is hashed with bcrypt.

FR-002 — Role-Based Access Control
- Description: The system must enforce roles (admin, doctor, patient) and protect routes and UI by role.
- Acceptance Criteria: Protected routes return 401/403 when accessed without appropriate role; UI hides admin/doctor controls for patients.

FR-003 — Patient Self-Registration
- Description: A public registration form allows a patient to create a user account and a patient record in the database.
- Acceptance Criteria: POST `/api/patients/self-register` creates `User` and patient record; validation errors return 400 with messages.

FR-004 — Patient Management (Doctor/Admin)
- Description: Doctors and admins can view, search, paginate, edit, and (admin only) delete patient records.
- Acceptance Criteria: GET `/api/doctors/patients` returns patients list; PUT `/api/patients/<id>` updates fields; DELETE `/api/patients/<id>` removed record for admin.

FR-005 — Appointments
- Description: Support creating, listing, and cancelling appointments between doctors and patients.
- Acceptance Criteria: Appointment endpoints exist, return correct statuses, and are visible in doctor/patient dashboards.

FR-006 — Analytics & Risk Prediction
- Description: Provide dashboard analytics (risk-factor breakdowns, progression chart, future risk predictions) for doctors and admins.
- Acceptance Criteria: Analytics endpoints return structured JSON used by frontend to render cards/charts; `analyzeFuturePredictions` returns stable structured output even with empty input.

FR-007 — Admin Dashboard
- Description: Admins can view system stats, recent activity, and manage users.
- Acceptance Criteria: Admin endpoints and UI pages return correct metrics and allow user role changes/deletions.

FR-008 — Data Import Scripts
- Description: Provide scripts to import bulk datasets (e.g., `scripts/import_stroke_data.py`) into the DB for demo/testing.
- Acceptance Criteria: Scripts validate CSV input, transform to model shape, and insert records with progress logs.

FR-009 — Audit Logging
- Description: The system must record key user actions (login, create/update/delete patient) for audit purposes.
- Acceptance Criteria: Audit entries exist in a persistent store with timestamp, actor ID, and action detail.

FR-010 — Input Validation and Sanitisation
- Description: All inputs must be validated and cleaned to prevent injection and inconsistent data.
- Acceptance Criteria: Invalid inputs return 4xx errors and no malformed data is stored.


> Note: Each functional requirement should be further refined into user stories and tasks for implementation and testing.
