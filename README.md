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

| Layer | Technology |
|---|---|
| Frontend | React 19, Vite, Tailwind CSS v4, Recharts, React Icons |
| Backend | Python 3.11+, FastAPI, SQLAlchemy ORM |
| AI | Google Gemini (gemini-3.1-flash-lite-preview) |
| Auth | Supabase Auth + profiles table |
| Database | SQLite (local) / PostgreSQL via Supabase (production) |
| Realtime | WebSocket (`/api/ws`) |

---

## Quick Start

### Backend

```bash
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

The backend auto-seeds rooms, staff, and cafeteria items on first run.

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173`

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
