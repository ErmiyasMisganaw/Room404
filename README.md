# Room404 — Kuriftu Resort AI Hotel Management System

> Built for Kuriftu Resort · Hackathon Submission

An AI-powered hotel operations platform that transforms guest experience and staff efficiency through intelligent request routing, real-time task management, and a beautiful multi-role interface.

---

## What it does

**For Guests** — A luxury mobile-first portal with room service ordering, food delivery, concierge requests, and a live bill tracker. Guests interact naturally; the AI classifies and routes every request automatically.

**For Staff** — Role-specific dashboards for Reception, Housekeeping, Maintenance, and Cafeteria — each with live task queues, real-time WebSocket updates, and smart staff assignment.

**For Management** — A secure analytics dashboard showing 30-day KPIs, top food orders, staff performance, maintenance trends, and hotel occupancy — all gated behind a manager key.

---

## Tech Stack

<<<<<<< HEAD
- `GEMINI_API_KEY` (required for AI features) — API key for Google generative models.
- `GEMINI_MODEL_NAME` (optional) — model name to use (defaults to `gemini-3.1-flash-lite-preview`).
- `DATABASE_URL` (optional) — if set to a Postgres/Supabase URL the app will use that; otherwise it uses SQLite at `./room404.db`.
- `CORS_ALLOWED_ORIGINS` (optional) — comma-separated list of allowed origins for the frontend (default `*` for local dev).
- `STAFF_COOLDOWN_MINUTES` (optional) — cooldown window used during staff assignment (default `20`).
- `MANAGER_DASHBOARD_KEY` (recommended) — manager analytics override key for MVP role checks.

Important: do not commit API keys or secrets into the repository. Keep shared placeholders in `backend/.env.example`, and each developer should create a local untracked `backend/.env`.
=======
| Layer | Technology |
|---|---|
| Frontend | React 19, Vite, Tailwind CSS v4, Recharts, React Icons |
| Backend | Python 3.11+, FastAPI, SQLAlchemy ORM |
| AI | Google Gemini (gemini-3.1-flash-lite-preview) |
| Auth | Supabase Auth + profiles table |
| Database | SQLite (local) / PostgreSQL via Supabase (production) |
| Realtime | WebSocket (`/api/ws`) |

---
>>>>>>> a81e80afe40204bd795733950261ef402a861e1a

## Quick Start

### Backend

```bash
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
<<<<<<< HEAD
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
=======
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
>>>>>>> a81e80afe40204bd795733950261ef402a861e1a
```

The backend auto-seeds rooms, staff, and cafeteria items on first run.

### Frontend

```bash
cd frontend
npm install
npm run dev
```

<<<<<<< HEAD
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
=======
Open `http://localhost:5173`
>>>>>>> a81e80afe40204bd795733950261ef402a861e1a

---

## Login Credentials (Demo)

| Role | Username | Password |
|---|---|---|
| Guest | any name | any 4+ chars |
| Receptionist | `reception` | any 4+ chars |
| Cleaner | `cleaner1` | any 4+ chars |
| Maintenance | `maintenance1` | any 4+ chars |
| Cafeteria | `cafeteria1` | any 4+ chars |

> With Supabase configured, real accounts are used. Without it, the frontend uses simulated auth based on username prefix.

**Manager Analytics key:** `manager-dev-key`

---

## Environment Variables

### Backend (`backend/.env`)
```env
GEMINI_API_KEY=your_key_here
GEMINI_MODEL_NAME=gemini-3.1-flash-lite-preview
DATABASE_URL=                          # leave blank for SQLite
CORS_ALLOWED_ORIGINS=http://localhost:5173
MANAGER_DASHBOARD_KEY=manager-dev-key
```

### Frontend (`frontend/.env`)
```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY=your_supabase_key
```

---

## Key Features

- **AI Request Classification** — Gemini classifies every guest message into Food / Maintenance / Housekeeping / Manager and routes it to the right queue with staff instructions
- **Smart Staff Assignment** — Automatic round-robin assignment with cooldown periods
- **Real-time Updates** — WebSocket broadcasts task creation and status changes to all connected dashboards
- **Multi-role Dashboards** — Dedicated UIs for Guest, Reception, Cleaner, Maintenance, Cafeteria, Manager
- **Guest Portal** — Full-screen room photo hero, services carousel with real resort images, food ordering with cart, concierge chat, live bill
- **Manager Analytics** — 30-day KPI cards, bar/pie charts, staff leaderboard, occupancy gauge — all secured with manager key

---

## API Highlights

```bash
# Health check
GET /api/health

# AI guest chat
POST /api/chat
{"name":"Guest","room_number":"212","role":"customer","message":"I need extra towels"}

# Manager analytics (requires header)
GET /api/analytics/summary-30d
x-manager-key: manager-dev-key

# WebSocket
ws://localhost:8000/api/ws
```

---

## Project Structure

```
Room404/
├── backend/
│   ├── app/
│   │   ├── api/routes.py      # All API endpoints + AI agent
│   │   ├── core/config.py     # Environment config
│   │   ├── db/database.py     # SQLAlchemy setup
│   │   ├── models/models.py   # ORM models
│   │   ├── schemas/schemas.py # Pydantic schemas
│   │   ├── services/          # Staff assignment logic
│   │   └── main.py            # App factory + seeding
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── components/        # All dashboard components
│   │   ├── context/           # Auth context (Supabase)
│   │   ├── hooks/             # useWebSocket
│   │   └── services/api.js    # API client
│   └── package.json
└── Images/                    # Resort photography assets
```

---

*Kuriftu Resort & Spa · Room404 Team*
