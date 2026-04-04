# Room404 — Kuriftu Resort Hotel AI

A compact hotel operations prototype that pairs a FastAPI backend (with AI-powered request classification and task routing) with a React + Vite frontend. The backend includes a simple database-backed task system, cafeteria menu management, and a real-time WebSocket channel for UI updates. The project was developed as a demo for Kuriftu Resort-style hotel workflows.

## Key features

- AI-driven guest message classification and handling (uses a Gemini-compatible model)
- Automatic task creation and staff assignment (cleaning, maintenance, cafeteria)
- Cafeteria menu management and simple ordering flow
- Real-time updates via WebSocket (`/api/ws`)
- SQLite local default, pluggable to Postgres/Supabase via `DATABASE_URL`
- Seed data created on first run (rooms, staff, cafeteria items)

## Tech stack

- Backend: Python + FastAPI, SQLAlchemy ORM
- AI: Google Generative AI client (Gemini model via `google-generativeai`)
- ASGI server: Uvicorn
- Database: SQLite by default (`backend/room404.db`), supports Postgres via `DATABASE_URL`
- Frontend: React, Vite, TypeScript, Recharts, Supabase client (optional)

## Repository layout

- `backend/` — FastAPI app, database, models, and API routes
	- `backend/app/main.py` — application factory and lifespan (DB create + seeding)
	- `backend/app/api/routes.py` — main HTTP + WebSocket API surface
	- `backend/requirements.txt` — Python dependencies
	- `backend/room404.db` — default SQLite DB (created on first run)
- `frontend/` — React + Vite application and UI components

## Environment variables

>The app has reasonable defaults for local development, but you should set the following env vars in production or when you want to use external services.

- `GEMINI_API_KEY` (required for AI features) — API key for Google generative models.
- `GEMINI_MODEL_NAME` (optional) — model name to use (defaults to `gemini-3.1-flash-lite-preview`).
- `DATABASE_URL` (optional) — if set to a Postgres/Supabase URL the app will use that; otherwise it uses SQLite at `./room404.db`.
- `CORS_ALLOWED_ORIGINS` (optional) — comma-separated list of allowed origins for the frontend (default `*` for local dev).
- `STAFF_COOLDOWN_MINUTES` (optional) — cooldown window used during staff assignment (default `20`).
- `MANAGER_DASHBOARD_KEY` (recommended) — manager analytics override key for MVP role checks.

Important: do not commit API keys or secrets into the repository. Keep shared placeholders in `backend/.env.example`, and each developer should create a local untracked `backend/.env`.

## Quickstart — Backend (local)

1. Open a terminal and change into the backend directory:

```bash
cd backend
```

2. Create and activate a Python virtual environment, then install dependencies:

```bash
python -m venv .venv
source .venv/bin/activate   # zsh / bash
pip install -r requirements.txt
```

3. Create your local environment file and fill in real values:

```bash
cp .env.example .env
```

Then edit `.env` with at least:

```bash
GEMINI_API_KEY=<your-gemini-key>
DATABASE_URL=sqlite:///./room404.db
CORS_ALLOWED_ORIGINS=http://localhost:5173
```

4. Run the backend with hot reload (development):

```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000 --env-file .env
```

On first start the app will create database tables and insert seed data (rooms, staff members, and cafeteria items). The backend exposes an app root and API router under `/api`.

## Quickstart — Frontend (local)

1. Change into the frontend directory and install dependencies:

```bash
cd frontend
npm install
```

2. Start the dev server:

```bash
npm run dev
```

The frontend expects the backend to be available at the same host/port defaults used above. If you need to change CORS or ports, update `CORS_ALLOWED_ORIGINS` or your local Vite proxy settings.

For frontend env overrides, use `frontend/.env.example` as a template and set:

- `VITE_API_BASE_URL`
- `VITE_WS_URL`

## Important endpoints

- Health: GET `/api/health`
- Chat / AI agent: POST `/api/chat` — JSON body must follow the `ChatRequest` schema (fields: `name`, `message`, `room_number`, `role`, optional `user_id`).
- Tasks list: GET `/api/tasks`
- Dispatch (create routed instruction): POST `/api/dispatch`
- WebSocket (real-time updates): connect to `ws://<host>:<port>/api/ws` (the router is mounted under `/api`)

Example `curl` (chat):

```bash
curl -X POST http://localhost:8000/api/chat \
	-H "Content-Type: application/json" \
	-d '{"name":"Test Guest","room_number":"101","role":"guest","message":"Please send extra towels."}'
```

Example `curl` (health):

```bash
curl http://localhost:8000/api/health
```

## Data model and behavior notes

- The app uses SQLAlchemy models declared in `backend/app/models` and will create tables automatically at startup.
- `backend/app/main.py` seeds initial data when the DB is empty. Look for `_seed_rooms`, `_seed_food_availability`, and `_seed_staff_members`.
- `backend/app/db/database.py` detects SQLite vs other backends and will attempt lightweight additive schema migrations on startup.

## Development tips

- If you want to use a managed DB (Postgres / Supabase) in development, set `DATABASE_URL` to the connection string and restart the backend. Ensure the DB user has permission to create tables, or run migrations using your preferred tool.
- The AI classification relies on the Gemini model. During development you can stub or mock calls to `google.generativeai` if you want to work without an API key.
- The frontend contains a `useWebSocket` hook that opens a connection against `/api/ws` and listens for `new_task` and `task_updated` events.

## Contract (quick)

- Input: guest messages via `POST /api/chat` (JSON `ChatRequest`).
- Output: `AgentResponseEnvelope` (encloses message, data and meta).
- Error modes: API returns HTTP 400/422 for validation errors and HTTP 500 for AI/backend errors.

## Deployment (Recommended)

- Frontend: Vercel (root `frontend`, build `npm run build`, output `dist`)
- Backend: Render Web Service (root `backend`)
- Database: Supabase Postgres (`DATABASE_URL`)

Render backend settings:

- Build command: `pip install -r requirements.txt`
- Start command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
- Health check path: `/api/health`

Set backend env vars on Render:

- `GEMINI_API_KEY`
- `GEMINI_MODEL_NAME`
- `DATABASE_URL`
- `CORS_ALLOWED_ORIGINS`
- `STAFF_COOLDOWN_MINUTES`
- `MANAGER_DASHBOARD_KEY`

Set frontend env vars on Vercel:

- `VITE_API_BASE_URL=https://<your-backend>.onrender.com`
- `VITE_WS_URL=wss://<your-backend>.onrender.com/api/ws`

## Next steps / ideas

- Add CI to run linting and typechecks for the frontend and backend.
- Add end-to-end tests that cover the chat → task creation flow.
- Provide a small admin UI to manage staff pools and manually reassign tasks.

---

If you'd like, I can:

- commit this README into the repository (I can write it to `README.md` now),
- create a small `.env.example` and a `Makefile` to simplify the dev workflow, or
- add a minimal smoke test script that hits `/api/health` and `/api/chat` to verify the environment.

Tell me which of those you'd like me to do next.

