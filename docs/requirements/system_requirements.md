# System Requirements

This file lists the system and environment requirements for running and developing the StrokeCare Portal.

Supported Platforms
- Development: Windows 10/11, macOS 12+, Ubuntu 20.04+
- Production: Linux x86_64 recommended for server deployment

Software
- Python: 3.10+ (3.11 recommended)
- Node.js: 18.x or newer
- npm or yarn for frontend dependency management
- SQLite (bundled) for default user/auth store
- Optional: MongoDB 5.x+ if `USE_MONGODB=true`

Hardware (development)
- CPU: dual-core or better
- RAM: 4GB minimum; 8GB recommended when running both frontend and backend locally
- Disk: 1GB free for project files + dataset

Ports and Endpoints
- Backend: default Flask port `5000` (configurable via `FLASK_RUN_PORT`/env or `run.py`)
- Frontend: Vite dev server default `5173` (or `5174` depending on your environment)

Environment Variables (minimum)
- `SECRET_KEY` — Flask secret
- `JWT_SECRET_KEY` — JWT signing secret
- `DATABASE_URL` — e.g., `sqlite:///instance/stroke_care.db`
- `USE_MONGODB` — `true` or `false`
- `MONGO_URI` — connection string for MongoDB
- `MONGO_DB_NAME` — database name when using Mongo

Setup Commands (quick)
Backend
```powershell
cd stroke-backend
python -m venv .venv
.\.venv\Scripts\activate
pip install -r requirements.txt
python run.py
```
Frontend
```powershell
cd stroke-frontend
npm install
npm run dev
```

Build / Deployment
- Frontend production build: `npm run build` (serves static assets from `dist/`)
- Backend: run under a production WSGI server (gunicorn/uvicorn) behind a reverse proxy (nginx).

Database and Data
- Default SQLite DB: `stroke-backend/instance/stroke_care.db`
- If using MongoDB: DB name controlled by `MONGO_DB_NAME`.
- Avoid committing DB files to source control; add `instance/*.db` to `.gitignore`.

Diagnostics
- Backend logs should be written to stdout in development; configure structured logging for production.
- Health check endpoint (e.g., `/health`) is recommended for load balancers and monitoring.

Backup and Persistence
- For production, schedule regular DB backups or use managed DB services.

Notes
- For large datasets or production workloads, move patients to MongoDB and use a dedicated DB instance with proper indexes on search fields.
- Consider containerising the app with Docker for easier deployment and reproducible environments.
