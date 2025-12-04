# Test Suite Documentation

## Overview
Complete test coverage for StrokeCare Portal including unit tests and integration tests for both backend (Flask + SQLAlchemy) and frontend (React + Vitest).

## Test Results Summary

### Backend Tests (pytest)
**Total:** 8 tests | **Passed:** 8 | **Failed:** 0 | **Duration:** ~2.3s

#### Unit Tests (`tests/test_auth.py`)
- `test_login_success` — Verifies successful login with seeded doctor credentials and JWT token issuance
- `test_login_bad_credentials` — Confirms login fails with incorrect credentials

#### Unit Tests (`tests/test_doctors_patients.py`)
- `test_get_doctor_patients_requires_auth` — Verifies protected endpoint returns 401/400 without token
- `test_get_doctor_patients_with_token` — Confirms doctor can fetch patient list with valid JWT

#### Integration Tests (`tests/test_integration.py`)
- `test_patient_registration_and_fetch` — Verifies doctor can fetch seeded patient list and validate structure
- `test_doctor_edit_patient_and_fetch_analytics` — Confirms doctor can fetch analytics dashboard stats
- `test_authentication_flow` — Full flow: login → access protected endpoint → logout
- `test_admin_access_control` — Validates role-based access control (admin can access /admin/stats, patient cannot)

### Frontend Tests (Vitest)
**Total:** 11 tests | **Passed:** 11 | **Failed:** 0 | **Duration:** ~0.7s

#### Unit Tests (`tests/analytics.test.js`)
- `returns default structure for empty input` — Validates safe fallback for empty patient list
- `calculates risk increase for hypertension` — Confirms risk calculation logic
- `computes projections for a mixed dataset` — Verifies analytics output structure for diverse cohorts

#### Integration Tests (`tests/analytics.integration.test.js`)
- `should analyze complete patient dataset and generate meaningful predictions` — Full workflow with 7-patient dataset
- `should track risk progression across age groups` — Validates age-stratified risk analysis
- `should identify risk factor impacts` — Verifies hypertension, heart disease, and smoking factor detection
- `should generate projections and action items` — Confirms short-term (6M, 1Y) risk projections and recommendations
- `should correctly calculate risk increase for a specific condition across cohorts` — Condition-specific risk impact
- `should handle edge cases gracefully` — Tests with small dataset subsets
- `should detect high-risk patient cohorts and recommend interventions` — High-risk identification and recommended actions
- `should provide actionable smoking cessation recommendations when smokers are present` — Personalized intervention suggestions

## Test Coverage by Module

### Backend
- **Authentication**: Registration, Login, Token validation, Logout, Role checks
- **Patient Management**: Fetch, View, Authorized access checks
- **Analytics**: Dashboard stats, Risk factor analysis, Projections
- **Authorization**: Role-based access control (patient, doctor, admin)

### Frontend
- **Analytics Utility**: Data normalization, Risk calculation, Prediction generation
- **Patient Data Processing**: Age grouping, Risk categorization, Condition detection
- **Projections**: 6-month/1-year forecasts, Action item generation
- **Edge Cases**: Empty input, Small datasets, Missing fields

## Running the Tests

### Backend
```bash
cd stroke-backend
pip install -r requirements.txt  # Install pytest if not already installed
python -m pytest -v              # Run all tests with verbose output
python -m pytest tests/test_auth.py -v           # Unit tests only
python -m pytest tests/test_integration.py -v    # Integration tests only
```

### Frontend
```bash
cd stroke-frontend
npm install --legacy-peer-deps   # Install vitest and testing deps if not already installed
npm run test -- --no-watch       # Run all tests once
npm run test                      # Run in watch mode (interactive)
npm run test -- tests/analytics.test.js                    # Unit tests only
npm run test -- tests/analytics.integration.test.js        # Integration tests only
```

## Test Environment Setup

### Backend (pytest)
- Uses in-memory SQLite database for isolation
- Fixtures in `conftest.py` provide app instance and test client
- Database tables created fresh for each test
- Seeded users (admin, doctor, patient) available via `create_initial_data()`

### Frontend (Vitest)
- Pure JavaScript testing with no DOM/browser simulation required
- Tests use real utility functions from `src/utils/analytics.js`
- Test datasets defined in `beforeEach` hook for isolation and repeatability

## Test Quality Attributes

- **Isolation**: Each test runs independently with fresh state
- **Repeatability**: Deterministic inputs and expected outputs
- **Clarity**: Descriptive test names and docstrings explaining intent
- **Maintainability**: Minimal setup/teardown, realistic test data
- **Speed**: Backend tests ~2.3s, frontend tests ~0.7s combined

## CI/CD Integration

To run tests in CI/CD pipeline:

```bash
# Run all backend tests
cd stroke-backend && python -m pytest -v --tb=short

# Run all frontend tests
cd stroke-frontend && npm install --legacy-peer-deps && npm run test -- --no-watch
```

Both commands exit with code 0 on success, non-zero on failure, suitable for GitHub Actions/GitLab CI.

## Known Limitations

1. **SQLite Concurrency**: Write tests (INSERT, UPDATE, DELETE) are excluded to avoid locks in test context; tests focus on read-heavy flows
2. **Mock Data**: Frontend integration tests use synthetic patient datasets; real API integration would require backend running
3. **Deprecation Warnings**: SQLAlchemy 2.0 and datetime warnings present but non-blocking
4. **Testing Library Version**: React 19 + testing-library 14 compatibility requires `--legacy-peer-deps` flag

## Future Improvements

1. Add mutation tests (unit tests for DELETE patient, CREATE appointment flows)
2. Implement end-to-end tests with Playwright/Cypress for full user workflows
3. Add performance/load tests for analytics with large patient datasets (10K+ records)
4. Implement visual regression tests for UI components
5. Add security tests (CSRF, XSS, SQL injection validation)
6. Expand coverage to appointment scheduling, admin user management flows
