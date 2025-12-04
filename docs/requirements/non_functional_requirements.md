# Non-Functional Requirements

This document outlines the quality attributes and constraints for the StrokeCare Portal.

NFR-001 — Security
- Use bcrypt for password hashing.
- Protect API endpoints with JWT.
- Ensure sensitive configuration (secrets, DB URIs) are provided via environment variables.
- Enforce role-based authorization checks server-side.

NFR-002 — Performance
- Backend API: average response time < 300ms for typical queries (single-record read/write) on development hardware.
- Frontend: initial page interactive time should be under 2 seconds on modern hardware.

NFR-003 — Scalability
- Design separation of services so patient storage can shift from SQLite to MongoDB for larger datasets.
- Avoid storing large binary data directly in DB; use object storage when necessary.

NFR-004 — Availability & Reliability
- Graceful error handling and clear error messages for API failures.
- Implement retry logic for transient operations (e.g., temporary Mongo disconnects) where appropriate.

NFR-005 — Maintainability
- Code must be modular with clear separation between API routes, services, models, and utilities.
- Add inline documentation and README sections for major modules.

NFR-006 — Testability
- Provide unit and integration tests for auth, patient CRUD, analytics logic, and core services.
- CI pipeline should run tests on push/PR.

NFR-007 — Usability
- Simple and consistent UI for doctors/admins/patients.
- Provide validation feedback on forms and consistent navigation for protected routes.

NFR-008 — Accessibility
- Follow WCAG 2.1 AA where practical: semantic HTML, keyboard navigation, and sufficient color contrast for critical UI elements.

NFR-009 — Privacy & Compliance
- Avoid logging sensitive personal health information (PHI) in plain-text logs.
- Consider GDPR-like controls (data export, removal) if this app holds personal data beyond test/demo usage.

NFR-010 — Monitoring & Observability
- Expose health endpoint(s) and basic metrics. Log errors and provide a strategy for collecting logs (file, stdout, or external aggregator).


Metrics and SLAs
- Target error rate < 1% for non-development environments.
- Track response time P95 and P99 for API endpoints.
