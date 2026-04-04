# Room404 Setup & Testing Guide (Supabase + Backend + Frontend)

This is the authoritative guide to run the full project locally and test **all roles** with real Supabase authentication.

## 1) What you need first

- Node.js 20+ and npm
- Python 3.11+
- A Supabase project
- A Gemini API key (backend startup requires it)

---

## 2) Create your Supabase project

1. Go to Supabase Dashboard and create/open your project.
2. Copy these values:
   - `SUPABASE_URL` (Project URL)
   - `SUPABASE_ANON_KEY` (publishable/anon key)
   - `SUPABASE_SERVICE_ROLE_KEY` (backend-only secret)
   - Database password (for `DATABASE_URL`)

---

## 3) Create testing sign-in accounts (Auth users)

In **Supabase → Authentication → Users**, create these users with email/password:

| Role | Email | Password |
|---|---|---|
| Manager | `manager.test@kuriftu.local` | `Kuriftu@12345` |
| Receptionist | `reception.test@kuriftu.local` | `Kuriftu@12345` |
| Cleaner | `cleaner.test@kuriftu.local` | `Kuriftu@12345` |
| Maintenance | `maintenance.test@kuriftu.local` | `Kuriftu@12345` |
| Cafeteria | `cafeteria.test@kuriftu.local` | `Kuriftu@12345` |
| Customer | `customer212@kuriftu.local` | `Kuriftu@12345` |

> You can use different passwords, but keep them documented for QA.

---

## 4) Configure database role/profile mapping

Run this in **Supabase SQL Editor**.

```sql
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text unique,
  full_name text,
  role text not null,
  room_number text,
  check_in_date date,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_profiles_role on public.profiles(role);

-- Optional safety trigger for updated_at
create or replace function public.set_profiles_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_profiles_updated_at on public.profiles;
create trigger trg_profiles_updated_at
before update on public.profiles
for each row execute procedure public.set_profiles_updated_at();

with seed(email, role, full_name, room_number, check_in_date) as (
  values
    ('manager.test@kuriftu.local',     'manager',     'Manager Test',     null,        null::date),
    ('reception.test@kuriftu.local',   'receptionist','Reception Test',   null,        null::date),
    ('cleaner.test@kuriftu.local',     'cleaner',     'Cleaner Test',     null,        null::date),
    ('maintenance.test@kuriftu.local', 'maintenance', 'Maintenance Test', null,        null::date),
    ('cafeteria.test@kuriftu.local',   'cafeteria',   'Cafeteria Test',   null,        null::date),
    ('customer212@kuriftu.local',      'customer',    'Customer 212',     '212',       current_date)
)
insert into public.profiles (id, email, role, full_name, room_number, check_in_date)
select u.id, s.email, s.role, s.full_name, s.room_number, s.check_in_date
from seed s
join auth.users u on lower(u.email) = lower(s.email)
on conflict (id) do update set
  email = excluded.email,
  role = excluded.role,
  full_name = excluded.full_name,
  room_number = excluded.room_number,
  check_in_date = excluded.check_in_date,
  updated_at = now();
```

---

## 5) Backend environment

Create `backend/.env` (or update it):

```env
GEMINI_API_KEY=YOUR_GEMINI_API_KEY
GEMINI_MODEL_NAME=gemini-3.1-flash-lite-preview

SUPABASE_PROJECT_REF=YOUR_PROJECT_REF
SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY=YOUR_SUPABASE_SERVICE_ROLE_KEY

DATABASE_URL=postgresql://postgres:YOUR_DB_PASSWORD@db.YOUR_PROJECT_REF.supabase.co:5432/postgres
CORS_ALLOWED_ORIGINS=http://localhost:5173

# Optional fallback for manager endpoints (no longer needed by manager UI when role headers are present)
MANAGER_DASHBOARD_KEY=manager-dev-key
```

---

## 6) Frontend environment

Create `frontend/.env`:

```env
VITE_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY=YOUR_SUPABASE_ANON_KEY
VITE_API_BASE_URL=http://127.0.0.1:8000
```

---

## 7) Run backend and frontend

### Backend
```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

App URL: `http://localhost:5173`

---

## 8) Sign-in test matrix

Use these logins on the login page and verify redirects:

| Email | Expected Role | Expected Route |
|---|---|---|
| `manager.test@kuriftu.local` | manager | `/manager` |
| `reception.test@kuriftu.local` | receptionist | `/reception` |
| `cleaner.test@kuriftu.local` | cleaner | `/cleaner` |
| `maintenance.test@kuriftu.local` | maintenance | `/maintenance` |
| `cafeteria.test@kuriftu.local` | cafeteria | `/cafeteria` |
| `customer212@kuriftu.local` | customer | `/customer` |

Password for all above: `Kuriftu@12345`

---

## 9) Customer page API/database coverage

Customer page is now backed by these endpoints:

- `POST /api/chat`
  - Creates/routs food/service requests into `routed_instructions` (and linked tasks when needed).
- `GET /api/menu?include_unavailable=false`
  - Reads menu from `food_availability`.
- `GET /api/customer/requests?room_number=<room>`
  - Reads request history for a room from `routed_instructions` + status from `task_feedback`.

Headers are auto-sent by frontend from auth context:

- `x-user-role`
- `x-user-email`

These are populated after Supabase sign-in from `AuthContext` (`localStorage` key: `room404.auth-context`).

---

## 10) Quick QA checklist

1. Login as customer (`customer212@kuriftu.local`).
2. Place food order in **Food Order**.
3. Submit quick request in **Guest Services**.
4. Open **Requests** and confirm both appear with status.
5. Login as cafeteria and complete food task.
6. Return to customer account and confirm status updates on refresh.
7. Verify manager/reception can still access analytics endpoints.

---

## 11) Troubleshooting

- **"Supabase credentials are missing" on login**
  - Verify `frontend/.env` keys and restart `npm run dev`.
- **Role not resolved / access denied**
  - Ensure `public.profiles` contains a row whose `id` matches `auth.users.id` and `role` is valid.
- **Backend fails at startup with Gemini error**
  - Set `GEMINI_API_KEY` in `backend/.env`.
- **Customer requests list empty**
  - Confirm `room_number` in customer profile and requests match.

---

## 12) Security note for real deployments

- Never commit real `SUPABASE_SERVICE_ROLE_KEY` or production DB passwords to git.
- Rotate keys immediately if they were ever committed.
- Keep service role key strictly backend-side.
